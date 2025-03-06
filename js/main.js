import { CONFIG } from './config.js';
import { Utils } from './utils.js';
import { ThemeManager } from './theme.js';
import { NavigationManager } from './navigation.js';
import { ClockManager } from './clock.js';
import { ColorManager } from './tools/color.js';
import { MenuManager } from './menu.js';

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
    init() {
        // Initialiser le thème
        ThemeManager.init();

        // Initialiser l'horloge
        ClockManager.init();

        // Initialiser le menu
        MenuManager.init();

        // Initialiser la navigation
        NavigationManager.init();

        // Initialiser les outils
        this.initTools();

        // Initialiser les gestionnaires d'événements
        this.initEventHandlers();
    }

    /**
     * Initialise les outils
     */
    initTools() {
        // Initialiser le gestionnaire de couleurs
        ColorManager.init();
    }

    /**
     * Initialise les gestionnaires d'événements
     */
    initEventHandlers() {
        // Gestionnaire de redimensionnement optimisé
        const debouncedResize = PerformanceManager.debounce(() => {
            this.handleResize();
        }, 250);

        window.addEventListener('resize', debouncedResize);

        // Gestionnaire de navigation
        window.addEventListener('popstate', () => {
            const toolId = window.location.hash.slice(1);
            if (toolId) {
                this.showTool(toolId);
            }
        });

        // Gestionnaire de clic global pour fermer les menus
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.menu')) {
                this.closeAllSubmenus();
            }
        });

        // Gestionnaire de touche Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllSubmenus();
            }
        });
    }

    /**
     * Ferme tous les sous-menus
     */
    closeAllSubmenus() {
        document.querySelectorAll('.submenu.active').forEach(menu => {
            this.toggleSubmenu(menu.id, false);
        });
    }

    /**
     * Gère le redimensionnement de la fenêtre
     */
    handleResize() {
        // Fermer les sous-menus sur mobile
        if (window.innerWidth <= 768) {
            this.closeAllSubmenus();
        }
    }

    /**
     * Bascule l'état d'un sous-menu
     * @param {string} menuId - L'identifiant du sous-menu
     * @param {boolean} [forceState] - État forcé (optionnel)
     */
    toggleSubmenu(menuId, forceState) {
        const submenu = document.getElementById(menuId);
        if (!submenu) return;

        const trigger = submenu.previousElementSibling;
        if (!trigger) return;

        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const newState = forceState !== undefined ? forceState : !isExpanded;

        // Fermer les autres sous-menus
        document.querySelectorAll('.submenu.active').forEach(menu => {
            if (menu.id !== menuId) {
                menu.classList.remove('active');
                menu.previousElementSibling.setAttribute('aria-expanded', 'false');
            }
        });

        // Basculer le sous-menu actuel
        submenu.classList.toggle('active', newState);
        trigger.setAttribute('aria-expanded', newState);

        // Annoncer le changement d'état pour l'accessibilité
        const message = newState ? 'Sous-menu ouvert' : 'Sous-menu fermé';
        Utils.announceToScreenReader(message);
    }

    /**
     * Affiche un outil spécifique
     * @param {string} toolId - L'identifiant de l'outil à afficher
     */
    showTool(toolId) {
        // Masquer tous les outils
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.setAttribute('aria-hidden', 'true');
        });

        // Afficher l'outil sélectionné
        const tool = document.getElementById(toolId);
        if (tool) {
            tool.classList.add('active');
            tool.setAttribute('aria-hidden', 'false');
            
            // Mettre à jour l'URL sans recharger la page
            history.pushState({tool: toolId}, '', `#${toolId}`);
            
            // Mettre à jour l'état actif des boutons du menu
            document.querySelectorAll('.submenu-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-tool-id') === toolId) {
                    item.classList.add('active');
                    item.setAttribute('aria-current', 'true');
                } else {
                    item.removeAttribute('aria-current');
                }
            });

            // Fermer tous les sous-menus
            this.closeAllSubmenus();

            // Annoncer le changement pour l'accessibilité
            Utils.announceToScreenReader(`Outil ${tool.querySelector('h2').textContent} affiché`);
        }
    }
}

// Gestionnaire d'erreurs global
const ErrorManager = {
    showError(message, duration = 5000) {
        const errorElement = document.createElement('div');
        errorElement.className = 'status-message status-error';
        errorElement.setAttribute('role', 'alert');
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.remove();
        }, duration);
    },

    showSuccess(message, duration = 3000) {
        const successElement = document.createElement('div');
        successElement.className = 'status-message status-success';
        successElement.setAttribute('role', 'status');
        successElement.textContent = message;
        
        document.body.appendChild(successElement);
        
        setTimeout(() => {
            successElement.remove();
        }, duration);
    }
};

// Gestionnaire de chargement
const LoadingManager = {
    show(element) {
        if (!element) return;
        
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.setAttribute('aria-label', 'Chargement en cours');
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        loadingOverlay.appendChild(spinner);
        
        element.appendChild(loadingOverlay);
    },

    hide(element) {
        if (!element) return;
        
        const loadingOverlay = element.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
};

// Gestionnaire de performance
const PerformanceManager = {
    debounce(func, wait) {
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

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    // Gestion des erreurs globales
    window.addEventListener('error', (event) => {
        ErrorManager.showError('Une erreur est survenue. Veuillez réessayer.');
        console.error('Erreur globale:', event.error);
    });

    // Gestion des promesses non gérées
    window.addEventListener('unhandledrejection', (event) => {
        ErrorManager.showError('Une erreur est survenue. Veuillez réessayer.');
        console.error('Promesse non gérée:', event.reason);
    });

    // Initialisation des gestionnaires
    window.app = new App();
    window.errorManager = ErrorManager;
    window.loadingManager = LoadingManager;
    window.performanceManager = PerformanceManager;

    // Cacher tous les outils au chargement
    const tools = document.querySelectorAll('.section');
    tools.forEach(tool => {
        tool.style.display = 'none';
    });

    // Gérer les clics sur les boutons du menu
    const menuItems = document.querySelectorAll('.submenu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const toolId = item.getAttribute('data-tool-id');
            
            // Cacher tous les outils
            tools.forEach(tool => {
                tool.style.display = 'none';
            });

            // Afficher l'outil sélectionné
            const selectedTool = document.getElementById(toolId);
            if (selectedTool) {
                selectedTool.style.display = 'block';
            }

            // Fermer le sous-menu
            const submenu = item.closest('.submenu');
            if (submenu) {
                submenu.style.display = 'none';
                const menuTrigger = submenu.previousElementSibling;
                if (menuTrigger) {
                    menuTrigger.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });

    // Gérer l'ouverture/fermeture des sous-menus
    const menuTriggers = document.querySelectorAll('.menu-trigger');
    menuTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const submenu = document.getElementById(trigger.getAttribute('data-menu-id'));
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

            // Fermer tous les autres sous-menus
            menuTriggers.forEach(otherTrigger => {
                if (otherTrigger !== trigger) {
                    otherTrigger.setAttribute('aria-expanded', 'false');
                    const otherSubmenu = document.getElementById(otherTrigger.getAttribute('data-menu-id'));
                    if (otherSubmenu) {
                        otherSubmenu.style.display = 'none';
                    }
                }
            });

            // Basculer le sous-menu actuel
            trigger.setAttribute('aria-expanded', !isExpanded);
            if (submenu) {
                submenu.style.display = isExpanded ? 'none' : 'block';
            }
        });
    });

    // Fermer les sous-menus lors d'un clic en dehors
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.menu')) {
            menuTriggers.forEach(trigger => {
                trigger.setAttribute('aria-expanded', 'false');
                const submenu = document.getElementById(trigger.getAttribute('data-menu-id'));
                if (submenu) {
                    submenu.style.display = 'none';
                }
            });
        }
    });
}); 