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
        // Supprimer les écouteurs d'événements existants pour éviter les conflits
        this.removeExistingListeners();
        
        // Configurer les différents aspects du menu
        this.setupMenuListeners();
        this.setupKeyboardShortcuts();
        this.setupResponsiveMenu();
        this.setupAccessibility();
        this.setupOverlay();
        this.setupCompactMenu();
        
        // Vérifier si une ancre est présente dans l'URL
        this.checkUrlHash();
        
        console.log('Gestionnaire de menu initialisé');
    },
    
    /**
     * Supprime les écouteurs d'événements existants
     */
    removeExistingListeners() {
        // Cloner et remplacer les éléments pour supprimer tous les écouteurs d'événements
        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            const clone = trigger.cloneNode(true);
            trigger.parentNode.replaceChild(clone, trigger);
        });
        
        document.querySelectorAll('.submenu-item').forEach(item => {
            const clone = item.cloneNode(true);
            item.parentNode.replaceChild(clone, item);
        });
    },

    /**
     * Configure les écouteurs pour le menu
     */
    setupMenuListeners() {
        // Gestion des clics sur les déclencheurs de menu
        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Empêcher la propagation de l'événement
                const menuId = trigger.getAttribute('data-menu-id');
                if (menuId) {
                    this.toggleSubmenu(menuId);
                }
            });
        });

        // Gestion des clics sur les éléments du sous-menu
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher la propagation de l'événement
                const toolId = item.getAttribute('data-tool-id');
                if (toolId) {
                    this.handleToolSelection(toolId);
                }
            });
        });

        // Fermeture des sous-menus lors d'un clic à l'extérieur
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu')) {
                this.closeAllSubmenus();
            }
        });

        // Gestion du redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Gestion du scroll avec throttling pour limiter la fréquence des appels
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    this.handleScroll();
                    scrollTimeout = null;
                }, 10); // Limite à 100 appels par seconde maximum
            }
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
        });
    },

    /**
     * Configure le menu responsive
     */
    setupResponsiveMenu() {
        const menuToggle = document.getElementById('menuToggle');
        if (!menuToggle) {
            const newMenuToggle = document.createElement('button');
            newMenuToggle.id = 'menuToggle';
            newMenuToggle.className = 'menu-toggle';
            newMenuToggle.setAttribute('aria-label', 'Menu principal');
            newMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            
            document.querySelector('header').appendChild(newMenuToggle);
            
            newMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        } else {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
    },

    /**
     * Configure l'overlay pour le menu mobile
     */
    setupOverlay() {
        let overlay = document.querySelector('.menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'menu-overlay';
            document.body.appendChild(overlay);
        }

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
    },

    /**
     * Bascule l'affichage d'un sous-menu
     * @param {string} menuId - L'identifiant du menu
     */
    toggleSubmenu(menuId) {
        const submenu = document.getElementById(menuId);
        if (!submenu) return;

        const trigger = document.querySelector(`[data-menu-id="${menuId}"]`);
        if (!trigger) return;

        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;

        // Fermer les autres sous-menus
        this.closeAllSubmenus();

        // Basculer le sous-menu actuel
        submenu.classList.toggle('active', newState);
        trigger.setAttribute('aria-expanded', newState);
        submenu.setAttribute('aria-hidden', !newState);
        
        // Empêcher la fermeture automatique
        if (newState) {
            submenu.style.display = 'block';
            this.state.activeSubmenu = menuId;
        } else {
            this.state.activeSubmenu = null;
        }
        
        // Annoncer le changement d'état pour l'accessibilité
        const message = newState ? 'Sous-menu ouvert' : 'Sous-menu fermé';
        if (Utils && typeof Utils.announceToScreenReader === 'function') {
            Utils.announceToScreenReader(message);
        }
    },

    /**
     * Ferme tous les sous-menus
     */
    closeAllSubmenus() {
        document.querySelectorAll('.submenu.active').forEach(submenu => {
            submenu.classList.remove('active');
            submenu.style.display = 'none';
            submenu.setAttribute('aria-hidden', 'true');
            
            const trigger = document.querySelector(`[data-menu-id="${submenu.id}"]`);
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });

        this.state.activeSubmenu = null;
    },
    
    /**
     * Bascule l'état du menu mobile
     */
    toggleMobileMenu() {
        const mainMenu = document.getElementById('mainMenu');
        const menuOverlay = document.querySelector('.menu-overlay');
        const menuToggle = document.getElementById('menuToggle');
        
        if (!mainMenu) return;
        
        if (mainMenu.classList.contains('active')) {
            // Fermer le menu
            mainMenu.classList.remove('active');
            if (menuOverlay) menuOverlay.classList.remove('active');
            document.body.classList.remove('menu-open');
            
            // Changer l'icône
            if (menuToggle) {
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
            
            this.state.isMenuOpen = false;
        } else {
            // Ouvrir le menu
            mainMenu.classList.add('active');
            if (menuOverlay) menuOverlay.classList.add('active');
            document.body.classList.add('menu-open');
            
            // Changer l'icône
            if (menuToggle) {
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                }
            }
            
            this.state.isMenuOpen = true;
        }
    },
    
    /**
     * Ferme le menu mobile
     */
    closeMobileMenu() {
        const mainMenu = document.getElementById('mainMenu');
        const menuOverlay = document.querySelector('.menu-overlay');
        const menuToggle = document.getElementById('menuToggle');
        
        if (!mainMenu) return;
        
        mainMenu.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
        
        // Changer l'icône
        if (menuToggle) {
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
        
        this.state.isMenuOpen = false;
    },

    /**
     * Gère la sélection d'un outil
     * @param {string} toolId - L'identifiant de l'outil
     */
    handleToolSelection(toolId) {
        if (!toolId) return;
        
        // Afficher l'outil correspondant
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        const tool = document.getElementById(toolId);
        if (tool) {
            tool.style.display = 'block';
            
            // Mettre à jour l'URL
            history.pushState({tool: toolId}, '', `#${toolId}`);
            
            // Mettre à jour l'état actif des boutons du menu
            document.querySelectorAll('.submenu-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-tool-id') === toolId) {
                    item.classList.add('active');
                }
            });
            
            // Annoncer le changement pour l'accessibilité
            const toolTitle = tool.querySelector('h2');
            if (toolTitle && Utils && typeof Utils.announceToScreenReader === 'function') {
                Utils.announceToScreenReader(`Outil ${toolTitle.textContent} affiché`);
            }
        }
        
        // Fermer tous les sous-menus
        this.closeAllSubmenus();
        
        // Fermer le menu mobile si nécessaire
        if (this.state.isMobile) {
            this.closeMobileMenu();
        }
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
            default:
                return;
        }

        items[nextIndex].focus();
    },

    /**
     * Gère le redimensionnement de la fenêtre
     */
    handleResize() {
        const wasMobile = this.state.isMobile;
        this.state.isMobile = window.innerWidth <= 768;
        
        // Si passe de mobile à desktop ou inversement
        if (wasMobile !== this.state.isMobile) {
            if (this.state.isMobile) {
                // Passe en mode mobile
                this.closeMobileMenu();
                document.querySelector('.toggle-menu-width')?.classList.add('hidden');
            } else {
                // Passe en mode desktop
                document.querySelector('.toggle-menu-width')?.classList.remove('hidden');
                
                // Restaurer le mode compact si préféré
                const preferCompact = localStorage.getItem('menuCompact') === 'true';
                if (preferCompact) {
                    document.getElementById('mainMenu')?.classList.add('compact');
                }
            }
        }
    },

    /**
     * Gère le défilement de la page et ajuste la position du menu en conséquence
     * Optimisé pour le défilement asynchrone avec requestAnimationFrame
     */
    handleScroll() {
        // Évite les appels multiples dans la même frame
        if (this.scrollRAF) return;
        
        this.scrollRAF = window.requestAnimationFrame(() => {
            const header = document.querySelector('header');
            const menu = document.querySelector('.menu');
            
            if (!header || !menu || this.state.isMobile) {
                this.scrollRAF = null;
                return;
            }
            
            const headerHeight = header.offsetHeight;
            const scrollPosition = window.scrollY;
            const menuHeight = menu.offsetHeight;
            const viewportHeight = window.innerHeight;
            
            // Si le menu est plus grand que la hauteur du viewport moins l'espace pour le header,
            // on le laisse en position sticky (définie dans le CSS)
            if (menuHeight > viewportHeight - headerHeight - 2 * parseInt(getComputedStyle(document.documentElement).getPropertyValue('--spacing-md'))) {
                menu.style.position = 'sticky';
                menu.style.transform = 'none';
                this.scrollRAF = null;
                return;
            }
            
            if (scrollPosition > headerHeight) {
                // Utilise transform au lieu de top pour de meilleures performances
                menu.style.position = 'fixed';
                menu.style.transform = 'translateY(0)';
            } else {
                menu.style.position = 'sticky';
                menu.style.transform = 'none';
            }
            
            this.scrollRAF = null;
        });
    },
    
    /**
     * Vérifie si une ancre est présente dans l'URL
     */
    checkUrlHash() {
        const hash = window.location.hash;
        if (hash) {
            const toolId = hash.slice(1);
            this.handleToolSelection(toolId);
        } else {
            // Afficher le premier outil par défaut
            const firstTool = document.querySelector('.section');
            if (firstTool) {
                firstTool.style.display = 'block';
            }
        }
    },

    /**
     * Configure le menu compact
     */
    setupCompactMenu() {
        const toggleButton = document.getElementById('toggleMenuWidth');
        if (!toggleButton) return;
        
        // Restaurer l'état compact si préféré par l'utilisateur
        const preferCompact = localStorage.getItem('menuCompact') === 'true';
        const menu = document.getElementById('mainMenu');
        
        if (preferCompact && !this.state.isMobile) {
            menu?.classList.add('compact');
        }
        
        toggleButton.addEventListener('click', () => {
            menu?.classList.toggle('compact');
            
            // Sauvegarder la préférence
            const isCompact = menu?.classList.contains('compact');
            localStorage.setItem('menuCompact', isCompact);
            
            // Annoncer pour l'accessibilité
            const message = isCompact ? 'Menu réduit' : 'Menu étendu';
            if (Utils && typeof Utils.announceToScreenReader === 'function') {
                Utils.announceToScreenReader(message);
            }
        });
    },
}; 