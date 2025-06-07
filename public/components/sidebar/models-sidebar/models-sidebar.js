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
        }

        init() {
            if (this.initialized) return;

            this.setupElements();
            this.setupEventListeners();
            this.loadModels();
            
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
            const isValid = this.isValidModelUrl(url);
            
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

        isValidModelUrl(url) {
            try {
                const urlObj = new URL(url);
                return (
                    urlObj.hostname.includes('huggingface.co') &&
                    url.includes('.gguf') &&
                    (url.includes('/resolve/') || url.includes('/blob/'))
                );
            } catch {
                return false;
            }
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

        startDownload() {
            const url = this.elements.modelUrl.value.trim();
            const customName = this.elements.modelFilename.value.trim();
            
            if (!this.isValidModelUrl(url)) {
                alert('Veuillez entrer une URL valide');
                return;
            }

            const downloadId = Date.now().toString();
            const filename = customName || this.extractFilenameFromUrl(url);
            
            // Créer l'objet de téléchargement
            const download = {
                id: downloadId,
                url,
                filename,
                status: 'downloading',
                progress: 0,
                startTime: Date.now(),
                size: 0,
                downloaded: 0
            };

            this.downloads.set(downloadId, download);
            this.showDownloadsSection();
            this.renderDownloadItem(download);
            
            // Simuler le téléchargement (remplacer par vraie logique)
            this.simulateDownload(downloadId);
            
            // Nettoyer le formulaire
            this.clearForm();
            
            console.log('📥 Download started:', filename);
        }

        extractFilenameFromUrl(url) {
            try {
                const urlParts = url.split('/');
                return urlParts[urlParts.length - 1] || 'model.gguf';
            } catch {
                return 'model.gguf';
            }
        }

        simulateDownload(downloadId) {
            const download = this.downloads.get(downloadId);
            if (!download) return;

            // Simuler la progression (remplacer par vraie API)
            const interval = setInterval(() => {
                download.progress += Math.random() * 10;
                download.downloaded = Math.floor((download.progress / 100) * 1024 * 1024 * 100); // 100MB simulé
                download.size = 1024 * 1024 * 100; // 100MB simulé

                if (download.progress >= 100) {
                    download.progress = 100;
                    download.status = 'completed';
                    clearInterval(interval);
                    
                    // Ajouter le modèle à la liste
                    setTimeout(() => {
                        this.addModelToList(download);
                        this.removeDownloadItem(downloadId);
                    }, 1000);
                } else if (Math.random() < 0.05) { // 5% chance d'erreur pour simulation
                    download.status = 'error';
                    clearInterval(interval);
                }

                this.updateDownloadItem(download);
            }, 500);
        }

        addModelToList(download) {
            const model = {
                id: Date.now().toString(),
                name: download.filename,
                path: `/models/${download.filename}`,
                size: download.size,
                isActive: false,
                downloadDate: new Date()
            };

            this.models.push(model);
            this.renderModels();
            
            console.log('✅ Model added to list:', model.name);
        }

        showDownloadsSection() {
            if (this.elements.downloadsSection) {
                this.elements.downloadsSection.style.display = 'block';
            }
        }

        hideDownloadsSection() {
            if (this.downloads.size === 0 && this.elements.downloadsSection) {
                this.elements.downloadsSection.style.display = 'none';
            }
        }

        renderDownloadItem(download) {
            const item = document.createElement('div');
            item.className = `download-item ${download.status}`;
            item.id = `download-${download.id}`;
            item.innerHTML = this.getDownloadItemHTML(download);
            
            this.elements.downloadsList.appendChild(item);
        }

        updateDownloadItem(download) {
            const item = document.getElementById(`download-${download.id}`);
            if (item) {
                item.className = `download-item ${download.status}`;
                item.innerHTML = this.getDownloadItemHTML(download);
            }
        }

        removeDownloadItem(downloadId) {
            const item = document.getElementById(`download-${downloadId}`);
            if (item) {
                item.style.animation = 'slideOutUp 0.3s ease-out forwards';
                setTimeout(() => {
                    item.remove();
                    this.downloads.delete(downloadId);
                    this.hideDownloadsSection();
                }, 300);
            }
        }

        getDownloadItemHTML(download) {
            const statusText = {
                downloading: 'Téléchargement...',
                completed: 'Terminé',
                error: 'Erreur'
            };

            const formatSize = (bytes) => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            const elapsedTime = Math.floor((Date.now() - download.startTime) / 1000);
            const speed = download.downloaded / elapsedTime || 0;

            return `
                <div class="download-header">
                    <div class="download-name">${download.filename}</div>
                    <div class="download-status ${download.status}">${statusText[download.status]}</div>
                </div>
                ${download.status === 'downloading' ? `
                    <div class="download-progress">
                        <div class="download-progress-bar" style="width: ${download.progress}%"></div>
                    </div>
                ` : ''}
                <div class="download-info">
                    <span>${Math.round(download.progress)}%</span>
                    <span>${formatSize(download.downloaded)} / ${formatSize(download.size)}</span>
                    ${download.status === 'downloading' ? `<span>${formatSize(speed)}/s</span>` : ''}
                </div>
                ${download.status === 'error' ? `
                    <div class="download-actions">
                        <button class="btn-icon" onclick="window.modelsSidebarManager.retryDownload('${download.id}')" 
                                data-tooltip="Réessayer" data-tooltip-position="top">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="btn-icon delete" onclick="window.modelsSidebarManager.cancelDownload('${download.id}')" 
                                data-tooltip="Supprimer" data-tooltip-position="top">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            `;
        }

        loadModels() {
            // Simuler le chargement des modèles existants
            setTimeout(() => {
                // Exemple de modèles par défaut
                this.models = [
                    {
                        id: '1',
                        name: 'phi-3-mini-4k-instruct.gguf',
                        path: '/models/phi-3-mini-4k-instruct.gguf',
                        size: 2.3 * 1024 * 1024 * 1024, // 2.3GB
                        isActive: true,
                        downloadDate: new Date(Date.now() - 86400000) // Hier
                    },
                    {
                        id: '2',
                        name: 'llama-2-7b-chat.gguf',
                        path: '/models/llama-2-7b-chat.gguf',
                        size: 3.8 * 1024 * 1024 * 1024, // 3.8GB
                        isActive: false,
                        downloadDate: new Date(Date.now() - 172800000) // Il y a 2 jours
                    }
                ];
                
                this.activeModel = this.models.find(m => m.isActive);
                this.renderModels();
            }, 1000);
        }

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

        getModelItemHTML(model) {
            const formatSize = (bytes) => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            const formatDate = (date) => {
                return date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            };

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
                            ${formatSize(model.size)}
                        </div>
                        <div class="model-path">${model.path}</div>
                    </div>
                    <div class="model-actions">
                        ${!model.isActive ? `
                            <button class="btn-icon load" onclick="window.modelsSidebarManager.loadModel('${model.id}')" 
                                    data-tooltip="Charger ce modèle" data-tooltip-position="top" data-tooltip-variant="primary">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : `
                            <button class="btn-icon" onclick="window.modelsSidebarManager.unloadModel('${model.id}')" 
                                    data-tooltip="Décharger le modèle" data-tooltip-position="top">
                                <i class="fas fa-stop"></i>
                            </button>
                        `}
                        <button class="btn-icon" onclick="window.modelsSidebarManager.showModelInfo('${model.id}')" 
                                data-tooltip="Informations" data-tooltip-position="top">
                            <i class="fas fa-info"></i>
                        </button>
                        <button class="btn-icon delete" onclick="window.modelsSidebarManager.deleteModel('${model.id}')" 
                                data-tooltip="Supprimer" data-tooltip-position="top" data-tooltip-variant="danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        loadModel(modelId) {
            const model = this.models.find(m => m.id === modelId);
            if (!model) return;

            // Décharger l'ancien modèle
            if (this.activeModel) {
                this.activeModel.isActive = false;
            }

            // Charger le nouveau
            model.isActive = true;
            this.activeModel = model;
            
            this.renderModels();
            console.log('🔄 Model loaded:', model.name);
            
            // Notifier les autres composants
            document.dispatchEvent(new CustomEvent('modelChanged', {
                detail: { model }
            }));
        }

        unloadModel(modelId) {
            const model = this.models.find(m => m.id === modelId);
            if (!model) return;

            model.isActive = false;
            this.activeModel = null;
            
            this.renderModels();
            console.log('⏹️ Model unloaded:', model.name);
            
            document.dispatchEvent(new CustomEvent('modelUnloaded', {
                detail: { model }
            }));
        }

        deleteModel(modelId) {
            const model = this.models.find(m => m.id === modelId);
            if (!model) return;

            if (confirm(`Êtes-vous sûr de vouloir supprimer "${model.name}" ?`)) {
                this.models = this.models.filter(m => m.id !== modelId);
                
                if (model.isActive) {
                    this.activeModel = null;
                }
                
                this.renderModels();
                console.log('🗑️ Model deleted:', model.name);
            }
        }

        showModelInfo(modelId) {
            const model = this.models.find(m => m.id === modelId);
            if (!model) return;

            const formatSize = (bytes) => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            alert(`Informations du modèle:
            
Nom: ${model.name}
Taille: ${formatSize(model.size)}
Chemin: ${model.path}
Statut: ${model.isActive ? 'Actif' : 'Inactif'}
Téléchargé le: ${model.downloadDate.toLocaleDateString('fr-FR')}`);
        }

        retryDownload(downloadId) {
            const download = this.downloads.get(downloadId);
            if (download) {
                download.status = 'downloading';
                download.progress = 0;
                download.startTime = Date.now();
                this.simulateDownload(downloadId);
            }
        }

        cancelDownload(downloadId) {
            this.removeDownloadItem(downloadId);
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
