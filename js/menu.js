import { Utils } from './utils.js';

export const MenuManager = {
    /**
     * État du menu
     */
    state: {
        activeSubmenu: null,
        isMobile: window.innerWidth <= 768,
        shortcuts: new Map(),
        isMenuOpen: false
    },

    /**
     * Initialise le gestionnaire de menu
     */
    init() {
        this.setupMenuListeners();
        this.setupKeyboardShortcuts();
        this.setupResponsiveMenu();
        this.setupAccessibility();
        this.setupOverlay();
    },

    /**
     * Configure les écouteurs pour le menu
     */
    setupMenuListeners() {
        // Gestion des clics sur les déclencheurs de menu
        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const menuId = e.currentTarget.getAttribute('aria-controls');
                this.toggleSubmenu(menuId);
            });
        });

        // Gestion des clics sur les éléments du sous-menu
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const toolId = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.handleToolSelection(toolId);
            });
        });

        // Fermeture des sous-menus lors d'un clic à l'extérieur
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-category')) {
                this.closeAllSubmenus();
            }
        });

        // Gestion du redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Gestion du scroll
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    },

    /**
     * Configure les raccourcis clavier
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Échap pour fermer les menus
            if (e.key === 'Escape') {
                if (this.state.isMenuOpen) {
                    this.closeMobileMenu();
                } else {
                    this.closeAllSubmenus();
                }
            }

            // Navigation avec les flèches
            if (e.key.startsWith('Arrow')) {
                this.handleArrowNavigation(e.key);
            }

            // Raccourcis personnalisés
            if (e.ctrlKey || e.metaKey) {
                this.handleCustomShortcuts(e);
            }
        });
    },

    /**
     * Configure le menu responsive
     */
    setupResponsiveMenu() {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.setAttribute('aria-label', 'Menu principal');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        
        document.querySelector('header').appendChild(menuToggle);

        menuToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
    },

    /**
     * Configure l'overlay pour le menu mobile
     */
    setupOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });
    },

    /**
     * Configure l'accessibilité du menu
     */
    setupAccessibility() {
        // Ajout des attributs ARIA manquants
        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            if (!trigger.hasAttribute('aria-haspopup')) {
                trigger.setAttribute('aria-haspopup', 'true');
            }
            if (!trigger.hasAttribute('aria-expanded')) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });

        document.querySelectorAll('.submenu').forEach(submenu => {
            if (!submenu.hasAttribute('aria-hidden')) {
                submenu.setAttribute('aria-hidden', 'true');
            }
        });

        // Gestion du focus
        document.querySelectorAll('.menu-trigger, .submenu-item').forEach(element => {
            element.addEventListener('focus', () => {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        });
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
            this.state.activeSubmenu = menuId;
            
            // Animation d'ouverture
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            requestAnimationFrame(() => {
                menu.style.transition = 'opacity 0.2s, transform 0.2s';
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            });
        } else {
            this.state.activeSubmenu = null;
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

        this.state.activeSubmenu = null;
    },

    /**
     * Gère la sélection d'un outil
     * @param {string} toolId - L'identifiant de l'outil
     */
    handleToolSelection(toolId) {
        // Fermer tous les sous-menus
        this.closeAllSubmenus();
        
        // Fermer le menu mobile si nécessaire
        if (this.state.isMobile) {
            this.closeMobileMenu();
        }

        // Émettre un événement pour le changement d'outil
        window.dispatchEvent(new CustomEvent('toolchange', {
            detail: { toolId }
        }));
    },

    /**
     * Gère la navigation avec les flèches du clavier
     * @param {string} key - La touche pressée
     */
    handleArrowNavigation(key) {
        if (!this.state.activeSubmenu) return;

        const menu = document.getElementById(this.state.activeSubmenu);
        const items = menu.querySelectorAll('.submenu-item');
        const activeItem = menu.querySelector('.submenu-item:focus');

        if (!activeItem) {
            items[0].focus();
            return;
        }

        const currentIndex = Array.from(items).indexOf(activeItem);
        let nextIndex;

        switch (key) {
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowUp':
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                break;
            case 'ArrowRight':
                const parentTrigger = menu.closest('.menu-category').querySelector('.menu-trigger');
                this.closeAllSubmenus();
                parentTrigger.nextElementSibling?.querySelector('.menu-trigger')?.focus();
                return;
            case 'ArrowLeft':
                const prevTrigger = menu.closest('.menu-category').querySelector('.menu-trigger');
                this.closeAllSubmenus();
                prevTrigger.previousElementSibling?.querySelector('.menu-trigger')?.focus();
                return;
        }

        items[nextIndex].focus();
    },

    /**
     * Gère les raccourcis clavier personnalisés
     * @param {KeyboardEvent} e - L'événement clavier
     */
    handleCustomShortcuts(e) {
        // Exemple de raccourcis (à personnaliser selon les besoins)
        const shortcuts = {
            'c': 'calculatorTool',
            't': 'timerTool',
            'n': 'noteTool',
            'p': 'passwordTool'
        };

        const key = e.key.toLowerCase();
        if (shortcuts[key]) {
            e.preventDefault();
            this.handleToolSelection(shortcuts[key]);
        }
    },

    /**
     * Gère le redimensionnement de la fenêtre
     */
    handleResize() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile !== this.state.isMobile) {
            this.state.isMobile = isMobile;
            if (!isMobile) {
                this.closeMobileMenu();
            }
        }
    },

    /**
     * Gère le scroll de la page
     */
    handleScroll() {
        if (this.state.isMobile && this.state.isMenuOpen) {
            const header = document.querySelector('header');
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 0) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    },

    /**
     * Bascule l'état du menu mobile
     */
    toggleMobileMenu() {
        const menu = document.querySelector('.menu');
        const overlay = document.querySelector('.menu-overlay');
        
        if (!this.state.isMenuOpen) {
            menu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.state.isMenuOpen = true;
        } else {
            this.closeMobileMenu();
        }
    },

    /**
     * Ferme le menu mobile
     */
    closeMobileMenu() {
        const menu = document.querySelector('.menu');
        const overlay = document.querySelector('.menu-overlay');
        
        menu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.state.isMenuOpen = false;
        this.closeAllSubmenus();
    }
}; 