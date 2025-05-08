// Importation via CDN au lieu de package npm

// Configurations de Supabase à remplacer par vos propres informations
const supabaseUrl = 'https://brrwkmcokfrlcsyduoxq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycndrbWNva2ZybGNzeWR1b3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTg4MjYsImV4cCI6MjA2MTkzNDgyNn0.lW7NkrTJKS4vR6WT6GxZhh9l569cvmTXfdbvgdDqje8';

// Singleton pour le client Supabase
let supabaseInstance = null;
let initialized = false;

// Fonction pour créer un client factice complet qui ne génère pas d'erreurs
function createCompleteFallbackClient() {
    console.log("Création d'un client Supabase factice complet");
    
    // Créer un objet qui simule toutes les méthodes de Supabase
    const authMethods = {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: (callback) => {
            // Retourner un objet avec une méthode unsubscribe
            return { data: { subscription: { unsubscribe: () => {} } }, error: null };
        },
        signUp: () => Promise.resolve({ data: null, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () => Promise.resolve({ error: null }),
        updateUser: () => Promise.resolve({ data: null, error: null })
    };
    
    // Méthodes de base de données
    const createDatabaseHandler = () => {
        return {
            select: (columns) => ({
                eq: (column, value) => Promise.resolve({ data: [], error: null }),
                neq: (column, value) => Promise.resolve({ data: [], error: null }),
                match: (obj) => Promise.resolve({ data: [], error: null }),
                or: (query, query2) => Promise.resolve({ data: [], error: null }),
                in: (column, values) => Promise.resolve({ data: [], error: null }),
                order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
                limit: () => Promise.resolve({ data: [], error: null }),
                single: () => Promise.resolve({ data: null, error: null }),
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
                then: (onfulfilled) => Promise.resolve({ data: [], error: null }).then(onfulfilled)
            }),
            insert: (data) => Promise.resolve({ data: null, error: null }),
            update: (data) => ({
                eq: (column, value) => Promise.resolve({ data: null, error: null }),
                neq: (column, value) => Promise.resolve({ data: null, error: null }),
                match: (obj) => Promise.resolve({ data: null, error: null }),
                in: (column, values) => Promise.resolve({ data: null, error: null }),
                is: (column, value) => Promise.resolve({ data: null, error: null }),
                then: (onfulfilled) => Promise.resolve({ data: null, error: null }).then(onfulfilled)
            }),
            delete: () => ({
                eq: (column, value) => Promise.resolve({ data: null, error: null }),
                neq: (column, value) => Promise.resolve({ data: null, error: null }),
                match: (obj) => Promise.resolve({ data: null, error: null }),
                in: (column, values) => Promise.resolve({ data: null, error: null }),
                is: (column, value) => Promise.resolve({ data: null, error: null }),
                then: (onfulfilled) => Promise.resolve({ data: null, error: null }).then(onfulfilled)
            }),
            upsert: (data) => Promise.resolve({ data: null, error: null })
        };
    };
    
    // Créer un proxy pour intercepter toutes les méthodes
    return {
        auth: authMethods,
        from: (table) => createDatabaseHandler(),
        storage: {
            from: (bucket) => ({
                upload: () => Promise.resolve({ data: null, error: null }),
                download: () => Promise.resolve({ data: null, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: '' }, error: null }),
                list: () => Promise.resolve({ data: [], error: null }),
                remove: () => Promise.resolve({ data: null, error: null }),
            })
        },
        rpc: (func, params) => Promise.resolve({ data: null, error: null }),
    };
}

// Fonction pour vérifier la validité des données Supabase dans localStorage
function checkSupabaseCache() {
    console.log("Vérification du cache Supabase");
    
    try {
        // Vérifier les clés principales
        const url = localStorage.getItem('supabase_url');
        const key = localStorage.getItem('supabase_key');
        
        // Vérifier d'abord si l'outil de réparation est disponible
        if (typeof CacheManager !== 'undefined' && typeof CacheManager.repairSupabaseData === 'function') {
            CacheManager.repairSupabaseData();
        } else if (window.Debugger && typeof window.Debugger.repairSupabaseData === 'function') {
            window.Debugger.repairSupabaseData();
        } else {
            // Réparation manuelle si les outils ne sont pas disponibles
            // Vérifier si les URL et clés semblent être au bon format
            if (url && (url.startsWith('{') || url.startsWith('['))) {
                console.warn("Données invalides dans le cache pour la clé 'supabase_url'. Suppression.");
                localStorage.removeItem('supabase_url');
            }
            
            if (key && (key.startsWith('{') || key.startsWith('['))) {
                console.warn("Données invalides dans le cache pour la clé 'supabase_key'. Suppression.");
                localStorage.removeItem('supabase_key');
            }
            
            // Vérifier les jetons d'authentification
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || !key.match(/^sb-.*-auth-token$/)) continue;
                
                try {
                    const value = localStorage.getItem(key);
                    if (!value) continue;
                    
                    // Essayer de parser le JSON pour vérifier qu'il est valide
                    JSON.parse(value);
                } catch (e) {
                    console.warn(`Format de cache invalide pour la clé "${key}". Suppression.`);
                    localStorage.removeItem(key);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error("Erreur lors de la vérification du cache Supabase:", error);
        return false;
    }
}

/**
 * Initialise Supabase et retourne une instance du client
 * @returns {Object} Instance du client Supabase
 */
export function initSupabase() {
    if (initialized) {
        return supabaseInstance;
    }
    
    try {
        // Vérifier et réparer le cache au démarrage
        checkSupabaseCache();
        
        // Essayer d'utiliser les valeurs du localStorage s'il y en a
        const savedUrl = localStorage.getItem('supabase_url');
        const savedKey = localStorage.getItem('supabase_key');
        
        const url = savedUrl || supabaseUrl;
        const key = savedKey || supabaseAnonKey;
        
        // Vérifier que l'objet supabase est disponible
        if (typeof window.supabase === 'undefined') {
            console.error("La bibliothèque Supabase n'est pas chargée");
            supabaseInstance = createCompleteFallbackClient();
            initialized = true;
            return supabaseInstance;
        }
        
        // Vérifier que la méthode createClient existe
        if (typeof window.supabase.createClient !== 'function') {
            console.error("La méthode createClient n'est pas disponible");
            supabaseInstance = createCompleteFallbackClient();
            initialized = true;
            return supabaseInstance;
        }
        
        // Créer une nouvelle instance
        supabaseInstance = window.supabase.createClient(url, key);
        initialized = true;
        
        // Émettre un événement pour signaler que Supabase est prêt
        document.dispatchEvent(new Event('supabase:ready'));
        
        return supabaseInstance;
    } catch (error) {
        console.error("Erreur lors de l'initialisation de Supabase:", error);
        
        // Créer un client factice en cas d'erreur
        supabaseInstance = createCompleteFallbackClient();
        initialized = true;
        return supabaseInstance;
    }
}

// Fonction pour obtenir l'instance Supabase
function getSupabase() {
    if (!initialized) {
        return initSupabase();
    }
    return supabaseInstance;
};

// Exporter le client initialisé pour utilisation dans d'autres modules
export const supabase = getSupabase();

// Statut d'authentification global
export const authStatus = {
    isLoggedIn: false,
    user: null,
    loading: true,
    error: null
};

/**
 * Initialise l'authentification Supabase
 */
export const initAuth = async () => {
    try {
        // S'assurer que supabase est bien initialisé
        const supabaseClient = getSupabase();
        
        // Vérifier la session actuelle
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        // Mettre à jour le statut
        updateAuthStatus(!!session, session?.user || null);
        
        // Souscrire aux changements d'authentification
        const { data: authListener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
            updateAuthStatus(!!session, session?.user || null);
            
            // Déclencher un événement pour informer les autres composants
            document.dispatchEvent(new CustomEvent('auth:state-change', { 
                detail: { isAuthenticated: !!session, user: session?.user || null }
            }));
        });
        
        console.log('Authentification initialisée avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        updateAuthStatus(false, null, error.message);
        return false;
    } finally {
        authStatus.loading = false;
    }
};

/**
 * Met à jour le statut d'authentification
 */
const updateAuthStatus = (isLoggedIn, user, error = null) => {
    authStatus.isLoggedIn = isLoggedIn;
    authStatus.user = user;
    authStatus.error = error;
    authStatus.loading = false;
    
    console.log('Statut d\'authentification mis à jour:', { isLoggedIn, user });
};

// Attendre DOMContentLoaded pour s'assurer que le script Supabase est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded - Tentative d'initialisation de Supabase");
    // Seulement tenter d'initialiser si window.supabase existe
    if (typeof window.supabase !== 'undefined') {
        const supabaseClient = initSupabase(); 
        
        // Initialiser l'authentification
        initAuth().then(success => {
            if (success) {
                console.log("Authentification initialisée avec succès");
            }
        });
    } else {
        console.warn("La bibliothèque Supabase n'est pas encore chargée. Attente de l'événement 'supabase-loaded'");
    }
});

// Si l'initialisation a échoué, attendre l'événement supabase-loaded
window.addEventListener('supabase-loaded', () => {
    console.log("Événement supabase-loaded reçu, tentative d'initialisation");
    if (typeof window.supabase !== 'undefined') {
        const supabaseClient = initSupabase();
        
        // Initialiser l'authentification
        initAuth().then(success => {
            if (success) {
                console.log("Authentification initialisée après chargement différé");
            }
        });
    } else {
        console.error("La bibliothèque Supabase n'est pas disponible même après l'événement supabase-loaded");
    }
});

/**
 * Inscrit un nouvel utilisateur
 */
export const signUp = async (email, password) => {
    try {
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        console.log('Inscription réussie, vérifiez votre email pour confirmer votre compte');
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        
        // Déclencher un événement d'erreur d'authentification
        document.dispatchEvent(new CustomEvent('auth:error', {
            detail: { context: 'signup', error: error.message }
        }));
        
        return { success: false, error: error.message };
    }
};

/**
 * Connecte un utilisateur
 */
export const signIn = async (email, password) => {
    try {
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        console.log('Connexion réussie');
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        
        // Déclencher un événement d'erreur d'authentification
        document.dispatchEvent(new CustomEvent('auth:error', {
            detail: { context: 'signin', error: error.message }
        }));
        
        return { success: false, error: error.message };
    }
};

/**
 * Authentification avec un fournisseur OAuth (Google, GitHub, etc.)
 */
export const signInWithOAuth = async (provider, options = {}) => {
    try {
        const supabaseClient = getSupabase();
        
        const defaultOptions = {
            redirectTo: `${window.location.origin}/supabase-redirect.html`
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider,
            options: finalOptions
        });
        
        if (error) throw error;
        
        console.log(`Redirection vers ${provider} pour authentification`);
        return { success: true, data };
    } catch (error) {
        console.error(`Erreur lors de l'authentification avec ${provider}:`, error);
        
        // Déclencher un événement d'erreur d'authentification
        document.dispatchEvent(new CustomEvent('auth:error', {
            detail: { context: 'oauth', provider, error: error.message }
        }));
        
        return { success: false, error: error.message };
    }
};

/**
 * Déconnecte un utilisateur
 */
export const signOut = async () => {
    try {
        const supabaseClient = getSupabase();
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) throw error;
        
        console.log('Déconnexion réussie');
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export const resetPassword = async (email) => {
    try {
        const supabaseClient = getSupabase();
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/resetpassword.html`
        });
        
        if (error) throw error;
        
        console.log('Email de réinitialisation envoyé');
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
        
        // Déclencher un événement d'erreur d'authentification
        document.dispatchEvent(new CustomEvent('auth:error', {
            detail: { context: 'reset', error: error.message }
        }));
        
        return { success: false, error: error.message };
    }
};

/**
 * Met à jour le mot de passe d'un utilisateur
 */
export const updatePassword = async (password) => {
    try {
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient.auth.updateUser({
            password
        });
        
        if (error) throw error;
        
        console.log('Mot de passe mis à jour avec succès');
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du mot de passe:', error);
        
        // Déclencher un événement d'erreur d'authentification
        document.dispatchEvent(new CustomEvent('auth:error', {
            detail: { context: 'update-password', error: error.message }
        }));
        
        return { success: false, error: error.message };
    }
};

/**
 * Met à jour le profil utilisateur
 */
export const updateUserProfile = async (profile) => {
    try {
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient.auth.updateUser({
            data: profile
        });
        
        if (error) throw error;
        
        console.log('Profil mis à jour avec succès');
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        
        // Déclencher un événement d'erreur d'authentification
        document.dispatchEvent(new CustomEvent('auth:error', {
            detail: { context: 'update-profile', error: error.message }
        }));
        
        return { success: false, error: error.message };
    }
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const isAuthenticated = () => {
    return authStatus.isLoggedIn && authStatus.user !== null;
};

/**
 * Récupère l'utilisateur actuel
 */
export const getCurrentUser = () => {
    return authStatus.user;
}; 