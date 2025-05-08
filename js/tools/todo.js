import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { dataSyncManager } from '../data-sync.js';
import { isAuthenticated } from '../supabase.js';

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
        searchResults: [],
        nextTaskPriority: null,
        nextTaskDueDate: null
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

        // Écouter l'événement de mise à jour des tâches synchronisées
        document.addEventListener('data-sync:todos-updated', () => {
            console.log('Événement data-sync:todos-updated reçu. Rafraîchissement de l\'UI des tâches...');
            this.loadState(); // Recharger l'état depuis localStorage (qui a été mis à jour par data-sync.js)
            this.updateListView();
            this.updateTaskList();
            this.updateSummary();
            this.checkDueTasks(); // Vérifier à nouveau les tâches dues après synchro
            this.autoSyncTodayList(); // Resynchroniser la liste Aujourd'hui
        });
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

        // Déclencher la synchronisation après la sauvegarde de l'état si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("État sauvegardé localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
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

        document.getElementById('applySearch')?.addEventListener('click', () => {
            this.performAdvancedSearch();
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
        document.getElementById('closeListModal')?.addEventListener('click', () => {
            this.hideNewListModal();
        });

        document.getElementById('cancelListForm')?.addEventListener('click', () => {
            this.hideNewListModal();
        });

        document.getElementById('saveList')?.addEventListener('click', () => {
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
        const hiddenInput = document.getElementById('listIcon');

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
        const hiddenInput = document.getElementById('listColor');

        // Définir la couleur par défaut comme active
        const defaultColorBtn = document.querySelector('.color-btn[data-color="#4c6ef5"]');
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
        const menu = document.getElementById('quickPriorityMenu');
        if (!menu) return;
        
        // Afficher/Cacher le menu
        menu.classList.toggle('active');
        
        // Configurer les écouteurs d'événements si le menu est actif
        if (menu.classList.contains('active')) {
            const options = menu.querySelectorAll('.quick-priority-option');
            
            options.forEach(option => {
                option.addEventListener('click', () => {
                    this.setQuickPriority(option.dataset.priority);
                    menu.classList.remove('active');
                });
            });
            
            // Fermer le menu quand on clique ailleurs
            document.addEventListener('click', this.closeQuickPriorityMenu = (e) => {
                if (!menu.contains(e.target) && e.target.id !== 'quickPriority') {
                    menu.classList.remove('active');
                    document.removeEventListener('click', this.closeQuickPriorityMenu);
                }
            });
        }
    },

    /**
     * Définit la priorité rapide
     */
    setQuickPriority(priority) {
        // Stocke la priorité pour la prochaine tâche
        this.state.nextTaskPriority = priority;
        
        // Change l'icône du bouton selon la priorité
        const button = document.getElementById('quickPriority');
        if (button) {
            // Réinitialiser les classes
            button.className = 'btn-icon';
            
            // Ajouter la classe selon la priorité
            if (priority === 'high') {
                button.classList.add('priority-high');
                button.querySelector('i').style.color = '#fa5252';
            } else if (priority === 'medium') {
                button.classList.add('priority-medium');
                button.querySelector('i').style.color = '#fab005';
            } else {
                button.classList.add('priority-low');
                button.querySelector('i').style.color = '#40c057';
            }
        }
    },

    /**
     * Affiche le menu rapide de date
     */
    toggleQuickDateMenu() {
        const menu = document.getElementById('quickDateMenu');
        if (!menu) return;
        
        // Afficher/Cacher le menu
        menu.classList.toggle('active');
        
        // Configurer les écouteurs d'événements si le menu est actif
        if (menu.classList.contains('active')) {
            const options = menu.querySelectorAll('.quick-date-option');
            
            options.forEach(option => {
                option.addEventListener('click', () => {
                    this.setQuickDate(option.dataset.date);
                    menu.classList.remove('active');
                });
            });
            
            // Configurer le bouton pour la date personnalisée
            document.getElementById('applyCustomDate')?.addEventListener('click', () => {
                const dateInput = document.getElementById('quickDateCustom');
                if (dateInput && dateInput.value) {
                    this.setQuickDate('custom', dateInput.value);
                    menu.classList.remove('active');
                }
            });
            
            // Fermer le menu quand on clique ailleurs
            document.addEventListener('click', this.closeQuickDateMenu = (e) => {
                if (!menu.contains(e.target) && e.target.id !== 'quickDate') {
                    menu.classList.remove('active');
                    document.removeEventListener('click', this.closeQuickDateMenu);
                }
            });
        }
    },

    /**
     * Définit la date rapide
     */
    setQuickDate(dateType, customDate = null) {
        let dueDate = null;
        const now = new Date();
        
        switch (dateType) {
            case 'today':
                dueDate = new Date();
                break;
                
            case 'tomorrow':
                dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 1);
                break;
                
            case 'next-week':
                dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7);
                break;
                
            case 'custom':
                dueDate = new Date(customDate);
                break;
        }
        
        // Stocke la date pour la prochaine tâche
        if (dueDate) {
            this.state.nextTaskDueDate = dueDate.toISOString().split('T')[0];
            
            // Change l'icône du bouton pour indiquer qu'une date est définie
            const button = document.getElementById('quickDate');
            if (button) {
                button.classList.add('date-active');
                button.querySelector('i').style.color = '#4c6ef5';
            }
        }
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
            priority: this.state.nextTaskPriority || 'medium',
            createdAt: new Date().toISOString(),
            list: this.state.activeListId,
            notes: '',
            subtasks: [],
            tags: [],
            reminder: null,
            dueDate: this.state.nextTaskDueDate || null
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
        
        // Réinitialiser les paramètres rapides
        this.state.nextTaskPriority = null;
        this.state.nextTaskDueDate = null;
        
        // Réinitialiser les boutons d'action rapide
        const priorityBtn = document.getElementById('quickPriority');
        if (priorityBtn) {
            priorityBtn.className = 'btn-icon';
            priorityBtn.querySelector('i').style = '';
        }
        
        const dateBtn = document.getElementById('quickDate');
        if (dateBtn) {
            dateBtn.className = 'btn-icon';
            dateBtn.querySelector('i').style = '';
        }
        
        this.updateTaskList();
        this.updateSummary();
        this.updateListView();
        this.saveState();
        
        Utils.showNotification('Tâche ajoutée avec succès', 'success');

        // Déclencher la synchronisation après l'ajout d'une tâche si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Tâche ajoutée localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
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
                <div class="todo-content">
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
        
        // Cliquer sur l'élément de tâche pour voir les détails
        document.querySelectorAll('.todo-content').forEach(content => {
            content.addEventListener('click', (e) => {
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
        if (!todoDetails) {
            console.warn('Élément todoDetails non trouvé.');
            return;
        }
        
        // Trouver la tâche
        let task = this.findTask(taskId);
        if (!task) return;
        
        // Stocker l'ID de la tâche active
        this.state.activeTaskId = taskId;
        
        // Remplir les champs
        const detailsTitle = document.getElementById('detailsTitle');
        if (detailsTitle) detailsTitle.value = task.title;
        
        // Mettre à jour la sélection de priorité
        const priorityBtns = document.querySelectorAll('.priority-btn');
        if (priorityBtns) {
            priorityBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.priority === task.priority);
            });
        }
        const detailsPriority = document.getElementById('detailsPriority');
        if (detailsPriority) detailsPriority.value = task.priority;
        
        // Dates
        const detailsDueDate = document.getElementById('detailsDueDate');
        if (detailsDueDate) detailsDueDate.value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        const createdDate = document.getElementById('createdDate');
        if (createdDate) createdDate.textContent = new Date(task.createdAt).toLocaleDateString();
        
        // Notes
        const detailsNotes = document.getElementById('detailsNotes');
        if (detailsNotes) detailsNotes.value = task.notes || '';
        
        // Gérer le rappel
        const reminderCheckbox = document.getElementById('detailsReminder');
        const reminderOptions = document.getElementById('reminderOptions');
        const reminderDateTime = document.getElementById('reminderDateTime');
        
        if (reminderCheckbox) reminderCheckbox.checked = !!task.reminder;
        if (reminderOptions) reminderOptions.style.display = task.reminder ? 'block' : 'none';
        if (reminderDateTime) reminderDateTime.value = task.reminder || '';
        
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
        if (!subtasksList) {
            console.warn('Élément subtasksList non trouvé.');
            return;
        }
        
        if (subtasks.length === 0) {
            subtasksList.innerHTML = '<div class="empty-hint">Aucune sous-tâche</div>';
        } else {
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
        }
        
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

        // Déclencher la synchronisation après l'ajout d'une sous-tâche si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Sous-tâche ajoutée localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
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
            
            // Suggérer de marquer la tâche principale comme terminée
            if (allCompleted && !task.completed && task.subtasks.length > 0) {
                if (confirm('Toutes les sous-tâches sont terminées. Marquer la tâche principale comme terminée ?')) {
                    this.toggleTaskCompletion(task.id, true);
                }
            }
            
            this.updateTaskList();
            this.saveState();
        }

        // Déclencher la synchronisation après le changement d'état de complétion de la sous-tâche si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("État de complétion de sous-tâche modifié localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
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

        // Déclencher la synchronisation après la suppression d'une sous-tâche si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Sous-tâche supprimée localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
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

        // Déclencher la synchronisation après la sauvegarde des détails si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Détails de tâche sauvegardés localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
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

        // Déclencher la synchronisation après le changement d'état de complétion si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("État de complétion de tâche modifié localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
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

        // Déclencher la synchronisation après la suppression d'une tâche si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Tâche supprimée localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
        
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

        // Déclencher la synchronisation après la suppression des tâches terminées si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Tâches terminées supprimées localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
        
        Utils.showNotification('Tâches terminées supprimées', 'success');
    },

    /**
     * Affiche le modal pour créer une nouvelle liste
     */
    showNewListModal() {
        const modal = document.getElementById('listModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('listTitle').value = '';
            document.getElementById('listIcon').value = 'list';
            document.getElementById('listTitle').focus();
        }
    },

    /**
     * Cache le modal de nouvelle liste
     */
    hideNewListModal() {
        const modal = document.getElementById('listModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Ajoute une nouvelle liste
     */
    addNewList() {
        const nameInput = document.getElementById('listTitle');
        const iconInput = document.getElementById('listIcon');
        const colorInput = document.getElementById('listColor');
        
        const name = nameInput.value.trim();
        const icon = iconInput.value;
        const color = colorInput.value;
        
        if (!name) return;
        
        const listId = 'custom-' + Utils.generateId();
        const newList = {
            id: listId,
            name,
            icon,
            color,
            tasks: []
        };
        
        this.state.customLists[listId] = newList;
        
        this.hideNewListModal();
        this.updateListView();
        this.changeActiveList(listId);
        this.saveState();

        // Déclencher la synchronisation après l'ajout d'une liste si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Nouvelle liste ajoutée localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
        
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
        this.updateListView();
        this.updateTaskList(); // Mettre à jour l'affichage des tâches au cas où la liste active est supprimée
        this.updateSummary();

        // Déclencher la synchronisation après la suppression d'une liste si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Liste supprimée localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
        
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
        if (!tagsList) {
            console.warn('Élément tagsList non trouvé.');
            return;
        }
        
        tagsList.innerHTML = '';
        
        if (tags.length > 0) {
            tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.classList.add('tag');
                tagElement.textContent = tag;
                tagsList.appendChild(tagElement);
            });
        }
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

        // Déclencher la synchronisation après l'ajout d'un tag si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Tag ajouté localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
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

        // Déclencher la synchronisation après la suppression d'un tag si l'utilisateur est connecté
        if (isAuthenticated()) {
            console.log("Tag supprimé localement. Déclenchement de la synchronisation...");
            dataSyncManager.syncLocalWithDatabase();
        }
    },

    /**
     * Affiche le panneau de recherche
     */
    showSearchPanel() {
        const searchPanel = document.getElementById('searchPanel');
        if (searchPanel) {
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
     * Réinitialise la recherche avancée
     */
    resetSearch() {
        // Réinitialiser les champs
        document.getElementById('searchQuery').value = '';
        document.getElementById('searchTag').value = '';
        document.getElementById('searchStartDate').value = '';
        document.getElementById('searchEndDate').value = '';
        
        // Réinitialiser les cases à cocher
        const checkboxes = [
            'searchActive', 
            'searchCompleted', 
            'searchLow', 
            'searchMedium', 
            'searchHigh'
        ];
        
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.checked = true;
        });
        
        // Vider les résultats
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
    },

    /**
     * Effectue une recherche avancée
     */
    performAdvancedSearch() {
        const query = document.getElementById('searchQuery').value.trim().toLowerCase();
        let results = [];
        
        // Récupérer les priorités sélectionnées
        const selectedPriorities = [];
        if (document.getElementById('searchLow').checked) selectedPriorities.push('low');
        if (document.getElementById('searchMedium').checked) selectedPriorities.push('medium');
        if (document.getElementById('searchHigh').checked) selectedPriorities.push('high');
        
        // Récupérer les statuts sélectionnés
        const includeCompleted = document.getElementById('searchCompleted').checked;
        const includeActive = document.getElementById('searchActive').checked;
        
        // Dates
        const dateFrom = document.getElementById('searchStartDate').value;
        const dateTo = document.getElementById('searchEndDate').value;
        
        // Tag
        const searchTag = document.getElementById('searchTag').value.trim().toLowerCase();
        
        // Collecter les tâches de toutes les listes
        const allLists = {...this.state.lists, ...this.state.customLists};
        
        Object.values(allLists).forEach(list => {
            list.tasks.forEach(task => {
                // Filtrer par statut
                if ((!includeCompleted && task.completed) || (!includeActive && !task.completed)) {
                    return;
                }
                
                // Filtrer par priorité
                if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
                    return;
                }
                
                // Filtrer par texte
                if (query && 
                    !task.title.toLowerCase().includes(query) && 
                    !(task.notes && task.notes.toLowerCase().includes(query))) {
                    return;
                }
                
                // Filtrer par tag
                if (searchTag && 
                    (!task.tags || !task.tags.some(tag => tag.toLowerCase().includes(searchTag)))) {
                    return;
                }
                
                // Filtrer par date
                if (dateFrom || dateTo) {
                    if (!task.dueDate) return;
                    
                    const dueDate = new Date(task.dueDate);
                    
                    if (dateFrom) {
                        const fromDate = new Date(dateFrom);
                        if (dueDate < fromDate) return;
                    }
                    
                    if (dateTo) {
                        const toDate = new Date(dateTo);
                        toDate.setHours(23, 59, 59);
                        if (dueDate > toDate) return;
                    }
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
                         data-task-id="${task.id}">
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
        
        // Ajouter les écouteurs d'événements pour les résultats
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const taskId = item.dataset.taskId;
                this.hideSearchPanel();
                this.showTaskDetails(taskId);
            });
        });
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
    if (todoTool) {
        TodoManager.init();
    }
}); 