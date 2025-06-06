// Variables globales
let currentPrepromptId = null;
let isLoggedIn = false;
let chatHistory = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Vérifier l'authentification
    const isAuthenticated = await checkAuthentication();
    
    if (isAuthenticated) {
        showMainApp();
        await initializeMainApp();
    } else {
        showLoginPage();
    }
    
    setupEventListeners();
}

async function checkAuthentication() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        return data.authenticated;
    } catch (error) {
        console.error('Erreur lors de la vérification d\'authentification:', error);
        return false;
    }
}

function showLoginPage() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    isLoggedIn = false;
}

function showMainApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    isLoggedIn = true;
}

async function initializeMainApp() {
    await loadPreprompts();
    await loadModelParams();
    updateStatusIndicator('connected');
    
    // Initialiser le gestionnaire de modèles APRÈS la connexion
    if (window.initializeModelsManager) {
        window.initializeModelsManager();
    }
}

function setupEventListeners() {
    // Connexion
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Déconnexion
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Chat
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    document.getElementById('message-input').addEventListener('input', handleInputChange);
    document.getElementById('clear-chat-btn').addEventListener('click', clearChat);
    
    // Preprompts
    document.getElementById('add-preprompt-btn').addEventListener('click', showAddPrepromptModal);
    document.getElementById('edit-preprompt-btn').addEventListener('click', editPreprompt);
    document.getElementById('delete-preprompt-btn').addEventListener('click', deletePreprompt);
    document.getElementById('preprompt-select').addEventListener('change', handlePrepromptChange);
    
    // Modal
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.cancel-btn').addEventListener('click', closeModal);
    document.getElementById('preprompt-form').addEventListener('submit', savePreprompt);
    
    // Paramètres modèle
    document.getElementById('toggle-params-btn').addEventListener('click', toggleParams);
    document.getElementById('save-params-btn').addEventListener('click', saveModelParams);
    document.getElementById('reset-params-btn').addEventListener('click', resetModelParams);
    
    // Sliders des paramètres
    const sliders = ['temperature', 'max-tokens', 'context-size', 'top-p'];
    sliders.forEach(param => {
        const slider = document.getElementById(param);
        const valueSpan = document.getElementById(param + '-value');
        slider.addEventListener('input', function() {
            valueSpan.textContent = this.value;
        });
    });
}

// Fonctions de connexion
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');
    
    // UI de chargement
    loginBtn.disabled = true;
    document.querySelector('.btn-text').style.display = 'none';
    document.querySelector('.btn-spinner').style.display = 'inline-block';
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMainApp();
            await initializeMainApp(); // Ceci va maintenant initialiser le gestionnaire de modèles
            showNotification('Connexion réussie!', 'success');
        } else {
            errorDiv.textContent = data.error || 'Erreur de connexion';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        errorDiv.textContent = 'Erreur de connexion au serveur';
        errorDiv.style.display = 'block';
    } finally {
        // Restaurer le bouton
        loginBtn.disabled = false;
        document.querySelector('.btn-text').style.display = 'inline';
        document.querySelector('.btn-spinner').style.display = 'none';
    }
}

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        showLoginPage();
        chatHistory = [];
        clearChatMessages();
        
        // Nettoyer le gestionnaire de modèles
        if (window.modelsManager) {
            window.modelsManager.destroy();
        }
        
        showNotification('Déconnexion réussie', 'info');
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        showNotification('Erreur lors de la déconnexion', 'error');
    }
}

// Fonctions de chat
async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Ajouter le message utilisateur
    addMessageToChat('user', message);
    input.value = '';
    updateSendButton();
    
    // Préparer le prompt complet
    const prepromptSelect = document.getElementById('preprompt-select');
    const selectedPreprompt = prepromptSelect.value;
    let fullPrompt = message;
    
    if (selectedPreprompt) {
        const preprompts = await getPreprompts();
        const preprompt = preprompts.find(p => p.id === selectedPreprompt);
        if (preprompt) {
            fullPrompt = preprompt.content + '\\n\\n' + message;
        }
    }
    
    // Ajouter un message de chargement
    const loadingId = addMessageToChat('assistant', '🤔 Réflexion en cours...');
    updateStatusIndicator('thinking');
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message: fullPrompt,
                history: chatHistory
            })
        });
        
        const data = await response.json();
        
        // Supprimer le message de chargement
        removeMessageFromChat(loadingId);
        
        if (data.success) {
            addMessageToChat('assistant', data.response);
            updateStatusIndicator('connected');
        } else {
            addMessageToChat('assistant', '❌ Erreur: ' + (data.error || 'Erreur inconnue'));
            updateStatusIndicator('error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        removeMessageFromChat(loadingId);
        addMessageToChat('assistant', '❌ Erreur de connexion au modèle');
        updateStatusIndicator('error');
    }
}

function addMessageToChat(sender, content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageId = 'msg-' + Date.now();
    
    // Supprimer le message de bienvenue s'il existe
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.id = messageId;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (sender === 'assistant') {
        contentDiv.innerHTML = formatAssistantMessage(content);
    } else {
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Ajouter à l'historique
    if (sender === 'user' || (sender === 'assistant' && !content.includes('🤔'))) {
        chatHistory.push({ role: sender, content });
    }
    
    return messageId;
}

function removeMessageFromChat(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.remove();
    }
}

function formatAssistantMessage(content) {
    // Conversion simple markdown vers HTML
    return content
        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\\n/g, '<br>');
}

function clearChat() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <h3>👋 Bienvenue dans Phi-3 Chat!</h3>
            <p>Commencez une conversation avec votre modèle local.</p>
            <p>Vous pouvez sélectionner un preprompt ci-dessus pour définir le contexte de la conversation.</p>
        </div>
    `;
    chatHistory = [];
    showNotification('Chat effacé', 'info');
}

function clearChatMessages() {
    clearChat();
}

function handleInputChange() {
    updateSendButton();
    
    // Auto-resize du textarea
    const textarea = document.getElementById('message-input');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function updateSendButton() {
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = !input.value.trim();
}

// Fonctions des preprompts
async function loadPreprompts() {
    try {
        const response = await fetch('/api/preprompts');
        const data = await response.json();
        
        if (data.success) {
            updatePrepromptsSelect(data.preprompts);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des preprompts:', error);
    }
}

function updatePrepromptsSelect(preprompts) {
    const select = document.getElementById('preprompt-select');
    select.innerHTML = '<option value="">Aucun preprompt</option>';
    
    preprompts.forEach(preprompt => {
        const option = document.createElement('option');
        option.value = preprompt.id;
        option.textContent = preprompt.name;
        select.appendChild(option);
    });
}

function handlePrepromptChange() {
    const select = document.getElementById('preprompt-select');
    const editBtn = document.getElementById('edit-preprompt-btn');
    const deleteBtn = document.getElementById('delete-preprompt-btn');
    
    const hasSelection = select.value !== '';
    editBtn.disabled = !hasSelection;
    deleteBtn.disabled = !hasSelection;
}

async function getPreprompts() {
    try {
        const response = await fetch('/api/preprompts');
        const data = await response.json();
        return data.success ? data.preprompts : [];
    } catch (error) {
        console.error('Erreur lors de la récupération des preprompts:', error);
        return [];
    }
}

// Gestion des modals
function showAddPrepromptModal() {
    document.getElementById('modal-title').textContent = 'Ajouter un preprompt';
    document.getElementById('preprompt-name').value = '';
    document.getElementById('preprompt-content').value = '';
    currentPrepromptId = null;
    document.getElementById('preprompt-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('preprompt-modal').style.display = 'none';
}

async function savePreprompt(e) {
    e.preventDefault();
    
    const name = document.getElementById('preprompt-name').value;
    const content = document.getElementById('preprompt-content').value;
    
    try {
        const method = currentPrepromptId ? 'PUT' : 'POST';
        const url = currentPrepromptId ? `/api/preprompts/${currentPrepromptId}` : '/api/preprompts';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal();
            await loadPreprompts();
            showNotification(currentPrepromptId ? 'Preprompt modifié' : 'Preprompt ajouté', 'success');
        } else {
            showNotification('Erreur: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function editPreprompt() {
    const select = document.getElementById('preprompt-select');
    const prepromptId = select.value;
    
    if (!prepromptId) return;
    
    try {
        const response = await fetch(`/api/preprompts/${prepromptId}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('modal-title').textContent = 'Modifier le preprompt';
            document.getElementById('preprompt-name').value = data.preprompt.name;
            document.getElementById('preprompt-content').value = data.preprompt.content;
            currentPrepromptId = prepromptId;
            document.getElementById('preprompt-modal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Erreur lors du chargement du preprompt:', error);
        showNotification('Erreur lors du chargement', 'error');
    }
}

async function deletePreprompt() {
    const select = document.getElementById('preprompt-select');
    const prepromptId = select.value;
    
    if (!prepromptId) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce preprompt ?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/preprompts/${prepromptId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadPreprompts();
            showNotification('Preprompt supprimé', 'success');
        } else {
            showNotification('Erreur: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// Paramètres du modèle
async function loadModelParams() {
    try {
        const response = await fetch('/api/model-params');
        const data = await response.json();
        
        if (data.success) {
            const params = data.params;
            document.getElementById('temperature').value = params.temperature;
            document.getElementById('temperature-value').textContent = params.temperature;
            document.getElementById('max-tokens').value = params.maxTokens;
            document.getElementById('max-tokens-value').textContent = params.maxTokens;
            document.getElementById('context-size').value = params.contextSize;
            document.getElementById('context-size-value').textContent = params.contextSize;
            document.getElementById('top-p').value = params.topP;
            document.getElementById('top-p-value').textContent = params.topP;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
    }
}

async function saveModelParams() {
    const params = {
        temperature: parseFloat(document.getElementById('temperature').value),
        maxTokens: parseInt(document.getElementById('max-tokens').value),
        contextSize: parseInt(document.getElementById('context-size').value),
        topP: parseFloat(document.getElementById('top-p').value)
    };
    
    try {
        const response = await fetch('/api/model-params', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Paramètres sauvegardés', 'success');
        } else {
            showNotification('Erreur: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function resetModelParams() {
    try {
        const response = await fetch('/api/model-params/reset', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadModelParams();
            showNotification('Paramètres réinitialisés', 'success');
        } else {
            showNotification('Erreur: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function toggleParams() {
    const content = document.getElementById('params-content');
    const button = document.getElementById('toggle-params-btn');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        button.textContent = '−';
    } else {
        content.style.display = 'none';
        button.textContent = '+';
    }
}

// Utilitaires
function updateStatusIndicator(status) {
    const indicator = document.getElementById('status-indicator');
    indicator.className = 'status-indicator ' + status;
    
    const statusText = {
        'connected': '● Connecté',
        'thinking': '● En cours...',
        'error': '● Erreur',
        'disconnected': '● Déconnecté'
    };
    
    indicator.title = statusText[status] || status;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Suppression automatique
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Fonction globale pour les notifications (pour le gestionnaire de modèles)
window.showNotification = showNotification;
