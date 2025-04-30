import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';

/**
 * Gestionnaire de liste de tâches
 */
export const TodoManager = {
    state: {
        lists: {
            default: {
                id: 'default',
                name: 'Tâches',
                icon: 'list',
                tasks: []
            },
            today: {
                id: 'today',
                name: 'Aujourd\'hui',
                icon: 'calendar-day',
                tasks: []
            },
            important: {
                id: 'important',
                name: 'Important',
                icon: 'star',
                tasks: []
            },
            completed: {
                id: 'completed',
                name: 'Terminé',
                icon: 'check-circle',
                tasks: []
            }
        },
        customLists: {},
        activeListId: 'default',
        activeTaskId: null,
        filter: 'all',
        sort: 'added'
    },

    /**
     * Initialise la liste de tâches
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.updateListView();
        this.updateTaskList();
        this.updateSummary();
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.TODO_LIST);
        if (savedState) {
            this.state = { ...this.state, ...savedState };
        }
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.TODO_LIST, this.state);
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Afficher l'aide
        document.getElementById('todoHelp')?.addEventListener('click', () => {
            document.getElementById('todoHelpPanel').classList.add('active');
        });

        // Fermer l'aide
        document.getElementById('closeTodoHelp')?.addEventListener('click', () => {
            document.getElementById('todoHelpPanel').classList.remove('active');
        });

        // Le plein écran est maintenant géré par le module fullscreen.js global

        // Ajouter une nouvelle tâche
        document.getElementById('addTodoForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Gestion du changement de liste
        document.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', () => {
                const listId = item.dataset.listId;
                this.changeActiveList(listId);
            });
        });

        // Ajouter une nouvelle liste
        document.getElementById('addNewList')?.addEventListener('click', () => {
            this.showNewListModal();
        });

        // Gestion du filtre et du tri
        document.getElementById('todoFilter')?.addEventListener('change', (e) => {
            this.state.filter = e.target.value;
            this.updateTaskList();
        });

        document.getElementById('todoSort')?.addEventListener('change', (e) => {
            this.state.sort = e.target.value;
            this.updateTaskList();
        });

        // Gestion du modal nouvelle liste
        document.getElementById('closeNewListModal')?.addEventListener('click', () => {
            this.hideNewListModal();
        });

        document.getElementById('cancelNewList')?.addEventListener('click', () => {
            this.hideNewListModal();
        });

        document.getElementById('confirmNewList')?.addEventListener('click', () => {
            this.addNewList();
        });

        // Gestion de l'export/import
        document.getElementById('exportAllLists')?.addEventListener('click', () => {
            this.exportLists();
        });

        document.getElementById('importLists')?.addEventListener('click', () => {
            this.importLists();
        });

        // Gestion des détails de tâche
        document.getElementById('closeTodoDetails')?.addEventListener('click', () => {
            this.hideTaskDetails();
        });

        document.getElementById('saveTodoDetails')?.addEventListener('click', () => {
            this.saveTaskDetails();
        });

        document.getElementById('deleteTodo')?.addEventListener('click', () => {
            this.deleteTask();
        });

        // Gestion des sous-tâches
        document.getElementById('addSubtask')?.addEventListener('click', () => {
            this.addSubtask();
        });

        // Gestion du rappel
        document.getElementById('detailsReminder')?.addEventListener('change', (e) => {
            const reminderOptions = document.getElementById('reminderOptions');
            reminderOptions.style.display = e.target.checked ? 'block' : 'none';
        });

        // Supprimer les tâches terminées
        document.getElementById('clearCompletedTasks')?.addEventListener('click', () => {
            this.clearCompletedTasks();
        });
    },

    /**
     * Ajoute une nouvelle tâche
     */
    addTask() {
        const input = document.getElementById('newTodoInput');
        const title = input.value.trim();
        
        if (!title) return;
        
        const task = {
            id: Utils.generateId(),
            title,
            completed: false,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            list: this.state.activeListId,
            notes: '',
            subtasks: [],
            reminder: null,
            dueDate: null
        };
        
        // Si la liste active est spéciale, ajouter aux deux listes
        if (this.state.activeListId === 'today') {
            task.list = 'default';
            this.state.lists.default.tasks.push(task);
            
            // Ajouter une référence dans "Aujourd'hui"
            this.state.lists.today.tasks.push({...task, id: Utils.generateId()});
        } 
        else if (this.state.activeListId === 'important') {
            task.list = 'default';
            task.important = true;
            this.state.lists.default.tasks.push(task);
            
            // Ajouter une référence dans "Important"
            this.state.lists.important.tasks.push({...task, id: Utils.generateId()});
        }
        else {
            // Liste normale ou personnalisée
            const list = this.state.lists[this.state.activeListId] || this.state.customLists[this.state.activeListId];
            list.tasks.push(task);
        }
        
        input.value = '';
        
        this.updateTaskList();
        this.updateSummary();
        this.updateListView();
        this.saveState();
        
        Utils.showNotification('Tâche ajoutée avec succès', 'success');
    },

    /**
     * Met à jour la liste des tâches
     */
    updateTaskList() {
        const todoList = document.getElementById('todoList');
        if (!todoList) return;
        
        let tasks = [];
        
        // Récupérer les tâches de la liste active
        if (this.state.activeListId === 'completed') {
            // Regrouper toutes les tâches terminées de toutes les listes
            Object.values(this.state.lists).forEach(list => {
                tasks = [...tasks, ...list.tasks.filter(task => task.completed)];
            });
            
            // Ajouter les tâches des listes personnalisées
            Object.values(this.state.customLists).forEach(list => {
                tasks = [...tasks, ...list.tasks.filter(task => task.completed)];
            });
        } else {
            // Liste standard ou personnalisée
            const list = this.state.lists[this.state.activeListId] || this.state.customLists[this.state.activeListId];
            tasks = [...list.tasks];
        }
        
        // Appliquer le filtre
        if (this.state.filter === 'active') {
            tasks = tasks.filter(task => !task.completed);
        } else if (this.state.filter === 'completed') {
            tasks = tasks.filter(task => task.completed);
        }
        
        // Appliquer le tri
        tasks = this.sortTasks(tasks, this.state.sort);
        
        todoList.innerHTML = tasks.map(task => this.createTaskElement(task)).join('');
        
        // Ajouter les écouteurs d'événements aux tâches
        this.setupTaskListeners();
    },

    /**
     * Crée un élément HTML pour une tâche
     */
    createTaskElement(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        
        return `
            <div class="todo-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} priority-${task.priority}" 
                 data-task-id="${task.id}">
                <div class="todo-checkbox">
                    <input type="checkbox" id="task-${task.id}" 
                           ${task.completed ? 'checked' : ''}>
                    <label for="task-${task.id}"></label>
                </div>
                <div class="todo-content" onclick="TodoManager.showTaskDetails('${task.id}')">
                    <div class="todo-title">${task.title}</div>
                    <div class="todo-meta">
                        ${task.subtasks.length > 0 ? 
                          `<span class="todo-subtasks">
                             <i class="fas fa-tasks"></i> 
                             ${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length}
                           </span>` : ''}
                        ${dueDate ? `<span class="todo-due-date ${isOverdue ? 'overdue' : ''}">
                                       <i class="fas fa-calendar-alt"></i> ${dueDate}
                                     </span>` : ''}
                        ${task.reminder ? `<span class="todo-reminder">
                                            <i class="fas fa-bell"></i>
                                          </span>` : ''}
                        ${task.important ? `<span class="todo-important">
                                             <i class="fas fa-star"></i>
                                           </span>` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn-icon todo-edit" aria-label="Modifier">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn-icon todo-delete" aria-label="Supprimer">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Configure les écouteurs d'événements pour les tâches
     */
    setupTaskListeners() {
        // Gestion des cases à cocher
        document.querySelectorAll('.todo-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.closest('.todo-item').dataset.taskId;
                this.toggleTaskCompletion(taskId, e.target.checked);
            });
        });
        
        // Gestion des boutons de suppression
        document.querySelectorAll('.todo-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.todo-item').dataset.taskId;
                this.confirmDeleteTask(taskId);
            });
        });
        
        // Gestion des boutons d'édition
        document.querySelectorAll('.todo-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.todo-item').dataset.taskId;
                this.showTaskDetails(taskId);
            });
        });
    },

    /**
     * Change la liste active
     */
    changeActiveList(listId) {
        // Mettre à jour la liste active dans l'état
        this.state.activeListId = listId;
        
        // Mettre à jour l'UI
        document.querySelectorAll('.list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.listId === listId);
        });
        
        // Mettre à jour le titre
        const listTitle = document.getElementById('currentListTitle');
        const list = this.state.lists[listId] || this.state.customLists[listId];
        if (listTitle && list) {
            listTitle.textContent = list.name;
        }
        
        // Mettre à jour les tâches
        this.updateTaskList();
        this.updateSummary();
    },

    /**
     * Affiche les détails d'une tâche
     */
    showTaskDetails(taskId) {
        const todoDetails = document.getElementById('todoDetails');
        if (!todoDetails) return;
        
        // Trouver la tâche
        let task = this.findTask(taskId);
        if (!task) return;
        
        // Stocker l'ID de la tâche active
        this.state.activeTaskId = taskId;
        
        // Remplir les champs
        document.getElementById('detailsTitle').value = task.title;
        document.getElementById('detailsPriority').value = task.priority;
        document.getElementById('detailsDueDate').value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        document.getElementById('detailsNotes').value = task.notes || '';
        
        // Remplir la date de création
        document.getElementById('createdDate').textContent = new Date(task.createdAt).toLocaleDateString();
        
        // Gérer le rappel
        const reminderCheckbox = document.getElementById('detailsReminder');
        const reminderOptions = document.getElementById('reminderOptions');
        const reminderDateTime = document.getElementById('reminderDateTime');
        
        reminderCheckbox.checked = !!task.reminder;
        reminderOptions.style.display = task.reminder ? 'block' : 'none';
        reminderDateTime.value = task.reminder || '';
        
        // Gérer les sous-tâches
        this.updateSubtasksList(task.subtasks);
        
        // Afficher le panneau
        todoDetails.classList.add('active');
    },

    /**
     * Met à jour la liste des sous-tâches
     */
    updateSubtasksList(subtasks) {
        const subtasksList = document.getElementById('subtasksList');
        if (!subtasksList) return;
        
        subtasksList.innerHTML = subtasks.map(subtask => `
            <div class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask.id}">
                <div class="subtask-checkbox">
                    <input type="checkbox" id="subtask-${subtask.id}" ${subtask.completed ? 'checked' : ''}>
                    <label for="subtask-${subtask.id}"></label>
                </div>
                <div class="subtask-title">${subtask.title}</div>
                <button class="btn-icon subtask-delete">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Ajouter les écouteurs d'événements
        subtasksList.querySelectorAll('.subtask-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const subtaskId = e.target.closest('.subtask-item').dataset.subtaskId;
                this.toggleSubtaskCompletion(subtaskId, e.target.checked);
            });
        });
        
        subtasksList.querySelectorAll('.subtask-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const subtaskId = e.target.closest('.subtask-item').dataset.subtaskId;
                this.deleteSubtask(subtaskId);
            });
        });
    },

    /**
     * Ajoute une sous-tâche
     */
    addSubtask() {
        const input = document.getElementById('newSubtask');
        const title = input.value.trim();
        
        if (!title || !this.state.activeTaskId) return;
        
        const task = this.findTask(this.state.activeTaskId);
        if (!task) return;
        
        const subtask = {
            id: Utils.generateId(),
            title,
            completed: false
        };
        
        task.subtasks.push(subtask);
        input.value = '';
        
        this.updateSubtasksList(task.subtasks);
        this.updateTaskList();
        this.saveState();
    },

    /**
     * Bascule l'état de complétion d'une sous-tâche
     */
    toggleSubtaskCompletion(subtaskId, completed) {
        const task = this.findTask(this.state.activeTaskId);
        if (!task) return;
        
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
            subtask.completed = completed;
            this.updateSubtasksList(task.subtasks);
            this.saveState();
        }
    },

    /**
     * Supprime une sous-tâche
     */
    deleteSubtask(subtaskId) {
        const task = this.findTask(this.state.activeTaskId);
        if (!task) return;
        
        task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
        this.updateSubtasksList(task.subtasks);
        this.updateTaskList();
        this.saveState();
    },

    /**
     * Sauvegarde les détails d'une tâche
     */
    saveTaskDetails() {
        if (!this.state.activeTaskId) return;
        
        const task = this.findTask(this.state.activeTaskId);
        if (!task) return;
        
        // Mettre à jour les propriétés
        task.title = document.getElementById('detailsTitle').value;
        task.priority = document.getElementById('detailsPriority').value;
        
        const dueDateValue = document.getElementById('detailsDueDate').value;
        task.dueDate = dueDateValue ? new Date(dueDateValue).toISOString() : null;
        
        task.notes = document.getElementById('detailsNotes').value;
        
        // Gérer le rappel
        const reminderCheckbox = document.getElementById('detailsReminder');
        const reminderDateTime = document.getElementById('reminderDateTime');
        
        task.reminder = reminderCheckbox.checked ? reminderDateTime.value : null;
        
        // Sauvegarder et mettre à jour
        this.hideTaskDetails();
        this.updateTaskList();
        this.saveState();
        
        Utils.showNotification('Tâche mise à jour', 'success');
    },

    /**
     * Cache les détails d'une tâche
     */
    hideTaskDetails() {
        const todoDetails = document.getElementById('todoDetails');
        if (todoDetails) {
            todoDetails.classList.remove('active');
        }
        this.state.activeTaskId = null;
    },

    /**
     * Bascule l'état de complétion d'une tâche
     */
    toggleTaskCompletion(taskId, completed) {
        const task = this.findTask(taskId);
        if (task) {
            task.completed = completed;
            
            // Si la tâche est complétée, ajouter à la liste des complétées
            if (completed && this.state.activeListId !== 'completed') {
                // Vérifier si elle n'est pas déjà dans la liste des complétées
                const isInCompletedList = this.state.lists.completed.tasks.some(t => 
                    t.id === taskId || (t.originId && t.originId === taskId)
                );
                
                if (!isInCompletedList) {
                    const completedTask = {...task, originId: task.id, id: Utils.generateId()};
                    this.state.lists.completed.tasks.push(completedTask);
                }
            }
            
            this.updateTaskList();
            this.updateSummary();
            this.updateListView();
            this.saveState();
        }
    },

    /**
     * Confirme la suppression d'une tâche
     */
    confirmDeleteTask(taskId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            this.deleteTaskById(taskId);
        }
    },

    /**
     * Supprime une tâche
     */
    deleteTaskById(taskId) {
        // Supprimer la tâche de la liste active
        const activeList = this.state.lists[this.state.activeListId] || this.state.customLists[this.state.activeListId];
        
        if (activeList) {
            activeList.tasks = activeList.tasks.filter(task => task.id !== taskId);
        }
        
        // Supprimer de toutes les listes spéciales
        ['today', 'important', 'completed'].forEach(listId => {
            this.state.lists[listId].tasks = this.state.lists[listId].tasks.filter(task => {
                return task.id !== taskId && task.originId !== taskId;
            });
        });
        
        this.updateTaskList();
        this.updateSummary();
        this.updateListView();
        this.saveState();
        
        Utils.showNotification('Tâche supprimée', 'success');
    },

    /**
     * Supprime la tâche active
     */
    deleteTask() {
        if (this.state.activeTaskId) {
            this.confirmDeleteTask(this.state.activeTaskId);
            this.hideTaskDetails();
        }
    },

    /**
     * Efface toutes les tâches terminées
     */
    clearCompletedTasks() {
        if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les tâches terminées ?')) {
            return;
        }
        
        // Nettoyer toutes les listes
        Object.values(this.state.lists).forEach(list => {
            list.tasks = list.tasks.filter(task => !task.completed);
        });
        
        Object.values(this.state.customLists).forEach(list => {
            list.tasks = list.tasks.filter(task => !task.completed);
        });
        
        this.updateTaskList();
        this.updateSummary();
        this.updateListView();
        this.saveState();
        
        Utils.showNotification('Tâches terminées supprimées', 'success');
    },

    /**
     * Affiche le modal pour créer une nouvelle liste
     */
    showNewListModal() {
        const modal = document.getElementById('newListModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('newListName').value = '';
            document.getElementById('newListIcon').value = 'list';
            document.getElementById('newListName').focus();
        }
    },

    /**
     * Cache le modal de nouvelle liste
     */
    hideNewListModal() {
        const modal = document.getElementById('newListModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Ajoute une nouvelle liste
     */
    addNewList() {
        const nameInput = document.getElementById('newListName');
        const iconSelect = document.getElementById('newListIcon');
        
        const name = nameInput.value.trim();
        const icon = iconSelect.value;
        
        if (!name) return;
        
        const listId = 'custom-' + Utils.generateId();
        const newList = {
            id: listId,
            name,
            icon,
            tasks: []
        };
        
        this.state.customLists[listId] = newList;
        
        this.hideNewListModal();
        this.updateListView();
        this.changeActiveList(listId);
        this.saveState();
        
        Utils.showNotification('Liste ajoutée avec succès', 'success');
    },

    /**
     * Met à jour l'affichage des listes
     */
    updateListView() {
        const listsContainer = document.getElementById('listsContainer');
        if (!listsContainer) return;
        
        // Récupérer les listes par défaut
        const defaultLists = Object.values(this.state.lists).map(list => {
            const count = list.id === 'completed' 
                ? this.getTotalCompletedTasks()
                : list.tasks.length;
            
            return `
                <div class="list-item ${list.id === this.state.activeListId ? 'active' : ''}" 
                     data-list-id="${list.id}">
                    <i class="fas fa-${list.icon}"></i>
                    <span>${list.name}</span>
                    <span class="list-count">${count}</span>
                </div>
            `;
        }).join('');
        
        // Ajouter les listes personnalisées si elles existent
        const customLists = Object.values(this.state.customLists).map(list => {
            return `
                <div class="list-item ${list.id === this.state.activeListId ? 'active' : ''}" 
                     data-list-id="${list.id}">
                    <i class="fas fa-${list.icon}"></i>
                    <span>${list.name}</span>
                    <span class="list-count">${list.tasks.length}</span>
                    <button class="btn-icon delete-list" data-list-id="${list.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        // Mettre à jour le HTML
        listsContainer.innerHTML = defaultLists + customLists;
        
        // Reconfigurer les écouteurs pour les listes
        document.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', () => {
                const listId = item.dataset.listId;
                this.changeActiveList(listId);
            });
        });
        
        // Écouteurs pour les boutons de suppression de liste
        document.querySelectorAll('.delete-list').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const listId = button.dataset.listId;
                this.confirmDeleteList(listId);
            });
        });
    },

    /**
     * Confirme la suppression d'une liste
     */
    confirmDeleteList(listId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ? Toutes les tâches associées seront également supprimées.')) {
            this.deleteList(listId);
        }
    },

    /**
     * Supprime une liste
     */
    deleteList(listId) {
        // Supprimer la liste
        delete this.state.customLists[listId];
        
        // Si c'est la liste active, changer pour default
        if (this.state.activeListId === listId) {
            this.changeActiveList('default');
        } else {
            // Sinon juste mettre à jour la vue
            this.updateListView();
        }
        
        this.saveState();
        Utils.showNotification('Liste supprimée', 'success');
    },

    /**
     * Met à jour le résumé des tâches
     */
    updateSummary() {
        // Compter les tâches complétées et le total pour la liste active
        let completed = 0;
        let total = 0;
        
        if (this.state.activeListId === 'completed') {
            // Toutes les tâches terminées
            completed = this.getTotalCompletedTasks();
            total = completed;
        } else {
            // Liste spécifique
            const list = this.state.lists[this.state.activeListId] || this.state.customLists[this.state.activeListId];
            
            if (list) {
                completed = list.tasks.filter(task => task.completed).length;
                total = list.tasks.length;
            }
        }
        
        // Mettre à jour le texte et la barre de progression
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('totalCount').textContent = total;
        
        const progressFill = document.getElementById('todoProgress');
        const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
        progressFill.style.width = `${progressPercentage}%`;
    },

    /**
     * Exporte les listes au format JSON
     */
    exportLists() {
        const data = {
            lists: this.state.lists,
            customLists: this.state.customLists
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `todo-lists-${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        Utils.showNotification('Listes exportées avec succès', 'success');
    },

    /**
     * Importe des listes depuis un fichier JSON
     */
    importLists() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.lists && data.customLists) {
                        if (confirm('Voulez-vous remplacer vos listes actuelles ? Annuler fusionnera les listes.')) {
                            // Remplacer complètement
                            this.state.lists = data.lists;
                            this.state.customLists = data.customLists;
                        } else {
                            // Fusionner
                            Object.entries(data.customLists).forEach(([id, list]) => {
                                if (!this.state.customLists[id]) {
                                    this.state.customLists[id] = list;
                                } else {
                                    // Renommer en cas de conflit
                                    const newId = 'custom-' + Utils.generateId();
                                    list.id = newId;
                                    list.name += ' (importée)';
                                    this.state.customLists[newId] = list;
                                }
                            });
                        }
                        
                        this.updateListView();
                        this.updateTaskList();
                        this.updateSummary();
                        this.saveState();
                        
                        Utils.showNotification('Listes importées avec succès', 'success');
                    } else {
                        throw new Error('Format de fichier invalide');
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'importation:', error);
                    Utils.showNotification('Erreur lors de l\'importation: format invalide', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    },

    /**
     * Trouve une tâche par son ID
     */
    findTask(taskId) {
        // Chercher dans toutes les listes
        for (const listId in this.state.lists) {
            const found = this.state.lists[listId].tasks.find(task => task.id === taskId);
            if (found) return found;
        }
        
        // Chercher dans les listes personnalisées
        for (const listId in this.state.customLists) {
            const found = this.state.customLists[listId].tasks.find(task => task.id === taskId);
            if (found) return found;
        }
        
        return null;
    },

    /**
     * Trie les tâches selon un critère
     */
    sortTasks(tasks, criterion) {
        let sortedTasks = [...tasks];
        
        switch (criterion) {
            case 'added':
                // Tri par date d'ajout (plus récent en premier)
                sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
                
            case 'due':
                // Tri par date d'échéance (plus proche en premier)
                sortedTasks.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
                
            case 'priority':
                // Tri par priorité (élevée en premier)
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
                
            case 'alphabetical':
                // Tri alphabétique
                sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        
        return sortedTasks;
    },

    /**
     * Obtient le nombre total de tâches terminées
     */
    getTotalCompletedTasks() {
        let count = 0;
        
        // Compter dans les listes standard
        Object.values(this.state.lists).forEach(list => {
            count += list.tasks.filter(task => task.completed).length;
        });
        
        // Compter dans les listes personnalisées
        Object.values(this.state.customLists).forEach(list => {
            count += list.tasks.filter(task => task.completed).length;
        });
        
        return count;
    }
};

// Initialisation automatique lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const todoTool = document.getElementById('todoTool');
    if (todoTool && window.location.hash.includes('todoTool')) {
        TodoManager.init();
    }
}); 