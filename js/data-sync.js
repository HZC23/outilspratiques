import { supabase, isAuthenticated, getCurrentUser } from './supabase.js';
import { CONFIG } from './config.js';
import { NotificationManager } from './notification.js';

/**
 * Gestionnaire de synchronisation des données
 * Permet de synchroniser les données locales avec Supabase
 */
export const DataSyncManager = {
    lastSyncTime: null,
    isSyncing: false,
    syncQueue: [],
    intervalId: null,
    
    /**
     * Initialise le gestionnaire de synchronisation
     */
    init() {
        console.log('Initialisation du gestionnaire de synchronisation');
        
        // Récupérer la dernière synchronisation
        this.lastSyncTime = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SYNC) 
            ? parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SYNC))
            : null;
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
        
        // Vérifier la connectivité
        this.checkConnectivity();
        
        // Démarrer la synchronisation automatique si configurée
        if (CONFIG.SYNC.AUTO_SYNC && isAuthenticated()) {
            this.startAutoSync();
        }
        
        return true;
    },
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Écouter les changements de connectivité
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
        
        // Écouter les événements d'authentification
        document.addEventListener('auth:signed-in', () => {
            console.log('Utilisateur connecté, démarrage de la synchronisation automatique');
            this.startAutoSync();
        });
        
        document.addEventListener('auth:signed-out', () => {
            console.log('Utilisateur déconnecté, arrêt de la synchronisation automatique');
            this.stopAutoSync();
        });
        
        // Écouter les événements de changement de données locales
        document.addEventListener('data:changed', (event) => {
            const { table, action, data } = event.detail;
            this.queueSync(table, action, data);
        });
        
        // Écouteur pour la visibilité du document (pour synchroniser quand l'utilisateur revient)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && navigator.onLine && isAuthenticated()) {
                console.log('Document visible à nouveau, vérification des synchronisations en attente');
                this.sync();
            }
        });
    },
    
    /**
     * Démarre la synchronisation automatique
     */
    startAutoSync() {
        if (this.intervalId) {
            this.stopAutoSync();
        }
        
        this.intervalId = setInterval(() => {
            if (navigator.onLine && isAuthenticated()) {
                this.sync();
            }
        }, CONFIG.SYNC.INTERVAL);
        
        console.log(`Synchronisation automatique démarrée (intervalle: ${CONFIG.SYNC.INTERVAL / 1000}s)`);
    },
    
    /**
     * Arrête la synchronisation automatique
     */
    stopAutoSync() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Synchronisation automatique arrêtée');
        }
    },
    
    /**
     * Gère le changement de statut de connectivité
     */
    handleOnlineStatus(isOnline) {
        console.log(`Statut de connectivité: ${isOnline ? 'En ligne' : 'Hors ligne'}`);
        
        if (isOnline && isAuthenticated()) {
            // Si on revient en ligne, synchroniser les données en attente
            NotificationManager.info('Connexion internet rétablie');
            this.sync();
        } else if (!isOnline) {
            NotificationManager.warning('Connexion internet perdue, mode hors ligne activé');
        }
        
        // Déclencher un événement pour informer les autres composants
        document.dispatchEvent(new CustomEvent('connectivity:change', { 
            detail: { isOnline } 
        }));
    },
    
    /**
     * Vérifie la connectivité actuelle
     */
    checkConnectivity() {
        const isOnline = navigator.onLine;
        console.log(`Vérification de la connectivité: ${isOnline ? 'En ligne' : 'Hors ligne'}`);
        return isOnline;
    },
    
    /**
     * Ajoute une opération à la file d'attente de synchronisation
     */
    queueSync(table, action, data) {
        this.syncQueue.push({
            table,
            action, // 'insert', 'update', 'delete'
            data,
            timestamp: Date.now()
        });
        
        console.log(`Opération ajoutée à la file d'attente: ${action} sur ${table}`);
        console.log('État actuel de la file d\'attente de synchronisation:', this.syncQueue);
        
        // Si la synchronisation automatique est activée et qu'on est en ligne, synchroniser immédiatement
        if (CONFIG.SYNC.AUTO_SYNC && navigator.onLine && isAuthenticated()) {
            this.sync();
        }
    },
    
    /**
     * Synchronise les données avec Supabase
     */
    async sync() {
        // Vérifier si une synchronisation est déjà en cours
        if (this.isSyncing) {
            console.log('Synchronisation déjà en cours, demande ignorée');
            return { success: false, error: 'Synchronisation déjà en cours' };
        }
        
        // Vérifier la connectivité
        if (!this.checkConnectivity()) {
            console.log('Impossible de synchroniser: hors ligne');
            return { success: false, error: 'Hors ligne' };
        }
        
        // Vérifier l'authentification
        if (!isAuthenticated()) {
            console.log('Impossible de synchroniser: non authentifié');
            return { success: false, error: 'Non authentifié' };
        }
        
        try {
            this.isSyncing = true;
            console.log('Début de la synchronisation');
            
            // Synchroniser les données en attente
            if (this.syncQueue.length > 0) {
                await this.processSyncQueue();
            }
            
            // Récupérer les nouvelles données du serveur
            await this.fetchRemoteChanges();
            
            // Mettre à jour la dernière synchronisation
            this.updateLastSyncTime();
            
            console.log('Synchronisation terminée avec succès');
            
            // Déclencher un événement pour informer les autres composants
            document.dispatchEvent(new CustomEvent('data:synced'));
            
            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
            
            // Déclencher un événement d'erreur
            document.dispatchEvent(new CustomEvent('data:sync-error', { 
                detail: { error: error.message } 
            }));
            
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
        }
    },
    
    /**
     * Traite la file d'attente de synchronisation
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) {
            console.log('File d\'attente de synchronisation vide, rien à traiter');
            return;
        }
        
        console.log(`Traitement de ${this.syncQueue.length} opérations en attente`);
        
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Utilisateur non connecté');
        }
        
        // Regrouper les opérations par table
        const operations = this.groupOperationsByTable();
        
        // Traiter chaque table
        for (const [table, ops] of Object.entries(operations)) {
            console.log(`Synchronisation de la table ${table}: ${ops.length} opérations`);
            await this.processTableOperations(table, ops, user.id);
        }
        
        // Vider la file d'attente
        this.syncQueue = [];
    },
    
    /**
     * Regroupe les opérations par table
     */
    groupOperationsByTable() {
        const operations = {};
        
        for (const op of this.syncQueue) {
            if (!operations[op.table]) {
                operations[op.table] = [];
            }
            operations[op.table].push(op);
        }
        
        return operations;
    },
    
    /**
     * Traite les opérations pour une table spécifique
     */
    async processTableOperations(table, operations, userId) {
        console.log(`Processing operations for table ${table} with userId: ${userId}`);
        for (const op of operations) {
            switch (op.action) {
                case 'insert':
                    await this.insertRecord(table, { ...op.data, user_id: userId });
                    break;
                case 'update':
                    await this.updateRecord(table, op.data.id, { ...op.data, user_id: userId });
                    break;
                case 'delete':
                    await this.deleteRecord(table, op.data.id, userId);
                    break;
                case 'upsert':
                    await this.upsertRecord(table, { ...op.data, user_id: userId });
                    break;
                default:
                    console.warn(`Opération non reconnue: ${op.action}`);
            }
        }
    },
    
    /**
     * Insère un enregistrement dans Supabase
     */
    async insertRecord(table, data) {
        console.log('Tentative d\'insertion dans Supabase:', { table, data, supabaseClient: supabase });
        const { error } = await supabase.from(table).insert(data);
        
        if (error) {
            console.error('Erreur API Supabase lors de l\'insertion:', error);
            throw new Error(`Erreur lors de l'insertion dans ${table}: ${error.message}`);
        }
        console.log('Insertion réussie dans Supabase:', { table, data });
    },
    
    /**
     * Met à jour un enregistrement dans Supabase
     */
    async updateRecord(table, id, data) {
        const { error } = await supabase.from(table).update(data).eq('id', id);
        
        if (error) {
            throw new Error(`Erreur lors de la mise à jour dans ${table}: ${error.message}`);
        }
    },
    
    /**
     * Supprime un enregistrement dans Supabase
     */
    async deleteRecord(table, id, userId) {
        const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);
        
        if (error) {
            throw new Error(`Erreur lors de la suppression dans ${table}: ${error.message}`);
        }
    },
    
    /**
     * Insère ou met à jour un enregistrement dans Supabase
     */
    async upsertRecord(table, data) {
        const { error } = await supabase.from(table).upsert(data);
        
        if (error) {
            throw new Error(`Erreur lors de l'upsert dans ${table}: ${error.message}`);
        }
    },
    
    /**
     * Récupère les changements distants depuis la dernière synchronisation
     */
    async fetchRemoteChanges() {
        if (!this.lastSyncTime) {
            console.log('Première synchronisation, récupération de toutes les données');
            // Pour la première synchronisation, on récupère toutes les données
            await this.fetchAllTables();
            return;
        }
        
        console.log(`Récupération des changements depuis ${new Date(this.lastSyncTime)}`);
        
        // Liste des tables à synchroniser
        const tables = ['todos', 'notes', 'calculator_history', 'settings'];
        
        // Récupérer les changements pour chaque table
        for (const table of tables) {
            await this.fetchTableChanges(table);
        }
    },
    
    /**
     * Récupère toutes les données de toutes les tables
     */
    async fetchAllTables() {
        const tables = ['todos', 'notes', 'calculator_history', 'settings'];
        const user = getCurrentUser();
        
        if (!user) {
            throw new Error('Utilisateur non connecté');
        }
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('user_id', user.id);
            
            if (error) {
                throw new Error(`Erreur lors de la récupération des données de ${table}: ${error.message}`);
            }
            
            if (data && data.length > 0) {
                // Stocker les données localement
                this.storeLocalData(table, data);
            }
        }
    },
    
    /**
     * Récupère les changements pour une table spécifique
     */
    async fetchTableChanges(table) {
        const user = getCurrentUser();
        
        if (!user) {
            throw new Error('Utilisateur non connecté');
        }
        
        // Convertir timestamp en ISO pour Supabase
        // Retirer les millisecondes et le 'Z' pour potentiellement améliorer la compatibilité
        const lastSyncISO = new Date(this.lastSyncTime).toISOString().replace(/\.\d{3}Z$/, '');
        
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', user.id)
            .gt('updated_at', lastSyncISO);
        
        if (error) {
            throw new Error(`Erreur lors de la récupération des changements de ${table}: ${error.message}`);
        }
        
        if (data && data.length > 0) {
            console.log(`${data.length} nouveaux changements pour ${table}`);
            // Stocker les données localement
            this.storeLocalData(table, data);
        }
    },
    
    /**
     * Stocke les données localement
     */
    storeLocalData(table, data) {
        // Convertir en clé de stockage local
        let storageKey;
        
        switch (table) {
            case 'todos':
                storageKey = CONFIG.STORAGE_KEYS.TODOS;
                break;
            case 'notes':
                storageKey = CONFIG.STORAGE_KEYS.NOTES;
                break;
            case 'calculator_history':
                storageKey = CONFIG.STORAGE_KEYS.CALCULATOR_HISTORY;
                break;
            case 'settings':
                storageKey = CONFIG.STORAGE_KEYS.SETTINGS;
                break;
            default:
                console.warn(`Table non reconnue: ${table}`);
                return;
        }
        
        // Fusionner avec les données existantes
        let existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Si c'est un tableau
        if (Array.isArray(existingData)) {
            // Pour chaque élément des nouvelles données
            for (const item of data) {
                // Vérifier s'il existe déjà
                const existingIndex = existingData.findIndex(existing => existing.id === item.id);
                
                if (existingIndex >= 0) {
                    // Mettre à jour l'élément existant
                    existingData[existingIndex] = item;
                } else {
                    // Ajouter le nouvel élément
                    existingData.push(item);
                }
            }
        } else if (typeof existingData === 'object') {
            // Pour les objets (settings par exemple)
            existingData = { ...existingData, ...data[0] };
        }
        
        // Sauvegarder dans localStorage
        localStorage.setItem(storageKey, JSON.stringify(existingData));
        
        // Déclencher un événement pour informer les autres composants
        document.dispatchEvent(new CustomEvent('data:updated', { 
            detail: { table, data: existingData } 
        }));
    },
    
    /**
     * Met à jour la dernière synchronisation
     */
    updateLastSyncTime() {
        const now = Date.now();
        this.lastSyncTime = now;
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC, now.toString());
    },
    
    /**
     * Récupère le temps écoulé depuis la dernière synchronisation
     */
    getTimeSinceLastSync() {
        if (!this.lastSyncTime) {
            return 'Jamais';
        }
        
        const now = Date.now();
        const diff = now - this.lastSyncTime;
        
        // Moins d'une minute
        if (diff < 60000) {
            return 'À l\'instant';
        }
        
        // Moins d'une heure
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        
        // Moins d'un jour
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        }
        
        // Moins d'une semaine
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        }
        
        // Formatage de la date
        const options = { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' };
        return new Date(this.lastSyncTime).toLocaleDateString('fr-FR', options);
    }
};

// Exposer DataSyncManager globalement pour les tests (à retirer en production)
window.DataSyncManager = DataSyncManager; 