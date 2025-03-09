import { Utils } from '../utils.js';

/**
 * Gestionnaire du minuteur et du chronomètre
 */
export const TimerManager = {
    state: {
        timer: {
            hours: 0,
            minutes: 0,
            seconds: 0,
            isRunning: false,
            intervalId: null,
            endTime: null,
            sound: true,
            currentSound: 'bell'
        },
        stopwatch: {
            time: 0,
            isRunning: false,
            intervalId: null,
            laps: []
        }
    },

    /**
     * Initialise le minuteur
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.updateDisplay();
        this.loadSoundPreference();
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Minuteur
        document.getElementById('timerStartBtn')?.addEventListener('click', () => {
            this.startTimer();
        });

        document.getElementById('timerPauseBtn')?.addEventListener('click', () => {
            this.pauseTimer();
        });

        document.getElementById('resetTimer')?.addEventListener('click', () => {
            this.resetTimer();
        });

        document.getElementById('soundToggle')?.addEventListener('click', () => {
            this.toggleSound();
        });

        document.getElementById('timerSound')?.addEventListener('change', (e) => {
            this.changeTimerSound(e.target.value);
        });

        // Chronomètre
        document.getElementById('startStopwatch')?.addEventListener('click', () => {
            this.toggleStopwatch();
        });

        document.getElementById('lapStopwatch')?.addEventListener('click', () => {
            this.recordLap();
        });

        document.getElementById('resetStopwatch')?.addEventListener('click', () => {
            this.resetStopwatch();
        });

        // Entrées du minuteur
        ['hours', 'minutes', 'seconds'].forEach(field => {
            document.getElementById(`${field}Input`)
                ?.addEventListener('input', (e) => {
                    this.updateTimerValue(field, e.target.value);
                });
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isTimerVisible()) return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state.timer.isRunning) {
                    this.pauseTimer();
                } else {
                    this.startTimer();
                }
            } else if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                this.resetTimer();
            }
        });
    },

    /**
     * Vérifie si le minuteur est visible
     */
    isTimerVisible() {
        const timer = document.getElementById('timerTool');
        return timer?.style.display !== 'none';
    },

    /**
     * Démarre le minuteur
     */
    startTimer() {
        if (this.state.timer.isRunning) return;

        const totalSeconds = this.calculateTotalSeconds();
        if (totalSeconds <= 0) {
            Utils.showNotification('Veuillez définir une durée', 'warning');
            return;
        }

        this.state.timer.endTime = Date.now() + totalSeconds * 1000;
        this.state.timer.isRunning = true;
        this.state.timer.intervalId = setInterval(() => this.updateTimer(), 1000);

        this.updateTimerControls();
        this.updateProgressBar(totalSeconds);
    },

    /**
     * Met à jour la barre de progression
     */
    updateProgressBar(totalSeconds) {
        const progressBar = document.getElementById('timerProgressBar');
        if (!progressBar) return;

        const startTime = Date.now();
        const endTime = this.state.timer.endTime;
        const duration = endTime - startTime;

        const updateProgress = () => {
            if (!this.state.timer.isRunning) return;
            
            const now = Date.now();
            const timeLeft = endTime - now;
            const progress = ((duration - timeLeft) / duration) * 100;
            
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);

            if (timeLeft > 0) {
                requestAnimationFrame(updateProgress);
            }
        };

        requestAnimationFrame(updateProgress);
    },

    /**
     * Met en pause le minuteur
     */
    pauseTimer() {
        if (!this.state.timer.isRunning) return;

        clearInterval(this.state.timer.intervalId);
        this.state.timer.isRunning = false;
        this.state.timer.intervalId = null;

        // Sauvegarder le temps restant
        const remaining = Math.max(0, Math.floor((this.state.timer.endTime - Date.now()) / 1000));
        this.state.timer.hours = Math.floor(remaining / 3600);
        this.state.timer.minutes = Math.floor((remaining % 3600) / 60);
        this.state.timer.seconds = remaining % 60;

        this.updateTimerControls();
        this.updateDisplay();
    },

    /**
     * Réinitialise le minuteur
     */
    resetTimer() {
        clearInterval(this.state.timer.intervalId);
        this.state.timer.isRunning = false;
        this.state.timer.intervalId = null;
        this.state.timer.endTime = null;

        // Réinitialiser à 0
        this.state.timer.hours = 0;
        this.state.timer.minutes = 0;
        this.state.timer.seconds = 0;

        // Réinitialiser les champs d'entrée
        ['hours', 'minutes', 'seconds'].forEach(field => {
            const input = document.getElementById(`${field}Input`);
            if (input) {
                input.value = '0';
            }
        });

        // Réinitialiser la barre de progression
        const progressBar = document.getElementById('timerProgressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
        }

        this.updateDisplay();
        this.updateTimerControls();
        
        // Sauvegarder l'état pour persister les valeurs à 0
        this.saveState();
    },

    /**
     * Met à jour le minuteur
     */
    updateTimer() {
        const remaining = Math.max(0, Math.floor((this.state.timer.endTime - Date.now()) / 1000));

        if (remaining === 0) {
            this.timerComplete();
            return;
        }

        this.state.timer.hours = Math.floor(remaining / 3600);
        this.state.timer.minutes = Math.floor((remaining % 3600) / 60);
        this.state.timer.seconds = remaining % 60;

        this.updateDisplay();
    },

    /**
     * Gère la fin du minuteur
     */
    timerComplete() {
        clearInterval(this.state.timer.intervalId);
        this.state.timer.isRunning = false;
        this.state.timer.intervalId = null;
        this.state.timer.endTime = null;

        // Réinitialiser à 0 au lieu de garder le temps initial
        this.state.timer.hours = 0;
        this.state.timer.minutes = 0;
        this.state.timer.seconds = 0;

        // Réinitialiser les champs d'entrée
        ['hours', 'minutes', 'seconds'].forEach(field => {
            const input = document.getElementById(`${field}Input`);
            if (input) {
                input.value = '0';
            }
        });

        // Réinitialiser la barre de progression
        const progressBar = document.getElementById('timerProgressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
        }

        this.updateDisplay();
        this.updateTimerControls();
        
        // Sauvegarder l'état pour persister les valeurs à 0
        this.saveState();

        if (this.state.timer.sound) {
            this.playAlarm();
            
            // Ajouter l'animation d'alarme
            const timerContainer = document.querySelector('.timer-container');
            if (timerContainer) {
                timerContainer.classList.add('timer-alarm-active');
                setTimeout(() => {
                    timerContainer.classList.remove('timer-alarm-active');
                }, 3000); // Arrêter l'animation après 3 secondes
            }
        }

        Utils.showNotification('Minuteur terminé !', 'success');
    },

    /**
     * Joue l'alarme
     */
    playAlarm() {
        if (!this.state.timer.sound) return;
        
        const soundId = `timerSound-${this.state.timer.currentSound}`;
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {
                console.warn('Impossible de jouer l\'alarme');
            });
        }
    },

    /**
     * Active/désactive le son
     */
    toggleSound() {
        this.state.timer.sound = !this.state.timer.sound;
        const soundBtn = document.getElementById('soundToggle');
        if (soundBtn) {
            const icon = soundBtn.querySelector('i');
            if (icon) {
                icon.className = this.state.timer.sound ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
            soundBtn.innerHTML = this.state.timer.sound ? '<i class="fas fa-volume-up"></i> Son activé' : '<i class="fas fa-volume-mute"></i> Son désactivé';
        }
    },

    /**
     * Démarre/arrête le chronomètre
     */
    toggleStopwatch() {
        if (this.state.stopwatch.isRunning) {
            clearInterval(this.state.stopwatch.intervalId);
            this.state.stopwatch.isRunning = false;
            this.state.stopwatch.intervalId = null;
        } else {
            const startTime = Date.now() - this.state.stopwatch.time;
            this.state.stopwatch.isRunning = true;
            this.state.stopwatch.intervalId = setInterval(() => {
                this.state.stopwatch.time = Date.now() - startTime;
                this.updateStopwatchDisplay();
            }, 10);
        }

        this.updateStopwatchControls();
    },

    /**
     * Enregistre un tour
     */
    recordLap() {
        if (!this.state.stopwatch.isRunning) return;

        const lastLapTime = this.state.stopwatch.laps[0]?.time || 0;
        const lapTime = this.state.stopwatch.time - lastLapTime;

        this.state.stopwatch.laps.unshift({
            number: this.state.stopwatch.laps.length + 1,
            time: this.state.stopwatch.time,
            lap: lapTime
        });

        this.updateLapsDisplay();
        this.saveState();
    },

    /**
     * Réinitialise le chronomètre
     */
    resetStopwatch() {
        clearInterval(this.state.stopwatch.intervalId);
        this.state.stopwatch.isRunning = false;
        this.state.stopwatch.intervalId = null;
        this.state.stopwatch.time = 0;
        this.state.stopwatch.laps = [];

        this.updateStopwatchDisplay();
        this.updateLapsDisplay();
        this.updateStopwatchControls();
        this.saveState();
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay() {
        this.updateTimerDisplay();
        this.updateStopwatchDisplay();
        this.updateLapsDisplay();
    },

    /**
     * Met à jour l'affichage du minuteur
     */
    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (display) {
            const { hours, minutes, seconds } = this.state.timer;
            display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Mettre à jour les champs d'entrée
        ['hours', 'minutes', 'seconds'].forEach(field => {
            const input = document.getElementById(`${field}Input`);
            if (input) {
                input.value = this.state.timer[field];
            }
        });
    },

    /**
     * Met à jour l'affichage du chronomètre
     */
    updateStopwatchDisplay() {
        const display = document.getElementById('stopwatchDisplay');
        if (display) {
            display.textContent = this.formatTime(this.state.stopwatch.time);
        }
    },

    /**
     * Met à jour l'affichage des tours
     */
    updateLapsDisplay() {
        const lapsContainer = document.getElementById('lapsContainer');
        if (!lapsContainer) return;

        lapsContainer.innerHTML = this.state.stopwatch.laps
            .map(lap => `
                <div class="lap-item">
                    <span class="lap-number">#${lap.number}</span>
                    <span class="lap-time">${this.formatTime(lap.lap)}</span>
                    <span class="total-time">${this.formatTime(lap.time)}</span>
                </div>
            `)
            .join('');
    },

    /**
     * Met à jour les contrôles du minuteur
     */
    updateTimerControls() {
        const startButton = document.getElementById('timerStartBtn');
        const pauseButton = document.getElementById('timerPauseBtn');
        
        if (startButton && pauseButton) {
            startButton.style.display = this.state.timer.isRunning ? 'none' : 'inline-block';
            pauseButton.style.display = this.state.timer.isRunning ? 'inline-block' : 'none';
        }
    },

    /**
     * Met à jour les contrôles du chronomètre
     */
    updateStopwatchControls() {
        const startButton = document.getElementById('startStopwatch');
        const lapButton = document.getElementById('lapStopwatch');
        
        if (startButton) {
            startButton.textContent = this.state.stopwatch.isRunning ? 'Pause' : 'Démarrer';
        }
        
        if (lapButton) {
            lapButton.disabled = !this.state.stopwatch.isRunning;
        }
    },

    /**
     * Calcule le total des secondes
     */
    calculateTotalSeconds() {
        return this.state.timer.hours * 3600 +
               this.state.timer.minutes * 60 +
               this.state.timer.seconds;
    },

    /**
     * Formate le temps en millisecondes
     */
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    },

    /**
     * Met à jour une valeur du minuteur
     */
    updateTimerValue(field, value) {
        const num = parseInt(value, 10);
        if (isNaN(num)) return;

        let max = field === 'hours' ? 99 : 59;
        this.state.timer[field] = Math.min(Math.max(0, num), max);
        this.updateTimerDisplay();
        
        // Sauvegarder l'état pour persister les valeurs modifiées
        this.saveState();
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        localStorage.setItem('timerState', JSON.stringify(this.state));
    },

    /**
     * Charge l'état
     */
    loadState() {
        const savedState = localStorage.getItem('timerState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                this.state = parsedState;
                this.updateDisplay();
                this.updateTimerControls();
            } catch (e) {
                console.error('Erreur lors du chargement de l\'état du minuteur:', e);
            }
        }
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        clearInterval(this.state.timer.intervalId);
        clearInterval(this.state.stopwatch.intervalId);
        this.saveState();
    },

    /**
     * Charge la préférence de son depuis le localStorage
     */
    loadSoundPreference() {
        const savedSound = localStorage.getItem('timerSound');
        if (savedSound) {
            this.state.timer.currentSound = savedSound;
            const soundSelect = document.getElementById('timerSound');
            if (soundSelect) {
                soundSelect.value = savedSound;
            }
        }
    },

    /**
     * Change le son du timer
     * @param {string} soundType - Le type de son à utiliser
     */
    changeTimerSound(soundType) {
        this.state.timer.currentSound = soundType;
        localStorage.setItem('timerSound', soundType);
        this.testTimerSound();
    },

    /**
     * Teste le son actuellement sélectionné
     */
    testTimerSound() {
        const soundId = `timerSound-${this.state.timer.currentSound}`;
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {
                console.warn('Impossible de jouer le son de test');
            });
        }
    }
};

// Exposer les fonctions globalement pour le HTML
window.startTimer = () => TimerManager.startTimer();
window.pauseTimer = () => TimerManager.pauseTimer();
window.resetTimer = () => TimerManager.resetTimer();
window.toggleSound = () => TimerManager.toggleSound();
window.startStopwatch = () => TimerManager.toggleStopwatch();
window.pauseStopwatch = () => TimerManager.toggleStopwatch();
window.resetStopwatch = () => TimerManager.resetStopwatch();
window.lapStopwatch = () => TimerManager.recordLap();
window.changeTimerSound = () => {
    const select = document.getElementById('timerSound');
    if (select) {
        TimerManager.changeTimerSound(select.value);
    }
};
window.testTimerSound = () => TimerManager.testTimerSound();

// Initialiser le minuteur au chargement
document.addEventListener('DOMContentLoaded', () => {
    TimerManager.init();
}); 