import { CONFIG } from './config.js';

export const Utils = {
    /**
     * Crée une version debounced d'une fonction
     * @param {Function} func - La fonction à debouncer
     * @param {number} wait - Le délai en millisecondes
     * @returns {Function} La fonction debounced
     */
    debounce(func, wait = CONFIG.DEBOUNCE_DELAY) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Copie un texte dans le presse-papiers
     * @param {string} text - Le texte à copier
     * @returns {Promise<boolean>} Succès ou échec de la copie
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Texte copié !', 'success');
            return true;
        } catch (err) {
            console.error('Erreur de copie :', err);
            this.showNotification('Erreur lors de la copie', 'error');
            return false;
        }
    },

    /**
     * Affiche une notification temporaire
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type de notification (success, error, info, warning)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    /**
     * Formate une date en français
     * @param {Date} date - La date à formater
     * @returns {string} La date formatée
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date);
    },

    /**
     * Formate une heure en français
     * @param {Date} date - La date à formater
     * @returns {string} L'heure formatée
     */
    formatTime(date) {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    },

    /**
     * Sauvegarde des données dans le stockage local de manière sécurisée
     * @param {string} key - Clé de stockage
     * @param {any} value - Valeur à stocker
     */
    saveToStorage(key, value) {
        try {
            const data = JSON.stringify(value);
            if (window.isSecureContext) {
                localStorage.setItem(key, data);
            } else {
                sessionStorage.setItem(key, data);
            }
        } catch (error) {
            console.warn(`Erreur lors de la sauvegarde de ${key}:`, error);
        }
    },

    /**
     * Charge des données depuis le stockage local de manière sécurisée
     * @param {string} key - Clé de stockage
     * @param {any} defaultValue - Valeur par défaut si rien n'est trouvé
     * @returns {any} - Données chargées ou valeur par défaut
     */
    loadFromStorage(key, defaultValue = null) {
        try {
            const storage = window.isSecureContext ? localStorage : sessionStorage;
            const data = storage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn(`Erreur lors du chargement de ${key}:`, error);
            return defaultValue;
        }
    },

    /**
     * Génère un identifiant unique
     * @returns {string} L'identifiant généré
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Annonce un message aux lecteurs d'écran
     * @param {string} message - Message à annoncer
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }
}; 