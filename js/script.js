// Gestionnaire de menu responsive
document.addEventListener('DOMContentLoaded', function() {
    // Éléments du menu
    const menuToggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mainMenu');
    const menuOverlay = document.querySelector('.menu-overlay');
    
    if (!menuToggle || !menu) return;
    
    // Fonction pour basculer le menu
    function toggleMenu() {
        const isActive = menu.classList.contains('active');
        
        if (isActive) {
            menu.classList.remove('active');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            if (menuOverlay) menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            menu.classList.add('active');
            menuToggle.classList.add('active');
            menuToggle.setAttribute('aria-expanded', 'true');
            if (menuOverlay) menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Écouteurs d'événements
    menuToggle.addEventListener('click', toggleMenu);
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', toggleMenu);
    }
    
    // Ferme le menu sur redimensionnement au-dessus de 768px
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && menu.classList.contains('active')) {
            toggleMenu();
        }
    });
    
    // Support des touches clavier pour l'accessibilité
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menu.classList.contains('active')) {
            toggleMenu();
        }
    });
}); 