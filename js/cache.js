import { CONFIG } from './config.js';

/**
 * Gestionnaire de cache
 * Permet de stocker des données localement avec une durée de vie
 */
export const CacheManager = {
    /**
     * Stocke une valeur dans le cache
     * @param {string} key - La clé de stockage
     * @param {*} value - La valeur à stocker
     * @param {number} ttl - La durée de vie en secondes
     */
    set(key, value, ttl = 3600) {
        const item = {
            value,
            expiry: Date.now() + (ttl * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    /**
     * Récupère une valeur du cache
     * @param {string} key - La clé de stockage
     * @returns {*} - La valeur stockée ou null si expirée ou inexistante
     */
    get(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        let data;
        try {
            data = JSON.parse(item);
        } catch (e) {
            // console.error(`Erreur de parsing JSON pour la clé ${key} dans localStorage:`, e);
            localStorage.removeItem(key); // Supprimer l'entrée invalide
            return null;
        }
        
        // Vérifier si l'objet parsé a la structure attendue par le cache
        if (typeof data !== 'object' || data === null || !('value' in data) || !('expiry' in data)) {
            // console.warn(`Entrée de cache invalide ou non gérée pour la clé ${key}. Suppression...`);
            localStorage.removeItem(key);
            return null;
        }
        
        if (Date.now() > data.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return data.value;
    },
    
    /**
     * Vérifie si une clé existe dans le cache et n'est pas expirée
     * @param {string} key - La clé à vérifier
     * @returns {boolean} - True si la clé existe et n'est pas expirée
     */
    has(key) {
        return this.get(key) !== null;
    },
    
    /**
     * Supprime une valeur du cache
     * @param {string} key - La clé à supprimer
     */
    remove(key) {
        localStorage.removeItem(key);
    },
    
    /**
     * Vide le cache
     */
    clear() {
        localStorage.clear();
    },
    
    /**
     * Nettoie les entrées expirées du cache
     */
    cleanup() {
        const keysToIgnore = [CONFIG.STORAGE_KEYS.THEME]; // Liste des clés à ignorer par le nettoyage du cache
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // Ignorer les clés qui ne sont pas gérées par ce cache
            if (keysToIgnore.includes(key)) {
                continue;
            }

            this.get(key); // Appeler get supprimera l'entrée si elle est expirée ou invalide au format cache
        }
    },
    
    /**
     * Stocke une valeur dans le cache local (persiste après la fermeture du navigateur)
     * @param {string} key - La clé de stockage
     * @param {*} value - La valeur à stocker
     */
    setLocal(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    /**
     * Récupère une valeur du cache local
     * @param {string} key - La clé de stockage
     * @returns {*} - La valeur stockée ou null si inexistante
     */
    getLocal(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        return JSON.parse(item);
    },
    
    /**
     * Supprime une valeur du cache local
     * @param {string} key - La clé à supprimer
     */
    removeLocal(key) {
        localStorage.removeItem(key);
    },
    
    /**
     * Vide le cache local
     */
    clearLocal() {
        localStorage.clear();
    },
    
    /**
     * Initialise le gestionnaire de cache
     */
    init() {
        console.log('Initialisation du gestionnaire de cache');
        this.cleanup(); // Nettoyer les entrées expirées au démarrage
    }
}; 