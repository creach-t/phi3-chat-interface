/**
 * Gestionnaire des modèles
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
        
        this.createModelsSection();
        this.loadModels();
        this.startRefreshInterval();
        this.isInitialized = true;
    }

    createModelsSection() {
        const existingSection = document.getElementById('models-section');
        if (existingSection) return;

        const mainContainer = document.querySelector('.chat-container');
        if (!mainContainer) return;

        const modelsSection = document.createElement('div');
        modelsSection.id = 'models-section';
        modelsSection.className = 'models-section';
        modelsSection.innerHTML = `
            <div class="models-header">
                <h2>🤖 Gestion des Modèles</h2>
                <button class="btn-toggle" onclick="modelsManager.toggleSection()">−</button>
            </div>
            <div class="models-content">
                <!-- Formulaire d'ajout -->
                <div class="add-model-form">
                    <h3>Ajouter un modèle</h3>
                    <div class="form-group">
                        <input type="url" 
                               id="model-url" 
                               placeholder="https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf"
                               class="form-input">
                        <input type="text" 
                               id="model-filename" 
                               placeholder="Nom du fichier (optionnel)"
                               class="form-input">
                        <button onclick="modelsManager.downloadModel()" class="btn-primary">Télécharger</button>
                    </div>
                </div>

                <!-- Liste des téléchargements en cours -->
                <div id="downloads-list" class="downloads-list" style="display: none;">
                    <h3>Téléchargements en cours</h3>
                    <div id="downloads-container"></div>
                </div>

                <!-- Liste des modèles -->
                <div class="models-list">
                    <h3>Modèles disponibles</h3>
                    <div id="models-container">
                        <p class="loading-models">Chargement des modèles...</p>
                    </div>
                </div>
            </div>
        `;

        // Insérer avant le conteneur de chat
        const chatContainer = document.querySelector('.chat-interface');
        mainContainer.insertBefore(modelsSection, chatContainer);
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
        const container = document.getElementById('models-container');
        if (!container) return;

        if (this.models.length === 0) {
            container.innerHTML = '<p class="no-models">Aucun modèle disponible</p>';
            return;
        }

        container.innerHTML = this.models.map(model => `
            <div class="model-item ${model.isActive ? 'active' : ''}">
                <div class="model-info">
                    <div class="model-name">
                        ${model.isActive ? '🟢' : '⚪'} ${model.name}
                    </div>
                    <div class="model-details">
                        <span class="model-size">${this.formatSize(model.size)}</span>
                        <span class="model-date">${new Date(model.downloadDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="model-actions">
                    ${!model.isActive ? `<button onclick="modelsManager.activateModel('${model.filename}')" class="btn-activate">Activer</button>` : ''}
                    ${!model.isActive ? `<button onclick="modelsManager.deleteModel('${model.filename}')" class="btn-delete">Supprimer</button>` : ''}
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
                this.showSuccess('Modèle activé');
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
        const container = document.getElementById('downloads-container');
        const section = document.getElementById('downloads-list');
        
        if (!container || !section) return;

        if (this.downloads.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = this.downloads.map(download => `
            <div class="download-item ${download.status}">
                <div class="download-info">
                    <div class="download-filename">${download.filename}</div>
                    <div class="download-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${download.progress}%"></div>
                        </div>
                        <span class="progress-text">${Math.round(download.progress)}%</span>
                    </div>
                    <div class="download-status">${this.getStatusText(download.status)}</div>
                </div>
                <div class="download-actions">
                    ${download.status === 'downloading' ? `<button onclick="modelsManager.cancelDownload('${download.id}')" class="btn-cancel">Annuler</button>` : ''}
                </div>
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

    toggleSection() {
        const content = document.querySelector('.models-content');
        const button = document.querySelector('.btn-toggle');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            button.textContent = '−';
        } else {
            content.style.display = 'none';
            button.textContent = '+';
        }
    }

    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    getStatusText(status) {
        const statusMap = {
            'downloading': 'Téléchargement...',
            'completed': 'Terminé',
            'error': 'Erreur',
            'cancelled': 'Annulé'
        };
        return statusMap[status] || status;
    }

    showError(message) {
        // Utiliser le système de notification existant ou créer une simple alerte
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert('Erreur: ' + message);
        }
    }

    showSuccess(message) {
        // Utiliser le système de notification existant ou créer une simple alerte
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            console.log('Succès: ' + message);
        }
    }

    // Nettoyer les intervalles au besoin
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.isInitialized = false;
    }
}

// Instance globale mais n'initialise PAS automatiquement
let modelsManager = new ModelsManager();

// Fonction globale pour initialiser le gestionnaire (appelée depuis main.js)
window.initializeModelsManager = function() {
    if (modelsManager) {
        modelsManager.init();
    }
};
