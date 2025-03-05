import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export const ThemeManager = {
    /**
     * Initialise le gestionnaire de thème
     */
    init() {
        this.loadTheme();
        this.setupListeners();
        this.setupMediaQueryListener();
    },

    /**
     * Charge le thème sauvegardé ou utilise les préférences système
     */
    loadTheme() {
        const savedTheme = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.THEME);
        if (savedTheme) {
            this.applyTheme(savedTheme);
        } else {
            this.applySystemTheme();
        }
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        const themeSwitch = document.querySelector('.theme-switch__checkbox');
        if (themeSwitch) {
            themeSwitch.addEventListener('change', (e) => {
                const theme = e.target.checked ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
                this.applyTheme(theme, true);
            });
        }

        // Raccourci clavier pour changer de thème (Ctrl+Shift+T)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    },

    /**
     * Configure l'écouteur pour les préférences système
     */
    setupMediaQueryListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!Utils.loadFromStorage(CONFIG.STORAGE_KEYS.THEME)) {
                this.applyTheme(e.matches ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT);
            }
        });
    },

    /**
     * Applique le thème système
     */
    applySystemTheme() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyTheme(isDarkMode ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT);
    },

    /**
     * Applique un thème spécifique
     * @param {string} theme - Le thème à appliquer
     * @param {boolean} save - Si le thème doit être sauvegardé
     */
    applyTheme(theme, save = false) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeSwitch = document.querySelector('.theme-switch__checkbox');
        if (themeSwitch) {
            themeSwitch.checked = theme === CONFIG.THEMES.DARK;
        }

        // Mise à jour des méta-thèmes pour les navigateurs mobiles
        const themeColor = theme === CONFIG.THEMES.DARK ? '#1D1F2C' : '#4a90e2';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);

        if (save) {
            Utils.saveToStorage(CONFIG.STORAGE_KEYS.THEME, theme);
        }

        // Événement personnalisé pour la mise à jour du thème
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },

    /**
     * Bascule entre les thèmes clair et sombre
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === CONFIG.THEMES.DARK ? CONFIG.THEMES.LIGHT : CONFIG.THEMES.DARK;
        this.applyTheme(newTheme, true);
    },

    /**
     * Réinitialise le thème aux préférences système
     */
    resetToSystem() {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.THEME, null);
        this.applySystemTheme();
        Utils.showNotification('Thème réinitialisé aux préférences système', 'info');
    }
}; 