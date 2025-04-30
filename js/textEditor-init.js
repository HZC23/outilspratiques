// Importer la fonction d'initialisation de l'éditeur de texte
import { init } from './tools/textEditor.js';

// Variable globale pour l'instance de l'éditeur
let textEditorInstance = null;

// Initialiser l'éditeur de texte quand le DOM est complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('textEditorTool')) {
        textEditorInstance = init();
        console.log('Gestionnaire d\'éditeur de texte initialisé avec succès');
    }
});

// Exposer les fonctions globalement si besoin
window.TextEditorManager = {
    clearContent: () => {
        if (textEditorInstance) {
            clearContent();
        }
    },
    downloadContent: () => {
        if (textEditorInstance) {
            downloadContent();
        }
    },
    copyToClipboard: () => {
        if (textEditorInstance) {
            copyToClipboard();
        }
    }
}; 