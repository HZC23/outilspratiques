/**
 * Script d'initialisation du métronome
 * Charge tous les scripts nécessaires au fonctionnement du métronome
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si nous sommes sur la page du métronome
    if (!document.getElementById('metronomeTool')) return;
    
    // Fonction pour charger un script JavaScript
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        if (callback) {
            script.onload = callback;
        }
        
        document.head.appendChild(script);
        console.log(`Script chargé: ${src}`);
    }
    
    // Charger les scripts dans l'ordre
    loadScript('js/tools/metronome-worker.js', () => {
        loadScript('js/tools/metronome.js', () => {
            loadScript('js/tools/metronome-ui.js', () => {
                console.log('Tous les scripts du métronome ont été chargés');
                
                // Vérifier si le métronome est correctement initialisé
                if (!window.metronome) {
                    console.error('Le métronome n\'a pas été correctement initialisé');
                }
            });
        });
    });
    
    // Ajouter un message pour les navigateurs qui ne supportent pas l'API Web Audio
    if (!window.AudioContext && !window.webkitAudioContext) {
        const metronomeContent = document.querySelector('.tool-content');
        if (metronomeContent) {
            const warningElement = document.createElement('div');
            warningElement.className = 'audio-warning';
            warningElement.innerHTML = `
                <div class="warning-box">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Votre navigateur ne prend pas en charge l'API Web Audio, nécessaire au fonctionnement du métronome.</p>
                    <p>Veuillez utiliser un navigateur plus récent comme Chrome, Firefox, Safari ou Edge.</p>
                </div>
            `;
            metronomeContent.prepend(warningElement);
        }
    }
}); 