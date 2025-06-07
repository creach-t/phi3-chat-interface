// Logique spécifique au composant header
(function() {
    'use strict';

    console.log('🎯 Header component loaded');

    class HeaderManager {
        constructor() {
            this.buttons = new Map();
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;

            // Attendre un peu pour s'assurer que le DOM est prêt
            setTimeout(() => {
                this.setupButtons();
                this.setupTooltips();
                this.setupEventListeners();
                this.updateThemeToggle();
                
                this.initialized = true;
                console.log('✅ Header component initialized');
            }, 100);
        }

        setupButtons() {
            // Configuration des boutons
            const buttonConfigs = [
                {
                    id: 'theme-toggle',
                    handler: this.toggleTheme.bind(this),
                    tooltip: 'Basculer le thème',
                    position: 'bottom'
                },
                {
                    id: 'models-btn',
                    handler: this.showModels.bind(this),
                    tooltip: 'Gestion des modèles',
                    position: 'bottom'
                },
                {
                    id: 'settings-btn',
                    handler: this.showSettings.bind(this),
                    tooltip: 'Paramètres du modèle',
                    position: 'bottom'
                },
                {
                    id: 'preprompts-btn',
                    handler: this.showPreprompts.bind(this),
                    tooltip: 'Preprompts',
                    position: 'bottom'
                },
                {
                    id: 'logout-btn',
                    handler: this.logout.bind(this),
                    tooltip: 'Déconnexion',
                    position: 'bottom',
                    variant: 'danger'
                }
            ];

            buttonConfigs.forEach(config => {
                const button = document.getElementById(config.id);
                if (button) {
                    // Supprimer les anciens event listeners s'ils existent
                    button.replaceWith(button.cloneNode(true));
                    const newButton = document.getElementById(config.id);
                    
                    this.buttons.set(config.id, {
                        element: newButton,
                        config
                    });

                    // Ajouter l'event listener
                    newButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`🖱️ Button clicked: ${config.id}`);
                        config.handler();
                    });

                    console.log(`✅ Button configured: ${config.id}`);
                }
            });
        }

        setupTooltips() {
            // Attendre que les tooltips soient prêts
            setTimeout(() => {
                this.buttons.forEach(({ element, config }) => {
                    if (window.createTooltip) {
                        window.createTooltip(element, {
                            text: config.tooltip,
                            position: config.position || 'bottom',
                            variant: config.variant || 'default'
                        });
                    }
                });
            }, 200);
        }

        setupEventListeners() {
            // Écouter les changements de thème
            document.addEventListener('themeChanged', (e) => {
                this.updateThemeToggle();
            });

            // Raccourcis clavier
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'm':
                            e.preventDefault();
                            this.showModels();
                            break;
                        case ',':
                            e.preventDefault();
                            this.showSettings();
                            break;
                        case 'p':
                            e.preventDefault();
                            this.showPreprompts();
                            break;
                        case 'd':
                            e.preventDefault();
                            this.toggleTheme();
                            break;
                    }
                }
            });
        }

        // Handlers des boutons
        toggleTheme() {
            console.log('🎨 Toggle theme called');
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            this.updateThemeToggle();
            
            // Émettre un événement
            document.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: newTheme }
            }));

            console.log(`🎨 Theme switched to: ${newTheme}`);
        }

        showModels() {
            console.log('🎛️ Show models called');
            this.toggleSidebar('models-sidebar', 'models-btn');
        }

        showSettings() {
            console.log('⚙️ Show settings called');
            this.toggleSidebar('settings-sidebar', 'settings-btn');
        }

        showPreprompts() {
            console.log('📝 Show preprompts called');
            this.toggleSidebar('preprompts-sidebar', 'preprompts-btn');
        }

        logout() {
            console.log('👋 Logout called');
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                this.performLogout();
            }
        }

        // Méthodes utilitaires
        toggleSidebar(sidebarId, buttonId) {
            console.log(`🔄 Toggle sidebar: ${sidebarId}`);
            const sidebar = document.getElementById(sidebarId);
            if (!sidebar) {
                console.warn(`Sidebar not found: ${sidebarId}`);
                return;
            }

            const isHidden = sidebar.classList.contains('hidden');
            
            // Fermer toutes les autres sidebars
            this.closeAllSidebars();
            
            if (isHidden) {
                sidebar.classList.remove('hidden');
                this.setButtonActive(buttonId, true);
                console.log(`✅ Sidebar opened: ${sidebarId}`);
            }
        }

        closeAllSidebars() {
            const sidebars = document.querySelectorAll('.sidebar');
            sidebars.forEach(sidebar => {
                sidebar.classList.add('hidden');
            });

            // Désactiver tous les boutons
            this.buttons.forEach(({ element }) => {
                element.classList.remove('active');
            });
        }

        setButtonActive(buttonId, active) {
            const button = this.buttons.get(buttonId);
            if (button) {
                if (active) {
                    button.element.classList.add('active');
                } else {
                    button.element.classList.remove('active');
                }
            }
        }

        setButtonLoading(buttonId, loading) {
            const button = this.buttons.get(buttonId);
            if (button) {
                if (loading) {
                    button.element.classList.add('loading');
                    button.element.disabled = true;
                } else {
                    button.element.classList.remove('loading');
                    button.element.disabled = false;
                }
            }
        }

        updateThemeToggle() {
            const themeButton = this.buttons.get('theme-toggle');
            if (themeButton) {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const icon = themeButton.element.querySelector('i');
                
                if (icon) {
                    if (currentTheme === 'dark') {
                        icon.className = 'fas fa-sun';
                        if (window.updateTooltip) {
                            window.updateTooltip(themeButton.element, 'Passer au thème clair');
                        }
                    } else {
                        icon.className = 'fas fa-moon';
                        if (window.updateTooltip) {
                            window.updateTooltip(themeButton.element, 'Passer au thème sombre');
                        }
                    }
                }
            }
        }

        performLogout() {
            // Animation de déconnexion
            this.setButtonLoading('logout-btn', true);
            
            setTimeout(() => {
                const loginPage = document.getElementById('login-page');
                const chatPage = document.getElementById('chat-page');

                if (loginPage && chatPage) {
                    chatPage.classList.add('hidden');
                    loginPage.classList.remove('hidden');
                    
                    // Nettoyer l'état
                    this.closeAllSidebars();
                    
                    // Émettre un événement
                    document.dispatchEvent(new CustomEvent('userLoggedOut'));
                    console.log('👋 User logged out');
                }
                
                this.setButtonLoading('logout-btn', false);
            }, 1000);
        }

        // Méthode pour ajouter des badges de notification
        addNotificationBadge(buttonId, count) {
            const button = this.buttons.get(buttonId);
            if (button) {
                let badge = button.element.querySelector('.notification-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    button.element.appendChild(badge);
                }
                badge.textContent = count > 99 ? '99+' : count.toString();
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        }

        removeNotificationBadge(buttonId) {
            const button = this.buttons.get(buttonId);
            if (button) {
                const badge = button.element.querySelector('.notification-badge');
                if (badge) {
                    badge.remove();
                }
            }
        }
    }

    // Instance globale
    let headerManager = null;

    // Initialisation
    function initHeader() {
        if (headerManager) {
            console.log('Header manager already exists');
            return;
        }
        
        headerManager = new HeaderManager();
        headerManager.init();
        
        // Exposer globalement
        window.headerManager = headerManager;
        window.showSettings = () => headerManager?.showSettings();
        window.showModels = () => headerManager?.showModels();
        window.showPreprompts = () => headerManager?.showPreprompts();
    }

    // Écouter l'événement de chargement du composant
    window.addEventListener('componentLoaded', function(e) {
        if (e.detail.componentPath.includes('header')) {
            console.log('🎯 Header component loaded event received');
            initHeader();
        }
    });

    // Si le composant est déjà chargé, l'initialiser
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                if (document.querySelector('.main-header')) {
                    initHeader();
                }
            }, 200);
        });
    } else {
        setTimeout(() => {
            if (document.querySelector('.main-header')) {
                initHeader();
            }
        }, 200);
    }

})();
