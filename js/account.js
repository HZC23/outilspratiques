import { 
    supabase, 
    initAuth, 
    signUp, 
    signIn, 
    signOut, 
    resetPassword, 
    isAuthenticated,
    getCurrentUser,
    authStatus
} from './supabase.js';
import { DataSyncManager } from './data-sync.js';
import { CacheManager } from './cache.js';
import { NotificationManager } from './notification.js';

// État du panneau de compte
const accountPanelState = {
    isOpen: false
};

// Instance du gestionnaire de synchronisation des données
let dataSyncManager = null;

// Référence au panneau de compte
let accountPanel = null;

/**
 * Gestionnaire du panneau de compte utilisateur
 * Permet de gérer l'inscription, la connexion et la déconnexion des utilisateurs
 * ainsi que l'interface utilisateur du panneau de compte
 */
export const AccountManager = {
    panel: null,
    accountBtn: null,
    loginForm: null,
    registerForm: null,
    resetForm: null,
    logoutBtn: null,
    profileSection: null,
    lastSyncInfo: null,
    manualSyncBtn: null,
    initialized: false,
    
    /**
     * Initialise le gestionnaire de compte
     */
    init() {
        console.log('Initialisation du gestionnaire de compte');
        
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
        
        return true;
    },
    
    /**
     * Configure l'interface utilisateur et les écouteurs d'événements
     */
    setup() {
        if (this.initialized) return;
        
        // Récupérer les éléments du DOM
        this.accountBtn = document.getElementById('account-btn');
        this.panel = document.getElementById('account-panel');
        
        // Si le panel n'existe pas dans le DOM, le créer
        if (!this.panel) {
            this.createAccountPanel();
        }
        
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.resetForm = document.getElementById('reset-form');
        this.logoutBtn = document.getElementById('logout-btn');
        this.profileSection = document.getElementById('profile-section');
        this.lastSyncInfo = document.getElementById('last-sync-info');
        this.manualSyncBtn = document.getElementById('manual-sync-btn');
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
        
        // Mettre à jour l'interface en fonction de l'état d'authentification
        this.updateUI();
        
        this.initialized = true;
        console.log('Gestionnaire de compte initialisé');
    },
    
    /**
     * Crée le panneau de compte s'il n'existe pas déjà
     */
    createAccountPanel() {
        const panel = document.createElement('div');
        panel.id = 'account-panel';
        panel.className = 'account-panel';
        panel.setAttribute('aria-hidden', 'true');
        
        panel.innerHTML = `
            <div class="account-panel-header">
                <h2>Votre compte</h2>
                <button class="close-panel-btn" aria-label="Fermer le panneau">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="account-panel-content">
                <!-- Formulaire de connexion -->
                <form id="login-form" class="auth-form">
                    <h3>Connexion</h3>
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input type="email" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Mot de passe</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn primary-btn">Se connecter</button>
                        <button type="button" class="btn text-btn switch-form" data-form="register">Créer un compte</button>
                        <button type="button" class="btn text-btn switch-form" data-form="reset">Mot de passe oublié</button>
                    </div>
                </form>
                
                <!-- Formulaire d'inscription -->
                <form id="register-form" class="auth-form" style="display: none;">
                    <h3>Créer un compte</h3>
                    <div class="form-group">
                        <label for="register-email">Email</label>
                        <input type="email" id="register-email" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Mot de passe</label>
                        <input type="password" id="register-password" required minlength="6">
                        <small>Le mot de passe doit contenir au moins 6 caractères</small>
                    </div>
                    <div class="form-group">
                        <label for="register-password-confirm">Confirmer le mot de passe</label>
                        <input type="password" id="register-password-confirm" required minlength="6">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn primary-btn">S'inscrire</button>
                        <button type="button" class="btn text-btn switch-form" data-form="login">Déjà un compte ? Se connecter</button>
                    </div>
                </form>
                
                <!-- Formulaire de réinitialisation de mot de passe -->
                <form id="reset-form" class="auth-form" style="display: none;">
                    <h3>Réinitialiser le mot de passe</h3>
                    <div class="form-group">
                        <label for="reset-email">Email</label>
                        <input type="email" id="reset-email" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn primary-btn">Envoyer le lien</button>
                        <button type="button" class="btn text-btn switch-form" data-form="login">Retour à la connexion</button>
                    </div>
                </form>
                
                <!-- Section profil (visible une fois connecté) -->
                <div id="profile-section" class="profile-section" style="display: none;">
                    <div class="user-info">
                        <div class="avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="details">
                            <h3 id="user-email"></h3>
                            <p id="user-status">Connecté</p>
                        </div>
                    </div>
                    
                    <div class="sync-section">
                        <h3>Synchronisation</h3>
                        <p id="last-sync-info">Dernière synchronisation : jamais</p>
                        <button id="manual-sync-btn" class="btn secondary-btn">
                            <i class="fas fa-sync-alt"></i> Synchroniser maintenant
                        </button>
                    </div>
                    
                    <div class="account-actions">
                        <button id="logout-btn" class="btn danger-btn">
                            <i class="fas fa-sign-out-alt"></i> Se déconnecter
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter le panneau au document
        document.body.appendChild(panel);
        this.panel = panel;
    },
    
    /**
     * Configure les écouteurs d'événements pour le panneau de compte
     */
    setupEventListeners() {
        // Ouvrir/fermer le panneau de compte
        if (this.accountBtn) {
            this.accountBtn.addEventListener('click', () => this.togglePanel());
        } else {
            console.warn("Élément account-btn non trouvé dans le DOM");
        }
        
        // Fermer le panneau avec le bouton de fermeture
        const closeBtn = this.panel?.querySelector('.close-panel-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanel());
        }
        
        // Fermer le panneau lorsqu'on clique en dehors
        document.addEventListener('click', (event) => {
            if (this.panel && this.panel.getAttribute('aria-hidden') === 'false' && 
                !this.panel.contains(event.target) && event.target !== this.accountBtn) {
                this.closePanel();
            }
        });
        
        // Changer de formulaire (login, register, reset)
        if (this.panel) {
            const switchBtns = this.panel.querySelectorAll('.switch-form');
            switchBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const formType = btn.getAttribute('data-form');
                    this.switchForm(formType);
                });
            });
        }
        
        // Formulaire de connexion
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleLogin();
            });
        }
        
        // Formulaire d'inscription
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleRegister();
            });
        }
        
        // Formulaire de réinitialisation de mot de passe
        if (this.resetForm) {
            this.resetForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleReset();
            });
        }
        
        // Bouton de déconnexion
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Bouton de synchronisation manuelle
        if (this.manualSyncBtn) {
            this.manualSyncBtn.addEventListener('click', () => this.handleManualSync());
        }
        
        // Écouteurs pour les événements d'authentification
        document.addEventListener('auth:state-change', () => this.updateUI());
        document.addEventListener('data:synced', () => this.updateSyncInfo());
        
        // Mettre à jour les infos de synchronisation périodiquement
        setInterval(() => this.updateSyncInfo(), 60000); // Toutes les minutes
    },
    
    /**
     * Gère l'ouverture et la fermeture du panneau de compte
     */
    togglePanel() {
        if (this.panel.getAttribute('aria-hidden') === 'true') {
            this.openPanel();
        } else {
            this.closePanel();
        }
    },
    
    /**
     * Ouvre le panneau de compte
     */
    openPanel() {
        this.panel.setAttribute('aria-hidden', 'false');
        this.accountBtn.setAttribute('aria-expanded', 'true');
        this.panel.classList.add('open');
        this.updateUI();
    },
    
    /**
     * Ferme le panneau de compte
     */
    closePanel() {
        this.panel.setAttribute('aria-hidden', 'true');
        this.accountBtn.setAttribute('aria-expanded', 'false');
        this.panel.classList.remove('open');
    },
    
    /**
     * Change le formulaire affiché
     */
    switchForm(formType) {
        // Masquer tous les formulaires
        const forms = this.panel.querySelectorAll('.auth-form');
        forms.forEach(form => {
            form.style.display = 'none';
        });
        
        // Masquer la section profil
        if (this.profileSection) {
            this.profileSection.style.display = 'none';
        }
        
        // Afficher le formulaire demandé
        switch (formType) {
            case 'login':
                this.loginForm.style.display = 'block';
                break;
            case 'register':
                this.registerForm.style.display = 'block';
                break;
            case 'reset':
                this.resetForm.style.display = 'block';
                break;
            case 'profile':
                this.profileSection.style.display = 'block';
                break;
        }
    },
    
    /**
     * Met à jour l'interface utilisateur en fonction de l'état d'authentification
     */
    updateUI() {
        if (isAuthenticated()) {
            // Utilisateur connecté, afficher la section profil
            this.switchForm('profile');
            
            // Mettre à jour les informations de l'utilisateur
            const user = getCurrentUser();
            if (user) {
                const userEmailEl = document.getElementById('user-email');
                if (userEmailEl) {
                    userEmailEl.textContent = user.email;
                }
            }
            
            // Mettre à jour le bouton du compte
            this.accountBtn.classList.add('logged-in');
            this.accountBtn.setAttribute('title', 'Compte connecté');
            
            // Mettre à jour les informations de synchronisation
            this.updateSyncInfo();
        } else {
            // Utilisateur non connecté, afficher le formulaire de connexion
            this.switchForm('login');
            
            // Mettre à jour le bouton du compte
            this.accountBtn.classList.remove('logged-in');
            this.accountBtn.setAttribute('title', 'Se connecter');
        }
    },
    
    /**
     * Met à jour les informations de synchronisation
     */
    updateSyncInfo() {
        if (!isAuthenticated() || !this.lastSyncInfo) return;
        
        // Vérifier si DataSyncManager est disponible
        if (DataSyncManager && typeof DataSyncManager.getTimeSinceLastSync === 'function') {
            const lastSync = DataSyncManager.getTimeSinceLastSync();
            this.lastSyncInfo.textContent = `Dernière synchronisation : ${lastSync}`;
        }
    },
    
    /**
     * Gère la soumission du formulaire de connexion
     */
    async handleLogin() {
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                NotificationManager.error('Veuillez remplir tous les champs');
                return;
            }
            
            // Désactiver le bouton de soumission pendant la connexion
            const submitBtn = this.loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
            
            // Tentative de connexion
            const { success, error } = await signIn(email, password);
            
            if (success) {
                NotificationManager.success('Connexion réussie');
                this.updateUI();
            } else {
                NotificationManager.error(`Échec de la connexion: ${error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            NotificationManager.error(`Une erreur est survenue: ${error.message}`);
        } finally {
            // Réactiver le bouton de soumission
            const submitBtn = this.loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Se connecter';
        }
    },
    
    /**
     * Gère la soumission du formulaire d'inscription
     */
    async handleRegister() {
        try {
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-password-confirm').value;
            
            if (!email || !password || !passwordConfirm) {
                NotificationManager.error('Veuillez remplir tous les champs');
                return;
            }
            
            if (password !== passwordConfirm) {
                NotificationManager.error('Les mots de passe ne correspondent pas');
                return;
            }
            
            if (password.length < 6) {
                NotificationManager.error('Le mot de passe doit contenir au moins 6 caractères');
                return;
            }
            
            // Désactiver le bouton de soumission pendant l'inscription
            const submitBtn = this.registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';
            
            // Tentative d'inscription
            const { success, error } = await signUp(email, password);
            
            if (success) {
                NotificationManager.success('Inscription réussie, vérifiez votre email pour confirmer votre compte');
                this.switchForm('login');
            } else {
                NotificationManager.error(`Échec de l'inscription: ${error}`);
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            NotificationManager.error(`Une erreur est survenue: ${error.message}`);
        } finally {
            // Réactiver le bouton de soumission
            const submitBtn = this.registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'S\'inscrire';
        }
    },
    
    /**
     * Gère la soumission du formulaire de réinitialisation de mot de passe
     */
    async handleReset() {
        try {
            const email = document.getElementById('reset-email').value;
            
            if (!email) {
                NotificationManager.error('Veuillez saisir votre adresse email');
                return;
            }
            
            // Désactiver le bouton de soumission pendant la réinitialisation
            const submitBtn = this.resetForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
            
            // Tentative de réinitialisation
            const { success, error } = await resetPassword(email);
            
            if (success) {
                NotificationManager.success('Instructions de réinitialisation envoyées à votre adresse email');
                this.switchForm('login');
            } else {
                NotificationManager.error(`Échec de l'envoi: ${error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            NotificationManager.error(`Une erreur est survenue: ${error.message}`);
        } finally {
            // Réactiver le bouton de soumission
            const submitBtn = this.resetForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer le lien';
        }
    },
    
    /**
     * Gère la déconnexion
     */
    async handleLogout() {
        try {
            // Désactiver le bouton de déconnexion
            this.logoutBtn.disabled = true;
            this.logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Déconnexion...';
            
            // Tentative de déconnexion
            const { success, error } = await signOut();
            
            if (success) {
                NotificationManager.success('Déconnexion réussie');
                this.closePanel();
            } else {
                NotificationManager.error(`Échec de la déconnexion: ${error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            NotificationManager.error(`Une erreur est survenue: ${error.message}`);
        } finally {
            // Réactiver le bouton de déconnexion
            this.logoutBtn.disabled = false;
            this.logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Se déconnecter';
        }
    },
    
    /**
     * Gère la synchronisation manuelle des données
     */
    async handleManualSync() {
        try {
            if (!isAuthenticated()) {
                NotificationManager.error('Vous devez être connecté pour synchroniser vos données');
                return;
            }
            
            // Vérifier si DataSyncManager est disponible
            if (!DataSyncManager || typeof DataSyncManager.sync !== 'function') {
                NotificationManager.error('Synchronisation non disponible');
                return;
            }
            
            // Désactiver le bouton pendant la synchronisation
            this.manualSyncBtn.disabled = true;
            this.manualSyncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Synchronisation...';
            
            // Tentative de synchronisation
            const { success, error } = await DataSyncManager.sync();
            
            if (success) {
                NotificationManager.success('Synchronisation réussie');
                this.updateSyncInfo();
            } else {
                NotificationManager.error(`Échec de la synchronisation: ${error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
            NotificationManager.error(`Une erreur est survenue: ${error.message}`);
        } finally {
            // Réactiver le bouton de synchronisation
            this.manualSyncBtn.disabled = false;
            this.manualSyncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Synchroniser maintenant';
        }
    }
};

// Initialiser le gestionnaire de compte
document.addEventListener('DOMContentLoaded', () => {
    AccountManager.init();
}); 