/**
 * Service API pour la gestion des modèles
 * Centralise tous les appels vers l'API backend avec authentification par token
 */
class ModelsApiService {
    constructor() {
        this.baseUrl = '/api/models';
        this.authToken = null;
        
        // Récupérer le token au démarrage
        this.initializeToken();
    }

    /**
     * Initialiser le token depuis localStorage
     */
    initializeToken() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.setAuthToken(token);
            console.log('🔑 Auth token loaded from localStorage');
        }
    }

    /**
     * Définir le token d'authentification
     */
    setAuthToken(token) {
        this.authToken = token;
        console.log('🔑 Auth token updated:', token ? 'Set' : 'Cleared');
    }

    /**
     * Obtenir les headers par défaut avec authentification
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    /**
     * Obtenir les options de fetch
     */
    getFetchOptions(method = 'GET', body = null) {
        const options = {
            method,
            headers: this.getHeaders()
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        return options;
    }

    /**
     * Gestion centralisée des erreurs API
     */
    async handleResponse(response) {
        if (!response.ok) {
            // Si erreur 401, le token est probablement invalide
            if (response.status === 401) {
                console.warn('🚫 Unauthorized - clearing invalid token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                this.authToken = null;
                
                // Optionnel : rediriger vers login
                window.dispatchEvent(new CustomEvent('authenticationRequired'));
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Lister tous les modèles disponibles
     */
    async listModels() {
        try {
            console.log('📋 Fetching models list...');
            const response = await fetch(this.baseUrl, this.getFetchOptions('GET'));
            const result = await this.handleResponse(response);
            console.log('✅ Models loaded:', result);
            return result;
        } catch (error) {
            console.error('❌ Error listing models:', error);
            throw error;
        }
    }

    /**
     * Télécharger un nouveau modèle
     */
    async downloadModel(url, filename = null) {
        try {
            const body = { url };
            if (filename) {
                body.filename = filename;
            }

            console.log('📥 Starting model download:', body);
            const response = await fetch(`${this.baseUrl}/download`, this.getFetchOptions('POST', body));
            const result = await this.handleResponse(response);
            console.log('✅ Download initiated:', result);
            return result;
        } catch (error) {
            console.error('❌ Error downloading model:', error);
            throw error;
        }
    }

    /**
     * Activer un modèle
     */
    async activateModel(filename) {
        try {
            console.log('🔄 Activating model:', filename);
            const response = await fetch(`${this.baseUrl}/activate`, this.getFetchOptions('POST', { filename }));
            const result = await this.handleResponse(response);
            console.log('✅ Model activated:', result);
            return result;
        } catch (error) {
            console.error('❌ Error activating model:', error);
            throw error;
        }
    }

    /**
     * Supprimer un modèle
     */
    async deleteModel(filename) {
        try {
            console.log('🗑️ Deleting model:', filename);
            const response = await fetch(`${this.baseUrl}/${encodeURIComponent(filename)}`, 
                this.getFetchOptions('DELETE'));
            const result = await this.handleResponse(response);
            console.log('✅ Model deleted:', result);
            return result;
        } catch (error) {
            console.error('❌ Error deleting model:', error);
            throw error;
        }
    }

    /**
     * Obtenir le statut des téléchargements
     */
    async getDownloads(downloadId = null) {
        try {
            const url = downloadId 
                ? `${this.baseUrl}/downloads/${downloadId}`
                : `${this.baseUrl}/downloads`;

            console.log('📊 Fetching downloads status...');
            const response = await fetch(url, this.getFetchOptions('GET'));
            const result = await this.handleResponse(response);
            console.log('✅ Downloads status:', result);
            return result;
        } catch (error) {
            console.error('❌ Error getting downloads:', error);
            throw error;
        }
    }

    /**
     * Annuler un téléchargement
     */
    async cancelDownload(downloadId) {
        try {
            console.log('❌ Cancelling download:', downloadId);
            const response = await fetch(`${this.baseUrl}/downloads/${downloadId}/cancel`, 
                this.getFetchOptions('POST'));
            const result = await this.handleResponse(response);
            console.log('✅ Download cancelled:', result);
            return result;
        } catch (error) {
            console.error('❌ Error canceling download:', error);
            throw error;
        }
    }

    /**
     * Nettoyer les téléchargements terminés
     */
    async cleanupDownloads() {
        try {
            console.log('🧹 Cleaning up downloads...');
            const response = await fetch(`${this.baseUrl}/downloads/cleanup`, 
                this.getFetchOptions('POST'));
            const result = await this.handleResponse(response);
            console.log('✅ Downloads cleaned up:', result);
            return result;
        } catch (error) {
            console.error('❌ Error cleaning up downloads:', error);
            throw error;
        }
    }

    /**
     * Valider une URL de modèle Hugging Face
     */
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

    /**
     * Extraire le nom de fichier depuis une URL
     */
    extractFilenameFromUrl(url) {
        try {
            const urlParts = url.split('/');
            return urlParts[urlParts.length - 1] || 'model.gguf';
        } catch {
            return 'model.gguf';
        }
    }

    /**
     * Formater la taille en octets de façon lisible
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Obtenir le texte de statut localisé
     */
    getStatusText(status) {
        const statusMap = {
            'downloading': 'Téléchargement en cours...',
            'completed': 'Terminé',
            'error': 'Erreur',
            'cancelled': 'Annulé',
            'pending': 'En attente',
            'paused': 'En pause'
        };
        return statusMap[status] || status;
    }

    /**
     * Obtenir l'icône pour un statut
     */
    getStatusIcon(status) {
        const iconMap = {
            'downloading': '<i class="fas fa-spinner fa-spin"></i>',
            'completed': '<i class="fas fa-check" style="color: #4caf50"></i>',
            'error': '<i class="fas fa-exclamation-triangle" style="color: #f44336"></i>',
            'cancelled': '<i class="fas fa-times" style="color: #ff9800"></i>',
            'pending': '<i class="fas fa-clock" style="color: #2196f3"></i>',
            'paused': '<i class="fas fa-pause" style="color: #ff9800"></i>'
        };
        return iconMap[status] || '';
    }

    /**
     * Tester la connectivité API
     */
    async testConnection() {
        try {
            console.log('🔍 Testing API connection...');
            const response = await fetch(this.baseUrl, this.getFetchOptions('GET'));
            const success = response.ok;
            console.log(success ? '✅ API connection OK' : '❌ API connection failed');
            return success;
        } catch (error) {
            console.error('❌ API connection test failed:', error);
            return false;
        }
    }

    /**
     * Vérifier si on est authentifié
     */
    isAuthenticated() {
        return !!this.authToken;
    }

    /**
     * Obtenir le token actuel
     */
    getAuthToken() {
        return this.authToken;
    }
}

// Instance globale du service API
window.modelsApiService = new ModelsApiService();

// Écouter les changements de token d'authentification
window.addEventListener('authTokenChanged', function(event) {
    if (event.detail && event.detail.token) {
        window.modelsApiService.setAuthToken(event.detail.token);
    }
});

// Écouter les déconnexions
window.addEventListener('userLoggedOut', function() {
    window.modelsApiService.setAuthToken(null);
});

// Log de démarrage
console.log('📦 Models API Service initialized with token-based authentication');
