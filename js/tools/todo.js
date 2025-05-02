import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';

/**
 * Gestionnaire de liste de tâches avancé
 */
export const TodoManager = {
    state: {
        lists: {
            default: {
                id: 'default',
                name: 'Tâches',
                icon: 'list',
                color: '#4c6ef5',
                tasks: []
            },
            today: {
                id: 'today',
                name: 'Aujourd\'hui',
                icon: 'calendar-day',
                color: '#40c057',
                tasks: []
            },
            important: {
                id: 'important',
                name: 'Important',
                icon: 'star',
                color: '#fab005',
                tasks: []
            },
            completed: {
                id: 'completed',
                name: 'Terminé',
                icon: 'check-circle',
                color: '#15aabf',
                tasks: []
            }
        },
        customLists: {},
        activeListId: 'default',
        activeTaskId: null,
        filter: 'all',
        sort: 'added',
        searchQuery: '',
        searchResults: []
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
        this.checkDueTasks();
        this.autoSyncTodayList();
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

        // Recherche
        document.getElementById('todoSearch')?.addEventListener('click', () => {
            this.showSearchPanel();
        });

        document.getElementById('closeSearchPanel')?.addEventListener('click', () => {
            this.hideSearchPanel();
        });

        document.getElementById('searchTasks')?.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value.trim().toLowerCase();
            this.updateTaskList();
        });

        document.getElementById('resetSearch')?.addEventListener('click', () => {
            this.resetSearch();
        });

        document.getElementById('runSearch')?.addEventListener('click', () => {
            this.performAdvancedSearch();
        });

        document.getElementById('searchDateRange')?.addEventListener('change', (e) => {
            const customRange = document.getElementById('customDateRange');
            customRange.style.display = e.target.value === 'custom' ? 'grid' : 'none';
        });

        // Le plein écran est maintenant géré par le module fullscreen.js global

        // Ajouter une nouvelle tâche
        document.getElementById('addTodoForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Boutons d'action rapide
        document.getElementById('quickPriority')?.addEventListener('click', () => {
            this.toggleQuickPriorityMenu();
        });

        document.getElementById('quickDate')?.addEventListener('click', () => {
            this.toggleQuickDateMenu();
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

        // Configuration des sélecteurs d'icônes et de couleurs
        this.setupIconSelector();
        this.setupColorSelector();

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

        // Configuration du sélecteur de priorité
        this.setupPrioritySelector();

        // Gestion des sous-tâches
        document.getElementById('addSubtask')?.addEventListener('click', () => {
            this.addSubtask();
        });

        // Gestion du rappel
        document.getElementById('detailsReminder')?.addEventListener('change', (e) => {
            const reminderOptions = document.getElementById('reminderOptions');
            reminderOptions.style.display = e.target.checked ? 'block' : 'none';
        });

        // Gestion des tags
        document.getElementById('addTag')?.addEventListener('click', () => {
            this.addTag();
        });

        // Supprimer les tâches terminées
        document.getElementById('clearCompletedTasks')?.addEventListener('click', () => {
            this.clearCompletedTasks();
        });
    },

    /**
     * Configure le sélecteur d'icônes
     */
    setupIconSelector() {
        const iconBtns = document.querySelectorAll('.icon-btn');
        const hiddenInput = document.getElementById('newListIcon');

        // Définir l'icône par défaut comme active
        const defaultIconBtn = document.querySelector('.icon-btn[data-icon="list"]');
        if (defaultIconBtn) {
            defaultIconBtn.classList.add('active');
        }

        iconBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Supprimer la classe active de tous les boutons
                iconBtns.forEach(b => b.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active');
                // Mettre à jour la valeur de l'input caché
                if (hiddenInput) {
                    hiddenInput.value = btn.dataset.icon;
                }
            });
        });
    },

    /**
     * Configure le sélecteur de couleurs
     */
    setupColorSelector() {
        const colorBtns = document.querySelectorAll('.color-btn');
        const hiddenInput = document.getElementById('newListColor');

        // Définir la couleur par défaut comme active
        const defaultColorBtn = document.querySelector('.color-btn[data-color="#007bff"]');
        if (defaultColorBtn) {
            defaultColorBtn.classList.add('active');
        }

        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Supprimer la classe active de tous les boutons
                colorBtns.forEach(b => b.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active');
                // Mettre à jour la valeur de l'input caché
                if (hiddenInput) {
                    hiddenInput.value = btn.dataset.color;
                }
            });
        });
    },

    /**
     * Configure le sélecteur de priorité
     */
    setupPrioritySelector() {
        const priorityBtns = document.querySelectorAll('.priority-btn');
        const hiddenInput = document.getElementById('detailsPriority');

        priorityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Supprimer la classe active de tous les boutons
                priorityBtns.forEach(b => b.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active');
                // Mettre à jour la valeur de l'input caché
                if (hiddenInput) {
                    hiddenInput.value = btn.dataset.priority;
                }
            });
        });
    },

    /**
     * Affiche le menu rapide de priorité
     */
    toggleQuickPriorityMenu() {
        // Implémenter un menu rapide pour définir la priorité lors de l'ajout d'une tâche
        alert('Fonctionnalité à venir: sélection rapide de priorité');
    },

    /**
     * Affiche le menu rapide de date
     */
    toggleQuickDateMenu() {
        // Implémenter un menu rapide pour définir la date lors de l'ajout d'une tâche
        alert('Fonctionnalité à venir: sélection rapide de date');
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
            tags: [],
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

        // Appliquer la recherche simple
        if (this.state.searchQuery) {
            tasks = tasks.filter(task => 
                task.title.toLowerCase().includes(this.state.searchQuery) ||
                task.notes?.toLowerCase().includes(this.state.searchQuery) ||
                task.tags?.some(tag => tag.toLowerCase().includes(this.state.searchQuery))
            );
        }
        
        // Appliquer le tri
        tasks = this.sortTasks(tasks, this.state.sort);
        
        // Générer le HTML
        if (tasks.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks empty-icon"></i>
                    <p>Aucune tâche à afficher</p>
                    <p class="empty-hint">Utilisez le champ ci-dessus pour ajouter une nouvelle tâche</p>
                </div>
            `;
        } else {
            todoList.innerHTML = tasks.map(task => this.createTaskElement(task)).join('');
        }
        
        // Ajouter les écouteurs d'événements aux tâches
        this.setupTaskListeners();
    },

    /**
     * Crée un élément HTML pour une tâche
     */
    createTaskElement(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        const subtasksCompleted = task.subtasks.filter(st => st.completed).length;
        const subtasksTotal = task.subtasks.length;
        const subtasksProgress = subtasksTotal > 0 
            ? Math.round((subtasksCompleted / subtasksTotal) * 100) 
            : 0;

        const tagsHtml = task.tags && task.tags.length > 0
            ? `<div class="todo-tags">
                ${task.tags.map(tag => `<span class="todo-tag">${tag}</span>`).join('')}
              </div>`
            : '';
        
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
                             <span class="subtask-text">${subtasksCompleted}/${subtasksTotal}</span>
                             <span class="subtask-progress" style="width: ${subtasksProgress}%"></span>
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
                    ${tagsHtml}
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
        
        // Mettre à jour la sélection de priorité
        const priorityBtns = document.querySelectorAll('.priority-btn');
        priorityBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === task.priority);
        });
        document.getElementById('detailsPriority').value = task.priority;
        
        // Dates
        document.getElementById('detailsDueDate').value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        document.getElementById('createdDate').textContent = new Date(task.createdAt).toLocaleDateString();
        
        // Notes
        document.getElementById('detailsNotes').value = task.notes || '';
        
        // Gérer le rappel
        const reminderCheckbox = document.getElementById('detailsReminder');
        const reminderOptions = document.getElementById('reminderOptions');
        const reminderDateTime = document.getElementById('reminderDateTime');
        
        reminderCheckbox.checked = !!task.reminder;
        reminderOptions.style.display = task.reminder ? 'block' : 'none';
        reminderDateTime.value = task.reminder || '';
        
        // Gérer les sous-tâches
        this.updateSubtasksList(task.subtasks);
        
        // Gérer les tags
        this.updateTagsList(task.tags || []);
        
        // Afficher le panneau
        todoDetails.classList.add('active');
    },

    /**
     * Met à jour la liste des sous-tâches
     */
    updateSubtasksList(subtasks) {
        const subtasksList = document.getElementById('subtasksList');
        if (!subtasksList) return;
        
        if (subtasks.length === 0) {
            subtasksList.innerHTML = '<div class="empty-hint">Aucune sous-tâche</div>';
            return;
        }
        
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
            
            // Vérifier si toutes les sous-tâches sont complétées
            const allCompleted = task.subtasks.every(st => st.completed);
            
            // Mise à jour visuelle
            document.querySelector(`.subtask-item[data-subtask-id="${subtaskId}"]`)
                ?.classList.toggle('completed', completed);
            
            // Suggérer de marquer la tâche comme complétée
            if (allCompleted && !task.completed && task.subtasks.length > 0) {
                if (confirm('Toutes les sous-tâches sont terminées. Marquer la tâche principale comme terminée ?')) {
                    this.toggleTaskCompletion(task.id, true);
                }
            }
            
            this.updateTaskList();
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
    },

    /**
     * Met à jour la liste des tags
     */
    updateTagsList(tags) {
        const tagsList = document.getElementById('tagsList');
        if (!tagsList) return;
        
        if (tags.length === 0) {
            tagsList.innerHTML = '<div class="empty-hint">Aucun tag</div>';
            return;
        }
        
        tagsList.innerHTML = tags.map(tag => `
            <div class="tag-item" data-tag="${tag}">
                ${tag}
                <button class="btn-icon tag-delete">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Ajouter les écouteurs d'événements
        tagsList.querySelectorAll('.tag-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const tag = e.target.closest('.tag-item').dataset.tag;
                this.deleteTag(tag);
            });
        });
    },

    /**
     * Ajoute un tag à la tâche active
     */
    addTag() {
        const input = document.getElementById('detailsTag');
        const tag = input.value.trim();
        
        if (!tag || !this.state.activeTaskId) return;
        
        const task = this.findTask(this.state.activeTaskId);
        if (!task) return;
        
        // Initialiser le tableau de tags si nécessaire
        if (!task.tags) {
            task.tags = [];
        }
        
        // Vérifier si le tag existe déjà
        if (task.tags.includes(tag)) {
            Utils.showNotification('Ce tag existe déjà', 'warning');
            return;
        }
        
        // Ajouter le tag
        task.tags.push(tag);
        input.value = '';
        
        this.updateTagsList(task.tags);
        this.updateTaskList();
        this.saveState();
    },

    /**
     * Supprime un tag de la tâche active
     */
    deleteTag(tag) {
        const task = this.findTask(this.state.activeTaskId);
        if (!task || !task.tags) return;
        
        task.tags = task.tags.filter(t => t !== tag);
        this.updateTagsList(task.tags);
        this.updateTaskList();
        this.saveState();
    },

    /**
     * Affiche le panneau de recherche
     */
    showSearchPanel() {
        const searchPanel = document.getElementById('searchPanel');
        if (searchPanel) {
            // Pré-remplir les options de listes
            this.updateSearchListOptions();
            searchPanel.classList.add('active');
        }
    },

    /**
     * Masque le panneau de recherche
     */
    hideSearchPanel() {
        const searchPanel = document.getElementById('searchPanel');
        if (searchPanel) {
            searchPanel.classList.remove('active');
        }
    },

    /**
     * Met à jour les options de listes pour la recherche
     */
    updateSearchListOptions() {
        const container = document.getElementById('searchListsOptions');
        if (!container) return;
        
        let htmlContent = '';
        
        // Ajouter les listes par défaut
        Object.values(this.state.lists).forEach(list => {
            htmlContent += `
                <div class="checkbox-group-item">
                    <label>
                        <input type="checkbox" value="${list.id}" checked> 
                        <i class="fas fa-${list.icon}"></i> ${list.name}
                    </label>
                </div>
            `;
        });
        
        // Ajouter les listes personnalisées
        Object.values(this.state.customLists).forEach(list => {
            htmlContent += `
                <div class="checkbox-group-item">
                    <label>
                        <input type="checkbox" value="${list.id}" checked> 
                        <i class="fas fa-${list.icon}"></i> ${list.name}
                    </label>
                </div>
            `;
        });
        
        container.innerHTML = htmlContent;
    },

    /**
     * Réinitialise la recherche avancée
     */
    resetSearch() {
        // Réinitialiser les champs
        document.getElementById('searchQuery').value = '';
        document.getElementById('searchDateRange').value = 'all';
        document.getElementById('customDateRange').style.display = 'none';
        
        // Cocher toutes les cases
        document.querySelectorAll('#searchListsOptions input, .checkbox-group input').forEach(input => {
            input.checked = true;
        });
        
        // Vider les résultats
        document.getElementById('searchResults').innerHTML = '';
    },

    /**
     * Effectue une recherche avancée
     */
    performAdvancedSearch() {
        const query = document.getElementById('searchQuery').value.trim().toLowerCase();
        let results = [];
        
        // Récupérer les listes sélectionnées
        const selectedLists = Array.from(
            document.querySelectorAll('#searchListsOptions input:checked')
        ).map(input => input.value);
        
        // Récupérer les priorités sélectionnées
        const selectedPriorities = Array.from(
            document.querySelectorAll('.form-group:nth-of-type(3) input:checked')
        ).map(input => input.value);
        
        // Récupérer les statuts sélectionnés
        const includeCompleted = document.querySelector('input[value="completed"]').checked;
        const includeActive = document.querySelector('input[value="active"]').checked;
        
        // Recherche par date
        const dateRange = document.getElementById('searchDateRange').value;
        const dateFrom = document.getElementById('searchDateFrom').value;
        const dateTo = document.getElementById('searchDateTo').value;
        
        // Collecter les tâches des listes sélectionnées
        selectedLists.forEach(listId => {
            const list = this.state.lists[listId] || this.state.customLists[listId];
            if (!list) return;
            
            list.tasks.forEach(task => {
                // Filtrer par statut
                if ((!includeCompleted && task.completed) || (!includeActive && !task.completed)) {
                    return;
                }
                
                // Filtrer par priorité
                if (!selectedPriorities.includes(task.priority)) {
                    return;
                }
                
                // Filtrer par texte
                if (query && 
                    !task.title.toLowerCase().includes(query) && 
                    !(task.notes && task.notes.toLowerCase().includes(query)) &&
                    !(task.tags && task.tags.some(tag => tag.toLowerCase().includes(query)))) {
                    return;
                }
                
                // Filtrer par date
                if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    const weekStart = new Date(today);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    
                    if (dateRange === 'today' && (dueDate < today || dueDate >= tomorrow)) {
                        return;
                    }
                    
                    if (dateRange === 'week' && (dueDate < weekStart || dueDate >= weekEnd)) {
                        return;
                    }
                    
                    if (dateRange === 'month' && (dueDate < monthStart || dueDate >= monthEnd)) {
                        return;
                    }
                    
                    if (dateRange === 'custom') {
                        const fromDate = dateFrom ? new Date(dateFrom) : null;
                        const toDate = dateTo ? new Date(dateTo) : null;
                        
                        if (fromDate && dueDate < fromDate) return;
                        if (toDate) {
                            const nextDay = new Date(toDate);
                            nextDay.setDate(nextDay.getDate() + 1);
                            if (dueDate >= nextDay) return;
                        }
                    }
                } else if (dateRange !== 'all') {
                    // Si pas de date d'échéance, on exclut
                    return;
                }
                
                // Ajouter à la liste des résultats si tous les filtres passent
                results.push({
                    ...task,
                    listName: list.name,
                    listIcon: list.icon
                });
            });
        });
        
        // Tri des résultats
        results.sort((a, b) => {
            // D'abord par date d'échéance
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            
            // Ensuite par priorité
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        // Afficher les résultats
        this.displaySearchResults(results);
    },

    /**
     * Affiche les résultats de recherche
     */
    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search empty-icon"></i>
                    <p>Aucun résultat trouvé</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <h4 class="search-results-title">${results.length} résultat(s) trouvé(s)</h4>
            <div class="search-results-list">
                ${results.map(task => `
                    <div class="search-result-item ${task.completed ? 'completed' : ''}" 
                         onclick="TodoManager.showTaskDetails('${task.id}')">
                        <div class="search-result-title">
                            <i class="fas fa-${task.listIcon}"></i> 
                            <span>${task.title}</span>
                        </div>
                        <div class="search-result-meta">
                            <span>${task.listName}</span>
                            ${task.dueDate ? 
                                `<span>
                                    <i class="fas fa-calendar-alt"></i> 
                                    ${new Date(task.dueDate).toLocaleDateString()}
                                </span>` : ''}
                            <span class="search-result-priority priority-${task.priority}">
                                ${task.priority === 'high' ? 'Élevée' : 
                                  task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Vérifie les tâches dont la date d'échéance est aujourd'hui ou dépassée
     * et avertit l'utilisateur
     */
    checkDueTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let dueTodayCount = 0;
        let overdueCount = 0;
        
        // Parcourir toutes les listes
        const allLists = {...this.state.lists, ...this.state.customLists};
        
        Object.values(allLists).forEach(list => {
            list.tasks.forEach(task => {
                if (task.completed || !task.dueDate) return;
                
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                
                if (dueDate.getTime() === today.getTime()) {
                    dueTodayCount++;
                } else if (dueDate < today) {
                    overdueCount++;
                }
            });
        });
        
        // Afficher une notification si des tâches sont dues aujourd'hui ou en retard
        if (dueTodayCount > 0 || overdueCount > 0) {
            let message = '';
            
            if (dueTodayCount > 0) {
                message += `${dueTodayCount} tâche(s) à faire aujourd'hui. `;
            }
            
            if (overdueCount > 0) {
                message += `${overdueCount} tâche(s) en retard.`;
            }
            
            Utils.showNotification(message, 'warning');
        }
    },

    /**
     * Synchronise automatiquement la liste "Aujourd'hui" avec les tâches
     * dont la date d'échéance est aujourd'hui
     */
    autoSyncTodayList() {
        const today = new Date().toISOString().split('T')[0];
        
        // Parcourir toutes les listes sauf "aujourd'hui"
        Object.values(this.state.lists).forEach(list => {
            if (list.id === 'today') return;
            
            list.tasks.forEach(task => {
                if (task.dueDate) {
                    const dueDate = task.dueDate.split('T')[0];
                    
                    if (dueDate === today) {
                        this.addTaskToTodayList(task);
                    }
                }
            });
        });
        
        // Faire de même pour les listes personnalisées
        Object.values(this.state.customLists).forEach(list => {
            list.tasks.forEach(task => {
                if (task.dueDate) {
                    const dueDate = task.dueDate.split('T')[0];
                    
                    if (dueDate === today) {
                        this.addTaskToTodayList(task);
                    }
                }
            });
        });
        
        // Mettre à jour l'interface
        this.updateListView();
        this.updateTaskList();
        this.saveState();
    },

    /**
     * Ajoute une tâche à la liste "Aujourd'hui" si elle n'y est pas déjà
     * @param {Object} task - La tâche à ajouter
     */
    addTaskToTodayList(task) {
        // Vérifier si la tâche est déjà dans la liste "aujourd'hui"
        const alreadyInTodayList = this.state.lists.today.tasks.some(t => 
            t.originId === task.id || t.id === task.id
        );
        
        if (!alreadyInTodayList) {
            // Ajouter une copie de la tâche à la liste "aujourd'hui"
            this.state.lists.today.tasks.push({
                ...task,
                id: Utils.generateId(),
                originId: task.id
            });
        }
    },

    /**
     * Ajoute une tâche à la liste "Important" si elle n'y est pas déjà
     * @param {Object} task - La tâche à ajouter
     */
    addTaskToImportantList(task) {
        // Vérifier si la tâche est déjà dans la liste "important"
        const alreadyInImportantList = this.state.lists.important.tasks.some(t => 
            t.originId === task.id || t.id === task.id
        );
        
        if (!alreadyInImportantList) {
            // Ajouter une copie de la tâche à la liste "important"
            this.state.lists.important.tasks.push({
                ...task,
                id: Utils.generateId(),
                originId: task.id,
                important: true
            });
        }
    },
};

// Initialisation automatique lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const todoTool = document.getElementById('todoTool');
    if (todoTool && window.location.hash.includes('todoTool')) {
        TodoManager.init();
    }
}); 