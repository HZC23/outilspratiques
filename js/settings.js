import { dataSyncManager } from './data-sync.js';
import { Utils } from '../js/utils.js';
import { CONFIG } from '../js/config.js';
import { isAuthenticated } from './supabase.js';

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
            privacy: {
                storeDataLocally: true,
                encryptSensitiveData: false,
                encryptionPassword: '',
                clearOnExit: false,
                saveHistory: false,
                localStorage: true
            },
            sync: {
                enabled: false,
                offlineMode: false,
                lastSyncDate: null,
                cacheAssets: false,
                cacheResources: {
                    pages: ['/', '/index.html', '/outils.html'],
                    tools: ['/html/tools/calculator.html', '/html/tools/timer.html', '/html/tools/notes.html'],
                    styles: ['/styles/main.css', '/styles/variables.css'],
                    scripts: ['/js/main.js', '/js/utils.js'],
                    images: ['../icons/favicon.ico', '../icons/icon-1024x1024.png']
                }
            },
            advanced: {
                developerMode: false,
                debugLogging: false,
                apiEndpoint: '',
                hardwareAcceleration: true,
                cacheLimit: 50
            }
        };

        // Éléments DOM (à initialiser dans init())
        this.elements = {};

        // Observer les changements du thème système
        this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.themeMediaQuery.addEventListener('change', () => this.applyTheme());

        // Paramètres actuels (à charger depuis localStorage)
        this.settings = this.loadSettings() || this.defaultSettings;
    }

    /**
     * Initialise le gestionnaire de paramètres
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettingsToUI();
        this.applySettings();
        this.initCacheManagement();
        this.updateConnectionStatus();

        // Lancer la synchronisation au démarrage si l'utilisateur est potentiellement connecté
        dataSyncManager.syncLocalWithDatabase();

        // Écouter les changements d'état d'authentification pour déclencher la synchronisation
        document.addEventListener('auth:state-change', (event) => {
            console.log('auth:state-change event received', event.detail);
            if (event.detail.isAuthenticated) {
                console.log('Utilisateur connecté, déclenchement de la synchronisation...');
                dataSyncManager.syncLocalWithDatabase();
            } else {
                console.log('Utilisateur déconnecté. La synchronisation automatique est désactivée jusqu\'à la prochaine connexion.');
            }
        });

        // Écouter l'événement de mise à jour des paramètres synchronisés
        document.addEventListener('data-sync:settings-updated', () => {
            console.log('Événement data-sync:settings-updated reçu. Rafraîchissement de l\'UI des paramètres...');
            this.settings = this.loadSettings(); // Recharger les paramètres depuis localStorage
            this.loadSettingsToUI(); // Mettre à jour l'UI avec les nouveaux paramètres
            this.applySettings(); // Appliquer les paramètres (thème, taille police, etc.)
        });
    }

    /**
     * Met en cache les éléments DOM pour les performances
     */
    cacheElements() {
        // Navigation
        this.elements.navItems = document.querySelectorAll('.settings-nav-item');
        this.elements.tabs = document.querySelectorAll('.settings-tab');
        
        // Panneau d'aide
        this.elements.helpPanel = document.getElementById('help-panel');
        this.elements.helpBtns = document.querySelectorAll('.settings-help-btn[data-help]'); // Tous les boutons d'aide
        this.elements.closeHelpBtn = document.getElementById('close-help');
        
        // Général
        this.elements.languageSelect = document.getElementById('language-select');
        this.elements.startupToolSelect = document.getElementById('startup-tool');
        this.elements.rememberSession = document.getElementById('restore-session');
        this.elements.autoSave = document.getElementById('auto-save');
        this.elements.autoSaveInterval = document.getElementById('auto-save-interval');

        // Apparence
        this.elements.themeOptions = {
            light: document.getElementById('theme-light'),
            dark: document.getElementById('theme-dark'),
            system: document.getElementById('theme-system')
        };
        this.elements.colorOptions = document.querySelectorAll('.color-option');
        this.elements.customAccentColor = document.getElementById('custom-color');
        this.elements.compactMode = document.getElementById('compact-mode');
        this.elements.fontSizeSelect = document.getElementById('font-size');

        // Confidentialité
        this.elements.saveHistory = document.getElementById('save-history');
        this.elements.localStorage = document.getElementById('local-storage');
        this.elements.clearHistoryBtn = document.getElementById('clear-history');
        this.elements.clearAllDataBtn = document.getElementById('clear-all-data');

        // Stockage
        this.elements.storageBar = document.querySelector('.storage-bar');
        this.elements.storageUsed = document.getElementById('storage-used');
        this.elements.storageAvailable = document.getElementById('storage-available');

        // Synchronisation
        this.elements.exportSettingsBtn = document.getElementById('export-settings');
        this.elements.importSettingsBtn = document.getElementById('import-settings');
        this.elements.importFile = document.getElementById('import-file');
        this.elements.exportAllDataBtn = document.getElementById('export-all-data');
        this.elements.importAllDataBtn = document.getElementById('import-all-data');
        this.elements.importAllFile = document.getElementById('import-all-file');
        this.elements.offlineMode = document.getElementById('offline-mode');
        this.elements.cacheAssets = document.getElementById('cache-assets');
        this.elements.updateCacheBtn = document.getElementById('update-cache');
        this.elements.lastSyncDate = document.getElementById('last-sync-date');
        this.elements.connectionDot = document.getElementById('connection-dot');
        this.elements.connectionText = document.getElementById('connection-text');
        this.elements.testOfflineBtn = document.getElementById('test-offline');

        // Avancé
        this.elements.developerMode = document.getElementById('developer-mode');
        this.elements.debugLogging = document.getElementById('debug-logging');
        this.elements.apiEndpoint = document.getElementById('api-endpoint');
        this.elements.resetAdvancedBtn = document.getElementById('reset-advanced');
        this.elements.hardwareAcceleration = document.getElementById('hardware-acceleration');
        this.elements.cacheLimit = document.getElementById('cache-limit');

        // Cache management
        this.elements.cacheSearch = document.getElementById('cache-resource-search');
        this.elements.cacheSelectedCount = document.getElementById('cache-selected-count');
        this.elements.cacheSize = document.querySelector('.cache-size span');
        this.elements.cacheProgressBar = document.querySelector('circle:nth-child(2)');
        this.elements.cacheProgressLabel = document.getElementById('cache-progress-label');
        this.elements.applyCacheSelection = document.getElementById('apply-cache-selection');
    }
    
    /**
     * Charge les paramètres depuis localStorage
     * @returns {Object} Les paramètres chargés ou les paramètres par défaut
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            if (savedSettings) {
                // Fusionner avec les paramètres par défaut pour les nouveaux paramètres non présents dans la sauvegarde
                const loadedSettings = JSON.parse(savedSettings);
                // Fusion récursive simple ou utiliser une fonction utilitaire si nécessaire
                return { ...this.defaultSettings, ...loadedSettings };
            }
        } catch (error) {
            console.error("Erreur lors du chargement des paramètres:", error);
        }
        return this.defaultSettings;
    }
    
    /**
     * Applique les paramètres chargés aux éléments de l'interface
     */
    loadSettingsToUI() {
        const settings = this.settings;
        
        // Général
        if (this.elements.languageSelect) this.elements.languageSelect.value = settings.general?.language || 'fr';
        if (this.elements.startupToolSelect) this.elements.startupToolSelect.value = settings.general?.startupTool || 'home';
        if (this.elements.rememberSession) this.elements.rememberSession.checked = settings.general?.rememberSession || false;
        if (this.elements.autoSave) this.elements.autoSave.checked = settings.general?.autoSave || false;
        if (this.elements.autoSaveInterval) this.elements.autoSaveInterval.value = settings.general?.autoSaveInterval || 30;
        
        // Apparence
        if (settings.appearance?.theme) {
            Object.keys(this.elements.themeOptions).forEach(theme => {
                if (this.elements.themeOptions[theme]) {
                    this.elements.themeOptions[theme].checked = (theme === settings.appearance.theme);
                }
            });
        }
        if (this.elements.compactMode) this.elements.compactMode.checked = settings.appearance?.compactMode || false;
        if (this.elements.fontSizeSelect) this.elements.fontSizeSelect.value = settings.appearance?.fontSize || 'medium';
        
        // Couleur d'accentuation
        if (this.elements.colorOptions && settings.appearance?.accentColor) {
            this.highlightSelectedColor(settings.appearance.accentColor);
            if (this.elements.customAccentColor) this.elements.customAccentColor.value = settings.appearance.accentColor;
        }
        
        // Confidentialité
        if (this.elements.saveHistory) this.elements.saveHistory.checked = settings.privacy?.saveHistory || false;
        if (this.elements.localStorage) this.elements.localStorage.checked = settings.privacy?.localStorage || false;
        
        // Synchronisation
        if (this.elements.offlineMode) this.elements.offlineMode.checked = settings.sync?.offlineMode || false;
        if (this.elements.cacheAssets) this.elements.cacheAssets.checked = settings.sync?.cacheAssets || false;
        if (this.elements.lastSyncDate) {
            const lastSync = settings.sync?.lastSyncDate;
            if (lastSync) {
                const date = new Date(lastSync);
                this.elements.lastSyncDate.textContent = this.formatDate(date);
            } else {
                this.elements.lastSyncDate.textContent = 'Jamais';
            }
        }
        
        // Avancé
        if (this.elements.developerMode) this.elements.developerMode.checked = settings.advanced?.developerMode || false;
        if (this.elements.debugLogging) this.elements.debugLogging.checked = settings.advanced?.debugLogging || false;
        if (this.elements.apiEndpoint) this.elements.apiEndpoint.value = settings.advanced?.apiEndpoint || '';
        if (this.elements.hardwareAcceleration) this.elements.hardwareAcceleration.checked = settings.advanced?.hardwareAcceleration || false;
        if (this.elements.cacheLimit) this.elements.cacheLimit.value = settings.advanced?.cacheLimit || 50;
        
        // Application des classes CSS dynamiques
        this.applySettings();

        // Affichage du stockage utilisé
        this.updateStorageInfo();
    }

    applySettings() {
        // Apparence dynamique
        document.body.classList.toggle('compact-mode', this.elements.compactMode && this.elements.compactMode.checked);
        
        // Taille de police
        document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
        if (this.elements.fontSizeSelect) {
            document.body.classList.add('font-size-' + this.elements.fontSizeSelect.value);
        }
        
        // Couleur d'accentuation
        if (this.elements.customAccentColor) {
            document.documentElement.style.setProperty('--accent-color', this.elements.customAccentColor.value);
        }

        // Appliquer le thème
        this.applyTheme();
    }

    /**
     * Applique le thème en fonction des paramètres
     */
    applyTheme() {
        if (!this.settings.appearance) return;

        const theme = this.settings.appearance.theme || 'system';
        
        if (theme === 'system') {
            // Suivre les préférences du système
            const isDarkMode = this.themeMediaQuery.matches;
            document.body.classList.toggle('theme-dark', isDarkMode);
            document.body.classList.toggle('theme-light', !isDarkMode);
        } else {
            // Appliquer le thème choisi
            document.body.classList.toggle('theme-dark', theme === 'dark');
            document.body.classList.toggle('theme-light', theme === 'light');
        }
    }

    highlightSelectedColor(color) {
        this.elements.colorOptions.forEach(option => {
            if (option.dataset.color === color || (color && color.startsWith('#') && option.dataset.color === 'custom')) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        // Affichage du sélecteur de couleur personnalisée
        const customPicker = document.querySelector('.custom-color-picker');
        if (color === 'custom' && customPicker) {
            customPicker.classList.remove('d-none');
        } else if (customPicker) {
            customPicker.classList.add('d-none');
        }
    }

    /**
     * Attache les événements aux éléments de l'interface
     */
    bindEvents() {
        // Navigation entre les onglets
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', () => this.switchTab(item.dataset.tab));
        });
        
        // Panneau d'aide - Correction ici pour que chaque bouton ouvre la bonne section
        document.querySelectorAll('.settings-help-btn[data-help]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.getAttribute('data-help');
                this.showHelpPanel(tab);
            });
        });
        
        if (this.elements.closeHelpBtn) {
            this.elements.closeHelpBtn.addEventListener('click', () => this.hideHelpPanel());
        }
        
        // Général
        if (this.elements.languageSelect) this.elements.languageSelect.addEventListener('change', () => this.updateSetting('general', 'language', this.elements.languageSelect.value));
        if (this.elements.startupToolSelect) this.elements.startupToolSelect.addEventListener('change', () => this.updateSetting('general', 'startupTool', this.elements.startupToolSelect.value));
        if (this.elements.rememberSession) this.elements.rememberSession.addEventListener('change', () => this.updateSetting('general', 'rememberSession', this.elements.rememberSession.checked));
        if (this.elements.autoSave) this.elements.autoSave.addEventListener('change', () => this.updateSetting('general', 'autoSave', this.elements.autoSave.checked));
        if (this.elements.autoSaveInterval) this.elements.autoSaveInterval.addEventListener('change', () => this.updateSetting('general', 'autoSaveInterval', parseInt(this.elements.autoSaveInterval.value)));
        
        // Apparence
        Object.keys(this.elements.themeOptions).forEach(theme => {
            if (this.elements.themeOptions[theme]) {
                this.elements.themeOptions[theme].addEventListener('change', () => {
                    if (this.elements.themeOptions[theme].checked) {
                        this.updateSetting('appearance', 'theme', theme);
                    }
                });
            }
        });
        
        this.elements.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                if (color === 'custom') {
                    document.querySelector('.custom-color-picker').classList.remove('d-none');
                    this.elements.customAccentColor.click();
                } else {
                    document.querySelector('.custom-color-picker').classList.add('d-none');
                    this.updateSetting('appearance', 'accentColor', color);
                    this.highlightSelectedColor(color);
                }
            });
        });
        
        if (this.elements.customAccentColor) {
            this.elements.customAccentColor.addEventListener('input', () => {
                const color = this.elements.customAccentColor.value;
                this.updateSetting('appearance', 'accentColor', color);
                this.highlightSelectedColor('custom');
            });
        }
        
        if (this.elements.compactMode) this.elements.compactMode.addEventListener('change', () => { this.updateSetting('appearance', 'compactMode', this.elements.compactMode.checked); this.applySettings(); });
        if (this.elements.fontSizeSelect) this.elements.fontSizeSelect.addEventListener('change', () => { this.updateSetting('appearance', 'fontSize', this.elements.fontSizeSelect.value); this.applySettings(); });
        
        // Confidentialité
        if (this.elements.saveHistory) this.elements.saveHistory.addEventListener('change', () => this.updateSetting('privacy', 'saveHistory', this.elements.saveHistory.checked));
        if (this.elements.localStorage) this.elements.localStorage.addEventListener('change', () => this.updateSetting('privacy', 'localStorage', this.elements.localStorage.checked));
        if (this.elements.clearHistoryBtn) this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        if (this.elements.clearAllDataBtn) this.elements.clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        
        // Synchronisation
        if (this.elements.exportSettingsBtn) this.elements.exportSettingsBtn.addEventListener('click', () => this.exportSettings());
        if (this.elements.importSettingsBtn) this.elements.importSettingsBtn.addEventListener('click', () => this.elements.importFile.click());
        if (this.elements.importFile) this.elements.importFile.addEventListener('change', (e) => this.importSettings(e));
        if (this.elements.exportAllDataBtn) this.elements.exportAllDataBtn.addEventListener('click', () => this.exportAllData());
        if (this.elements.importAllDataBtn) this.elements.importAllDataBtn.addEventListener('click', () => this.elements.importAllFile.click());
        if (this.elements.importAllFile) this.elements.importAllFile.addEventListener('change', (e) => this.importAllData(e));
        if (this.elements.offlineMode) this.elements.offlineMode.addEventListener('change', () => this.updateSetting('sync', 'offlineMode', this.elements.offlineMode.checked));
        if (this.elements.cacheAssets) this.elements.cacheAssets.addEventListener('change', () => this.updateSetting('sync', 'cacheAssets', this.elements.cacheAssets.checked));
        if (this.elements.updateCacheBtn) this.elements.updateCacheBtn.addEventListener('click', () => this.updateCache());
        if (this.elements.testOfflineBtn) this.elements.testOfflineBtn.addEventListener('click', () => this.toggleTestOfflineMode());
        
        // Avancé
        if (this.elements.developerMode) this.elements.developerMode.addEventListener('change', () => this.updateSetting('advanced', 'developerMode', this.elements.developerMode.checked));
        if (this.elements.debugLogging) this.elements.debugLogging.addEventListener('change', () => this.updateSetting('advanced', 'debugLogging', this.elements.debugLogging.checked));
        if (this.elements.apiEndpoint) this.elements.apiEndpoint.addEventListener('input', () => this.updateSetting('advanced', 'apiEndpoint', this.elements.apiEndpoint.value));
        if (this.elements.resetAdvancedBtn) this.elements.resetAdvancedBtn.addEventListener('click', () => this.resetAdvancedSettings());
        if (this.elements.hardwareAcceleration) this.elements.hardwareAcceleration.addEventListener('change', () => this.updateSetting('advanced', 'hardwareAcceleration', this.elements.hardwareAcceleration.checked));
        if (this.elements.cacheLimit) this.elements.cacheLimit.addEventListener('change', () => this.updateSetting('advanced', 'cacheLimit', this.elements.cacheLimit.value));
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.helpPanel && this.elements.helpPanel.classList.contains('active')) {
                this.hideHelpPanel();
            }
        });

        // Cache management events
        if (this.elements.cacheSearch) {
            this.elements.cacheSearch.addEventListener('input', () => this.filterCacheResources());
        }
        if (this.elements.applyCacheSelection) {
            this.elements.applyCacheSelection.addEventListener('click', () => this.applyCacheSelection());
        }

        // Online/offline events
        window.addEventListener('online', () => this.handleOnlineStatus());
        window.addEventListener('offline', () => this.handleOfflineStatus());
    }

    showHelpPanel(tab) {
        if (!this.elements.helpPanel) return;
        this.elements.helpPanel.classList.add('active');
        // Affiche la bonne section d'aide
        document.querySelectorAll('.help-panel-section').forEach(section => {
            section.classList.add('d-none');
        });
        const section = document.getElementById('help-' + tab);
        if (section) section.classList.remove('d-none');
        // Met à jour le titre avec un mapping plus lisible
        const titleMap = {
            general: 'Paramètres généraux',
            appearance: 'Apparence',
            privacy: 'Confidentialité',
            sync: 'Synchronisation',
            advanced: 'Paramètres avancés',
            about: 'À propos'
        };
        const title = document.getElementById('help-title');
        if (title) title.textContent = titleMap[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
    }
    hideHelpPanel() {
        if (this.elements.helpPanel) this.elements.helpPanel.classList.remove('active');
    }

    // Ajout de la méthode switchTab
    switchTab(tab) {
        this.elements.tabs.forEach(t => {
            t.classList.remove('active');
        });
        const activeTab = document.getElementById(tab);
        if (activeTab) activeTab.classList.add('active');
        this.elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
    }

    updateSetting(section, key, value) {
        if (!this.settings[section]) this.settings[section] = {};
        this.settings[section][key] = value;
        localStorage.setItem('appSettings', JSON.stringify(this.settings));
        this.applySettings();

        // Gestion du mode hors ligne (Service Worker)
        if (section === 'sync' && key === 'offlineMode') {
            if (value) {
                // Activer le Service Worker
                this.registerServiceWorker();
            } else {
                // Désactiver le Service Worker et vider le cache
                this.unregisterServiceWorker();
            }
        }
    }

    /**
     * Enregistre le Service Worker si non déjà actif
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
                if (!reg) {
                    navigator.serviceWorker.register('/sw.js').then(() => {
                        this.notify('Mode hors ligne activé.');
                    }).catch(() => {
                        this.notify('Erreur lors de l\'activation du mode hors ligne.', true);
                    });
                } else {
                    this.notify('Mode hors ligne déjà actif.');
                }
            });
        }
    }

    /**
     * Désenregistre le Service Worker et vide le cache
     */
    unregisterServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
                if (reg) {
                    reg.unregister().then(() => {
                        // Vider tous les caches
                        if (window.caches) {
                            caches.keys().then(keys => {
                                Promise.all(keys.map(key => caches.delete(key))).then(() => {
                                    this.notify('Mode hors ligne désactivé et cache vidé.');
                                });
                            });
                        } else {
                            this.notify('Mode hors ligne désactivé.');
                        }
                    });
                } else {
                    this.notify('Aucun Service Worker à désactiver.');
                }
            });
        }
    }

    /**
     * Force la mise à jour du Service Worker
     */
    updateCache() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
                if (reg) {
                    reg.update().then(() => {
                        this.notify('Cache mis à jour.');
                    }).catch(() => {
                        this.notify('Erreur lors de la mise à jour du cache.', true);
                    });
                } else {
                    this.notify('Le mode hors ligne n\'est pas activé.', true);
                }
            });
        } else {
            this.notify('Service Worker non supporté.', true);
        }
    }

    // --- FONCTIONNALITÉS AVANCÉES ---

    /**
     * Exporte les paramètres de l'application
     */
    exportSettings() {
        const data = {
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: "1.0.0" // Version du format d'export
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parametres-outilspratiques-${this.formatDateForFilename(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Mettre à jour la date de dernière synchronisation
        this.updateSyncDate();
        
        this.notify('Paramètres exportés avec succès !');
    }

    /**
     * Importe les paramètres depuis un fichier JSON
     */
    importSettings(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.settings) {
                    // Fusionner les paramètres pour ne pas perdre ceux qui ne sont pas dans le fichier
                    this.settings = this.mergeSettings(this.settings, data.settings);
                    localStorage.setItem('appSettings', JSON.stringify(this.settings));
                    
                    // Mettre à jour la date de synchronisation
                    this.updateSyncDate();
                    
                    // Recharger l'interface
                    this.loadSettingsToUI();
                    this.notify('Paramètres importés avec succès !');
                } else {
                    this.notify('Fichier invalide. Format de paramètres non reconnu.', true);
                }
            } catch (err) {
                console.error("Erreur pendant l'import:", err);
                this.notify('Erreur lors de l\'import des paramètres.', true);
            }
        };
        
        reader.readAsText(file);
        // Réinitialise l'input pour permettre de réimporter le même fichier
        e.target.value = '';
    }

    /**
     * Fusionne deux objets de paramètres en conservant les valeurs du second
     */
    mergeSettings(oldSettings, newSettings) {
        const mergedSettings = { ...oldSettings };
        
        // Pour chaque section dans les nouveaux paramètres
        Object.keys(newSettings).forEach(section => {
            if (!mergedSettings[section]) {
                mergedSettings[section] = {};
            }
            
            // Pour chaque paramètre dans la section
            if (typeof newSettings[section] === 'object' && newSettings[section] !== null) {
                Object.keys(newSettings[section]).forEach(key => {
                    mergedSettings[section][key] = newSettings[section][key];
                });
            }
        });
        
        return mergedSettings;
    }

    /**
     * Met à jour la date de dernière synchronisation
     */
    updateSyncDate() {
        const now = new Date();
        if (!this.settings.sync) this.settings.sync = {};
        this.settings.sync.lastSyncDate = now.toISOString();
        localStorage.setItem('appSettings', JSON.stringify(this.settings));
        
        if (this.elements.lastSyncDate) {
            this.elements.lastSyncDate.textContent = this.formatDate(now);
        }
    }

    /**
     * Formate une date pour un nom de fichier
     */
    formatDateForFilename(date) {
        return date.toISOString().slice(0, 10).replace(/-/g, '');
    }

    /**
     * Formate une date en format lisible
     */
    formatDate(date) {
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return date.toLocaleDateString('fr-FR', options);
    }

    /**
     * Exporte toutes les données stockées localement
     */
    exportAllData() {
        try {
            const allData = {};
            
            // Récupérer toutes les données du localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                allData[key] = localStorage.getItem(key);
            }
            
            // Ajouter des métadonnées
            const exportData = {
                data: allData,
                exportDate: new Date().toISOString(),
                version: "1.0.0"
            };
            
            // Créer et télécharger le fichier
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `donnees-completes-outilspratiques-${this.formatDateForFilename(new Date())}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Mettre à jour la date de synchronisation
            this.updateSyncDate();
            
            this.notify('Toutes les données ont été exportées avec succès !');
        } catch (error) {
            console.error("Erreur lors de l'export des données:", error);
            this.notify('Erreur lors de l\'export des données.', true);
        }
    }

    /**
     * Importe toutes les données depuis un fichier JSON
     */
    importAllData(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const importData = JSON.parse(evt.target.result);
                
                if (importData.data && typeof importData.data === 'object') {
                    // Demander confirmation avant d'écraser toutes les données
                    if (confirm('Cette action va remplacer toutes vos données existantes. Voulez-vous continuer ?')) {
                        // Stocker les données
                        Object.keys(importData.data).forEach(key => {
                            localStorage.setItem(key, importData.data[key]);
                        });
                        
                        // Recharger les paramètres et l'interface
                        this.settings = this.loadSettings();
                        this.loadSettingsToUI();
                        
                        // Mettre à jour la date de synchronisation
                        this.updateSyncDate();
                        
                        this.notify('Toutes les données ont été importées avec succès !');
                    }
                } else {
                    this.notify('Fichier invalide. Format de données non reconnu.', true);
                }
            } catch (err) {
                console.error("Erreur pendant l'import:", err);
                this.notify('Erreur lors de l\'import des données.', true);
            }
        };
        
        reader.readAsText(file);
        e.target.value = '';
    }

    clearHistory() {
        if (confirm('Voulez-vous vraiment effacer l\'historique ?')) {
            localStorage.removeItem('history');
            this.notify('Historique effacé.');
        }
    }

    clearAllData() {
        if (confirm('Voulez-vous vraiment effacer toutes les données ? Cette action est irréversible.')) {
            localStorage.clear();
            this.notify('Toutes les données ont été effacées.');
            setTimeout(() => window.location.reload(), 800);
        }
    }

    resetAdvancedSettings() {
        if (confirm('Réinitialiser les paramètres avancés ?')) {
            if (this.settings.advanced) delete this.settings.advanced;
            localStorage.setItem('appSettings', JSON.stringify(this.settings));
            this.loadSettingsToUI();
            this.notify('Paramètres avancés réinitialisés.');
        }
    }

    notify(message, error = false) {
        // Simple notification (à améliorer selon ton système)
        const notif = document.createElement('div');
        notif.textContent = message;
        notif.style.position = 'fixed';
        notif.style.bottom = '30px';
        notif.style.right = '30px';
        notif.style.background = error ? '#e74c3c' : '#4CAF50';
        notif.style.color = '#fff';
        notif.style.padding = '14px 24px';
        notif.style.borderRadius = '8px';
        notif.style.fontWeight = 'bold';
        notif.style.zIndex = 9999;
        notif.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        notif.style.opacity = '0.95';
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.style.transition = 'opacity 0.5s';
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 500);
        }, 2200);
    }

    /**
     * Initialise la gestion du cache
     */
    initCacheManagement() {
        // Vérifier si les éléments essentiels de la synchronisation existent
        // Si on n'est pas sur la page des paramètres ou si l'onglet de synchronisation n'est pas chargé,
        // ces éléments peuvent être absents
        const cacheTab = document.querySelector('.cache-categories');
        if (!cacheTab) {
            console.warn('Éléments de gestion du cache non trouvés, initialisation annulée');
            return;
        }
        
        try {
            this.generateCacheCategories();
            this.updateCacheStats();
            this.loadCachePreferences();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la gestion du cache:', error);
        }
    }

    /**
     * Génère les catégories de ressources à mettre en cache
     */
    generateCacheCategories() {
        const categories = {
            pages: {
                title: 'Pages principales',
                resources: [
                    { path: '/', name: 'Page d\'accueil' },
                    { path: '/index.html', name: 'Index' },
                    { path: '/outils.html', name: 'Liste des outils' }
                ]
            },
            tools: {
                title: 'Outils',
                resources: [
                    { path: 'html/tools/calculator.html', name: 'Calculatrice' },
                    { path: 'html/tools/timer.html', name: 'Minuteur' },
                    { path: 'html/tools/notes.html', name: 'Notes' },
                    { path: 'html/tools/todo.html', name: 'Todo List' }
                ]
            },
            styles: {
                title: 'Styles',
                resources: [
                    { path: '/styles/main.css', name: 'Style principal' },
                    { path: '/styles/variables.css', name: 'Variables CSS' },
                    { path: '/styles/components/theme-switch.css', name: 'Thème' }
                ]
            },
            scripts: {
                title: 'Scripts',
                resources: [
                    { path: '/js/main.js', name: 'Script principal' },
                    { path: '/js/utils.js', name: 'Utilitaires' },
                    { path: '/js/theme.js', name: 'Gestion du thème' }
                ]
            },
            images: {
                title: 'Images et icônes',
                resources: [
                    { path: '../icons/favicon.ico', name: 'Favicon' },
                    { path: '../icons/icon-1024x1024.png', name: 'Icône principale' }
                ]
            }
        };

        // Utiliser le sélecteur de classe au lieu de l'ID
        const cacheCategories = document.querySelector('.cache-categories');
        
        // Vérifier si l'élément existe avant de continuer
        if (!cacheCategories) {
            console.warn('Élément .cache-categories non trouvé, génération des catégories de cache annulée');
            return;
        }
        
        // Effacer le contenu existant et générer le nouveau
        cacheCategories.innerHTML = '';
        Object.entries(categories).forEach(([category, data]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'cache-category';
            categoryDiv.innerHTML = `
                <div class="cache-category-header">
                    <label class="cache-category-checkbox">
                        <input type="checkbox" data-category="${category}">
                        <span>${data.title}</span>
                    </label>
                </div>
                <div class="cache-resources-list">
                    ${data.resources.map(resource => `
                        <label class="cache-resource-item">
                            <input type="checkbox" data-path="${resource.path}" data-category="${category}">
                            <span>${resource.name}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            cacheCategories.appendChild(categoryDiv);
        });

        // Attacher les événements
        this.attachCacheEvents();
    }

    /**
     * Attache les événements aux éléments du cache
     */
    attachCacheEvents() {
        // Sélection/désélection par catégorie
        document.querySelectorAll('.cache-category-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const category = e.target.dataset.category;
                const checked = e.target.checked;
                document.querySelectorAll(`.cache-resource-item input[data-category="${category}"]`)
                    .forEach(input => input.checked = checked);
                this.updateCacheStats();
            });
        });

        // Sélection individuelle
        document.querySelectorAll('.cache-resource-item input').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateCacheStats());
        });
    }

    /**
     * Filtre les ressources selon la recherche
     */
    filterCacheResources() {
        const searchTerm = this.elements.cacheSearch.value.toLowerCase();
        document.querySelectorAll('.cache-resource-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    /**
     * Met à jour les statistiques du cache
     */
    async updateCacheStats() {
        const selectedResources = this.getSelectedResources();
        const count = selectedResources.length;
        
        // Vérifier que l'élément existe avant de l'utiliser
        if (this.elements.cacheSelectedCount) {
            this.elements.cacheSelectedCount.textContent = `${count} ressource${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;
        }

        // Calculer la taille estimée
        let totalSize = 0;
        for (const path of selectedResources) {
            try {
                const response = await fetch(path);
                const blob = await response.blob();
                totalSize += blob.size;
            } catch (error) {
                console.warn(`Impossible de calculer la taille de ${path}`);
            }
        }

        // Mettre à jour l'affichage
        if (this.elements.cacheSize) {
            this.elements.cacheSize.textContent = this.formatSize(totalSize);
        }
        
        // Mettre à jour la barre de progression
        const maxSize = 50 * 1024 * 1024; // 50MB max
        const percentage = Math.min((totalSize / maxSize) * 100, 100);
        
        if (this.elements.cacheProgressBar) {
            this.elements.cacheProgressBar.style.strokeDashoffset = 163.36 - (163.36 * percentage / 100);
        }
        
        if (this.elements.cacheProgressLabel) {
            this.elements.cacheProgressLabel.textContent = `${Math.round(percentage)}%`;
        }
    }

    /**
     * Formate la taille en octets en format lisible
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Ko';
        const k = 1024;
        const sizes = ['Ko', 'Mo', 'Go'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }

    /**
     * Charge les préférences de cache depuis les paramètres
     */
    loadCachePreferences() {
        if (!this.settings.sync || !this.settings.sync.cacheResources) {
            return;
        }
        
        try {
            const resources = this.settings.sync.cacheResources;
            
            // Parcourir toutes les catégories et cocher les ressources correspondantes
            Object.keys(resources).forEach(category => {
                const paths = resources[category];
                
                // Cocher la catégorie si elle contient des ressources
                const categoryCheckbox = document.querySelector(`.cache-category-checkbox input[data-category="${category}"]`);
                if (categoryCheckbox) {
                    categoryCheckbox.checked = paths.length > 0;
                    
                    // Cocher les ressources individuelles
                    paths.forEach(path => {
                        const resourceCheckbox = document.querySelector(`.cache-resource-item input[data-path="${path}"]`);
                        if (resourceCheckbox) resourceCheckbox.checked = true;
                    });
                }
            });
            
            this.updateCacheStats();
        } catch (error) {
            console.error('Erreur lors du chargement des préférences de cache:', error);
        }
    }

    /**
     * Obtient les ressources sélectionnées pour la mise en cache
     */
    getSelectedResources() {
        const selectedResources = [];
        try {
            document.querySelectorAll('.cache-resource-item input:checked').forEach(checkbox => {
                if (checkbox.dataset.path) {
                    selectedResources.push(checkbox.dataset.path);
                }
            });
        } catch (error) {
            console.warn('Erreur lors de la récupération des ressources sélectionnées:', error);
        }
        return selectedResources;
    }

    /**
     * Applique la sélection de ressources à mettre en cache
     */
    applyCacheSelection() {
        // Récupérer toutes les ressources sélectionnées par catégorie
        const resources = {};
        
        document.querySelectorAll('.cache-resource-item input:checked').forEach(checkbox => {
            const path = checkbox.dataset.path;
            const category = checkbox.dataset.category;
            
            if (!resources[category]) resources[category] = [];
            resources[category].push(path);
        });
        
        // Enregistrer les sélections dans les paramètres
        if (!this.settings.sync) this.settings.sync = {};
        this.settings.sync.cacheResources = resources;
        this.settings.sync.lastSyncDate = new Date().toISOString();
        localStorage.setItem('appSettings', JSON.stringify(this.settings));
        
        // Mettre à jour le cache si le mode hors ligne est activé
        if (this.settings.sync.offlineMode) {
            this.updateCache();
        }
        
        this.notify('Sélection des ressources à mettre en cache enregistrée.');
    }

    /**
     * Gère le changement de statut en ligne
     */
    handleOnlineStatus() {
        console.log('Connexion rétablie. Déclenchement de la synchronisation...');
        this.updateConnectionStatus(true);
        dataSyncManager.syncLocalWithDatabase();
    }

    /**
     * Gère le changement de statut hors ligne
     */
    handleOfflineStatus() {
        this.updateConnectionStatus(false);
        this.notify('Connexion Internet perdue. Mode hors ligne activé.', true);
    }

    /**
     * Met à jour les indicateurs visuels de l'état de connexion
     */
    updateConnectionStatus(isOnline = navigator.onLine) {
        if (this.elements.connectionDot && this.elements.connectionText) {
            if (isOnline) {
                this.elements.connectionDot.classList.remove('offline');
                this.elements.connectionDot.classList.add('online');
                this.elements.connectionText.textContent = 'Connecté';
            } else {
                this.elements.connectionDot.classList.remove('online');
                this.elements.connectionDot.classList.add('offline');
                this.elements.connectionText.textContent = 'Hors ligne';
            }
        }
    }

    /**
     * Simule une activation/désactivation du mode hors ligne pour tester
     */
    toggleTestOfflineMode() {
        if (navigator.onLine) {
            // Simuler le mode hors ligne
            this.isTestingOffline = true;
            this.handleOfflineStatus();
            this.elements.testOfflineBtn.innerHTML = '<i class="fas fa-network-wired"></i> Revenir en ligne';
            this.notify('Test du mode hors ligne activé');
            
            // Si le mode hors ligne est activé, on utilise le Service Worker
            if (this.settings.sync?.offlineMode) {
                this.testAppOffline();
            }
        } else if (this.isTestingOffline) {
            // Revenir en ligne
            this.isTestingOffline = false;
            this.handleOnlineStatus();
            this.elements.testOfflineBtn.innerHTML = '<i class="fas fa-network-wired"></i> Tester le mode hors ligne';
            this.notify('Test du mode hors ligne désactivé');
        }
    }

    /**
     * Teste l'application en mode hors ligne
     */
    testAppOffline() {
        this.notify('Ouvrez quelques pages pour tester le fonctionnement hors ligne');
        
        // Éventuellement, on pourrait ajouter ici un bouton pour ouvrir des pages d'exemple
        const testButton = document.createElement('button');
        testButton.classList.add('settings-btn', 'btn-secondary', 'mt-3');
        testButton.innerHTML = '<i class="fas fa-external-link-alt"></i> Ouvrir page d\'accueil (test)';
        testButton.addEventListener('click', () => {
            window.open('../index.html', '_blank');
        });
        
        document.querySelector('.connection-status').appendChild(testButton);
        
        // Auto-retirer le bouton après 10 secondes
        setTimeout(() => {
            testButton.remove();
        }, 10000);
    }

    /**
     * Mise à jour des informations de stockage
     */
    updateStorageInfo() {
        try {
            // Calculer l'espace utilisé
            let usedSpace = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                usedSpace += (key.length + value.length) * 2; // En octets (approximativement)
            }
            
            // Estimer l'espace disponible (5Mo par défaut)
            const availableSpace = 5 * 1024 * 1024; // 5Mo en octets
            
            // Mettre à jour les affichages
            this.elements.storageUsed.textContent = this.formatSize(usedSpace);
            this.elements.storageAvailable.textContent = this.formatSize(availableSpace);
            
            // Mettre à jour la barre de progression
            const percentageUsed = Math.min((usedSpace / availableSpace) * 100, 100);
            if (this.elements.storageBar) {
                this.elements.storageBar.style.width = `${percentageUsed}%`;
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour des infos de stockage:", error);
        }
    }

    /**
     * Sauvegarde les paramètres dans localStorage
     */
    saveSettings() {
        try {
            // Ajouter ou mettre à jour la date de dernière modification avant de sauvegarder
            if (!this.settings.sync) {
                this.settings.sync = {};
            }
            this.settings.sync.lastSyncDate = new Date().toISOString();

            localStorage.setItem('appSettings', JSON.stringify(this.settings));
            console.log("Paramètres sauvegardés localement");

            // Déclencher la synchronisation après la sauvegarde des paramètres si l'utilisateur est connecté
            if (isAuthenticated()) {
                console.log("Paramètres sauvegardés localement. Déclenchement de la synchronisation...");
                dataSyncManager.syncLocalWithDatabase();
            }

        } catch (error) {
            console.error("Erreur lors de la sauvegarde des paramètres:", error);
        }
    }
}

// Initialisation automatique lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Initializing SettingsManager.');
    if (document.getElementById('settings')) {
         const settingsManager = new SettingsManager();
         settingsManager.init();
         // Exposer l'instance si d'autres modules (comme data-sync si nécessaire pour getSettingsManagerInstance) en ont besoin
         window.settingsManagerInstance = settingsManager; // Exemple d'exposition globale
    } else {
         console.log('Settings element not found. SettingsManager not initialized.');
         // On pourrait vouloir initialiser le dataSyncManager même si l'élément settings n'est pas là
         // si d'autres parties de l'app ont besoin de la synchro.
         // Étant donné que settings.js est le point d'entrée pour la synchro auto via init(),
         // il est préférable d'initialiser dataSyncManager via SettingsManager.init().
         // Si settings.js n'est pas chargé sur une page qui utilise data-sync, la synchro auto ne démarrera pas.
         // Il faudrait alors trouver un autre point d'entrée global pour dataSyncManager si nécessaire.
    }
});

// Expose SettingsManager if needed globally (optional)
// window.SettingsManager = new SettingsManager(); // Si vous voulez l'exposer globalement (ancien style)