import { Utils } from '../utils.js';

/**
 * Gestionnaire du minuteur et du chronomètre
 */
export const StopwatchManager = {
    state: {
        timer: {
            hours: 0,
            minutes: 0,
            seconds: 0,
            isRunning: false,
            intervalId: null,
            endTime: null,
            sound: true,
            currentSound: 'bell',
            initialTime: {
                hours: 0,
                minutes: 0,
                seconds: 0
            }
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
        this.requestNotificationPermission();
        
        // Initialiser la source audio par défaut
        const sound = document.getElementById('timerAlarm');
        if (sound && (!sound.src || sound.src === '')) {
            // Utiliser le son "bell" par défaut
            sound.src = 'sounds/bell.mp3';
        }
    },

    /**
     * Demande la permission pour les notifications
     */
    requestNotificationPermission() {
        // Vérifier si le navigateur supporte les notifications
        if (!("Notification" in window)) {
            console.log("Ce navigateur ne prend pas en charge les notifications");
            return;
        }
        
        // Ne demander que si la permission n'a pas déjà été accordée ou refusée
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            // Attendre un peu pour ne pas demander immédiatement au chargement de la page
            setTimeout(() => {
                Notification.requestPermission().then(permission => {
                    console.log(`Permission de notification: ${permission}`);
                });
            }, 3000);
        }
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Minuteur - Corrigé pour correspondre aux ID dans le HTML
        document.getElementById('startTimer')?.addEventListener('click', () => {
            this.startTimer();
        });

        document.getElementById('pauseTimer')?.addEventListener('click', () => {
            this.pauseTimer();
        });

        document.getElementById('resetTimer')?.addEventListener('click', () => {
            this.resetTimer();
        });
        
        document.getElementById('cancelTimer')?.addEventListener('click', () => {
            this.resetTimer(); // Utiliser resetTimer pour l'instant
        });

        document.getElementById('testSound')?.addEventListener('click', () => {
            this.testTimerSound();
        });

        document.getElementById('alarmSound')?.addEventListener('change', (e) => {
            this.changeTimerSound(e.target.value);
        });
        
        // Modifier le comportement du bouton d'aide pour faire défiler vers la section d'aide
        document.getElementById('timerHelp')?.addEventListener('click', () => {
            const helpSection = document.querySelector('.help-panel-content');
            if (helpSection) {
                helpSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // Écouter les changements de volume
        document.getElementById('alarmVolume')?.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            const sound = document.getElementById('timerAlarm');
            if (sound) {
                sound.volume = volume;
            }
        });
        
        // Écouter les changements de la case à cocher des notifications
        document.getElementById('notifications')?.addEventListener('change', (e) => {
            if (e.target.checked && Notification.permission !== "granted" && Notification.permission !== "denied") {
                this.requestNotificationPermission();
            }
        });

        // Gérer les préréglages
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const seconds = parseInt(e.target.dataset.time);
                if (isNaN(seconds)) return;
                
                // Convertir en heures, minutes, secondes
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const remainingSeconds = seconds % 60;
                
                // Mettre à jour l'état et l'affichage
                this.state.timer.hours = hours;
                this.state.timer.minutes = minutes;
                this.state.timer.seconds = remainingSeconds;
                
                // Mettre à jour les champs d'entrée
                const inputHours = document.getElementById('inputHours');
                const inputMinutes = document.getElementById('inputMinutes');
                const inputSeconds = document.getElementById('inputSeconds');
                
                if (inputHours) inputHours.value = hours;
                if (inputMinutes) inputMinutes.value = minutes;
                if (inputSeconds) inputSeconds.value = remainingSeconds;
                
                this.updateDisplay();
                
                // Ajouter la classe active au bouton cliqué et la retirer des autres
                document.querySelectorAll('.preset-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        });

        // Gérer les boutons de fin de minuteur
        document.getElementById('dismissTimer')?.addEventListener('click', () => {
            const timerComplete = document.getElementById('timerComplete');
            if (timerComplete) timerComplete.classList.remove('show');
        });

        document.getElementById('restartTimer')?.addEventListener('click', () => {
            const timerComplete = document.getElementById('timerComplete');
            if (timerComplete) timerComplete.classList.remove('show');
            this.startTimer();
        });

        // Entrées du minuteur
        ['Hours', 'Minutes', 'Seconds'].forEach(field => {
            document.getElementById(`input${field}`)
                ?.addEventListener('input', (e) => {
                    this.updateTimerValue(field.toLowerCase(), e.target.value);
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

        // Ajouter les options de sons en ligne et locaux si elles n'existent pas déjà
        const soundSelect = document.getElementById('alarmSound');
        if (soundSelect) {
            // Vérifier si les options en ligne existent déjà
            const hasOnlineSounds = Array.from(soundSelect.options).some(option => 
                option.value.includes('-online')
            );
            
            if (!hasOnlineSounds) {
                // Ajouter un séparateur optgroup pour les sons en ligne
                const localGroup = document.createElement('optgroup');
                localGroup.label = 'Sons locaux';
                
                // Déplacer les options existantes dans le groupe local
                while (soundSelect.options.length > 0) {
                    const option = soundSelect.options[0];
                    localGroup.appendChild(option);
                }
                
                soundSelect.appendChild(localGroup);
                
                // Créer le groupe pour les sons en ligne
                const onlineGroup = document.createElement('optgroup');
                onlineGroup.label = 'Sons en ligne';
                
                // Ajouter les options pour les sons en ligne
                [
                    { value: 'beep-online', text: 'Bip (en ligne)' },
                    { value: 'bell-online', text: 'Cloche (en ligne)' },
                    { value: 'digital-online', text: 'Digital (en ligne)' },
                    { value: 'gentle-online', text: 'Doux (en ligne)' }
                ].forEach(sound => {
                    const option = document.createElement('option');
                    option.value = sound.value;
                    option.textContent = sound.text;
                    onlineGroup.appendChild(option);
                });
                
                soundSelect.appendChild(onlineGroup);
            }
        }
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

        // Sauvegarder le temps initial
        this.state.timer.initialTime = {
            hours: this.state.timer.hours,
            minutes: this.state.timer.minutes,
            seconds: this.state.timer.seconds
        };

        this.state.timer.endTime = Date.now() + totalSeconds * 1000;
        this.state.timer.isRunning = true;
        this.state.timer.intervalId = setInterval(() => this.updateTimer(), 1000);

        this.updateTimerControls();
        this.updateProgressBar(totalSeconds);
        
        // Activer/désactiver les boutons appropriés
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        const cancelBtn = document.getElementById('cancelTimer');
        
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        if (resetBtn) resetBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = false;
    },

    /**
     * Met à jour la barre de progression
     */
    updateProgressBar(totalSeconds) {
        const progressBar = document.getElementById('timerProgress');
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
        
        // Activer/désactiver les boutons appropriés
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    },

    /**
     * Réinitialise le minuteur
     */
    resetTimer() {
        clearInterval(this.state.timer.intervalId);
        this.state.timer.isRunning = false;
        this.state.timer.intervalId = null;
        this.state.timer.endTime = null;

        // Restaurer le temps initial
        this.state.timer.hours = this.state.timer.initialTime.hours;
        this.state.timer.minutes = this.state.timer.initialTime.minutes;
        this.state.timer.seconds = this.state.timer.initialTime.seconds;

        // Réinitialiser les champs d'entrée avec le temps initial
        const inputHours = document.getElementById('inputHours');
        const inputMinutes = document.getElementById('inputMinutes');
        const inputSeconds = document.getElementById('inputSeconds');
        
        if (inputHours) inputHours.value = this.state.timer.initialTime.hours;
        if (inputMinutes) inputMinutes.value = this.state.timer.initialTime.minutes;
        if (inputSeconds) inputSeconds.value = this.state.timer.initialTime.seconds;

        // Réinitialiser la barre de progression
        const progressBar = document.getElementById('timerProgress');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
        }

        this.updateDisplay();
        this.updateTimerControls();
        
        // Activer/désactiver les boutons appropriés
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        const cancelBtn = document.getElementById('cancelTimer');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;
        
        // Supprimer l'état sauvegardé au lieu de le sauvegarder
        localStorage.removeItem('timerState');
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
        
        // Ajouter une classe pour animation si on est proche de la fin
        if (remaining <= 10) {
            const timerDisplay = document.querySelector('.time-remaining');
            if (timerDisplay && !timerDisplay.classList.contains('timer-ending')) {
                timerDisplay.classList.add('timer-ending');
            }
        }
    },

    /**
     * Gère la fin du minuteur
     */
    timerComplete() {
        clearInterval(this.state.timer.intervalId);
        this.state.timer.isRunning = false;
        this.state.timer.intervalId = null;
        this.state.timer.endTime = null;

        // Restaurer le temps initial
        this.state.timer.hours = this.state.timer.initialTime.hours;
        this.state.timer.minutes = this.state.timer.initialTime.minutes;
        this.state.timer.seconds = this.state.timer.initialTime.seconds;

        // Réinitialiser les champs d'entrée avec le temps initial
        const inputHours = document.getElementById('inputHours');
        const inputMinutes = document.getElementById('inputMinutes');
        const inputSeconds = document.getElementById('inputSeconds');
        
        if (inputHours) inputHours.value = this.state.timer.initialTime.hours;
        if (inputMinutes) inputMinutes.value = this.state.timer.initialTime.minutes;
        if (inputSeconds) inputSeconds.value = this.state.timer.initialTime.seconds;

        // Réinitialiser la barre de progression
        const progressBar = document.getElementById('timerProgress');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
        }

        // Retirer la classe d'animation de fin
        const timerDisplay = document.querySelector('.time-remaining');
        if (timerDisplay) {
            timerDisplay.classList.remove('timer-ending');
        }

        this.updateDisplay();
        this.updateTimerControls();
        
        // Activer/désactiver les boutons appropriés
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        const cancelBtn = document.getElementById('cancelTimer');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;
        
        // Supprimer l'état sauvegardé au lieu de le sauvegarder
        localStorage.removeItem('timerState');

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

        // Afficher l'écran de fin
        const timerComplete = document.getElementById('timerComplete');
        if (timerComplete) {
            timerComplete.classList.add('show');
        }
    },

    /**
     * Joue l'alarme
     */
    playAlarm() {
        if (!this.state.timer.sound) return;
        
        // Si le son sélectionné est "none", ne pas jouer
        if (this.state.timer.currentSound === 'none') {
            console.log('Son désactivé, aucune alarme jouée');
            return;
        }
        
        // Utiliser l'élément audio timerAlarm existant dans le HTML
        const sound = document.getElementById('timerAlarm');
        if (sound) {
            // Définir le volume en fonction du paramètre
            const volumeSlider = document.getElementById('alarmVolume');
            if (volumeSlider) {
                sound.volume = volumeSlider.value / 100;
            }
            
            sound.currentTime = 0;
            sound.play().catch((error) => {
                console.warn('Impossible de jouer l\'alarme:', error);
            });
            
            // Essayer d'envoyer une notification
            this.showNotification();
        } else {
            console.warn('Élément audio du minuteur non trouvé');
        }
    },

    /**
     * Affiche une notification
     */
    showNotification() {
        // Vérifier si le navigateur supporte les notifications
        if (!("Notification" in window)) {
            console.warn("Ce navigateur ne prend pas en charge les notifications");
            return;
        }
        
        // Vérifier si l'utilisateur a activé les notifications
        const notifications = document.getElementById('notifications');
        if (notifications && !notifications.checked) {
            return;
        }
        
        // Si la permission est déjà accordée, afficher la notification
        if (Notification.permission === "granted") {
            const notification = new Notification("Minuteur terminé !", {
                body: "Votre minuteur est terminé.",
                icon: "/icons/icon-144x144.png"
            });
            
            // Fermer la notification après 5 secondes
            setTimeout(() => {
                notification.close();
            }, 5000);
        } 
        // Sinon, demander la permission
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    const notification = new Notification("Minuteur terminé !", {
                        body: "Votre minuteur est terminé.",
                        icon: "/icons/icon-144x144.png"
                    });
                    
                    setTimeout(() => {
                        notification.close();
                    }, 5000);
                }
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
        // Mettre à jour l'affichage principal du temps
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        if (hoursElement && minutesElement && secondsElement) {
            const { hours, minutes, seconds } = this.state.timer;
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');
        }
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
        const startButton = document.getElementById('startTimer');
        const pauseButton = document.getElementById('pauseTimer');
        const resetButton = document.getElementById('resetTimer');
        const cancelButton = document.getElementById('cancelTimer');
        
        if (startButton && pauseButton) {
            startButton.disabled = this.state.timer.isRunning;
            pauseButton.disabled = !this.state.timer.isRunning;
            
            if (resetButton) {
                resetButton.disabled = !this.state.timer.isRunning && this.calculateTotalSeconds() === 0;
            }
            
            if (cancelButton) {
                cancelButton.disabled = !this.state.timer.isRunning;
            }
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
            const soundSelect = document.getElementById('alarmSound');
            if (soundSelect) {
                soundSelect.value = savedSound;
            }
            
            // Mettre à jour la source audio en fonction du son sauvegardé
            this.changeTimerSound(savedSound);
        }
    },

    /**
     * Change le son du timer
     * @param {string} soundType - Le type de son à utiliser
     */
    changeTimerSound(soundType) {
        this.state.timer.currentSound = soundType;
        localStorage.setItem('timerSound', soundType);
        
        // Définir la carte des sons avec les sources locales et en ligne
        const soundMap = {
            // Sons locaux
            'beep': 'sounds/beep.mp3',
            'bell': 'sounds/bell.mp3',
            'digital': 'sounds/alarm.mp3',
            'gentle': 'sounds/chime.mp3',
            'notification': 'sounds/notification.mp3',
            // Sons en ligne
            'beep-online': 'https://assets.mixkit.co/active_storage/sfx/1867/1867-preview.mp3',
            'bell-online': 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
            'digital-online': 'https://assets.mixkit.co/active_storage/sfx/2310/2310-preview.mp3',
            'gentle-online': 'https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3',
            'none': '' // Aucun son
        };
        
        const sound = document.getElementById('timerAlarm');
        if (sound && soundType !== 'none') {
            sound.src = soundMap[soundType] || soundMap['bell']; // Par défaut 'bell'
        }
        
        this.testTimerSound();
    },

    /**
     * Teste le son de l'alarme
     */
    testTimerSound() {
        // Utiliser l'élément audio timerAlarm existant
        const sound = document.getElementById('timerAlarm');
        if (sound) {
            // Si le son est "none", ne pas jouer
            if (this.state.timer.currentSound === 'none') {
                console.log('Son désactivé, aucun test joué');
                return;
            }
            
            // Définir le volume
            const volumeSlider = document.getElementById('alarmVolume');
            if (volumeSlider) {
                sound.volume = volumeSlider.value / 100;
            }
            
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn('Impossible de jouer le son de test:', error);
            });
        } else {
            console.warn('Élément audio du minuteur non trouvé');
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
    const select = document.getElementById('alarmSound');
    if (select) {
        TimerManager.changeTimerSound(select.value);
    }
};
window.testTimerSound = () => TimerManager.testTimerSound();

// Initialiser le minuteur au chargement
document.addEventListener('DOMContentLoaded', () => {
    StopwatchManager.init();
}); 