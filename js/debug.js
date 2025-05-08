/**
 * Script de débogage pour identifier les problèmes d'initialisation
 */

// Fonction pour nettoyer le localStorage de manière sécurisée
function cleanupLocalStorage() {
    console.log('🔧 Démarrage du nettoyage du localStorage...');
    
    try {
        // Liste des clés à conserver (qui ne sont pas liées à l'application)
        const keysToKeep = [
            // Ajouter ici les clés externes que vous ne voulez pas supprimer
        ];
        
        // Sauvegarde des valeurs à conserver
        const backup = {};
        keysToKeep.forEach(key => {
            if (localStorage.getItem(key)) {
                backup[key] = localStorage.getItem(key);
            }
        });
        
        // Vider complètement le localStorage
        console.log('🧹 Suppression de toutes les entrées du localStorage...');
        localStorage.clear();
        
        // Restaurer les clés à conserver
        Object.keys(backup).forEach(key => {
            localStorage.setItem(key, backup[key]);
        });
        
        console.log('✅ Nettoyage du localStorage terminé avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage du localStorage:', error);
        return false;
    }
}

// Fonction pour vérifier l'intégrité des données du localStorage
function checkLocalStorageIntegrity() {
    console.log('🔍 Vérification de l\'intégrité du localStorage...');
    
    try {
        const invalidEntries = [];
        
        // Parcourir toutes les entrées du localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            try {
                const value = localStorage.getItem(key);
                
                // Essayer de parser les valeurs qui semblent être du JSON
                if (value && (value.startsWith('{') || value.startsWith('['))) {
                    JSON.parse(value);
                }
            } catch (parseError) {
                invalidEntries.push({ key, error: parseError.message });
            }
        }
        
        if (invalidEntries.length > 0) {
            console.warn('⚠️ Entrées invalides trouvées dans le localStorage:', invalidEntries);
            
            // Supprimer les entrées invalides
            invalidEntries.forEach(entry => {
                console.log(`🗑️ Suppression de l'entrée invalide: ${entry.key}`);
                localStorage.removeItem(entry.key);
            });
            
            return false;
        } else {
            console.log('✅ Toutes les entrées du localStorage sont valides');
            return true;
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'intégrité du localStorage:', error);
        return false;
    }
}

// Fonction pour réparer les données Supabase
function repairSupabaseData() {
    console.log('🔧 Vérification et réparation des données Supabase...');
    
    try {
        // Liste des clés Supabase connues
        const supabaseKeys = [
            'supabase_url', 
            'supabase_key', 
            'sb-auth-token'
        ];
        
        // Expression régulière pour les jetons d'authentification Supabase
        const sbTokensPattern = /^sb-.*-auth-token$/;
        
        let repairsPerformed = false;
        const repairedKeys = [];
        
        // Parcourir toutes les entrées du localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            // Traiter les clés spécifiques de Supabase
            if (supabaseKeys.includes(key) || sbTokensPattern.test(key)) {
                try {
                    const value = localStorage.getItem(key);
                    if (!value) continue;
                    
                    // Les URL et clés API doivent être des chaînes simples
                    if (key === 'supabase_url' || key === 'supabase_key') {
                        if (value.startsWith('{') || value.startsWith('[')) {
                            console.warn(`⚠️ Donnée Supabase invalide pour ${key}, suppression.`);
                            localStorage.removeItem(key);
                            repairedKeys.push(key);
                            repairsPerformed = true;
                        }
                    } 
                    // Les jetons doivent être du JSON valide
                    else {
                        try {
                            JSON.parse(value);
                        } catch (e) {
                            console.warn(`⚠️ Format de cache invalide pour "${key}". Suppression.`);
                            localStorage.removeItem(key);
                            repairedKeys.push(key);
                            repairsPerformed = true;
                        }
                    }
                } catch (e) {
                    console.warn(`⚠️ Erreur lors du traitement de ${key}, suppression.`);
                    localStorage.removeItem(key);
                    repairedKeys.push(key);
                    repairsPerformed = true;
                }
            }
        }
        
        if (repairsPerformed) {
            console.log(`✅ Réparation des données Supabase effectuée avec succès. Clés réparées: ${repairedKeys.join(', ')}`);
        } else {
            console.log('✅ Aucune réparation nécessaire pour les données Supabase');
        }
        
        return repairsPerformed;
    } catch (error) {
        console.error('❌ Erreur lors de la réparation des données Supabase:', error);
        return false;
    }
}

// Fonction pour tester l'initialisation de Supabase
function testSupabaseInit() {
    console.log('🔄 Test de l\'initialisation de Supabase...');
    
    try {
        // Vérifier si la librairie Supabase est disponible
        if (typeof window.supabase === 'undefined') {
            console.error('❌ La librairie Supabase n\'est pas chargée');
            return false;
        }
        
        console.log('✅ Librairie Supabase détectée');
        
        // Vérifier si la fonction createClient est disponible
        if (typeof window.supabase.createClient !== 'function') {
            console.error('❌ La fonction createClient de Supabase n\'est pas disponible');
            return false;
        }
        
        console.log('✅ Fonction createClient de Supabase détectée');
        
        // Vérifier si l'événement supabase-loaded est déclenché correctement
        console.log('🔄 Vérification des écouteurs d\'événements pour supabase-loaded...');
        
        // Tenter de déclencher l'événement manuellement pour voir s'il est traité
        window.dispatchEvent(new Event('supabase-loaded'));
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors du test de Supabase:', error);
        return false;
    }
}

// Fonction principale de débogage
function runDebug() {
    console.log('🔍 Démarrage du débogage...');
    
    // Vérifier l'intégrité du localStorage
    if (!checkLocalStorageIntegrity()) {
        console.log('🔄 Des problèmes ont été détectés dans le localStorage, tentative de nettoyage...');
        cleanupLocalStorage();
    }
    
    // Réparer spécifiquement les données Supabase
    repairSupabaseData();
    
    // Tester l'initialisation de Supabase
    testSupabaseInit();
    
    // Afficher un message de diagnostic dans l'interface utilisateur
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        const debugSection = document.createElement('div');
        debugSection.className = 'debug-section';
        debugSection.innerHTML = `
            <h2>Diagnostic de l'application</h2>
            <p>Un diagnostic est en cours d'exécution pour résoudre les problèmes...</p>
            <button id="fix-storage-btn" class="btn primary-btn">Réparer le stockage local</button>
            <button id="fix-supabase-btn" class="btn primary-btn">Réparer les données Supabase</button>
            <button id="reload-app-btn" class="btn primary-btn">Recharger l'application</button>
        `;
        
        // Insérer en haut du contenu principal
        mainContent.insertBefore(debugSection, mainContent.firstChild);
        
        // Ajouter les écouteurs d'événements aux boutons
        document.getElementById('fix-storage-btn').addEventListener('click', function() {
            cleanupLocalStorage();
            alert('Le stockage local a été nettoyé. L\'application va être rechargée.');
            window.location.reload();
        });
        
        document.getElementById('fix-supabase-btn').addEventListener('click', function() {
            if (repairSupabaseData()) {
                alert('Les données Supabase ont été réparées. L\'application va être rechargée.');
            } else {
                alert('Aucune réparation n\'était nécessaire pour les données Supabase.');
            }
            window.location.reload();
        });
        
        document.getElementById('reload-app-btn').addEventListener('click', function() {
            window.location.reload();
        });
    }
    
    console.log('✅ Débogage terminé');
}

// Exécuter le débogage au chargement de la page
document.addEventListener('DOMContentLoaded', runDebug);

// Créer l'objet Debugger
const Debugger = {
    cleanupLocalStorage,
    checkLocalStorageIntegrity,
    repairSupabaseData,
    testSupabaseInit,
    runDebug
};

// Exporter pour les modules ES6
export { Debugger };

// Exposer au contexte global (window)
window.Debugger = Debugger; 