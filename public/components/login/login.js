// Logique spécifique au composant login
(function() {
    'use strict';

    console.log('🔐 Login component loaded');

    // Initialisation du composant login
    function initLogin() {
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.querySelector('.login-btn');

        if (!loginForm) {
            console.warn('Login form not found');
            return;
        }

        // Fonction de validation
        function showError(message) {
            if (loginError) {
                loginError.textContent = message;
                loginError.style.display = 'block';
            }
        }

        function hideError() {
            if (loginError) {
                loginError.style.display = 'none';
            }
        }

        function setLoading(loading) {
            if (loginBtn) {
                if (loading) {
                    loginBtn.classList.add('loading');
                    loginBtn.disabled = true;
                    const icon = loginBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-spinner';
                    }
                } else {
                    loginBtn.classList.remove('loading');
                    loginBtn.disabled = false;
                    const icon = loginBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-arrow-right';
                    }
                }
            }
        }

        // Gestion de la soumission du formulaire
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            hideError();

            const username = usernameInput?.value.trim();
            const password = passwordInput?.value.trim();

            if (!username || !password) {
                showError('Veuillez remplir tous les champs');
                return;
            }

            setLoading(true);

            try {
                const success = await authenticateUser(username, password);
                if (success) {
                    // Transition vers l'interface principale
                    transitionToChat();
                } else {
                    showError('Nom d\'utilisateur ou mot de passe incorrect');
                }
            } catch (error) {
                console.error('Erreur d\'authentification:', error);
                showError('Erreur de connexion. Veuillez réessayer.');
            } finally {
                setLoading(false);
            }
        });

        // Focus automatique sur le premier champ
        if (usernameInput) {
            usernameInput.focus();
        }

        // Vérifier l'authentification au chargement
        checkInitialAuthentication();

        console.log('✅ Login component initialized');
    }

    // Fonction d'authentification utilisant l'API réelle
    async function authenticateUser(username, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('🎉 Authentication successful');
                return true;
            } else {
                console.log('❌ Authentication failed:', data.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Authentication error:', error);
            
            // Fallback pour le développement local - à supprimer en production
            if (error.message.includes('fetch') || error.name === 'TypeError') {
                console.log('🔄 Fallback authentication (dev mode)');
                // Simulation pour développement local
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const isValid = username === 'admin' && password === 'admin';
                        console.log(isValid ? '✅ Dev auth success' : '❌ Dev auth failed');
                        resolve(isValid);
                    }, 1000);
                });
            }
            
            throw error;
        }
    }

    // Vérifier l'authentification initiale
    async function checkInitialAuthentication() {
        try {
            const response = await fetch('/api/check-auth', { 
                credentials: 'include' 
            });
            const data = await response.json();
            
            if (data.authenticated) {
                console.log('🔑 User already authenticated');
                transitionToChat();
            }
        } catch (error) {
            console.log('ℹ️ No existing authentication found');
            // Pas d'authentification existante, rester sur la page de login
        }
    }

    // Transition vers l'interface de chat
    function transitionToChat() {
        const loginPage = document.getElementById('login-page');
        const chatPage = document.getElementById('chat-page');

        if (loginPage && chatPage) {
            loginPage.classList.add('hidden');
            chatPage.classList.remove('hidden');
            
            // Déclencher un événement pour notifier que l'utilisateur s'est connecté
            window.dispatchEvent(new CustomEvent('userLoggedIn'));
            console.log('🎉 User logged in successfully');
        }
    }

    // Fonction de déconnexion (appelée depuis le header)
    async function handleLogout() {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
            });
            
            // Retour à la page de login
            const loginPage = document.getElementById('login-page');
            const chatPage = document.getElementById('chat-page');

            if (loginPage && chatPage) {
                chatPage.classList.add('hidden');
                loginPage.classList.remove('hidden');
                
                // Nettoyer le formulaire
                const form = document.getElementById('login-form');
                if (form) {
                    form.reset();
                }
                
                // Masquer les erreurs
                const errorDiv = document.getElementById('login-error');
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }
                
                // Focus sur le champ username
                const usernameInput = document.getElementById('username');
                if (usernameInput) {
                    setTimeout(() => usernameInput.focus(), 100);
                }
                
                // Déclencher un événement
                window.dispatchEvent(new CustomEvent('userLoggedOut'));
                console.log('👋 User logged out successfully');
            }
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Même en cas d'erreur, déconnecter côté client
            const loginPage = document.getElementById('login-page');
            const chatPage = document.getElementById('chat-page');
            if (loginPage && chatPage) {
                chatPage.classList.add('hidden');
                loginPage.classList.remove('hidden');
            }
        }
    }

    // Écouter l'événement de chargement du composant
    window.addEventListener('componentLoaded', function(e) {
        if (e.detail.componentPath.includes('login')) {
            initLogin();
        }
    });

    // Si le composant est déjà chargé, l'initialiser
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initLogin, 100);
        });
    } else {
        setTimeout(initLogin, 100);
    }

    // Exposer globalement pour les tests et autres composants
    window.loginComponent = {
        init: initLogin,
        authenticate: authenticateUser,
        logout: handleLogout,
        checkAuth: checkInitialAuthentication
    };

    // Écouter les demandes de déconnexion depuis d'autres composants
    window.addEventListener('requestLogout', handleLogout);

})();
