// Logique spécifique à la sidebar de gestion des modèles
(function() {
    'use strict';

    console.log('🎛️ Models sidebar component loaded');

    class ModelsSidebarManager {
        constructor() {
            this.initialized = false;
            this.models = [];
            this.downloads = new Map();
            this.activeModel = null;
            this.refreshInterval = null;
            
            // Référence au service API
            this.apiService = window.modelsApiService;
        }

        init() {
            if (this.initialized) return;

            this.setupElements();
            this.setupEventListeners();
            this.loadModels();
            this.startRefreshInterval();
            
            this.initialized = true;
            console.log('✅ Models sidebar component initialized');
        }

        setupElements() {
            this.elements = {
                modelUrl: document.getElementById('model-url'),
                modelFilename: document.getElementById('model-filename'),
                downloadBtn: document.getElementById('download-model-btn'),
                downloadsList: document.getElementById('downloads-list'),
                downloadsSection: document.getElementById('downloads-section'),
                modelsList: document.getElementById('models-list'),
                closeBtn: document.querySelector('#models-sidebar .close-btn')
            };
        }

        setupEventListeners() {
            // Bouton de téléchargement
            if (this.elements.downloadBtn) {
                this.elements.downloadBtn.addEventListener('click', () => {
                    this.startDownload();
                });
            }

            // Validation URL en temps réel
            if (this.elements.modelUrl) {
                this.elements.modelUrl.addEventListener('input', () => {
                    this.validateUrl();
                });
            }

            // Bouton fermer
            if (this.elements.closeBtn) {
                this.elements.closeBtn.addEventListener('click', () => {
                    this.closeSidebar();
                });
            }
        }

        validateUrl() {
            const url = this.elements.modelUrl.value.trim();
            const isValid = this.apiService.isValidModelUrl(url);
            
            // Mise à jour visuelle
            if (url) {
                this.elements.modelUrl.classList.toggle('valid', isValid);
                this.elements.modelUrl.classList.toggle('invalid', !isValid);
                
                // Afficher/masquer l'indication de validation
                this.showUrlValidation(url, isValid);
            } else {
                this.elements.modelUrl.classList.remove('valid', 'invalid');
                this.hideUrlValidation();
            }

            // Activer/désactiver le bouton
            this.elements.downloadBtn.disabled = !isValid || !url;
        }

        showUrlValidation(url, isValid) {
            let validation = this.elements.modelUrl.parentNode.querySelector('.url-validation');
            if (!validation) {
                validation = document.createElement('div');
                validation.className = 'url-validation';
                this.elements.modelUrl.parentNode.appendChild(validation);
            }

            if (isValid) {
                validation.className = 'url-validation valid';
                validation.innerHTML = '<i class="fas fa-check"></i> URL valide';
            } else {
                validation.className = 'url-validation invalid';
                validation.innerHTML = '<i class="fas fa-times"></i> URL invalide (doit être un fichier .gguf de Hugging Face)';
            }
        }

        hideUrlValidation() {
            const validation = this.elements.modelUrl.parentNode.querySelector('.url-validation');
            if (validation) {
                validation.remove();
            }
        }

        // === INTÉGRATION API RÉELLE ===

        async startDownload() {
            const url = this.elements.modelUrl.value.trim();
            const customName = this.elements.modelFilename.value.trim();
            
            if (!this.apiService.isValidModelUrl(url)) {
                this.showNotification('Veuillez entrer une URL valide', 'error');
                return;
            }

            try {
                // Désactiver le bouton pendant la requête
                this.elements.downloadBtn.disabled = true;
                this.elements.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Démarrage...';

                const response = await this.apiService.downloadModel(url, customName);
                
                if (response.success) {
                    this.showNotification('Téléchargement démarré avec succès', 'success');
                    this.clearForm();
                    this.loadDownloads(); // Recharger les téléchargements
                } else {
                    this.showNotification(`Erreur: ${response.error}`, 'error');
                }
            } catch (error) {
                console.error('Download error:', error);
                this.showNotification(`Erreur de téléchargement: ${error.message}`, 'error');
            } finally {
                // Réactiver le bouton
                this.elements.downloadBtn.disabled = false;
                this.elements.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger';
                this.validateUrl(); // Re-valider pour réactiver si nécessaire
            }
        }

        async loadModels() {
            try {
                const response = await this.apiService.listModels();
                
                if (response.success) {
                    this.models = response.models || [];
                    this.activeModel = this.models.find(m => m.isActive);
                    this.renderModels();
                } else {
                    console.error('Error loading models:', response.error);
                    this.showNotification(`Erreur lors du chargement: ${response.error}`, 'error');
                }
            } catch (error) {
                console.error('Network error loading models:', error);
                this.showNotification('Erreur de connexion au serveur', 'error');
                
                // Afficher un état d'erreur dans la liste
                if (this.elements.modelsList) {
                    this.elements.modelsList.innerHTML = `
                        <div class="models-error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h5>Erreur de connexion</h5>
                            <p>Impossible de charger les modèles. Vérifiez votre connexion.</p>
                            <button class="btn-primary btn-sm" onclick="window.modelsSidebarManager.loadModels()">
                                <i class="fas fa-redo"></i> Réessayer
                            </button>
                        </div>
                    `;
                }
            }
        }

        async loadDownloads() {
            try {
                const response = await this.apiService.getDownloads();
                
                if (response.success) {
                    // Convertir le tableau en Map pour conserver la structure existante
                    this.downloads.clear();
                    (response.downloads || []).forEach(download => {
                        this.downloads.set(download.id, download);
                    });
                    
                    this.renderDownloads();
                } else {
                    console.error('Error loading downloads:', response.error);
                }
            } catch (error) {
                console.error('Network error loading downloads:', error);
            }
        }

        async loadModel(modelId) {
            const model = this.models.find(m => m.id === modelId || m.filename === modelId);
            if (!model) return;

            try {
                const response = await this.apiService.activateModel(model.filename || model.name);
                
                if (response.success) {
                    this.showNotification(`Modèle "${model.name}" activé avec succès`, 'success');
                    this.loadModels(); // Recharger pour mettre à jour l'état
                    
                    // Notifier les autres composants
                    document.dispatchEvent(new CustomEvent('modelChanged', {
                        detail: { model }
                    }));
                } else {
                    this.showNotification(`Erreur d'activation: ${response.error}`, 'error');
                }
            } catch (error) {
                console.error('Model activation error:', error);
                this.showNotification(`Erreur d'activation: ${error.message}`, 'error');
            }
        }

        async unloadModel(modelId) {
            // Pour l'instant, il n'y a pas d'endpoint de déchargement spécifique
            console.log('Model unload requested for:', modelId);
            this.showNotification('Déchargement des modèles non implémenté côté serveur', 'info');
        }

        async deleteModel(modelId) {
            const model = this.models.find(m => m.id === modelId || m.filename === modelId);
            if (!model) return;

            if (!confirm(`Êtes-vous sûr de vouloir supprimer "${model.name}" ?`)) {
                return;
            }

            try {
                const filename = model.filename || model.name;
                const response = await this.apiService.deleteModel(filename);
                
                if (response.success) {
                    this.showNotification(`Modèle "${model.name}" supprimé avec succès`, 'success');
                    this.loadModels(); // Recharger la liste
                    
                    // Notifier les autres composants
                    document.dispatchEvent(new CustomEvent('modelDeleted', {
                        detail: { model }
                    }));
                } else {
                    this.showNotification(`Erreur de suppression: ${response.error}`, 'error');
                }
            } catch (error) {
                console.error('Model deletion error:', error);
                this.showNotification(`Erreur de suppression: ${error.message}`, 'error');
            }
        }

        async cancelDownload(downloadId) {
            try {
                const response = await this.apiService.cancelDownload(downloadId);
                
                if (response.success) {
                    this.showNotification('Téléchargement annulé', 'success');
                    this.loadDownloads(); // Recharger les téléchargements
                } else {
                    this.showNotification(`Erreur d'annulation: ${response.error}`, 'error');
                }
            } catch (error) {
                console.error('Cancel download error:', error);
                this.showNotification(`Erreur d'annulation: ${error.message}`, 'error');
            }
        }

        // === MÉTHODES D'AFFICHAGE ===

        renderModels() {
            if (!this.elements.modelsList) return;

            if (this.models.length === 0) {
                this.elements.modelsList.innerHTML = `
                    <div class="models-empty">
                        <i class="fas fa-cube"></i>
                        <h5>Aucun modèle</h5>
                        <p>Téléchargez votre premier modèle depuis Hugging Face pour commencer.</p>
                    </div>
                `;
                return;
            }

            this.elements.modelsList.innerHTML = this.models.map(model => this.getModelItemHTML(model)).join('');
            
            // Réappliquer les tooltips
            setTimeout(() => {
                if (window.tooltipManager) {
                    window.tooltipManager.initDataTooltips();
                }
            }, 100);
        }

        renderDownloads() {
            if (!this.elements.downloadsList || !this.elements.downloadsSection) return;

            const downloadsArray = Array.from(this.downloads.values());
            
            if (downloadsArray.length === 0) {
                this.elements.downloadsSection.style.display = 'none';
                return;
            }

            this.elements.downloadsSection.style.display = 'block';
            this.elements.downloadsList.innerHTML = downloadsArray.map(download => 
                this.getDownloadItemHTML(download)
            ).join('');
        }

        getModelItemHTML(model) {
            return `
                <div class="model-item ${model.isActive ? 'active' : ''}">
                    <div class="model-header">
                        <div class="model-name ${model.isActive ? 'active' : ''}">
                            <i class="fas fa-cube"></i>
                            ${model.name}
                        </div>
                        <div class="model-badge ${model.isActive ? 'active' : 'inactive'}">
                            ${model.isActive ? 'Actif' : 'Inactif'}
                        </div>
                    </div>
                    <div class="model-info">
                        <div class="model-size">
                            <i class="fas fa-hdd"></i>
                            ${this.apiService.formatFileSize(model.size || 0)}
                        </div>
                        <div class="model-path">${model.path || model.filename}</div>
                    </div>
                    <div class="model-actions">
                        ${!model.isActive ? `
                            <button class="btn-icon load" onclick="window.modelsSidebarManager.loadModel('${model.id || model.filename}')" 
                                    data-tooltip="Charger ce modèle" data-tooltip-position="top" data-tooltip-variant="primary">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : `
                            <button class="btn-icon" onclick="window.modelsSidebarManager.unloadModel('${model.id || model.filename}')" 
                                    data-tooltip="Décharger le modèle" data-tooltip-position="top">
                                <i class="fas fa-stop"></i>
                            </button>
                        `}
                        <button class="btn-icon" onclick="window.modelsSidebarManager.showModelInfo('${model.id || model.filename}')" 
                                data-tooltip="Informations" data-tooltip-position="top">
                            <i class="fas fa-info"></i>
                        </button>
                        <button class="btn-icon delete" onclick="window.modelsSidebarManager.deleteModel('${model.id || model.filename}')" 
                                data-tooltip="Supprimer" data-tooltip-position="top" data-tooltip-variant="danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        getDownloadItemHTML(download) {
            const progress = download.progress || 0;
            const downloaded = download.downloaded || 0;
            const total = download.size || download.total || 0;

            return `
                <div class="download-item ${download.status}" id="download-${download.id}">
                    <div class="download-header">
                        <div class="download-name">${download.filename}</div>
                        <div class="download-status ${download.status}">
                            ${this.apiService.getStatusIcon(download.status)}
                            ${this.apiService.getStatusText(download.status)}
                        </div>
                    </div>
                    ${download.status === 'downloading' ? `
                        <div class="download-progress">
                            <div class="download-progress-bar" style="width: ${progress}%"></div>
                        </div>
                    ` : ''}
                    <div class="download-info">
                        <span>${Math.round(progress)}%</span>
                        ${total > 0 ? `<span>${this.apiService.formatFileSize(downloaded)} / ${this.apiService.formatFileSize(total)}</span>` : ''}
                    </div>
                    ${download.status === 'downloading' ? `
                        <div class="download-actions">
                            <button class="btn-icon delete" onclick="window.modelsSidebarManager.cancelDownload('${download.id}')" 
                                    data-tooltip="Annuler le téléchargement" data-tooltip-position="top">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : ''}
                    ${download.status === 'error' ? `
                        <div class="download-actions">
                            <button class="btn-icon" onclick="window.modelsSidebarManager.retryDownload('${download.id}')" 
                                    data-tooltip="Réessayer" data-tooltip-position="top">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button class="btn-icon delete" onclick="window.modelsSidebarManager.removeDownloadItem('${download.id}')" 
                                    data-tooltip="Supprimer" data-tooltip-position="top">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // === MÉTHODES UTILITAIRES ===

        startRefreshInterval() {
            // Actualiser les téléchargements toutes les 2 secondes
            this.refreshInterval = setInterval(() => {
                const hasActiveDownloads = Array.from(this.downloads.values())
                    .some(d => d.status === 'downloading');
                
                if (hasActiveDownloads) {
                    this.loadDownloads();
                }
            }, 2000);
        }

        showModelInfo(modelId) {
            const model = this.models.find(m => m.id === modelId || m.filename === modelId);
            if (!model) return;

            const downloadDate = model.downloadDate ? new Date(model.downloadDate).toLocaleDateString('fr-FR') : 'Inconnue';

            alert(`Informations du modèle:

Nom: ${model.name}
Taille: ${this.apiService.formatFileSize(model.size || 0)}
Chemin: ${model.path || model.filename}
Statut: ${model.isActive ? 'Actif' : 'Inactif'}
Téléchargé le: ${downloadDate}`);
        }

        retryDownload(downloadId) {
            // Pour l'instant, on retire juste l'élément et on laisse l'utilisateur relancer
            this.removeDownloadItem(downloadId);
            this.showNotification('Veuillez relancer le téléchargement manuellement', 'info');
        }

        removeDownloadItem(downloadId) {
            const item = document.getElementById(`download-${downloadId}`);
            if (item) {
                item.style.animation = 'slideOutUp 0.3s ease-out forwards';
                setTimeout(() => {
                    item.remove();
                    this.downloads.delete(downloadId);
                    if (this.downloads.size === 0) {
                        this.elements.downloadsSection.style.display = 'none';
                    }
                }, 300);
            }
        }

        clearForm() {
            if (this.elements.modelUrl) {
                this.elements.modelUrl.value = '';
                this.elements.modelUrl.classList.remove('valid', 'invalid');
            }
            if (this.elements.modelFilename) {
                this.elements.modelFilename.value = '';
            }
            this.hideUrlValidation();
            this.elements.downloadBtn.disabled = true;
        }

        showNotification(message, type = 'info') {
            // Réutiliser le système de notification du models.js existant si disponible
            if (window.modelsManager && window.modelsManager.showNotification) {
                window.modelsManager.showNotification(message, type);
                return;
            }

            // Sinon, créer une notification simple
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                font-size: 14px;
                max-width: 300px;
                word-wrap: break-word;
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        closeSidebar() {
            const sidebar = document.getElementById('models-sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
                
                // Désactiver le bouton header
                if (window.headerManager) {
                    window.headerManager.setButtonActive('models-btn', false);
                }
            }
        }

        destroy() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
            this.initialized = false;
        }
    }

    // Instance globale
    let modelsSidebarManager = null;

    // Initialisation
    function initModelsSidebar() {
        if (modelsSidebarManager) return;
        
        modelsSidebarManager = new ModelsSidebarManager();
        modelsSidebarManager.init();
        
        // Exposer globalement
        window.modelsSidebarManager = modelsSidebarManager;
    }

    // Écouter l'événement de chargement du composant
    window.addEventListener('componentLoaded', function(e) {
        if (e.detail.componentPath.includes('models-sidebar')) {
            console.log('🎛️ Models sidebar component loaded event received');
            initModelsSidebar();
        }
    });

    // Si le composant est déjà chargé, l'initialiser
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                if (document.querySelector('#models-sidebar')) {
                    initModelsSidebar();
                }
            }, 200);
        });
    } else {
        setTimeout(() => {
            if (document.querySelector('#models-sidebar')) {
                initModelsSidebar();
            }
        }, 200);
    }

})();
