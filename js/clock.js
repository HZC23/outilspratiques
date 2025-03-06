import { Utils } from './utils.js';

/**
 * Gestionnaire d'horloge
 * Gère l'affichage de l'heure et de la date
 */
export const ClockManager = {
    /**
     * État du gestionnaire d'horloge
     */
    state: {
        intervalId: null,
        timeElement: null,
        dateElement: null,
        initialized: false
    },
    
    /**
     * Initialise le gestionnaire d'horloge
     */
    init() {
        // Récupérer les éléments du DOM
        this.state.timeElement = document.getElementById('topTime');
        this.state.dateElement = document.getElementById('topDate');
        
        // Vérifier si les éléments existent
        if (!this.state.timeElement || !this.state.dateElement) {
            console.warn('Éléments d\'horloge non trouvés dans le DOM');
            return;
        }
        
        // Mettre à jour l'horloge immédiatement
        this.updateClock();
        
        // Mettre à jour l'horloge toutes les secondes
        this.state.intervalId = setInterval(() => this.updateClock(), 1000);
        
        this.state.initialized = true;
        console.log('Gestionnaire d\'horloge initialisé');
    },
    
    /**
     * Met à jour l'affichage de l'horloge
     */
    updateClock() {
        const now = new Date();
        
        // Formater l'heure
        const timeString = now.toLocaleTimeString('fr-FR');
        
        // Formater la date
        const dateString = now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Mettre à jour les éléments du DOM seulement si nécessaire
        if (this.state.timeElement && this.state.timeElement.textContent !== timeString) {
            this.state.timeElement.textContent = timeString;
        }
        
        if (this.state.dateElement && this.state.dateElement.textContent !== dateString) {
            this.state.dateElement.textContent = dateString;
        }
    },
    
    /**
     * Arrête le gestionnaire d'horloge
     */
    stop() {
        if (this.state.intervalId) {
            clearInterval(this.state.intervalId);
            this.state.intervalId = null;
        }
    },
    
    /**
     * Redémarre le gestionnaire d'horloge
     */
    restart() {
        this.stop();
        this.state.intervalId = setInterval(() => this.updateClock(), 1000);
        this.updateClock();
    },
    
    /**
     * Formate une date
     * @param {Date} date - La date à formater
     * @param {Object} options - Les options de formatage
     * @returns {string} - La date formatée
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        return date.toLocaleDateString('fr-FR', mergedOptions);
    },
    
    /**
     * Formate une heure
     * @param {Date} date - La date à formater
     * @param {Object} options - Les options de formatage
     * @returns {string} - L'heure formatée
     */
    formatTime(date, options = {}) {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        return date.toLocaleTimeString('fr-FR', mergedOptions);
    }
}; 