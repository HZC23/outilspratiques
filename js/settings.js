/**
 * @file settings.js
 * @description Gestionnaire des paramètres globaux pour Outils Pratiques
 */

class SettingsManager {
    constructor() {
        // Configuration par défaut
        this.defaultSettings = {
            general: {
                language: 'fr',
                startupTool: 'home',
                rememberSession: true,
                autoSave: true,
                autoSaveInterval: 60
            },
            appearance: {
                theme: 'system',
                accentColor: '#4a90e2',
                compactMode: false,
                fontSize: 'medium'
            },
            accessibility: {
                reduceMotion: false,
                highContrast: false,
                fontFamily: 'poppins',
                lineSpacing: 'normal'
            },
            privacy: {
                storeDataLocally: true,
                encryptSensitiveData: false,
                encryptionPassword: '',
                clearOnExit: false
            },
            sync: {
                enabled: false
            }
        };

        // Éléments DOM (à initialiser dans init())
        this.elements = {};

        // Observer les changements du thème système
        this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.themeMediaQuery.addEventListener('change', () => this.applyTheme());

        // Paramètres actuels (à charger depuis localStorage)
        this.settings = this.loadSettings() || this.defaultSettings; // Ajout de la valeur par défaut si loadSettings échoue
    }

    /**
     * Initialise le gestionnaire de paramètres
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadUIState();
        this.applySettings();
        this.initStorageInfo();
    }

    /**
     * Met en cache les éléments DOM pour les performances
     */
    cacheElements() {
        // Navigation
        this.elements.navItems = document.querySelectorAll('.settings-nav-item');
        this.elements.tabs = document.querySelectorAll('.settings-tab');
        
        // Panneau d'aide
        this.elements.helpPanel = document.getElementById('settingsHelpPanel');
        this.elements.helpBtn = document.getElementById('settingsHelp');
        this.elements.closeHelpBtn = document.getElementById('closeSettingsHelp');
        
        // Modals
        this.elements.clearDataModal = document.getElementById('clearDataModal');
        this.elements.clearDataBtn = document.getElementById('clearAllDataBtn');
        this.elements.confirmClearData = document.getElementById('confirmClearData');
        this.elements.cancelClearData = document.getElementById('cancelClearData');
        this.elements.closeClearDataModal = document.getElementById('closeClearDataModal');

        // Général
        this.elements.languageSelect = document.getElementById('languageSelect');
        this.elements.startupToolSelect = document.getElementById('startupToolSelect') || {}; // Ajout d'une valeur par défaut pour éviter l'erreur
        this.elements.rememberSession = document.getElementById('rememberSession');
        this.elements.autoSave = document.getElementById('autoSave');
        this.elements.autoSaveInterval = document.getElementById('autoSaveInterval');

        // Apparence
        this.elements.themeOptions = {
            light: document.getElementById('themeLight'),
            dark: document.getElementById('themeDark'),
            system: document.getElementById('themeSystem')
        };
        this.elements.colorOptions = document.querySelectorAll('.color-option');
        this.elements.customAccentColor = document.getElementById('customAccentColor');
        this.elements.compactMode = document.getElementById('compactMode');
        this.elements.fontSizeSelect = document.getElementById('fontSizeSelect');

        // Accessibilité
        this.elements.reduceMotion = document.getElementById('reduceMotion');
        this.elements.highContrast = document.getElementById('highContrast');
        this.elements.fontFamilySelect = document.getElementById('fontFamilySelect');
        this.elements.lineSpacingSelect = document.getElementById('lineSpacingSelect');

        // Confidentialité
        this.elements.storeDataLocally = document.getElementById('storeDataLocally');
        this.elements.encryptSensitiveData = document.getElementById('encryptSensitiveData');
        this.elements.encryptionPassword = document.getElementById('encryptionPassword');
        this.elements.encryptionPasswordContainer = document.getElementById('encryptionPasswordContainer');
        this.elements.clearOnExit = document.getElementById('clearOnExit');
        this.elements.togglePasswordBtn = document.querySelector('.toggle-password');

        // Données
        this.elements.exportDataBtn = document.getElementById('exportDataBtn');
        this.elements.importDataBtn = document.getElementById('importDataBtn');
        this.elements.importDataFile = document.getElementById('importDataFile');
        this.elements.enableSync = document.getElementById('enableSync');
        this.elements.clearCacheBtn = document.getElementById('clearCacheBtn');
        
        // Stockage
        this.elements.storageBar = document.getElementById('storageBar');
        this.elements.storageUsed = document.getElementById('storageUsed');
        this.elements.storageQuota = document.getElementById('storageQuota');
        
        // Version
        this.elements.appVersion = document.getElementById('appVersion');
    }
    
    loadSettings() {
        // Charger les paramètres depuis le stockage local
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
        
        // Appliquer les paramètres chargés
        if (this.elements.languageSelect) this.elements.languageSelect.value = settings.language || 'fr';
        if (this.elements.startupToolSelect) this.elements.startupToolSelect.value = settings.startupTool || 'default';
        if (this.elements.rememberSession) this.elements.rememberSession.checked = settings.rememberSession || false;
        if (this.elements.autoSave) this.elements.autoSave.checked = settings.autoSave || false;
        if (this.elements.autoSaveInterval) this.elements.autoSaveInterval.value = settings.autoSaveInterval || 10;

        // Appliquer les thèmes
        if (settings.theme) {
            Object.keys(this.elements.themeOptions).forEach(theme => {
                if (this.elements.themeOptions[theme]) {
                    this.elements.themeOptions[theme].checked = (theme === settings.theme);
                }
            });
        }

        // Appliquer les autres paramètres
        if (this.elements.compactMode) this.elements.compactMode.checked = settings.compactMode || false;
        if (this.elements.fontSizeSelect) this.elements.fontSizeSelect.value = settings.fontSize || 'medium';
        if (this.elements.reduceMotion) this.elements.reduceMotion.checked = settings.reduceMotion || false;
        if (this.elements.highContrast) this.elements.highContrast.checked = settings.highContrast || false;
    };

    /**
     * Attache les événements aux éléments de l'interface
     */
    bindEvents() {
        // Navigation entre les onglets
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', () => this.switchTab(item.dataset.tab));
        });

        // Vérifier si le bouton d'aide existe avant d'ajouter l'événement
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', () => this.toggleHelpPanel());
        }
        if (this.elements.closeHelpBtn) {
            this.elements.closeHelpBtn.addEventListener('click', () => this.toggleHelpPanel());
        }

        // Modal de confirmation pour effacer les données
        if (this.elements.clearDataBtn) {
            this.elements.clearDataBtn.addEventListener('click', () => this.showClearDataModal());
        }
        if (this.elements.confirmClearData) {
            this.elements.confirmClearData.addEventListener('click', () => this.clearAllData());
        }
        if (this.elements.cancelClearData) {
            this.elements.cancelClearData.addEventListener('click', () => this.hideClearDataModal());
        }
        if (this.elements.closeClearDataModal) {
            this.elements.closeClearDataModal.addEventListener('click', () => this.hideClearDataModal());
        }

        // Général
        if (this.elements.startupToolSelect) {
            this.elements.startupToolSelect.addEventListener('change', () => this.updateSetting('general', 'startupTool', this.elements.startupToolSelect.value));
        }
        this.elements.rememberSession.addEventListener('change', () => this.updateSetting('general', 'rememberSession', this.elements.rememberSession.checked));
        this.elements.autoSave.addEventListener('change', () => this.updateSetting('general', 'autoSave', this.elements.autoSave.checked));
        this.elements.autoSaveInterval.addEventListener('change', () => this.updateSetting('general', 'autoSaveInterval', parseInt(this.elements.autoSaveInterval.value)));

        // Apparence
        Object.keys(this.elements.themeOptions).forEach(theme => {
            this.elements.themeOptions[theme].addEventListener('change', () => {
                if (this.elements.themeOptions[theme].checked) {
                    this.updateSetting('appearance', 'theme', theme);
                }
            });
        });
        
        this.elements.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                if (color === 'custom') {
                    this.elements.customAccentColor.click();
                } else {
                    this.updateSetting('appearance', 'accentColor', color);
                    this.highlightSelectedColor(color);
                }
            });
        });
        
        this.elements.customAccentColor.addEventListener('input', () => {
            const color = this.elements.customAccentColor.value;
            this.updateSetting('appearance', 'accentColor', color);
            this.highlightSelectedColor('custom');
        });
        
        this.elements.compactMode.addEventListener('change', () => this.updateSetting('appearance', 'compactMode', this.elements.compactMode.checked));
        this.elements.fontSizeSelect.addEventListener('change', () => this.updateSetting('appearance', 'fontSize', this.elements.fontSizeSelect.value));

        // Accessibilité
        this.elements.reduceMotion.addEventListener('change', () => this.updateSetting('accessibility', 'reduceMotion', this.elements.reduceMotion.checked));
        this.elements.highContrast.addEventListener('change', () => this.updateSetting('accessibility', 'highContrast', this.elements.highContrast.checked));
        this.elements.fontFamilySelect.addEventListener('change', () => this.updateSetting('accessibility', 'fontFamily', this.elements.fontFamilySelect.value));
        this.elements.lineSpacingSelect.addEventListener('change', () => this.updateSetting('accessibility', 'lineSpacing', this.elements.lineSpacingSelect.value));

        // Confidentialité
        this.elements.storeDataLocally.addEventListener('change', () => this.updateSetting('privacy', 'storeDataLocally', this.elements.storeDataLocally.checked));
        this.elements.encryptSensitiveData.addEventListener('change', () => {
            this.updateSetting('privacy', 'encryptSensitiveData', this.elements.encryptSensitiveData.checked);
            this.toggleEncryptionPasswordField();
        });
        this.elements.encryptionPassword.addEventListener('input', () => this.updateSetting('privacy', 'encryptionPassword', this.elements.encryptionPassword.value));
        this.elements.clearOnExit.addEventListener('change', () => this.updateSetting('privacy', 'clearOnExit', this.elements.clearOnExit.checked));
        
        if (this.elements.togglePasswordBtn) {
            this.elements.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Données
        this.elements.exportDataBtn.addEventListener('click', () => this.exportData());
        this.elements.importDataBtn.addEventListener('click', () => this.elements.importDataFile.click());
        this.elements.importDataFile.addEventListener('change', (e) => this.importData(e));
        this.elements.enableSync.addEventListener('change', () => this.updateSetting('sync', 'enabled', this.elements.enableSync.checked));
        this.elements.clearCacheBtn.addEventListener('click', () => this.clearCache());

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Fermer la fenêtre d'aide avec Escape
            if (e.key === 'Escape' && this.elements.helpPanel.classList.contains('active')) {
                this.toggleHelpPanel();
            }
            
            // Fermer le modal de confirmation avec Escape
            if (e.key === 'Escape' && this.elements.clearDataModal.classList.contains('active')) {
                this.hideClearDataModal();
            }
            
            // Ouvrir les paramètres avec Ctrl+,
            if (e.ctrlKey && e.key === ',') {
                // Implémenter la logique pour ouvrir les paramètres depuis n'importe où dans l'application
            }
        });
    }
}

// Initialiser le gestionnaire de paramètres lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager();
    settingsManager.init();
});