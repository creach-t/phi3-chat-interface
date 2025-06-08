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
                        icon.className = 'fas fa-spinner fa-spin';
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
                const authResult = await authenticateUser(username, password);
                if (authResult.success) {
                    // Stocker le token dans localStorage
                    localStorage.setItem('authToken', authResult.token);
                    localStorage.setItem('user', JSON.stringify(authResult.user));
                    
                    // Notifier le service API du nouveau token
                    if (window.modelsApiService) {
                        window.modelsApiService.setAuthToken(authResult.token);
                    }
                    
                    // Émettre l'événement de changement de token
                    window.dispatchEvent(new CustomEvent('authTokenChanged', {
                        detail: { token: authResult.token, user: authResult.user }
                    }));
                    
                    // Transition vers l'interface principale
                    transitionToChat();
                } else {
                    showError(authResult.error || 'Nom d\'utilisateur ou mot de passe incorrect');
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
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            
            if (data.success && data.token) {
                console.log('🎉 Authentication successful');
                return {
                    success: true,
                    token: data.token,
                    user: data.user || { username }
                };
            } else {
                console.log('❌ Authentication failed:', data.error);
                return {
                    success: false,
                    error: data.error || 'Authentification échouée'
                };
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
                        if (isValid) {
                            const token = 'dev-token-' + Date.now();
                            console.log('✅ Dev auth success, token:', token);
                            resolve({
                                success: true,
                                token: token,
                                user: { username: 'admin', role: 'admin' }
                            });
                        } else {
                            console.log('❌ Dev auth failed');
                            resolve({
                                success: false,
                                error: 'Identifiants incorrects (admin/admin pour le dev)'
                            });
                        }
                    }, 1000);
                });
            }
            
            throw error;
        }
    }

    // Vérifier l'authentification initiale
    async function checkInitialAuthentication() {
        try {
            const token = localStorage.getItem('authToken');
            const userStr = localStorage.getItem('user');
            
            if (!token) {
                console.log('ℹ️ No token found in localStorage');
                return;
            }

            // Vérifier la validité du token avec le serveur
            const response = await fetch('/api/verify-token', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    console.log('🔑 Valid token found, user already authenticated');
                    
                    // Configurer le service API
                    if (window.modelsApiService) {
                        window.modelsApiService.setAuthToken(token);
                    }
                    
                    // Émettre l'événement de token
                    const user = userStr ? JSON.parse(userStr) : data.user;
                    window.dispatchEvent(new CustomEvent('authTokenChanged', {
                        detail: { token, user }
                    }));
                    
                    transitionToChat();
                    return;
                }
            }
            
            // Token invalide, le supprimer
            console.log('❌ Invalid token, removing from localStorage');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
        } catch (error) {
            console.log('ℹ️ Token verification failed:', error.message);
            // En cas d'erreur de vérification, supprimer le token
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
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
            const token = localStorage.getItem('authToken');
            
            // Appeler l'API de déconnexion si elle existe
            if (token) {
                try {
                    await fetch('/api/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.warn('Logout API call failed:', error);
                    // Continue with local logout even if API call fails
                }
            }
            
            // Nettoyer le localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
            // Nettoyer le service API
            if (window.modelsApiService) {
                window.modelsApiService.setAuthToken(null);
            }
            
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
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
            const loginPage = document.getElementById('login-page');
            const chatPage = document.getElementById('chat-page');
            if (loginPage && chatPage) {
                chatPage.classList.add('hidden');
                loginPage.classList.remove('hidden');
            }
        }
    }

    // Fonction pour obtenir le token actuel
    function getCurrentToken() {
        return localStorage.getItem('authToken');
    }

    // Fonction pour obtenir l'utilisateur actuel
    function getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
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
        checkAuth: checkInitialAuthentication,
        getCurrentToken: getCurrentToken,
        getCurrentUser: getCurrentUser
    };

    // Écouter les demandes de déconnexion depuis d'autres composants
    window.addEventListener('requestLogout', handleLogout);

})();
