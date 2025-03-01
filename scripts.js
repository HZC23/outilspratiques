// Polyfills et utilitaires
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Lazy loading des images
document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
});

// Gestion du thème
function toggleTheme() {
    const checkbox = document.querySelector('.theme-switch__checkbox');
    if (!checkbox) return;
    
    const isDark = checkbox.checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialisation du thème
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const checkbox = document.querySelector('.theme-switch__checkbox');
    if (checkbox) {
        checkbox.checked = savedTheme === 'dark';
    }
}

// Appeler initTheme immédiatement
initTheme();

// Gestion de l'horloge
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR');
    const dateString = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    document.getElementById('topTime').textContent = timeString;
    document.getElementById('topDate').textContent = dateString;
}

// Mise à jour de l'horloge toutes les secondes
setInterval(updateClock, 1000);
updateClock();

// Gestion du menu
function toggleSubmenu(menuId) {
    const submenu = document.getElementById(menuId);
    const trigger = submenu.previousElementSibling;
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    
    // Fermer les autres sous-menus
    document.querySelectorAll('.submenu.active').forEach(menu => {
        if (menu.id !== menuId) {
            menu.classList.remove('active');
            menu.previousElementSibling.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Basculer le sous-menu actuel
    submenu.classList.toggle('active');
    trigger.setAttribute('aria-expanded', !isExpanded);
}

// Gestion des outils
function showTool(toolId) {
    // Masquer tous les outils
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher l'outil sélectionné
    const tool = document.getElementById(toolId);
    if (tool) {
        tool.classList.add('active');
        // Mettre à jour l'URL sans recharger la page
        history.pushState({tool: toolId}, '', `#${toolId}`);
    }
    
    // Mettre à jour l'état actif des boutons du menu
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(toolId)) {
            item.classList.add('active');
        }
    });
}

// Gestion de la navigation par URL
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.tool) {
        showTool(event.state.tool);
    }
});

// Gestion des raccourcis clavier
document.addEventListener('keydown', (event) => {
    // Échap pour fermer les sous-menus
    if (event.key === 'Escape') {
        document.querySelectorAll('.submenu.active').forEach(submenu => {
            submenu.classList.remove('active');
            submenu.previousElementSibling.setAttribute('aria-expanded', 'false');
        });
    }
    
    // Alt + chiffre pour accéder rapidement aux outils
    if (event.altKey && !isNaN(event.key)) {
        const tools = document.querySelectorAll('.section');
        const index = parseInt(event.key) - 1;
        if (tools[index]) {
            event.preventDefault();
            showTool(tools[index].id);
        }
    }
});

// Gestion des notifications
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Gestion du cache
const cache = {
    set: (key, value, ttl = 3600) => {
        const item = {
            value,
            expiry: Date.now() + (ttl * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const data = JSON.parse(item);
        if (Date.now() > data.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return data.value;
    },
    
    clear: () => {
        localStorage.clear();
    }
};

// Gestion des erreurs
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
    showNotification('Une erreur est survenue. Veuillez réessayer.', 'error');
    return false;
};

// Variables globales
let autoSaveTimeout;
let lastSavedContent = '';
let scheduledTasks = [];
let availability = {};
let currentDate = new Date();

// Variables et fonctions du traducteur
let translationHistory = [];
const LIBRETRANSLATE_API_URL = 'https://libretranslate.de/';

// Fonctions d'initialisation
function initializeLanguageSelectors() {
    const sourceLang = document.getElementById('sourceLanguage');
    const targetLang = document.getElementById('targetLanguage');
    
    if (!sourceLang || !targetLang) return;

    // Liste des langues supportées
    const languages = [
        { code: 'auto', name: 'Détecter la langue' },
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'Anglais' },
        { code: 'es', name: 'Espagnol' },
        { code: 'de', name: 'Allemand' },
        { code: 'it', name: 'Italien' },
        { code: 'pt', name: 'Portugais' },
        { code: 'nl', name: 'Néerlandais' },
        { code: 'pl', name: 'Polonais' },
        { code: 'ru', name: 'Russe' },
        { code: 'ar', name: 'Arabe' },
        { code: 'ja', name: 'Japonais' },
        { code: 'ko', name: 'Coréen' },
        { code: 'zh', name: 'Chinois' }
    ];

    // Remplir les sélecteurs de langue
    languages.forEach(lang => {
        const sourceOption = new Option(lang.name, lang.code);
        const targetOption = new Option(lang.name, lang.code);
        
        if (lang.code !== 'auto') {
            targetLang.add(targetOption);
        }
        sourceLang.add(sourceOption);
    });

    // Définir les langues par défaut
    sourceLang.value = 'auto';
    targetLang.value = 'fr';
}

function initScheduler() {
    if (!document.getElementById('scheduleGrid')) return;

    loadTasks();
    loadAvailability();
    updateScheduleView();
    setInterval(checkDeadlines, 60000); // Vérifier les échéances chaque minute
}

// Fonctions du planificateur
function getTasksForTimeSlot(date, hour) {
    if (!scheduledTasks) return [];
    
    return scheduledTasks.filter(task => {
        if (!task.scheduledTime) return false;
        
        const taskDate = new Date(task.scheduledTime.date);
        const taskHour = parseInt(task.scheduledTime.startTime.split(':')[0]);
        
        return taskDate.toDateString() === date.toDateString() && taskHour === hour;
    });
}

function updateScheduleView() {
    const grid = document.getElementById('scheduleGrid');
    if (!grid) return;

    grid.innerHTML = '';
    
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    for (let hour = 0; hour < 24; hour++) {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const filteredTasks = scheduledTasks.filter(task => {
            if (!task.scheduledTime) return false;
            const taskDate = new Date(task.scheduledTime.date);
            return taskDate.getDate() === dayStart.getDate() &&
                   taskDate.getMonth() === dayStart.getMonth() &&
                   taskDate.getFullYear() === dayStart.getFullYear() &&
                   taskDate.getHours() === hour;
        });
        
        slot.innerHTML = `
            <div class="time-label">${time}</div>
            <div class="slot-tasks">
                ${filteredTasks.map(task => `
                    <div class="scheduled-task priority-${task.priority}">
                        ${task.title}
                        <span class="task-duration">
                            (${task.duration.hours}h${task.duration.minutes}min)
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
        
        grid.appendChild(slot);
    }
    
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = currentDate.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
    }
}

function loadTasks() {
    const savedTasks = localStorage.getItem('scheduledTasks');
    if (savedTasks) {
        scheduledTasks = JSON.parse(savedTasks);
    }
}

function loadAvailability() {
    const savedAvailability = localStorage.getItem('availability');
    if (savedAvailability) {
        availability = JSON.parse(savedAvailability);
    } else {
        // Disponibilités par défaut (9h-18h en semaine)
        const defaultAvailability = {
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
            wednesday: { start: '09:00', end: '18:00' },
            thursday: { start: '09:00', end: '18:00' },
            friday: { start: '09:00', end: '18:00' }
        };
        availability = defaultAvailability;
        localStorage.setItem('availability', JSON.stringify(availability));
    }
}

function checkDeadlines() {
    const now = new Date();
    scheduledTasks.forEach(task => {
        if (!task.notified && task.deadline) {
            const deadline = new Date(task.deadline);
            const timeUntilDeadline = deadline - now;
            
            // Notification 1 heure avant
            if (timeUntilDeadline > 0 && timeUntilDeadline <= 3600000) {
                showNotification(`Rappel : "${task.title}" doit être terminé dans ${Math.ceil(timeUntilDeadline / 60000)} minutes`, 'warning');
                task.notified = true;
            }
        }
    });
    saveTasks();
}

function saveTasks() {
    localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
}

function getAvailableSlots(date) {
    const dayName = date.toLocaleLowerCase('fr-FR', { weekday: 'long' });
    const dayAvailability = availability[dayName];
    
    if (!dayAvailability) return [];
    
    const slots = [];
    const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);
    
    // Convertir en minutes depuis minuit
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    // Trouver les créneaux occupés
    const occupiedSlots = scheduledTasks
        .filter(task => {
            if (!task.scheduledTime) return false;
            const taskDate = new Date(task.scheduledTime.date);
            return taskDate.toDateString() === date.toDateString();
        })
        .map(task => {
            const [hour, minute] = task.scheduledTime.startTime.split(':').map(Number);
            const duration = task.duration.hours * 60 + task.duration.minutes;
            return {
                start: hour * 60 + minute,
                end: hour * 60 + minute + duration
            };
        })
        .sort((a, b) => a.start - b.start);
    
    // Trouver les créneaux libres
    let currentTime = startTime;
    occupiedSlots.forEach(slot => {
        if (slot.start > currentTime) {
            slots.push({
                start: currentTime,
                end: slot.start,
                duration: slot.start - currentTime
            });
        }
        currentTime = slot.end;
    });
    
    // Ajouter le dernier créneau si nécessaire
    if (currentTime < endTime) {
        slots.push({
            start: currentTime,
            end: endTime,
            duration: endTime - currentTime
        });
    }
    
    return slots;
}

// Fonctions du bloc-notes
function execCommand(command, value = null) {
    document.execCommand(command, false, value);
    updateWordCount();
    autoSave();
}

function updateWordCount() {
    const text = document.getElementById('editor').innerText;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split(/\r\n|\r|\n/).length;
    const paragraphs = text.split(/\r\n\r\n|\r\r|\n\n/).filter(p => p.trim()).length;
    
    document.getElementById('wordCount').textContent = words;
    document.getElementById('charCount').textContent = chars;
    document.getElementById('lineCount').textContent = lines;
    document.getElementById('paragraphCount').textContent = paragraphs;
}

function autoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        saveNotes(true);
    }, 3000);
}

function saveNotes(isAutoSave = false) {
    const content = document.getElementById('editor').innerHTML;
    if (content === lastSavedContent) return;
    
    localStorage.setItem('notes', content);
    lastSavedContent = content;
    
    if (!isAutoSave) {
        showNoteStatus('Notes sauvegardées !', 'success');
    }
}

function loadNotes() {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        document.getElementById('editor').innerHTML = savedNotes;
        lastSavedContent = savedNotes;
        updateWordCount();
    }
}

function clearNotes() {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les notes ?')) {
        document.getElementById('editor').innerHTML = '';
        localStorage.removeItem('notes');
        lastSavedContent = '';
        updateWordCount();
        showNoteStatus('Notes effacées !', 'info');
    }
}

function downloadNotes() {
    const content = document.getElementById('editor').innerText;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `notes-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNoteStatus('Notes téléchargées !', 'success');
}

function showNoteStatus(message, type = 'success') {
    const status = document.createElement('div');
    status.className = `note-status ${type}`;
    status.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(status);
    
    setTimeout(() => {
        status.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        status.classList.remove('show');
        setTimeout(() => status.remove(), 300);
    }, 3000);
}

function loadTranslationHistory() {
    const savedHistory = localStorage.getItem('translationHistory');
    if (savedHistory) {
        try {
            translationHistory = JSON.parse(savedHistory);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique des traductions:', error);
            translationHistory = [];
        }
    }
}

function saveTranslationHistory() {
    try {
        localStorage.setItem('translationHistory', JSON.stringify(translationHistory));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'historique des traductions:', error);
    }
}

function addToTranslationHistory(translation) {
    translationHistory.unshift(translation);
    if (translationHistory.length > 10) {
        translationHistory.pop();
    }
    saveTranslationHistory();
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charger l'outil depuis l'URL si présent
    const hash = window.location.hash.substring(1);
    if (hash) {
        showTool(hash);
    } else {
        showTool('calculatorTool');
    }
    
    // Initialiser les tooltips
    document.querySelectorAll('[title]').forEach(element => {
        const tooltip = element.getAttribute('title');
        element.setAttribute('data-tooltip', tooltip);
        element.removeAttribute('title');
    });
    
    // Initialiser le planificateur
    initScheduler();
    
    // Initialiser le traducteur
    initializeLanguageSelectors();
    
    // Initialiser le bloc-notes
    loadNotes();
    
    // Initialiser l'historique des traductions
    loadTranslationHistory();
    
    // Mettre à jour le compteur de mots lors de la saisie
    const editor = document.getElementById('editor');
    if (editor) {
        editor.addEventListener('input', () => {
            updateWordCount();
            autoSave();
        });
    }
    
    // Support des raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    saveNotes();
                    break;
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    execCommand('underline');
                    break;
            }
        }
    });
}); 