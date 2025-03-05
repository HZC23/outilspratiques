// Configuration globale
const CONFIG = {
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    MAX_HISTORY_ITEMS: 10,
    DEBOUNCE_DELAY: 300,
    STORAGE_KEYS: {
        THEME: 'theme',
        CALCULATOR_HISTORY: 'calculatorHistory',
        NOTES: 'notes',
        STYLE_HISTORY: 'styleHistory',
        TODO_LIST: 'todoList'
    }
};

// Utilitaires
const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Erreur de copie :', err);
            return false;
        }
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, CONFIG.NOTIFICATION_DURATION);
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date);
    },

    formatTime(date) {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }
};

// Gestionnaire de thème
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            document.querySelector('.theme-switch__checkbox').checked = savedTheme === 'dark';
        }

        this.setupListeners();
    },

    setupListeners() {
        document.querySelector('.theme-switch__checkbox')?.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
        });
    }
};

// Gestionnaire de navigation
const NavigationManager = {
    init() {
        this.setupMenuListeners();
        this.handleInitialRoute();
    },

    setupMenuListeners() {
        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const menuId = e.currentTarget.getAttribute('aria-controls');
                this.toggleSubmenu(menuId);
            });
        });

        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.closeAllSubmenus();
            });
        });
    },

    toggleSubmenu(menuId) {
        const menu = document.getElementById(menuId);
        const trigger = document.querySelector(`[aria-controls="${menuId}"]`);
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

        this.closeAllSubmenus();

        menu.setAttribute('aria-hidden', !isExpanded);
        trigger.setAttribute('aria-expanded', !isExpanded);
        menu.style.display = isExpanded ? 'none' : 'block';
    },

    closeAllSubmenus() {
        document.querySelectorAll('.submenu').forEach(submenu => {
            submenu.style.display = 'none';
            submenu.setAttribute('aria-hidden', 'true');
        });

        document.querySelectorAll('.menu-trigger').forEach(trigger => {
            trigger.setAttribute('aria-expanded', 'false');
        });
    },

    handleInitialRoute() {
        const hash = window.location.hash.substring(1);
        this.showTool(hash || 'calculatorTool');
    }
};

// Gestionnaire d'horloge
const ClockManager = {
    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    },

    updateClock() {
        const now = new Date();
        document.getElementById('topTime').textContent = Utils.formatTime(now);
        document.getElementById('topDate').textContent = Utils.formatDate(now);
    }
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    NavigationManager.init();
    ClockManager.init();

    // Initialisation des tooltips
    document.querySelectorAll('[title]').forEach(element => {
        const tooltip = element.getAttribute('title');
        element.setAttribute('data-tooltip', tooltip);
        element.removeAttribute('title');
    });
});

// Export des modules pour utilisation dans d'autres fichiers
export {
    CONFIG,
    Utils,
    ThemeManager,
    NavigationManager,
    ClockManager
};
