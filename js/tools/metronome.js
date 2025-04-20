/**
 * Métronome avec battements réglables
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
        
        // Initialisation différée, vérifions d'abord si les éléments existent
        const tempoSlider = document.getElementById('tempoSlider');
        
        if (!tempoSlider) {
            console.log('Éléments du métronome non présents dans la page actuelle');
            return;
        }
        
        this.setupInterface();
        this.setupEventListeners();
        this.createWorker();
    }
    
    setupInterface() {
        // Récupérer tous les éléments d'interface
        this.tempoDisplay = document.getElementById('tempoDisplay');
        this.tempoSlider = document.getElementById('tempoSlider');
        this.startButton = document.getElementById('startMetronome');
        this.beatsSelect = document.getElementById('beatsPerMeasure');
        
        // Si un élément manque, annuler l'initialisation
        if (!this.tempoDisplay || !this.tempoSlider || !this.startButton || !this.beatsSelect) {
            console.log('Éléments d\'interface du métronome manquants');
            return;
        }
        
        // Initialiser les valeurs
        this.tempoSlider.value = this.tempo;
        this.tempoDisplay.textContent = `${this.tempo} BPM`;
    }
    
    setupEventListeners() {
        // Vérifier si les éléments existent avant d'ajouter des écouteurs
        if (!this.tempoSlider || !this.startButton || !this.beatsSelect) {
            return;
        }
        
        // Configurer les écouteurs d'événements
        this.tempoSlider.addEventListener('input', () => {
            this.tempo = parseInt(this.tempoSlider.value);
            this.tempoDisplay.textContent = `${this.tempo} BPM`;
        });
        
        this.startButton.addEventListener('click', () => {
            this.initializeAudioContext();
            if (!this.isPlaying) {
                this.start();
                this.startButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
                this.startButton.classList.add('active');
            } else {
                this.stop();
                this.startButton.innerHTML = '<i class="fas fa-play"></i> Démarrer';
                this.startButton.classList.remove('active');
            }
        });
        
        this.beatsSelect.addEventListener('change', () => {
            this.beatsPerMeasure = parseInt(this.beatsSelect.value);
        });
    }

    initializeAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('AudioContext initialisé avec succès');
            } catch (e) {
                console.error('Erreur lors de l\'initialisation de l\'AudioContext:', e);
            }
        }
        return this.audioContext;
    }

    createWorker() {
        try {
            // Utiliser un fichier worker externe au lieu d'un Blob URL
            this.timerWorker = new Worker('js/tools/metronome-worker.js');
            this.timerWorker.onmessage = (e) => {
                if (e.data === "tick") {
                    this.scheduler();
                }
            };
            console.log('Worker du métronome créé avec succès');
        } catch (e) {
            console.error('Erreur lors de la création du worker du métronome:', e);
            // Fallback en cas d'erreur: utiliser setTimeout au lieu d'un worker
            this.useWorkerFallback = true;
        }
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat;
        this.beatCount++;
    }

    scheduleNote(time) {
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        osc.frequency.value = this.beatCount % 4 === 0 ? 1000 : 800;
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.03);

        const beatIndicator = document.getElementById('beatIndicator');
        beatIndicator.classList.add('active');
        setTimeout(() => beatIndicator.classList.remove('active'), 50);
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
        }
    }

    start() {
        if (this.isPlaying) return;

        // S'assurer que l'AudioContext est initialisé
        this.initializeAudioContext();

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.beatCount = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;
        
        if (this.useWorkerFallback) {
            // Utiliser setTimeout comme fallback si le worker n'est pas disponible
            this.fallbackTimerId = setInterval(() => this.scheduler(), 25);
        } else if (this.timerWorker) {
            // Utiliser le worker si disponible
            this.timerWorker.postMessage("start");
        }
    }

    stop() {
        this.isPlaying = false;
        
        if (this.useWorkerFallback) {
            // Arrêter le setTimeout si on utilise le fallback
            if (this.fallbackTimerId) {
                clearInterval(this.fallbackTimerId);
                this.fallbackTimerId = null;
            }
        } else if (this.timerWorker) {
            // Arrêter le worker si disponible
            this.timerWorker.postMessage("stop");
        }
    }
}

// Initialiser le métronome seulement quand le DOM est chargé
// et seulement si nous sommes sur la page du métronome
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('metronomeContainer') || document.getElementById('tempoSlider')) {
        new Metronome();
    }
}); 