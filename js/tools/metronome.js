class Metronome {
    constructor() {
        this.audioContext = null;
        this.nextNoteTime = 0.0;
        this.tempo = 120;
        this.isPlaying = false;
        this.timerWorker = null;
        this.beatCount = 0;
        this.useWorkerFallback = false;
        this.fallbackTimerId = null;

        this.setupEventListeners();
        this.createWorker();
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

    setupEventListeners() {
        const tempoSlider = document.getElementById('tempoSlider');
        const startButton = document.getElementById('startMetronome');
        const tapTempoButton = document.getElementById('tapTempo');
        const tempoDisplay = document.getElementById('tempoDisplay');

        tempoSlider.addEventListener('input', () => {
            this.tempo = parseInt(tempoSlider.value);
            tempoDisplay.textContent = `${this.tempo} BPM`;
        });

        startButton.addEventListener('click', () => {
            this.initializeAudioContext();
            if (!this.isPlaying) {
                this.start();
                startButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
                startButton.classList.add('active');
            } else {
                this.stop();
                startButton.innerHTML = '<i class="fas fa-play"></i> Démarrer';
                startButton.classList.remove('active');
            }
        });

        let lastTap = 0;
        let tapCount = 0;
        let tapTimes = [];

        tapTempoButton.addEventListener('click', () => {
            const currentTime = Date.now();
            
            if (currentTime - lastTap > 2000) {
                tapCount = 0;
                tapTimes = [];
            }

            lastTap = currentTime;
            tapTimes.push(currentTime);
            tapCount++;

            if (tapCount >= 4) {
                let intervals = [];
                for (let i = 1; i < tapTimes.length; i++) {
                    intervals.push(tapTimes[i] - tapTimes[i-1]);
                }
                
                const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                const newTempo = Math.round(60000 / averageInterval);
                
                if (newTempo >= 30 && newTempo <= 240) {
                    this.tempo = newTempo;
                    tempoSlider.value = this.tempo;
                    tempoDisplay.textContent = `${this.tempo} BPM`;
                }

                tapTimes.shift();
            }
        });
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

// Initialisation du métronome
document.addEventListener('DOMContentLoaded', () => {
    window.metronome = new Metronome();
}); 