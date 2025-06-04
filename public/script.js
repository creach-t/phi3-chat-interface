// État global de l'application
const app = {
  authenticated: false,
  preprompts: [],
  currentPreprompt: '',
  modelParams: {
    temperature: 0.7,
    maxTokens: 512,
    topP: 0.95,
    contextSize: 2048,
    repeatPenalty: 1.1,
    seed: -1
  },
  theme: localStorage.getItem('theme') || 'light'
};

// Suggestions de preprompts
const prepromptSuggestions = [
  {
    title: "Assistant français",
    content: "Tu es un assistant IA qui répond toujours en français de manière polie et professionnelle."
  },
  {
    title: "Expert en code",
    content: "Tu es un expert en programmation. Fournis des réponses techniques précises avec des exemples de code."
  },
  {
    title: "Tuteur pédagogique",
    content: "Tu es un tuteur patient qui explique les concepts de manière simple avec des exemples concrets."
  },
  {
    title: "Créatif et artistique",
    content: "Tu es un assistant créatif qui aide avec l'écriture, les idées artistiques et l'inspiration."
  },
  {
    title: "Analyste de données",
    content: "Tu es un expert en analyse de données qui aide à interpréter les chiffres et les tendances."
  },
  {
    title: "Coach personnel",
    content: "Tu es un coach bienveillant qui aide à atteindre les objectifs personnels et professionnels."
  }
];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  console.log('🚀 Initialisation de l\'application');
  
  // Appliquer le thème sauvegardé
  applyTheme(app.theme);
  
  // Vérifier l'authentification
  checkAuthentication();
  
  // Initialiser les événements
  initializeEventListeners();
  
  // Charger les suggestions de preprompts
  loadPrepromptSuggestions();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  app.theme = theme;
  localStorage.setItem('theme', theme);
  
  const themeIcon = document.getElementById('theme-toggle')?.querySelector('i');
  if (themeIcon) {
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

function checkAuthentication() {
  fetch('/api/check-auth', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (data.authenticated) {
      app.authenticated = true;
      showChatPage();
      loadInitialData();
    } else {
      showLoginPage();
    }
  })
  .catch(error => {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    showLoginPage();
  });
}

function loadInitialData() {
  Promise.all([
    loadPreprompts(),
    loadModelParams()
  ]).then(() => {
    console.log('✅ Données initiales chargées');
    updateModelStatusDisplay();
  }).catch(error => {
    console.error('Erreur lors du chargement des données:', error);
  });
}

function initializeEventListeners() {
  // Authentification
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  
  // Thème
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  // Sidebars
  document.getElementById('settings-btn')?.addEventListener('click', toggleSettingsSidebar);
  document.getElementById('preprompts-btn')?.addEventListener('click', togglePrepromptsSidebar);
  document.getElementById('close-settings')?.addEventListener('click', closeSettingsSidebar);
  document.getElementById('close-preprompts')?.addEventListener('click', closePrepromptsSidebar);
  
  // Paramètres du modèle
  initializeModelParamsListeners();
  
  // Preprompts
  document.getElementById('add-preprompt-btn')?.addEventListener('click', showPrepromptModal);
  document.getElementById('close-modal')?.addEventListener('click', hidePrepromptModal);
  document.getElementById('cancel-preprompt')?.addEventListener('click', hidePrepromptModal);
  document.getElementById('preprompt-form')?.addEventListener('submit', handleAddPreprompt);
  document.getElementById('preprompt-select')?.addEventListener('change', handlePrepromptChange);
  
  // Chat
  document.getElementById('send-btn')?.addEventListener('click', sendMessage);
  document.getElementById('message-input')?.addEventListener('keypress', handleMessageKeypress);
  document.getElementById('message-input')?.addEventListener('input', handleMessageInput);
  
  // Fermer les sidebars en cliquant à l'extérieur sur mobile
  document.addEventListener('click', handleOutsideClick);
}

function initializeModelParamsListeners() {
  // Sliders
  const sliders = ['temperature', 'max-tokens', 'top-p', 'context-size', 'repeat-penalty'];
  sliders.forEach(param => {
    const slider = document.getElementById(`${param}-slider`);
    const valueDisplay = document.getElementById(`${param}-value`);
    
    if (slider && valueDisplay) {
      slider.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
        updateModelParam(param, parseFloat(e.target.value));
      });
    }
  });
  
  // Seed input
  document.getElementById('seed-input')?.addEventListener('change', (e) => {
    updateModelParam('seed', parseInt(e.target.value) || -1);
  });
  
  // Boutons
  document.getElementById('save-params')?.addEventListener('click', saveModelParams);
  document.getElementById('reset-params')?.addEventListener('click', resetModelParams);
}

function updateModelParam(param, value) {
  const paramMap = {
    'temperature': 'temperature',
    'max-tokens': 'maxTokens',
    'top-p': 'topP',
    'context-size': 'contextSize',
    'repeat-penalty': 'repeatPenalty',
    'seed': 'seed'
  };
  
  if (paramMap[param]) {
    app.modelParams[paramMap[param]] = value;
    updateModelStatusDisplay();
  }
}

function updateModelStatusDisplay() {
  const statusElement = document.getElementById('current-params');
  if (statusElement) {
    statusElement.textContent = `T: ${app.modelParams.temperature} | Tokens: ${app.modelParams.maxTokens}`;
  }
}

// Gestion de l'authentification
function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      app.authenticated = true;
      showChatPage();
      loadInitialData();
    } else {
      errorDiv.textContent = data.error || 'Erreur de connexion';
      errorDiv.style.display = 'block';
    }
  })
  .catch(error => {
    console.error('Erreur de connexion:', error);
    errorDiv.textContent = 'Erreur de connexion au serveur';
    errorDiv.style.display = 'block';
  });
}

function handleLogout() {
  fetch('/api/logout', {
    method: 'POST',
    credentials: 'include'
  })
  .then(() => {
    app.authenticated = false;
    showLoginPage();
  })
  .catch(error => {
    console.error('Erreur de déconnexion:', error);
  });
}

function showLoginPage() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('chat-page').classList.add('hidden');
}

function showChatPage() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('chat-page').classList.remove('hidden');
}

// Gestion du thème
function toggleTheme() {
  const newTheme = app.theme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

// Gestion des sidebars
function toggleSettingsSidebar() {
  const sidebar = document.getElementById('settings-sidebar');
  const prepromptsSidebar = document.getElementById('preprompts-sidebar');
  
  // Fermer l'autre sidebar si ouverte
  if (!prepromptsSidebar.classList.contains('hidden')) {
    prepromptsSidebar.classList.add('hidden');
  }
  
  sidebar.classList.toggle('hidden');
}

function togglePrepromptsSidebar() {
  const sidebar = document.getElementById('preprompts-sidebar');
  const settingsSidebar = document.getElementById('settings-sidebar');
  
  // Fermer l'autre sidebar si ouverte
  if (!settingsSidebar.classList.contains('hidden')) {
    settingsSidebar.classList.add('hidden');
  }
  
  sidebar.classList.toggle('hidden');
}

function closeSettingsSidebar() {
  document.getElementById('settings-sidebar').classList.add('hidden');
}

function closePrepromptsSidebar() {
  document.getElementById('preprompts-sidebar').classList.add('hidden');
}

function handleOutsideClick(e) {
  const settingsSidebar = document.getElementById('settings-sidebar');
  const prepromptsSidebar = document.getElementById('preprompts-sidebar');
  const settingsBtn = document.getElementById('settings-btn');
  const prepromptsBtn = document.getElementById('preprompts-btn');
  
  // Fermer settings sidebar si clic à l'extérieur
  if (!settingsSidebar.classList.contains('hidden') && 
      !settingsSidebar.contains(e.target) && 
      !settingsBtn.contains(e.target)) {
    settingsSidebar.classList.add('hidden');
  }
  
  // Fermer preprompts sidebar si clic à l'extérieur
  if (!prepromptsSidebar.classList.contains('hidden') && 
      !prepromptsSidebar.contains(e.target) && 
      !prepromptsBtn.contains(e.target)) {
    prepromptsSidebar.classList.add('hidden');
  }
}

// Gestion des paramètres du modèle
function loadModelParams() {
  return fetch('/api/model-params', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(params => {
    app.modelParams = params;
    updateModelParamsUI();
    console.log('✅ Paramètres du modèle chargés:', params);
  })
  .catch(error => {
    console.error('Erreur lors du chargement des paramètres:', error);
  });
}

function updateModelParamsUI() {
  // Mettre à jour les sliders
  document.getElementById('temperature-slider').value = app.modelParams.temperature;
  document.getElementById('temperature-value').textContent = app.modelParams.temperature;
  
  document.getElementById('max-tokens-slider').value = app.modelParams.maxTokens;
  document.getElementById('max-tokens-value').textContent = app.modelParams.maxTokens;
  
  document.getElementById('top-p-slider').value = app.modelParams.topP;
  document.getElementById('top-p-value').textContent = app.modelParams.topP;
  
  document.getElementById('context-size-slider').value = app.modelParams.contextSize;
  document.getElementById('context-size-value').textContent = app.modelParams.contextSize;
  
  document.getElementById('repeat-penalty-slider').value = app.modelParams.repeatPenalty;
  document.getElementById('repeat-penalty-value').textContent = app.modelParams.repeatPenalty;
  
  document.getElementById('seed-input').value = app.modelParams.seed;
}

function saveModelParams() {
  fetch('/api/model-params', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(app.modelParams)
  })
  .then(response => response.json())
  .then(params => {
    app.modelParams = params;
    updateModelStatusDisplay();
    showNotification('Paramètres sauvegardés !', 'success');
    console.log('✅ Paramètres sauvegardés:', params);
  })
  .catch(error => {
    console.error('Erreur lors de la sauvegarde:', error);
    showNotification('Erreur lors de la sauvegarde', 'error');
  });
}

function resetModelParams() {
  fetch('/api/model-params/reset', {
    method: 'POST',
    credentials: 'include'
  })
  .then(response => response.json())
  .then(params => {
    app.modelParams = params;
    updateModelParamsUI();
    updateModelStatusDisplay();
    showNotification('Paramètres réinitialisés !', 'success');
    console.log('✅ Paramètres réinitialisés:', params);
  })
  .catch(error => {
    console.error('Erreur lors de la réinitialisation:', error);
    showNotification('Erreur lors de la réinitialisation', 'error');
  });
}

// Gestion des preprompts
function loadPreprompts() {
  return fetch('/api/preprompts', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(preprompts => {
    app.preprompts = preprompts;
    updatePrepromptsUI();
    console.log('✅ Preprompts chargés:', preprompts.length);
  })
  .catch(error => {
    console.error('Erreur lors du chargement des preprompts:', error);
  });
}

function updatePrepromptsUI() {
  const select = document.getElementById('preprompt-select');
  const list = document.getElementById('preprompts-list');
  
  // Mettre à jour le select
  select.innerHTML = '<option value=\"\">Aucun preprompt</option>';
  app.preprompts.forEach(preprompt => {
    const option = document.createElement('option');
    option.value = preprompt.id;
    option.textContent = preprompt.name;
    select.appendChild(option);
  });
  
  // Mettre à jour la liste
  list.innerHTML = '';
  app.preprompts.forEach(preprompt => {
    const item = createPrepromptItem(preprompt);
    list.appendChild(item);
  });
}

function createPrepromptItem(preprompt) {
  const item = document.createElement('div');
  item.className = 'preprompt-item';
  item.innerHTML = `
    <div class=\"preprompt-name\">${escapeHtml(preprompt.name)}</div>
    <div class=\"preprompt-content\">${escapeHtml(preprompt.content)}</div>
    <div class=\"preprompt-actions\">
      <button class=\"btn-icon\" onclick=\"selectPreprompt('${preprompt.id}')\">
        <i class=\"fas fa-check\"></i>
      </button>
      <button class=\"btn-icon delete\" onclick=\"deletePreprompt('${preprompt.id}')\">
        <i class=\"fas fa-trash\"></i>
      </button>
    </div>
  `;
  return item;
}

function selectPreprompt(id) {
  document.getElementById('preprompt-select').value = id;
  handlePrepromptChange();
  closePrepromptsSidebar();
}

function deletePreprompt(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce preprompt ?')) return;
  
  fetch(`/api/preprompts/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  .then(response => response.json())
  .then(() => {
    loadPreprompts();
    showNotification('Preprompt supprimé !', 'success');
  })
  .catch(error => {
    console.error('Erreur lors de la suppression:', error);
    showNotification('Erreur lors de la suppression', 'error');
  });
}

function handlePrepromptChange() {
  const select = document.getElementById('preprompt-select');
  const currentDiv = document.getElementById('current-preprompt');
  
  const selectedId = select.value;
  if (selectedId) {
    const preprompt = app.preprompts.find(p => p.id === selectedId);
    if (preprompt) {
      app.currentPreprompt = preprompt.content;
      currentDiv.textContent = `Actuel: ${preprompt.name}`;
    }
  } else {
    app.currentPreprompt = '';
    currentDiv.textContent = '';
  }
}

function loadPrepromptSuggestions() {
  const container = document.getElementById('preprompt-suggestions');
  if (!container) return;
  
  container.innerHTML = '';
  prepromptSuggestions.forEach(suggestion => {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.innerHTML = `
      <div class=\"suggestion-title\">${escapeHtml(suggestion.title)}</div>
      <div class=\"suggestion-content\">${escapeHtml(suggestion.content)}</div>
    `;
    card.onclick = () => {
      document.getElementById('preprompt-name').value = suggestion.title;
      document.getElementById('preprompt-content').value = suggestion.content;
      updateCharCount(document.getElementById('preprompt-content'));
    };
    container.appendChild(card);
  });
}

function showPrepromptModal() {
  document.getElementById('preprompt-modal').classList.remove('hidden');
  document.getElementById('preprompt-name').focus();
}

function hidePrepromptModal() {
  document.getElementById('preprompt-modal').classList.add('hidden');
  document.getElementById('preprompt-form').reset();
  updateCharCount(document.getElementById('preprompt-content'));
}

function handleAddPreprompt(e) {
  e.preventDefault();
  
  const name = document.getElementById('preprompt-name').value.trim();
  const content = document.getElementById('preprompt-content').value.trim();
  
  if (!name || !content) {
    showNotification('Nom et contenu requis', 'error');
    return;
  }
  
  fetch('/api/preprompts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ name, content })
  })
  .then(response => response.json())
  .then(preprompt => {
    loadPreprompts();
    hidePrepromptModal();
    showNotification('Preprompt créé !', 'success');
  })
  .catch(error => {
    console.error('Erreur lors de la création:', error);
    showNotification('Erreur lors de la création', 'error');
  });
}

// Gestion du chat
function handleMessageKeypress(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function handleMessageInput(e) {
  const input = e.target;
  const sendBtn = document.getElementById('send-btn');
  
  // Auto-resize
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  
  // Enable/disable send button
  sendBtn.disabled = !input.value.trim();
}

function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Afficher le message de l'utilisateur
  addMessage('user', message);
  
  // Vider l'input
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('send-btn').disabled = true;
  
  // Afficher l'indicateur de frappe
  showTypingIndicator();
  
  // Envoyer la requête
  fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      message,
      preprompt: app.currentPreprompt,
      modelParams: app.modelParams
    })
  })
  .then(response => response.json())
  .then(data => {
    hideTypingIndicator();
    
    if (data.response) {
      addMessage('assistant', data.response);
    } else {
      addMessage('assistant', 'Désolé, je n\\'ai pas pu générer une réponse. ' + (data.error || ''));
    }
  })
  .catch(error => {
    hideTypingIndicator();
    console.error('Erreur lors de l\\'envoi du message:', error);
    addMessage('assistant', 'Erreur de connexion au serveur.');
  });
}

function addMessage(type, content) {
  const messagesContainer = document.getElementById('chat-messages');
  
  // Masquer le message de bienvenue s'il existe
  const welcomeMessage = messagesContainer.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = type === 'user' ? '<i class=\"fas fa-user\"></i>' : '<i class=\"fas fa-robot\"></i>';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date().toLocaleTimeString();
  
  messageDiv.appendChild(avatar);
  const contentWrapper = document.createElement('div');
  contentWrapper.appendChild(contentDiv);
  contentWrapper.appendChild(timeDiv);
  messageDiv.appendChild(contentWrapper);
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
  document.getElementById('typing-indicator').classList.remove('hidden');
}

function hideTypingIndicator() {
  document.getElementById('typing-indicator').classList.add('hidden');
}

// Utilitaires
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    '\\\'': '&#039;'
  };
  return text.replace(/[&<>\"']/g, m => map[m]);
}

function showNotification(message, type = 'info') {
  // Créer la notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    z-index: 9999;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animer l'entrée
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Supprimer après 3 secondes
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Fonctions globales pour les événements inline
window.selectPreprompt = selectPreprompt;
window.deletePreprompt = deletePreprompt;
window.updateCharCount = updateCharCount;