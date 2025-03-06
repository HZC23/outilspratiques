/**
 * Gestionnaire du chronomètre
 */
export const StopwatchManager = {
    /**
     * État du chronomètre
     */
    state: {
        startTime: 0,
        elapsedTime: 0,
        running: false,
        laps: [],
        animationFrameId: null
    },

    /**
     * Initialise le chronomètre
     */
    init() {
        // Récupérer les éléments du DOM
        this.display = document.getElementById('stopwatchDisplay');
        this.startBtn = document.getElementById('startStopwatch');
        this.resetBtn = document.getElementById('resetStopwatch');
        this.lapBtn = document.getElementById('lapStopwatch');
        this.lapsList = document.getElementById('lapsList');

        // Vérifier si les éléments existent
        if (!this.display || !this.startBtn || !this.resetBtn || !this.lapBtn || !this.lapsList) {
            console.error('Éléments du chronomètre non trouvés dans le DOM');
            return;
        }

        // Configurer les gestionnaires d'événements
        this.startBtn.addEventListener('click', () => this.toggleStopwatch());
        this.resetBtn.addEventListener('click', () => this.resetStopwatch());
        this.lapBtn.addEventListener('click', () => this.recordLap());

        // Initialiser l'affichage
        this.updateDisplay();
        
        console.log('Chronomètre initialisé');
    },

    /**
     * Démarre ou met en pause le chronomètre
     */
    toggleStopwatch() {
        if (this.state.running) {
            this.pauseStopwatch();
        } else {
            this.startStopwatch();
        }
    },

    /**
     * Démarre le chronomètre
     */
    startStopwatch() {
        if (!this.state.running) {
            this.state.running = true;
            this.state.startTime = Date.now() - this.state.elapsedTime;
            this.startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            this.lapBtn.disabled = false;
            this.updateStopwatch();
        }
    },

    /**
     * Met en pause le chronomètre
     */
    pauseStopwatch() {
        if (this.state.running) {
            this.state.running = false;
            this.state.elapsedTime = Date.now() - this.state.startTime;
            this.startBtn.innerHTML = '<i class="fas fa-play"></i> Reprendre';
            if (this.state.animationFrameId) {
                cancelAnimationFrame(this.state.animationFrameId);
                this.state.animationFrameId = null;
            }
        }
    },

    /**
     * Réinitialise le chronomètre
     */
    resetStopwatch() {
        this.pauseStopwatch();
        this.state.elapsedTime = 0;
        this.state.laps = [];
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> Démarrer';
        this.lapBtn.disabled = true;
        this.updateDisplay();
        this.updateLapsList();
    },

    /**
     * Enregistre un tour
     */
    recordLap() {
        if (this.state.running) {
            const lapTime = Date.now() - this.state.startTime;
            const previousLapTime = this.state.laps.length > 0 ? this.state.laps[this.state.laps.length - 1].totalTime : 0;
            const lapDiff = lapTime - previousLapTime;
            
            this.state.laps.push({
                number: this.state.laps.length + 1,
                lapTime: lapDiff,
                totalTime: lapTime
            });
            
            this.updateLapsList();
        }
    },

    /**
     * Met à jour l'affichage du chronomètre
     */
    updateStopwatch() {
        if (this.state.running) {
            this.state.elapsedTime = Date.now() - this.state.startTime;
            this.updateDisplay();
            this.state.animationFrameId = requestAnimationFrame(() => this.updateStopwatch());
        }
    },

    /**
     * Met à jour l'affichage du temps
     */
    updateDisplay() {
        const time = this.formatTime(this.state.elapsedTime);
        if (this.display) {
            this.display.textContent = time;
        }
    },

    /**
     * Met à jour la liste des tours
     */
    updateLapsList() {
        if (this.lapsList) {
            this.lapsList.innerHTML = '';
            
            if (this.state.laps.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-laps';
                emptyMessage.textContent = 'Aucun tour enregistré';
                this.lapsList.appendChild(emptyMessage);
                return;
            }
            
            // Créer les éléments de tour en ordre inverse (le plus récent en haut)
            for (let i = this.state.laps.length - 1; i >= 0; i--) {
                const lap = this.state.laps[i];
                const lapItem = document.createElement('div');
                lapItem.className = 'lap-item';
                
                const lapNumber = document.createElement('span');
                lapNumber.className = 'lap-number';
                lapNumber.textContent = `Tour ${lap.number}`;
                
                const lapTimeEl = document.createElement('span');
                lapTimeEl.className = 'lap-time';
                lapTimeEl.textContent = this.formatTime(lap.lapTime);
                
                const totalTimeEl = document.createElement('span');
                totalTimeEl.className = 'total-time';
                totalTimeEl.textContent = this.formatTime(lap.totalTime);
                
                lapItem.appendChild(lapNumber);
                lapItem.appendChild(lapTimeEl);
                lapItem.appendChild(totalTimeEl);
                
                this.lapsList.appendChild(lapItem);
            }
        }
    },

    /**
     * Formate le temps en millisecondes en format lisible
     * @param {number} timeMs - Temps en millisecondes
     * @returns {string} - Temps formaté (HH:MM:SS.MS)
     */
    formatTime(timeMs) {
        const ms = Math.floor((timeMs % 1000) / 10);
        const seconds = Math.floor((timeMs / 1000) % 60);
        const minutes = Math.floor((timeMs / (1000 * 60)) % 60);
        const hours = Math.floor(timeMs / (1000 * 60 * 60));
        
        const formattedHours = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        const formattedMs = ms.toString().padStart(2, '0');
        
        return `${formattedHours}${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
    }
};

// Initialiser le chronomètre lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    StopwatchManager.init();
}); 