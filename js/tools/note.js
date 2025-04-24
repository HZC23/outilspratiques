/**
 * Module de prise de notes avec sauvegarde locale
 */

// État de l'application
let state = {
    notes: [],
    currentNoteId: null
};

/**
 * Initialise l'application de notes
 */
function initNoteApp() {
    // Vérifier si l'outil de notes est présent dans la page
    const noteContainer = document.getElementById('noteTool');
    
    if (!noteContainer) {
        console.log('L\'application de notes n\'est pas présente dans la page actuelle');
        return;
    }
    
    // Récupérer les éléments du DOM
    const notesList = document.getElementById('notesList');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const addNoteBtn = document.getElementById('addNewNote');
    const saveNoteBtn = document.getElementById('saveNote');
    const deleteNoteBtn = document.getElementById('deleteAllNotes');
    
    if (!notesList || !noteTitle || !noteContent || !addNoteBtn || !saveNoteBtn || !deleteNoteBtn) {
        console.log('Éléments de l\'application de notes manquants dans la page');
        console.log('notesList:', !!notesList, 'noteTitle:', !!noteTitle, 'noteContent:', !!noteContent);
        console.log('addNoteBtn:', !!addNoteBtn, 'saveNoteBtn:', !!saveNoteBtn, 'deleteNoteBtn:', !!deleteNoteBtn);
        return;
    }
    
    // Charger les notes depuis le stockage local
    loadNotes();
    
    // Afficher les notes
    renderNotesList();
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
    
    console.log('Application de notes initialisée avec succès');
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    console.log('Configuration des écouteurs d\'événements...');
    
    const addNoteBtn = document.getElementById('addNewNote');
    const saveNoteBtn = document.getElementById('saveNote');
    const deleteNoteBtn = document.getElementById('deleteAllNotes');
    const clearNoteBtn = document.getElementById('clearNote');
    const downloadNoteBtn = document.getElementById('downloadNote');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    
    console.log('Éléments récupérés:',
        'addNewNote:', !!addNoteBtn,
        'saveNote:', !!saveNoteBtn,
        'deleteAllNotes:', !!deleteNoteBtn,
        'clearNote:', !!clearNoteBtn,
        'downloadNote:', !!downloadNoteBtn
    );
    
    if (!addNoteBtn || !saveNoteBtn || !deleteNoteBtn || !noteTitle || !noteContent) {
        console.error('Certains éléments sont manquants, impossible de configurer les écouteurs d\'événements');
        return;
    }
    
    // Écouteur pour le bouton d'ajout de note
    addNoteBtn.addEventListener('click', () => {
        console.log('Bouton addNewNote cliqué');
        createNewNote();
    });
    
    // Écouteur pour le bouton de sauvegarde
    saveNoteBtn.addEventListener('click', () => {
        console.log('Bouton saveNote cliqué');
        saveCurrentNote();
    });
    
    // Écouteur pour le bouton de suppression
    deleteNoteBtn.addEventListener('click', () => {
        console.log('Bouton deleteAllNotes cliqué');
        if (confirm('Êtes-vous sûr de vouloir supprimer TOUTES les notes ?')) {
            state.notes = [];
            state.currentNoteId = null;
            saveNotes();
            renderNotesList();
            clearEditor();
            console.log('Toutes les notes ont été supprimées');
        }
    });
    
    // Écouteur pour le bouton de nettoyage
    if (clearNoteBtn) {
        clearNoteBtn.addEventListener('click', () => {
            console.log('Bouton clearNote cliqué');
            if (state.currentNoteId) {
                if (confirm('Êtes-vous sûr de vouloir effacer le contenu de cette note ?')) {
                    const noteIndex = state.notes.findIndex(n => n.id === state.currentNoteId);
                    if (noteIndex !== -1) {
                        state.notes[noteIndex].content = '';
                        state.notes[noteIndex].updated = new Date().toISOString();
                        saveNotes();
                        displayNote(state.notes[noteIndex]);
                        console.log('Contenu de la note effacé');
                    }
                }
            }
        });
    }
    
    // Écouteur pour le bouton de téléchargement
    if (downloadNoteBtn) {
        downloadNoteBtn.addEventListener('click', () => {
            console.log('Bouton downloadNote cliqué');
            if (state.currentNoteId) {
                const note = state.notes.find(n => n.id === state.currentNoteId);
                if (note) {
                    const content = note.content || '';
                    const title = note.title || 'Note sans titre';
                    
                    // Créer un élément a temporaire
                    const element = document.createElement('a');
                    const file = new Blob([content], {type: 'text/plain'});
                    element.href = URL.createObjectURL(file);
                    element.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
                    
                    // Simuler un clic
                    document.body.appendChild(element);
                    element.click();
                    
                    // Nettoyer
                    document.body.removeChild(element);
                    console.log('Note téléchargée');
                }
            }
        });
    }
    
    // Écouteurs pour les champs de saisie
    noteTitle.addEventListener('input', autoSaveNote);
    noteContent.addEventListener('input', autoSaveNote);
    
    console.log('Écouteurs d\'événements configurés avec succès');
}

/**
 * Crée une nouvelle note
 */
function createNewNote() {
    console.log('Création d\'une nouvelle note');
    
    // Créer un identifiant unique
    const noteId = Date.now().toString();
    
    // Créer la nouvelle note
    const newNote = {
        id: noteId,
        title: 'Nouvelle note',
        content: '',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    console.log('Nouvelle note créée avec ID:', noteId);
    
    // Ajouter la note à la liste
    state.notes.unshift(newNote);
    
    // Mettre à jour l'identifiant de la note courante
    state.currentNoteId = noteId;
    
    // Enregistrer les notes
    saveNotes();
    
    console.log('Notes sauvegardées, nombre total de notes:', state.notes.length);
    
    // Mettre à jour l'affichage
    renderNotesList();
    displayNote(newNote);
    
    console.log('Nouvelle note affichée et rendue dans la liste');
}

/**
 * Charge les notes depuis le stockage local
 */
function loadNotes() {
    const savedNotes = localStorage.getItem('notes');
    
    if (savedNotes) {
        state.notes = JSON.parse(savedNotes);
    }
}

/**
 * Enregistre les notes dans le stockage local
 */
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(state.notes));
}

/**
 * Affiche la liste des notes
 */
function renderNotesList() {
    const notesList = document.getElementById('notesList');
    
    if (!notesList) return;
    
    // Vider la liste
    notesList.innerHTML = '';
    
    // Afficher un message si aucune note
    if (state.notes.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-notes';
        emptyMessage.textContent = 'Aucune note. Cliquez sur + pour créer une note.';
        notesList.appendChild(emptyMessage);
        return;
    }
    
    // Ajouter chaque note à la liste
    state.notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        
        // Ajouter la classe 'active' si c'est la note courante
        if (note.id === state.currentNoteId) {
            noteItem.classList.add('active');
        }
        
        // Ajouter un titre et une date
        const noteItemTitle = document.createElement('div');
        noteItemTitle.className = 'note-item-title';
        noteItemTitle.textContent = note.title || 'Sans titre';
        
        const noteItemDate = document.createElement('div');
        noteItemDate.className = 'note-item-date';
        noteItemDate.textContent = formatDate(note.updated);
        
        // Ajouter les éléments au conteneur
        noteItem.appendChild(noteItemTitle);
        noteItem.appendChild(noteItemDate);
        
        // Ajouter un écouteur d'événements
        noteItem.addEventListener('click', () => selectNote(note.id));
        
        // Ajouter l'élément à la liste
        notesList.appendChild(noteItem);
    });
}

/**
 * Formate une date pour l'affichage
 * @param {string} dateString - Chaîne de date ISO
 * @return {string} - Date formatée
 */
function formatDate(dateString) {
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
function selectNote(noteId) {
    // Mettre à jour l'identifiant de la note courante
    state.currentNoteId = noteId;
    
    // Trouver la note
    const note = state.notes.find(n => n.id === noteId);
    
    if (!note) return;
    
    // Afficher la note
    displayNote(note);
    
    // Mettre à jour la liste
    renderNotesList();
}

/**
 * Affiche une note dans l'éditeur
 * @param {Object} note - Note à afficher
 */
function displayNote(note) {
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    
    if (!titleInput || !contentInput) return;
    
    titleInput.value = note.title;
    contentInput.value = note.content;
    
    // Activer les boutons
    const saveButton = document.getElementById('saveNote');
    const deleteButton = document.getElementById('deleteAllNotes');
    
    if (saveButton) saveButton.disabled = false;
    if (deleteButton) deleteButton.disabled = false;
}

/**
 * Sauvegarde la note courante
 */
function saveCurrentNote() {
    if (!state.currentNoteId) return;
    
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    
    if (!titleInput || !contentInput) return;
    
    // Trouver la note
    const noteIndex = state.notes.findIndex(n => n.id === state.currentNoteId);
    
    if (noteIndex === -1) return;
    
    // Mettre à jour la note
    state.notes[noteIndex].title = titleInput.value;
    state.notes[noteIndex].content = contentInput.value;
    state.notes[noteIndex].updated = new Date().toISOString();
    
    // Enregistrer les notes
    saveNotes();
    
    // Mettre à jour l'affichage
    renderNotesList();
    
    // Afficher une notification
    showSaveNotification();
}

/**
 * Sauvegarde automatique lors de la modification
 */
function autoSaveNote() {
    // Utiliser un délai pour éviter de sauvegarder à chaque frappe
    clearTimeout(window.autoSaveTimeout);
    
    window.autoSaveTimeout = setTimeout(() => {
        saveCurrentNote();
    }, 1000);
}

/**
 * Supprime la note courante
 */
function deleteCurrentNote() {
    if (!state.currentNoteId) {
        console.log('Aucune note sélectionnée pour la suppression');
        return;
    }
    
    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
        console.log('Suppression annulée par l\'utilisateur');
        return;
    }
    
    console.log('Suppression de la note', state.currentNoteId);
    
    // Filtrer la note à supprimer
    state.notes = state.notes.filter(n => n.id !== state.currentNoteId);
    
    // Réinitialiser la note courante
    state.currentNoteId = state.notes.length > 0 ? state.notes[0].id : null;
    
    // Enregistrer les notes
    saveNotes();
    
    // Mettre à jour l'affichage
    renderNotesList();
    
    // Afficher la première note ou vider l'éditeur
    if (state.currentNoteId) {
        displayNote(state.notes[0]);
        console.log('Affichage de la première note après suppression');
    } else {
        clearEditor();
        console.log('Éditeur vidé après suppression');
    }
}

/**
 * Vide l'éditeur
 */
function clearEditor() {
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    
    if (!titleInput || !contentInput) return;
    
    titleInput.value = '';
    contentInput.value = '';
    
    // Désactiver les boutons
    const saveButton = document.getElementById('saveNote');
    const deleteButton = document.getElementById('deleteAllNotes');
    
    if (saveButton) saveButton.disabled = true;
    if (deleteButton) deleteButton.disabled = true;
}

/**
 * Affiche une notification de sauvegarde
 */
function showSaveNotification() {
    const notification = document.querySelector('.note-notification');
    
    if (!notification) return;
    
    notification.textContent = 'Note sauvegardée';
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Initialiser l'application de notes seulement quand le DOM est complètement chargé
// et seulement si nous sommes sur la page de l'application de notes
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('noteTool')) {
        console.log('Element noteTool trouvé, initialisation de l\'application de notes...');
        initNoteApp();
    } else {
        console.log('Element noteTool non trouvé dans la page');
    }
}); 