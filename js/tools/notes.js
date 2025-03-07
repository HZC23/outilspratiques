import { Utils } from '../utils.js';

/**
 * Gestionnaire du bloc-notes
 */
export const NotesManager = {
    state: {
        content: '',
        lastSaved: null,
        wordCount: 0,
        charCount: 0,
        lineCount: 0,
        paragraphCount: 0
    },

    /**
     * Initialise le bloc-notes
     */
    init() {
        this.loadContent();
        this.setupListeners();
        this.updateCounts();
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        const editor = document.getElementById('editor');
        if (!editor) return;

        editor.addEventListener('input', () => {
            this.updateCounts();
            this.autosave();
        });

        // Raccourcis clavier
        editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveNotes();
            }
        });
    },

    /**
     * Charge le contenu sauvegardé
     */
    loadContent() {
        const editor = document.getElementById('editor');
        if (!editor) return;

        const savedContent = Utils.loadFromStorage('notes_content', '');
        editor.innerHTML = savedContent;
        this.state.content = savedContent;
        this.state.lastSaved = Date.now();
    },

    /**
     * Sauvegarde automatique
     */
    autosave() {
        if (Date.now() - this.state.lastSaved > 1000) {
            this.saveNotes(true);
        }
    },

    /**
     * Sauvegarde les notes
     * @param {boolean} silent - Si true, ne pas afficher de notification
     */
    saveNotes(silent = false) {
        const editor = document.getElementById('editor');
        if (!editor) return;

        const content = editor.innerHTML;
        if (content === this.state.content) return;

        Utils.saveToStorage('notes_content', content);
        this.state.content = content;
        this.state.lastSaved = Date.now();

        // Ajouter l'animation de sauvegarde
        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.classList.add('saving');
            setTimeout(() => saveBtn.classList.remove('saving'), 500);
        }

        if (!silent) {
            Utils.showNotification('Notes sauvegardées !', 'success');
        }
    },

    /**
     * Efface les notes
     */
    clearNotes() {
        if (!confirm('Êtes-vous sûr de vouloir effacer toutes les notes ?')) return;

        const editor = document.getElementById('editor');
        if (!editor) return;

        editor.innerHTML = '';
        Utils.saveToStorage('notes_content', '');
        this.state.content = '';
        this.updateCounts();
        Utils.showNotification('Notes effacées !', 'success');
    },

    /**
     * Télécharge les notes
     */
    downloadNotes() {
        const editor = document.getElementById('editor');
        if (!editor) return;

        const content = editor.innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `notes-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        Utils.showNotification('Notes téléchargées !', 'success');
    },

    /**
     * Met à jour les compteurs
     */
    updateCounts() {
        const editor = document.getElementById('editor');
        if (!editor) return;

        const text = editor.innerText;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const lines = text.split('\n');
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);

        this.state.wordCount = words.length;
        this.state.charCount = text.length;
        this.state.lineCount = lines.length;
        this.state.paragraphCount = paragraphs.length;

        document.getElementById('wordCount').textContent = `${this.state.wordCount} mots`;
        document.getElementById('charCount').textContent = `${this.state.charCount} caractères`;
        document.getElementById('lineCount').textContent = `${this.state.lineCount} lignes`;
        document.getElementById('paragraphCount').textContent = `${this.state.paragraphCount} paragraphes`;
    }
};

// Exporter les fonctions globales pour l'utilisation dans le HTML
window.saveNotes = () => NotesManager.saveNotes();
window.clearNotes = () => NotesManager.clearNotes();
window.downloadNotes = () => NotesManager.downloadNotes();

// Initialiser le gestionnaire de notes au chargement
document.addEventListener('DOMContentLoaded', () => NotesManager.init());