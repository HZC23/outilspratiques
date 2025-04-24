// Importer le gestionnaire d'éditeur de texte
import { TextEditorManager } from './tools/texteditor.js';

// Variable globale pour l'instance du gestionnaire
let textEditorManager = null;

// Initialiser le gestionnaire d'éditeur de texte quand le DOM est complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('textEditorTool')) {
        textEditorManager = TextEditorManager.init();
        console.log('Gestionnaire d\'éditeur de texte initialisé avec succès');
    }
});

// Exposer les fonctions globalement
window.TextEditorManager = {
    clearContent: () => {
        if (textEditorManager) {
            textEditorManager.clearContent();
        }
    },
    downloadContent: () => {
        if (textEditorManager) {
            textEditorManager.downloadContent();
        }
    },
    copyToClipboard: () => {
        if (textEditorManager) {
            textEditorManager.copyToClipboard();
        }
    }
}; 