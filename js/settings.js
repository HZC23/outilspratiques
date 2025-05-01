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
                enabled: false,
                offlineMode: false,
                cacheResources: {
                    pages: ['/', '/index.html', '/outils.html'],
                    tools: ['/tools/calculator.html', '/tools/timer.html', '/tools/notes.html'],
                    styles: ['/styles/main.css', '/styles/variables.css'],
                    scripts: ['/js/main.js', '/js/utils.js'],
                    images: ['/icons/favicon.ico', '/icons/icon-1024x1024.png']
                }
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
        this.applySettings();
        this.initCacheManagement();
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
        this.elements.helpBtn = document.querySelector('.settings-help-btn[data-help]'); // Premier bouton d'aide
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

        // Accessibilité
        this.elements.reduceMotion = document.getElementById('reduce-motion');
        this.elements.highContrast = document.getElementById('high-contrast');
        this.elements.keyboardNavigation = document.getElementById('keyboard-navigation');
        this.elements.lineSpacingSelect = document.getElementById('line-spacing');

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

        // Avancé
        this.elements.developerMode = document.getElementById('developer-mode');
        this.elements.debugLogging = document.getElementById('debug-logging');
        this.elements.apiEndpoint = document.getElementById('api-endpoint');
        this.elements.resetAdvancedBtn = document.getElementById('reset-advanced');
        this.elements.hardwareAcceleration = document.getElementById('hardware-acceleration');
        this.elements.cacheLimit = document.getElementById('cache-limit');

        // Cache management
        this.elements.cacheSearch = document.getElementById('cache-resource-search');
        this.elements.cacheCategories = document.getElementById('cache-categories');
        this.elements.cacheSelectedCount = document.getElementById('cache-selected-count');
        this.elements.cacheSize = document.getElementById('cache-size');
        this.elements.cacheProgressBar = document.getElementById('cache-progress-bar');
        this.elements.cacheProgressLabel = document.getElementById('cache-progress-label');
        this.elements.applyCacheSelection = document.getElementById('apply-cache-selection');
    }
    
    loadSettings() {
        // Charger les paramètres depuis le stockage local
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
        // Général
        if (this.elements.languageSelect) this.elements.languageSelect.value = settings.language || 'fr';
        if (this.elements.startupToolSelect) this.elements.startupToolSelect.value = settings.startupTool || 'home';
        if (this.elements.rememberSession) this.elements.rememberSession.checked = settings.rememberSession || false;
        if (this.elements.autoSave) this.elements.autoSave.checked = settings.autoSave || false;
        if (this.elements.autoSaveInterval) this.elements.autoSaveInterval.value = settings.autoSaveInterval || 30;
        // Apparence
        if (settings.theme) {
            Object.keys(this.elements.themeOptions).forEach(theme => {
                if (this.elements.themeOptions[theme]) {
                    this.elements.themeOptions[theme].checked = (theme === settings.theme);
                }
            });
        }
        if (this.elements.compactMode) this.elements.compactMode.checked = settings.compactMode || false;
        if (this.elements.fontSizeSelect) this.elements.fontSizeSelect.value = settings.fontSize || 'medium';
        // Couleur d'accentuation
        if (this.elements.colorOptions && settings.accentColor) {
            this.highlightSelectedColor(settings.accentColor);
            if (this.elements.customAccentColor) this.elements.customAccentColor.value = settings.accentColor;
        }
        // Accessibilité
        if (this.elements.reduceMotion) this.elements.reduceMotion.checked = settings.reduceMotion || false;
        if (this.elements.highContrast) this.elements.highContrast.checked = settings.highContrast || false;
        if (this.elements.keyboardNavigation) this.elements.keyboardNavigation.checked = settings.keyboardNavigation || false;
        if (this.elements.lineSpacingSelect) this.elements.lineSpacingSelect.value = settings.lineSpacing || '1.5';
        // Confidentialité
        if (this.elements.saveHistory) this.elements.saveHistory.checked = settings.saveHistory || false;
        if (this.elements.localStorage) this.elements.localStorage.checked = settings.localStorage || false;
        // Synchronisation
        if (this.elements.offlineMode) this.elements.offlineMode.checked = settings.offlineMode || false;
        if (this.elements.cacheAssets) this.elements.cacheAssets.checked = settings.cacheAssets || false;
        // Avancé
        if (this.elements.developerMode) this.elements.developerMode.checked = settings.developerMode || false;
        if (this.elements.debugLogging) this.elements.debugLogging.checked = settings.debugLogging || false;
        if (this.elements.apiEndpoint) this.elements.apiEndpoint.value = settings.apiEndpoint || '';
        if (this.elements.hardwareAcceleration) this.elements.hardwareAcceleration.checked = settings.hardwareAcceleration || false;
        if (this.elements.cacheLimit) this.elements.cacheLimit.value = settings.cacheLimit || 50;
        // Application des classes CSS dynamiques
        this.applySettings();
    }

    applySettings() {
        // Apparence dynamique
        document.body.classList.toggle('compact-mode', this.elements.compactMode && this.elements.compactMode.checked);
        document.body.classList.toggle('high-contrast', this.elements.highContrast && this.elements.highContrast.checked);
        document.body.classList.toggle('reduce-motion', this.elements.reduceMotion && this.elements.reduceMotion.checked);
        // Taille de police
        document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
        if (this.elements.fontSizeSelect) {
            document.body.classList.add('font-size-' + this.elements.fontSizeSelect.value);
        }
        // Couleur d'accentuation
        if (this.elements.customAccentColor) {
            document.documentElement.style.setProperty('--accent-color', this.elements.customAccentColor.value);
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
        // Panneau d'aide
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
        // Accessibilité
        if (this.elements.reduceMotion) this.elements.reduceMotion.addEventListener('change', () => { this.updateSetting('accessibility', 'reduceMotion', this.elements.reduceMotion.checked); this.applySettings(); });
        if (this.elements.highContrast) this.elements.highContrast.addEventListener('change', () => { this.updateSetting('accessibility', 'highContrast', this.elements.highContrast.checked); this.applySettings(); });
        if (this.elements.keyboardNavigation) this.elements.keyboardNavigation.addEventListener('change', () => this.updateSetting('accessibility', 'keyboardNavigation', this.elements.keyboardNavigation.checked));
        if (this.elements.lineSpacingSelect) this.elements.lineSpacingSelect.addEventListener('change', () => this.updateSetting('accessibility', 'lineSpacing', this.elements.lineSpacingSelect.value));
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
            accessibility: 'Accessibilité',
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
                this.unregist
        }
    }erServiceWorker();
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

    exportSettings() {
        const data = {
            settings: this.settings
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'parametres-outilspratiques.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.notify('Paramètres exportés avec succès !');
    }

    importSettings(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.settings) {
                    this.settings = data.settings;
                    localStorage.setItem('appSettings', JSON.stringify(this.settings));
                    this.loadSettings();
                    this.notify('Paramètres importés avec succès !');
                } else {
                    this.notify('Fichier invalide.', true);
                }
            } catch (err) {
                this.notify('Erreur lors de l\'import.', true);
            }
        };
        reader.readAsText(file);
        // Réinitialise l'input pour permettre de réimporter le même fichier
        e.target.value = '';
    }

    exportAllData() {
        // Ici, on exporte tous les localStorage (sauf les clés système)
        const allData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            allData[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'donnees-outilspratiques.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.notify('Toutes les données ont été exportées !');
    }

    importAllData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if (typeof data === 'object') {
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, data[key]);
                    });
                    this.loadSettings();
                    this.notify('Toutes les données ont été importées !');
                } else {
                    this.notify('Fichier invalide.', true);
                }
            } catch (err) {
                this.notify('Erreur lors de l\'import.', true);
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
            this.loadSettings();
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
        this.generateCacheCategories();
        this.updateCacheStats();
        this.loadCachePreferences();
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
                    { path: '/tools/calculator.html', name: 'Calculatrice' },
                    { path: '/tools/timer.html', name: 'Minuteur' },
                    { path: '/tools/notes.html', name: 'Notes' },
                    { path: '/tools/todo.html', name: 'Todo List' }
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
                    { path: '/icons/favicon.ico', name: 'Favicon' },
                    { path: '/icons/icon-1024x1024.png', name: 'Icône principale' }
                ]
            }
        };

        this.elements.cacheCategories.innerHTML = '';
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
            this.elements.cacheCategories.appendChild(categoryDiv);
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
        this.elements.cacheSelectedCount.textContent = `${count} ressource${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;

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
        this.elements.cacheSize.textContent = this.formatSize(totalSize);
        
        // Mettre à jour la barre de progression
        const maxSize = 50 * 1024 * 1024; // 50MB max
        const percentage = Math.min((totalSize / maxSize) * 100, 100);
        this.elements.cacheProgressBar.style.strokeDashoffset = 163.36 - (163.36 * percentage / 100);
        this.elements.cacheProgressLabel.textContent = `${Math.round(percentage)}%`;
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
}

// Initialiser le gestionnaire de paramètres lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager();
    settingsManager.init();
});