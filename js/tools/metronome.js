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
        this.beatCount = 0;
        this.soundType = 'click';
        this.volume = 0.8;
        this.accentFirst = true;
        this.soundBuffers = {};
        
        // Initialisation différée
        if (document.getElementById('metronomeTool')) {
            console.log('Métronome initialisé');
            this.setupInterface();
            this.setupEventListeners();
            this.createWorker();
            this.preloadSounds();
        } else {
            console.log('Éléments du métronome non présents dans la page actuelle');
        }
    }
    
    setupInterface() {
        // Récupérer tous les éléments d'interface
        this.tempoDisplay = document.getElementById('currentTempo');
        this.tempoSlider = document.getElementById('tempoSlider');
        this.startButton = document.getElementById('startMetronome');
        this.stopButton = document.getElementById('stopMetronome');
        this.timeSignature = document.getElementById('timeSignature');
        this.soundTypeSelect = document.getElementById('soundType');
        this.volumeControl = document.getElementById('volume');
        this.accentFirstSelect = document.getElementById('accentFirst');
        this.visualFlash = document.getElementById('visualFlash');
        this.tempoUpButton = document.getElementById('tempoUp');
        this.tempoDownButton = document.getElementById('tempoDown');
        this.beatIndicator = document.getElementById('beatIndicator');
        this.presetButtons = document.querySelectorAll('.preset-btn');
        
        // Initialiser les valeurs
        this.tempoSlider.value = this.tempo;
        this.tempoDisplay.textContent = this.tempo;
    }
    
    setupEventListeners() {
        // Configurer les écouteurs d'événements
        this.tempoSlider.addEventListener('input', () => {
            this.tempo = parseInt(this.tempoSlider.value);
            this.tempoDisplay.textContent = this.tempo;
        });
        
        this.startButton.addEventListener('click', () => {
            this.initializeAudioContext();
            if (!this.isPlaying) {
                this.start();
                this.startButton.disabled = true;
                this.stopButton.disabled = false;
            }
        });
        
        this.stopButton.addEventListener('click', () => {
            this.stop();
            this.startButton.disabled = false;
            this.stopButton.disabled = true;
        });
        
        this.timeSignature.addEventListener('change', () => {
            this.beatsPerMeasure = parseInt(this.timeSignature.value);
            this.updateAccentPattern();
        });
        
        this.soundTypeSelect.addEventListener('change', () => {
            this.soundType = this.soundTypeSelect.value;
        });
        
        this.volumeControl.addEventListener('input', () => {
            this.volume = parseInt(this.volumeControl.value) / 100;
        });
        
        this.tempoUpButton.addEventListener('click', () => {
            this.tempo = Math.min(240, this.tempo + 1);
            this.updateTempoDisplay();
        });
        
        this.tempoDownButton.addEventListener('click', () => {
            this.tempo = Math.max(40, this.tempo - 1);
            this.updateTempoDisplay();
        });
        
        // Ajouter les écouteurs pour les boutons préréglés
        this.presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.tempo = parseInt(button.dataset.tempo);
                this.updateTempoDisplay();
            });
        });
    }

    updateTempoDisplay() {
        this.tempoSlider.value = this.tempo;
        this.tempoDisplay.textContent = this.tempo;
    }

    updateAccentPattern() {
        const accentPattern = document.getElementById('accentPattern');
        if (!accentPattern) return;
        
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

    preloadSounds() {
        this.initializeAudioContext();
        
        const soundTypes = ['click', 'wood', 'digital', 'bell'];
        const variants = ['normal', 'accent'];
        
        // Chargement des sons depuis les fichiers audio
        soundTypes.forEach(type => {
            variants.forEach(variant => {
                const url = `assets/sounds/${type}_${variant}.mp3`;
                this.loadSound(type, variant, url);
            });
        });
        
        // Fallback avec des oscillateurs si le chargement échoue
        this.generateFallbackSounds();
    }
    
    loadSound(type, variant, url) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Impossible de charger le son: ${url}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.soundBuffers[`${type}_${variant}`] = audioBuffer;
                console.log(`Son chargé: ${type}_${variant}`);
            })
            .catch(error => {
                console.warn(`Erreur lors du chargement du son ${url}:`, error.message);
                // Les sons générés seront utilisés comme fallback
            });
    }
    
    generateFallbackSounds() {
        // Créer des buffers pour les sons de fallback
        if (!this.audioContext) return;
        
        const soundTypes = {
            click: { normal: 800, accent: 1000 },
            wood: { normal: 600, accent: 800 },
            digital: { normal: 800, accent: 1200 },
            bell: { normal: 1000, accent: 1500 }
        };
        
        for (const [type, frequencies] of Object.entries(soundTypes)) {
            for (const [variant, frequency] of Object.entries(frequencies)) {
                const buffer = this.generateToneBuffer(frequency, variant === 'accent' ? 0.03 : 0.02);
                this.soundBuffers[`${type}_${variant}_generated`] = buffer;
            }
        }
    }
    
    generateToneBuffer(frequency, duration) {
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Sinusoïde avec une enveloppe d'amplitude qui décroît
            const envelope = 1 - t / duration;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
        }
        
        return buffer;
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
        // Déterminer si c'est un temps accentué
        const isAccented = this.beatCount % this.beatsPerMeasure === 0;
        const variant = isAccented ? 'accent' : 'normal';
        
        // Sélectionner le buffer audio
        let soundKey = `${this.soundType}_${variant}`;
        let soundBuffer = this.soundBuffers[soundKey];
        
        // Si le buffer n'est pas disponible, utiliser le son généré
        if (!soundBuffer) {
            soundKey = `${this.soundType}_${variant}_generated`;
            soundBuffer = this.soundBuffers[soundKey];
        }
        
        // Si on a un buffer audio, l'utiliser
        if (soundBuffer) {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = soundBuffer;
            gainNode.gain.value = this.volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start(time);
        } else {
            // Fallback à l'oscillateur
            this.playOscillatorSound(time, isAccented);
        }

        // Animation visuelle
        if (this.visualFlash && this.visualFlash.checked && this.beatIndicator) {
            // Utiliser requestAnimationFrame pour synchroniser avec l'affichage
            const currentTime = this.audioContext.currentTime;
            const delay = (time - currentTime) * 1000;
            
            setTimeout(() => {
                this.beatIndicator.classList.add('active');
                setTimeout(() => {
                    this.beatIndicator.classList.remove('active');
                }, 50);
            }, delay > 0 ? delay : 0);
        }
    }
    
    playOscillatorSound(time, isAccented) {
        // Création du son avec oscillateur (fallback)
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();
        
        // Appliquer différentes fréquences selon le type de son et l'accentuation
        switch(this.soundType) {
            case 'wood':
                osc.frequency.value = isAccented ? 800 : 600;
                break;
            case 'digital':
                osc.frequency.value = isAccented ? 1200 : 800;
                break;
            case 'bell':
                osc.frequency.value = isAccented ? 1500 : 1000;
                break;
            default: // 'click'
                osc.frequency.value = isAccented ? 1000 : 800;
        }
        
        // Configuration de l'envelope
        envelope.gain.value = this.volume;
        envelope.gain.exponentialRampToValueAtTime(this.volume, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.03);
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
        }
    }

    start() {
        if (this.isPlaying) return;

        // S'assurer que l'AudioContext est initialisé et actif
        this.initializeAudioContext();
        if (this.audioContext.state === 'suspended') {
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
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('metronomeTool')) {
        window.metronome = new Metronome();
    }
}); 