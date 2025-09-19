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
                saveHistory: true,
                localStorage: true
            },
            sync: {
                enabled: true,
                offlineMode: false,
                lastSyncDate: null,
                cacheAssets: true,
                cacheResources: {
                    pages: ['/', '/index.html', '/outils.html', '/html/settings.html', '/html/privacy-policy.html', '/html/licenses.html'],
                    tools: ['/html/tools/calculator.html', '/html/tools/timer.html', '/html/tools/notes.html', '/html/tools/todo.html'],
                    styles: ['/styles/main.css', '/styles/variables.css', '/styles/settings.css', '/styles/components/header.css', '/styles/components/theme-switch.css', '/styles/components/text.css', '/styles/components/notification.css', '/styles/components/buttons.css', '/styles/components/clock.css', '/styles/fontawesome.css'],
                    scripts: ['/js/main.js', '/js/utils.js', '/js/theme.js', '/js/settings.js', '/js/clock.js', '/js/data-sync.js', '/js/config.js', '/js/supabase.js'],
                    images: ['../favicon.ico', '../icons/icon-1024x1024.png', '../fonts/fa-solid-900.woff2', '../fonts/fa-regular-400.woff2', '../fonts/fa-brands-400.woff2']
                }
            },
            advanced: {
                developerMode: false,
                debugLogging: false,
                apiEndpoint: CONFIG.apiEndpoint || '',
                hardwareAcceleration: true,
                cacheLimit: 50
            }
        };

        // Éléments DOM (à initialiser dans init() si présents)
        this.elements = {};

        // Observer les changements du thème système
        this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.themeMediaQuery.addEventListener('change', this.applyTheme.bind(this));

        // Indicateur de mode hors ligne de test
        this.isTestingOffline = false;

        // Paramètres actuels (à charger depuis localStorage)
        this.settings = this.loadSettings();

         // Référence à l'élément qui a ouvert le panneau d'aide pour restaurer le focus
         this.lastFocusedElementBeforeHelp = null;

    }

    /**
     * Initialise le gestionnaire de paramètres
     */
    init() {
        console.log('SettingsManager initializing...');
        this.cacheElements(); // Met en cache les éléments statiques (et conteneurs dynamiques si présents)

        // Vérifier si nous sommes sur la page des paramètres avant d'initialiser l'UI
        if (!document.getElementById('settings')) {
             console.warn('Settings element not found, skipping UI binding and specialized initialization.');
             // On applique quand même les settings chargés si on est sur une autre page
             this.applySettings();
             // On initialise le dataSyncManager quand même si nécessaire sur d'autres pages
             // dataSyncManager doit pouvoir s'initialiser sans l'UI settings
             dataSyncManager.init(this.settings); // Passe les settings pour la configuration
             // On pourrait vouloir écouter les événements de data-sync globalement même sans l'UI settings
             this.bindGlobalEvents(); // Lier les événements window/document pertinents partout
             return; // Ne pas continuer l'initialisation spécifique à l'UI des paramètres
        }

        console.log('Settings UI found. Proceeding with initialization.');

        // IMPORTANT : Initialiser la gestion du cache UI *avant* de lier les événements globaux
        // spécifiques à l'UI settings, pour s'assurer que les éléments du cache existent
        // et que leurs événements sont attachés *à l'intérieur* d'initCacheManagement.
        this.initCacheManagement(); // Cette méthode génère l'UI du cache, charge les prefs et attache SES événements.


        this.bindEvents(); // Lie les événements aux éléments de l'UI des paramètres (statiques)
        // Note: bindEvents ne doit PAS appeler attachCacheEvents ou initCacheManagement directement.
        // initCacheManagement est appelée ci-dessus une fois.


        this.loadSettingsToUI(); // Charge les valeurs dans l'UI
        this.applySettings(); // Applique les styles et effets des paramètres
        this.updateConnectionStatus(); // Mettre à jour l'état de connexion

         // Initialiser dataSyncManager *après* que les settings aient été chargés
        dataSyncManager.init(this.settings); // Passe les settings pour la configuration
        dataSyncManager.syncLocalWithDatabase(); // Déclenche la synchro initiale si connecté


        // Écouter les changements d'état d'authentification pour déclencher la synchronisation
        document.addEventListener('auth:state-change', (event) => {
            console.log('auth:state-change event received', event.detail);
            if (event.detail.isAuthenticated) {
                console.log('Utilisateur connecté, déclenchement de la synchronisation...');
                // Attendre un court instant pour s'assurer que Supabase est prêt si nécessaire
                setTimeout(() => dataSyncManager.syncLocalWithDatabase(), 100);
            } else {
                console.log('Utilisateur déconnecté. La synchronisation automatique est désactivée jusqu\'à la prochaine connexion.');
            }
        });

        // Écouter l'événement de mise à jour des paramètres synchronisés depuis la base de données
        document.addEventListener('data-sync:settings-updated', () => {
            console.log('Événement data-sync:settings-updated reçu. Rechargement et rafraîchissement de l\'UI des paramètres...');
            this.settings = this.loadSettings(); // Recharger les paramètres depuis localStorage (qui a été mis à jour par dataSyncManager)
            this.loadSettingsToUI(); // Mettre à jour l'UI avec les nouveaux paramètres
            this.applySettings(); // Appliquer les paramètres (thème, taille police, etc.)
            this.updateSyncDateDisplay(); // Mettre à jour l'affichage de la date de synchro
            // Régénérer et recharger les préférences du cache si l'UI est visible et potentiellement affectée par la synchro des settings
             this.initCacheManagement(); // Cela regénère l'UI du cache, ré-attache les events et recharge les préférences sauvegardées.
        });

         // Écouter les événements de statut de synchronisation
         document.addEventListener('data-sync:status', (event) => {
            console.log('Événement data-sync:status reçu:', event.detail);
             if (event.detail.success) {
                 this.updateSyncDateDisplay(); // Mettre à jour la date si la synchro a réussi
             }
         });

         // Lier les événements globaux non spécifiques à l'UI settings (online/offline etc.)
         this.bindGlobalEvents();


        // Appliquer immédiatement la navigation vers l'onglet par défaut ou sauvegardé
        const activeTab = localStorage.getItem('settingsActiveTab') || 'general';
        this.switchTab(activeTab);

        console.log('SettingsManager initialized.');
    }

     /**
      * Lie les événements globaux non spécifiques à l'UI settings (utiles sur toutes les pages)
      * Peut être appelée même si l'UI settings n'est pas présente.
      */
     bindGlobalEvents() {
          console.log('Binding global events...');
          // Online/offline events
         window.addEventListener('online', () => this.handleOnlineStatus());
         window.addEventListener('offline', () => this.handleOfflineStatus());

         // Raccourcis clavier (peut être global si nécessaire)
         document.addEventListener('keydown', (e) => {
            // Si le panneau d'aide est ouvert sur la page settings
            if (document.getElementById('settings') && e.key === 'Escape' && this.elements.helpPanel && this.elements.helpPanel.classList.contains('active')) {
                this.hideHelpPanel();
            }
             // Ajouter d'autres raccourcis clavier globaux ici si pertinent
         });

         // Écouter les messages du Service Worker (peut arriver sur n'importe quelle page)
         if ('serviceWorker' in navigator) {
              navigator.serviceWorker.addEventListener('message', (event) => {
                   // console.log('Message from Service Worker:', event.data);
                  if (event.data.type === 'CACHE_PROGRESS' && document.getElementById('settings')) { // N'afficher la progression que si on est sur la page settings
                      this.updateCacheProgress(event.data.progress, event.data.message);
                       this.updateCacheStatusText(event.data.message || 'Mise à jour en cours...');
                  } else if (event.data.type === 'CACHE_COMPLETE' && document.getElementById('settings')) {
                      this.updateCacheProgress(100, event.data.message || 'Mise en cache terminée');
                      this.notify(event.data.message || 'Mise en cache terminée avec succès.');
                      this.updateCacheStatusText('À jour');
                  } else if (event.data.type === 'CACHE_ERROR' && document.getElementById('settings')) {
                      console.error('Service Worker Cache Error:', event.data.message);
                      this.notify('Erreur de mise en cache : ' + (event.data.message || 'inconnu'), true);
                       this.updateCacheStatusText('Erreur');
                  } else if (event.data.type === 'CACHE_STATUS' && document.getElementById('settings')) {
                       this.updateCacheStatusText(event.data.status);
                  }
              });
         }

         console.log('Global events bound.');
     }


    /**
     * Met en cache les éléments DOM pour les performances
     */
    cacheElements() {
        console.log('Caching DOM elements...');
        // Navigation
        this.elements.navItems = document.querySelectorAll('.settings-nav-item');
        this.elements.tabs = document.querySelectorAll('.settings-tab');

        // Panneau d'aide
        this.elements.helpPanel = document.getElementById('help-panel');
        this.elements.helpBtns = document.querySelectorAll('.settings-help-btn[data-help]'); // Tous les boutons d'aide
        this.elements.closeHelpBtn = document.getElementById('close-help');
        this.elements.helpTitle = document.getElementById('help-title'); // Ajout pour le titre de l'aide

        // Général
        this.elements.languageSelect = document.getElementById('language-select'); // Ajout de l'élément langue
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
        this.elements.customColorPickerContainer = document.querySelector('.custom-color-picker'); // Conteneur du sélecteur perso
        this.elements.customAccentColorInput = document.getElementById('custom-color'); // Input couleur perso
        this.elements.compactMode = document.getElementById('compact-mode');
        this.elements.fontSizeSelect = document.getElementById('font-size');

        // Confidentialité
        this.elements.saveHistory = document.getElementById('save-history');
        this.elements.localStorageToggle = document.getElementById('local-storage'); // Renommé pour clarté
        this.elements.clearHistoryBtn = document.getElementById('clear-history');
        this.elements.clearAllDataBtn = document.getElementById('clear-all-data');

        // Stockage (dans Confidentialité)
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
        this.elements.offlineModeToggle = document.getElementById('offline-mode'); // Renommé
        this.elements.cacheAssetsToggle = document.getElementById('cache-assets'); // Renommé
        this.elements.updateCacheBtn = document.getElementById('update-cache');
        this.elements.lastSyncDateDisplay = document.getElementById('last-sync-date'); // Renommé pour clarté
        this.elements.connectionDot = document.getElementById('connection-dot');
        this.elements.connectionText = document.getElementById('connection-text');
        this.elements.testOfflineBtn = document.getElementById('test-offline');

        // Gestion du cache hors ligne (dans Synchronisation)
        this.elements.cacheSearchInput = document.getElementById('cache-resource-search'); // Renommé
        this.elements.cacheCategoriesContainer = document.querySelector('.cache-categories'); // Ajout conteneur catégories
        this.elements.cacheSelectedCountDisplay = document.getElementById('cache-selected-count'); // Ajout pour le compteur
        this.elements.cacheTotalSizeDisplay = document.getElementById('cache-total-size'); // Ajout pour la taille totale
        this.elements.cacheProgressCircle = document.getElementById('cache-progress-circle'); // Ajout pour la barre de progression SVG
        this.elements.cacheProgressLabel = document.getElementById('cache-progress-label'); // Ajout pour le label de progression
        this.elements.cacheStatusText = document.getElementById('cache-status-text'); // Ajout pour le statut du cache
        this.elements.applyCacheSelectionBtn = document.getElementById('apply-cache-selection'); // Renommé

        // Avancé
        this.elements.developerModeToggle = document.getElementById('developer-mode'); // Renommé
        this.elements.debugLoggingToggle = document.getElementById('debug-logging'); // Renommé
        this.elements.apiEndpointInput = document.getElementById('api-endpoint'); // Renommé
        this.elements.resetAdvancedBtn = document.getElementById('reset-advanced');
        this.elements.hardwareAccelerationToggle = document.getElementById('hardware-acceleration'); // Renommé
        this.elements.cacheLimitInput = document.getElementById('cache-limit'); // Renommé

         console.log('DOM elements cached.');
    }
    
    /**
     * Charge les paramètres depuis localStorage
     * @returns {Object} Les paramètres chargés ou les paramètres par défaut
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            if (savedSettings) {
                const loadedSettings = JSON.parse(savedSettings);
                 console.log("Paramètres chargés depuis localStorage:", loadedSettings);
                // Fusionner avec les paramètres par défaut pour les nouveaux paramètres non présents dans la sauvegarde
                // Utiliser Utils.deepMerge si des objets imbriqués doivent être fusionnés récursivement
                // Pour l'instant, une fusion superficielle suffit si la structure est plate au premier niveau
                // Assurer que Utils existe ou implémenter deepMerge ici
                if (Utils && Utils.deepMerge) {
                     return Utils.deepMerge(this.defaultSettings, loadedSettings);
                } else {
                     console.warn("Utils.deepMerge not available, performing shallow merge for settings.");
                     return { ...this.defaultSettings, ...loadedSettings };
                }

            }
        } catch (error) {
            console.error("Erreur lors du chargement des paramètres depuis localStorage:", error);
        }
        console.log("Aucun paramètre trouvé dans localStorage ou erreur, utilisation des paramètres par défaut.");
        return this.defaultSettings;
    }
    
    /**
     * Sauvegarde les paramètres dans localStorage
     */
    saveSettings() {
        try {
            // Mettre à jour la date de dernière modification avant de sauvegarder
            if (!this.settings.sync) {
                this.settings.sync = {};
            }
            this.settings.sync.lastSyncDate = new Date().toISOString();

            localStorage.setItem('appSettings', JSON.stringify(this.settings));
            console.log("Paramètres sauvegardés localement:", this.settings);

            // Déclencher la synchronisation après la sauvegarde des paramètres si l'utilisateur est connecté
            if (isAuthenticated()) {
                console.log("Paramètres sauvegardés localement. Déclenchement de la synchronisation...");
                dataSyncManager.syncLocalWithDatabase(); // dataSyncManager doit être importé et fonctionnel
            }

        } catch (error) {
            console.error("Erreur lors de la sauvegarde des paramètres dans localStorage:", error);
             this.notify('Erreur lors de la sauvegarde des paramètres.', true);
        }
    }

    /**
     * Applique les paramètres chargés aux éléments de l'interface
     * Ne modifie QUE l'interface HTML des settings
     */
    loadSettingsToUI() {
        console.log('Loading settings to UI...');
        // Vérifier si les éléments de l'UI existent avant de tenter de les charger
        if (!document.getElementById('settings')) {
             console.warn('Settings UI elements not found, skipping loadSettingsToUI.');
             return;
        }

        const settings = this.settings;

        // Général
        if (this.elements.languageSelect) this.elements.languageSelect.value = settings.general?.language || this.defaultSettings.general.language;
        if (this.elements.startupToolSelect) this.elements.startupToolSelect.value = settings.general?.startupTool || this.defaultSettings.general.startupTool;
        if (this.elements.rememberSession) this.elements.rememberSession.checked = settings.general?.rememberSession ?? this.defaultSettings.general.rememberSession;
        if (this.elements.autoSave) this.elements.autoSave.checked = settings.general?.autoSave ?? this.defaultSettings.general.autoSave;
        // Assurer que l'intervalle est un nombre et dans les limites min/max si l'input est de type number
        const autoSaveIntervalValue = parseInt(settings.general?.autoSaveInterval) || this.defaultSettings.general.autoSaveInterval;
        if (this.elements.autoSaveInterval) {
             this.elements.autoSaveInterval.value = Math.max(parseInt(this.elements.autoSaveInterval.min) || 15, Math.min(parseInt(this.elements.autoSaveInterval.max) || 600, autoSaveIntervalValue));
        }


        // Apparence
        if (settings.appearance?.theme) {
            Object.keys(this.elements.themeOptions).forEach(theme => {
                if (this.elements.themeOptions[theme]) {
                    this.elements.themeOptions[theme].checked = (theme === settings.appearance.theme);
                }
            });
        }
        if (this.elements.compactMode) this.elements.compactMode.checked = settings.appearance?.compactMode ?? this.defaultSettings.appearance.compactMode;
        if (this.elements.fontSizeSelect) this.elements.fontSizeSelect.value = settings.appearance?.fontSize || this.defaultSettings.appearance.fontSize;

        // Couleur d'accentuation
        const accentColor = settings.appearance?.accentColor || this.defaultSettings.appearance.accentColor;
        if (this.elements.colorOptions && this.elements.customAccentColorInput && this.elements.customColorPickerContainer) {
             this.elements.customAccentColorInput.value = accentColor;
             // Déterminer si la couleur est une des options prédéfinies ou custom
             const predefinedColors = Array.from(this.elements.colorOptions).map(opt => opt.dataset.color).filter(c => c !== 'custom');
             const isPredefined = predefinedColors.includes(accentColor);
             // Appeler highlightSelectedColor pour mettre à jour l'UI de sélection
             this.highlightSelectedColor(isPredefined ? accentColor : 'custom');
        }


        // Confidentialité
        if (this.elements.saveHistory) this.elements.saveHistory.checked = settings.privacy?.saveHistory ?? this.defaultSettings.privacy.saveHistory;
        if (this.elements.localStorageToggle) this.elements.localStorageToggle.checked = settings.privacy?.localStorage ?? this.defaultSettings.privacy.localStorage;

        // Synchronisation
        if (this.elements.offlineModeToggle) {
             this.elements.offlineModeToggle.checked = settings.sync?.offlineMode ?? this.defaultSettings.sync.offlineMode;
              // Gérer l'état disabled de cacheAssetsToggle ici
              const swSupported = 'serviceWorker' in navigator;
              this.elements.cacheAssetsToggle.disabled = !swSupported || !this.elements.offlineModeToggle.checked;
         }
        if (this.elements.cacheAssetsToggle) {
             this.elements.cacheAssetsToggle.checked = settings.sync?.cacheAssets ?? this.defaultSettings.sync.cacheAssets;
         }

        this.updateSyncDateDisplay(); // Afficher la date de dernière synchro
        this.updateConnectionStatus(); // Mettre à jour l'indicateur de connexion

        // Gestion du cache hors ligne UI (checkboxes, stats) - Ceci est géré par initCacheManagement lors de l'ouverture de l'onglet Sync

        // Avancé
        if (this.elements.developerModeToggle) this.elements.developerModeToggle.checked = settings.advanced?.developerMode ?? this.defaultSettings.advanced.developerMode;
        if (this.elements.debugLoggingToggle) this.elements.debugLoggingToggle.checked = settings.advanced?.debugLogging ?? this.defaultSettings.advanced.debugLogging;
        if (this.elements.apiEndpointInput) this.elements.apiEndpointInput.value = settings.advanced?.apiEndpoint || this.defaultSettings.advanced.apiEndpoint;
        if (this.elements.hardwareAccelerationToggle) this.elements.hardwareAccelerationToggle.checked = settings.advanced?.hardwareAcceleration ?? this.defaultSettings.advanced.hardwareAcceleration;
        // Assurer que la limite de cache est un nombre et dans les limites min/max
        const cacheLimitValue = parseInt(settings.advanced?.cacheLimit) || this.defaultSettings.advanced.cacheLimit;
        if (this.elements.cacheLimitInput) {
             this.elements.cacheLimitInput.value = Math.max(parseInt(this.elements.cacheLimitInput.min) || 1, Math.min(parseInt(this.elements.cacheLimitInput.max) || 500, cacheLimitValue));
        }


        // Application des classes CSS dynamiques et autres effets visuels (appliqués sur body/root)
        // Ceci devrait être appelé après avoir chargé les valeurs dans l'UI, car applySettings
        // se base sur this.settings.
        // this.applySettings(); // Cet appel est déjà à la fin de init()


        // Affichage du stockage utilisé (dans Confidentialité)
        this.updateStorageInfo();


        console.log('Settings loaded to UI.');
    }

    /**
     * Applique les paramètres au style global (CSS Variables, classes body) et à d'autres fonctionnalités globales.
     * Doit être appelée après loadSettings(). Peut être appelée indépendamment de l'UI settings.
     */
    applySettings() {
        console.log('Applying settings...');
        const settings = this.settings;
        const body = document.body;

        // Mode compact (classe sur body)
        body.classList.toggle('compact-mode', settings.appearance?.compactMode ?? this.defaultSettings.appearance.compactMode);

        // Taille de police (classe sur body)
        const fontSize = settings.appearance?.fontSize || this.defaultSettings.appearance.fontSize;
        body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
        body.classList.add('font-size-' + fontSize);

        // Couleur d'accentuation (variable CSS sur :root)
        const accentColor = settings.appearance?.accentColor || this.defaultSettings.appearance.accentColor;
        document.documentElement.style.setProperty('--accent-color', accentColor);
        // Mettre à jour la variable RGB pour les shadows et transparents
        try {
            const hex = accentColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
             document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
             // Mettre à jour la couleur transparente
             document.documentElement.style.setProperty('--accent-color-transparent', `rgba(${r}, ${g}, ${b}, 0.2)`);
        } catch (e) {
            console.warn('Could not parse accent color for RGB/transparent calculation', accentColor, e);
             // Fallback to default if parsing fails
             document.documentElement.style.setProperty('--accent-color-rgb', '74, 144, 226'); // Default blue RGB
             document.documentElement.style.setProperty('--accent-color-transparent', 'rgba(74, 144, 226, 0.2)'); // Default blue transparent
        }


        // Appliquer le thème (classes sur body)
        this.applyTheme();

        // Mode développeur (classe sur body, pour styles ou scripts conditionnels)
        if (settings.advanced?.developerMode) {
             body.classList.add('developer-mode');
             // console.warn("Mode développeur activé."); // Peut être trop verbeux à chaque application
        } else {
             body.classList.remove('developer-mode');
        }

         // Journalisation des erreurs (juste un log ici, l'implémentation réelle dépend de comment tu gères les logs)
         if (settings.advanced?.debugLogging) {
             // console.log("Journalisation des erreurs activée."); // Trop verbeux
              // Activer une logique de logging plus verbeuse ou envoyer les logs à un service
         } else {
              // Désactiver le logging verbeux
         }

         // Accélération matérielle (classe sur body, pour styles ou scripts conditionnels, ex: translateZ(0))
         // L'ajout d'une classe peut être un hook pour du CSS ou d'autres scripts
         if (settings.advanced?.hardwareAcceleration) {
             body.classList.add('hardware-acceleration');
         } else {
             body.classList.remove('hardware-acceleration');
         }

         // L'API Endpoint n'est généralement pas appliquée via CSS ou classe, mais lue par les modules qui en ont besoin.
         // La limite de cache est une indication UI/logique, pas un style direct.

        console.log('Settings applied.');
    }

    /**
     * Applique le thème en fonction des paramètres et des préférences système.
     * Gère les classes 'theme-dark' et 'theme-light' sur le body.
     */
    applyTheme() {
        console.log('Applying theme...');
        const settings = this.settings.appearance || this.defaultSettings.appearance;
        const theme = settings.theme || 'system';
        const body = document.body;

        // Supprimer les classes de thème existantes
        body.classList.remove('theme-dark', 'theme-light');

        if (theme === 'system') {
            // Suivre les préférences du système
            const isDarkMode = this.themeMediaQuery.matches;
            body.classList.toggle('theme-dark', isDarkMode);
            body.classList.toggle('theme-light', !isDarkMode);
             // console.log(`Appliquant thème système: ${isDarkMode ? 'sombre' : 'clair'}`);
        } else {
            // Appliquer le thème choisi
            body.classList.toggle('theme-dark', theme === 'dark');
            body.classList.toggle('theme-light', theme === 'light');
             // console.log(`Appliquant thème choisi: ${theme}`);
        }

        // Mettre à jour l'interface du switch de thème dans l'en-tête si présent
        const headerThemeSwitchCheckbox = document.querySelector('.theme-switch__checkbox'); // Assurez-vous que ce sélecteur est correct
        if (headerThemeSwitchCheckbox) {
             // L'état 'checked' du switch Uiverse contrôle l'apparence soleil/lune.
             // On le base sur si le mode sombre *est appliqué* (soit choisi, soit par système)
             const isDarkModeApplied = body.classList.contains('theme-dark');
             headerThemeSwitchCheckbox.checked = isDarkModeApplied;
             // Note : Le composant Uiverse ne permet pas facilement de refléter l'état 'system' visuellement différent de 'light' ou 'dark'.
        }
         console.log('Theme applied.');
    }

    /**
     * Met en évidence l'option de couleur d'accentuation sélectionnée dans l'interface des paramètres.
     * @param {string} color - La couleur hex (#RRGGBB) ou 'custom'
     */
    highlightSelectedColor(color) {
        console.log('Highlighting selected color:', color);
        if (!this.elements.colorOptions || !this.elements.customAccentColorInput || !this.elements.customColorPickerContainer) {
            console.warn('Color options or custom color picker elements not found. Skipping highlightSelectedColor.');
            return;
        }

        // Supprimer la classe active de toutes les options de couleur
        this.elements.colorOptions.forEach(option => {
            option.classList.remove('active');
        });

         const customOption = document.querySelector('.color-option.custom');

         // Vérifier si la couleur active est l'une des couleurs prédéfinies
         const predefinedColors = Array.from(this.elements.colorOptions).map(opt => opt.dataset.color).filter(c => c !== 'custom');
         const isPredefined = predefinedColors.includes(color);

         if (isPredefined) {
             // Si c'est une couleur prédéfinie, activer l'option correspondante
             const activeOption = document.querySelector(`.color-option[data-color="${color}"]`);
             if (activeOption) {
                 activeOption.classList.add('active');
             }
             // Cacher le sélecteur personnalisé
             if (this.elements.customColorPickerContainer) {
                 this.elements.customColorPickerContainer.classList.add('d-none');
             }
         } else {
             // Si ce n'est pas une couleur prédéfinie, c'est une couleur personnalisée
             if (customOption) {
                 customOption.classList.add('active'); // Activer l'option "custom"
             }
             // Afficher le sélecteur personnalisé et s'assurer que sa valeur est la couleur actuelle
             if (this.elements.customColorPickerContainer) {
                 this.elements.customColorPickerContainer.classList.remove('d-none');
             }
             // S'assurer que l'input color a la valeur hex actuelle si elle est personnalisée
             if (this.elements.customAccentColorInput) {
                 this.elements.customAccentColorInput.value = color;
             }
         }
         console.log('Color highlighting updated.');
    }


    /**
     * Attache les événements aux éléments de l'interface des paramètres (éléments statiques principalement).
     * Les événements pour la gestion du cache sont attachés dans initCacheManagement.
     */
    bindEvents() {
        console.log('Binding settings UI events...');
        // Vérifier si les éléments de l'UI existent
        if (!document.getElementById('settings')) {
             console.warn('Settings UI elements not found, skipping bindEvents.');
             return;
        }

        // Navigation entre les onglets
        if (this.elements.navItems) {
            this.elements.navItems.forEach(item => {
                item.addEventListener('click', () => {
                    this.switchTab(item.dataset.tab);
                    // Optionnel: sauvegarder l'onglet actif
                    localStorage.setItem('settingsActiveTab', item.dataset.tab);
                });
                 // Rendre les éléments nav cliquables et accessibles
                 item.setAttribute('role', 'tab');
                 item.setAttribute('aria-controls', item.dataset.tab); // Associer au panneau de contenu
                 item.setAttribute('tabindex', '-1'); // Ne pas être tabulable par défaut par défaut
            });
             // Rendre le premier onglet tabulable par défaut
             const firstNavItem = this.elements.navItems[0];
             if (firstNavItem) {
                 firstNavItem.setAttribute('tabindex', '0');
             }
             // TODO: Gérer la navigation au clavier entre les onglets (flèches gauche/droite) pour l'accessibilité
        }


        // Panneau d'aide
        if (this.elements.helpBtns) {
            this.elements.helpBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Sauvegarder l'élément qui a déclenché l'ouverture pour y revenir après fermeture
                    this.lastFocusedElementBeforeHelp = e.target;
                    const tab = btn.getAttribute('data-help');
                    this.showHelpPanel(tab);
                });
                 btn.setAttribute('aria-haspopup', 'dialog');
                 btn.setAttribute('aria-expanded', 'false'); // Initialement fermé
            });
        }

        if (this.elements.closeHelpBtn) {
            this.elements.closeHelpBtn.addEventListener('click', () => this.hideHelpPanel());
        }

        // Fermer le panneau d'aide en cliquant à l'extérieur (sur l'overlay)
         if (this.elements.helpPanel) {
             // Ajouter un écouteur click sur le panneau lui-même
             this.elements.helpPanel.addEventListener('click', (e) => {
                 // Si la cible du clic est le panneau lui-même (et non un de ses enfants)
                 // OU si l'événement vient d'une zone spécifique de l'overlay si vous utilisez un ::before
                 // Une vérification simple: si la cible n'est PAS un enfant du contenu ou de l'en-tête
                 const isClickInsideContentOrHeader = e.target.closest('.help-panel-content, .help-panel-header');
                 // Et s'assurer que le clic est bien sur le panneau "parent" si vous avez un overlay en ::before
                 // Ou simplement vérifier si l'ID de la cible est bien 'help-panel' (si le clic sur l'overlay atteint cet élément)
                 if (!isClickInsideContentOrHeader && e.target.id === 'help-panel') {
                      this.hideHelpPanel();
                 }
             });
         }


        // Général
        if (this.elements.languageSelect) this.elements.languageSelect.addEventListener('change', (e) => this.updateSetting('general', 'language', e.target.value));
        if (this.elements.startupToolSelect) this.elements.startupToolSelect.addEventListener('change', (e) => this.updateSetting('general', 'startupTool', e.target.value));
        if (this.elements.rememberSession) this.elements.rememberSession.addEventListener('change', (e) => this.updateSetting('general', 'rememberSession', e.target.checked));
        if (this.elements.autoSave) this.elements.autoSave.addEventListener('change', (e) => this.updateSetting('general', 'autoSave', e.target.checked));
        if (this.elements.autoSaveInterval) this.elements.autoSaveInterval.addEventListener('change', (e) => this.updateSetting('general', 'autoSaveInterval', parseInt(e.target.value)));

        // Apparence
        if (this.elements.themeOptions) {
            Object.keys(this.elements.themeOptions).forEach(theme => {
                if (this.elements.themeOptions[theme]) {
                    this.elements.themeOptions[theme].addEventListener('change', (e) => {
                        if (e.target.checked) {
                            this.updateSetting('appearance', 'theme', theme);
                        }
                    });
                }
            });
        }

        if (this.elements.colorOptions) {
            this.elements.colorOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const color = option.dataset.color;
                    if (color === 'custom') {
                         // Déclencher l'ouverture du sélecteur natif si l'input existe
                         if (this.elements.customAccentColorInput) {
                              this.elements.customAccentColorInput.click();
                         }
                         // Afficher l'input couleur personnalisé si le conteneur existe
                         if (this.elements.customColorPickerContainer) {
                             this.elements.customColorPickerContainer.classList.remove('d-none');
                         }
                         this.highlightSelectedColor('custom'); // Mettre en évidence l'option "custom" visuellement
                    } else {
                         // Cacher le sélecteur personnalisé si le conteneur existe
                         if (this.elements.customColorPickerContainer) {
                             this.elements.customColorPickerContainer.classList.add('d-none');
                         }
                        this.updateSetting('appearance', 'accentColor', color);
                        this.highlightSelectedColor(color);
                    }
                });
            });
        }

        if (this.elements.customAccentColorInput) {
             // Utiliser 'input' pour mise à jour en temps réel pendant le changement de couleur
            this.elements.customAccentColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                this.updateSetting('appearance', 'accentColor', color);
                 this.highlightSelectedColor('custom'); // S'assurer que "Custom" est sélectionné visuellement
            });
             // Optionnel: Utiliser 'change' si vous voulez que la mise à jour ne se fasse qu'après la fermeture du sélecteur natif
             // this.elements.customAccentColorInput.addEventListener('change', (e) => { ... });
        }

        if (this.elements.compactMode) this.elements.compactMode.addEventListener('change', (e) => this.updateSetting('appearance', 'compactMode', e.target.checked));
        if (this.elements.fontSizeSelect) this.elements.fontSizeSelect.addEventListener('change', (e) => this.updateSetting('appearance', 'fontSize', e.target.value));

        // Confidentialité
        if (this.elements.saveHistory) this.elements.saveHistory.addEventListener('change', (e) => this.updateSetting('privacy', 'saveHistory', e.target.checked));
        if (this.elements.localStorageToggle) this.elements.localStorageToggle.addEventListener('change', (e) => this.updateSetting('privacy', 'localStorage', e.target.checked));
        if (this.elements.clearHistoryBtn) this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        if (this.elements.clearAllDataBtn) this.elements.clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        
        // Synchronisation
        if (this.elements.exportSettingsBtn) this.elements.exportSettingsBtn.addEventListener('click', () => this.exportSettings());
        if (this.elements.importSettingsBtn) this.elements.importSettingsBtn.addEventListener('click', () => {
             // Déclencher le clic sur l'input type="file" associé
             if (this.elements.importFile) this.elements.importFile.click();
             else console.error('Element importFile not found');
        });
        if (this.elements.importFile) this.elements.importFile.addEventListener('change', (e) => this.importSettings(e));
        if (this.elements.exportAllDataBtn) this.elements.exportAllDataBtn.addEventListener('click', () => this.exportAllData());
        if (this.elements.importAllDataBtn) this.elements.importAllDataBtn.addEventListener('click', () => {
             // Déclencher le clic sur l'input type="file" associé
             if (this.elements.importAllFile) this.elements.importAllFile.click();
             else console.error('Element importAllFile not found');
        });
         // L'événement 'change' sur l'input file est géré séparément
        if (this.elements.importAllFile) this.elements.importAllFile.addEventListener('change', (e) => this.importAllData(e));


        if (this.elements.offlineModeToggle) {
             this.elements.offlineModeToggle.addEventListener('change', (e) => {
                 this.updateSetting('sync', 'offlineMode', e.target.checked);
                  // Gérer l'état disabled de cacheAssetsToggle ici
                  const swSupported = 'serviceWorker' in navigator;
                  this.elements.cacheAssetsToggle.disabled = !swSupported || !e.target.checked;
             });
         }
        if (this.elements.cacheAssetsToggle) {
             this.elements.cacheAssetsToggle.addEventListener('change', (e) => this.updateSetting('sync', 'cacheAssets', e.target.checked));
         }

         // Le bouton updateCacheBtn et testOfflineBtn sont spécifiques à la section Sync et leur logique
         // est plus étroitement liée à la gestion du cache/mode hors ligne.
         // Leurs événements sont attachés dans initCacheManagement maintenant.
         // if (this.elements.updateCacheBtn) this.elements.updateCacheBtn.addEventListener('click', () => this.updateCache()); // Moved
         // if (this.elements.testOfflineBtn) this.elements.testOfflineBtn.addEventListener('click', () => this.toggleTestOfflineMode()); // Moved


        // Gestion du cache (événements spécifiques aux éléments générés dynamiquement ou à cette section)
        // Les événements pour les checkboxes de ressources et de catégories sont attachés DANS attachCacheEvents,
        // qui est appelé par initCacheManagement.
        // Les événements pour la recherche et l'application de la sélection sont attachés dans initCacheManagement.


        // Avancé
        if (this.elements.developerModeToggle) this.elements.developerModeToggle.addEventListener('change', (e) => this.updateSetting('advanced', 'developerMode', e.target.checked));
        if (this.elements.debugLoggingToggle) this.elements.debugLoggingToggle.addEventListener('change', (e) => this.updateSetting('advanced', 'debugLogging', e.target.checked));
        if (this.elements.apiEndpointInput) this.elements.apiEndpointInput.addEventListener('input', (e) => this.updateSetting('advanced', 'apiEndpoint', e.target.value));
        if (this.elements.resetAdvancedBtn) this.elements.resetAdvancedBtn.addEventListener('click', () => this.resetAdvancedSettings());
        if (this.elements.hardwareAccelerationToggle) this.elements.hardwareAccelerationToggle.addEventListener('change', (e) => this.updateSetting('advanced', 'hardwareAcceleration', e.target.checked));
        if (this.elements.cacheLimitInput) this.elements.cacheLimitInput.addEventListener('change', (e) => this.updateSetting('advanced', 'cacheLimit', parseInt(e.target.value)));


        // Les raccourcis clavier globaux sont gérés dans bindGlobalEvents.

        console.log('Settings UI events bound.');
    }

    /**
     * Change l'onglet actif dans les paramètres
     * @param {string} tab - L'ID de l'onglet à activer
     */
    switchTab(tab) {
         console.log('Switching to tab:', tab);
        // Cacher tous les onglets de contenu
        if (this.elements.tabs) {
             this.elements.tabs.forEach(t => {
                t.classList.remove('active');
                 t.setAttribute('aria-hidden', 'true'); // Cacher pour les lecteurs d'écran
             });
        }

        // Activer l'onglet cible
        const activeTab = document.getElementById(tab);
        if (activeTab) {
            activeTab.classList.add('active');
             activeTab.setAttribute('aria-hidden', 'false'); // Afficher pour les lecteurs d'écran
             // Déplacer le focus si nécessaire pour l'accessibilité
             activeTab.setAttribute('tabindex', '0'); // Rendre le panneau focusable
             // activeTab.focus(); // Optionnel: mettre le focus sur le panneau
        }


        // Mettre à jour la navigation latérale
        if (this.elements.navItems) {
            this.elements.navItems.forEach(item => {
                 const isSelected = item.dataset.tab === tab;
                item.classList.toggle('active', isSelected);
                 item.setAttribute('aria-selected', isSelected); // Indiquer l'onglet sélectionné
                 item.setAttribute('tabindex', isSelected ? '0' : '-1'); // Rendre uniquement l'onglet actif tabulable
            });
        }


         // Cacher le panneau d'aide si un autre onglet est sélectionné
         this.hideHelpPanel();

         // Si l'onglet Synchronisation est activé, s'assurer que la gestion du cache est initialisée
         // Ceci est déjà fait une fois dans init(), mais le faire ici à l'activation de l'onglet
         // peut être utile si l'UI du cache est générée conditionnellement.
         // Cependant, comme initCacheManagement est appelée à chaque data-sync:settings-updated,
         // il vaut mieux la laisser dans init() et dans l'écouteur de l'événement data-sync.
         // this.initCacheManagement(); // Déplacé / Géré différemment

         console.log('Tab switched to:', tab);
    }

    /**
     * Affiche le panneau d'aide pour une section donnée
     * @param {string} tab - L'ID de la section d'aide à afficher (ex: 'general', 'appearance')
     */
    showHelpPanel(tab) {
        console.log('Showing help panel for:', tab);
        if (!this.elements.helpPanel || !this.elements.helpTitle) {
             console.warn('Help panel or title elements not found.');
             return; // Sortir si les éléments ne sont pas présents
        }

        // Mettre à jour aria-expanded sur le bouton qui a ouvert l'aide (si on l'a sauvegardé)
         if (this.lastFocusedElementBeforeHelp) {
             this.lastFocusedElementBeforeHelp.setAttribute('aria-expanded', 'true');
         }

        // Assurez-vous que le panneau est visible
        this.elements.helpPanel.classList.add('active');
        this.elements.helpPanel.setAttribute('aria-hidden', 'false');
         this.elements.helpPanel.setAttribute('tabindex', '-1'); // Rendre le panneau focusable pour y déplacer le focus

        // Cacher toutes les sections d'aide
        document.querySelectorAll('.help-panel-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Afficher la section d'aide correspondante
        const sectionId = `help-${tab}`;
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('d-none');
             // Mettre le focus sur le panneau d'aide pour l'accessibilité
             this.elements.helpPanel.focus();
        } else {
             console.warn(`Help section with ID "${sectionId}" not found.`);
             // Optionnel: Afficher un message par défaut ou cacher le panneau si la section n'existe pas
             // this.hideHelpPanel();
        }

        // Met à jour le titre du panneau d'aide
        const titleMap = {
            general: 'Général',
            appearance: 'Apparence',
            privacy: 'Confidentialité',
            sync: 'Synchronisation',
            advanced: 'Avancé',
            about: 'À propos'
        };
        this.elements.helpTitle.textContent = titleMap[tab] || tab.charAt(0).toUpperCase() + tab.slice(1); // Fallback si pas dans la map

         // Gérer le focus initial dans le panneau d'aide pour l'accessibilité
         if (this.elements.closeHelpBtn) {
             // this.elements.closeHelpBtn.focus(); // Optionnel : décommenter si désiré
         }
         console.log(`Help panel shown for tab: ${tab}.`);
    }

    /**
     * Cache le panneau d'aide
     */
    hideHelpPanel() {
         console.log('Hiding help panel.');
        if (this.elements.helpPanel) {
            this.elements.helpPanel.classList.remove('active');
            this.elements.helpPanel.setAttribute('aria-hidden', 'true');
             this.elements.helpPanel.removeAttribute('tabindex'); // Retirer le tabindex si non visible

             // Rétablir aria-expanded sur le bouton qui a ouvert l'aide (si sauvegardé)
             if (this.lastFocusedElementBeforeHelp) {
                 this.lastFocusedElementBeforeHelp.setAttribute('aria-expanded', 'false');
                 // Optionnel: Rétablir le focus sur le bouton qui a ouvert le panneau pour une meilleure UX/accessibilité
                 this.lastFocusedElementBeforeHelp.focus();
                 this.lastFocusedElementBeforeHelp = null; // Nettoyer la référence
             }
             console.log('Help panel hidden.');
        } else {
             console.warn('Help panel element not found, cannot hide.');
        }
    }


    /**
     * Met à jour l'affichage de la date de dernière synchronisation (ou d'export/import)
     * dans l'interface utilisateur.
     */
    updateSyncDateDisplay() {
        console.log('Updating sync date display...');
        if (this.elements.lastSyncDateDisplay) {
            const lastSync = this.settings.sync?.lastSyncDate;
            if (lastSync) {
                try {
                     const date = new Date(lastSync);
                    // Vérifier si la date est valide (getTime() retourne NaN pour une date invalide)
                    if (!isNaN(date.getTime())) {
                        this.elements.lastSyncDateDisplay.textContent = this.formatDate(date);
                    } else {
                         this.elements.lastSyncDateDisplay.textContent = 'Date invalide';
                         console.warn('Invalid last sync date in settings:', lastSync);
                    }
                } catch (error) {
                     console.error('Error parsing last sync date:', error, lastSync);
                     this.elements.lastSyncDateDisplay.textContent = 'Erreur de date';
                }
            } else {
                this.elements.lastSyncDateDisplay.textContent = 'Jamais';
            }
        } else {
             console.warn('Element for last sync date display not found.');
        }
         console.log('Sync date display updated.');
    }

    /**
     * Formate une date pour un nom de fichier (YYYYMMDD_HHMM) pour une meilleure organisation.
     * @param {Date} date - L'

    // ... rest of the file remains unchanged ... */
}