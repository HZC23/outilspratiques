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
        
        const data = JSON.parse(item);
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
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            this.get(key); // Appeler get supprimera l'entrée si elle est expirée
        }
    },
    
    /**
     * Stocke une valeur dans le cache de session (disparaît à la fermeture du navigateur)
     * @param {string} key - La clé de stockage
     * @param {*} value - La valeur à stocker
     */
    setSession(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    },
    
    /**
     * Récupère une valeur du cache de session
     * @param {string} key - La clé de stockage
     * @returns {*} - La valeur stockée ou null si inexistante
     */
    getSession(key) {
        const item = sessionStorage.getItem(key);
        if (!item) return null;
        
        return JSON.parse(item);
    },
    
    /**
     * Supprime une valeur du cache de session
     * @param {string} key - La clé à supprimer
     */
    removeSession(key) {
        sessionStorage.removeItem(key);
    },
    
    /**
     * Vide le cache de session
     */
    clearSession() {
        sessionStorage.clear();
    }
}; 