/**
 * Gestion du mode plein écran pour tous les outils
 * Ce fichier fournit des fonctions standardisées pour gérer le mode plein écran
 */

/**
 * Classe de gestion du mode plein écran
 */
export class FullscreenManager {
    /**
     * Initialise le gestionnaire de plein écran pour un outil spécifique
     * @param {string} toolId - L'ID de l'élément conteneur de l'outil à mettre en plein écran
     * @param {string} fullscreenBtnId - L'ID du bouton de plein écran
     */
    constructor(toolId, fullscreenBtnId) {
        this.fullscreenBtn = document.getElementById(fullscreenBtnId);
        
        // Recherche le conteneur de l'outil selon plusieurs stratégies
        this.toolContainer = this.findToolContainer(toolId);
        
        if (!this.toolContainer || !this.fullscreenBtn) {
            console.error(`[Fullscreen] Éléments nécessaires non trouvés - toolId: ${toolId}, btnId: ${fullscreenBtnId}`);
            return;
        }
        
        // Enregistrer cet outil dans le registre des gestionnaires de plein écran
        if (!window.fullscreenManagers) {
            window.fullscreenManagers = {};
        }
        window.fullscreenManagers[toolId] = this;
        
        // Déterminer le nom de l'outil pour gérer les classes spécifiques
        this.toolName = toolId.replace('Tool', '').toLowerCase();
        
        console.info(`[Fullscreen] Gestionnaire initialisé pour ${toolId}`);
        
        this.isFullscreen = false;
        this.setupListeners();
    }
    
    /**
     * Trouve le conteneur d'outil selon plusieurs stratégies
     * @param {string} toolId - ID de l'outil
     * @returns {HTMLElement|null} Le conteneur trouvé ou null
     */
    findToolContainer(toolId) {
        // Stratégie 1: Recherche directe par ID
        let container = document.getElementById(toolId);
        
        // Stratégie 2: Recherche de div.tool-container avec cet ID
        if (!container) {
            container = document.querySelector(`div.tool-container#${toolId}`);
        }
        
        // Stratégie 3: Recherche du parent du bouton de plein écran
        if (!container && this.fullscreenBtn) {
            // Remonte jusqu'à trouver l'élément avec la classe .tool-container
            let parent = this.fullscreenBtn.parentElement;
            while (parent) {
                if (parent.classList.contains('tool-container') || parent.id === toolId) {
                    container = parent;
                    break;
                }
                parent = parent.parentElement;
            }
        }
        
        // Stratégie 4: Recherche dynamique dans le DOM
        if (!container) {
            // Extraire le nom de l'outil sans "Tool" à la fin
            const toolName = toolId.replace('Tool', '').toLowerCase();
            
            // Recherche n'importe quel conteneur contenant le nom de l'outil
            const possibleContainers = document.querySelectorAll(`[id*="${toolName}"]`);
            if (possibleContainers.length > 0) {
                container = possibleContainers[0];
            }
        }
        
        return container;
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        console.info(`[Fullscreen] Configuration des écouteurs pour ${this.toolContainer.id} avec bouton ${this.fullscreenBtn.id}`);
        
        // Écouteur pour le bouton de plein écran
        this.fullscreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.info(`[Fullscreen] Bouton ${this.fullscreenBtn.id} cliqué`);
            
            // Appeler directement enterFullscreen ou exitFullscreen en fonction de l'état actuel
            // au lieu de passer par la fonction toggleFullscreen, pour que la demande de plein écran
            // soit effectuée directement dans le gestionnaire d'événement du clic
            if (!this.isFullscreen) {
                this.enterFullscreen();
            } else {
                this.exitFullscreen();
            }
        });
        
        // Fonction de gestionnaire pour tous les événements de changement d'état plein écran
        const handleChange = () => this.handleFullscreenChange();
        
        // Écouteurs pour détecter les changements d'état plein écran (tous les préfixes de navigateur)
        document.addEventListener('fullscreenchange', handleChange);
        document.addEventListener('webkitfullscreenchange', handleChange);
        document.addEventListener('mozfullscreenchange', handleChange);
        document.addEventListener('MSFullscreenChange', handleChange);
        
        // Écouteur pour la touche Échap (en plus du comportement par défaut du navigateur)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                console.info('[Fullscreen] Touche Échap détectée en plein écran');
                this.exitFullscreen();
            }
        });
    }
    
    /**
     * Gère les changements d'état du mode plein écran
     */
    handleFullscreenChange() {
        // Détecter si un élément est en plein écran
        const isInFullscreen = !!document.fullscreenElement || 
                              !!document.webkitFullscreenElement || 
                              !!document.mozFullScreenElement ||
                              !!document.msFullscreenElement;
        
        console.info(`[Fullscreen] Changement d'état: ${isInFullscreen ? 'entré en' : 'sorti du'} plein écran`);
        
        // Mettre à jour l'état
        this.isFullscreen = isInFullscreen;
        
        // Mettre à jour l'icône
        this.updateFullscreenIcon();
        
        // Diffuse un événement personnalisé pour que d'autres modules puissent réagir
        const fullscreenEvent = new CustomEvent('toolFullscreenChange', {
            detail: { 
                isFullscreen: this.isFullscreen,
                toolId: this.toolContainer.id,
                toolName: this.toolName
            }
        });
        document.dispatchEvent(fullscreenEvent);
    }
    
    /**
     * Met à jour l'icône du bouton de plein écran
     */
    updateFullscreenIcon() {
        const icon = this.fullscreenBtn.querySelector('i');
        if (!icon) return;
        
        if (this.isFullscreen) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
    }
    
    /**
     * Ajoute ou supprime des classes CSS spécifiques pour certains outils
     * @param {boolean} isEntering - True si on entre en mode plein écran, false sinon
     */
    addToolSpecificClasses(isEntering) {
        // Pour les outils qui ont besoin de classes spéciales 
        const toolsWithSpecificClasses = {
            timer: {
                containerClass: '.timer-container',
                bodyClass: 'timer-fullscreen-active',
                containerClassToAdd: 'timer-fullscreen',
                toolClass: 'timer-tool-fullscreen'
            },
            // Ajoutez d'autres outils si nécessaire
        };
        
        // Si cet outil a des classes spécifiques
        if (this.toolName in toolsWithSpecificClasses) {
            const config = toolsWithSpecificClasses[this.toolName];
            
            // Ajouter/supprimer la classe pour le body
            if (config.bodyClass) {
                if (isEntering) {
                    document.body.classList.add(config.bodyClass);
                } else {
                    document.body.classList.remove(config.bodyClass);
                }
            }
            
            // Ajouter/supprimer la classe pour le conteneur spécifique
            if (config.containerClass && config.containerClassToAdd) {
                const container = document.querySelector(config.containerClass);
                if (container) {
                    if (isEntering) {
                        container.classList.add(config.containerClassToAdd);
                    } else {
                        container.classList.remove(config.containerClassToAdd);
                    }
                }
            }
            
            // Ajouter/supprimer la classe pour le conteneur d'outil
            if (config.toolClass) {
                if (isEntering) {
                    this.toolContainer.classList.add(config.toolClass);
                } else {
                    this.toolContainer.classList.remove(config.toolClass);
                }
            }
        }
    }
    
    /**
     * Entre en mode plein écran
     * Note: Pour appeler depuis un gestionnaire de clic, utilisez directement cette méthode
     * plutôt que de passer par toggleFullscreen
     */
    enterFullscreen() {
        // Vérifier si le document est déjà en plein écran
        if (document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement ||
            document.msFullscreenElement) {
            console.info('[Fullscreen] Document déjà en plein écran');
            this.isFullscreen = true;
            this.updateFullscreenIcon();
            return;
        }
        
        // Vérifier les restrictions de plein écran
        if (this.checkFullscreenRestrictions()) {
            console.error('[Fullscreen] Impossible d\'entrer en plein écran en raison de restrictions');
            // Afficher une indication visuelle pour l'utilisateur
            this.fullscreenBtn.classList.add('fullscreen-btn-error');
            setTimeout(() => {
                this.fullscreenBtn.classList.remove('fullscreen-btn-error');
            }, 1000);
            return;
        }
        
        console.info(`[Fullscreen] Tentative de passage en plein écran pour ${this.toolContainer.id}`);
        
        // Ajouter des classes spécifiques pour certains outils
        this.addToolSpecificClasses(true);
        
        // Ajouter une classe d'animation pour l'entrée en plein écran
        this.toolContainer.classList.add('fullscreen-transition-enter');
        
        // Bloquer le défilement de la page en plein écran
        document.body.style.overflow = 'hidden';
        
        // Méthode 1: API Fullscreen du navigateur
        try {
            // Demander le mode plein écran avec une option spécifique pour indiquer qu'il s'agit d'une action utilisateur
            const options = {
                navigationUI: "auto"  // Cela peut aider certains navigateurs à reconnaître la demande comme légitime
            };
            
            if (this.toolContainer.requestFullscreen) {
                this.toolContainer.requestFullscreen(options).catch(err => {
                    console.error(`[Fullscreen] Erreur requestFullscreen: ${err.message}`);
                    
                    // Si l'erreur est liée à l'action utilisateur, utiliser la méthode fallback
                    if (err.message.includes('user gesture') || err.message.includes('user activation')) {
                        console.warn('[Fullscreen] L\'API Fullscreen nécessite une action utilisateur directe. Utilisation de la méthode fallback.');
                        this._useFallbackFullscreen(true);
                    } else {
                        // Autre type d'erreur
                        this.fullscreenBtn.classList.add('fullscreen-btn-error');
                        setTimeout(() => {
                            this.fullscreenBtn.classList.remove('fullscreen-btn-error');
                        }, 1000);
                    }
                });
            } else if (this.toolContainer.webkitRequestFullscreen) {
                this.toolContainer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (this.toolContainer.mozRequestFullScreen) {
                this.toolContainer.mozRequestFullScreen();
            } else if (this.toolContainer.msRequestFullscreen) {
                this.toolContainer.msRequestFullscreen();
            } else {
                console.warn('[Fullscreen] API Fullscreen non supportée par ce navigateur. Utilisation de la méthode fallback.');
                this._useFallbackFullscreen(true);
            }
        } catch (error) {
            console.error(`[Fullscreen] Erreur lors du passage en plein écran: ${error.message}`);
            // En cas d'erreur, utiliser la méthode fallback
            this._useFallbackFullscreen(true);
        }
        
        // Supprimer la classe d'animation après la transition
        setTimeout(() => {
            this.toolContainer.classList.remove('fullscreen-transition-enter');
        }, 300);
    }

    /**
     * Quitte le mode plein écran
     */
    exitFullscreen() {
        // Vérifier si le document est en plein écran via l'API du navigateur
        const isInFullscreen = document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.mozFullScreenElement ||
                              document.msFullscreenElement;
        
        // Si nous utilisons la méthode fallback, vérifier les classes CSS
        const isUsingFallback = this.toolContainer.classList.contains('using-fallback-fullscreen');
        
        // Si nous ne sommes pas en plein écran avec l'API et pas en mode fallback, rien à faire
        if (!isInFullscreen && !isUsingFallback) {
            console.info('[Fullscreen] Le document n\'est pas en plein écran');
            this.isFullscreen = false;
            this.updateFullscreenIcon();
            return;
        }
        
        console.info(`[Fullscreen] Tentative de sortie du plein écran pour ${this.toolContainer.id}`);
        
        // Supprimer les classes spécifiques pour certains outils
        this.addToolSpecificClasses(false);
        
        // Ajouter une classe d'animation pour la sortie du plein écran
        this.toolContainer.classList.add('fullscreen-transition-exit');
        
        // Rétablir le défilement normal
        document.body.style.overflow = '';
        
        // Si nous utilisons la méthode fallback, la traiter séparément
        if (isUsingFallback) {
            this._useFallbackFullscreen(false);
        } else {
            // Quitter le mode plein écran après un court délai pour l'animation
            setTimeout(() => {
                try {
                    // Quitter le mode plein écran
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(err => {
                            console.error(`[Fullscreen] Erreur exitFullscreen: ${err.message}`);
                            // Ajouter une indication visuelle en cas d'erreur
                            this.fullscreenBtn.classList.add('fullscreen-btn-error');
                            setTimeout(() => {
                                this.fullscreenBtn.classList.remove('fullscreen-btn-error');
                            }, 1000);
                        });
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    } else {
                        console.warn('[Fullscreen] API Fullscreen non supportée par ce navigateur');
                    }
                } catch (error) {
                    console.error(`[Fullscreen] Erreur lors de la sortie du plein écran: ${error.message}`);
                    // Ajouter une indication visuelle en cas d'erreur
                    this.fullscreenBtn.classList.add('fullscreen-btn-error');
                    setTimeout(() => {
                        this.fullscreenBtn.classList.remove('fullscreen-btn-error');
                    }, 1000);
                }
            }, 50);
        }
        
        // Supprimer la classe d'animation
        setTimeout(() => {
            this.toolContainer.classList.remove('fullscreen-transition-exit');
        }, 300);
    }

    /**
     * Méthode alternative (fallback) pour le plein écran basée sur CSS
     * Utilisée lorsque l'API Fullscreen du navigateur échoue
     * @param {boolean} enter - True pour entrer en plein écran, false pour sortir
     */
    _useFallbackFullscreen(enter) {
        // Déterminer les classes spécifiques à cet outil
        const toolSpecificClass = `${this.toolName}-fullscreen`;
        const toolContainerSpecificClass = `${this.toolName}-tool-fullscreen`;
        const bodySpecificClass = `${this.toolName}-fullscreen-active`;
        
        if (enter) {
            // Ajouter les classes pour le plein écran CSS
            this.toolContainer.classList.add('using-fallback-fullscreen');
            this.toolContainer.classList.add(toolContainerSpecificClass);
            document.body.classList.add(bodySpecificClass);
            
            // Trouver le conteneur spécifique de l'outil si disponible
            const specificContainer = document.querySelector(`.${this.toolName}-container`);
            if (specificContainer) {
                specificContainer.classList.add(toolSpecificClass);
            }
            
            // Ajouter un bouton de fermeture si l'outil n'en a pas déjà un
            if (!this.toolContainer.querySelector('.fullscreen-close-btn')) {
                const closeBtn = document.createElement('div');
                closeBtn.className = 'fullscreen-close-btn';
                closeBtn.setAttribute('aria-label', 'Fermer le plein écran');
                closeBtn.innerHTML = '<i class="fas fa-times"></i>';
                
                // Utiliser bind pour conserver le contexte this
                closeBtn.addEventListener('click', this.exitFullscreen.bind(this));
                
                this.toolContainer.appendChild(closeBtn);
            }
            
            // Ajouter un écouteur pour la touche Échap
            document.addEventListener('keydown', this._handleEscKey.bind(this));
            
            // Mettre à jour l'état et l'icône
            this.isFullscreen = true;
            this.updateFullscreenIcon();
        } else {
            // Supprimer les classes pour revenir à l'affichage normal
            this.toolContainer.classList.remove('using-fallback-fullscreen');
            this.toolContainer.classList.remove(toolContainerSpecificClass);
            document.body.classList.remove(bodySpecificClass);
            
            // Supprimer pour le conteneur spécifique
            const specificContainer = document.querySelector(`.${this.toolName}-container`);
            if (specificContainer) {
                specificContainer.classList.remove(toolSpecificClass);
            }
            
            // Supprimer le bouton de fermeture s'il existe
            const closeBtn = this.toolContainer.querySelector('.fullscreen-close-btn');
            if (closeBtn) {
                closeBtn.removeEventListener('click', this.exitFullscreen.bind(this));
                this.toolContainer.removeChild(closeBtn);
            }
            
            // Retirer l'écouteur pour la touche Échap
            document.removeEventListener('keydown', this._handleEscKey.bind(this));
            
            // Mettre à jour l'état et l'icône
            this.isFullscreen = false;
            this.updateFullscreenIcon();
        }
    }

    /**
     * Gestionnaire pour la touche Échap en mode plein écran fallback
     * @param {KeyboardEvent} e - L'événement clavier
     */
    _handleEscKey(e) {
        if (e.key === 'Escape' && this.isFullscreen && this.toolContainer.classList.contains('using-fallback-fullscreen')) {
            this.exitFullscreen();
        }
    }

    /**
     * Vérifie s'il existe des restrictions de plein écran pour des raisons de sécurité
     * @returns {boolean} True si des restrictions sont détectées
     */
    checkFullscreenRestrictions() {
        // Vérifier si nous sommes dans un iframe
        const isInIframe = window !== window.top;
        
        if (isInIframe) {
            console.warn('[Fullscreen] Application exécutée dans un iframe - Le plein écran peut être restreint');
            
            // Vérifier si l'attribut allowfullscreen est présent sur l'iframe
            try {
                // Tenter de trouver l'iframe qui nous contient dans la page parente
                const iframe = window.frameElement;
                if (iframe && !iframe.hasAttribute('allowfullscreen')) {
                    console.error('[Fullscreen] Iframe sans attribut allowfullscreen - Le plein écran est bloqué');
                    return true;
                }
            } catch (e) {
                // Une erreur de sécurité peut se produire si nous n'avons pas accès à window.frameElement
                console.error('[Fullscreen] Impossible de vérifier l\'iframe - Restrictions de sécurité potentielles');
                return true;
            }
        }
        
        // Vérifier si l'API Fullscreen est disponible
        if (!document.fullscreenEnabled && 
            !document.webkitFullscreenEnabled && 
            !document.mozFullScreenEnabled && 
            !document.msFullscreenEnabled) {
            console.error('[Fullscreen] API Fullscreen non activée dans ce navigateur');
            return true;
        }
        
        return false;
    }

    /**
     * Affiche/cache le panneau d'aide
     */
    toggleHelpPanel() {
        if (this.helpPanel) {
            this.helpPanel.classList.toggle('active');
        }
    }

    /**
     * Active/désactive le mode plein écran
     */
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    /**
     * Anime un bouton lorsqu'il est cliqué
     * @param {HTMLElement} button - Le bouton à animer
     */
    animateButton(button) {
        button.classList.add('button-clicked');
        setTimeout(() => {
            button.classList.remove('button-clicked');
        }, 300);
    }
}

/**
 * Fonction d'utilitaire pour initialiser rapidement le mode plein écran pour un outil
 * @param {string} toolId - L'ID de l'élément conteneur de l'outil
 * @param {string} fullscreenBtnId - L'ID du bouton de plein écran
 * @returns {FullscreenManager} Instance du gestionnaire de plein écran
 */
export function setupFullscreen(toolId, fullscreenBtnId) {
    return new FullscreenManager(toolId, fullscreenBtnId);
}

/**
 * Initialise le mode plein écran pour tous les outils qui ont un bouton de plein écran
 * Détecte automatiquement les outils avec un bouton de plein écran
 */
export function initAllFullscreenButtons() {
    const initFullscreen = () => {
        console.info('[Fullscreen] Initialisation du gestionnaire de plein écran');
        
        // Petit délai pour s'assurer que tous les éléments DOM sont bien chargés et rendus
        setTimeout(() => {
            // Recherche tous les boutons de plein écran par ID ou classe
            const fullscreenButtons = document.querySelectorAll('.fullscreen-btn, [id$="FullscreenBtn"]');
            
            console.info(`[Fullscreen] Trouvé ${fullscreenButtons.length} boutons de plein écran`);
            
            if (fullscreenButtons.length === 0) {
                console.warn('[Fullscreen] Aucun bouton de plein écran trouvé dans le document');
                // Tenter une recherche plus générique
                const possibleButtons = document.querySelectorAll('button[id*="fullscreen"], button[id*="Fullscreen"]');
                if (possibleButtons.length > 0) {
                    console.info(`[Fullscreen] Trouvé ${possibleButtons.length} boutons possibles avec une recherche alternative`);
                }
            }
            
            fullscreenButtons.forEach(button => {
                console.info(`[Fullscreen] Analyse du bouton ${button.id || 'sans ID'}`);
                
                // Trouver le conteneur parent qui a une classe tool-container ou un ID qui se termine par 'Tool'
                let parent = button.closest('.tool-container');
                if (!parent) {
                    // Remonter jusqu'à trouver un élément avec un ID qui se termine par 'Tool'
                    let currentNode = button.parentElement;
                    while (currentNode && (!currentNode.id || !currentNode.id.endsWith('Tool'))) {
                        currentNode = currentNode.parentElement;
                        if (!currentNode) break; // Éviter une boucle infinie
                    }
                    parent = currentNode;
                }
                
                if (parent && parent.id) {
                    const toolId = parent.id;
                    console.info(`[Fullscreen] Configuration pour ${toolId} avec le bouton ${button.id || 'sans ID'}`);
                    
                    // Initialise le gestionnaire de plein écran pour cet outil
                    new FullscreenManager(toolId, button.id);
                } else {
                    console.warn(`[Fullscreen] Impossible de trouver le conteneur parent pour le bouton de plein écran ${button.id || 'sans ID'}`);
                }
            });
        }, 500); // Délai de 500ms pour s'assurer que le DOM est complètement chargé
    };
    
    // Si le DOM est déjà chargé, initialiser immédiatement
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initFullscreen();
    } else {
        // Sinon, attendre que le DOM soit chargé
        document.addEventListener('DOMContentLoaded', initFullscreen);
    }
}

// Exécute l'initialisation automatique si le script est utilisé directement
if (typeof document !== 'undefined') {
    initAllFullscreenButtons();
}  