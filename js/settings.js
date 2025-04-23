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

        // Paramètres actuels (à charger depuis localStorage)
        this.settings = this.loadSettings();

        // Éléments DOM (à initialiser dans init())
        this.elements = {};

        // Observer les changements du thème système
        this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.themeMediaQuery.addEventListener('change', () => this.applyTheme());
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
        this.elements.startupToolSelect = document.getElementById('startupToolSelect');
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

    /**
     * Attache les événements aux éléments de l'interface
     */
    bindEvents() {
        // Navigation entre les onglets
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', () => this.switchTab(item.dataset.tab));
        });

        // Panneau d'aide
        this.elements.helpBtn.addEventListener('click', () => this.toggleHelpPanel());
        this.elements.closeHelpBtn.addEventListener('click', () => this.toggleHelpPanel());

        // Modal de confirmation pour effacer les données
        this.elements.clearDataBtn.addEventListener('click', () => this.showClearDataModal());
        this.elements.confirmClearData.addEventListener('click', () => this.clearAllData());
        this.elements.cancelClearData.addEventListener('click', () => this.hideClearDataModal());
        this.elements.closeClearDataModal.addEventListener('click', () => this.hideClearDataModal());

        // Général
        this.elements.languageSelect.addEventListener('change', () => this.updateSetting('general', 'language', this.elements.languageSelect.value));
        this.elements.startupToolSelect.addEventListener('change', () => this.updateSetting('general', 'startupTool', this.elements.startupToolSelect.value));
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

    /**
     * Charge l'état de l'interface utilisateur en fonction des paramètres
     */
    loadUIState() {
        // Général
        this.elements.languageSelect.value = this.settings.general.language;
        this.elements.startupToolSelect.value = this.settings.general.startupTool;
        this.elements.rememberSession.checked = this.settings.general.rememberSession;
        this.elements.autoSave.checked = this.settings.general.autoSave;
        this.elements.autoSaveInterval.value = this.settings.general.autoSaveInterval;

        // Apparence
        this.elements.themeOptions[this.settings.appearance.theme].checked = true;
        this.highlightSelectedColor(this.settings.appearance.accentColor);
        this.elements.customAccentColor.value = this.settings.appearance.accentColor;
        this.elements.compactMode.checked = this.settings.appearance.compactMode;
        this.elements.fontSizeSelect.value = this.settings.appearance.fontSize;

        // Accessibilité
        this.elements.reduceMotion.checked = this.settings.accessibility.reduceMotion;
        this.elements.highContrast.checked = this.settings.accessibility.highContrast;
        this.elements.fontFamilySelect.value = this.settings.accessibility.fontFamily;
        this.elements.lineSpacingSelect.value = this.settings.accessibility.lineSpacing;

        // Confidentialité
        this.elements.storeDataLocally.checked = this.settings.privacy.storeDataLocally;
        this.elements.encryptSensitiveData.checked = this.settings.privacy.encryptSensitiveData;
        this.elements.clearOnExit.checked = this.settings.privacy.clearOnExit;
        this.toggleEncryptionPasswordField();

        // Données
        this.elements.enableSync.checked = this.settings.sync.enabled;
        
        // Version de l'application
        this.elements.appVersion.textContent = this.getAppVersion();
    }

    /**
     * Applique les paramètres à l'application
     */
    applySettings() {
        // Appliquer le thème
        this.applyTheme();
        
        // Appliquer la couleur d'accent
        this.applyAccentColor();
        
        // Appliquer la taille de police
        this.applyFontSize();
        
        // Appliquer les paramètres de mode compact
        this.applyCompactMode();
        
        // Appliquer les paramètres d'accessibilité
        this.applyAccessibilitySettings();
        
        // Enregistrer les paramètres dans localStorage
        this.saveSettings();
        
        // Déclencher un événement pour que le reste de l'application puisse réagir
        this.dispatchSettingsChangeEvent();
    }

    /**
     * Charge les paramètres depuis localStorage
     * @returns {Object} Les paramètres chargés
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('outilsPratiques_settings');
            if (savedSettings) {
                // Fusionner les paramètres par défaut avec les paramètres sauvegardés
                return this.mergeSettings(this.defaultSettings, JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
        }
        
        return JSON.parse(JSON.stringify(this.defaultSettings)); // Copie profonde
    }

    /**
     * Fusionne les paramètres par défaut avec les paramètres sauvegardés
     * @param {Object} defaultSettings Les paramètres par défaut
     * @param {Object} savedSettings Les paramètres sauvegardés
     * @returns {Object} Les paramètres fusionnés
     */
    mergeSettings(defaultSettings, savedSettings) {
        const mergedSettings = JSON.parse(JSON.stringify(defaultSettings)); // Copie profonde
        
        // Parcourir tous les groupes de paramètres
        for (const group in savedSettings) {
            if (group in mergedSettings) {
                // Parcourir tous les paramètres du groupe
                for (const key in savedSettings[group]) {
                    if (key in mergedSettings[group]) {
                        mergedSettings[group][key] = savedSettings[group][key];
                    }
                }
            }
        }
        
        return mergedSettings;
    }

    /**
     * Sauvegarde les paramètres dans localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('outilsPratiques_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
        }
    }

    /**
     * Met à jour un paramètre et applique les changements
     * @param {string} group Le groupe de paramètres
     * @param {string} key La clé du paramètre
     * @param {any} value La nouvelle valeur
     */
    updateSetting(group, key, value) {
        if (group in this.settings && key in this.settings[group]) {
            this.settings[group][key] = value;
            this.applySettings();
        }
    }

    /**
     * Change d'onglet dans l'interface des paramètres
     * @param {string} tabId L'ID de l'onglet à afficher
     */
    switchTab(tabId) {
        // Désactiver tous les onglets et boutons de navigation
        this.elements.tabs.forEach(tab => tab.classList.remove('active'));
        this.elements.navItems.forEach(item => item.classList.remove('active'));
        
        // Activer l'onglet et le bouton de navigation correspondant
        document.getElementById(`${tabId}Tab`).classList.add('active');
        document.querySelector(`.settings-nav-item[data-tab="${tabId}"]`).classList.add('active');
    }

    /**
     * Affiche ou masque le panneau d'aide
     */
    toggleHelpPanel() {
        this.elements.helpPanel.classList.toggle('active');
    }

    /**
     * Affiche la boîte de dialogue de confirmation pour effacer les données
     */
    showClearDataModal() {
        this.elements.clearDataModal.classList.add('active');
    }

    /**
     * Masque la boîte de dialogue de confirmation pour effacer les données
     */
    hideClearDataModal() {
        this.elements.clearDataModal.classList.remove('active');
    }

    /**
     * Efface toutes les données de l'application
     */
    clearAllData() {
        // Conserver les paramètres actuels
        const currentSettings = JSON.parse(JSON.stringify(this.settings));
        
        try {
            // Effacer toutes les données du localStorage sauf les paramètres
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key !== 'outilsPratiques_settings') {
                    localStorage.removeItem(key);
                }
            }
            
            // Effacer les caches si disponibles
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                        if (cacheName.startsWith('outilsPratiques-')) {
                            caches.delete(cacheName);
                        }
                    });
                });
            }
            
            // Afficher un message de confirmation
            alert('Toutes vos données ont été effacées avec succès.');
            
            // Masquer la boîte de dialogue
            this.hideClearDataModal();
            
            // Rafraîchir les informations de stockage
            this.initStorageInfo();
        } catch (error) {
            console.error('Erreur lors de l\'effacement des données:', error);
            alert('Une erreur est survenue lors de l\'effacement des données.');
        }
    }

    /**
     * Exporte toutes les données de l'application
     */
    exportData() {
        try {
            // Collecter toutes les données du localStorage
            const exportData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('outilsPratiques')) {
                    try {
                        exportData[key] = JSON.parse(localStorage.getItem(key));
                    } catch {
                        exportData[key] = localStorage.getItem(key);
                    }
                }
            }
            
            // Créer un blob et le télécharger
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `outilsPratiques_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur lors de l\'exportation des données:', error);
            alert('Une erreur est survenue lors de l\'exportation des données.');
        }
    }

    /**
     * Importe les données depuis un fichier de sauvegarde
     * @param {Event} event L'événement de changement de fichier
     */
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Confirmer l'importation
                if (confirm('Êtes-vous sûr de vouloir importer ces données ? Les données existantes seront remplacées.')) {
                    // Appliquer les données importées
                    for (const key in importData) {
                        localStorage.setItem(key, JSON.stringify(importData[key]));
                    }
                    
                    // Recharger les paramètres
                    this.settings = this.loadSettings();
                    this.loadUIState();
                    this.applySettings();
                    
                    // Rafraîchir les informations de stockage
                    this.initStorageInfo();
                    
                    // Afficher un message de confirmation
                    alert('Données importées avec succès. L\'application va se recharger pour appliquer les changements.');
                    
                    // Recharger l'application
                    window.location.reload();
                }
            } catch (error) {
                console.error('Erreur lors de l\'importation des données:', error);
                alert('Le fichier importé n\'est pas valide ou est corrompu.');
            }
        };
        reader.readAsText(file);
        
        // Réinitialiser l'input file pour permettre de sélectionner le même fichier plusieurs fois
        event.target.value = '';
    }

    /**
     * Vide le cache du navigateur
     */
    clearCache() {
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => cacheName.startsWith('outilsPratiques-'))
                        .map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                alert('Cache vidé avec succès.');
                this.initStorageInfo();
            }).catch(error => {
                console.error('Erreur lors du vidage du cache:', error);
                alert('Une erreur est survenue lors du vidage du cache.');
            });
        } else {
            alert('La fonctionnalité de cache n\'est pas disponible dans votre navigateur.');
        }
    }

    /**
     * Initialise les informations de stockage
     */
    initStorageInfo() {
        // Calculer la taille des données dans localStorage
        let storageUsed = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('outilsPratiques')) {
                storageUsed += localStorage.getItem(key).length * 2; // 2 octets par caractère
            }
        }
        
        // Convertir en KB
        const storageUsedKB = Math.round(storageUsed / 1024);
        this.elements.storageUsed.textContent = `${storageUsedKB} KB`;
        
        // Définir la limite (approximative) de localStorage (5 MB généralement)
        const storageQuotaKB = 5 * 1024;
        this.elements.storageQuota.textContent = `${storageQuotaKB} KB`;
        
        // Mettre à jour la barre de progression
        const percentage = Math.min(100, (storageUsedKB / storageQuotaKB) * 100);
        this.elements.storageBar.style.width = `${percentage}%`;
        
        // Changer la couleur en fonction du niveau de remplissage
        if (percentage > 80) {
            this.elements.storageBar.style.backgroundColor = '#e74c3c'; // Rouge
        } else if (percentage > 60) {
            this.elements.storageBar.style.backgroundColor = '#f39c12'; // Orange
        } else {
            this.elements.storageBar.style.backgroundColor = '#50c878'; // Vert
        }
    }

    /**
     * Applique le thème sélectionné
     */
    applyTheme() {
        const theme = this.settings.appearance.theme;
        const root = document.documentElement;
        
        // Supprimer les classes de thème existantes
        root.classList.remove('theme-light', 'theme-dark');
        
        // Appliquer le thème sélectionné
        if (theme === 'system') {
            // Utiliser le thème du système
            if (this.themeMediaQuery.matches) {
                root.classList.add('theme-dark');
            } else {
                root.classList.add('theme-light');
            }
        } else {
            // Utiliser le thème sélectionné
            root.classList.add(`theme-${theme}`);
        }
    }

    /**
     * Applique la couleur d'accent
     */
    applyAccentColor() {
        const color = this.settings.appearance.accentColor;
        const root = document.documentElement;
        
        // Définir la variable CSS pour la couleur d'accent
        root.style.setProperty('--accent-color', color);
        
        // Calculer des variantes de la couleur d'accent (plus claire et plus foncée)
        const rgbColor = this.hexToRgb(color);
        if (rgbColor) {
            // Variante plus claire (pour les survols)
            const lighterColor = this.adjustBrightness(rgbColor, 30);
            root.style.setProperty('--accent-color-light', lighterColor);
            
            // Variante plus foncée (pour les pressions)
            const darkerColor = this.adjustBrightness(rgbColor, -30);
            root.style.setProperty('--accent-color-dark', darkerColor);
            
            // Variante transparente (pour les fonds)
            root.style.setProperty('--accent-color-transparent', `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.2)`);
        }
    }

    /**
     * Met en évidence la couleur d'accent sélectionnée
     * @param {string} color La couleur sélectionnée
     */
    highlightSelectedColor(color) {
        // Supprimer la classe active de tous les boutons de couleur
        this.elements.colorOptions.forEach(option => {
            option.classList.remove('active');
        });
        
        // Ajouter la classe active au bouton de couleur sélectionné
        if (color === 'custom') {
            document.querySelector('.color-option.custom').classList.add('active');
        } else {
            // Trouver le bouton de couleur correspondant à la couleur sélectionnée
            const selectedOption = Array.from(this.elements.colorOptions)
                .find(option => option.dataset.color === color);
            
            if (selectedOption) {
                selectedOption.classList.add('active');
            } else {
                // Si la couleur n'est pas dans les options prédéfinies, sélectionner la couleur personnalisée
                document.querySelector('.color-option.custom').classList.add('active');
            }
        }
    }

    /**
     * Applique la taille de police
     */
    applyFontSize() {
        const fontSize = this.settings.appearance.fontSize;
        const root = document.documentElement;
        
        // Supprimer les classes de taille de police existantes
        root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
        
        // Appliquer la classe de taille de police
        root.classList.add(`font-size-${fontSize}`);
    }

    /**
     * Applique le mode compact
     */
    applyCompactMode() {
        const isCompact = this.settings.appearance.compactMode;
        const root = document.documentElement;
        
        if (isCompact) {
            root.classList.add('compact-mode');
        } else {
            root.classList.remove('compact-mode');
        }
    }

    /**
     * Applique les paramètres d'accessibilité
     */
    applyAccessibilitySettings() {
        const root = document.documentElement;
        
        // Réduire les animations
        if (this.settings.accessibility.reduceMotion) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }
        
        // Contraste élevé
        if (this.settings.accessibility.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
        
        // Police de caractères
        root.style.setProperty('--font-family', this.getFontFamilyValue(this.settings.accessibility.fontFamily));
        
        // Espacement des lignes
        root.style.setProperty('--line-spacing', this.getLineSpacingValue(this.settings.accessibility.lineSpacing));
    }

    /**
     * Affiche ou masque le champ de mot de passe pour le chiffrement
     */
    toggleEncryptionPasswordField() {
        if (this.settings.privacy.encryptSensitiveData) {
            this.elements.encryptionPasswordContainer.style.display = 'block';
        } else {
            this.elements.encryptionPasswordContainer.style.display = 'none';
        }
    }

    /**
     * Bascule la visibilité du mot de passe
     */
    togglePasswordVisibility() {
        const passwordInput = this.elements.encryptionPassword;
        const toggleBtn = this.elements.togglePasswordBtn;
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    /**
     * Convertit une couleur hexadécimale en objet RGB
     * @param {string} hex La couleur hexadécimale
     * @returns {Object|null} L'objet RGB ou null si invalide
     */
    hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Ajuste la luminosité d'une couleur RGB
     * @param {Object} rgb L'objet RGB
     * @param {number} amount La quantité d'ajustement (-255 à 255)
     * @returns {string} La couleur hexadécimale ajustée
     */
    adjustBrightness(rgb, amount) {
        const adjustColor = (color) => {
            return Math.max(0, Math.min(255, color + amount));
        };
        
        const r = adjustColor(rgb.r);
        const g = adjustColor(rgb.g);
        const b = adjustColor(rgb.b);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /**
     * Obtient la valeur CSS pour la famille de police
     * @param {string} fontFamily L'identifiant de la famille de police
     * @returns {string} La valeur CSS
     */
    getFontFamilyValue(fontFamily) {
        const fontFamilies = {
            'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            'poppins': '"Poppins", sans-serif',
            'opensans': '"Open Sans", sans-serif',
            'roboto': '"Roboto", sans-serif',
            'dyslexic': '"OpenDyslexic", sans-serif'
        };
        
        return fontFamilies[fontFamily] || fontFamilies['system'];
    }

    /**
     * Obtient la valeur CSS pour l'espacement des lignes
     * @param {string} lineSpacing L'identifiant de l'espacement des lignes
     * @returns {string} La valeur CSS
     */
    getLineSpacingValue(lineSpacing) {
        const lineSpacings = {
            'normal': '1.5',
            'wide': '1.8',
            'very-wide': '2.2'
        };
        
        return lineSpacings[lineSpacing] || lineSpacings['normal'];
    }

    /**
     * Obtient la version de l'application
     * @returns {string} La version de l'application
     */
    getAppVersion() {
        // À intégrer avec un système de versionnage réel
        return '1.0.0';
    }

    /**
     * Déclenche un événement pour informer l'application des changements de paramètres
     */
    dispatchSettingsChangeEvent() {
        const event = new CustomEvent('settings:changed', {
            detail: {
                settings: this.settings
            }
        });
        
        document.dispatchEvent(event);
    }
}

// Initialiser le gestionnaire de paramètres quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
    window.settingsManager.init();
}); 