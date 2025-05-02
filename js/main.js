import { ThemeManager } from './theme.js';
import { ClockManager } from './clock.js';
import { MenuManager } from './menu.js';
import { NotificationManager } from './notification.js';
import { CacheManager } from './cache.js';
import { PerformanceManager } from './performance.js';
import { Utils } from './utils.js';
import { SchedulerManager } from './tools/scheduler.js';
import { ColorManager } from './tools/color.js';
import { QRCodeManager } from './tools/qrcode.js';
import { TodoManager } from './tools/todo.js';
import { StopwatchManager } from './tools/stopwatch.js';

/**
 * Classe principale de l'application
 */
class App {
    constructor() {
        this.init();
        this.initErrorHandling();
    }

    /**
     * Initialise l'application
     */
    init() {
        
        // Initialiser les polyfills
        this.initPolyfills();
        
        // Initialiser le service worker selon le paramètre offlineMode
        this.initServiceWorkerBySettings();
        
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
     * Active/désactive le Service Worker selon le paramètre offlineMode
     */
    initServiceWorkerBySettings() {
        const settings = JSON.parse(localStorage.getItem('appSettings'));
        const offlineMode = settings && settings.sync && settings.sync.offlineMode;
        if (offlineMode) {
            this.registerServiceWorker();
        } else {
            this.unregisterServiceWorker();
        }
    }
    
    /**
     * Enregistre le Service Worker si non déjà actif
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
                if (!reg) {
                    navigator.serviceWorker.register('/sw.js').then(registration => {
                        this.showSWUpdateNotification(registration);
                    });
                } else {
                    this.showSWUpdateNotification(reg);
                }
            });
        }
    }
    
    /**
     * Désenregistre le Service Worker et vide le cache
     */
    unregisterServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
                if (reg) {
                    reg.unregister().then(() => {
                        if (window.caches) {
                            caches.keys().then(keys => {
                                Promise.all(keys.map(key => caches.delete(key)));
                            });
                        }
                    });
                }
            });
        }
    }
    
    /**
     * Affiche une notification si une nouvelle version du SW est disponible
     */
    showSWUpdateNotification(registration) {
        if (!registration) return;
        if (registration.waiting) {
            this.showNotification('Nouvelle version disponible. Rechargez la page pour mettre à jour.', 'info');
        }
        registration.onupdatefound = () => {
            const newWorker = registration.installing;
            newWorker.onstatechange = () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.showNotification('Nouvelle version disponible. Rechargez la page pour mettre à jour.', 'info');
                }
            };
        };
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
        // Les gestionnaires d'outils sont maintenant initialisés à la demande
        // dans leur propre fichier, seulement lorsque les éléments DOM sont présents
        
        // Configurer le gestionnaire de chargement des outils
        document.querySelectorAll('[data-tool-id]').forEach(toolBtn => {
            toolBtn.addEventListener('click', () => {
                const toolId = toolBtn.getAttribute('data-tool-id');
                this.showTool(toolId);
            });
        });
        
        // Initialiser les gestionnaires d'outils spécifiques si nécessaire
        if (document.getElementById('todoTool')) {
            TodoManager.init();
        }
        
        console.log('Gestionnaires d\'outils configurés pour initialisation à la demande');
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
     * @param {string} toolId - Identifiant de l'outil
     */
    showTool(toolId) {
        console.log(`Affichage de l'outil: ${toolId}`);
        
        // Récupérer le conteneur des outils
        const toolsContainer = document.getElementById('toolsContainer');
        if (!toolsContainer) return;
        
        // Afficher l'indicateur de chargement
        toolsContainer.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Chargement de l\'outil...</p></div>';
        
        // Charger le contenu de l'outil
        const toolContentUrl = `./html/tools/${toolId.toLowerCase().replace('tool', '')}.html`;
        
        fetch(toolContentUrl)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`L'outil "${toolId}" n'existe pas.`);
                    }
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                toolsContainer.innerHTML = html;
                
                // Mettre à jour l'URL avec l'ancre
                history.pushState(null, null, `#${toolId}`);
                
                // Animer l'entrée
                toolsContainer.classList.add('tool-fade-in');
                setTimeout(() => toolsContainer.classList.remove('tool-fade-in'), 500);
                
                // Charger le script spécifique à l'outil si nécessaire
                this.loadToolScript(toolId);
            })
            .catch(error => {
                console.error('Erreur lors du chargement de l\'outil:', error);
                const errorMessage = error.message.includes('404') 
                    ? `L'outil "${toolId}" n'existe pas ou n'est pas disponible.`
                    : 'Une erreur est survenue lors du chargement de l\'outil. Veuillez réessayer plus tard.';
                
                toolsContainer.innerHTML = `
                    <div class="error-container">
                        <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <h3>Erreur lors du chargement de l'outil</h3>
                        <p>${errorMessage}</p>
                        <button type="button" class="retry-btn" onclick="app.showTool('${toolId}')">Réessayer</button>
                    </div>
                `;
            });
    }
    
    /**
     * Charge le script d'un outil
     */
    loadToolScript(toolId) {
        // Liste des correspondances entre ID d'outil et leurs managers
        const toolManagers = {
            'calculatorTool': () => import('./tools/calculator.js').then(module => module.CalculatorManager.init()),
            'timerTool': () => import('./tools/timer.js').then(module => module.TimerManager.init()),
            'stopwatchTool': () => import('./tools/stopwatch.js').then(module => module.StopwatchManager.init()),
            'noteTool': () => import('./tools/notes.js').then(module => module.NotesManager.init()),
            'todoTool': () => import('./tools/todo.js').then(module => module.TodoManager.init()),
            'translatorTool': () => import('./tools/translator.js').then(module => module.TranslatorManager.init()),
            'colorTool': () => import('./tools/color.js').then(module => module.ColorManager.init()),
            'qrcodeTool': () => import('./tools/qrcode.js').then(module => module.QRCodeManager.init()),
            'passwordTool': () => import('./tools/password.js').then(module => module.PasswordManager.init()),
            'styletext': () => import('./tools/styletext.js').then(module => module.StyleTextManager.init()),
            'metronomeTool': () => import('./tools/metronome.js').then(module => module.MetronomeManager.init()),
            'currencyTool': () => import('./tools/currency.js').then(module => module.CurrencyManager.init()),
            'unitTool': () => import('./tools/unit.js').then(module => {
                console.log('Module unitTool chargé:', module);
                if (typeof module.initUnitConverter === 'function') {
                    console.log('Initialisation du convertisseur avec initUnitConverter');
                    module.initUnitConverter();
                } else if (module.UnitConverter && typeof module.UnitConverter.init === 'function') {
                    console.log('Initialisation du convertisseur avec UnitConverter.init');
                    module.UnitConverter.init();
                } else {
                    console.error('Impossible de trouver une méthode d\'initialisation pour le convertisseur d\'unités');
                }
            }),
            'parameterTool': () => {
                console.error(`Erreur lors du chargement de l'outil: L'outil "${toolId}" n'existe pas.`);
                Utils.showNotification(`L'outil "${toolId}" n'existe pas.`, 'error');
            },
            'textEditorTool': () => import('./tools/textEditor.js').then(module => module.init()),
        };

        // Charger le gestionnaire correspondant
        if (toolManagers[toolId]) {
            toolManagers[toolId]()
                .catch(error => {
                    console.error(`Erreur lors du chargement de l'outil ${toolId}:`, error);
                    Utils.showNotification(`Impossible de charger l'outil`, 'error');
                });
        } else {
            console.log(`Pas de gestionnaire défini pour l'outil ${toolId}`);
        }
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

    initErrorHandling() {
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
            return false;
        };
    }


    /**
     * Affiche une notification accessible
     */
    showNotification(message, type = 'success') {
        const notif = document.createElement('div');
        notif.textContent = message;
        notif.style.position = 'fixed';
        notif.style.bottom = '30px';
        notif.style.right = '30px';
        notif.style.background = type === 'info' ? '#2196F3' : (type === 'success' ? '#4CAF50' : '#e74c3c');
        notif.style.color = '#fff';
        notif.style.padding = '14px 24px';
        notif.style.borderRadius = '8px';
        notif.style.fontWeight = 'bold';
        notif.style.zIndex = 9999;
        notif.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        notif.style.opacity = '0.95';
        notif.setAttribute('role', 'status');
        notif.setAttribute('aria-live', 'polite');
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.style.transition = 'opacity 0.5s';
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 500);
        }, 3200);
    }
}

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    window.app = new App();
});

// Fonction pour charger dynamiquement les outils
function loadTool(toolName) {
    console.log(`Chargement de l'outil: ${toolName}`);
    
    // Vérifier si l'outil est déjà chargé
    if (document.querySelector(`#${toolName}Tool`)) {
        console.log(`L'outil ${toolName} est déjà chargé.`);
        return Promise.resolve();
    }

    // Chemin vers les fichiers de l'outil
    const htmlPath = `html/tools/${toolName}.html`;
    const jsPath = `js/tools/${toolName}.js`;

    // Charger le HTML de l'outil
    return fetch(htmlPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur lors du chargement du HTML de l'outil ${toolName}: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Insérer le HTML dans le conteneur d'outils
            const toolsContainer = document.getElementById('toolsContainer');
            
            if (!toolsContainer) {
                throw new Error("Conteneur d'outils non trouvé");
            }
            
            toolsContainer.innerHTML = html;
            console.log(`HTML de l'outil ${toolName} chargé avec succès.`);
            
            // Charger et exécuter le JS de l'outil
            return import(jsPath)
                .then(module => {
                    console.log(`Module JS de l'outil ${toolName} chargé avec succès:`, module);
                    
                    // Si le module a une fonction d'initialisation, l'exécuter
                    if (module.init) {
                        console.log(`Initialisation de l'outil ${toolName} via module.init()`);
                        module.init();
                    } else if (module.initUnitConverter && toolName === 'unit') {
                        console.log(`Initialisation du convertisseur d'unités via module.initUnitConverter()`);
                        module.initUnitConverter();
                    } else {
                        console.log(`Pas de fonction d'initialisation trouvée pour l'outil ${toolName}`);
                    }
                    
                    // Dispatcher un événement pour signaler que l'outil est chargé
                    const event = new CustomEvent('toolLoaded', { detail: { toolName } });
                    document.dispatchEvent(event);
                })
                .catch(error => {
                    console.error(`Erreur lors du chargement du JS de l'outil ${toolName}:`, error);
                    throw error;
                });
        })
        .catch(error => {
            console.error(`Erreur lors du chargement de l'outil ${toolName}:`, error);
            throw error;
        });
}

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation des outils...');
    
    // Initialiser le chronomètre si présent dans la page
    if (document.getElementById('stopwatchTool')) {
        StopwatchManager.init();
        console.log('Chronomètre initialisé');
    }
}); 