/**
 * Gestion du statut d'authentification dans l'interface
 */
import { isAuthenticated, getCurrentUser, signOut } from './supabase.js';

/**
 * Met à jour l'interface en fonction du statut d'authentification
 */
export function updateAuthUI() {
    const authButtons = document.querySelectorAll('.auth-button');
    if (!authButtons || authButtons.length === 0) return;

    const isLoggedIn = isAuthenticated();
    const currentUser = getCurrentUser();

    authButtons.forEach(button => {
        // Récupérer le conteneur parent pour pouvoir le remplacer
        const container = button.parentElement;
        
        if (isLoggedIn && currentUser) {
            // Créer un menu déroulant pour l'utilisateur connecté
            const dropdown = document.createElement('div');
            dropdown.className = 'auth-dropdown';
            
            const userInitial = currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U';
            
            dropdown.innerHTML = `
                <button class="auth-button logged-in" aria-label="Menu utilisateur" aria-expanded="false">
                    <span class="user-initial">${userInitial}</span>
                </button>
                <div class="dropdown-menu">
                    <span class="user-email">${currentUser.email}</span>
                    <a href="html/profile.html" class="dropdown-item">
                        <i class="fas fa-user-circle"></i> Mon profil
                    </a>
                    <button class="dropdown-item logout-button">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            `;
            
            // Remplacer le bouton par le dropdown
            container.replaceChild(dropdown, button);
            
            // Ajouter les écouteurs d'événements
            const dropdownButton = dropdown.querySelector('.auth-button');
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            const logoutButton = dropdown.querySelector('.logout-button');
            
            // Ouvrir/fermer le menu déroulant
            dropdownButton.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
                dropdownButton.setAttribute('aria-expanded', dropdownMenu.classList.contains('show'));
            });
            
            // Gérer la déconnexion
            logoutButton.addEventListener('click', async () => {
                try {
                    await signOut();
                    window.location.reload();
                } catch (error) {
                    console.error('Erreur lors de la déconnexion:', error);
                }
            });
            
            // Fermer le menu déroulant en cliquant ailleurs
            document.addEventListener('click', () => {
                if (dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                    dropdownButton.setAttribute('aria-expanded', 'false');
                }
            });
        } else {
            // Utilisateur non connecté, s'assurer que le bouton est correct
            if (!button.classList.contains('auth-button') || button.classList.contains('logged-in')) {
                const newButton = document.createElement('a');
                newButton.href = 'html/login.html';
                newButton.className = 'auth-button';
                newButton.setAttribute('aria-label', 'Connexion ou inscription');
                newButton.innerHTML = '<i class="fas fa-user" aria-hidden="true"></i>';
                
                // Remplacer le dropdown par le bouton
                if (container.querySelector('.auth-dropdown')) {
                    container.replaceChild(newButton, container.querySelector('.auth-dropdown'));
                } else {
                    container.replaceChild(newButton, button);
                }
            }
        }
    });
}

// Mettre à jour l'interface à chaque changement d'authentification
document.addEventListener('auth:state-change', updateAuthUI);

// Mettre à jour l'interface au chargement de la page
document.addEventListener('DOMContentLoaded', updateAuthUI); 