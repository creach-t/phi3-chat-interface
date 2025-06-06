/**
 * Gestionnaire des modèles adapté pour l'interface existante
 */
class ModelsManager {
    constructor() {
        this.models = [];
        this.downloads = [];
        this.refreshInterval = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.loadModels();
        this.startRefreshInterval();
        this.isInitialized = true;
    }

    setupEventListeners() {
        // Bouton pour ouvrir la sidebar
        const modelsBtn = document.getElementById('models-btn');
        if (modelsBtn) {
            modelsBtn.addEventListener('click', () => this.showModelsSidebar());
        }

        // Bouton pour fermer la sidebar
        const closeBtn = document.getElementById('close-models');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModelsSidebar());
        }

        // Bouton de téléchargement
        const downloadBtn = document.getElementById('download-model-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadModel());
        }
    }

    showModelsSidebar() {
        // Fermer les autres sidebars
        this.hideOtherSidebars();
        
        // Ouvrir la sidebar des modèles
        const sidebar = document.getElementById('models-sidebar');
        if (sidebar) {
            sidebar.classList.remove('hidden');
        }
        
        // Charger les modèles si pas encore fait
        this.loadModels();
    }

    hideModelsSidebar() {
        const sidebar = document.getElementById('models-sidebar');
        if (sidebar) {
            sidebar.classList.add('hidden');
        }
    }

    hideOtherSidebars() {
        const sidebars = ['settings-sidebar', 'preprompts-sidebar'];
        sidebars.forEach(sidebarId => {
            const sidebar = document.getElementById(sidebarId);
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
        });
    }

    async loadModels() {
        try {
            const response = await fetch('/api/models');
            const data = await response.json();
            
            if (data.success) {
                this.models = data.models;
                this.renderModels();
            } else {
                this.showError('Erreur lors du chargement des modèles: ' + data.error);
            }
        } catch (error) {
            this.showError('Erreur de connexion: ' + error.message);
        }
    }

    renderModels() {
        const container = document.getElementById('models-list');
        if (!container) return;

        if (this.models.length === 0) {
            container.innerHTML = '<div class="no-models">Aucun modèle disponible</div>';
            return;
        }

        container.innerHTML = this.models.map(model => `
            <div class="model-item ${model.isActive ? 'active' : ''}">
                <div class="model-info">
                    <div class="model-name">
                        <i class="fas fa-${model.isActive ? 'check-circle' : 'circle'}" style="color: ${model.isActive ? '#4caf50' : '#ccc'}"></i>
                        ${model.name}
                    </div>
                    <div class="model-details">
                        <span class="model-size">
                            <i class="fas fa-hdd"></i> ${this.formatSize(model.size)}
                        </span>
                        <span class="model-date">
                            <i class="fas fa-calendar"></i> ${new Date(model.downloadDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div class="model-actions">
                    ${!model.isActive ? `
                        <button onclick="modelsManager.activateModel('${model.filename}')" class="btn-primary btn-sm">
                            <i class="fas fa-play"></i> Activer
                        </button>
                    ` : ''}
                    ${!model.isActive ? `
                        <button onclick="modelsManager.deleteModel('${model.filename}')" class="btn-secondary btn-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : `
                        <span class="active-badge">
                            <i class="fas fa-star"></i> Actuel
                        </span>
                    `}
                </div>
            </div>
        `).join('');
    }

    async downloadModel() {
        const urlInput = document.getElementById('model-url');
        const filenameInput = document.getElementById('model-filename');
        
        const url = urlInput.value.trim();
        const filename = filenameInput.value.trim();

        if (!url) {
            this.showError('Veuillez entrer une URL');
            return;
        }

        // Validation basique de l'URL
        if (!url.includes('huggingface.co') || !url.includes('.gguf')) {
            this.showError('Veuillez entrer une URL Hugging Face valide vers un fichier .gguf');
            return;
        }

        try {
            const response = await fetch('/api/models/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, filename: filename || undefined })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Téléchargement démarré');
                urlInput.value = '';
                filenameInput.value = '';
                this.loadDownloads();
            } else {
                this.showError('Erreur: ' + data.error);
            }
        } catch (error) {
            this.showError('Erreur de téléchargement: ' + error.message);
        }
    }

    async activateModel(filename) {
        try {
            const response = await fetch('/api/models/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filename })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Modèle activé avec succès');
                this.loadModels();
            } else {
                this.showError('Erreur: ' + data.error);
            }
        } catch (error) {
            this.showError('Erreur d\'activation: ' + error.message);
        }
    }

    async deleteModel(filename) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le modèle ${filename} ?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/models/${filename}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Modèle supprimé');
                this.loadModels();
            } else {
                this.showError('Erreur: ' + data.error);
            }
        } catch (error) {
            this.showError('Erreur de suppression: ' + error.message);
        }
    }

    async loadDownloads() {
        try {
            const response = await fetch('/api/models/downloads');
            const data = await response.json();
            
            if (data.success) {
                this.downloads = data.downloads;
                this.renderDownloads();
            }
        } catch (error) {
            console.error('Erreur lors du chargement des téléchargements:', error);
        }
    }

    renderDownloads() {
        const container = document.getElementById('downloads-list');
        const section = document.getElementById('downloads-section');
        
        if (!container || !section) return;

        if (this.downloads.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = this.downloads.map(download => `
            <div class="download-item ${download.status}">
                <div class="download-header">
                    <span class="download-filename">
                        <i class="fas fa-download"></i>
                        ${download.filename}
                    </span>
                    <span class="download-status">
                        ${this.getStatusIcon(download.status)} ${this.getStatusText(download.status)}
                    </span>
                </div>
                <div class="download-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${download.progress}%"></div>
                    </div>
                    <span class="progress-text">${Math.round(download.progress)}%</span>
                </div>
                ${download.status === 'downloading' ? `
                    <button onclick="modelsManager.cancelDownload('${download.id}')" class="btn-secondary btn-sm">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    async cancelDownload(downloadId) {
        try {
            const response = await fetch(`/api/models/downloads/${downloadId}/cancel`, {
                method: 'POST'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Téléchargement annulé');
                this.loadDownloads();
            } else {
                this.showError('Erreur: ' + data.error);
            }
        } catch (error) {
            this.showError('Erreur d\'annulation: ' + error.message);
        }
    }

    startRefreshInterval() {
        this.refreshInterval = setInterval(() => {
            if (this.downloads.some(d => d.status === 'downloading')) {
                this.loadDownloads();
            }
        }, 2000);
    }

    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    getStatusText(status) {
        const statusMap = {
            'downloading': 'En cours...',
            'completed': 'Terminé',
            'error': 'Erreur',
            'cancelled': 'Annulé'
        };
        return statusMap[status] || status;
    }

    getStatusIcon(status) {
        const iconMap = {
            'downloading': '<i class="fas fa-spinner fa-spin"></i>',
            'completed': '<i class="fas fa-check" style="color: #4caf50"></i>',
            'error': '<i class="fas fa-exclamation-triangle" style="color: #f44336"></i>',
            'cancelled': '<i class="fas fa-times" style="color: #ff9800"></i>'
        };
        return iconMap[status] || '';
    }

    showError(message) {
        // Utilise le système de notification existant ou crée une alerte
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert('Erreur: ' + message);
        }
    }

    showSuccess(message) {
        // Utilise le système de notification existant
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            console.log('Succès: ' + message);
        }
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.isInitialized = false;
    }
}

// Instance globale - ne s'initialise pas automatiquement
let modelsManager = new ModelsManager();

// Fonction globale pour afficher les modèles (appelée depuis les quick-actions)
window.showModels = function() {
    if (modelsManager) {
        modelsManager.showModelsSidebar();
    }
};

// Fonction d'initialisation (appelée depuis main.js après connexion)
window.initializeModelsManager = function() {
    if (modelsManager) {
        modelsManager.init();
    }
};
