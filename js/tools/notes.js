import { Utils } from '../utils.js';

/**
 * Gestionnaire du bloc-notes
 */
export const NotesManager = {
    state: {
        notes: [],
        currentNote: null,
        isEditing: false,
        searchQuery: '',
        sortBy: 'date', // 'date' | 'title' | 'category'
        sortOrder: 'desc', // 'asc' | 'desc'
        categories: new Set(['Personnel', 'Travail', 'Idées', 'Tâches'])
    },

    /**
     * Initialise le bloc-notes
     */
    init() {
        this.loadNotes();
        this.setupListeners();
        this.updateDisplay();
    },

    /**
     * Charge les notes sauvegardées
     */
    loadNotes() {
        const savedNotes = Utils.loadFromStorage('notes', []);
        const savedCategories = Utils.loadFromStorage('noteCategories', [...this.state.categories]);
        
        this.state.notes = savedNotes;
        this.state.categories = new Set(savedCategories);
        
        if (savedNotes.length > 0) {
            this.state.currentNote = savedNotes[0];
        }
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Gestion des notes
        document.getElementById('newNote')?.addEventListener('click', () => {
            this.createNewNote();
        });

        document.getElementById('editNote')?.addEventListener('click', () => {
            this.toggleEditMode();
        });

        document.getElementById('deleteNote')?.addEventListener('click', () => {
            this.deleteCurrentNote();
        });

        document.getElementById('saveNote')?.addEventListener('click', () => {
            this.saveCurrentNote();
        });

        // Recherche et tri
        document.getElementById('searchNotes')?.addEventListener('input', (e) => {
            this.updateSearch(e.target.value);
        });

        document.getElementById('sortNotes')?.addEventListener('change', (e) => {
            this.updateSort(e.target.value);
        });

        document.getElementById('sortOrder')?.addEventListener('click', () => {
            this.toggleSortOrder();
        });

        // Formatage du texte
        const formatButtons = ['bold', 'italic', 'underline', 'strikethrough', 
                             'alignLeft', 'alignCenter', 'alignRight',
                             'bulletList', 'numberList'];
        
        formatButtons.forEach(format => {
            document.getElementById(`format${format}`)?.addEventListener('click', () => {
                this.formatText(format);
            });
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isNotesVisible()) return;

            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote();
            } else if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.createNewNote();
            }
        });
    },

    /**
     * Vérifie si le bloc-notes est visible
     */
    isNotesVisible() {
        const notes = document.getElementById('notesTool');
        return notes?.style.display !== 'none';
    },

    /**
     * Crée une nouvelle note
     */
    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            title: 'Nouvelle note',
            content: '',
            category: 'Personnel',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: []
        };

        this.state.notes.unshift(newNote);
        this.state.currentNote = newNote;
        this.state.isEditing = true;

        this.updateDisplay();
        this.saveNotes();

        // Focus sur le titre
        setTimeout(() => {
            document.getElementById('noteTitle')?.focus();
        }, 0);
    },

    /**
     * Active/désactive le mode édition
     */
    toggleEditMode() {
        if (!this.state.currentNote) return;

        this.state.isEditing = !this.state.isEditing;
        this.updateDisplay();

        if (this.state.isEditing) {
            document.getElementById('noteContent')?.focus();
        }
    },

    /**
     * Supprime la note courante
     */
    deleteCurrentNote() {
        if (!this.state.currentNote) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
            const index = this.state.notes.findIndex(n => n.id === this.state.currentNote.id);
            if (index !== -1) {
                this.state.notes.splice(index, 1);
                this.state.currentNote = this.state.notes[0] || null;
                this.state.isEditing = false;

                this.updateDisplay();
                this.saveNotes();
            }
        }
    },

    /**
     * Sauvegarde la note courante
     */
    saveCurrentNote() {
        if (!this.state.currentNote || !this.state.isEditing) return;

        const titleElement = document.getElementById('noteTitle');
        const contentElement = document.getElementById('noteContent');
        const categoryElement = document.getElementById('noteCategory');

        if (!titleElement || !contentElement || !categoryElement) return;

        const title = titleElement.value.trim();
        if (!title) {
            Utils.showNotification('Le titre ne peut pas être vide', 'warning');
            return;
        }

        this.state.currentNote.title = title;
        this.state.currentNote.content = contentElement.value;
        this.state.currentNote.category = categoryElement.value;
        this.state.currentNote.modified = new Date().toISOString();

        this.state.isEditing = false;
        this.updateDisplay();
        this.saveNotes();

        Utils.showNotification('Note sauvegardée', 'success');
    },

    /**
     * Met à jour la recherche
     */
    updateSearch(query) {
        this.state.searchQuery = query.toLowerCase();
        this.updateDisplay();
    },

    /**
     * Met à jour le tri
     */
    updateSort(sortBy) {
        this.state.sortBy = sortBy;
        this.updateDisplay();
    },

    /**
     * Inverse l'ordre de tri
     */
    toggleSortOrder() {
        this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
        this.updateDisplay();
    },

    /**
     * Formate le texte sélectionné
     */
    formatText(format) {
        const contentElement = document.getElementById('noteContent');
        if (!contentElement || !this.state.isEditing) return;

        const start = contentElement.selectionStart;
        const end = contentElement.selectionEnd;
        const text = contentElement.value;
        
        let prefix = '';
        let suffix = '';
        
        switch (format) {
            case 'bold':
                prefix = '**';
                suffix = '**';
                break;
            case 'italic':
                prefix = '_';
                suffix = '_';
                break;
            case 'underline':
                prefix = '__';
                suffix = '__';
                break;
            case 'strikethrough':
                prefix = '~~';
                suffix = '~~';
                break;
            case 'bulletList':
                prefix = '- ';
                break;
            case 'numberList':
                prefix = '1. ';
                break;
            case 'alignLeft':
                prefix = '::: left\n';
                suffix = '\n:::';
                break;
            case 'alignCenter':
                prefix = '::: center\n';
                suffix = '\n:::';
                break;
            case 'alignRight':
                prefix = '::: right\n';
                suffix = '\n:::';
                break;
        }

        const newText = text.substring(0, start) + prefix +
                       text.substring(start, end) + suffix +
                       text.substring(end);

        contentElement.value = newText;
        contentElement.focus();
        
        // Ajuste la sélection
        const newPosition = end + prefix.length + suffix.length;
        contentElement.setSelectionRange(newPosition, newPosition);
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay() {
        this.updateNotesList();
        this.updateNoteContent();
        this.updateControls();
    },

    /**
     * Met à jour la liste des notes
     */
    updateNotesList() {
        const listContainer = document.getElementById('notesList');
        if (!listContainer) return;

        // Filtre et tri des notes
        const filteredNotes = this.state.notes.filter(note => {
            const searchTerms = this.state.searchQuery.split(' ');
            return searchTerms.every(term =>
                note.title.toLowerCase().includes(term) ||
                note.content.toLowerCase().includes(term) ||
                note.category.toLowerCase().includes(term)
            );
        });

        const sortedNotes = [...filteredNotes].sort((a, b) => {
            let comparison = 0;
            switch (this.state.sortBy) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'category':
                    comparison = a.category.localeCompare(b.category);
                    break;
                default: // 'date'
                    comparison = new Date(b.modified) - new Date(a.modified);
            }
            return this.state.sortOrder === 'asc' ? comparison : -comparison;
        });

        // Génération du HTML
        listContainer.innerHTML = sortedNotes.map(note => `
            <div class="note-item ${note.id === this.state.currentNote?.id ? 'selected' : ''}"
                 onclick="notesManager.selectNote('${note.id}')">
                <div class="note-title">${this.escapeHtml(note.title)}</div>
                <div class="note-meta">
                    <span class="note-category">${note.category}</span>
                    <span class="note-date">${this.formatDate(note.modified)}</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * Met à jour le contenu de la note
     */
    updateNoteContent() {
        const titleElement = document.getElementById('noteTitle');
        const contentElement = document.getElementById('noteContent');
        const categoryElement = document.getElementById('noteCategory');
        const previewElement = document.getElementById('notePreview');
        
        if (!titleElement || !contentElement || !categoryElement || !previewElement) return;

        if (this.state.currentNote) {
            titleElement.value = this.state.currentNote.title;
            contentElement.value = this.state.currentNote.content;
            categoryElement.value = this.state.currentNote.category;

            titleElement.disabled = !this.state.isEditing;
            contentElement.disabled = !this.state.isEditing;
            categoryElement.disabled = !this.state.isEditing;

            // Mise à jour de la prévisualisation
            previewElement.innerHTML = this.renderMarkdown(this.state.currentNote.content);
        } else {
            titleElement.value = '';
            contentElement.value = '';
            categoryElement.value = 'Personnel';
            previewElement.innerHTML = '';
        }

        // Mise à jour des catégories
        categoryElement.innerHTML = [...this.state.categories]
            .map(cat => `<option value="${cat}">${cat}</option>`)
            .join('');
    },

    /**
     * Met à jour les contrôles
     */
    updateControls() {
        const editButton = document.getElementById('editNote');
        const deleteButton = document.getElementById('deleteNote');
        const saveButton = document.getElementById('saveNote');
        const formatButtons = document.getElementById('formatButtons');
        
        if (editButton && deleteButton && saveButton && formatButtons) {
            const hasNote = !!this.state.currentNote;
            
            editButton.style.display = hasNote && !this.state.isEditing ? 'block' : 'none';
            deleteButton.disabled = !hasNote;
            saveButton.style.display = this.state.isEditing ? 'block' : 'none';
            formatButtons.style.display = this.state.isEditing ? 'flex' : 'none';
        }

        // Mise à jour du bouton de tri
        const sortOrderButton = document.getElementById('sortOrder');
        if (sortOrderButton) {
            sortOrderButton.innerHTML = `<i class="fas fa-sort-${this.state.sortOrder === 'asc' ? 'up' : 'down'}"></i>`;
        }
    },

    /**
     * Sélectionne une note
     */
    selectNote(id) {
        const note = this.state.notes.find(n => n.id === id);
        if (note) {
            this.state.currentNote = note;
            this.state.isEditing = false;
            this.updateDisplay();
        }
    },

    /**
     * Sauvegarde les notes
     */
    saveNotes() {
        Utils.saveToStorage('notes', this.state.notes);
        Utils.saveToStorage('noteCategories', [...this.state.categories]);
    },

    /**
     * Formate une date
     */
    formatDate(isoDate) {
        const date = new Date(isoDate);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Échappe les caractères HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Convertit le Markdown en HTML
     */
    renderMarkdown(text) {
        // Remplace les balises de formatage par du HTML
        let html = text
            // Échappement des caractères HTML
            .replace(/[<>&]/g, char => ({
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;'
            }[char]))
            // Gras
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italique
            .replace(/_(.*?)_/g, '<em>$1</em>')
            // Souligné
            .replace(/__(.*?)__/g, '<u>$1</u>')
            // Barré
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            // Liste à puces
            .replace(/^- (.*)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            // Liste numérotée
            .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>')
            // Alignement
            .replace(/^::: (left|center|right)\n([\s\S]*?)\n:::/gm, 
                     '<div style="text-align: $1">$2</div>')
            // Liens
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Paragraphes
            .replace(/\n\n/g, '</p><p>')
            // Sauts de ligne
            .replace(/\n/g, '<br>');

        return `<p>${html}</p>`;
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveNotes();
    }
}; 