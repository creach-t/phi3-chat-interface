// Logique spécifique à la sidebar des paramètres
(function() {
    'use strict';

    console.log('⚙️ Settings sidebar component loaded');

    class SettingsSidebarManager {
        constructor() {
            this.initialized = false;
            this.defaultParams = {
                temperature: 0.7,
                maxTokens: 512,
                topP: 0.95,
                contextSize: 2048,
                repeatPenalty: 1.1,
                seed: -1
            };
            this.currentParams = { ...this.defaultParams };
            this.hasUnsavedChanges = false;
        }

        init() {
            if (this.initialized) return;

            this.setupElements();
            this.setupEventListeners();
            this.loadSavedParams();
            this.updateAllDisplays();
            
            this.initialized = true;
            console.log('✅ Settings sidebar component initialized');
        }

        setupElements() {
            this.elements = {
                // Sliders
                temperatureSlider: document.getElementById('temperature-slider'),
                maxTokensSlider: document.getElementById('max-tokens-slider'),
                topPSlider: document.getElementById('top-p-slider'),
                contextSizeSlider: document.getElementById('context-size-slider'),
                repeatPenaltySlider: document.getElementById('repeat-penalty-slider'),
                
                // Value displays
                temperatureValue: document.getElementById('temperature-value'),
                maxTokensValue: document.getElementById('max-tokens-value'),
                topPValue: document.getElementById('top-p-value'),
                contextSizeValue: document.getElementById('context-size-value'),
                repeatPenaltyValue: document.getElementById('repeat-penalty-value'),
                
                // Other inputs
                seedInput: document.getElementById('seed-input'),
                
                // Buttons
                resetBtn: document.getElementById('reset-params'),
                saveBtn: document.getElementById('save-params'),
                closeBtn: document.querySelector('#settings-sidebar .close-btn')
            };
        }

        setupEventListeners() {
            // Sliders
            this.setupSlider('temperature', this.elements.temperatureSlider, this.elements.temperatureValue);
            this.setupSlider('maxTokens', this.elements.maxTokensSlider, this.elements.maxTokensValue);
            this.setupSlider('topP', this.elements.topPSlider, this.elements.topPValue);
            this.setupSlider('contextSize', this.elements.contextSizeSlider, this.elements.contextSizeValue);
            this.setupSlider('repeatPenalty', this.elements.repeatPenaltySlider, this.elements.repeatPenaltyValue);
            
            // Seed input
            if (this.elements.seedInput) {
                this.elements.seedInput.addEventListener('input', () => {
                    this.currentParams.seed = parseInt(this.elements.seedInput.value);
                    this.markAsModified('seed');
                    this.updateButtons();
                });
            }

            // Buttons
            if (this.elements.resetBtn) {
                this.elements.resetBtn.addEventListener('click', () => {
                    this.resetToDefaults();
                });
            }

            if (this.elements.saveBtn) {
                this.elements.saveBtn.addEventListener('click', () => {
                    this.saveParams();
                });
            }

            // Close button
            if (this.elements.closeBtn) {
                this.elements.closeBtn.addEventListener('click', () => {
                    this.closeSidebar();
                });
            }

            // Raccourci clavier pour sauvegarder
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's' && this.isSidebarOpen()) {
                    e.preventDefault();
                    this.saveParams();
                }
            });
        }

        setupSlider(paramName, sliderElement, displayElement) {
            if (!sliderElement || !displayElement) return;

            const updateDisplay = () => {
                const value = parseFloat(sliderElement.value);
                this.currentParams[paramName] = value;
                
                // Formater l'affichage selon le type
                let displayValue;
                if (paramName === 'temperature' || paramName === 'topP' || paramName === 'repeatPenalty') {
                    displayValue = value.toFixed(1);
                } else {
                    displayValue = value.toString();
                }
                
                displayElement.textContent = displayValue;
                
                // Animation de changement
                displayElement.classList.add('changed');
                setTimeout(() => {
                    displayElement.classList.remove('changed');
                }, 300);
                
                this.markAsModified(paramName);
                this.updateButtons();
                this.updateModelStatus();
            };

            sliderElement.addEventListener('input', updateDisplay);
            sliderElement.addEventListener('change', updateDisplay);
        }

        markAsModified(paramName) {
            const paramGroups = {
                temperature: this.elements.temperatureSlider?.closest('.settings-group'),
                maxTokens: this.elements.maxTokensSlider?.closest('.settings-group'),
                topP: this.elements.topPSlider?.closest('.settings-group'),
                contextSize: this.elements.contextSizeSlider?.closest('.settings-group'),
                repeatPenalty: this.elements.repeatPenaltySlider?.closest('.settings-group'),
                seed: this.elements.seedInput?.closest('.settings-group')
            };

            const group = paramGroups[paramName];
            if (group) {
                group.classList.add('modified');
            }

            this.hasUnsavedChanges = true;
        }

        clearModifiedMarks() {
            const groups = document.querySelectorAll('#settings-sidebar .settings-group.modified');
            groups.forEach(group => {
                group.classList.remove('modified');
            });
            this.hasUnsavedChanges = false;
        }

        updateButtons() {
            if (this.elements.saveBtn) {
                this.elements.saveBtn.disabled = !this.hasUnsavedChanges;
                this.elements.saveBtn.classList.toggle('pulse', this.hasUnsavedChanges);
            }

            if (this.elements.resetBtn) {
                const hasChanges = !this.isEqualToDefaults();
                this.elements.resetBtn.disabled = !hasChanges;
            }
        }

        isEqualToDefaults() {
            return Object.keys(this.defaultParams).every(key => 
                this.currentParams[key] === this.defaultParams[key]
            );
        }

        updateAllDisplays() {
            // Mettre à jour tous les sliders et displays
            if (this.elements.temperatureSlider) {
                this.elements.temperatureSlider.value = this.currentParams.temperature;
                this.elements.temperatureValue.textContent = this.currentParams.temperature.toFixed(1);
            }

            if (this.elements.maxTokensSlider) {
                this.elements.maxTokensSlider.value = this.currentParams.maxTokens;
                this.elements.maxTokensValue.textContent = this.currentParams.maxTokens.toString();
            }

            if (this.elements.topPSlider) {
                this.elements.topPSlider.value = this.currentParams.topP;
                this.elements.topPValue.textContent = this.currentParams.topP.toFixed(2);
            }

            if (this.elements.contextSizeSlider) {
                this.elements.contextSizeSlider.value = this.currentParams.contextSize;
                this.elements.contextSizeValue.textContent = this.currentParams.contextSize.toString();
            }

            if (this.elements.repeatPenaltySlider) {
                this.elements.repeatPenaltySlider.value = this.currentParams.repeatPenalty;
                this.elements.repeatPenaltyValue.textContent = this.currentParams.repeatPenalty.toFixed(1);
            }

            if (this.elements.seedInput) {
                this.elements.seedInput.value = this.currentParams.seed;
            }

            this.updateModelStatus();
            this.updateButtons();
        }

        updateModelStatus() {
            // Mettre à jour l'affichage des paramètres dans le footer
            const statusElement = document.getElementById('current-params');
            if (statusElement) {
                const temp = this.currentParams.temperature.toFixed(1);
                const tokens = this.currentParams.maxTokens;
                statusElement.textContent = `T: ${temp} | Tokens: ${tokens}`;
            }
        }

        resetToDefaults() {
            if (confirm('Voulez-vous vraiment réinitialiser tous les paramètres aux valeurs par défaut ?')) {
                this.currentParams = { ...this.defaultParams };
                this.updateAllDisplays();
                this.clearModifiedMarks();
                this.showNotification('Paramètres réinitialisés', 'success');
                console.log('🔄 Parameters reset to defaults');
            }
        }

        async saveParams() {
            if (!this.hasUnsavedChanges) return;

            try {
                // Sauvegarder en localStorage
                localStorage.setItem('modelParams', JSON.stringify(this.currentParams));
                
                // Sauvegarder sur le serveur si possible
                await this.saveToServer();
                
                this.clearModifiedMarks();
                this.showNotification('Paramètres sauvegardés', 'success');
                console.log('💾 Parameters saved:', this.currentParams);
                
                // Émettre un événement
                document.dispatchEvent(new CustomEvent('paramsChanged', {
                    detail: { params: this.currentParams }
                }));

            } catch (error) {
                console.error('❌ Failed to save parameters:', error);
                this.showNotification('Erreur lors de la sauvegarde', 'error');
            }
        }

        async saveToServer() {
            try {
                const response = await fetch('/api/model-params', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(this.currentParams)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                console.log('✅ Parameters saved to server');
            } catch (error) {
                console.log('ℹ️ Server save failed, using localStorage only');
                // Ce n'est pas une erreur fatale
            }
        }

        loadSavedParams() {
            try {
                const saved = localStorage.getItem('modelParams');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.currentParams = { ...this.defaultParams, ...parsed };
                    console.log('📁 Loaded saved parameters');
                }
            } catch (error) {
                console.warn('⚠️ Failed to load saved parameters:', error);
                this.currentParams = { ...this.defaultParams };
            }
        }

        showNotification(message, type = 'info') {
            // Créer ou mettre à jour l'indicateur
            let indicator = document.querySelector('.save-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'save-indicator';
                document.querySelector('#settings-sidebar').appendChild(indicator);
            }

            indicator.textContent = message;
            indicator.className = `save-indicator ${type}`;
            
            // Afficher
            setTimeout(() => indicator.classList.add('show'), 10);
            
            // Masquer après 2 secondes
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }

        isSidebarOpen() {
            const sidebar = document.getElementById('settings-sidebar');
            return sidebar && !sidebar.classList.contains('hidden');
        }

        closeSidebar() {
            if (this.hasUnsavedChanges) {
                const confirm = window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?');
                if (!confirm) return;
            }

            const sidebar = document.getElementById('settings-sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
                
                // Désactiver le bouton header
                if (window.headerManager) {
                    window.headerManager.setButtonActive('settings-btn', false);
                }
            }
        }

        // Méthodes pour les presets (extension future)
        applyPreset(presetName) {
            const presets = {
                conservative: {
                    temperature: 0.3,
                    maxTokens: 256,
                    topP: 0.85,
                    contextSize: 1024,
                    repeatPenalty: 1.2
                },
                balanced: {
                    temperature: 0.7,
                    maxTokens: 512,
                    topP: 0.95,
                    contextSize: 2048,
                    repeatPenalty: 1.1
                },
                creative: {
                    temperature: 1.2,
                    maxTokens: 1024,
                    topP: 0.98,
                    contextSize: 4096,
                    repeatPenalty: 1.0
                }
            };

            const preset = presets[presetName];
            if (preset) {
                this.currentParams = { ...this.currentParams, ...preset };
                this.updateAllDisplays();
                this.hasUnsavedChanges = true;
                this.updateButtons();
                
                // Marquer tous les groupes comme modifiés
                Object.keys(preset).forEach(key => {
                    this.markAsModified(key);
                });

                console.log(`🎨 Applied preset: ${presetName}`);
            }
        }

        // Getter pour accéder aux paramètres depuis l'extérieur
        getParams() {
            return { ...this.currentParams };
        }
    }

    // Instance globale
    let settingsSidebarManager = null;

    // Initialisation
    function initSettingsSidebar() {
        if (settingsSidebarManager) return;
        
        settingsSidebarManager = new SettingsSidebarManager();
        settingsSidebarManager.init();
        
        // Exposer globalement
        window.settingsSidebarManager = settingsSidebarManager;
    }

    // Écouter l'événement de chargement du composant
    window.addEventListener('componentLoaded', function(e) {
        if (e.detail.componentPath.includes('settings-sidebar')) {
            console.log('⚙️ Settings sidebar component loaded event received');
            initSettingsSidebar();
        }
    });

    // Si le composant est déjà chargé, l'initialiser
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                if (document.querySelector('#settings-sidebar')) {
                    initSettingsSidebar();
                }
            }, 200);
        });
    } else {
        setTimeout(() => {
            if (document.querySelector('#settings-sidebar')) {
                initSettingsSidebar();
            }
        }, 200);
    }

})();
