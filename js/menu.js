import { Utils } from './utils.js';
import { PerformanceManager } from './performance.js';

export const MenuManager = {
    /**
     * État du menu
     */
    state: {
        activeSubmenu: null,
        isMobile: window.innerWidth <= 768,
        shortcuts: new Map(),
        isMenuOpen: false,
        lastFocusedElement: null,
        isAnimating: false
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
        
        // Sauvegarder l'élément ayant le focus
        this.saveLastFocusedElement();
        
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
     * Sauvegarde le dernier élément ayant le focus
     */
    saveLastFocusedElement() {
        document.addEventListener('focusin', () => {
            this.state.lastFocusedElement = document.activeElement;
        }, true);
    },

    /**
     * Restaure le focus sur le dernier élément actif
     */
    restoreFocus() {
        if (this.state.lastFocusedElement) {
            this.state.lastFocusedElement.focus();
        }
    },

    /**
     * Configure les écouteurs pour le menu
     */
    setupMenuListeners() {
        // Gestion des clics sur les déclencheurs de menu avec debounce
        let clickTimeout;
        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                }
                
                clickTimeout = setTimeout(() => {
                    const menuId = trigger.getAttribute('data-menu-id');
                    if (menuId) {
                        this.toggleSubmenu(menuId);
                    }
                }, 100);
            });
        });

        // Gestion des clics sur les éléments du sous-menu avec debounce
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                }
                
                clickTimeout = setTimeout(() => {
                    const toolId = item.getAttribute('data-tool-id');
                    if (toolId) {
                        this.handleToolSelection(toolId);
                    }
                }, 100);
            });
        });

        // Fermeture des sous-menus lors d'un clic à l'extérieur avec debounce
        let closeTimeout;
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu')) {
                if (closeTimeout) {
                    clearTimeout(closeTimeout);
                }
                
                closeTimeout = setTimeout(() => {
                    this.closeAllSubmenus();
                }, 100);
            }
        });

        // Gestion du redimensionnement avec debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 150);
        });

        // Gestion du scroll avec limiteur de FPS pour améliorer les performances
        const handleScrollOptimized = PerformanceManager.frameRateLimiter((timestamp) => {
            this.handleScroll();
        }, 60);

        // Ajouter l'écouteur d'événement de défilement
        window.addEventListener('scroll', () => {
            // Démarrer le traitement optimisé à chaque défilement
            if (!this.scrollAnimationStop) {
                this.scrollAnimationStop = handleScrollOptimized();
                
                // Arrêter l'animation après un délai pour éviter les fuites de mémoire
                clearTimeout(this.scrollAnimationTimeout);
                this.scrollAnimationTimeout = setTimeout(() => {
                    if (this.scrollAnimationStop) {
                        this.scrollAnimationStop();
                        this.scrollAnimationStop = null;
                    }
                }, 200); // Arrêter si pas de scroll pendant 200ms
            }
        });
        
        // Nettoyer le gestionnaire lors du déchargement de la page
        window.addEventListener('unload', () => {
            // Arrêter l'animation de défilement si elle est en cours
            if (this.scrollAnimationStop) {
                this.scrollAnimationStop();
                this.scrollAnimationStop = null;
            }
            
            // Nettoyer le timeout
            if (this.scrollAnimationTimeout) {
                clearTimeout(this.scrollAnimationTimeout);
                this.scrollAnimationTimeout = null;
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
                this.restoreFocus();
            }

            // Navigation avec les flèches
            if (e.key.startsWith('Arrow')) {
                this.handleArrowNavigation(e.key);
            }

            // Navigation avec Tab
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });
    },

    /**
     * Gère la navigation avec Tab
     */
    handleTabNavigation(e) {
        const activeSubmenu = document.querySelector('.submenu.active');
        if (!activeSubmenu) return;

        const items = activeSubmenu.querySelectorAll('.submenu-item');
        const activeItem = document.activeElement;
        const lastItem = items[items.length - 1];

        if (e.shiftKey && activeItem === items[0]) {
            e.preventDefault();
            const trigger = document.querySelector(`[data-menu-id="${activeSubmenu.id}"]`);
            trigger?.focus();
        } else if (!e.shiftKey && activeItem === lastItem) {
            e.preventDefault();
            const nextTrigger = activeSubmenu.closest('.menu-category')?.nextElementSibling?.querySelector('.menu-trigger');
            nextTrigger?.focus();
        }
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
            if (!trigger.hasAttribute('role')) {
                trigger.setAttribute('role', 'button');
            }
        });

        document.querySelectorAll('.submenu').forEach(submenu => {
            if (!submenu.hasAttribute('aria-hidden')) {
                submenu.setAttribute('aria-hidden', 'true');
            }
            if (!submenu.hasAttribute('role')) {
                submenu.setAttribute('role', 'menu');
            }
        });

        document.querySelectorAll('.submenu-item').forEach(item => {
            if (!item.hasAttribute('role')) {
                item.setAttribute('role', 'menuitem');
            }
            if (!item.hasAttribute('tabindex')) {
                item.setAttribute('tabindex', '-1');
            }
        });
    },

    /**
     * Bascule l'affichage d'un sous-menu
     * @param {string} menuId - L'identifiant du menu
     */
    toggleSubmenu(menuId) {
        if (this.state.isAnimating) return;
        
        const submenu = document.getElementById(menuId);
        const trigger = document.querySelector(`[data-menu-id="${menuId}"]`);
        
        if (!submenu || !trigger) return;

        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;

        this.state.isAnimating = true;

        // Fermer les autres sous-menus
        this.closeAllSubmenus();

        // Basculer le sous-menu actuel
        submenu.classList.toggle('active', newState);
        trigger.setAttribute('aria-expanded', newState);
        submenu.setAttribute('aria-hidden', !newState);
        
        if (newState) {
            submenu.style.display = 'block';
            this.state.activeSubmenu = menuId;
            
            // Focus sur le premier élément du sous-menu
            const firstItem = submenu.querySelector('.submenu-item');
            if (firstItem) {
                firstItem.focus();
            }
        } else {
            this.state.activeSubmenu = null;
            trigger.focus();
        }

        // Annoncer le changement d'état pour l'accessibilité
        const message = newState ? 'Sous-menu ouvert' : 'Sous-menu fermé';
        if (Utils && typeof Utils.announceToScreenReader === 'function') {
            Utils.announceToScreenReader(message);
        }

        setTimeout(() => {
            this.state.isAnimating = false;
        }, 300);
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
            case 'ArrowRight':
                const nextCategory = menu.closest('.menu-category')?.nextElementSibling;
                if (nextCategory) {
                    const nextTrigger = nextCategory.querySelector('.menu-trigger');
                    nextTrigger?.focus();
                }
                return;
            case 'ArrowLeft':
                const prevCategory = menu.closest('.menu-category')?.previousElementSibling;
                if (prevCategory) {
                    const prevTrigger = prevCategory.querySelector('.menu-trigger');
                    prevTrigger?.focus();
                }
                return;
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
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const toolCards = document.querySelectorAll('.tools-grid .tool-card');
    if (!searchInput) return;
    searchInput.addEventListener('input', function() {
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;
        toolCards.forEach(function(card) {
            const text = card.textContent.toLowerCase();
            const match = text.includes(query);
            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });
        // Optionnel : afficher un message si aucun résultat
        let noResult = document.getElementById('noToolsFound');
        if (!noResult && visibleCount === 0) {
            noResult = document.createElement('div');
            noResult.id = 'noToolsFound';
            noResult.style.textAlign = 'center';
            noResult.style.color = '#888';
            noResult.style.fontSize = '1.1em';
            noResult.style.margin = '2rem 0';
            noResult.textContent = 'Aucun outil trouvé';
            document.querySelector('.tools-grid').parentNode.insertBefore(noResult, document.querySelector('.tools-grid').nextSibling);
        }
        if (noResult) noResult.style.display = (visibleCount === 0) ? '' : 'none';
    });
});