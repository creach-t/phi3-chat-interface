/**
 * Service API pour la gestion des modèles
 * Centralise tous les appels vers l'API backend
 */
class ModelsApiService {
    constructor() {
        this.baseUrl = '/api/models';
    }

    /**
     * Obtenir les headers par défaut avec authentification par cookies
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Obtenir les options de fetch avec credentials pour les cookies
     */
    getFetchOptions(method = 'GET', body = null) {
        const options = {
            method,
            headers: this.getHeaders(),
            credentials: 'include' // Important pour envoyer les cookies de session
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
            const response = await fetch(this.baseUrl, this.getFetchOptions('GET'));
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

            const response = await fetch(`${this.baseUrl}/download`, this.getFetchOptions('POST', body));
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
            const response = await fetch(`${this.baseUrl}/activate`, this.getFetchOptions('POST', { filename }));
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
            const response = await fetch(`${this.baseUrl}/${encodeURIComponent(filename)}`, 
                this.getFetchOptions('DELETE'));
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

            const response = await fetch(url, this.getFetchOptions('GET'));
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
            const response = await fetch(`${this.baseUrl}/downloads/${downloadId}/cancel`, 
                this.getFetchOptions('POST'));
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
            const response = await fetch(`${this.baseUrl}/downloads/cleanup`, 
                this.getFetchOptions('POST'));
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

    /**
     * Tester la connectivité API
     */
    async testConnection() {
        try {
            const response = await fetch(this.baseUrl, this.getFetchOptions('GET'));
            return response.ok;
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }
}

// Instance globale du service API
window.modelsApiService = new ModelsApiService();

// Log de démarrage
console.log('📦 Models API Service initialized with cookie-based authentication');
