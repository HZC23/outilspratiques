import { ThemeManager } from './theme.js';
import { ClockManager } from './clock.js';
import { MenuManager } from './menu.js';
import { NotificationManager } from './notification.js';
import { CacheManager } from './cache.js';
import { PerformanceManager } from './performance.js';
import { Utils } from './utils.js';

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
        // Initialiser les polyfills
        this.initPolyfills();
        
        // Initialiser le service worker
        this.initServiceWorker();
        
        // Initialiser le gestionnaire de thème
        ThemeManager.init();
        
        // Initialiser l'horloge
        ClockManager.init();
        
        // Initialiser le menu
        MenuManager.init();
        
        // Initialiser les outils
        this.initTools();
        
        // Initialiser les gestionnaires d'événements
        this.initEventHandlers();
        
        // Vérifier si une ancre est présente dans l'URL
        this.checkUrlHash();
        
        // Initialiser la gestion de l'installation PWA
        this.initPWA();
        
        // Initialiser le lazy loading des images
        this.initLazyLoading();
        
        // Vérifier si les animations sont réduites
        const prefersReducedMotion = window.innerWidth <= 768 && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            console.log('Les animations sont désactivées car votre système est configuré pour réduire les animations');
            Utils.showNotification('Les animations sont désactivées dans vos préférences système', 'info');
        }
        
        console.log('Application initialisée');
    }
    
    /**
     * Initialise les polyfills
     */
    initPolyfills() {
        // Polyfill pour Element.prototype.matches
        if (!Element.prototype.matches) {
            Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
        }
        
        // Polyfill pour Element.prototype.closest
        if (!Element.prototype.closest) {
            Element.prototype.closest = function(s) {
                let el = this;
                do {
                    if (el.matches(s)) return el;
                    el = el.parentElement || el.parentNode;
                } while (el !== null && el.nodeType === 1);
                return null;
            };
        }
    }
    
    /**
     * Initialise le service worker
     */
    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('ServiceWorker registration successful');
                }).catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
        
        window.addEventListener('online', () => {
            document.body.classList.remove('offline');
            NotificationManager.show('Connexion rétablie', 'success');
        });
        
        window.addEventListener('offline', () => {
            document.body.classList.add('offline');
            NotificationManager.show('Vous êtes hors ligne', 'warning');
        });
    }
    
    /**
     * Initialise la gestion de l'installation PWA
     */
    initPWA() {
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPromotion(deferredPrompt);
        });
    }
    
    /**
     * Affiche la promotion d'installation
     * @param {Event} deferredPrompt - L'événement beforeinstallprompt
     */
    showInstallPromotion(deferredPrompt) {
        const installButton = document.createElement('button');
        installButton.textContent = 'Installer l\'application';
        installButton.classList.add('install-button');
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
                installButton.remove();
            }
        });
        document.body.appendChild(installButton);
    }
    
    /**
     * Initialise le lazy loading des images
     */
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback pour les navigateurs qui ne supportent pas IntersectionObserver
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
    
    /**
     * Initialise les outils
     */
    initTools() {
        // Initialiser les outils spécifiques ici
        // Chaque outil devrait avoir son propre module
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
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.tool) {
                this.showTool(event.state.tool);
            } else {
                const toolId = window.location.hash.slice(1);
                if (toolId) {
                    this.showTool(toolId);
                }
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
                }
            });
        });
        
        // Support du pavé numérique pour la calculatrice
        document.addEventListener('keydown', (event) => {
            if (!document.getElementById('calculatorTool')?.classList.contains('active')) return;
            
            // Empêcher l'action si l'utilisateur appuie sur un bouton de la calculatrice (évite les doublons)
            if (event.target.closest('.calculator-grid button')) return;
            
            const keyMap = {
                "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
                ".": ".", "/": "÷", "*": "×", "-": "-", "+": "+",
                "Enter": "=", "Backspace": "backspace", "Escape": "clear"
            };
            
            if (keyMap[event.key] !== undefined) {
                event.preventDefault();
                
                if (event.key === "Enter") {
                    calculate();
                } else if (event.key === "Backspace") {
                    backspace();
                } else if (event.key === "Escape") {
                    clearCalc();
                } else {
                    addToCalc(keyMap[event.key]);
                }
            }
        });
    }
    
    /**
     * Gère le redimensionnement de la fenêtre
     */
    handleResize() {
        // Mettre à jour l'état de l'application en fonction de la taille de la fenêtre
        const isMobile = window.innerWidth <= 768;
        
        // Mettre à jour l'état du menu
        if (MenuManager.state.isMobile !== isMobile) {
            MenuManager.state.isMobile = isMobile;
            
            if (!isMobile) {
                // Passer du mobile au desktop
                MenuManager.closeMobileMenu();
            }
        }
    }
    
    /**
     * Ferme tous les sous-menus
     */
    closeAllSubmenus() {
        document.querySelectorAll('.submenu.active').forEach(submenu => {
            const trigger = document.querySelector(`[data-menu-id="${submenu.id}"]`);
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
            submenu.classList.remove('active');
            submenu.setAttribute('aria-hidden', 'true');
        });
    }
    
    /**
     * Bascule l'affichage du menu mobile
     */
    toggleMobileMenu() {
        const menu = document.getElementById('mainMenu');
        const menuToggle = document.getElementById('menuToggle');
        const overlay = document.querySelector('.menu-overlay');
        
        if (!menu || !menuToggle) return;
        
        const isActive = menu.classList.contains('active');
        
        menu.classList.toggle('active', !isActive);
        menuToggle.setAttribute('aria-expanded', !isActive);
        
        if (overlay) {
            overlay.classList.toggle('active', !isActive);
        }
        
        // Bloquer le défilement du body quand le menu est ouvert
        document.body.style.overflow = !isActive ? 'hidden' : '';
    }
    
    /**
     * Affiche un outil spécifique
     * @param {string} toolId - L'identifiant de l'outil à afficher
     */
    showTool(toolId) {
        // Animation de sortie pour l'outil actuel
        const currentTool = document.querySelector('.section.active');
        if (currentTool) {
            currentTool.style.opacity = '0';
            currentTool.style.transform = 'translateY(20px)';
        }
        
        // Masquer tous les outils après l'animation
        setTimeout(() => {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            // Afficher le nouvel outil avec animation
            const tool = document.getElementById(toolId);
            if (tool) {
                tool.classList.add('active');
                tool.style.display = 'block';
                
                requestAnimationFrame(() => {
                    tool.style.opacity = '1';
                    tool.style.transform = 'translateY(0)';
                });
                
                // Mettre à jour l'URL
                history.pushState({ tool: toolId }, '', `#${toolId}`);
                
                // Mettre à jour le menu
                this.updateMenuState(toolId);
            }
        }, 300);
    }
    
    /**
     * Met à jour l'état du menu en fonction de l'outil actif
     * @param {string} toolId - L'identifiant de l'outil actif
     */
    updateMenuState(toolId) {
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-tool-id') === toolId) {
                item.classList.add('active');
                
                // Ouvrir le sous-menu parent si nécessaire
                const parentSubmenu = item.closest('.submenu');
                if (parentSubmenu) {
                    parentSubmenu.classList.add('active');
                    const trigger = document.querySelector(`[data-menu-id="${parentSubmenu.id}"]`);
                    if (trigger) {
                        trigger.setAttribute('aria-expanded', 'true');
                    }
                }
            }
        });
    }
    
    /**
     * Vérifie si une ancre est présente dans l'URL
     */
    checkUrlHash() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            this.showTool(hash);
        } else {
            // Afficher l'outil par défaut
            const defaultTool = document.querySelector('.section');
            if (defaultTool) {
                defaultTool.style.display = 'block';
            }
        }
    }
}

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Gestion des erreurs globales
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
    NotificationManager.show('Une erreur est survenue. Veuillez réessayer.', 'error');
    return false;
}; 