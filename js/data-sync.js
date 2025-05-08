import { supabase } from './supabase.js';
import { Utils } from './utils.js'; // Supposer que Utils est requis pour loadFromStorage
import { CONFIG } from './config.js'; // Supposer que CONFIG est requis pour la clé de stockage des tâches
// Suppression des imports directs des managers car ils vont écouter des événements
// import { NotesManager } from './tools/notes.js';
// import { TodoManager } from './tools/todo.js';
// import { SettingsManager } from './settings.js';

class DataSyncManager {
    constructor() {
        console.log("DataSyncManager initialisé");
        // On pourrait initier la synchronisation ici ou attendre un événement
    }

    /**
     * Lance la synchronisation globale pour l'utilisateur connecté.
     */
    async syncLocalWithDatabase() {
        console.log("Lancement de la synchronisation locale/base de données...");
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log("Synchronisation annulée: Utilisateur non connecté.");
            return;
        }

        console.log("Synchronisation pour l'utilisateur:", user.id);

        await this.syncCollection('todos', user.id, CONFIG.STORAGE_KEYS.TODO_LIST, this.transformLocalTodosToDb, this.transformDbTodosToLocal);
        await this.syncCollection('notes', user.id, 'notes', this.transformLocalNotesToDb, this.transformDbNotesToLocal);
        
        await this.syncSettings(user.id);
        
        console.log("Synchronisation locale/base de données terminée.");

        // Les gestionnaires écouteront les événements pour rafraîchir l'UI.
    }

    /**
     * Synchronise l'objet de paramètres unique pour l'utilisateur.
     */
    async syncSettings(userId) {
        console.log("Synchronisation des paramètres...");
        const settingsStorageKey = 'appSettings';

        try {
            const localSettingsString = localStorage.getItem(settingsStorageKey);
            let localSettings = localSettingsString ? JSON.parse(localSettingsString) : null;

            if (localSettings && (!localSettings.sync || !localSettings.sync.lastSyncDate)) {
                localSettings = {
                    ...localSettings,
                    sync: {
                        ...localSettings?.sync,
                        lastSyncDate: new Date(0).toISOString()
                    }
                };
            }
            const localUpdatedAt = localSettings?.sync?.lastSyncDate ? new Date(localSettings.sync.lastSyncDate) : new Date(0);

            console.log("Paramètres locaux chargés:", localSettings ? 'Existants' : 'Non existants');

            const { data: dbSettingsArray, error: dbError } = await supabase
                .from('settings')
                .select('*')
                .eq('user_id', userId);

            if (dbError && dbError.code !== 'PGRST116' && dbError.code !== 'PGRST117') {
                throw dbError;
            }

            const dbSettings = dbSettingsArray && dbSettingsArray.length > 0 ? dbSettingsArray[0] : null;

            console.log("Paramètres dans la base de données trouvés:", dbSettings ? 'Existants' : 'Non existants');

            if (!localSettings && !dbSettings) {
                console.log("Aucun paramètre trouvé localement ou en DB. Pas de synchronisation nécessaire.");
                return; // Ne pas créer par défaut ici, cela devrait être géré à l'initialisation de l'app/settingsManager
            }

            let settingsToSaveLocal = null;
            let settingsToSaveDb = null;

            const dbUpdatedAt = dbSettings?.updated_at ? new Date(dbSettings.updated_at) : new Date(0);

            if (localUpdatedAt > dbUpdatedAt) {
                console.log("Version locale des paramètres plus récente.");
                 // Assurez-vous d'avoir les champs created_at et updated_at dans l'objet transformé pour la DB
                 settingsToSaveDb = this.transformLocalSettingsToDb(localSettings, userId);
                 // Conserver l'ID DB si mise à jour
                 if (dbSettings) settingsToSaveDb.id = dbSettings.id;

            } else if (dbUpdatedAt > localUpdatedAt) {
                console.log("Version DB des paramètres plus récente.");
                 settingsToSaveLocal = this.transformDbSettingsToLocal(dbSettings);
            } else if (localSettings && !dbSettings) { // Paramètres locaux existent mais pas en DB
                 console.log("Paramètres locaux trouvés, mais pas en DB. Insertion en DB.");
                 settingsToSaveDb = this.transformLocalSettingsToDb(localSettings, userId);
                 // Ne pas ajouter d'ID, laisser la DB le générer
            } else if (dbSettings && !localSettings) { // Paramètres DB existent mais pas localement
                 console.log("Paramètres DB trouvés, mais pas localement. Sauvegarde locale.");
                 settingsToSaveLocal = this.transformDbSettingsToLocal(dbSettings);
            } else { // Les deux existent et sont identiques, ou les deux n'existent pas (géré plus haut)
                 console.log("Les paramètres locaux et DB sont identiques.");
                 // Si les deux existent et sont identiques, aucune action n'est nécessaire.
                 // Si les deux n'existent pas, l'action a été gérée plus haut.
                 return; // Sortir si aucune action n'est nécessaire
            }

            // Appliquer les changements
            if (settingsToSaveDb) {
                if (dbSettings) {
                    // Mettre à jour l'entrée existante en utilisant l'ID DB
                    console.log("Mise à jour des paramètres en DB (ID: " + dbSettings.id + ").");
                    const { error } = await supabase
                        .from('settings')
                        .update(settingsToSaveDb)
                        .eq('id', dbSettings.id); // Utiliser l'ID de l'entrée DB existante
                    if (error) console.error("Erreur de mise à jour des paramètres en DB:", error);
                } else {
                    // Insérer une nouvelle entrée
                    console.log("Insertion des paramètres en DB.");
                    const { error } = await supabase
                        .from('settings')
                        .insert(settingsToSaveDb);
                    if (error) console.error("Erreur d'insertion des paramètres en DB:", error);
                }
            }

            if (settingsToSaveLocal) {
                 console.log("Mise à jour des paramètres locaux.");
                 localStorage.setItem(settingsStorageKey, JSON.stringify(settingsToSaveLocal));
                 // Émettre un événement pour notifier les listeners
                 document.dispatchEvent(new CustomEvent('data-sync:settings-updated'));
                 console.log("Événement 'data-sync:settings-updated' émis.");
            }

        } catch (error) {
            console.error("Erreur lors de la synchronisation des paramètres:", error);
        }
    }

    /**
     * Fonction générique pour synchroniser une collection (todos ou notes).
     *
     * @param {string} tableName - Le nom de la table Supabase.
     * @param {string} userId - L'ID de l'utilisateur.
     * @param {string} storageKey - La clé utilisée dans localStorage.
     * @param {function} localToDbTransformer - Fonction pour transformer un élément local en format DB.
     * @param {function} dbToLocalTransformer - Fonction pour transformer un élément DB en format local.
     */
    async syncCollection(tableName, userId, storageKey, localToDbTransformer, dbToLocalTransformer) {
        console.log(`Synchronisation de la collection '${tableName}'...`);
        try {
            // 1. Lire les éléments du stockage local
            const localItems = this.getLocalData(storageKey);
            console.log(`${localItems.length} ${tableName} locaux trouvés.`);

            // 2. Lire les éléments de la base de données Supabase
            const { data: dbItems, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            console.log(`${dbItems.length} ${tableName} dans la base de données trouvés.`);

            // 3. Créer des maps pour une comparaison facile
            const localMap = new Map(localItems.map(item => [item.id, item]));
            const dbMap = new Map(dbItems.map(item => [item.id, item]));

            const itemsToInsert = [];
            const itemsToUpdate = [];
            const dbItemsToDelete = []; // Liste des IDs d'éléments à supprimer de la DB
            const localItemIds = new Set(localItems.map(item => item.id)); // Créer un ensemble d'IDs locaux pour une recherche rapide

            // Parcourir les éléments locaux
            for (const localItem of localItems) {
                const dbItem = dbMap.get(localItem.id);

                // Déterminer s'il s'agit d'une insertion, d'une mise à jour, ou si l'élément DB est plus récent
                if (!dbItem) {
                    // L'élément local n'existe pas dans la DB. Si l'ID est déjà généré, on tente une insertion.
                    // Si l'insertion échoue à cause d'un doublon (cas du log d'erreur), Supabase gérera l'erreur, ce n'est pas idéal mais on ne peut pas savoir si l'ID existe sans faire une requête SELECT pour chaque ID inconnu, ce qui est inefficace.
                    // La logique actuelle essaie d'insérer. On fait confiance à Supabase pour l'erreur 23505.
                     itemsToInsert.push(localToDbTransformer(localItem, userId));
                } else { // L'élément existe dans les deux (local et DB)
                    // Comparer les timestamps pour gérer les conflits et les mises à jour
                    const localUpdatedAt = new Date(localItem.updated_at);
                    const dbUpdatedAt = new Date(dbItem.updated_at);

                    if (localUpdatedAt > dbUpdatedAt) {
                        // L'élément local est plus récent, marquer pour mise à jour dans la DB
                        const dbFormatItem = localToDbTransformer(localItem, userId);
                        // Assurez-vous que l'ID est inclus pour la clause WHERE de la mise à jour
                        itemsToUpdate.push({ ...dbFormatItem, id: localItem.id });
                        console.log(`Conflit ou mise à jour: Local plus récent pour ID ${localItem.id}. Marquage pour UPDATE en DB.`);
                    }
                    // Si dbUpdatedAt >= localUpdatedAt, l'élément DB est plus récent ou identique, on ne fait rien pour l'instant (il sera traité dans itemsToAddToLocal plus tard).

                    // Supprimer l'élément de dbMap pour identifier ceux qui sont seulement dans la DB plus tard
                    dbMap.delete(localItem.id);
                }
            }

            // Parcourir les éléments de la DB pour identifier ceux qui n'existent plus localement (suppressions locales)
            for (const dbItem of dbItems) {
                if (!localItemIds.has(dbItem.id)) {
                    // Cet élément existe dans la DB mais pas dans la liste locale actuelle -> il a été supprimé localement
                    dbItemsToDelete.push(dbItem.id);
                    console.log(`Suppression locale détectée pour ID ${dbItem.id}. Marquage pour DELETE en DB.`);
                }
            }

            // Insérer les nouveaux éléments locaux dans la DB
            if (itemsToInsert.length > 0) {
                console.log(`Insertion de ${itemsToInsert.length} nouveaux ${tableName} dans la DB.`);
                // Supabase insérera par défaut les champs created_at et updated_at s'ils sont NULL dans l'objet inséré
                const { error: insertError } = await supabase
                    .from(tableName)
                    .insert(itemsToInsert);
                if (insertError) console.error(`Erreur d\'insertion ${tableName}:`, insertError);
                // Si l'insertion réussit, Supabase renvoie les données insérées avec les ID générés et les timestamps.
                // Pour une synchronisation parfaite, vous devriez utiliser ces données de réponse pour mettre à jour les ID locaux
                // si vous utilisiez un système d'ID local différent de celui de la DB.
                // Avec UUID générés par défaut en DB, on suppose que les ID locaux sont déjà UUID ou que Supabase les gérera.
            }

            // Mettre à jour les éléments locaux plus récents dans la DB
            if (itemsToUpdate.length > 0) {
                console.log(`Mise à jour de ${itemsToUpdate.length} ${tableName} dans la DB.`);
                // Supabase n'a pas de méthode de mise à jour en masse directe par ID dans cette API simplifiée,
                // donc nous les mettons à jour un par un ou utilisons un RPC si la liste est très longue.
                // Pour l'instant, mise à jour unitaire.
                 for (const item of itemsToUpdate) {
                     // L'objet 'item' ici est déjà au format DB et contient l'id
                     const { error: updateError } = await supabase
                         .from(tableName)
                         .update(item)
                         .eq('id', item.id);
                     if (updateError) console.error(`Erreur de mise à jour ${tableName} ID ${item.id}:`, updateError);
                 }
            }

            // Supprimer de la DB les éléments qui ont été supprimés localement
            if (dbItemsToDelete.length > 0) {
                console.log(`Suppression de ${dbItemsToDelete.length} éléments de la table ${tableName} dans la DB.`);
                const { error: deleteError } = await supabase
                    .from(tableName)
                    .delete()
                    .in('id', dbItemsToDelete);

                if (deleteError) {
                    console.error(`Erreur lors de la suppression d'éléments de la table ${tableName}:`, deleteError);
                } else {
                    console.log(`${dbItemsToDelete.length} éléments supprimés avec succès de la table ${tableName}.`);
                }
            }

            // Les éléments restants dans dbMap sont ceux qui sont dans la DB mais pas (ou plus anciens) localement
            // Note: Les éléments supprimés de la DB via la liste dbItemsToDelete ne sont plus dans dbMap à ce stade.
            const itemsToAddToLocal = Array.from(dbMap.values());

            // Mettre à jour le stockage local avec les éléments de la DB plus récents ou nouveaux
            if (itemsToAddToLocal.length > 0) {
                console.log(`Ajout/Mise à jour de ${itemsToAddToLocal.length} ${tableName} dans le stockage local.`);
                const currentLocalItems = this.getLocalData(storageKey); // Relire l'état local actuel avant de fusionner
                const newLocalItems = [...currentLocalItems];

                for (const dbItem of itemsToAddToLocal) {
                    const existingIndex = newLocalItems.findIndex(item => item.id === dbItem.id);
                    const localItem = dbToLocalTransformer(dbItem); // Transformer l'élément DB en format local

                    if (existingIndex > -1) {
                        // Mettre à jour l'élément existant localement
                        newLocalItems[existingIndex] = localItem;
                    } else {
                        // Ajouter le nouvel élément localement
                        newLocalItems.push(localItem);
                    }
                }
                this.saveLocalData(storageKey, newLocalItems); // Sauvegarder la liste fusionnée

                // Émettre un événement après la sauvegarde locale
                if (tableName === 'todos') {
                     document.dispatchEvent(new CustomEvent('data-sync:todos-updated'));
                     console.log("Événement 'data-sync:todos-updated' émis.");
                } else if (tableName === 'notes') {
                     document.dispatchEvent(new CustomEvent('data-sync:notes-updated'));
                     console.log("Événement 'data-sync:notes-updated' émis.");
                }
            }
            // Si des éléments ont été insérés dans la DB (itemsToInsert.length > 0), ils n'ont pas été ajoutés à newLocalItems ici.
            // Idéalement, il faudrait relire depuis la DB après l'insertion pour obtenir les IDs finaux et les timestamps, puis fusionner localement.
            // Pour l'instant, on suppose que l'UI se mettra à jour en lisant le local storage à la prochaine initialisation ou via un trigger plus intelligent.
            // Si vous utilisez des UUID générés localement, et que Supabase les accepte comme PK, cette étape n'est pas strictement nécessaire ici si l'updated_at est géré localement avant insertion.

             // Après toutes les opérations, relire les données locales pour s'assurer de l'état final (optionnel mais sécuritaire)
             // const finalLocalItems = this.getLocalData(storageKey);
             // console.log(`État final local pour '${tableName}': ${finalLocalItems.length} éléments.`);

        } catch (error) {
            console.error(`Erreur lors de la synchronisation de la collection '${tableName}':`, error);
        }
    }

    /**
     * Lit les données de collection (arrays) du stockage local.
     */
    getLocalData(storageKey) {
        if (storageKey === CONFIG.STORAGE_KEYS.TODO_LIST) {
            const localTodoState = Utils.loadFromStorage(storageKey) || {};
            // Combiner les tâches de toutes les listes en un seul tableau pour la synchronisation
             const allLocalTasks = [
                ...Object.values(localTodoState.lists || {}).flatMap(list => list.tasks || []).filter(task => task),
                ...Object.values(localTodoState.customLists || {}).flatMap(list => list.tasks || []).filter(task => task)
            ].filter(task => task && task.id); // Filtrer pour s'assurer que chaque tâche a un ID

            // Assurez-vous que chaque tâche a un 'updated_at' pour la comparaison
            return allLocalTasks.map(task => ({
                ...task,
                updated_at: task.updatedAt || task.createdAt || new Date(0).toISOString() // Utiliser createdAt ou une date ancienne si updatedAt n'existe pas
            }));
        } else if (storageKey === 'notes') {
             const localNotes = JSON.parse(localStorage.getItem(storageKey)) || [];
              // Assurez-vous que chaque note a un 'updated_at'
             return localNotes.map(note => ({
                 ...note,
                 updated_at: note.updated || note.created || new Date(0).toISOString() // Utiliser created ou une date ancienne si updated n'existe pas
             })).filter(note => note && note.id); // Filtrer pour s'assurer que chaque note a un ID
        } else {
            console.warn(`Clé de stockage inconnue pour getLocalData: ${storageKey}`);
            return [];
        }
    }
    
    /**
     * Sauvegarde les données de collection (arrays) dans le stockage local.
     * NOTE: Cette fonction sauvegarde un tableau plat de données. Les gestionnaires UI
     * doivent pouvoir lire ce format ou avoir une logique pour intégrer ces données
     * dans leur structure interne complexe (ex: listes de tâches).
     */
    saveLocalData(storageKey, data) {
         if (storageKey === CONFIG.STORAGE_KEYS.TODO_LIST) {
             // Sauvegarder le tableau plat de tâches. TodoManager devra reconstruire ses listes à partir de là.
             // Ceci remplace la structure complexe précédente par une simple liste pour la synchro.
             // Il faut s'assurer que TodoManager.loadState() gère cela.
             console.warn("Sauvegarde simplifiée des tâches locales comme un tableau plat. TodoManager devra s\'adapter.");
             // Simuler la structure minimale pour Utils.saveToStorage si nécessaire, mais idéalement Utils devrait prendre le tableau directement.
             const simplifiedStateForSave = { lists: { default: { tasks: data } }, customLists: {} }; // Simplification
             // IMPORTANT: Cette simplification peut perdre l'information des listes personnalisées si elles n'existent pas déjà lors du chargement par TodoManager.
             // Une meilleure approche serait de persister la structure complète { lists, customLists } ou de refactorer TodoManager.
             // Pour cette implémentation, on met tout dans une liste 'default' simplifiée pour le stockage local après synchro.

             // Une alternative simple pour le test: stocker juste le tableau plat si Utils.saveToStorage le permet ou si on utilise localStorage directement
             // localStorage.setItem(storageKey, JSON.stringify(data)); // Si on bypass Utils.saveToStorage

              // En supposant que Utils.saveToStorage attend la structure { lists, customLists }:
              // Il faudrait potentiellement lire l'état local existant, fusionner les tâches synchronisées,
              // puis sauvegarder la structure complète. C'est complexe.
              // Pour l'instant, je vais laisser la simplification qui met tout dans une liste 'default' pour la sauvegarde locale post-synchro.
               Utils.saveToStorage(storageKey, simplifiedStateForSave);


         } else if (storageKey === 'notes') {
             // Les notes sont déjà un tableau, on peut sauvegarder directement
             localStorage.setItem(storageKey, JSON.stringify(data));

         } else {
             console.warn(`Clé de stockage inconnue pour saveLocalData: ${storageKey}`);
         }
    }

    /**
     * Transforme une tâche locale en format compatible avec la DB.
     */
    transformLocalTodosToDb(localTask, userId) {
        return {
            id: localTask.id,
            user_id: userId,
            title: localTask.title,
            completed: localTask.completed,
            priority: localTask.priority,
            created_at: localTask.createdAt,
            updated_at: localTask.updatedAt || new Date().toISOString(),
            list_id: localTask.list === 'default' ? null : localTask.list,
            notes: localTask.notes,
            subtasks: localTask.subtasks || [],
            tags: localTask.tags || [],
            due_date: localTask.dueDate,
            reminder: localTask.reminder,
            important: localTask.important || false,
        };
    }

     /**
     * Transforme une tâche de la DB en format compatible local (pour TodoManager).
     */
    transformDbTodosToLocal(dbTask) {
        return {
            id: dbTask.id,
            title: dbTask.title,
            completed: dbTask.completed,
            priority: dbTask.priority,
            createdAt: dbTask.created_at,
            updatedAt: dbTask.updated_at,
            list: dbTask.list_id || 'default',
            notes: dbTask.notes,
            subtasks: dbTask.subtasks || [],
            tags: dbTask.tags || [],
            dueDate: dbTask.due_date,
            reminder: dbTask.reminder,
            important: dbTask.important || false,
        };
    }

    /**
     * Transforme une note locale en format compatible avec la DB.
     */
    transformLocalNotesToDb(localNote, userId) {
         return {
             id: localNote.id,
             user_id: userId,
             title: localNote.title,
             content: localNote.content,
             content_html: localNote.contentHtml,
             quill_content: localNote.quillContent,
             created_at: localNote.created,
             updated_at: localNote.updated || new Date().toISOString(),
             tags: localNote.tags || [],
         };
     }

     /**
      * Transforme une note de la DB en format compatible local (pour NotesManager).
      */
     transformDbNotesToLocal(dbNote) {
         return {
             id: dbNote.id,
             title: dbNote.title,
             content: dbNote.content,
             contentHtml: dbNote.content_html,
             quillContent: dbNote.quill_content,
             created: dbNote.created_at,
             updated: dbNote.updated_at,
             tags: dbNote.tags || [],
         };
     }

    /**
     * Transforme l'objet de paramètres local en format compatible avec la DB.
     */
    transformLocalSettingsToDb(localSettings, userId) {
         return {
             user_id: userId,
             theme: localSettings.appearance?.theme || null,
             calculator_history: localSettings.advanced?.calculatorHistory || [],
             // Note: created_at et updated_at sont gérés par la DB
         };
     }

     /**
      * Transforme les paramètres de la DB en format compatible local (pour SettingsManager).
      */
     transformDbSettingsToLocal(dbSettings) {
         let localSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');

         return {
             ...localSettings,
             appearance: {
                 ...localSettings?.appearance,
                 theme: dbSettings.theme !== undefined ? dbSettings.theme : localSettings?.appearance?.theme
             },
             advanced: {
                 ...localSettings?.advanced,
                 calculatorHistory: dbSettings.calculator_history !== undefined ? dbSettings.calculator_history : localSettings?.advanced?.calculatorHistory
             },
             sync: {
                 ...localSettings?.sync,
                 lastSyncDate: dbSettings.updated_at // Utiliser le timestamp de la DB comme date de dernière synchro locale
             }
         };
     }

    // Ajoutez d'autres méthodes selon vos besoins
}

// Exportez une instance pour une utilisation simple.
const dataSyncManager = new DataSyncManager();
export { dataSyncManager, DataSyncManager }; 