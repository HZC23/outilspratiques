/**
 * Script d'initialisation principal pour l'UI
 * Importe et utilise le gestionnaire de menu
 */
import { MenuManager } from './menu.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le gestionnaire de menu
    if (!window.menuInitialized) {
        MenuManager.init();
        window.menuInitialized = true;
    }
}); 