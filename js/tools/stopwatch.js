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
        animationFrameId: null,
        bestLap: null,
        slowestLap: null,
        averageLap: 0
    },

    /**
     * Initialise le chronomètre
     */
    init() {
        // Récupérer les éléments du DOM
        this.minutesEl = document.getElementById('minutesSW');
        this.secondsEl = document.getElementById('secondsSW');
        this.millisecondsEl = document.getElementById('millisecondsSW');
        this.startBtn = document.getElementById('startStopwatch');
        this.pauseBtn = document.getElementById('pauseStopwatch');
        this.resetBtn = document.getElementById('resetStopwatch');
        this.lapBtn = document.getElementById('lapStopwatch');
        this.lapList = document.getElementById('lapList');
        this.lapCount = document.getElementById('lapCount');
        this.clearLapsBtn = document.getElementById('clearLaps');
        this.exportLapsBtn = document.getElementById('exportLaps');
        this.bestLapEl = document.getElementById('bestLap');
        this.slowestLapEl = document.getElementById('slowestLap');
        this.averageLapEl = document.getElementById('averageLap');
        this.totalTimeEl = document.getElementById('totalTime');
        this.helpBtn = document.getElementById('stopwatchHelp');
        this.helpPanel = document.getElementById('stopwatchHelpPanel');
        this.closeHelpBtn = document.getElementById('closeStopwatchHelp');
        this.fullscreenBtn = document.getElementById('stopwatchFullscreen');
        this.container = document.getElementById('stopwatchTool');
        this.displayEl = document.querySelector('.stopwatch-display');
        this.stopwatchContainer = document.querySelector('.stopwatch-container');

        // Vérifier si les éléments existent
        if (!this.minutesEl || !this.secondsEl || !this.millisecondsEl) {
            console.log('Éléments d\'affichage du chronomètre non présents dans la page actuelle');
            return;
        }

        // Configurer les gestionnaires d'événements
        this.startBtn.addEventListener('click', () => this.startStopwatch());
        this.pauseBtn.addEventListener('click', () => this.pauseStopwatch());
        this.resetBtn.addEventListener('click', () => this.resetStopwatch());
        this.lapBtn.addEventListener('click', () => this.recordLap());
        this.clearLapsBtn.addEventListener('click', () => this.clearLaps());
        this.exportLapsBtn.addEventListener('click', () => this.exportLaps());
        
        // Gestion de l'aide
        if (this.helpBtn && this.closeHelpBtn && this.helpPanel) {
            this.helpBtn.addEventListener('click', () => this.toggleHelpPanel());
            this.closeHelpBtn.addEventListener('click', () => this.toggleHelpPanel());
        }
        
        // Gestion du plein écran
        if (this.fullscreenBtn && this.container) {
            this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
            
            // Écouter l'événement de changement de mode plein écran
            document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        }

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Initialiser l'affichage
        this.updateDisplay();
        
        console.log('Chronomètre initialisé');
    },

    /**
     * Gère les raccourcis clavier
     * @param {KeyboardEvent} e - L'événement clavier
     */
    handleKeyboardShortcuts(e) {
        // Vérifier que le focus est sur le chronomètre ou ses enfants
        if (!this.container.contains(document.activeElement) && 
            document.activeElement !== document.body) {
            return;
        }
        
        switch(e.key) {
            case ' ': // Espace
                e.preventDefault();
                if (this.state.running) {
                    this.pauseStopwatch();
                } else {
                    this.startStopwatch();
                }
                break;
            case 'l':
            case 'L':
                if (this.state.running) {
                    this.recordLap();
                }
                break;
            case 'r':
            case 'R':
                this.resetStopwatch();
                break;
            case 'c':
            case 'C':
                if (this.state.laps.length > 0) {
                    this.clearLaps();
                }
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen();
                break;
            case 'h':
            case 'H':
                this.toggleHelpPanel();
                break;
        }
    },

    /**
     * Démarre le chronomètre
     */
    startStopwatch() {
        if (!this.state.running) {
            this.state.running = true;
            this.state.startTime = Date.now() - this.state.elapsedTime;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.lapBtn.disabled = false;
            this.resetBtn.disabled = false;
            
            // Ajouter la classe pour l'animation
            if (this.displayEl) {
                this.displayEl.classList.add('running');
            }
            if (this.stopwatchContainer) {
                this.stopwatchContainer.classList.add('stopwatch-running');
            }
            
            this.updateStopwatch();
            
            // Animation pour le bouton de démarrage
            this.animateButton(this.startBtn);
        }
    },

    /**
     * Met en pause le chronomètre
     */
    pauseStopwatch() {
        if (this.state.running) {
            this.state.running = false;
            this.state.elapsedTime = Date.now() - this.state.startTime;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            
            // Retirer la classe pour l'animation
            if (this.displayEl) {
                this.displayEl.classList.remove('running');
            }
            if (this.stopwatchContainer) {
                this.stopwatchContainer.classList.remove('stopwatch-running');
            }
            
            if (this.state.animationFrameId) {
                cancelAnimationFrame(this.state.animationFrameId);
                this.state.animationFrameId = null;
            }
            
            // Animation pour le bouton de pause
            this.animateButton(this.pauseBtn);
        }
    },

    /**
     * Réinitialise le chronomètre
     */
    resetStopwatch() {
        this.pauseStopwatch();
        this.state.elapsedTime = 0;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.lapBtn.disabled = true;
        this.updateDisplay();
        
        // Animation pour le bouton de réinitialisation
        this.animateButton(this.resetBtn);
    },

    /**
     * Efface les tours tout en gardant le chronomètre en l'état
     */
    clearLaps() {
        this.state.laps = [];
        this.state.bestLap = null;
        this.state.slowestLap = null;
        this.state.averageLap = 0;
        this.updateLapsList();
        this.updateStats();
        this.clearLapsBtn.disabled = true;
        this.exportLapsBtn.disabled = true;
        
        // Animation pour le bouton d'effacement
        this.animateButton(this.clearLapsBtn);
    },

    /**
     * Exporte les tours au format CSV
     */
    exportLaps() {
        if (this.state.laps.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Tour,Temps du tour,Temps total\n";
        
        this.state.laps.forEach(lap => {
            csvContent += `${lap.number},${this.formatTime(lap.lapTime)},${this.formatTime(lap.totalTime)}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const dateStr = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
        link.setAttribute("download", `chronometre_tours_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Animation pour le bouton d'exportation
        this.animateButton(this.exportLapsBtn);
    },

    /**
     * Enregistre un tour
     */
    recordLap() {
        if (this.state.running) {
            const currentTime = Date.now() - this.state.startTime;
            const previousLapTime = this.state.laps.length > 0 ? this.state.laps[this.state.laps.length - 1].totalTime : 0;
            const lapTime = currentTime - previousLapTime;
            
            this.state.laps.push({
                number: this.state.laps.length + 1,
                lapTime: lapTime,
                totalTime: currentTime
            });
            
            this.updateLapsList();
            this.updateStats();
            
            this.clearLapsBtn.disabled = false;
            this.exportLapsBtn.disabled = false;
            
            // Animation pour le bouton de tour
            this.animateButton(this.lapBtn);
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
        const time = this.getTimeComponents(this.state.elapsedTime);
        
        if (this.minutesEl && this.secondsEl && this.millisecondsEl) {
            this.minutesEl.textContent = time.minutes;
            this.secondsEl.textContent = time.seconds;
            this.millisecondsEl.textContent = time.milliseconds;
        }
        
        if (this.totalTimeEl) {
            this.totalTimeEl.textContent = this.formatTime(this.state.elapsedTime);
        }
    },

    /**
     * Décompose le temps en millisecondes en composants
     * @param {number} timeMs - Temps en millisecondes
     * @returns {Object} - Composants du temps
     */
    getTimeComponents(timeMs) {
        const ms = Math.floor((timeMs % 1000) / 10);
        const seconds = Math.floor((timeMs / 1000) % 60);
        const minutes = Math.floor((timeMs / (1000 * 60)) % 60);
        const hours = Math.floor(timeMs / (1000 * 60 * 60));
        
        return {
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
            milliseconds: ms.toString().padStart(2, '0')
        };
    },

    /**
     * Met à jour la liste des tours
     */
    updateLapsList() {
        if (this.lapList && this.lapCount) {
            this.lapList.innerHTML = '';
            this.lapCount.textContent = `(${this.state.laps.length})`;
            
            if (this.state.laps.length === 0) {
                return;
            }
            
            // Créer les éléments de tour en ordre inverse (le plus récent en haut)
            for (let i = this.state.laps.length - 1; i >= 0; i--) {
                const lap = this.state.laps[i];
                const lapItem = document.createElement('div');
                lapItem.className = 'lap-item';
                
                // Détermine si c'est le meilleur ou le pire tour
                if (this.state.bestLap && lap.lapTime === this.state.bestLap) {
                    lapItem.classList.add('best-lap');
                } else if (this.state.slowestLap && lap.lapTime === this.state.slowestLap) {
                    lapItem.classList.add('worst-lap');
                }
                
                const lapNumber = document.createElement('div');
                lapNumber.className = 'lap-number';
                lapNumber.textContent = `Tour ${lap.number}`;
                
                const lapTimeEl = document.createElement('div');
                lapTimeEl.className = 'lap-time';
                lapTimeEl.textContent = this.formatTime(lap.lapTime);
                
                const totalTimeEl = document.createElement('div');
                totalTimeEl.className = 'total-time';
                totalTimeEl.textContent = this.formatTime(lap.totalTime);
                
                lapItem.appendChild(lapNumber);
                lapItem.appendChild(lapTimeEl);
                lapItem.appendChild(totalTimeEl);
                
                this.lapList.appendChild(lapItem);
            }
        }
    },

    /**
     * Met à jour les statistiques
     */
    updateStats() {
        if (this.state.laps.length === 0) {
            this.state.bestLap = null;
            this.state.slowestLap = null;
            this.state.averageLap = 0;
            
            if (this.bestLapEl) this.bestLapEl.textContent = '--:--:--';
            if (this.slowestLapEl) this.slowestLapEl.textContent = '--:--:--';
            if (this.averageLapEl) this.averageLapEl.textContent = '--:--:--';
            return;
        }
        
        // Trouver le meilleur et le pire tour
        this.state.bestLap = Math.min(...this.state.laps.map(lap => lap.lapTime));
        this.state.slowestLap = Math.max(...this.state.laps.map(lap => lap.lapTime));
        
        // Calculer la moyenne
        const totalLapTime = this.state.laps.reduce((sum, lap) => sum + lap.lapTime, 0);
        this.state.averageLap = Math.round(totalLapTime / this.state.laps.length);
        
        // Mettre à jour l'affichage
        if (this.bestLapEl) this.bestLapEl.textContent = this.formatTime(this.state.bestLap);
        if (this.slowestLapEl) this.slowestLapEl.textContent = this.formatTime(this.state.slowestLap);
        if (this.averageLapEl) this.averageLapEl.textContent = this.formatTime(this.state.averageLap);
    },

    /**
     * Affiche/cache le panneau d'aide
     */
    toggleHelpPanel() {
        if (this.helpPanel) {
            this.helpPanel.classList.toggle('active');
        }
    },

    /**
     * Active/désactive le mode plein écran
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.container.requestFullscreen) {
                this.container.requestFullscreen();
            } else if (this.container.webkitRequestFullscreen) {
                this.container.webkitRequestFullscreen();
            } else if (this.container.msRequestFullscreen) {
                this.container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    },
    
    /**
     * Gère le changement d'état du mode plein écran
     */
    onFullscreenChange() {
        const icon = this.fullscreenBtn.querySelector('i');
        if (document.fullscreenElement) {
            icon.classList.replace('fa-expand', 'fa-compress');
        } else {
            icon.classList.replace('fa-compress', 'fa-expand');
        }
    },
    
    /**
     * Anime un bouton lorsqu'il est cliqué
     * @param {HTMLElement} button - Le bouton à animer
     */
    animateButton(button) {
        button.classList.add('button-clicked');
        setTimeout(() => {
            button.classList.remove('button-clicked');
        }, 300);
    },

    /**
     * Formate le temps en millisecondes en format lisible
     * @param {number} timeMs - Temps en millisecondes
     * @returns {string} - Temps formaté (HH:MM:SS.MS)
     */
    formatTime(timeMs) {
        const components = this.getTimeComponents(timeMs);
        
        if (parseInt(components.hours) > 0) {
            return `${components.hours}:${components.minutes}:${components.seconds}.${components.milliseconds}`;
        }
        
        return `${components.minutes}:${components.seconds}.${components.milliseconds}`;
    }
}; 