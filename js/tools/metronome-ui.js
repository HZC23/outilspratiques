/**
 * Gestion de l'interface utilisateur du métronome
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si nous sommes sur la page du métronome
    const metronomeContainer = document.querySelector('.metronome-container');
    if (!metronomeContainer) return;

    // Initialiser le métronome
    initMetronome();

    // Récupérer les éléments du DOM
    const tempoInput = document.getElementById('tempo');
    const tempoSlider = document.getElementById('tempoSlider');
    const beatsPerMeasureInput = document.getElementById('beatsPerMeasure');
    const noteValueSelect = document.getElementById('noteValue');
    const startButton = document.getElementById('startMetronome');
    const tapTempoButton = document.getElementById('tapTempo');
    const tapCounterDisplay = document.getElementById('tapCounter');
    const fullscreenButton = document.getElementById('metronomeFullscreen');
    const tapTempoContainer = document.querySelector('.tap-tempo-container');
    const helpButton = document.getElementById('metronomeHelp');
    const helpPanel = document.getElementById('metronomeHelpPanel');
    const closeHelpButton = document.getElementById('closeMetronomeHelp');

    // Initialiser le visualiseur et l'animation
    setupMetronomeVisualization();

    // Le plein écran est maintenant géré par le module fullscreen.js global

    // Configurer les fonctionnalités d'aide
    if (helpButton && helpPanel && closeHelpButton) {
        helpButton.addEventListener('click', () => {
            helpPanel.classList.add('show');
        });
        closeHelpButton.addEventListener('click', () => {
            helpPanel.classList.remove('show');
        });

        // Fermer le panneau d'aide en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (helpPanel.classList.contains('show') && 
                !helpPanel.contains(e.target) && 
                e.target !== helpButton) {
                helpPanel.classList.remove('show');
            }
        });
    }

    // Gestion de l'option d'accentuation personnalisée
    const accentSelect = document.getElementById('accentFirst');
    const accentPattern = document.getElementById('accentPattern');

    if (accentSelect && accentPattern) {
        accentSelect.addEventListener('change', () => {
            if (accentSelect.value === 'custom') {
                accentPattern.style.display = 'flex';
            } else {
                accentPattern.style.display = 'none';
            }
        });

        // Initialiser l'état
        accentPattern.style.display = accentSelect.value === 'custom' ? 'flex' : 'none';
    }

    // Gestion de la vibration
    const vibrationCheckbox = document.getElementById('vibration');
    
    if (vibrationCheckbox) {
        vibrationCheckbox.addEventListener('change', () => {
            // Demander la permission pour utiliser la vibration si nécessaire
            if (vibrationCheckbox.checked && 'vibrate' in navigator) {
                // Test de vibration
                navigator.vibrate(200);
            }
        });

        // Désactiver l'option si la vibration n'est pas supportée
        if (!('vibrate' in navigator)) {
            vibrationCheckbox.disabled = true;
            vibrationCheckbox.checked = false;
            vibrationCheckbox.parentElement.title = 'Vibration non supportée sur cet appareil';
        }
    }

    // Extension du métronome pour supporter la vibration
    if (window.metronome && 'vibrate' in navigator) {
        const originalScheduleNote = window.metronome.scheduleNote;
        
        window.metronome.scheduleNote = function(time) {
            // Appeler la méthode originale
            originalScheduleNote.call(this, time);
            
            // Ajouter la vibration si activée
            const vibrationCheckbox = document.getElementById('vibration');
            if (vibrationCheckbox && vibrationCheckbox.checked) {
                const currentTime = this.audioContext.currentTime;
                const delay = (time - currentTime) * 1000;
                
                if (delay > 0) {
                    setTimeout(() => {
                        const isAccented = this.beatCount % this.beatsPerMeasure === 0;
                        navigator.vibrate(isAccented ? 100 : 50);
                    }, delay);
                }
            }
        };
    }
}); 