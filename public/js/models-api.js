/**
 * Service API pour la gestion des modèles
 * Centralise tous les appels vers l'API backend
 */
class ModelsApiService {
    constructor() {
        this.baseUrl = '/api/models';
        this.authToken = null;
    }

    /**
     * Définir le token d'authentification
     */
    setAuthToken(token) {
        this.authToken = token;
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
     * Gestion centralisée des erreurs API
     */
    async handleResponse(response) {
        if (!response.ok) {
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
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error listing models:', error);
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

            const response = await fetch(`${this.baseUrl}/download`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(body)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error downloading model:', error);
            throw error;
        }
    }

    /**
     * Activer un modèle
     */
    async activateModel(filename) {
        try {
            const response = await fetch(`${this.baseUrl}/activate`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ filename })
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error activating model:', error);
            throw error;
        }
    }

    /**
     * Supprimer un modèle
     */
    async deleteModel(filename) {
        try {
            const response = await fetch(`${this.baseUrl}/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error deleting model:', error);
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

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error getting downloads:', error);
            throw error;
        }
    }

    /**
     * Annuler un téléchargement
     */
    async cancelDownload(downloadId) {
        try {
            const response = await fetch(`${this.baseUrl}/downloads/${downloadId}/cancel`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error canceling download:', error);
            throw error;
        }
    }

    /**
     * Nettoyer les téléchargements terminés
     */
    async cleanupDownloads() {
        try {
            const response = await fetch(`${this.baseUrl}/downloads/cleanup`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error cleaning up downloads:', error);
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
}

// Instance globale du service API
window.modelsApiService = new ModelsApiService();

// Auto-configuration du token depuis le localStorage/sessionStorage
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        window.modelsApiService.setAuthToken(token);
    }
});

// Écouter les changements de token d'authentification
window.addEventListener('authTokenChanged', function(event) {
    if (event.detail && event.detail.token) {
        window.modelsApiService.setAuthToken(event.detail.token);
    }
});
