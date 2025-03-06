import { Utils } from './utils.js';

export const ClockManager = {
    /**
     * État de l'horloge
     */
    state: {
        intervalId: null,
        is24Hour: true,
        showSeconds: true
    },

    /**
     * Initialise le gestionnaire d'horloge
     */
    init() {
        this.loadPreferences();
        this.updateClock();
        this.setupInterval();
        this.setupListeners();
    },

    /**
     * Charge les préférences utilisateur
     */
    loadPreferences() {
        const preferences = Utils.loadFromStorage('clockPreferences', {
            is24Hour: true,
            showSeconds: true
        });
        
        this.state.is24Hour = preferences.is24Hour;
        this.state.showSeconds = preferences.showSeconds;
    },

    /**
     * Configure l'intervalle de mise à jour
     */
    setupInterval() {
        // Nettoyer l'intervalle existant si présent
        if (this.state.intervalId) {
            clearInterval(this.state.intervalId);
        }

        // Synchroniser avec les secondes
        const now = new Date();
        const delay = 1000 - now.getMilliseconds();
        
        setTimeout(() => {
            this.updateClock();
            this.state.intervalId = setInterval(() => this.updateClock(), 1000);
        }, delay);
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Écouteur pour le format 12/24h
        document.getElementById('toggleTimeFormat')?.addEventListener('click', () => {
            this.toggleTimeFormat();
        });

        // Écouteur pour l'affichage des secondes
        document.getElementById('toggleSeconds')?.addEventListener('click', () => {
            this.toggleSeconds();
        });
    },

    /**
     * Met à jour l'affichage de l'horloge
     */
    updateClock() {
        const now = new Date();
        const timeElement = document.getElementById('topTime');
        const dateElement = document.getElementById('topDate');

        if (timeElement) {
            timeElement.textContent = this.formatTime(now);
            // Ajouter une animation de pulse
            timeElement.classList.add('pulse');
            setTimeout(() => timeElement.classList.remove('pulse'), 200);
        }

        if (dateElement) {
            dateElement.textContent = Utils.formatDate(now);
        }
    },

    /**
     * Formate l'heure selon les préférences
     * @param {Date} date - La date à formater
     * @returns {string} L'heure formatée
     */
    formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        let period = '';

        if (!this.state.is24Hour) {
            period = hours >= 12 ? ' PM' : ' AM';
            hours = hours % 12 || 12;
        }

        hours = hours.toString().padStart(2, '0');
        
        return `${hours}:${minutes}${this.state.showSeconds ? ':' + seconds : ''}${period}`;
    },

    /**
     * Bascule entre les formats 12h et 24h
     */
    toggleTimeFormat() {
        this.state.is24Hour = !this.state.is24Hour;
        this.updateClock();
        this.savePreferences();
        
        Utils.showNotification(
            `Format ${this.state.is24Hour ? '24h' : '12h'} activé`,
            'info'
        );
    },

    /**
     * Bascule l'affichage des secondes
     */
    toggleSeconds() {
        this.state.showSeconds = !this.state.showSeconds;
        this.updateClock();
        this.savePreferences();
        
        Utils.showNotification(
            `Secondes ${this.state.showSeconds ? 'affichées' : 'masquées'}`,
            'info'
        );
    },

    /**
     * Sauvegarde les préférences utilisateur
     */
    savePreferences() {
        Utils.saveToStorage('clockPreferences', {
            is24Hour: this.state.is24Hour,
            showSeconds: this.state.showSeconds
        });
    },

    /**
     * Nettoie les ressources lors de la destruction
     */
    destroy() {
        if (this.state.intervalId) {
            clearInterval(this.state.intervalId);
            this.state.intervalId = null;
        }
    }
}; 