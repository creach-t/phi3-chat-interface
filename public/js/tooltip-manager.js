// Système de tooltips JavaScript pour faciliter l'usage
(function() {
    'use strict';

    console.log('🎯 Tooltip system loaded');

    class TooltipManager {
        constructor() {
            this.tooltips = new Map();
            this.init();
        }

        init() {
            // Auto-initialiser les tooltips avec attribut data-tooltip
            this.initDataTooltips();
            
            // Observer pour les nouveaux éléments
            this.observeNewElements();
            
            console.log('✅ Tooltip manager initialized');
        }

        /**
         * Initialise les tooltips basés sur l'attribut data-tooltip
         */
        initDataTooltips() {
            const elements = document.querySelectorAll('[data-tooltip]');
            elements.forEach(element => {
                this.createTooltip(element, {
                    text: element.getAttribute('data-tooltip'),
                    position: element.getAttribute('data-tooltip-position') || 'top',
                    variant: element.getAttribute('data-tooltip-variant') || 'default',
                    size: element.getAttribute('data-tooltip-size') || 'default',
                    delay: element.getAttribute('data-tooltip-delay') === 'true'
                });
            });
        }

        /**
         * Crée un tooltip sur un élément
         * @param {HTMLElement} element - Élément sur lequel attacher le tooltip
         * @param {Object} options - Options du tooltip
         */
        createTooltip(element, options = {}) {
            const {
                text,
                position = 'top',
                variant = 'default',
                size = 'default',
                delay = false,
                noArrow = false
            } = options;

            if (!element || !text) {
                console.warn('Tooltip: element ou text manquant');
                return;
            }

            // Supprimer un tooltip existant
            this.removeTooltip(element);

            // Ajouter les classes nécessaires
            element.classList.add('tooltip');
            
            // Ajouter les classes de variante
            if (position !== 'top') {
                element.classList.add(`tooltip-${position}`);
            }
            
            if (variant !== 'default') {
                element.classList.add(`tooltip-${variant}`);
            }
            
            if (size !== 'default') {
                element.classList.add(`tooltip-${size}`);
            }
            
            if (delay) {
                element.classList.add('tooltip-delayed');
            }
            
            if (noArrow) {
                element.classList.add('tooltip-no-arrow');
            }

            // Créer l'élément de texte du tooltip
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltip-text';
            tooltipText.textContent = text;
            
            // Ajouter le tooltip à l'élément
            element.appendChild(tooltipText);
            
            // Stocker la référence
            this.tooltips.set(element, {
                element: tooltipText,
                options
            });

            return tooltipText;
        }

        /**
         * Met à jour le texte d'un tooltip
         * @param {HTMLElement} element - Élément contenant le tooltip
         * @param {string} newText - Nouveau texte
         */
        updateTooltip(element, newText) {
            const tooltip = this.tooltips.get(element);
            if (tooltip) {
                tooltip.element.textContent = newText;
            }
        }

        /**
         * Supprime un tooltip
         * @param {HTMLElement} element - Élément contenant le tooltip
         */
        removeTooltip(element) {
            const tooltip = this.tooltips.get(element);
            if (tooltip) {
                tooltip.element.remove();
                this.tooltips.delete(element);
                
                // Supprimer les classes tooltip
                element.classList.remove(
                    'tooltip', 
                    'tooltip-top', 'tooltip-bottom', 'tooltip-left', 'tooltip-right',
                    'tooltip-primary', 'tooltip-success', 'tooltip-warning', 'tooltip-danger',
                    'tooltip-sm', 'tooltip-lg',
                    'tooltip-delayed', 'tooltip-no-arrow'
                );
            }
        }

        /**
         * Observer pour détecter les nouveaux éléments avec data-tooltip
         */
        observeNewElements() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Vérifier l'élément lui-même
                            if (node.hasAttribute && node.hasAttribute('data-tooltip')) {
                                this.createTooltip(node, {
                                    text: node.getAttribute('data-tooltip'),
                                    position: node.getAttribute('data-tooltip-position') || 'top',
                                    variant: node.getAttribute('data-tooltip-variant') || 'default',
                                    size: node.getAttribute('data-tooltip-size') || 'default',
                                    delay: node.getAttribute('data-tooltip-delay') === 'true'
                                });
                            }
                            
                            // Vérifier les enfants
                            if (node.querySelectorAll) {
                                const children = node.querySelectorAll('[data-tooltip]');
                                children.forEach(child => {
                                    this.createTooltip(child, {
                                        text: child.getAttribute('data-tooltip'),
                                        position: child.getAttribute('data-tooltip-position') || 'top',
                                        variant: child.getAttribute('data-tooltip-variant') || 'default',
                                        size: child.getAttribute('data-tooltip-size') || 'default',
                                        delay: child.getAttribute('data-tooltip-delay') === 'true'
                                    });
                                });
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        /**
         * Méthode utilitaire pour convertir les title en tooltips
         */
        convertTitleToTooltips() {
            const elementsWithTitle = document.querySelectorAll('[title]');
            elementsWithTitle.forEach(element => {
                const title = element.getAttribute('title');
                if (title) {
                    element.removeAttribute('title');
                    element.setAttribute('data-tooltip', title);
                    this.createTooltip(element, { text: title });
                }
            });
        }

        /**
         * Applique les tooltips aux boutons de contrôle existants
         */
        initControlButtonTooltips() {
            // Boutons du header
            const headerButtons = [
                { selector: '#theme-toggle', text: 'Basculer le thème', position: 'bottom' },
                { selector: '#models-btn', text: 'Gestion des modèles', position: 'bottom' },
                { selector: '#settings-btn', text: 'Paramètres du modèle', position: 'bottom' },
                { selector: '#preprompts-btn', text: 'Preprompts', position: 'bottom' },
                { selector: '#logout-btn', text: 'Déconnexion', position: 'bottom', variant: 'danger' }
            ];

            headerButtons.forEach(({ selector, text, position, variant }) => {
                const element = document.querySelector(selector);
                if (element) {
                    // Supprimer l'ancien title si présent
                    element.removeAttribute('title');
                    this.createTooltip(element, { 
                        text, 
                        position: position || 'top',
                        variant: variant || 'default'
                    });
                }
            });
        }
    }

    // Instance globale
    window.tooltipManager = new TooltipManager();

    // Utilitaires globaux
    window.createTooltip = function(element, options) {
        return window.tooltipManager.createTooltip(element, options);
    };

    window.updateTooltip = function(element, newText) {
        return window.tooltipManager.updateTooltip(element, newText);
    };

    window.removeTooltip = function(element) {
        return window.tooltipManager.removeTooltip(element);
    };

    // Initialiser les tooltips quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                window.tooltipManager.initControlButtonTooltips();
            }, 500);
        });
    } else {
        setTimeout(() => {
            window.tooltipManager.initControlButtonTooltips();
        }, 500);
    }

    // Réinitialiser les tooltips quand l'utilisateur se connecte
    window.addEventListener('userLoggedIn', function() {
        setTimeout(() => {
            window.tooltipManager.initControlButtonTooltips();
        }, 100);
    });

    // Exposer pour les tests
    window.testTooltips = function() {
        console.log('🧪 Testing tooltips...');
        
        // Test de création
        const testElement = document.createElement('button');
        testElement.textContent = 'Test';
        testElement.style.margin = '20px';
        document.body.appendChild(testElement);
        
        window.createTooltip(testElement, {
            text: 'Tooltip de test !',
            position: 'top',
            variant: 'primary'
        });
        
        console.log('✅ Test tooltip created');
        
        setTimeout(() => {
            testElement.remove();
            console.log('✅ Test tooltip cleaned up');
        }, 3000);
    };

})();
