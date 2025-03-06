class Metronome {
    constructor() {
        this.audioContext = null;
        this.nextNoteTime = 0.0;
        this.tempo = 120;
        this.isPlaying = false;
        this.timerWorker = null;
        this.beatCount = 0;

        this.initializeAudioContext();
        this.setupEventListeners();
        this.createWorker();
    }

    initializeAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
        const blob = new Blob([`
            let timerID = null;
            let interval = 25;

            self.onmessage = function(e) {
                if (e.data === "start") {
                    timerID = setInterval(function() { postMessage("tick"); }, interval);
                } else if (e.data === "stop") {
                    clearInterval(timerID);
                    timerID = null;
                }
            };
        `], { type: 'text/javascript' });

        this.timerWorker = new Worker(URL.createObjectURL(blob));
        this.timerWorker.onmessage = (e) => {
            if (e.data === "tick") {
                this.scheduler();
            }
        };
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

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.beatCount = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;
        this.timerWorker.postMessage("start");
    }

    stop() {
        this.isPlaying = false;
        this.timerWorker.postMessage("stop");
    }
}

// Initialisation du métronome
document.addEventListener('DOMContentLoaded', () => {
    window.metronome = new Metronome();
}); 