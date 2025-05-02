/**
 * Métronome avec battements réglables et haute précision
 * Fichier unifié incluant toutes les fonctionnalités:
 * - Classe de base du métronome
 * - Worker de timing haute précision (intégré)
 * - Interface utilisateur avancée 
 * - Initialisation et vérification de compatibilité
 */
class Metronome {
    constructor() {
        // État initial
        this.tempo = 120;
        this.isPlaying = false;
        this.beatsPerMeasure = 4;
        this.audioContext = null;
        this.nextNoteTime = 0.0;
        this.timerWorker = null;
        this.beatCount = 0;
        this.volume = 0.8;
        this.accentFirst = true;
        this.soundBuffers = {};
        this.customAccents = null;
        this.lookahead = 25.0; // intervalle en ms pour vérifier les notes à jouer
        this.scheduleAheadTime = 0.1; // combien de secondes à l'avance pour planifier l'audio
        this.animationFrameId = null;
        this.fallbackTimerId = null;
        this.vibrationEnabled = false; // État de la vibration
        
        // Initialisation différée
        if (document.getElementById('metronomeTool')) {
            console.log('Métronome initialisé');
            this.setupInterface();
            this.setupEventListeners();
            // Remplacer la création du worker par l'utilisation directe du scheduler
            this.useWorkerFallback = true;
            this.preloadSounds();
        } else {
            console.log('Éléments du métronome non présents dans la page actuelle');
        }
    }
    
    setupInterface() {
        try {
        // Récupérer tous les éléments d'interface
        this.tempoDisplay = document.getElementById('currentTempo');
        this.tempoSlider = document.getElementById('tempoSlider');
        this.startButton = document.getElementById('startMetronome');
        this.stopButton = document.getElementById('stopMetronome');
        this.timeSignature = document.getElementById('timeSignature');
        this.volumeControl = document.getElementById('volume');
        this.accentFirstSelect = document.getElementById('accentFirst');
        this.visualFlash = document.getElementById('visualFlash');
        this.tempoUpButton = document.getElementById('tempoUp');
        this.tempoDownButton = document.getElementById('tempoDown');
        this.beatIndicator = document.getElementById('beatIndicator');
        this.presetButtons = document.querySelectorAll('.preset-btn');
        
        // Initialiser les valeurs
            if (this.tempoSlider) this.tempoSlider.value = this.tempo;
            if (this.tempoDisplay) this.tempoDisplay.textContent = this.tempo;
            
            // Initialiser le pattern d'accentuation
            this.updateAccentPattern();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'interface:', error);
        }
    }
    
    setupEventListeners() {
        try {
        // Configurer les écouteurs d'événements
            if (this.tempoSlider) {
        this.tempoSlider.addEventListener('input', () => {
            this.tempo = parseInt(this.tempoSlider.value);
            this.tempoDisplay.textContent = this.tempo;
        });
            }
        
            if (this.startButton) {
        this.startButton.addEventListener('click', () => {
            this.initializeAudioContext();
            if (!this.isPlaying) {
                this.start();
                this.startButton.disabled = true;
                this.stopButton.disabled = false;
            }
        });
            }
        
            if (this.stopButton) {
        this.stopButton.addEventListener('click', () => {
            this.stop();
            this.startButton.disabled = false;
            this.stopButton.disabled = true;
        });
            }
        
            if (this.timeSignature) {
        this.timeSignature.addEventListener('change', () => {
            this.beatsPerMeasure = parseInt(this.timeSignature.value);
            this.updateAccentPattern();
        });
            }
        
            if (this.volumeControl) {
        this.volumeControl.addEventListener('input', () => {
            this.volume = parseInt(this.volumeControl.value) / 100;
        });
            }
        
            if (this.tempoUpButton) {
        this.tempoUpButton.addEventListener('click', () => {
            this.tempo = Math.min(240, this.tempo + 1);
            this.updateTempoDisplay();
        });
            }
        
            if (this.tempoDownButton) {
        this.tempoDownButton.addEventListener('click', () => {
            this.tempo = Math.max(40, this.tempo - 1);
            this.updateTempoDisplay();
        });
            }
            
            // Gestion des accents personnalisés
            if (this.accentFirstSelect) {
                this.accentFirstSelect.addEventListener('change', () => {
                    this.accentFirst = this.accentFirstSelect.value === 'true';
                    
                    // Mettre à jour les accents personnalisés si nécessaire
                    if (this.accentFirstSelect.value === 'custom') {
                        this.updateCustomAccentPattern();
                    }
                });
            }
            
            // Gérer l'activation des vibrations
            const vibrationCheckbox = document.getElementById('vibration');
            if (vibrationCheckbox) {
                // Vérifier si la vibration est supportée
                if ('vibrate' in navigator) {
                    vibrationCheckbox.addEventListener('change', () => {
                        this.vibrationEnabled = vibrationCheckbox.checked;
                        if (this.vibrationEnabled) {
                            // Test de vibration au changement
                            navigator.vibrate(50);
                        }
                    });
                } else {
                    vibrationCheckbox.disabled = true;
                    vibrationCheckbox.checked = false;
                    vibrationCheckbox.parentElement.title = 'Vibration non supportée sur cet appareil';
                    vibrationCheckbox.parentElement.style.opacity = '0.5';
                }
            }
        
        // Ajouter les écouteurs pour les boutons préréglés
            if (this.presetButtons) {
        this.presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.tempo = parseInt(button.dataset.tempo);
                this.updateTempoDisplay();
            });
        });
            }
            
            // Gestion des raccourcis clavier
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (this.isPlaying) {
                        this.stop();
                        if (this.startButton && this.stopButton) {
                            this.startButton.disabled = false;
                            this.stopButton.disabled = true;
                        }
                    } else {
                        this.initializeAudioContext();
                        this.start();
                        if (this.startButton && this.stopButton) {
                            this.startButton.disabled = true;
                            this.stopButton.disabled = false;
                        }
                    }
                }
            });
            
            // Gestion de la bannière d'information
            const infoBanner = document.getElementById('audio-info-banner');
            if (infoBanner) {
                const closeButton = infoBanner.querySelector('.close-banner');
                if (closeButton) {
                    closeButton.addEventListener('click', () => {
                        infoBanner.style.display = 'none';
                        // Stocker la préférence de l'utilisateur
                        localStorage.setItem('metronome_info_banner_closed', 'true');
                    });
                }
                
                // Vérifier si l'utilisateur a déjà fermé la bannière
                if (localStorage.getItem('metronome_info_banner_closed') === 'true') {
                    infoBanner.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Erreur lors de la configuration des écouteurs d\'événements:', error);
        }
    }

    updateTempoDisplay() {
        if (this.tempoSlider) this.tempoSlider.value = this.tempo;
        if (this.tempoDisplay) this.tempoDisplay.textContent = this.tempo;
    }

    updateAccentPattern() {
        const accentPattern = document.getElementById('accentPattern');
        if (!accentPattern) return;
        
        // Créer le pattern d'accentuation en fonction de la mesure
        accentPattern.innerHTML = '';
        for (let i = 0; i < this.beatsPerMeasure; i++) {
            const checkbox = document.createElement('div');
            checkbox.className = 'accent-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="accent-${i}" class="accent-input" ${i === 0 ? 'checked' : ''}>
                <label for="accent-${i}">${i + 1}</label>
            `;
            accentPattern.appendChild(checkbox);
        }
        
        // Ajouter les écouteurs pour les cases à cocher d'accent
        document.querySelectorAll('.accent-input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateCustomAccentPattern();
            });
        });
    }
    
    updateCustomAccentPattern() {
        const accentCheckboxes = document.querySelectorAll('.accent-input');
        if (!accentCheckboxes.length) return;
        
        // Créer un tableau d'accents personnalisés
        this.customAccents = Array.from(accentCheckboxes).map(checkbox => checkbox.checked);
    }

    initializeAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('AudioContext initialisé avec succès');
                
                // Reprendre l'AudioContext si suspendu (important pour iOS/Safari)
                if (this.audioContext.state === 'suspended') {
                    // Essayer de débloquer l'AudioContext avec une interaction utilisateur
                    const resumeAudio = () => {
                        if (this.audioContext.state === 'suspended') {
                            this.audioContext.resume().then(() => {
                                console.log('AudioContext débloqué par interaction utilisateur');
                                // Jouer un son silencieux pour garantir le déblocage
                                this.testAudioPlayback();
                            });
                        }
                    };
                    
                    // Ajouter des écouteurs pour les événements d'interaction
                    document.addEventListener('click', resumeAudio, { once: true });
                    document.addEventListener('touchstart', resumeAudio, { once: true });
                    document.addEventListener('keydown', resumeAudio, { once: true });
                }
            } catch (e) {
                console.error('Erreur lors de l\'initialisation de l\'AudioContext:', e);
            }
        }
        return this.audioContext;
    }

    preloadSounds() {
        try {
            this.initializeAudioContext();
            if (!this.audioContext) return;
            
            // Tester la lecture audio avec un son simple pour débloquer l'AudioContext
            this.testAudioPlayback();
            
            // Générer des sons pour normal et accent
            this.generateMetronomeSounds();
            
            console.log('Sons de métronome générés avec succès');
        } catch (error) {
            console.error('Erreur lors du préchargement des sons:', error);
        }
    }
    
    // Méthode pour générer les sons du métronome
    generateMetronomeSounds() {
        try {
            if (!this.audioContext) return;
            
            // Générer son normal et son accentué
            this.soundBuffers['normal'] = this.generateToneBuffer(800, 0.02);
            this.soundBuffers['accent'] = this.generateToneBuffer(1200, 0.03);
            
            console.log('Sons du métronome générés avec succès');
        } catch (error) {
            console.error('Erreur lors de la génération des sons du métronome:', error);
        }
    }
    
    // Méthode pour tester l'audio et débloquer l'AudioContext
    testAudioPlayback() {
        try {
            if (!this.audioContext) return;
            
            // Créer un oscillateur silencieux pour débloquer l'audio sur iOS/Safari
            const testOsc = this.audioContext.createOscillator();
            const testGain = this.audioContext.createGain();
            
            // Volume à zéro pour être silencieux
            testGain.gain.setValueAtTime(0.001, this.audioContext.currentTime);
            
            testOsc.connect(testGain);
            testGain.connect(this.audioContext.destination);
            
            // Jouer pendant une très courte durée
            const now = this.audioContext.currentTime;
            testOsc.start(now);
            testOsc.stop(now + 0.001);
            
            console.log('Test audio joué pour débloquer l\'AudioContext');
        } catch (error) {
            console.warn('Erreur lors du test audio:', error);
        }
    }
    
    generateToneBuffer(frequency, duration) {
        try {
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Sinusoïde avec une enveloppe d'amplitude qui décroît
            const envelope = 1 - t / duration;
                // Adoucir l'attaque pour éviter les clics
                const attack = Math.min(1, i / (0.002 * sampleRate));
                data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * attack;
        }
        
        return buffer;
        } catch (error) {
            console.error('Erreur lors de la génération du buffer audio:', error);
            return null;
        }
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat;
        this.beatCount = (this.beatCount + 1) % this.beatsPerMeasure;
    }

    isAccented(beatIndex) {
        // Si nous utilisons des accents personnalisés
        if (this.accentFirstSelect && this.accentFirstSelect.value === 'custom' && this.customAccents) {
            return this.customAccents[beatIndex];
        }
        
        // Sinon, utiliser l'accentuation standard (premier temps)
        return this.accentFirst && beatIndex === 0;
    }

    scheduleNote(time) {
        try {
            // Déterminer si c'est un temps accentué
            const isAccented = this.isAccented(this.beatCount);
            const variant = isAccented ? 'accent' : 'normal';
            
            // Forcer une vérification de l'état de l'AudioContext 
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(err => console.warn('Impossible de reprendre l\'AudioContext:', err));
            }
        
            // Sélectionner le buffer audio
            let soundBuffer = this.soundBuffers[variant];
            
            // Essayer la lecture avec le buffer audio chargé
            let soundPlayed = false;
            
            // Si on a un buffer audio, essayer de l'utiliser
            if (soundBuffer) {
                try {
                    const source = this.audioContext.createBufferSource();
                    const gainNode = this.audioContext.createGain();
                    
                    source.buffer = soundBuffer;
                    // Volume plus fort pour les accents
                    gainNode.gain.value = isAccented ? this.volume * 1.5 : this.volume;
                    
                    source.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    source.start(time);
                    soundPlayed = true;
                } catch (bufferError) {
                    console.warn('Erreur lors de la lecture du buffer audio:', bufferError);
                    // Continuer pour utiliser le fallback oscillateur
                }
            }
            
            // Si la lecture du buffer a échoué, utiliser l'oscillateur comme fallback fiable
            if (!soundPlayed) {
                this.playOscillatorSound(time, isAccented);
            }

            // Animation visuelle optimisée avec requestAnimationFrame
            if (this.visualFlash && this.visualFlash.checked && this.beatIndicator) {
                const currentTime = this.audioContext.currentTime;
                const delay = (time - currentTime) * 1000;
                
                if (delay > 0) {
                    this.scheduleVisualFeedback(delay, isAccented);
                }
            }
            
            // Ajouter la vibration si activée
            if (this.vibrationEnabled && 'vibrate' in navigator) {
                const currentTime = this.audioContext.currentTime;
                const delay = (time - currentTime) * 1000;
                
                if (delay > 0) {
                    setTimeout(() => {
                        // Vibration plus longue pour les accents
                        navigator.vibrate(isAccented ? 80 : 40);
                    }, delay);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la planification de la note:', error);
            // Fallback ultime - jouer un son immédiatement
            this.playEmergencySound(isAccented);
        }
    }
    
    scheduleVisualFeedback(delay, isAccented) {
            setTimeout(() => {
            if (!this.beatIndicator) return;
            
            // Appliquer une classe différente selon l'accentuation
                this.beatIndicator.classList.add('active');
            if (isAccented) {
                this.beatIndicator.classList.add('accented');
            }
            
            // Utiliser requestAnimationFrame pour l'animation
            const startTime = performance.now();
            const duration = 100; // durée de l'animation en ms
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                
                if (elapsed >= duration) {
                    this.beatIndicator.classList.remove('active', 'accented');
                    return;
                }
                
                // Mettre à jour l'intensité de l'animation
                const intensity = 1 - (elapsed / duration);
                this.beatIndicator.style.transform = `scale(${1 + 0.2 * intensity})`;
                this.beatIndicator.style.opacity = 0.5 + 0.5 * intensity;
                
                this.animationFrameId = requestAnimationFrame(animate);
            };
            
            this.animationFrameId = requestAnimationFrame(animate);
        }, delay);
    }
    
    // Méthode de secours pour jouer un son immédiatement en cas d'erreur
    playEmergencySound(isAccented) {
        try {
            if (!this.audioContext) return;
            
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = isAccented ? 1200 : 800;
            
            gainNode.gain.value = this.volume;
            
            osc.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Jouer immédiatement
            const now = this.audioContext.currentTime;
            osc.start(now);
            osc.stop(now + 0.1);
            
            console.log('Son d\'urgence joué');
        } catch (error) {
            console.error('Échec critique de la lecture audio:', error);
        }
    }
    
    playOscillatorSound(time, isAccented) {
        try {
            // Forcer une vérification/reprise de l'AudioContext
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(err => console.warn('Impossible de reprendre l\'AudioContext:', err));
            }
            
            // Création du son avec oscillateur (fallback)
            const osc = this.audioContext.createOscillator();
            const envelope = this.audioContext.createGain();
            
            // Définir les paramètres pour un son de métronome classique
            osc.frequency.value = isAccented ? 1200 : 800;
            osc.type = 'triangle';
            
            // Configuration de l'envelope avec une attaque douce pour éviter les clics
            envelope.gain.setValueAtTime(0, time);
            envelope.gain.linearRampToValueAtTime(this.volume, time + 0.001);
            envelope.gain.linearRampToValueAtTime(0.001, time + 0.03);

            osc.connect(envelope);
            envelope.connect(this.audioContext.destination);

            // Assurer que l'oscillateur est joué même si le timing est légèrement décalé
            const now = this.audioContext.currentTime;
            const actualStartTime = Math.max(now, time);
            
            osc.start(actualStartTime);
            osc.stop(actualStartTime + 0.03);
        } catch (error) {
            console.error('Erreur lors de la génération du son d\'oscillateur:', error);
        }
    }

    scheduler() {
        try {
            // Planifier les notes jusqu'à scheduleAheadTime secondes dans le futur
            while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
            }
        } catch (error) {
            console.error('Erreur dans le planificateur:', error);
        }
    }

    fallbackScheduler() {
        this.scheduler();
        this.fallbackTimerId = setTimeout(() => {
            this.fallbackScheduler();
        }, this.lookahead);
    }

    start() {
        if (this.isPlaying) return;

        try {
        // S'assurer que l'AudioContext est initialisé et actif
        this.initializeAudioContext();
            
            // Toujours essayer de reprendre l'AudioContext
            if (this.audioContext) {
        if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        console.log('AudioContext repris avec succès');
                        // Jouer un son test silencieux pour s'assurer que l'audio fonctionne
                        this.testAudioPlayback();
                    }).catch(error => {
                        console.error('Erreur lors de la reprise de l\'AudioContext:', error);
                    });
                } else {
                    // Même si déjà actif, jouer un son test pour s'assurer que l'audio fonctionne
                    this.testAudioPlayback();
                }
        }

        this.isPlaying = true;
            this.beatCount = this.beatsPerMeasure - 1; // Commencer sur le dernier temps pour que le premier battement soit sur le temps 1
            this.nextNoteTime = this.audioContext ? this.audioContext.currentTime + 0.05 : 0.05;
            
            // Toujours utiliser le fallback scheduler basé sur setTimeout
            this.fallbackScheduler();
            
            // Ajouter un bouton d'invitation à l'interaction utilisateur si l'audio ne fonctionne pas
            this.addAudioUnlockButton();
        } catch (error) {
            console.error('Erreur lors du démarrage du métronome:', error);
        }
    }
    
    // Ajouter un bouton pour débloquer l'audio (utile sur iOS/Safari)
    addAudioUnlockButton() {
        // Vérifier si le bouton existe déjà
        if (document.getElementById('audioUnlockButton')) return;
        
        // Créer le bouton uniquement si l'AudioContext est suspendu
        if (this.audioContext && this.audioContext.state === 'suspended') {
            const metronomeContainer = document.querySelector('.metronome-container');
            if (!metronomeContainer) return;
            
            const unlockButton = document.createElement('button');
            unlockButton.id = 'audioUnlockButton';
            unlockButton.className = 'btn';
            unlockButton.style.marginTop = '1rem';
            unlockButton.style.backgroundColor = '#f44336';
            unlockButton.style.color = 'white';
            unlockButton.style.padding = '0.8rem 1.5rem';
            unlockButton.style.fontWeight = 'bold';
            unlockButton.textContent = 'Activer le son (cliquez)';
            
            unlockButton.addEventListener('click', () => {
                if (this.audioContext) {
                    this.audioContext.resume().then(() => {
                        console.log('AudioContext débloqué par clic utilisateur');
                        unlockButton.remove();
                        // Jouer un son test pour confirmer
                        this.testAudioPlayback();
                    }).catch(error => {
                        console.error('Erreur lors du déblocage de l\'AudioContext:', error);
                    });
                }
            });
            
            metronomeContainer.prepend(unlockButton);
        }
    }

    stop() {
        try {
        this.isPlaying = false;
        
            // Arrêter le setTimeout
            if (this.fallbackTimerId) {
                clearTimeout(this.fallbackTimerId);
                this.fallbackTimerId = null;
            }
            
            // Nettoyer les animations en cours
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            // Réinitialiser l'indicateur visuel
            if (this.beatIndicator) {
                this.beatIndicator.classList.remove('active', 'accented');
                this.beatIndicator.style.transform = '';
                this.beatIndicator.style.opacity = '';
            }
        } catch (error) {
            console.error('Erreur lors de l\'arrêt du métronome:', error);
        }
    }
    
    // Méthode pour nettoyer les ressources lors de la fermeture/navigation
    cleanup() {
        this.stop();
        
        // Fermer le contexte audio
        if (this.audioContext) {
            this.audioContext.close().catch(err => {
                console.warn('Erreur lors de la fermeture du contexte audio:', err);
            });
        }
    }
}

// Initialiser le métronome seulement quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si nous sommes sur la page du métronome
    if (!document.getElementById('metronomeTool')) return;

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
        return; // Ne pas continuer l'initialisation si Web Audio n'est pas supporté
    }

    // Initialiser le métronome
    window.metronome = new Metronome();
    
    // Nettoyer les ressources lors de la fermeture de la page
    window.addEventListener('beforeunload', () => {
        if (window.metronome) {
            window.metronome.cleanup();
        }
    });
    
    // Configuration des fonctionnalités d'interface avancées
    setupMetronomeUI();
    
    console.log('Métronome complètement initialisé');
});

/**
 * Gestion de l'interface utilisateur du métronome avec fonctionnalités avancées
 */
function setupMetronomeUI() {
    // Vérifier si nous sommes sur la page du métronome
    const metronomeContainer = document.querySelector('.metronome-container');
    if (!metronomeContainer) return;

    // Récupérer les éléments du DOM
    const helpButton = document.getElementById('metronomeHelp');
    const helpPanel = document.getElementById('metronomeHelpPanel');
    const closeHelpButton = document.getElementById('closeMetronomeHelp');
    const fullscreenButton = document.getElementById('fullscreenBtn');
    const accentSelect = document.getElementById('accentFirst');
    const accentPattern = document.getElementById('accentPattern');

    // Configuration du Tap Tempo
    setupTapTempo();
    // Configuration du panel d'aide
    setupHelpPanel();
    
    // Configuration des options d'accentuation
    setupAccentOptions();
    
    // Configuration de la vibration
    setupVibration();

    /**
     * Configurer la fonctionnalité Tap Tempo
     */
    function setupTapTempo() {
        try {
            // Créer l'élément de tap tempo s'il n'existe pas
            const metronomeControls = document.querySelector('.metronome-controls');
            if (!metronomeControls) return;
            
            // Vérifier si le bouton tap tempo existe déjà
            if (!document.getElementById('tapTempo')) {
                // Créer le bouton de tap tempo
                const tapTempoButton = document.createElement('button');
                tapTempoButton.id = 'tapTempo';
                tapTempoButton.className = 'btn-circle';
                tapTempoButton.setAttribute('aria-label', 'Tap Tempo');
                tapTempoButton.innerHTML = '<i class="fas fa-hand-pointer"></i>';
                
                // Insérer après le bouton d'arrêt
                const stopButton = document.getElementById('stopMetronome');
                if (stopButton && stopButton.parentNode) {
                    stopButton.parentNode.insertBefore(tapTempoButton, stopButton.nextSibling);
                } else {
                    metronomeControls.appendChild(tapTempoButton);
                }
            }
            
            // Configurer la logique du tap tempo
            const tapTempoButton = document.getElementById('tapTempo');
            if (!tapTempoButton) return;
            
            let tapTimes = [];
            let lastTapTime = 0;
            
            tapTempoButton.addEventListener('click', (e) => {
                e.preventDefault();
                const currentTime = performance.now();
                
                // Réinitialiser si plus de 2 secondes entre les taps
                if (currentTime - lastTapTime > 2000) {
                    tapTimes = [];
                }
                
                tapTimes.push(currentTime);
                lastTapTime = currentTime;
                
                // Limiter à 4 taps pour la moyenne
                if (tapTimes.length > 4) {
                    tapTimes.shift();
                }
                
                // Calculer la moyenne des intervalles
                if (tapTimes.length > 1) {
                    let totalIntervals = 0;
                    for (let i = 1; i < tapTimes.length; i++) {
                        totalIntervals += tapTimes[i] - tapTimes[i-1];
                    }
                    
                    const averageInterval = totalIntervals / (tapTimes.length - 1);
                    const tapTempo = Math.round(60000 / averageInterval);
                    
                    // Limiter le tempo entre 40 et 240 BPM
                    const clampedTempo = Math.min(Math.max(tapTempo, 40), 240);
                    
                    // Mettre à jour le tempo du métronome
                    if (window.metronome) {
                        window.metronome.tempo = clampedTempo;
                        window.metronome.updateTempoDisplay();
                    }
                    
                    // Effet visuel de confirmation
                    tapTempoButton.classList.add('tap-active');
                    setTimeout(() => {
                        tapTempoButton.classList.remove('tap-active');
                    }, 100);
                }
            });
            
            console.log('Tap Tempo configuré avec succès');
        } catch (error) {
            console.error('Erreur lors de la configuration du Tap Tempo:', error);
        }
    }
    /**
     * Configurer le panneau d'aide
     */
    function setupHelpPanel() {
        try {
            if (!helpButton || !helpPanel || !closeHelpButton) return;
            
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
            
            // Fermer avec la touche Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && helpPanel.classList.contains('show')) {
                    helpPanel.classList.remove('show');
                }
            });
            
            console.log('Panneau d\'aide configuré avec succès');
        } catch (error) {
            console.error('Erreur lors de la configuration du panneau d\'aide:', error);
        }
    }
    
    /**
     * Configurer les options d'accentuation
     */
    function setupAccentOptions() {
        try {
            if (!accentSelect || !accentPattern) return;
            
            accentSelect.addEventListener('change', () => {
                if (accentSelect.value === 'custom') {
                    accentPattern.style.display = 'flex';
                } else {
                    accentPattern.style.display = 'none';
                }
                
                // Mettre à jour les accents dans le métronome
                if (window.metronome) {
                    window.metronome.accentFirst = accentSelect.value === 'true';
                    if (accentSelect.value === 'custom') {
                        window.metronome.updateCustomAccentPattern();
                    }
                }
            });
            
            // Initialiser l'état
            accentPattern.style.display = accentSelect.value === 'custom' ? 'flex' : 'none';
            
            console.log('Options d\'accentuation configurées avec succès');
        } catch (error) {
            console.error('Erreur lors de la configuration des options d\'accentuation:', error);
        }
    }
    
    /**
     * Configurer les options de vibration
     */
    function setupVibration() {
        try {
            if (!vibrationCheckbox) return;
            
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
                                const isAccented = this.isAccented(this.beatCount);
                                navigator.vibrate(isAccented ? 100 : 50);
                            }, delay);
                        }
                    }
                };
            }
            
            console.log('Options de vibration configurées avec succès');
        } catch (error) {
            console.error('Erreur lors de la configuration des options de vibration:', error);
        }
    }
}

/**
 * Gestionnaire du métronome pour l'export du module
 */
export const MetronomeManager = {
    /**
     * Initialise le métronome
     */
    init() {
        console.log('Initialisation du gestionnaire du métronome');
        
        // Vérifier la compatibilité de l'API Web Audio
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.error('L\'API Web Audio n\'est pas supportée par ce navigateur');
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
            return;
        }
        
        // Créer une instance du métronome
        window.metronome = new Metronome();
        
        // Nettoyer les ressources lors de la fermeture de la page
        window.addEventListener('beforeunload', () => {
            if (window.metronome) {
                window.metronome.cleanup();
            }
        });
        
        // Configuration des fonctionnalités d'interface avancées
        setupMetronomeUI();
        
        console.log('Métronome complètement initialisé via MetronomeManager');
    }
}; 