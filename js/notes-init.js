// Importer le gestionnaire de notes
import { NotesManager } from './tools/notes_utf8.js';

// Variable globale pour l'instance du gestionnaire
let notesManager = null;

// Initialiser le gestionnaire de notes quand le DOM est complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('noteTool')) {
        notesManager = NotesManager.init();
        console.log('Gestionnaire de notes initialisé avec succès');
    }
});

// Exposer les fonctions globalement
window.NotesManager = {
    createNewNote: () => {
        if (notesManager) {
            notesManager.createNewNote();
        }
    },
    saveCurrentNote: () => {
        if (notesManager) {
            notesManager.saveCurrentNote();
        }
    },
    downloadCurrentNote: () => {
        if (notesManager) {
            notesManager.downloadCurrentNote();
        }
    },
    exportAllNotes: () => {
        if (notesManager) {
            notesManager.exportAllNotes();
        }
    },
    clearNotes: () => {
        if (notesManager) {
            notesManager.deleteAllNotes();
        }
    }
}; 