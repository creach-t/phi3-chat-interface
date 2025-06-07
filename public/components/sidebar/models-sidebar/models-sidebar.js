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
            const validation = this.elements.modelUrl?.parentNode?.querySelector('.url-validation');
            if (validation) {
                validation.remove();
            }
        }

        startDownload() {
            const url = this.elements.modelUrl.value.trim();
            const customName = this.elements.modelFilename.value.trim();
            
            if (!this.isValidModelUrl(url)) {
                this.showError('URL invalide');
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

            // Ajouter à la liste des téléchargements
            this.downloads.set(downloadId, download);
            this.showDownloadsSection();
            this.renderDownloadItem(download);

            // Simuler le téléchargement (à remplacer par la vraie logique)
            this.simulateDownload(downloadId);

            // Nettoyer le formulaire
            this.clearForm();
        }

        extractFilenameFromUrl(url) {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                return pathParts[pathParts.length - 1] || 'model.gguf';
            } catch {
                return 'model.gguf';
            }
        }

        simulateDownload(downloadId) {
            const download = this.downloads.get(downloadId);
            if (!download) return;

            // Simuler une taille de fichier
            download.size = Math.random() * 1000000000 + 100000000; // 100MB à 1GB

            const interval = setInterval(() => {
                if (download.status !== 'downloading') {
                    clearInterval(interval);
                    return;
                }

                // Simuler le progrès
                const increment = Math.random() * 0.05 + 0.01; // 1-6% par step
                download.progress = Math.min(download.progress + increment, 1);
                download.downloaded = download.progress * download.size;

                this.updateDownloadItem(download);

                // Finaliser le téléchargement
                if (download.progress >= 1) {
                    download.status = 'completed';
                    download.progress = 1;
                    this.updateDownloadItem(download);
                    
                    // Ajouter aux modèles après un délai
                    setTimeout(() => {
                        this.addToModels(download);
                        this.removeDownload(downloadId);
                    }, 1000);
                    
                    clearInterval(interval);
                }
            }, 200);

            // Simuler une erreur occasionnelle
            if (Math.random() < 0.1) { // 10% de chance d'erreur
                setTimeout(() => {
                    download.status = 'error';
                    this.updateDownloadItem(download);
                    clearInterval(interval);
                }, Math.random() * 3000 + 1000);
            }
        }

        addToModels(download) {
            const model = {
                id: Date.now().toString(),
                name: download.filename,
                path: `/models/${download.filename}`,
                size: download.size,
                dateAdded: new Date(),
                active: false
            };

            this.models.push(model);
            this.renderModels();
            this.showSuccess(`Modèle "${download.filename}" ajouté avec succès`);
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
            
            if (this.elements.downloadsList) {
                this.elements.downloadsList.appendChild(item);
            }
        }

        updateDownloadItem(download) {
            const item = document.getElementById(`download-${download.id}`);
            if (item) {
                item.className = `download-item ${download.status}`;
                item.innerHTML = this.getDownloadItemHTML(download);
            }
        }

        getDownloadItemHTML(download) {
            const progressPercent = Math.round(download.progress * 100);
            const downloadedMB = (download.downloaded / (1024 * 1024)).toFixed(1);
            const totalMB = (download.size / (1024 * 1024)).toFixed(1);
            
            let statusText = 'Téléchargement...';
            if (download.status === 'completed') statusText = 'Terminé';
            if (download.status === 'error') statusText = 'Erreur';

            return `
                <div class="download-header">
                    <div class="download-name">${download.filename}</div>
                    <div class="download-status ${download.status}">${statusText}</div>
                </div>
                ${download.status === 'downloading' ? `
                    <div class="download-progress">
                        <div class="download-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                ` : ''}
                <div class="download-info">
                    <span>${progressPercent}%</span>
                    <span>${downloadedMB} MB / ${totalMB} MB</span>
                </div>
                ${download.status === 'error' ? `
                    <div class="download-actions">
                        <button class="btn-icon" onclick="window.modelsSidebarManager.retryDownload('${download.id}')" data-tooltip="Réessayer">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="btn-icon delete" onclick="window.modelsSidebarManager.removeDownload('${download.id}')" data-tooltip="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            `;
        }

        removeDownload(downloadId) {
            this.downloads.delete(downloadId);
            const item = document.getElementById(`download-${downloadId}`);
            if (item) {
                item.remove();
            }
            this.hideDownloadsSection();
        }

        retryDownload(downloadId) {
            const download = this.downloads.get(downloadId);
            if (download) {
                download.status = 'downloading';
                download.progress = 0;
                download.downloaded = 0;
                this.updateDownloadItem(download);
                this.simulateDownload(downloadId);
            }
        }

        async loadModels() {
            // Simuler le chargement des modèles existants
            setTimeout(() => {
                // Modèles d'exemple
                this.models = [
                    {
                        id: '1',
                        name: 'phi-3-mini-4k-instruct.gguf',
                        path: '/models/phi-3-mini-4k-instruct.gguf',
                        size: 2400000000,
                        dateAdded: new Date(Date.now() - 86400000),
                        active: true
                    },
                    {
                        id: '2',
                        name: 'llama-2-7b-chat.gguf',
                        path: '/models/llama-2-7b-chat.gguf',
                        size: 3800000000,
                        dateAdded: new Date(Date.now() - 172800000),
                        active: false
                    }
                ];
                
                this.renderModels();
            }, 500);
        }

        renderModels() {
            if (!this.elements.modelsList) return;

            if (this.models.length === 0) {
                this.elements.modelsList.innerHTML = `
                    <div class="models-empty">
                        <i class="fas fa-cube"></i>
                        <h5>Aucun modèle disponible</h5>
                        <p>Téléchargez votre premier modèle depuis Hugging Face pour commencer.</p>
                    </div>
                `;
                return;
            }

            this.elements.modelsList.innerHTML = this.models.map(model => this.getModelItemHTML(model)).join('');
        }

        getModelItemHTML(model) {
            const sizeMB = (model.size / (1024 * 1024)).toFixed(0);
            const dateStr = model.dateAdded.toLocaleDateString();
            
            return `
                <div class="model-item ${model.active ? 'active' : ''}" data-model-id="${model.id}">
                    <div class="model-header">
                        <div class="model-name ${model.active ? 'active' : ''}">
                            <i class="fas fa-cube"></i>
                            ${model.name}
                        </div>
                        <div class="model-badge ${model.active ? 'active' : 'inactive'}">
                            ${model.active ? 'Actif' : 'Inactif'}
                        </div>
                    </div>
                    <div class="model-info">
                        <div class="model-size">
                            <i class="fas fa-hdd"></i>
                            ${sizeMB} MB
                        </div>
                        <div class="model-path">${model.path}</div>
                    </div>
                    <div class="model-actions">
                        ${!model.active ? `
                            <button class="btn-icon load" onclick="window.modelsSidebarManager.loadModel('${model.id}')" 
                                    data-tooltip="Charger ce modèle" data-tooltip-variant="primary">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : `
                            <button class="btn-icon" onclick="window.modelsSidebarManager.unloadModel('${model.id}')" 
                                    data-tooltip="Décharger le modèle">
                                <i class="fas fa-stop"></i>
                            </button>
                        `}
                        <button class="btn-icon" onclick="window.modelsSidebarManager.showModelInfo('${model.id}')" 
                                data-tooltip="Informations du modèle">
                            <i class="fas fa-info"></i>
                        </button>
                        <button class="btn-icon delete" onclick="window.modelsSidebarManager.deleteModel('${model.id}')" 
                                data-tooltip="Supprimer le modèle" data-tooltip-variant="danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        loadModel(modelId) {
            // Décharger tous les autres modèles
            this.models.forEach(model => model.active = false);
            
            // Charger le modèle sélectionné
            const model = this.models.find(m => m.id === modelId);
            if (model) {
                model.active = true;
                this.activeModel = model;
                this.renderModels();
                this.showSuccess(`Modèle "${model.name}" chargé`);
                
                // Émettre un événement
                document.dispatchEvent(new CustomEvent('modelLoaded', {
                    detail: { model }
                }));
            }
        }

        unloadModel(modelId) {
            const model = this.models.find(m => m.id === modelId);
            if (model) {
                model.active = false;
                this.activeModel = null;
                this.renderModels();
                this.showSuccess(`Modèle "${model.name}" déchargé`);
                
                // Émettre un événement
                document.dispatchEvent(new CustomEvent('modelUnloaded', {
                    detail: { model }
                }));
            }
        }

        deleteModel(modelId) {
            const model = this.models.find(m => m.id === modelId);
            if (model && confirm(`Êtes-vous sûr de vouloir supprimer "${model.name}" ?`)) {
                this.models = this.models.filter(m => m.id !== modelId);
                if (model.active) {
                    this.activeModel = null;
                }
                this.renderModels();
                this.showSuccess(`Modèle "${model.name}" supprimé`);
            }
        }

        showModelInfo(modelId) {
            const model = this.models.find(m => m.id === modelId);
            if (model) {
                const sizeMB = (model.size / (1024 * 1024)).toFixed(1);
                alert(`Informations du modèle:\n\nNom: ${model.name}\nTaille: ${sizeMB} MB\nChemin: ${model.path}\nAjouté le: ${model.dateAdded.toLocaleString()}\nStatut: ${model.active ? 'Actif' : 'Inactif'}`);
            }
        }

        clearForm() {
            if (this.elements.modelUrl) this.elements.modelUrl.value = '';
            if (this.elements.modelFilename) this.elements.modelFilename.value = '';
            this.hideUrlValidation();
            this.elements.downloadBtn.disabled = true;
        }

        closeSidebar() {
            const sidebar = document.getElementById('models-sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
                
                // Notifier le header manager
                if (window.headerManager) {
                    window.headerManager.setButtonActive('models-btn', false);
                }
            }
        }

        showSuccess(message) {
            console.log(`✅ ${message}`);
            // TODO: Implémenter un système de notifications toast
        }

        showError(message) {
            console.error(`❌ ${message}`);
            // TODO: Implémenter un système de notifications toast
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

    // Si le composant est déjà chargé
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
