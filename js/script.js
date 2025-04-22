// Gestionnaire de menu responsive
document.addEventListener('DOMContentLoaded', function() {
    // Éléments du menu
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const toggleMenuWidth = document.querySelector('.toggle-menu-width');
    
    // Fonctions pour gérer le menu mobile
    function openMenu() {
        menu.classList.add('active');
        menuToggle.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Empêche le défilement du body
    }
    
    function closeMenu() {
        menu.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaure le défilement
    }
    
    // Toggle le menu sur mobile
    menuToggle.addEventListener('click', function() {
        if (menu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Ferme le menu quand on clique sur l'overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
    
    // Ferme le menu quand on clique sur un lien du menu (sur mobile)
    const menuLinks = document.querySelectorAll('.menu a, .submenu-item');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMenu();
            }
        });
    });
    
    // Toggle la largeur du menu (compact/normal)
    if (toggleMenuWidth) {
        toggleMenuWidth.addEventListener('click', function() {
            menu.classList.toggle('compact');
            // Sauvegarde la préférence dans localStorage
            localStorage.setItem('menuCompact', menu.classList.contains('compact'));
        });
        
        // Restaure l'état du menu au chargement
        const menuCompact = localStorage.getItem('menuCompact') === 'true';
        if (menuCompact) {
            menu.classList.add('compact');
        }
    }
    
    // Gestionnaire des sous-menus
    const menuTriggers = document.querySelectorAll('.menu-trigger');
    menuTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const targetId = this.getAttribute('aria-controls');
            const targetSubmenu = document.getElementById(targetId);
            
            if (isExpanded) {
                this.setAttribute('aria-expanded', 'false');
                targetSubmenu.classList.remove('active');
            } else {
                this.setAttribute('aria-expanded', 'true');
                targetSubmenu.classList.add('active');
            }
        });
    });
    
    // Ferme le menu sur redimensionnement au-dessus de 768px
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && menu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Support des touches clavier pour l'accessibilité
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menu.classList.contains('active')) {
            closeMenu();
        }
    });
}); 