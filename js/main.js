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

        // Vérifier si une ancre est présente dans l'URL
        this.checkUrlHash();
    }

    /**
     * Initialise les outils
     */
    initTools() {
        // Initialiser le gestionnaire de couleurs
        ColorManager.init();
        
        // Afficher l'outil par défaut ou celui spécifié dans l'URL
        const defaultTool = document.querySelector('.section');
        if (defaultTool) {
            defaultTool.style.display = 'block';
        }
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
            if (!event.target.closest('.menu') && !event.target.closest('.menu-toggle')) {
                this.closeAllSubmenus();
            }
        });

        // Gestionnaire de touche Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllSubmenus();
                
                // Fermer le menu mobile si ouvert
                const mainMenu = document.getElementById('mainMenu');
                if (mainMenu && mainMenu.classList.contains('active')) {
                    this.toggleMobileMenu();
                }
            }
        });

        // Gestionnaire pour les éléments du menu
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const toolId = e.currentTarget.getAttribute('data-tool-id');
                if (toolId) {
                    this.showTool(toolId);
                    
                    // Fermer le menu mobile si ouvert
                    const mainMenu = document.getElementById('mainMenu');
                    if (mainMenu && mainMenu.classList.contains('active')) {
                        this.toggleMobileMenu();
                    }
                }
            });
        });

        // Gestionnaire pour les déclencheurs de sous-menu
        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const menuId = trigger.getAttribute('data-menu-id');
                if (menuId) {
                    this.toggleSubmenu(menuId);
                }
            });
        });
    }

    /**
     * Vérifie si une ancre est présente dans l'URL
     */
    checkUrlHash() {
        const hash = window.location.hash;
        if (hash) {
            const toolId = hash.slice(1);
            this.showTool(toolId);
        }
    }

    /**
     * Ferme tous les sous-menus
     */
    closeAllSubmenus() {
        document.querySelectorAll('.submenu').forEach(submenu => {
            submenu.classList.remove('active');
            const trigger = document.querySelector(`[data-menu-id="${submenu.id}"]`);
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
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
        
        // Fermer le menu mobile si la fenêtre est redimensionnée au-delà de 992px
        if (window.innerWidth > 992) {
            const mainMenu = document.getElementById('mainMenu');
            if (mainMenu && mainMenu.classList.contains('active')) {
                this.toggleMobileMenu();
            }
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

        const trigger = document.querySelector(`[data-menu-id="${menuId}"]`);
        if (!trigger) return;

        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const newState = forceState !== undefined ? forceState : !isExpanded;

        // Fermer les autres sous-menus
        document.querySelectorAll('.submenu').forEach(menu => {
            if (menu.id !== menuId) {
                menu.classList.remove('active');
                const otherTrigger = document.querySelector(`[data-menu-id="${menu.id}"]`);
                if (otherTrigger) {
                    otherTrigger.setAttribute('aria-expanded', 'false');
                }
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
     * Bascule l'état du menu mobile
     */
    toggleMobileMenu() {
        const mainMenu = document.getElementById('mainMenu');
        const menuOverlay = document.querySelector('.menu-overlay');
        
        if (mainMenu) {
            mainMenu.classList.toggle('active');
            
            if (menuOverlay) {
                menuOverlay.classList.toggle('active');
            }
            
            // Empêcher le défilement du body quand le menu est ouvert
            document.body.style.overflow = mainMenu.classList.contains('active') ? 'hidden' : '';
        }
    }

    /**
     * Affiche un outil spécifique
     * @param {string} toolId - L'identifiant de l'outil à afficher
     */
    showTool(toolId) {
        // Masquer tous les outils
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });

        // Afficher l'outil sélectionné
        const tool = document.getElementById(toolId);
        if (tool) {
            tool.style.display = 'block';
            
            // Mettre à jour l'URL sans recharger la page
            history.pushState({tool: toolId}, '', `#${toolId}`);
            
            // Mettre à jour l'état actif des boutons du menu
            document.querySelectorAll('.submenu-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-tool-id') === toolId) {
                    item.classList.add('active');
                }
            });

            // Fermer tous les sous-menus
            this.closeAllSubmenus();

            // Annoncer le changement pour l'accessibilité
            const toolTitle = tool.querySelector('h2');
            if (toolTitle) {
                Utils.announceToScreenReader(`Outil ${toolTitle.textContent} affiché`);
            }
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

    // Récupération du thème stocké ou utilisation du thème par défaut
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Gestion du switch de thème
    const themeSwitch = document.querySelector('.theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Gestion du menu toggle pour mobile
    const menuToggle = document.getElementById('menuToggle');
    const mainMenu = document.getElementById('mainMenu');
    
    if (menuToggle && mainMenu) {
        // Créer l'overlay pour le menu mobile s'il n'existe pas déjà
        let menuOverlay = document.querySelector('.menu-overlay');
        if (!menuOverlay) {
            menuOverlay = document.createElement('div');
            menuOverlay.className = 'menu-overlay';
            document.body.appendChild(menuOverlay);
        }
        
        // Fonction pour basculer le menu
        const toggleMenu = () => {
            mainMenu.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            document.body.style.overflow = mainMenu.classList.contains('active') ? 'hidden' : '';
        };
        
        // Événement pour le bouton de menu
        menuToggle.addEventListener('click', toggleMenu);
        
        // Fermer le menu en cliquant sur l'overlay
        menuOverlay.addEventListener('click', toggleMenu);
        
        // Fermer le menu en cliquant sur un lien du menu
        const menuLinks = mainMenu.querySelectorAll('a:not(.menu-trigger), .submenu-item');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mainMenu.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });
        
        // Fermer le menu lors du redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992 && mainMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    // Initialisation des gestionnaires
    window.app = new App();
    window.errorManager = ErrorManager;
    window.loadingManager = LoadingManager;
    window.performanceManager = PerformanceManager;
}); 