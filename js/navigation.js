import { Utils } from './utils.js';
import { PerformanceManager } from './performance.js';

export const NavigationManager = {
    /**
     * État de la navigation
     */
    state: {
        currentTool: null,
        history: [],
        maxHistory: 10
    },

    /**
     * Initialise le gestionnaire de navigation
     */
    init() {
        this.setupMenuListeners();
        this.setupHistoryNavigation();
        this.handleInitialRoute();
    },

    /**
     * Configure les écouteurs pour le menu
     */
    setupMenuListeners() {
        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const menuId = e.currentTarget.getAttribute('aria-controls');
                this.toggleSubmenu(menuId);
            });
        });

        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.closeAllSubmenus();
            });
        });

        // Fermer les sous-menus lors d'un clic à l'extérieur
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-category')) {
                this.closeAllSubmenus();
            }
        });

        // Support des touches du clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllSubmenus();
            }
        });
    },

    /**
     * Configure la navigation dans l'historique
     */
    setupHistoryNavigation() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tool) {
                this.showTool(e.state.tool, false);
            }
        });
    },

    /**
     * Gère la route initiale
     */
    handleInitialRoute() {
        const hash = window.location.hash.substring(1);
        this.showTool(hash || 'calculatorTool');
    },

    /**
     * Bascule l'affichage d'un sous-menu
     * @param {string} menuId - L'identifiant du menu
     */
    toggleSubmenu(menuId) {
        const menu = document.getElementById(menuId);
        const trigger = document.querySelector(`[aria-controls="${menuId}"]`);
        
        if (!menu || !trigger) return;

        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        
        // Fermer les autres sous-menus
        this.closeAllSubmenus();

        // Basculer l'état du menu actuel
        menu.setAttribute('aria-hidden', !isExpanded);
        trigger.setAttribute('aria-expanded', !isExpanded);
        
        if (!isExpanded) {
            menu.style.display = 'block';
            // Animation d'ouverture
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            requestAnimationFrame(() => {
                menu.style.transition = 'opacity 0.2s, transform 0.2s';
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            });
        } else {
            // Animation de fermeture
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                menu.style.display = 'none';
            }, 200);
        }
    },

    /**
     * Ferme tous les sous-menus
     */
    closeAllSubmenus() {
        document.querySelectorAll('.submenu').forEach(submenu => {
            submenu.style.display = 'none';
            submenu.setAttribute('aria-hidden', 'true');
        });

        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            trigger.setAttribute('aria-expanded', 'false');
        });
    },

    /**
     * Affiche un outil spécifique
     * @param {string} toolId - L'identifiant de l'outil
     * @param {boolean} updateHistory - Si l'historique doit être mis à jour
     */
    showTool(toolId, updateHistory = true) {
        if (!toolId) return;

        // Masquer tous les outils
        document.querySelectorAll('.tool-section').forEach(tool => {
            tool.style.display = 'none';
        });

        // Afficher l'outil demandé
        const tool = document.getElementById(toolId);
        if (tool) {
            tool.style.display = 'block';
            
            // Animation d'apparition optimisée
            tool.style.opacity = '0';
            
            // Utiliser le gestionnaire de performance pour une animation plus fluide
            const animate = (timestamp) => {
                tool.style.transition = 'opacity 0.3s ease-in-out';
                tool.style.opacity = '1';
            };
            
            PerformanceManager.requestAnimationFrameOnce(animate);

            // Mettre à jour l'état
            this.state.currentTool = toolId;
            
            // Mettre à jour l'historique si nécessaire
            if (updateHistory) {
                const url = `#${toolId}`;
                history.pushState({ tool: toolId }, '', url);
                
                // Mettre à jour l'historique interne
                this.state.history.unshift(toolId);
                if (this.state.history.length > this.state.maxHistory) {
                    this.state.history.pop();
                }
            }

            // Émettre un événement pour informer du changement d'outil
            window.dispatchEvent(new CustomEvent('toolchange', {
                detail: { toolId, previousTool: this.state.currentTool }
            }));
        }
    },

    /**
     * Retourne à l'outil précédent
     */
    goBack() {
        if (this.state.history.length > 1) {
            const previousTool = this.state.history[1];
            history.back();
            return true;
        }
        return false;
    }
}; 