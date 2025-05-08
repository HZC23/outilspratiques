import { CONFIG } from './config.js';
import { Utils } from './utils.js';

/**
 * Gestionnaire de thème
 * Gère le thème clair/sombre de l'application
 */
export const ThemeManager = {
    /**
     * État du gestionnaire de thème
     */
    state: {
        theme: 'light',
        systemPreference: false,
        initialized: false,
        transitionElements: [
            'body', 'header', '.card', '.tool-container', 
            '.tool-header', 'input', 'select', 'textarea', 
            'button', '.btn', '.search-form', '.calculator-container',
            '.calculator-display', '.calculator-button', '.todo-item',
            '.note-container', '.metronome-container', '.qrcode-container',
            '.password-container', '.translator-container', '.converter-container',
            '.color-picker-container', '.header-container', '.footer-container',
            '.todo-container', '.timer-container', '.stopwatch-container'
        ]
    },
    
    /**
     * Initialise le gestionnaire de thème
     */
    init() {
        // Récupérer le thème stocké ou utiliser le thème par défaut
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        
        if (savedTheme) {
            this.state.theme = savedTheme;
        } else {
            // Utiliser la préférence système si aucun thème n'est stocké
            this.state.systemPreference = true;
            this.state.theme = this.getSystemPreference();
        }
        
        // Appliquer le thème
        this.applyTheme(this.state.theme);
        
        // Initialiser le switch de thème
        this.initThemeSwitch();
        
        // Écouter les changements de préférence système
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.state.systemPreference) {
                    this.state.theme = e.matches ? 'dark' : 'light';
                    this.applyTheme(this.state.theme);
                    this.updateThemeSwitch();
                }
            });
        }
        
        this.state.initialized = true;
        console.log('Gestionnaire de thème initialisé');
    },
    
    /**
     * Initialise le switch de thème
     */
    initThemeSwitch() {
        const themeSwitch = document.querySelector('.theme-switch__checkbox');
        if (!themeSwitch) return;
        
        // Mettre à jour l'état du switch en fonction du thème actuel
        this.updateThemeSwitch();
        
        // Ajouter l'écouteur d'événements pour le changement de thème
        themeSwitch.addEventListener('change', () => {
            const newTheme = themeSwitch.checked ? 'dark' : 'light';
            this.toggleTheme(newTheme);
        });
    },
    
    /**
     * Met à jour l'état du switch de thème
     */
    updateThemeSwitch() {
        const themeSwitch = document.querySelector('.theme-switch__checkbox');
        if (!themeSwitch) return;
        
        themeSwitch.checked = this.state.theme === 'dark';
    },
    
    /**
     * Récupère la préférence système pour le thème
     * @returns {string} - Le thème préféré ('dark' ou 'light')
     */
    getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    },
    
    /**
     * Applique des classes de transition aux éléments
     * @param {boolean} add - True pour ajouter, false pour retirer
     */
    setTransitionClass(add = true) {
        this.state.transitionElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (add) {
                    el.classList.add('theme-transition');
                } else {
                    el.classList.remove('theme-transition');
                }
            });
        });
    },
    
    /**
     * Applique un thème
     * @param {string} theme - Le thème à appliquer ('dark' ou 'light')
     */
    applyTheme(theme) {
        // Ajouter les classes de transition
        this.setTransitionClass(true);
        
        // Appliquer le thème
        document.documentElement.setAttribute('data-theme', theme);
        
        // Mettre à jour les méta-tags pour le thème
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#4a90e2');
        }
        
        // Retirer les classes de transition après la fin de la transition
        setTimeout(() => {
            this.setTransitionClass(false);
        }, 500); // correspond à la durée de transition dans CSS
        
        // Émettre un événement personnalisé pour le changement de thème
        const event = new CustomEvent('themechange', { detail: { theme } });
        document.dispatchEvent(event);
    },
    
    /**
     * Bascule le thème
     * @param {string} [newTheme] - Le nouveau thème ('dark' ou 'light'), si non spécifié, bascule entre les deux
     */
    toggleTheme(newTheme) {
        // Si un thème est spécifié, l'utiliser, sinon basculer
        const theme = newTheme || (this.state.theme === 'light' ? 'dark' : 'light');
        
        // Mettre à jour l'état
        this.state.theme = theme;
        this.state.systemPreference = false;
        
        // Appliquer le thème
        this.applyTheme(theme);
        
        // Sauvegarder le thème
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
        
        // Mettre à jour le switch si nécessaire
        if (!newTheme) {
            this.updateThemeSwitch();
        }
    },
    
    /**
     * Utilise la préférence système pour le thème
     */
    useSystemPreference() {
        this.state.systemPreference = true;
        const theme = this.getSystemPreference();
        this.state.theme = theme;
        this.applyTheme(theme);
        this.updateThemeSwitch();
        localStorage.removeItem(CONFIG.STORAGE_KEYS.THEME);
    },
    
    /**
     * Vérifie si le thème actuel est sombre
     * @returns {boolean} - True si le thème est sombre
     */
    isDarkTheme() {
        return this.state.theme === 'dark';
    }
}; 