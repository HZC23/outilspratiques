/**
 * Gestionnaire de notes avec éditeur de texte riche
 */
export class NotesManager {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.editor = null;
    }

    /**
     * Initialise le gestionnaire de notes
     */
    static init() {
        console.log('Initialisation du gestionnaire de notes...');
        const instance = new NotesManager();
        instance.loadNotes();
        console.log('Notes chargées depuis le stockage local:', instance.notes.length, 'notes trouvées');
        
        // Vérifier si l'outil de notes est présent dans la page
        const noteToolElement = document.getElementById('noteTool');
        if (noteToolElement) {
            console.log('Élément noteTool trouvé dans la page');
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

    /**
     * Configure l'interface utilisateur
     */
    setupUI() {
        // Configurer le bouton d'aide
        const helpButton = document.getElementById('noteHelp');
        const helpPanel = document.getElementById('noteHelpPanel');
        const closeHelpButton = document.getElementById('closeNoteHelp');
        
        if (helpButton && helpPanel && closeHelpButton) {
            helpButton.addEventListener('click', () => {
                helpPanel.classList.toggle('show');
            });
            
            closeHelpButton.addEventListener('click', () => {
                helpPanel.classList.remove('show');
            });
        }
        
        // Configurer le bouton plein écran
        const fullscreenButton = document.getElementById('noteFullscreen');
        const toolContainer = document.getElementById('noteTool');
        
        if (fullscreenButton && toolContainer) {
            fullscreenButton.addEventListener('click', () => {
                toolContainer.classList.toggle('fullscreen');
                const icon = fullscreenButton.querySelector('i');
                
                if (toolContainer.classList.contains('fullscreen')) {
                    icon.classList.remove('fa-expand');
                    icon.classList.add('fa-compress');
                } else {
                    icon.classList.remove('fa-compress');
                    icon.classList.add('fa-expand');
                }
            });
        }
    }

    /**
     * Configure l'éditeur de texte riche avec Quill.js
     */
    setupEditor() {
        // Configuration des options de Quill
        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],        // boutons de formatage inline
            ['blockquote', 'code-block'],                     // blocs
            [{ 'header': 1 }, { 'header': 2 }],               // en-têtes
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],     // listes
            [{ 'script': 'sub'}, { 'script': 'super' }],      // exposant/indice
            [{ 'indent': '-1'}, { 'indent': '+1' }],          // indentation
            [{ 'direction': 'rtl' }],                         // direction du texte
            [{ 'size': ['small', false, 'large', 'huge'] }],  // tailles de police
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],          // couleurs
            [{ 'font': [] }],                                 // police
            [{ 'align': [] }],                                // alignement
            ['link', 'image'],                                // liens, images
            ['clean']                                         // effacer le formatage
        ];

        // Initialiser l'éditeur Quill
        this.editor = new Quill('#quill-editor', {
            modules: {
                toolbar: '#quill-toolbar'
            },
            theme: 'snow'
        });
        
        // Configurer la barre d'outils personnalisée
        const quillToolbar = this.editor.getModule('toolbar');
        quillToolbar.addHandler('image', this.imageHandler.bind(this));
        
        // Événement de modification du contenu pour le compteur de mots et la sauvegarde automatique
        this.editor.on('text-change', () => {
            this.updateWordCount();
            this.autoSaveNote();
        });
        
        console.log('Éditeur Quill initialisé');
    }
    
    /**
     * Gestionnaire pour l'ajout d'images
     */
    imageHandler() {
        const url = prompt('Entrez l\'URL de l\'image:');
        if (url) {
            // Récupérer la position du curseur
            const range = this.editor.getSelection();
            
            // Insérer l'image à la position du curseur
            this.editor.insertEmbed(range.index, 'image', url);
        }
    }

    /**
     * Met à jour le compteur de mots
     */
    updateWordCount() {
        const wordCountElement = document.getElementById('wordCount');
        
        if (!wordCountElement || !this.editor) return;
        
        // Obtenir le texte brut sans formatage
        const text = this.editor.getText();
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        wordCountElement.textContent = `${wordCount} mot${wordCount !== 1 ? 's' : ''}`;
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Bouton pour ajouter une nouvelle note
        const addNoteBtn = document.getElementById('addNewNote');
        if (addNoteBtn) {
            console.log('Bouton d\'ajout de note trouvé, ajout de l\'écouteur d\'événements');
            addNoteBtn.addEventListener('click', () => {
                console.log('Bouton d\'ajout de note cliqué, création d\'une nouvelle note');
                this.createNewNote();
            });
        } else {
            console.error('Bouton d\'ajout de note non trouvé dans le DOM');
        }
        
        // Bouton pour sauvegarder la note
        const saveNoteBtn = document.getElementById('saveNote');
        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
        }
        
        // Bouton pour effacer la note
        const clearNoteBtn = document.getElementById('clearNote');
        if (clearNoteBtn) {
            clearNoteBtn.addEventListener('click', () => this.clearCurrentNote());
        }
        
        // Bouton pour télécharger la note
        const downloadNoteBtn = document.getElementById('downloadNote');
        if (downloadNoteBtn) {
            downloadNoteBtn.addEventListener('click', () => this.downloadCurrentNote());
        }
        
        // Champ de recherche
        const searchInput = document.getElementById('noteSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchNotes(searchInput.value));
        }
        
        // Bouton pour exporter toutes les notes
        const exportAllBtn = document.getElementById('exportAllNotes');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => this.exportAllNotes());
        }
        
        // Bouton pour supprimer toutes les notes
        const deleteAllBtn = document.getElementById('deleteAllNotes');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => this.deleteAllNotes());
        }
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Ctrl+S pour sauvegarder
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote();
            }
        });
    }

    /**
     * Crée une nouvelle note
     */
    createNewNote() {
        console.log('Méthode createNewNote appelée');
        
        // Créer un identifiant unique
        const noteId = Date.now().toString();
        console.log('Nouvel identifiant de note créé:', noteId);
        
        // Créer la nouvelle note
        const newNote = {
            id: noteId,
            title: 'Nouvelle note',
            content: '',
            contentHtml: '',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            tags: []
        };
        
        // Ajouter la note à la liste
        this.notes.unshift(newNote);
        console.log('Note ajoutée à la liste, nombre total de notes:', this.notes.length);
        
        // Mettre à jour l'identifiant de la note courante
        this.currentNoteId = noteId;
        
        // Enregistrer les notes
        this.saveNotes();
        console.log('Notes sauvegardées dans le stockage local');
        
        // Mettre à jour l'affichage
        this.renderNotesList();
        this.displayNote(newNote);
        console.log('Affichage mis à jour avec la nouvelle note');
    }

    /**
     * Charge les notes depuis le stockage local
     */
    loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
        }
    }

    /**
     * Enregistre les notes dans le stockage local
     */
    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    /**
     * Recherche des notes
     * @param {string} query - Terme de recherche
     */
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

    /**
     * Affiche une liste filtrée de notes
     * @param {Array} filteredNotes - Notes filtrées
     */
    renderFilteredNotes(filteredNotes) {
        const notesList = document.getElementById('notesList');
        
        if (!notesList) return;
        
        // Vider la liste
        notesList.innerHTML = '';
        
        // Afficher un message si aucune note
        if (filteredNotes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes';
            emptyMessage.textContent = 'Aucune note trouvée.';
            notesList.appendChild(emptyMessage);
            return;
        }
        
        // Ajouter chaque note à la liste
        filteredNotes.forEach(note => {
            const noteItem = this.createNoteListItem(note);
            notesList.appendChild(noteItem);
        });
    }

    /**
     * Affiche la liste des notes
     */
    renderNotesList() {
        const notesList = document.getElementById('notesList');
        
        if (!notesList) return;
        
        // Vider la liste
        notesList.innerHTML = '';
        
        // Afficher un message si aucune note
        if (this.notes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes';
            emptyMessage.textContent = 'Aucune note. Cliquez sur + pour créer une note.';
            notesList.appendChild(emptyMessage);
            return;
        }
        
        // Ajouter chaque note à la liste
        this.notes.forEach(note => {
            const noteItem = this.createNoteListItem(note);
            notesList.appendChild(noteItem);
        });
    }

    /**
     * Crée un élément de liste pour une note
     * @param {Object} note - Note à afficher
     * @returns {HTMLElement} - Élément de liste
     */
    createNoteListItem(note) {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        
        // Ajouter la classe 'active' si c'est la note courante
        if (note.id === this.currentNoteId) {
            noteItem.classList.add('active');
        }
        
        // Ajouter un titre et une date
        const noteItemTitle = document.createElement('div');
        noteItemTitle.className = 'note-item-title';
        noteItemTitle.textContent = note.title || 'Sans titre';
        
        const noteItemExcerpt = document.createElement('div');
        noteItemExcerpt.className = 'note-item-excerpt';
        
        // Extraire un aperçu du contenu (texte seulement)
        let excerpt = '';
        if (note.content) {
            excerpt = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');
        } else if (note.contentHtml) {
            // Créer un élément temporaire pour extraire le texte du HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.contentHtml;
            excerpt = tempDiv.textContent.substring(0, 50) + (tempDiv.textContent.length > 50 ? '...' : '');
        }
        noteItemExcerpt.textContent = excerpt;
        
        const noteItemDate = document.createElement('div');
        noteItemDate.className = 'note-item-date';
        noteItemDate.textContent = this.formatDate(note.updated);
        
        // Ajouter les éléments au conteneur
        noteItem.appendChild(noteItemTitle);
        noteItem.appendChild(noteItemExcerpt);
        noteItem.appendChild(noteItemDate);
        
        // Ajouter un écouteur d'événements
        noteItem.addEventListener('click', () => this.selectNote(note.id));
        
        return noteItem;
    }

    /**
     * Formate une date pour l'affichage
     * @param {string} dateString - Chaîne de date ISO
     * @return {string} - Date formatée
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Sélectionne une note et l'affiche
     * @param {string} noteId - Identifiant de la note
     */
    selectNote(noteId) {
        // Mettre à jour l'identifiant de la note courante
        this.currentNoteId = noteId;
        
        // Trouver la note
        const note = this.notes.find(n => n.id === noteId);
        
        if (!note) return;
        
        // Afficher la note
        this.displayNote(note);
        
        // Mettre à jour la liste
        this.renderNotesList();
    }

    /**
     * Affiche une note dans l'éditeur
     * @param {Object} note - Note à afficher
     */
    displayNote(note) {
        const titleInput = document.getElementById('noteTitle');
        const lastSavedElement = document.getElementById('lastSaved');
        
        if (!titleInput || !this.editor || !lastSavedElement) return;
        
        // Afficher le titre
        titleInput.value = note.title || '';
        
        // Afficher le contenu dans l'éditeur Quill
        this.editor.setContents(note.quillContent || []);
        
        // Afficher la date de dernière modification
        const formattedDate = note.updated ? this.formatDate(note.updated) : 'jamais';
        lastSavedElement.textContent = `Dernière sauvegarde: ${formattedDate}`;
        
        // Mettre à jour le compteur de mots
        this.updateWordCount();
        
        // Activer les boutons d'action
        const saveButton = document.getElementById('saveNote');
        const clearButton = document.getElementById('clearNote');
        const downloadButton = document.getElementById('downloadNote');
        
        if (saveButton) saveButton.disabled = false;
        if (clearButton) clearButton.disabled = false;
        if (downloadButton) downloadButton.disabled = false;
    }

    /**
     * Sauvegarde la note courante
     */
    saveCurrentNote() {
        if (!this.currentNoteId || !this.editor) return;
        
        const titleInput = document.getElementById('noteTitle');
        
        if (!titleInput) return;
        
        // Trouver la note
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        
        if (noteIndex === -1) return;
        
        // Obtenir le contenu de l'éditeur Quill
        const quillContent = this.editor.getContents();
        const contentHtml = this.editor.root.innerHTML;
        const contentText = this.editor.getText();
        
        // Mettre à jour la note
        this.notes[noteIndex].title = titleInput.value;
        this.notes[noteIndex].quillContent = quillContent;
        this.notes[noteIndex].contentHtml = contentHtml;
        this.notes[noteIndex].content = contentText;
        this.notes[noteIndex].updated = new Date().toISOString();
        
        // Enregistrer les notes
        this.saveNotes();
        
        // Mettre à jour l'affichage
        this.renderNotesList();
        
        // Mettre à jour la date de dernière sauvegarde
        const lastSavedElement = document.getElementById('lastSaved');
        if (lastSavedElement) {
            lastSavedElement.textContent = `Dernière sauvegarde: ${this.formatDate(this.notes[noteIndex].updated)}`;
        }
        
        // Afficher une notification
        this.showNotification('Note sauvegardée');
    }

    /**
     * Sauvegarde automatique lors de la modification
     */
    autoSaveNote() {
        // Utiliser un délai pour éviter de sauvegarder à chaque frappe
        clearTimeout(window.autoSaveTimeout);
        
        window.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, 2000);
    }

    /**
     * Efface le contenu de la note courante
     */
    clearCurrentNote() {
        if (!this.currentNoteId || !this.editor) return;
        
        if (!confirm('Êtes-vous sûr de vouloir effacer le contenu de cette note ?')) {
            return;
        }
        
        // Trouver la note
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        
        if (noteIndex === -1) return;
        
        // Vider l'éditeur
        this.editor.setContents([]);
        
        // Mettre à jour la note
        this.notes[noteIndex].quillContent = [];
        this.notes[noteIndex].contentHtml = '';
        this.notes[noteIndex].content = '';
        this.notes[noteIndex].updated = new Date().toISOString();
        
        // Enregistrer les notes
        this.saveNotes();
        
        // Mettre à jour l'affichage
        this.updateWordCount();
        this.renderNotesList();
        
        // Afficher une notification
        this.showNotification('Contenu de la note effacé');
    }

    /**
     * Télécharge la note courante
     */
    downloadCurrentNote() {
        if (!this.currentNoteId) return;
        
        // Trouver la note
        const note = this.notes.find(n => n.id === this.currentNoteId);
        
        if (!note) return;
        
        // Créer le contenu du fichier
        const content = note.contentHtml || note.content || '';
        const title = note.title || 'Note sans titre';
        
        // Créer un élément a temporaire
        const element = document.createElement('a');
        
        // Créer un fichier HTML
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div>${content}</div>
</body>
</html>`;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        element.href = URL.createObjectURL(blob);
        element.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        
        // Simuler un clic
        document.body.appendChild(element);
        element.click();
        
        // Nettoyer
        document.body.removeChild(element);
        
        // Afficher une notification
        this.showNotification('Note téléchargée');
    }

    /**
     * Exporte toutes les notes
     */
    exportAllNotes() {
        if (this.notes.length === 0) {
            this.showNotification('Aucune note à exporter');
            return;
        }
        
        // Créer un fichier JSON
        const jsonContent = JSON.stringify(this.notes, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        
        // Créer un élément a temporaire
        const element = document.createElement('a');
        element.href = URL.createObjectURL(blob);
        element.download = `notes_${new Date().toISOString().slice(0, 10)}.json`;
        
        // Simuler un clic
        document.body.appendChild(element);
        element.click();
        
        // Nettoyer
        document.body.removeChild(element);
        
        // Afficher une notification
        this.showNotification('Toutes les notes exportées');
    }

    /**
     * Supprime toutes les notes
     */
    deleteAllNotes() {
        if (this.notes.length === 0) {
            this.showNotification('Aucune note à supprimer');
            return;
        }
        
        if (!confirm('Êtes-vous sûr de vouloir supprimer TOUTES les notes ? Cette action est irréversible.')) {
            return;
        }
        
        // Vider la liste des notes
        this.notes = [];
        this.currentNoteId = null;
        
        // Enregistrer les notes
        this.saveNotes();
        
        // Mettre à jour l'affichage
        this.renderNotesList();
        this.clearEditor();
        
        // Afficher une notification
        this.showNotification('Toutes les notes ont été supprimées');
    }

    /**
     * Vide l'éditeur
     */
    clearEditor() {
        const titleInput = document.getElementById('noteTitle');
        const lastSavedElement = document.getElementById('lastSaved');
        const wordCountElement = document.getElementById('wordCount');
        
        if (titleInput) titleInput.value = '';
        if (this.editor) this.editor.setContents([]);
        if (lastSavedElement) lastSavedElement.textContent = 'Dernière sauvegarde: jamais';
        if (wordCountElement) wordCountElement.textContent = '0 mots';
    }

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     */
    showNotification(message) {
        // Créer l'élément de notification s'il n'existe pas
        let notification = document.querySelector('.note-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'note-notification';
            document.body.appendChild(notification);
        }
        
        // Afficher le message
        notification.textContent = message;
        notification.classList.add('show');
        
        // Masquer après 2 secondes
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
}
