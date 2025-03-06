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
    }

    /**
     * Initialise les outils
     */
    initTools() {
        // Initialiser le gestionnaire de couleurs
        ColorManager.init();
    }
}

// Initialiser l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

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