/**
 * @file help-panels.js
 * @description Gestionnaire des panneaux d'aide pour tous les outils
 */

class HelpPanelManager {
    constructor() {
        this.activePanel = null;
        this.panels = {};
        this.buttons = {};
        this.initialized = false;
    }

    /**
     * Initialise le gestionnaire de panneaux d'aide
     */
    init() {
        if (this.initialized) return;
        
        // Recenser tous les boutons d'aide et panneaux dans la page
        this.collectHelpElements();
        
        // Ajouter les gestionnaires d'événements
        this.bindEvents();
        
        // Marquer comme initialisé
        this.initialized = true;
    }

    /**
     * Collecte tous les boutons d'aide et panneaux dans la page
     */
    collectHelpElements() {
        // Trouver tous les boutons d'aide
        document.querySelectorAll('[data-help-target]').forEach(button => {
            const targetId = button.dataset.helpTarget;
            this.buttons[targetId] = button;
            
            // S'assurer que le bouton a la classe help-button
            button.classList.add('help-button');
            
            // S'assurer que le bouton a l'icône d'aide si ce n'est pas déjà le cas
            if (!button.querySelector('i.fa-question-circle')) {
                // Vider le contenu existant si nécessaire
                if (button.innerHTML.trim() === '') {
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-question-circle';
                    button.appendChild(icon);
                }
            }

            // Ajouter l'attribut aria-label si absent
            if (!button.hasAttribute('aria-label')) {
                button.setAttribute('aria-label', 'Aide');
            }
        });
        
        // Trouver tous les panneaux d'aide
        document.querySelectorAll('.help-panel').forEach(panel => {
            const panelId = panel.id;
            this.panels[panelId] = panel;
            
            // S'assurer que le panneau a un en-tête avec un bouton de fermeture
            let header = panel.querySelector('.help-panel-header');
            if (!header) {
                header = document.createElement('div');
                header.className = 'help-panel-header';
                
                // Titre par défaut
                const title = document.createElement('h3');
                title.textContent = 'Aide';
                header.appendChild(title);
                
                // Insérer l'en-tête au début du panneau
                panel.insertBefore(header, panel.firstChild);
            }
            
            // Ajouter un bouton de fermeture s'il n'existe pas
            if (!header.querySelector('.help-panel-close')) {
                const closeButton = document.createElement('button');
                closeButton.className = 'help-panel-close';
                closeButton.setAttribute('aria-label', 'Fermer');
                closeButton.setAttribute('data-help-close', '');
                
                const icon = document.createElement('i');
                icon.className = 'fas fa-times';
                closeButton.appendChild(icon);
                
                header.appendChild(closeButton);
            }
            
            // S'assurer que le contenu est dans un conteneur
            if (!panel.querySelector('.help-panel-content')) {
                // Récupérer tout le contenu après l'en-tête
                const content = document.createElement('div');
                content.className = 'help-panel-content';
                
                // Déplacer tout le contenu existant (sauf l'en-tête) dans ce conteneur
                while (panel.children.length > 1) {
                    content.appendChild(panel.children[1]);
                }
                
                panel.appendChild(content);
            }
        });
    }

    /**
     * Attache les événements aux boutons et panneaux
     */
    bindEvents() {
        // Événements pour les boutons d'aide
        Object.keys(this.buttons).forEach(targetId => {
            const button = this.buttons[targetId];
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePanel(targetId);
            });
        });
        
        // Événements pour les boutons de fermeture
        document.querySelectorAll('[data-help-close]').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeAllPanels();
            });
        });
        
        // Fermer en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (this.activePanel) {
                // Vérifier si le clic est en dehors du panneau actif et du bouton qui l'a activé
                const panel = this.panels[this.activePanel];
                const button = this.buttons[this.activePanel];
                
                if (!panel.contains(e.target) && !button.contains(e.target)) {
                    this.closeAllPanels();
                }
            }
        });
        
        // Fermer avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activePanel) {
                this.closeAllPanels();
            }
        });
    }

    /**
     * Affiche ou masque un panneau d'aide spécifique
     * @param {string} panelId - L'ID du panneau à afficher/masquer
     */
    togglePanel(panelId) {
        // Fermer le panneau actif si différent
        if (this.activePanel && this.activePanel !== panelId) {
            this.closePanel(this.activePanel);
        }
        
        const panel = this.panels[panelId];
        
        if (panel) {
            if (panel.classList.contains('active') || panel.classList.contains('show')) {
                this.closePanel(panelId);
            } else {
                this.openPanel(panelId);
            }
        }
    }

    /**
     * Ouvre un panneau d'aide
     * @param {string} panelId - L'ID du panneau à ouvrir
     */
    openPanel(panelId) {
        const panel = this.panels[panelId];
        if (panel) {
            // Ajouter la classe active (ou show pour compatibilité)
            panel.classList.add('active');
            panel.classList.add('show');
            
            // Mettre à jour le bouton
            const button = this.buttons[panelId];
            if (button) {
                button.setAttribute('aria-expanded', 'true');
            }
            
            // Mettre à jour le panneau actif
            this.activePanel = panelId;
            
            // Annoncer pour l'accessibilité
            this.announceForAccessibility('Panneau d\'aide ouvert');
        }
    }

    /**
     * Ferme un panneau d'aide
     * @param {string} panelId - L'ID du panneau à fermer
     */
    closePanel(panelId) {
        const panel = this.panels[panelId];
        if (panel) {
            // Retirer les classes
            panel.classList.remove('active');
            panel.classList.remove('show');
            
            // Mettre à jour le bouton
            const button = this.buttons[panelId];
            if (button) {
                button.setAttribute('aria-expanded', 'false');
            }
            
            // Réinitialiser le panneau actif
            if (this.activePanel === panelId) {
                this.activePanel = null;
            }
            
            // Annoncer pour l'accessibilité
            this.announceForAccessibility('Panneau d\'aide fermé');
        }
    }

    /**
     * Ferme tous les panneaux d'aide ouverts
     */
    closeAllPanels() {
        Object.keys(this.panels).forEach(panelId => {
            this.closePanel(panelId);
        });
    }

    /**
     * Annonce un message pour les technologies d'assistance
     * @param {string} message - Le message à annoncer
     */
    announceForAccessibility(message) {
        // Créer ou utiliser un élément live region existant
        let announcer = document.getElementById('accessibility-announcer');
        
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'accessibility-announcer';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', 'polite');
            document.body.appendChild(announcer);
        }
        
        // Annoncer le message
        announcer.textContent = message;
        
        // Effacer après un délai
        setTimeout(() => {
            announcer.textContent = '';
        }, 3000);
    }
}

// Créer et exporter l'instance unique
const helpPanelManager = new HelpPanelManager();

// Initialiser après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    helpPanelManager.init();
});

// Réinitialiser si le contenu change (pour les applications SPA)
document.addEventListener('contentChanged', () => {
    helpPanelManager.init();
});

export default helpPanelManager; 