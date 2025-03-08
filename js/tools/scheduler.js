import { CONFIG } from '../config.js';
import { Utils } from '../utils.js';

export const SchedulerManager = {
    /**
     * Initialise le gestionnaire de planification
     */
    init() {
        this.setupListeners();
        this.loadTasks();
        this.loadAvailability();
        this.updateScheduleView();
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Gestion du formulaire d'ajout de tâche
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.addScheduledTask());
        }

        // Gestion des modes de planification
        const autoModeBtn = document.getElementById('autoModeBtn');
        const manualModeBtn = document.getElementById('manualModeBtn');
        if (autoModeBtn && manualModeBtn) {
            autoModeBtn.addEventListener('click', () => this.togglePlanningMode('auto'));
            manualModeBtn.addEventListener('click', () => this.togglePlanningMode('manual'));
        }

        // Gestion de la navigation des jours
        const prevDayBtn = document.getElementById('prevDayBtn');
        const nextDayBtn = document.getElementById('nextDayBtn');
        if (prevDayBtn && nextDayBtn) {
            prevDayBtn.addEventListener('click', () => this.previousDay());
            nextDayBtn.addEventListener('click', () => this.nextDay());
        }

        // Gestion des disponibilités
        const saveAvailabilityBtn = document.getElementById('saveAvailabilityBtn');
        if (saveAvailabilityBtn) {
            saveAvailabilityBtn.addEventListener('click', () => this.saveAvailability());
        }

        // Écouteurs pour les jours de la semaine
        const mondayCheckbox = document.getElementById('monday-checkbox');
        if (mondayCheckbox) {
            mondayCheckbox.addEventListener('change', () => this.updateAvailability('monday'));
        }

        // Exposer les méthodes globalement
        window.addScheduledTask = () => this.addScheduledTask();
        window.togglePlanningMode = (mode) => this.togglePlanningMode(mode);
        window.saveAvailability = () => this.saveAvailability();
        window.updateAvailability = (day) => this.updateAvailability(day);
        window.previousDay = () => this.previousDay();
        window.nextDay = () => this.nextDay();
    },

    /**
     * Charge les tâches sauvegardées
     */
    loadTasks() {
        this.tasks = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.SCHEDULED_TASKS) || [];
        this.displayPendingTasks();
    },

    /**
     * Charge les disponibilités sauvegardées
     */
    loadAvailability() {
        this.availability = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.AVAILABILITY) || this.getDefaultAvailability();
        this.updateAvailabilityDisplay();
    },

    /**
     * Obtient les disponibilités par défaut
     */
    getDefaultAvailability() {
        return {
            monday: { enabled: true, start: '09:00', end: '18:00' },
            tuesday: { enabled: true, start: '09:00', end: '18:00' },
            wednesday: { enabled: true, start: '09:00', end: '18:00' },
            thursday: { enabled: true, start: '09:00', end: '18:00' },
            friday: { enabled: true, start: '09:00', end: '18:00' },
            saturday: { enabled: false, start: '09:00', end: '18:00' },
            sunday: { enabled: false, start: '09:00', end: '18:00' }
        };
    },

    /**
     * Met à jour l'affichage des disponibilités
     */
    updateAvailabilityDisplay() {
        Object.keys(this.availability).forEach(day => {
            const dayData = this.availability[day];
            const dayCheckbox = document.getElementById(`${day}-checkbox`);
            
            if (dayCheckbox) {
                dayCheckbox.checked = dayData.enabled;
                
                const dayContainer = dayCheckbox.closest('.availability-day');
                if (dayContainer) {
                    const startInput = dayContainer.querySelector('.time-start');
                    const endInput = dayContainer.querySelector('.time-end');
                    
                    if (startInput && endInput) {
                        startInput.value = dayData.start;
                        endInput.value = dayData.end;
                    }
                }
            }
        });
    },

    /**
     * Ajoute une nouvelle tâche planifiée
     */
    addScheduledTask() {
        const task = this.getTaskFromForm();
        if (!task) return;

        this.tasks.push(task);
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.SCHEDULED_TASKS, this.tasks);
        
        this.updateScheduleView();
        this.displayPendingTasks();
        this.clearTaskForm();
        
        Utils.showNotification('Tâche ajoutée avec succès', 'success');
    },

    /**
     * Récupère les données du formulaire de tâche
     */
    getTaskFromForm() {
        const title = document.getElementById('taskTitle').value;
        const category = document.getElementById('taskCategory').value;
        const durationHours = parseInt(document.getElementById('taskDurationHours').value) || 0;
        const durationMinutes = parseInt(document.getElementById('taskDurationMinutes').value) || 0;
        const deadline = document.getElementById('taskDeadline').value;
        const priority = document.getElementById('taskPriority').value;
        const recurrence = document.getElementById('taskRecurrence').value;

        if (!title || !deadline) {
            Utils.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return null;
        }

        return {
            id: Date.now().toString(),
            title,
            category,
            duration: durationHours * 60 + durationMinutes,
            deadline: new Date(deadline).toISOString(),
            priority,
            recurrence,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
    },

    /**
     * Vide le formulaire de tâche
     */
    clearTaskForm() {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskCategory').value = 'work';
        document.getElementById('taskDurationHours').value = '';
        document.getElementById('taskDurationMinutes').value = '';
        document.getElementById('taskDeadline').value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskRecurrence').value = 'none';
    },

    /**
     * Met à jour la vue du planning
     */
    updateScheduleView() {
        const scheduleGrid = document.getElementById('scheduleGrid');
        if (!scheduleGrid) return;

        const currentDate = new Date();
        const tasksForDay = this.getTasksForDay(currentDate);

        scheduleGrid.innerHTML = this.generateTimeSlots(tasksForDay);
    },

    /**
     * Génère les créneaux horaires
     */
    generateTimeSlots(tasks) {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            const tasksInSlot = tasks.filter(task => {
                const taskStart = new Date(task.deadline);
                return taskStart.getHours() === hour;
            });

            slots.push(`
                <div class="time-slot">
                    <div class="time-label">${hour.toString().padStart(2, '0')}:00</div>
                    <div class="slot-tasks">
                        ${tasksInSlot.map(task => `
                            <div class="scheduled-task priority-${task.priority}">
                                <div class="task-title">${task.title}</div>
                                <div class="task-duration">${Math.floor(task.duration / 60)}h${task.duration % 60}m</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `);
        }

        return slots.join('');
    },

    /**
     * Obtient les tâches pour un jour donné
     */
    getTasksForDay(date) {
        return this.tasks.filter(task => {
            const taskDate = new Date(task.deadline);
            return taskDate.toDateString() === date.toDateString();
        });
    },

    /**
     * Affiche les tâches en attente
     */
    displayPendingTasks() {
        const pendingTasksList = document.getElementById('pendingTasksList');
        if (!pendingTasksList) return;

        const pendingTasks = this.tasks.filter(task => task.status === 'pending');
        
        pendingTasksList.innerHTML = pendingTasks.map(task => `
            <div class="pending-task priority-${task.priority}">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-details">
                        <span class="task-category">${task.category}</span>
                        <span class="task-deadline">${new Date(task.deadline).toLocaleString()}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button onclick="SchedulerManager.completeTask('${task.id}')" title="Marquer comme terminé">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="SchedulerManager.deleteTask('${task.id}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Marque une tâche comme terminée
     */
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'completed';
            Utils.saveToStorage(CONFIG.STORAGE_KEYS.SCHEDULED_TASKS, this.tasks);
            this.displayPendingTasks();
            Utils.showNotification('Tâche marquée comme terminée', 'success');
        }
    },

    /**
     * Supprime une tâche
     */
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.SCHEDULED_TASKS, this.tasks);
        this.updateScheduleView();
        this.displayPendingTasks();
        Utils.showNotification('Tâche supprimée', 'success');
    },

    /**
     * Sauvegarde les disponibilités
     */
    saveAvailability() {
        const availability = {};
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
            const dayCheckbox = document.getElementById(`${day}-checkbox`);
            if (dayCheckbox) {
                const dayContainer = dayCheckbox.closest('.availability-day');
                if (dayContainer) {
                    const startInput = dayContainer.querySelector('.time-start');
                    const endInput = dayContainer.querySelector('.time-end');
                    
                    availability[day] = {
                        enabled: dayCheckbox.checked,
                        start: startInput ? startInput.value : '09:00',
                        end: endInput ? endInput.value : '18:00'
                    };
                }
            }
        });
        
        this.availability = availability;
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.AVAILABILITY, this.availability);
        Utils.showNotification('Disponibilités enregistrées', 'success');
    },

    /**
     * Met à jour une disponibilité spécifique
     */
    updateAvailability(day) {
        const dayCheckbox = document.getElementById(`${day}-checkbox`);
        if (dayCheckbox && this.availability[day]) {
            this.availability[day].enabled = dayCheckbox.checked;
            Utils.saveToStorage(CONFIG.STORAGE_KEYS.AVAILABILITY, this.availability);
        }
    },

    /**
     * Change le mode de planification
     */
    togglePlanningMode(mode) {
        const autoModeBtn = document.getElementById('autoModeBtn');
        const manualModeBtn = document.getElementById('manualModeBtn');

        if (autoModeBtn && manualModeBtn) {
            autoModeBtn.classList.toggle('active', mode === 'auto');
            manualModeBtn.classList.toggle('active', mode === 'manual');
        }
    },

    /**
     * Passe au jour précédent
     */
    previousDay() {
        const currentDate = document.getElementById('currentDate');
        if (currentDate) {
            const date = new Date(currentDate.textContent);
            date.setDate(date.getDate() - 1);
            currentDate.textContent = date.toLocaleDateString();
            this.updateScheduleView();
        }
    },

    /**
     * Passe au jour suivant
     */
    nextDay() {
        const currentDate = document.getElementById('currentDate');
        if (currentDate) {
            const date = new Date(currentDate.textContent);
            date.setDate(date.getDate() + 1);
            currentDate.textContent = date.toLocaleDateString();
            this.updateScheduleView();
        }
    }
}; 