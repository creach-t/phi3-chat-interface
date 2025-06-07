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

            // Simulation de l'authentification (à remplacer par votre logique)
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
            }
        });

        // Focus automatique sur le premier champ
        if (usernameInput) {
            usernameInput.focus();
        }

        console.log('✅ Login component initialized');
    }

    // Fonction d'authentification (à adapter selon vos besoins)
    async function authenticateUser(username, password) {
        // Simulation - à remplacer par un vrai appel API
        return new Promise((resolve) => {
            setTimeout(() => {
                // Exemple: accepter "admin/admin" pour les tests
                resolve(username === 'admin' && password === 'admin');
            }, 1000);
        });
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

    // Exposer globalement pour les tests
    window.loginComponent = {
        init: initLogin,
        authenticate: authenticateUser
    };

})();
