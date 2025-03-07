// Importer le gestionnaire de notes
import { NotesManager } from './tools/notes.js';

// Initialiser le gestionnaire de notes
document.addEventListener('DOMContentLoaded', () => {
    NotesManager.init();
});

// Exposer les fonctions globalement
window.NotesManager = NotesManager;
window.saveNotes = () => NotesManager.saveNotes();
window.clearNotes = () => NotesManager.clearNotes();
window.downloadNotes = () => NotesManager.downloadNotes(); 