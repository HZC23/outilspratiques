/**
 * Module de chargement différé des composants JavaScript
 * Permet de charger les modules JS à la demande pour améliorer les performances
 */

class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.config = {
            basePath: '/js/',
            defaultExtension: '.js',
            timeout: 10000, // Timeout de chargement en ms
            retries: 2,     // Nombre de tentatives en cas d'échec
            onError: (moduleName, error) => console.error(`Erreur de chargement du module: ${moduleName}`, error),
            onLoad: (moduleName) => console.debug(`Module chargé: ${moduleName}`)
        };
    }

    /**
     * Configure le chargeur de modules
     * @param {Object} options - Options de configuration
     */
    configure(options = {}) {
        this.config = { ...this.config, ...options };
        return this;
    }

    /**
     * Charge un module JavaScript de façon asynchrone
     * @param {string} moduleName - Nom du module à charger (sans extension)
     * @param {Object} [options] - Options spécifiques pour ce module
     * @returns {Promise<any>} - Promise résolue avec le module
     */
    async load(moduleName, options = {}) {
        const fullOptions = { ...this.config, ...options };
        
        // Si le module est déjà chargé, retourner celui existant
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }
        
        // Si le module est en cours de chargement, retourner la promesse existante
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }
        
        // Préparer le chemin du module
        const modulePath = this._getModulePath(moduleName, fullOptions);
        
        // Créer une promesse pour le chargement
        const loadPromise = this._loadWithRetry(moduleName, modulePath, fullOptions);
        
        // Sauvegarder la promesse pour ne pas charger plusieurs fois
        this.loadingPromises.set(moduleName, loadPromise);
        
        try {
            // Attendre le chargement
            const moduleExports = await loadPromise;
            
            // Sauvegarder le module chargé
            this.loadedModules.set(moduleName, moduleExports);
            
            // Nettoyer la promesse de chargement
            this.loadingPromises.delete(moduleName);
            
            // Notification de succès
            if (fullOptions.onLoad) {
                fullOptions.onLoad(moduleName);
            }
            
            return moduleExports;
        } catch (error) {
            // Nettoyer la promesse de chargement en cas d'erreur
            this.loadingPromises.delete(moduleName);
            
            // Notification d'erreur
            if (fullOptions.onError) {
                fullOptions.onError(moduleName, error);
            }
            
            throw error;
        }
    }

    /**
     * Charge plusieurs modules en parallèle
     * @param {string[]} moduleNames - Noms des modules à charger
     * @param {Object} [options] - Options de chargement
     * @returns {Promise<Object<string, any>>} - Promise résolue avec un objet contenant les modules
     */
    async loadAll(moduleNames, options = {}) {
        const modules = {};
        
        // Utiliser Promise.allSettled pour continuer même si certains modules échouent
        const results = await Promise.allSettled(
            moduleNames.map(name => this.load(name, options))
        );
        
        // Récupérer les résultats
        moduleNames.forEach((name, index) => {
            const result = results[index];
            if (result.status === 'fulfilled') {
                modules[name] = result.value;
            } else {
                modules[name] = null;
            }
        });
        
        return modules;
    }

    /**
     * Construit le chemin complet du module
     * @param {string} moduleName - Nom du module
     * @param {Object} options - Options de chargement
     * @returns {string} - Chemin complet du module
     * @private
     */
    _getModulePath(moduleName, options) {
        // Si le nom du module est déjà une URL ou un chemin absolu
        if (moduleName.startsWith('http') || moduleName.startsWith('/')) {
            return moduleName;
        }
        
        // Déterminer l'extension à utiliser
        const hasExtension = /\.[a-z0-9]+$/i.test(moduleName);
        const extension = hasExtension ? '' : options.defaultExtension;
        
        // Construire le chemin complet
        return `${options.basePath}${moduleName}${extension}`;
    }

    /**
     * Charge un module avec possibilité de réessayer
     * @param {string} moduleName - Nom du module
     * @param {string} modulePath - Chemin complet du module
     * @param {Object} options - Options de chargement
     * @returns {Promise<any>} - Promise résolue avec le module
     * @private
     */
    async _loadWithRetry(moduleName, modulePath, options) {
        let lastError;
        
        // Essayer de charger le module avec le nombre de tentatives spécifiées
        for (let attempt = 0; attempt <= options.retries; attempt++) {
            try {
                // Si ce n'est pas la première tentative, attendre avant de réessayer
                if (attempt > 0) {
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
                
                // Charger le module avec un timeout
                const moduleExports = await Promise.race([
                    import(/* webpackIgnore: true */ modulePath),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error(`Timeout lors du chargement du module: ${moduleName}`)), 
                        options.timeout)
                    )
                ]);
                
                return moduleExports;
            } catch (error) {
                lastError = error;
                console.warn(`Échec du chargement du module (tentative ${attempt + 1}/${options.retries + 1}): ${moduleName}`, error);
            }
        }
        
        // Si toutes les tentatives échouent, rejeter avec la dernière erreur
        throw lastError;
    }

    /**
     * Précharge des modules en arrière-plan
     * @param {string[]} moduleNames - Noms des modules à précharger
     * @param {Object} [options] - Options de chargement
     */
    preload(moduleNames, options = {}) {
        // Utiliser requestIdleCallback si disponible, sinon setTimeout
        const schedulePreload = window.requestIdleCallback || 
            ((cb) => setTimeout(cb, 1000));
        
        schedulePreload(() => {
            moduleNames.forEach(name => {
                const modulePath = this._getModulePath(name, { ...this.config, ...options });
                
                // Précharger sans attendre ni gérer les erreurs
                import(/* webpackIgnore: true */ modulePath)
                    .then(module => {
                        this.loadedModules.set(name, module);
                        if (this.config.onLoad) this.config.onLoad(name);
                    })
                    .catch(error => {
                        // Ignorer silencieusement les erreurs de préchargement
                        console.debug(`Échec du préchargement du module: ${name}`, error);
                    });
            });
        });
    }

    /**
     * Vérifie si un module est déjà chargé
     * @param {string} moduleName - Nom du module
     * @returns {boolean} - true si le module est chargé
     */
    isLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Supprime un module chargé de la mémoire
     * @param {string} moduleName - Nom du module à supprimer
     */
    unload(moduleName) {
        this.loadedModules.delete(moduleName);
    }

    /**
     * Supprime tous les modules chargés de la mémoire
     */
    unloadAll() {
        this.loadedModules.clear();
    }
}

// Créer une instance unique pour l'application
const moduleLoader = new ModuleLoader();

// Fonction utilitaire pour charger un outil spécifique à la demande
async function loadTool(toolId) {
    try {
        // Charger les dépendances communes
        const commonUtils = await moduleLoader.load('utils');
        
        // Charger le module de l'outil
        const toolModule = await moduleLoader.load(`tools/${toolId}`);
        
        // Précharger d'autres modules potentiellement nécessaires
        moduleLoader.preload(['notification', 'theme']);
        
        return toolModule;
    } catch (error) {
        console.error(`Erreur lors du chargement de l'outil ${toolId}:`, error);
        throw error;
    }
}

// Exporter les fonctions et l'instance
export { moduleLoader, loadTool }; 