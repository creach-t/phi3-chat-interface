class Phi3ChatApp {
    constructor() {
        this.currentPreprompt = '';
        this.preprompts = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
    }

    bindEvents() {
        // Authentification
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Chat
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Preprompts
        document.getElementById('preprompts-btn').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('add-preprompt-btn').addEventListener('click', () => this.showPrepromptModal());
        document.getElementById('preprompt-select').addEventListener('change', (e) => this.selectPreprompt(e.target.value));
        
        // Modal
        document.getElementById('close-modal').addEventListener('click', () => this.hidePrepromptModal());
        document.getElementById('cancel-preprompt').addEventListener('click', () => this.hidePrepromptModal());
        document.getElementById('preprompt-form').addEventListener('submit', (e) => this.savePreprompt(e));

        // Fermer modal en cliquant à l'extérieur
        document.getElementById('preprompt-modal').addEventListener('click', (e) => {
            if (e.target.id === 'preprompt-modal') {
                this.hidePrepromptModal();
            }
        });
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/check-auth');
            const data = await response.json();
            
            if (data.authenticated) {
                this.showChatPage();
                await this.loadPreprompts();
            } else {
                this.showLoginPage();
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            this.showLoginPage();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

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
                this.showChatPage();
                await this.loadPreprompts();
            } else {
                errorDiv.textContent = data.error || 'Identifiants incorrects';
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            errorDiv.textContent = 'Erreur de connexion';
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.showLoginPage();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    }

    showLoginPage() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('chat-page').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('login-error').textContent = '';
    }

    showChatPage() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('chat-page').classList.remove('hidden');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('preprompts-sidebar');
        sidebar.classList.toggle('hidden');
    }

    async loadPreprompts() {
        try {
            const response = await fetch('/api/preprompts');
            this.preprompts = await response.json();
            this.renderPreprompts();
            this.updatePrepromptSelect();
        } catch (error) {
            console.error('Erreur lors du chargement des preprompts:', error);
        }
    }

    renderPreprompts() {
        const container = document.getElementById('preprompts-list');
        container.innerHTML = '';

        this.preprompts.forEach(preprompt => {
            const item = document.createElement('div');
            item.className = 'preprompt-item';
            item.innerHTML = `
                <h4>${this.escapeHtml(preprompt.name)}</h4>
                <p>${this.escapeHtml(preprompt.content.substring(0, 100))}${preprompt.content.length > 100 ? '...' : ''}</p>
                <button class="preprompt-delete" onclick="app.deletePreprompt('${preprompt.id}')">&times;</button>
            `;
            
            item.addEventListener('click', () => this.selectPrepromptFromSidebar(preprompt.id));
            container.appendChild(item);
        });
    }

    updatePrepromptSelect() {
        const select = document.getElementById('preprompt-select');
        select.innerHTML = '<option value="">Aucun preprompt</option>';

        this.preprompts.forEach(preprompt => {
            const option = document.createElement('option');
            option.value = preprompt.id;
            option.textContent = preprompt.name;
            select.appendChild(option);
        });
    }

    selectPreprompt(prepromptId) {
        const preprompt = this.preprompts.find(p => p.id === prepromptId);
        
        if (preprompt) {
            this.currentPreprompt = preprompt.content;
            document.getElementById('current-preprompt').textContent = `Actif: ${preprompt.name}`;
        } else {
            this.currentPreprompt = '';
            document.getElementById('current-preprompt').textContent = '';
        }

        // Mettre à jour la sidebar
        document.querySelectorAll('.preprompt-item').forEach(item => {
            item.classList.remove('active');
        });

        if (prepromptId) {
            const activeItem = document.querySelector(`[onclick="app.selectPrepromptFromSidebar('${prepromptId}')"]`)?.parentElement;
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }

    selectPrepromptFromSidebar(prepromptId) {
        const select = document.getElementById('preprompt-select');
        select.value = prepromptId;
        this.selectPreprompt(prepromptId);
    }

    showPrepromptModal() {
        document.getElementById('preprompt-modal').classList.remove('hidden');
        document.getElementById('preprompt-name').value = '';
        document.getElementById('preprompt-content').value = '';
        document.getElementById('preprompt-name').focus();
    }

    hidePrepromptModal() {
        document.getElementById('preprompt-modal').classList.add('hidden');
    }

    async savePreprompt(e) {
        e.preventDefault();
        
        const name = document.getElementById('preprompt-name').value.trim();
        const content = document.getElementById('preprompt-content').value.trim();

        if (!name || !content) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        try {
            const response = await fetch('/api/preprompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, content })
            });

            if (response.ok) {
                this.hidePrepromptModal();
                await this.loadPreprompts();
            } else {
                const error = await response.json();
                alert(error.error || 'Erreur lors de la sauvegarde');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde');
        }
    }

    async deletePreprompt(prepromptId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce preprompt ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/preprompts/${prepromptId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadPreprompts();
                
                // Si le preprompt supprimé était sélectionné, le désélectionner
                if (this.preprompts.find(p => p.id === prepromptId && p.content === this.currentPreprompt)) {
                    this.selectPreprompt('');
                    document.getElementById('preprompt-select').value = '';
                }
            } else {
                alert('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
        }
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const message = input.value.trim();

        if (!message) return;

        // Désactiver l'envoi
        sendBtn.disabled = true;
        input.disabled = true;

        // Ajouter le message utilisateur
        this.addMessage(message, 'user');
        input.value = '';

        // Ajouter un message de chargement
        const loadingMessage = this.addMessage('Génération en cours...', 'loading');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    preprompt: this.currentPreprompt
                })
            });

            const data = await response.json();

            // Supprimer le message de chargement
            loadingMessage.remove();

            if (data.response) {
                this.addMessage(data.response, 'assistant');
            } else {
                this.addMessage('Erreur: ' + (data.error || 'Réponse vide'), 'assistant');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            loadingMessage.remove();
            this.addMessage('Erreur de connexion', 'assistant');
        } finally {
            // Réactiver l'envoi
            sendBtn.disabled = false;
            input.disabled = false;
            input.focus();
        }
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialiser l'application
const app = new Phi3ChatApp();

// Exposer la fonction deletePreprompt globalement pour les boutons
window.app = app;