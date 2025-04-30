// Gestionnaire de notes avec éditeur de texte riche (fusionné)
export class NotesManager {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.editor = null;
    }

    static init() {
        console.log('Initialisation du gestionnaire de notes...');
        const instance = new NotesManager();
        instance.loadNotes();
        console.log('Notes chargées depuis le stockage local:', instance.notes.length, 'notes trouvées');
        const noteToolElement = document.getElementById('noteTool');
        if (noteToolElement) {
            instance.setupUI();
            instance.setupEditor();
            instance.renderNotesList();
            instance.setupEventListeners();
            console.log('Application de notes initialisée avec succès');
        } else {
            console.error('Élément noteTool non trouvé dans la page');
        }
        return instance;
    }

    setupUI() {
        const helpButton = document.getElementById('noteHelp');
        const helpPanel = document.getElementById('noteHelpPanel');
        const closeHelpButton = document.getElementById('closeNoteHelp');
        if (helpButton && helpPanel && closeHelpButton) {
            helpButton.addEventListener('click', () => helpPanel.classList.toggle('show'));
            closeHelpButton.addEventListener('click', () => helpPanel.classList.remove('show'));
        }
        
        // Le plein écran est maintenant géré par le module fullscreen.js global
    }

    setupEditor() {
        this.editor = new Quill('#quill-editor', {
            modules: { toolbar: '#quill-toolbar' },
            theme: 'snow'
        });
        const quillToolbar = this.editor.getModule('toolbar');
        quillToolbar.addHandler('image', this.imageHandler.bind(this));
        this.editor.on('text-change', () => {
            this.updateWordCount();
            this.autoSaveNote();
        });
        console.log('Éditeur Quill initialisé');
    }

    imageHandler() {
        const url = prompt('Entrez l\'URL de l\'image:');
        if (url) {
            const range = this.editor.getSelection();
            this.editor.insertEmbed(range.index, 'image', url);
        }
    }

    updateWordCount() {
        const wordCountElement = document.getElementById('wordCount');
        if (!wordCountElement || !this.editor) return;
        const text = this.editor.getText();
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCountElement.textContent = `${wordCount} mot${wordCount !== 1 ? 's' : ''}`;
    }

    setupEventListeners() {
        const addNoteBtn = document.getElementById('addNewNote');
        if (addNoteBtn) addNoteBtn.addEventListener('click', () => this.createNewNote());
        const saveNoteBtn = document.getElementById('saveNote');
        if (saveNoteBtn) saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
        const clearNoteBtn = document.getElementById('clearNote');
        if (clearNoteBtn) clearNoteBtn.addEventListener('click', () => this.clearCurrentNote());
        const downloadNoteBtn = document.getElementById('downloadNote');
        if (downloadNoteBtn) downloadNoteBtn.addEventListener('click', () => this.downloadCurrentNote());
        const searchInput = document.getElementById('noteSearch');
        if (searchInput) searchInput.addEventListener('input', () => this.searchNotes(searchInput.value));
        const exportAllBtn = document.getElementById('exportAllNotes');
        if (exportAllBtn) exportAllBtn.addEventListener('click', () => this.exportAllNotes());
        const deleteAllBtn = document.getElementById('deleteAllNotes');
        if (deleteAllBtn) deleteAllBtn.addEventListener('click', () => this.deleteAllNotes());
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote();
            }
        });
    }

    createNewNote() {
        const noteId = Date.now().toString();
        const newNote = {
            id: noteId,
            title: 'Nouvelle note',
            content: '',
            contentHtml: '',
            quillContent: [],
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            tags: []
        };
        this.notes.unshift(newNote);
        this.currentNoteId = noteId;
        this.saveNotes();
        this.renderNotesList();
        this.displayNote(newNote);
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) this.notes = JSON.parse(savedNotes);
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    searchNotes(query) {
        if (!query) {
            this.renderNotesList();
            return;
        }
        const lowerQuery = query.toLowerCase();
        const filteredNotes = this.notes.filter(note =>
            note.title.toLowerCase().includes(lowerQuery) ||
            (note.content && note.content.toLowerCase().includes(lowerQuery))
        );
        this.renderFilteredNotes(filteredNotes);
    }

    renderFilteredNotes(filteredNotes) {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;
        notesList.innerHTML = '';
        if (filteredNotes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes';
            emptyMessage.textContent = 'Aucune note trouvée.';
            notesList.appendChild(emptyMessage);
            return;
        }
        filteredNotes.forEach(note => {
            const noteItem = this.createNoteListItem(note);
            notesList.appendChild(noteItem);
        });
    }

    renderNotesList() {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;
        notesList.innerHTML = '';
        if (this.notes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes';
            emptyMessage.textContent = 'Aucune note. Cliquez sur + pour créer une note.';
            notesList.appendChild(emptyMessage);
            return;
        }
        this.notes.forEach(note => {
            const noteItem = this.createNoteListItem(note);
            notesList.appendChild(noteItem);
        });
    }

    createNoteListItem(note) {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        if (note.id === this.currentNoteId) noteItem.classList.add('active');
        const noteItemTitle = document.createElement('div');
        noteItemTitle.className = 'note-item-title';
        noteItemTitle.textContent = note.title || 'Sans titre';
        const noteItemExcerpt = document.createElement('div');
        noteItemExcerpt.className = 'note-item-excerpt';
        let excerpt = '';
        if (note.content) {
            excerpt = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');
        } else if (note.contentHtml) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.contentHtml;
            excerpt = tempDiv.textContent.substring(0, 50) + (tempDiv.textContent.length > 50 ? '...' : '');
        }
        noteItemExcerpt.textContent = excerpt;
        const noteItemDate = document.createElement('div');
        noteItemDate.className = 'note-item-date';
        noteItemDate.textContent = this.formatDate(note.updated);
        noteItem.appendChild(noteItemTitle);
        noteItem.appendChild(noteItemExcerpt);
        noteItem.appendChild(noteItemDate);
        noteItem.addEventListener('click', () => this.selectNote(note.id));
        return noteItem;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    selectNote(noteId) {
        this.currentNoteId = noteId;
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        this.displayNote(note);
        this.renderNotesList();
    }

    displayNote(note) {
        const titleInput = document.getElementById('noteTitle');
        const lastSavedElement = document.getElementById('lastSaved');
        if (!titleInput || !this.editor || !lastSavedElement) return;
        titleInput.value = note.title || '';
        this.editor.setContents(note.quillContent || []);
        const formattedDate = note.updated ? this.formatDate(note.updated) : 'jamais';
        lastSavedElement.textContent = `Dernière sauvegarde: ${formattedDate}`;
        this.updateWordCount();
        const saveButton = document.getElementById('saveNote');
        const clearButton = document.getElementById('clearNote');
        const downloadButton = document.getElementById('downloadNote');
        if (saveButton) saveButton.disabled = false;
        if (clearButton) clearButton.disabled = false;
        if (downloadButton) downloadButton.disabled = false;
    }

    saveCurrentNote() {
        if (!this.currentNoteId || !this.editor) return;
        const titleInput = document.getElementById('noteTitle');
        if (!titleInput) return;
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex === -1) return;
        const quillContent = this.editor.getContents();
        const contentHtml = this.editor.root.innerHTML;
        const contentText = this.editor.getText();
        this.notes[noteIndex].title = titleInput.value;
        this.notes[noteIndex].quillContent = quillContent;
        this.notes[noteIndex].contentHtml = contentHtml;
        this.notes[noteIndex].content = contentText;
        this.notes[noteIndex].updated = new Date().toISOString();
        this.saveNotes();
        this.renderNotesList();
        const lastSavedElement = document.getElementById('lastSaved');
        if (lastSavedElement) {
            lastSavedElement.textContent = `Dernière sauvegarde: ${this.formatDate(this.notes[noteIndex].updated)}`;
        }
        this.showNotification('Note sauvegardée');
    }

    autoSaveNote() {
        clearTimeout(window.autoSaveTimeout);
        window.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, 2000);
    }

    clearCurrentNote() {
        if (!this.currentNoteId || !this.editor) return;
        if (!confirm('Êtes-vous sûr de vouloir effacer le contenu de cette note ?')) return;
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex === -1) return;
        this.editor.setContents([]);
        this.notes[noteIndex].quillContent = [];
        this.notes[noteIndex].contentHtml = '';
        this.notes[noteIndex].content = '';
        this.notes[noteIndex].updated = new Date().toISOString();
        this.saveNotes();
        this.updateWordCount();
        this.renderNotesList();
        this.showNotification('Contenu de la note effacé');
    }

    downloadCurrentNote() {
        if (!this.currentNoteId) return;
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;
        const content = note.contentHtml || note.content || '';
        const title = note.title || 'Note sans titre';
        const element = document.createElement('a');
        const htmlContent = `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <title>${title}</title>\n    <style>body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; } h1 { color: #333; }</style>\n</head>\n<body>\n    <h1>${title}</h1>\n    <div>${content}</div>\n</body>\n</html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        element.href = URL.createObjectURL(blob);
        element.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        this.showNotification('Note téléchargée');
    }

    exportAllNotes() {
        if (this.notes.length === 0) {
            this.showNotification('Aucune note à exporter');
            return;
        }
        const jsonContent = JSON.stringify(this.notes, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const element = document.createElement('a');
        element.href = URL.createObjectURL(blob);
        element.download = `notes_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        this.showNotification('Toutes les notes exportées');
    }

    deleteAllNotes() {
        if (this.notes.length === 0) {
            this.showNotification('Aucune note à supprimer');
            return;
        }
        if (!confirm('Êtes-vous sûr de vouloir supprimer TOUTES les notes ? Cette action est irréversible.')) return;
        this.notes = [];
        this.currentNoteId = null;
        this.saveNotes();
        this.renderNotesList();
        this.clearEditor();
        this.showNotification('Toutes les notes ont été supprimées');
    }

    clearEditor() {
        const titleInput = document.getElementById('noteTitle');
        const lastSavedElement = document.getElementById('lastSaved');
        const wordCountElement = document.getElementById('wordCount');
        if (titleInput) titleInput.value = '';
        if (this.editor) this.editor.setContents([]);
        if (lastSavedElement) lastSavedElement.textContent = 'Dernière sauvegarde: jamais';
        if (wordCountElement) wordCountElement.textContent = '0 mots';
    }

    showNotification(message) {
        let notification = document.querySelector('.note-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'note-notification';
            document.body.appendChild(notification);
        }
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
}

// Initialisation globale et exposition des méthodes sur window.NotesManager
let notesManager = null;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('noteTool')) {
        notesManager = NotesManager.init();
        console.log('Gestionnaire de notes initialisé avec succès');
    }
});
window.NotesManager = {
    createNewNote: () => { if (notesManager) notesManager.createNewNote(); },
    saveCurrentNote: () => { if (notesManager) notesManager.saveCurrentNote(); },
    downloadCurrentNote: () => { if (notesManager) notesManager.downloadCurrentNote(); },
    exportAllNotes: () => { if (notesManager) notesManager.exportAllNotes(); },
    clearNotes: () => { if (notesManager) notesManager.deleteAllNotes(); }
}; 