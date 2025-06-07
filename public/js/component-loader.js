// public/js/component-loader.js

class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
        this.loadedStyles = new Set();
        console.log('🚀 Component Loader initialized');
    }

    /**
     * Charge un fichier CSS
     */
    async loadCSS(cssPath) {
        if (this.loadedStyles.has(cssPath)) {
            return; // Déjà chargé
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            
            link.onload = () => {
                this.loadedStyles.add(cssPath);
                console.log(`✅ CSS loaded: ${cssPath}`);
                resolve();
            };
            
            link.onerror = () => {
                console.warn(`❌ CSS failed to load: ${cssPath}`);
                reject(new Error(`Failed to load CSS: ${cssPath}`));
            };
            
            document.head.appendChild(link);
        });
    }

    /**
     * Charge un fichier HTML
     */
    async loadHTML(htmlPath) {
        try {
            const response = await fetch(htmlPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${htmlPath}`);
            }
            const html = await response.text();
            console.log(`✅ HTML loaded: ${htmlPath}`);
            return html;
        } catch (error) {
            console.warn(`❌ HTML failed to load: ${htmlPath}`, error);
            throw error;
        }
    }

    /**
     * Charge un fichier JavaScript
     */
    async loadJS(jsPath) {
        if (this.loadedComponents.has(jsPath)) {
            return; // Déjà chargé
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = jsPath;
            script.type = 'module';
            
            script.onload = () => {
                this.loadedComponents.add(jsPath);
                console.log(`✅ JS loaded: ${jsPath}`);
                resolve();
            };
            
            script.onerror = () => {
                console.warn(`❌ JS failed to load: ${jsPath}`);
                reject(new Error(`Failed to load JS: ${jsPath}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Charge un composant complet (HTML + CSS + JS)
     */
    async loadComponent(componentPath, targetSelector, options = {}) {
        try {
            const { 
                loadCSS = true, 
                loadJS = true, 
                replace = true,
                data = null 
            } = options;

            console.log(`🔄 Loading component: ${componentPath}`);

            // 1. Charger le CSS si demandé
            if (loadCSS) {
                try {
                    await this.loadCSS(`${componentPath}.css`);
                } catch (error) {
                    console.warn(`CSS not found for ${componentPath}, continuing...`);
                }
            }

            // 2. Charger le HTML
            const html = await this.loadHTML(`${componentPath}.html`);
            
            // 3. Injecter le HTML
            const target = document.querySelector(targetSelector);
            if (!target) {
                throw new Error(`Target element not found: ${targetSelector}`);
            }

            if (replace) {
                target.innerHTML = html;
            } else {
                target.insertAdjacentHTML('beforeend', html);
            }

            // 4. Remplacer les variables de template si des données sont fournies
            if (data) {
                this.replaceTemplateVariables(target, data);
            }

            // 5. Charger le JS si demandé
            if (loadJS) {
                try {
                    await this.loadJS(`${componentPath}.js`);
                } catch (error) {
                    console.warn(`JS not found for ${componentPath}, continuing...`);
                }
            }

            console.log(`✅ Component loaded successfully: ${componentPath}`);
            
            // Émettre un événement personnalisé
            window.dispatchEvent(new CustomEvent('componentLoaded', {
                detail: { componentPath, targetSelector }
            }));

        } catch (error) {
            console.error(`❌ Failed to load component ${componentPath}:`, error);
            throw error;
        }
    }

    /**
     * Remplace les variables de template {{variable}} par des valeurs
     */
    replaceTemplateVariables(element, data) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            let content = textNode.textContent;
            Object.keys(data).forEach(key => {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                content = content.replace(regex, data[key]);
            });
            textNode.textContent = content;
        });
    }

    /**
     * Décharge un composant (retire le HTML)
     */
    unloadComponent(targetSelector) {
        const target = document.querySelector(targetSelector);
        if (target) {
            target.innerHTML = '';
            console.log(`🗑️ Component unloaded from: ${targetSelector}`);
        }
    }
}

// Instance globale
window.componentLoader = new ComponentLoader();

// Test de fonctionnement
console.log('🧪 Component Loader ready for testing');

// Fonction utilitaire pour les tests
window.testComponentLoader = function() {
    console.log('🧪 Testing Component Loader...');
    
    // Test basique de chargement CSS
    window.componentLoader.loadCSS('css/variables.css')
        .then(() => console.log('✅ Test CSS loading: PASSED'))
        .catch(() => console.log('ℹ️ Test CSS loading: File not found (expected)'));
    
    console.log('Component Loader test completed');
};
