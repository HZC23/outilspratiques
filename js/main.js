import { CONFIG } from './config.js';
import { Utils } from './utils.js';
import { ThemeManager } from './theme.js';
import { NavigationManager } from './navigation.js';
import { ClockManager } from './clock.js';

/**
 * Classe principale de l'application
 */
class App {
    constructor() {
        this.init();
    }

    /**
     * Initialise l'application
     */
    async init() {
        try {
            // Initialiser les gestionnaires
            ThemeManager.init();
            NavigationManager.init();
            ClockManager.init();

            // Configurer les écouteurs globaux
            this.setupGlobalListeners();
            
            // Initialiser les fonctionnalités PWA
            await this.initPWA();

            // Émettre un événement d'initialisation réussie
            window.dispatchEvent(new CustomEvent('appready'));

        } catch (error) {
            console.error('Erreur lors de l\'initialisation :', error);
            Utils.showNotification(
                'Une erreur est survenue lors du chargement de l\'application',
                'error'
            );
        }
    }

    /**
     * Configure les écouteurs d'événements globaux
     */
    setupGlobalListeners() {
        // Gestion des erreurs globales
        window.addEventListener('error', (e) => {
            console.error('Erreur globale :', e.error);
            Utils.showNotification(
                'Une erreur inattendue est survenue',
                'error'
            );
        });

        // Gestion de la connexion réseau
        window.addEventListener('online', () => {
            Utils.showNotification(
                'Connexion internet rétablie',
                'success'
            );
        });

        window.addEventListener('offline', () => {
            Utils.showNotification(
                'Connexion internet perdue',
                'warning'
            );
        });

        // Gestion du focus de la fenêtre
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                ClockManager.updateClock();
            }
        });

        // Gestion des raccourcis clavier globaux
        document.addEventListener('keydown', (e) => {
            // Ctrl + K pour ouvrir la recherche
            if (e.ctrlKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.openSearch();
            }
        });
    }

    /**
     * Initialise les fonctionnalités PWA
     */
    async initPWA() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker enregistré :', registration);
            } catch (error) {
                console.error('Erreur d\'enregistrement du Service Worker :', error);
            }
        }
    }

    /**
     * Ouvre la recherche globale
     */
    openSearch() {
        // TODO: Implémenter la recherche globale
        Utils.showNotification(
            'La recherche globale sera bientôt disponible',
            'info'
        );
    }
}

// Initialiser l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 