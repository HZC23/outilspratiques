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

// Optimisation des performances
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Gestion du thème améliorée
function toggleTheme() {
    const checkbox = document.querySelector('.theme-switch__checkbox');
    const isDark = checkbox.checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}


// Initialisation du thème
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const checkbox = document.getElementById('theme-toggle');
    if (checkbox) {
        checkbox.checked = savedTheme === 'dark';
    }
}

// Ajouter l'écouteur d'événements pour le thème switch
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }
    initTheme();
});

// Gestion de l'horloge améliorée
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR');
    const dateString = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const timeElement = document.getElementById('topTime');
    const dateElement = document.getElementById('topDate');
    
    if (timeElement && timeElement.textContent !== timeString) {
        timeElement.textContent = timeString;
    }
    if (dateElement && dateElement.textContent !== dateString) {
        dateElement.textContent = dateString;
    }
}

// Mise à jour de l'horloge toutes les secondes
setInterval(updateClock, 1000);
updateClock();

// Gestion du menu
function toggleSubmenu(menuId) {
    const submenu = document.getElementById(menuId);
    const trigger = submenu.previousElementSibling;
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    
    // Animation de fermeture des autres sous-menus
    document.querySelectorAll('.submenu.active').forEach(menu => {
        if (menu.id !== menuId) {
            menu.style.height = '0';
            menu.classList.remove('active');
            menu.previousElementSibling.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Animation d'ouverture/fermeture du sous-menu actuel
    if (!isExpanded) {
        submenu.classList.add('active');
        submenu.style.height = submenu.scrollHeight + 'px';
    } else {
        submenu.style.height = '0';
        setTimeout(() => submenu.classList.remove('active'), 300);
    }
    
    trigger.setAttribute('aria-expanded', !isExpanded);
}

// Gestion des outils
function showTool(toolId) {
    // Animation de sortie pour l'outil actuel
    const currentTool = document.querySelector('.section.active');
    if (currentTool) {
        currentTool.style.opacity = '0';
        currentTool.style.transform = 'translateY(20px)';
    }
    
    // Masquer tous les outils après l'animation
    setTimeout(() => {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Afficher le nouvel outil avec animation
        const tool = document.getElementById(toolId);
        if (tool) {
            tool.classList.add('active');
            requestAnimationFrame(() => {
                tool.style.opacity = '1';
                tool.style.transform = 'translateY(0)';
            });
            
            // Mettre à jour l'URL et l'historique
            history.pushState({tool: toolId}, '', `#${toolId}`);
            
            // Mettre à jour le menu
            updateMenuState(toolId);
        }
    }, 300);
}

function updateMenuState(toolId) {
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(toolId)) {
            item.classList.add('active');
            // Ouvrir le sous-menu parent si nécessaire
            const parentSubmenu = item.closest('.submenu');
            if (parentSubmenu) {
                parentSubmenu.classList.add('active');
                parentSubmenu.previousElementSibling.setAttribute('aria-expanded', 'true');
            }
        }
    });
}

// Gestion de la navigation par URL
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.tool) {
        showTool(event.state.tool);
    }
});

// Support du pavé numérique
document.addEventListener('keydown', (event) => {
    if (!document.getElementById('calculatorTool').classList.contains('active')) return;
    
    // Ignorer les touches de fonction (F1-F12)
    if (event.key.startsWith('F')) return;
    
    if (event.key.match(/[0-9.]/)) {
        event.preventDefault();
        addToCalc(event.key);
    } else if (event.key.match(/[+\-*\/]/)) {
        event.preventDefault();
        addToCalc(event.key);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        calculate();
    } else if (event.key === 'Backspace') {
        event.preventDefault();
        backspace();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        clearCalc();
    }
});

// Amélioration des notifications
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    });
    
    // Auto-suppression
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
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

// Fonction pour la traduction automatique avec délai
let translationTimeout;

function autoTranslate() {
    clearTimeout(translationTimeout);
    updateCharCount();
    
    const sourceText = document.getElementById('sourceText').value.trim();
    if (!sourceText) {
        document.getElementById('translatedText').value = '';
        return;
    }
    
    translationTimeout = setTimeout(() => {
        translate(sourceText);
    }, 500);
}

function swapLanguages() {
    const sourceSelect = document.getElementById('sourceLanguage');
    const targetSelect = document.getElementById('targetLanguage');
    const temp = sourceSelect.value;
    
    sourceSelect.value = targetSelect.value;
    targetSelect.value = temp;
    
    autoTranslate();
}

function updateCharCount() {
    const sourceText = document.getElementById('sourceText').value;
    const translatedText = document.getElementById('translatedText').value;
    
    document.getElementById('sourceCharCount').textContent = 
        `${sourceText.length} caractères`;
    document.getElementById('translatedCharCount').textContent = 
        `${translatedText.length} caractères`;
}

function clearSourceText() {
    document.getElementById('sourceText').value = '';
    document.getElementById('translatedText').value = '';
    updateCharCount();
}

function copySourceText() {
    const sourceText = document.getElementById('sourceText');
    sourceText.select();
    document.execCommand('copy');
    showNotification('Texte source copié !');
}

function copyTranslation() {
    const translatedText = document.getElementById('translatedText');
    translatedText.select();
    document.execCommand('copy');
    showNotification('Traduction copiée !');
}

function listenSourceText() {
    const text = document.getElementById('sourceText').value;
    const lang = document.getElementById('sourceLanguage').value;
    speak(text, lang);
}

function listenTranslation() {
    const text = document.getElementById('translatedText').value;
    const lang = document.getElementById('targetLanguage').value;
    speak(text, lang);
}

function speak(text, lang) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        speechSynthesis.speak(utterance);
    } else {
        showNotification('La synthèse vocale n\'est pas supportée par votre navigateur');
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initializeLanguageSelectors();
});

// Mappings des caractères pour chaque style
const styleMap = {
    serif: {
        'A': '𝔸', 'B': '𝔹', 'C': 'ℂ', 'D': '𝔻', 'E': '𝔼', 'F': '𝔽', 'G': '𝔾', 'H': 'ℍ', 'I': '𝕀', 'J': '𝕁',
        'K': '𝕂', 'L': '𝕃', 'M': '𝕄', 'N': 'ℕ', 'O': '𝕆', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ', 'S': '𝕊', 'T': '𝕋',
        'U': '𝕌', 'V': '𝕍', 'W': '𝕎', 'X': '𝕏', 'Y': '𝕐', 'Z': 'ℤ',
        'a': '𝕒', 'b': '𝕓', 'c': '𝕔', 'd': '𝕕', 'e': '𝕖', 'f': '𝕗', 'g': '𝕘', 'h': '𝕙', 'i': '𝕚', 'j': '𝕛',
        'k': '𝕜', 'l': '𝕝', 'm': '𝕞', 'n': '𝕟', 'o': '𝕠', 'p': '𝕡', 'q': '𝕢', 'r': '𝕣', 's': '𝕤', 't': '𝕥',
        'u': '𝕦', 'v': '𝕧', 'w': '𝕨', 'x': '𝕩', 'y': '𝕪', 'z': '𝕫'
    },
    script: {
        'A': '𝓐', 'B': '𝓑', 'C': '𝓒', 'D': '𝓓', 'E': '𝓔', 'F': '𝓕', 'G': '𝓖', 'H': '𝓗', 'I': '𝓘', 'J': '𝓙',
        'K': '𝓚', 'L': '𝓛', 'M': '𝓜', 'N': '𝓝', 'O': '𝓞', 'P': '𝓟', 'Q': '𝓠', 'R': '𝓡', 'S': '𝓢', 'T': '𝓣',
        'U': '𝓤', 'V': '𝓥', 'W': '𝓦', 'X': '𝓧', 'Y': '𝓨', 'Z': '𝓩',
        'a': '𝓪', 'b': '𝓫', 'c': '𝓬', 'd': '𝓭', 'e': '𝓮', 'f': '𝓯', 'g': '𝓰', 'h': '𝓱', 'i': '𝓲', 'j': '𝓳',
        'k': '𝓴', 'l': '𝓵', 'm': '𝓶', 'n': '𝓷', 'o': '𝓸', 'p': '𝓹', 'q': '𝓺', 'r': '𝓻', 's': '𝓼', 't': '𝓽',
        'u': '𝓾', 'v': '𝓿', 'w': '𝔀', 'x': '𝔁', 'y': '𝔂', 'z': '𝔃'
    },
    bold: {
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
        'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
        'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
        'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
        'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇'
    },
    italic: {
        'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑',
        'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛',
        'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡',
        'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫',
        'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵',
        'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻'
    },
    gothic: {
        'A': '𝔄', 'B': '𝔅', 'C': 'ℭ', 'D': '𝔇', 'E': '𝔈', 'F': '𝔉', 'G': '𝔊', 'H': 'ℌ', 'I': 'ℑ', 'J': '𝔍',
        'K': '𝔎', 'L': '𝔏', 'M': '𝔐', 'N': '𝔑', 'O': '𝔒', 'P': '𝔓', 'Q': '𝔔', 'R': 'ℜ', 'S': '𝔖', 'T': '𝔗',
        'U': '𝔘', 'V': '𝔙', 'W': '𝔚', 'X': '𝔛', 'Y': '𝔜', 'Z': 'ℨ',
        'a': '𝔞', 'b': '𝔟', 'c': '𝔠', 'd': '𝔡', 'e': '𝔢', 'f': '𝔣', 'g': '𝔤', 'h': '𝔥', 'i': '𝔦', 'j': '𝔧',
        'k': '𝔨', 'l': '𝔩', 'm': '𝔪', 'n': '𝔫', 'o': '𝔬', 'p': '𝔭', 'q': '𝔮', 'r': '𝔯', 's': '𝔰', 't': '𝔱',
        'u': '𝔲', 'v': '𝔳', 'w': '𝔴', 'x': '𝔵', 'y': '𝔶', 'z': '𝔷'
    },
    double: {
        'A': '𝔸', 'B': '𝔹', 'C': 'ℂ', 'D': '𝔻', 'E': '𝔼', 'F': '𝔽', 'G': '𝔾', 'H': 'ℍ', 'I': '𝕀', 'J': '𝕁',
        'K': '𝕂', 'L': '𝕃', 'M': '𝕄', 'N': 'ℕ', 'O': '𝕆', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ', 'S': '𝕊', 'T': '𝕋',
        'U': '𝕌', 'V': '𝕍', 'W': '𝕎', 'X': '𝕏', 'Y': '𝕐', 'Z': 'ℤ',
        'a': '𝕒', 'b': '𝕓', 'c': '𝕔', 'd': '𝕕', 'e': '𝕖', 'f': '𝕗', 'g': '𝕘', 'h': '𝕙', 'i': '𝕚', 'j': '𝕛',
        'k': '𝕜', 'l': '𝕝', 'm': '𝕞', 'n': '𝕟', 'o': '𝕠', 'p': '𝕡', 'q': '𝕢', 'r': '𝕣', 's': '𝕤', 't': '𝕥',
        'u': '𝕦', 'v': '𝕧', 'w': '𝕨', 'x': '𝕩', 'y': '𝕪', 'z': '𝕫'
    }
};

// Fonction pour appliquer le style sélectionné
function applyStyle(style) {
    const input = document.getElementById('styleInput').value;
    const output = document.getElementById('styleOutput');
    const buttons = document.querySelectorAll('.style-btn');
    
    // Mettre à jour l'état actif des boutons
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.style === style) {
            btn.classList.add('active');
        }
    });
    
    // Convertir le texte
    let result = '';
    for (let char of input) {
        result += styleMap[style][char] || char;
    }
    
    output.value = result;
}

// Fonction pour copier le texte converti
function copyStyleOutput() {
    const output = document.getElementById('styleOutput');
    const copyBtn = document.querySelector('.copy-btn');
    
    navigator.clipboard.writeText(output.value).then(() => {
        // Feedback visuel
        copyBtn.classList.add('copy-success');
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copié !';
        
        setTimeout(() => {
            copyBtn.classList.remove('copy-success');
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copier';
        }, 2000);
    }).catch(err => {
        console.error('Erreur lors de la copie :', err);
        alert('Impossible de copier le texte');
    });
}

// Écouteur d'événements pour la mise à jour en temps réel
document.getElementById('styleInput')?.addEventListener('input', () => {
    const activeStyle = document.querySelector('.style-btn.active')?.dataset.style;
    if (activeStyle) {
        applyStyle(activeStyle);
    }
});

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
        const filteredTasks = getTasksForTimeSlot(dayStart, hour);
        
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

// Fonctions pour l'outil de style d'écriture
const styleHistory = [];

// Fonction pour changer de catégorie
function switchStyleCategory(category) {
    // Mettre à jour les onglets actifs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });

    // Afficher les options de la catégorie sélectionnée
    document.querySelectorAll('.style-options').forEach(options => {
        options.classList.toggle('active', options.dataset.category === category);
    });
}

// Fonction pour effacer le texte d'entrée
function clearStyleInput() {
    document.getElementById('styleInput').value = '';
    document.getElementById('styleOutput').value = '';
}

// Fonction pour coller depuis le presse-papiers
async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('styleInput').value = text;
        const activeStyle = document.querySelector('.style-btn.active')?.dataset.style;
        if (activeStyle) {
            applyStyle(activeStyle);
        }
    } catch (err) {
        showNotification('Impossible d\'accéder au presse-papiers', 'error');
    }
}

// Fonction pour partager le texte
async function shareOutput() {
    const text = document.getElementById('styleOutput').value;
    if (!text) return;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Texte stylisé',
                text: text
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                showNotification('Erreur lors du partage', 'error');
            }
        }
    } else {
        copyStyleOutput();
    }
}

// Fonction pour télécharger le texte
function downloadOutput() {
    const text = document.getElementById('styleOutput').value;
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'texte-stylise.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Fonction pour ajouter à l'historique
function addToStyleHistory(input, output, style) {
    const historyItem = {
        input,
        output,
        style,
        timestamp: new Date().toISOString()
    };

    styleHistory.unshift(historyItem);
    if (styleHistory.length > 10) {
        styleHistory.pop();
    }

    updateStyleHistory();
    saveStyleHistory();
}

// Fonction pour mettre à jour l'affichage de l'historique
function updateStyleHistory() {
    const historyList = document.getElementById('styleHistory');
    if (!historyList) return;

    historyList.innerHTML = '';
    styleHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-content">
                <div class="original-text">${item.input}</div>
                <div class="styled-text">${item.output}</div>
            </div>
            <div class="history-actions">
                <button onclick="useHistoryStyle(${index})" title="Réutiliser">
                    <i class="fas fa-redo"></i>
                </button>
                <button onclick="copyHistoryText(${index})" title="Copier">
                    <i class="fas fa-copy"></i>
                </button>
                <span class="timestamp">${new Date(item.timestamp).toLocaleString()}</span>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Fonction pour utiliser un style de l'historique
function useHistoryStyle(index) {
    const item = styleHistory[index];
    if (!item) return;

    document.getElementById('styleInput').value = item.input;
    applyStyle(item.style);
}

// Fonction pour copier un texte de l'historique
function copyHistoryText(index) {
    const item = styleHistory[index];
    if (!item) return;

    navigator.clipboard.writeText(item.output)
        .then(() => showNotification('Texte copié !', 'success'))
        .catch(() => showNotification('Erreur lors de la copie', 'error'));
}

// Fonction pour effacer l'historique
function clearStyleHistory() {
    if (!confirm('Voulez-vous vraiment effacer tout l\'historique ?')) return;

    styleHistory.length = 0;
    updateStyleHistory();
    localStorage.removeItem('styleHistory');
    showNotification('Historique effacé', 'success');
}

// Fonction pour sauvegarder l'historique
function saveStyleHistory() {
    localStorage.setItem('styleHistory', JSON.stringify(styleHistory));
}

// Fonction pour charger l'historique
function loadStyleHistory() {
    const saved = localStorage.getItem('styleHistory');
    if (saved) {
        styleHistory.push(...JSON.parse(saved));
        updateStyleHistory();
    }
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
    
    // Initialiser le bloc-notes
    loadNotes();
    
    // Charger l'historique
    loadStyleHistory();

    // Ajouter les écouteurs d'événements pour les onglets de catégorie
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchStyleCategory(tab.dataset.category);
        });
    });

    // Activer la première catégorie par défaut
    switchStyleCategory('basic');

    // Mise à jour en temps réel
    document.getElementById('styleInput')?.addEventListener('input', () => {
        const activeStyle = document.querySelector('.style-btn.active')?.dataset.style;
        if (activeStyle) {
            applyStyle(activeStyle);
        }
    });
}); 