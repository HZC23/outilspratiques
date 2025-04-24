/**
 * Gestion de l'interface utilisateur du métronome
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si nous sommes sur la page du métronome
    if (!document.getElementById('metronomeTool')) return;

    // Gestion du panneau d'aide
    const helpButton = document.getElementById('metronomeHelp');
    const closeHelpButton = document.getElementById('closeMetronomeHelp');
    const helpPanel = document.getElementById('metronomeHelpPanel');

    if (helpButton && closeHelpButton && helpPanel) {
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

    // Gestion du mode plein écran
    const fullscreenButton = document.getElementById('metronomeFullscreen');
    const metronomeContainer = document.getElementById('metronomeTool');

    if (fullscreenButton && metronomeContainer) {
        fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                if (metronomeContainer.requestFullscreen) {
                    metronomeContainer.requestFullscreen();
                    fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
                } else if (metronomeContainer.mozRequestFullScreen) {
                    metronomeContainer.mozRequestFullScreen();
                } else if (metronomeContainer.webkitRequestFullscreen) {
                    metronomeContainer.webkitRequestFullscreen();
                } else if (metronomeContainer.msRequestFullscreen) {
                    metronomeContainer.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        });

        // Détecter les changements de plein écran
        document.addEventListener('fullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('mozfullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('MSFullscreenChange', updateFullscreenButtonIcon);

        function updateFullscreenButtonIcon() {
            if (document.fullscreenElement) {
                fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
            }
        }
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