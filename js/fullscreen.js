/**
 * Module de gestion du plein écran pour les outils
 */

export class FullscreenManager {
    constructor() {
        console.log('FullscreenManager: Initialisation');
        this.initFullscreenButtons();
        this.addFullscreenChangeListeners();
        this.setupMutationObserver();
        
        // Réessayer après délai pour garantir l'initialisation de tous les boutons
        setTimeout(() => this.initFullscreenButtons(), 500);
    }

    /**
     * Configure un observateur de mutations pour détecter les nouveaux boutons de plein écran
     */
    setupMutationObserver() {
        try {
            // Créer un observateur de mutations
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        let shouldInit = false;
                        
                        // Vérifier si des boutons de plein écran ont été ajoutés
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // Élément HTML
                                if (node.classList && node.classList.contains('fullscreen-btn')) {
                                    shouldInit = true;
                                } else if (node.querySelectorAll) {
                                    const buttons = node.querySelectorAll('.fullscreen-btn');
                                    if (buttons.length > 0) shouldInit = true;
                                }
                            }
                        });
                        
                        // Réinitialiser les boutons si nécessaire
                        if (shouldInit) {
                            console.log('FullscreenManager: Nouveaux boutons détectés');
                            this.initFullscreenButtons();
                        }
                    }
                }
            });
            
            // Observer tout le document
            observer.observe(document.body || document.documentElement, {
                childList: true,
                subtree: true
            });
        } catch (error) {
            console.error('FullscreenManager: Erreur configuration observateur:', error);
        }
    }

    /**
     * Initialise tous les boutons de plein écran présents dans le document
     */
    initFullscreenButtons() {
        const fullscreenButtons = document.querySelectorAll('.fullscreen-btn');
        console.log(`FullscreenManager: ${fullscreenButtons.length} boutons trouvés`);
        
        fullscreenButtons.forEach(button => {
            // Éviter de réinitialiser les boutons qui ont déjà un écouteur
            if (!button.dataset.fullscreenInitialized) {
                button.dataset.fullscreenInitialized = 'true';
                
                // Détermine l'élément à mettre en plein écran
                const toolContainer = button.closest('.tool-container');
                
                if (toolContainer) {
                    button.addEventListener('click', () => this.toggleFullscreen(toolContainer));
                }
            }
        });
    }

    /**
     * Bascule l'état de plein écran pour un élément
     * @param {HTMLElement} element - L'élément à basculer en plein écran
     */
    toggleFullscreen(element) {
        if (!document.fullscreenElement) {
            // Passer en plein écran
            if (element.requestFullscreen) {
                element.requestFullscreen().catch(err => {
                    console.error('Erreur plein écran:', err);
                    this.showFullscreenError(element);
                });
            } else if (element.mozRequestFullScreen) { // Firefox
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) { // Chrome, Safari, Opera
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { // IE/Edge
                element.msRequestFullscreen();
            }
        } else {
            // Quitter le plein écran
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    /**
     * Affiche une animation d'erreur sur le bouton si le plein écran échoue
     * @param {HTMLElement} container - Le conteneur de l'outil
     */
    showFullscreenError(container) {
        const button = container.querySelector('.fullscreen-btn');
        if (button) {
            button.classList.add('fullscreen-btn-error');
            setTimeout(() => button.classList.remove('fullscreen-btn-error'), 500);
        }
    }

    /**
     * Ajoute des écouteurs pour les événements de changement de plein écran
     */
    addFullscreenChangeListeners() {
        // Liste de tous les événements de changement de plein écran pour différents navigateurs
        const fullscreenEvents = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ];

        // Ajouter les écouteurs pour chaque type d'événement
        fullscreenEvents.forEach(eventType => {
            document.addEventListener(eventType, () => this.updateFullscreenButtons());
        });
    }

    /**
     * Met à jour l'apparence de tous les boutons de plein écran
     */
    updateFullscreenButtons() {
        const fullscreenButtons = document.querySelectorAll('.fullscreen-btn');
        const isFullscreen = !!document.fullscreenElement;

        fullscreenButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                if (isFullscreen) {
                    icon.className = 'fas fa-compress';
                    button.setAttribute('aria-label', 'Quitter le plein écran');
                } else {
                    icon.className = 'fas fa-expand';
                    button.setAttribute('aria-label', 'Plein écran');
                }
            }
        });
    }
}

// Initialisation du gestionnaire de plein écran quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.fullscreenManager = new FullscreenManager();
});

// Réinitialiser les boutons de plein écran lors du chargement d'un nouvel outil
document.addEventListener('tool:loaded', () => {
    if (window.fullscreenManager) {
        window.fullscreenManager.initFullscreenButtons();
    } else {
        // Créer le gestionnaire s'il n'existe pas encore
        window.fullscreenManager = new FullscreenManager();
    }
}); 