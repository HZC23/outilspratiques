/**
 * Module de génération de mots de passe
 * Gère la génération de mots de passe sécurisés et l'évaluation de leur force
 * Version améliorée avec fiabilité accrue et compatibilité avec le HTML
 */

export class PasswordManager {
    // Caractères disponibles pour la génération de mots de passe
    static CHARS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        similar: 'il1IoO0',
        ambiguous: '{}[]()/\\\'"`~,;:.<>'
    };

    // Configuration par défaut
    static DEFAULT_CONFIG = {
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeSimilar: false,
        excludeAmbiguous: false
    };

    // État du générateur
    static state = {
        config: {...PasswordManager.DEFAULT_CONFIG},
        generatedPassword: '',
        passwordStrength: 0,
        passwordVisible: false,
        history: [],
        helpVisible: false
    };

    // Tables de conversion pour l'estimation du temps de craquage
    static CRACK_TIME_DISPLAY = {
        seconds: {
            singular: "seconde",
            plural: "secondes"
        },
        minutes: {
            singular: "minute",
            plural: "minutes"
        },
        hours: {
            singular: "heure",
            plural: "heures"
        },
        days: {
            singular: "jour",
            plural: "jours"
        },
        months: {
            singular: "mois",
            plural: "mois"
        },
        years: {
            singular: "année",
            plural: "années"
        },
        centuries: {
            singular: "siècle",
            plural: "siècles"
        }
    };

    /**
     * Initialise le générateur de mots de passe
     */
    static init() {
        console.log('Initialisation du générateur de mot de passe...');
        try {
            // Identifier le conteneur principal
            const container = document.getElementById('passwordTool');
            
            if (!container) {
                return;
            }
            
            // Vérifier les éléments clés
            const requiredElements = [
                'passwordOutput',
                'passwordLength',
                'passwordLengthNumber',
                'includeUppercase',
                'includeLowercase',
                'includeNumbers',
                'includeSymbols',
                'excludeSimilar',
                'excludeAmbiguous',
                'generatePassword',
                'copyPassword',
                'strengthMeter',
                'strengthText'
            ];
            
            for (const elementId of requiredElements) {
                if (!document.getElementById(elementId)) {
                    console.error(`Élément requis manquant: ${elementId}`);
                    return;
                }
            }
            
            console.log('Tous les éléments requis sont présents, initialisation du générateur...');
            
            // Charger l'historique depuis le stockage local
            this.loadPasswordHistory();
            
            // Configurer les écouteurs d'événements
            this.setupEventListeners();
            
            // Synchroniser l'interface avec l'état actuel
            this.syncUIWithState();
            
            // Générer un mot de passe initial
            this.generatePassword();
            
            console.log('Générateur de mot de passe initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du générateur:', error);
        }
    }

    /**
     * Configure les écouteurs d'événements pour l'interface utilisateur
     */
    static setupEventListeners() {
        // Contrôles de longueur du mot de passe
        const lengthSlider = document.getElementById('passwordLength');
        const lengthNumber = document.getElementById('passwordLengthNumber');
        
        // Synchroniser slider et champ numérique
        lengthSlider.addEventListener('input', () => {
            lengthNumber.value = lengthSlider.value;
            this.updatePasswordLength();
        });
        
        lengthNumber.addEventListener('input', () => {
            let value = parseInt(lengthNumber.value);
            // Borner la valeur entre min et max
            value = Math.max(parseInt(lengthNumber.min), Math.min(parseInt(lengthNumber.max), value));
            lengthNumber.value = value;
            lengthSlider.value = value;
            this.updatePasswordLength();
        });
        
        // Cases à cocher pour les options de caractères
        document.getElementById('includeUppercase').addEventListener('change', () => this.updateOptions());
        document.getElementById('includeLowercase').addEventListener('change', () => this.updateOptions());
        document.getElementById('includeNumbers').addEventListener('change', () => this.updateOptions());
        document.getElementById('includeSymbols').addEventListener('change', () => this.updateOptions());
        document.getElementById('excludeSimilar').addEventListener('change', () => this.updateOptions());
        document.getElementById('excludeAmbiguous').addEventListener('change', () => this.updateOptions());
        
        // Boutons d'action
        document.getElementById('generatePassword').addEventListener('click', () => this.generatePassword());
        document.getElementById('copyPassword').addEventListener('click', () => this.copyPassword());
        document.getElementById('refreshPassword').addEventListener('click', () => this.generatePassword());
        document.getElementById('toggleVisibility').addEventListener('click', () => this.togglePasswordVisibility());
        
        // Rendre le champ de mot de passe éditable
        const passwordOutput = document.getElementById('passwordOutput');
        if (passwordOutput) {
            // Supprimer l'attribut readonly pour permettre l'édition
            passwordOutput.removeAttribute('readonly');
            
            // Ajouter un écouteur pour mettre à jour l'analyse lors de modifications manuelles
            passwordOutput.addEventListener('input', () => {
                const newPassword = passwordOutput.value;
                this.state.generatedPassword = newPassword;
                this.evaluatePasswordStrength(newPassword);
                this.estimateCrackTime(newPassword);
                this.analyzePassword(newPassword);
            });
        }
        
        // Boutons de panneau d'aide
        const helpButton = document.getElementById('passwordHelp');
        const closeHelpButton = document.getElementById('closePasswordHelp');
        const helpPanel = document.getElementById('passwordHelpPanel');
        
        if (helpButton && closeHelpButton && helpPanel) {
            helpButton.addEventListener('click', () => {
                helpPanel.classList.add('active');
                this.state.helpVisible = true;
            });
            
            closeHelpButton.addEventListener('click', () => {
                helpPanel.classList.remove('active');
                this.state.helpVisible = false;
            });
        }
        
        // Boutons de sauvegarde des mots de passe
        const savePasswordButton = document.getElementById('saveCurrentPassword');
        const clearPasswordsButton = document.getElementById('clearSavedPasswords');
        
        if (savePasswordButton) {
            savePasswordButton.addEventListener('click', () => {
                this.saveCurrentPassword();
            });
        }
        
        if (clearPasswordsButton) {
            clearPasswordsButton.addEventListener('click', () => {
                this.clearPasswordHistory();
            });
        }
        
        // Plein écran
        const fullscreenButton = document.getElementById('fullscreenBtn');
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', () => {
                this.toggleFullscreen(container);
            });
        }
    }

    /**
     * Met à jour la longueur du mot de passe dans l'état
     */
    static updatePasswordLength() {
        const lengthSlider = document.getElementById('passwordLength');
        this.state.config.length = parseInt(lengthSlider.value);
        // Régénérer le mot de passe après un court délai
        this.debounce(this.generatePassword.bind(this), 300)();
    }

    /**
     * Met à jour les options du générateur
     */
    static updateOptions() {
        const options = {
            uppercase: document.getElementById('includeUppercase').checked,
            lowercase: document.getElementById('includeLowercase').checked,
            numbers: document.getElementById('includeNumbers').checked,
            symbols: document.getElementById('includeSymbols').checked,
            excludeSimilar: document.getElementById('excludeSimilar').checked,
            excludeAmbiguous: document.getElementById('excludeAmbiguous').checked
        };
        
        // S'assurer qu'au moins une option de caractères est sélectionnée
        if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
            // Forcer l'activation des minuscules si aucune option n'est sélectionnée
            document.getElementById('includeLowercase').checked = true;
            options.lowercase = true;
        }
        
        this.state.config = { ...this.state.config, ...options };
        
        // Régénérer le mot de passe après un court délai
        this.debounce(this.generatePassword.bind(this), 300)();
    }

    /**
     * Génère un mot de passe aléatoire selon les options définies
     */
    static generatePassword() {
        try {
            // Construire la chaîne de caractères disponibles
            let availableChars = '';
            
            if (this.state.config.uppercase) {
                availableChars += this.CHARS.uppercase;
            }
            
            if (this.state.config.lowercase) {
                availableChars += this.CHARS.lowercase;
            }
            
            if (this.state.config.numbers) {
                availableChars += this.CHARS.numbers;
            }
            
            if (this.state.config.symbols) {
                availableChars += this.CHARS.symbols;
            }
            
            // Exclure les caractères similaires si demandé
            if (this.state.config.excludeSimilar) {
                for (const char of this.CHARS.similar) {
                    availableChars = availableChars.replace(new RegExp(char, 'g'), '');
                }
            }
            
            // Exclure les caractères ambigus si demandé
            if (this.state.config.excludeAmbiguous) {
                for (const char of this.CHARS.ambiguous) {
                    availableChars = availableChars.replace(new RegExp('\\' + char, 'g'), '');
                }
            }
            
            // Vérifier qu'il reste des caractères disponibles
            if (availableChars.length === 0) {
                this.showNotification('Impossible de générer un mot de passe: aucun caractère disponible', 'error');
                return;
            }
            
            // Générer un mot de passe initial
            let password = '';
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
                password = '';
                for (let i = 0; i < this.state.config.length; i++) {
                    const randomIndex = this.getSecureRandomNumber(0, availableChars.length - 1);
                    password += availableChars[randomIndex];
                }
                
                attempts++;
                
                // Vérifier que le mot de passe satisfait toutes les contraintes
            } while (!this.validatePassword(password) && attempts < maxAttempts);
            
            if (attempts >= maxAttempts) {
                console.warn('Impossible de générer un mot de passe valide après plusieurs tentatives.');
                // Utiliser le dernier mot de passe généré malgré tout
            }
            
            // Mettre à jour l'interface utilisateur
            const passwordOutput = document.getElementById('passwordOutput');
            if (passwordOutput) {
                passwordOutput.value = password;
                // Appliquer le masquage si nécessaire
                if (!this.state.passwordVisible) {
                    passwordOutput.type = 'password';
                } else {
                    passwordOutput.type = 'text';
                }
            }
            
            this.state.generatedPassword = password;
            
            // Évaluer la force du mot de passe
            this.evaluatePasswordStrength(password);
            
            // Estimer le temps de craquage
            this.estimateCrackTime(password);
            
            // Analyser le mot de passe
            this.analyzePassword(password);
            
            return password;
        } catch (error) {
            console.error('Erreur lors de la génération du mot de passe:', error);
            this.showNotification('Erreur lors de la génération du mot de passe', 'error');
        }
    }

    /**
     * Valide que le mot de passe généré respecte toutes les contraintes
     * @param {string} password - Le mot de passe à valider
     * @returns {boolean} - True si le mot de passe est valide
     */
    static validatePassword(password) {
        if (this.state.config.uppercase && !/[A-Z]/.test(password)) return false;
        if (this.state.config.lowercase && !/[a-z]/.test(password)) return false;
        if (this.state.config.numbers && !/[0-9]/.test(password)) return false;
        if (this.state.config.symbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) return false;
        
        return true;
    }

    /**
     * Génère un nombre aléatoire plus sécurisé que Math.random()
     * @param {number} min - Valeur minimale (incluse)
     * @param {number} max - Valeur maximale (incluse)
     * @returns {number} - Un nombre aléatoire entre min et max
     */
    static getSecureRandomNumber(min, max) {
        try {
            // Essayer d'utiliser Crypto API si disponible
            if (window.crypto && window.crypto.getRandomValues) {
                const range = max - min + 1;
                const byteArray = new Uint32Array(1);
                window.crypto.getRandomValues(byteArray);
                const randomNumber = byteArray[0] / (0xffffffff + 1);
                return Math.floor(randomNumber * range) + min;
            } 
        } catch (e) {
            console.warn("Crypto API non disponible, utilisation de Math.random()");
        }
        
        // Fallback à Math.random()
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Évalue la force du mot de passe
     * @param {string} password - Le mot de passe à évaluer
     */
    static evaluatePasswordStrength(password) {
        try {
            const strengthMeter = document.getElementById('strengthMeter');
            const strengthText = document.getElementById('strengthText');
            
            if (!strengthMeter || !strengthText) return;
            
            // Critères de base
            const length = password.length;
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumbers = /[0-9]/.test(password);
            const hasSymbols = /[^A-Za-z0-9]/.test(password);
            
            // Critères avancés
            const hasRepeatingChars = /(.).*\1/.test(password);
            const hasConsecutiveChars = /abcdefghijklmnopqrstuvwxyz|0123456789/i.test(password);
            const uniqueCharRatio = new Set(password).size / password.length;
            
            // Calcul du score (0-100)
            let score = 0;
            
            // Points pour la longueur (logarithmique pour éviter les scores trop élevés pour longueurs extrêmes)
            score += Math.min(Math.log(length) * 15, 45);
            
            // Points pour la diversité de caractères
            if (hasUppercase) score += 10;
            if (hasLowercase) score += 10;
            if (hasNumbers) score += 10;
            if (hasSymbols) score += 15;
            
            // Bonus pour la diversité des caractères uniques
            score += uniqueCharRatio * 10;
            
            // Pénalités
            if (hasRepeatingChars) score -= 10;
            if (hasConsecutiveChars) score -= 10;
            
            // Ajuster le score final
            score = Math.max(0, Math.min(score, 100));
            this.state.passwordStrength = score;
            
            // Mettre à jour l'affichage visuel
            strengthMeter.style.width = `${score}%`;
            
            // Enlever les classes existantes
            strengthMeter.classList.remove('weak', 'fair', 'good', 'strong');
            
            // Définir le niveau de force et la couleur
            let strengthLevel;
            if (score < 25) {
                strengthLevel = 'Très faible';
                strengthMeter.classList.add('weak');
            } else if (score < 50) {
                strengthLevel = 'Faible';
                strengthMeter.classList.add('fair');
            } else if (score < 75) {
                strengthLevel = 'Bon';
                strengthMeter.classList.add('good');
            } else {
                strengthLevel = 'Excellent';
                strengthMeter.classList.add('strong');
            }
            
            // Afficher le texte de force
            strengthText.textContent = `Force: ${strengthLevel}`;
        } catch (error) {
            console.error('Erreur lors de l\'évaluation de la force du mot de passe:', error);
        }
    }

    /**
     * Met à jour un élément d'analyse du mot de passe
     * @param {HTMLElement} element - L'élément d'analyse
     * @param {boolean} isValid - Si le critère est valide
     * @param {string} text - Le texte à afficher
     */
    static updateAnalysisItem(element, isValid, text) {
        if (!element) return;
        
        // Mettre à jour la classe
        element.classList.remove('pass', 'fail');
        element.classList.add(isValid ? 'pass' : 'fail');
        
        // Mettre à jour l'icône
        const icon = element.querySelector('i');
        if (icon) {
            icon.className = isValid ? 'fas fa-check-circle' : 'fas fa-times-circle';
        }
        
        // Mettre à jour le texte
        element.innerHTML = element.innerHTML.replace(/>.*<\/li>/, `>${text}</li>`);
    }

    /**
     * Copie le mot de passe généré dans le presse-papiers
     */
    static copyPassword() {
        try {
            const passwordOutput = document.getElementById('passwordOutput');
            
            if (!passwordOutput) return;
            
            // Sélectionner le texte
            passwordOutput.select();
            passwordOutput.setSelectionRange(0, 99999); // Pour mobile
            
            // Copier le texte
            if (navigator.clipboard) {
                navigator.clipboard.writeText(passwordOutput.value)
                    .then(() => {
                        this.showNotification('Mot de passe copié dans le presse-papiers', 'success');
                    })
                    .catch(err => {
                        console.error('Erreur lors de la copie:', err);
                        // Fallback à la méthode document.execCommand
                        document.execCommand('copy');
                        this.showNotification('Mot de passe copié dans le presse-papiers', 'success');
                    });
            } else {
                // Fallback pour les navigateurs plus anciens
                document.execCommand('copy');
                this.showNotification('Mot de passe copié dans le presse-papiers', 'success');
            }
            
            // Désélectionner
            passwordOutput.blur();
        } catch (error) {
            console.error('Erreur lors de la copie du mot de passe:', error);
            this.showNotification('Impossible de copier le mot de passe', 'error');
        }
    }

    /**
     * Bascule la visibilité du mot de passe
     */
    static togglePasswordVisibility() {
        const passwordOutput = document.getElementById('passwordOutput');
        const toggleButton = document.getElementById('toggleVisibility');
        
        if (!passwordOutput || !toggleButton) return;
        
        this.state.passwordVisible = !this.state.passwordVisible;
        
        // Mettre à jour le type de champ
        passwordOutput.type = this.state.passwordVisible ? 'text' : 'password';
        
        // Mettre à jour l'icône
        const icon = toggleButton.querySelector('i');
        if (icon) {
            icon.className = this.state.passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
        
        // Mettre à jour le titre
        toggleButton.setAttribute('aria-label', this.state.passwordVisible ? 'Masquer' : 'Afficher');
    }

    /**
     * Sauvegarde le mot de passe actuel dans l'historique
     */
    static saveCurrentPassword() {
        if (!this.state.generatedPassword) {
            this.showNotification('Aucun mot de passe à sauvegarder', 'warning');
            return;
        }
        
        // Vérifier si le mot de passe existe déjà dans l'historique
        if (this.state.history.includes(this.state.generatedPassword)) {
            this.showNotification('Ce mot de passe est déjà sauvegardé', 'info');
            return;
        }
        
        // Ajouter au début de l'historique
        this.state.history.unshift(this.state.generatedPassword);
        
        // Limiter la taille de l'historique
        if (this.state.history.length > 10) {
            this.state.history = this.state.history.slice(0, 10);
        }
        
        // Sauvegarder dans le stockage local
        this.savePasswordHistory();
        
        // Mettre à jour l'affichage
        this.updatePasswordHistoryDisplay();
        
        this.showNotification('Mot de passe sauvegardé', 'success');
    }

    /**
     * Met à jour l'affichage de l'historique des mots de passe
     */
    static updatePasswordHistoryDisplay() {
        const historyContainer = document.getElementById('savedPasswordsList');
        if (!historyContainer) return;
        
        // Vider le conteneur
        historyContainer.innerHTML = '';
        
        // Afficher un message si l'historique est vide
        if (this.state.history.length === 0) {
            historyContainer.innerHTML = '<div class="no-saved-passwords">Aucun mot de passe sauvegardé</div>';
            return;
        }
        
        // Ajouter chaque mot de passe à l'historique
        this.state.history.forEach(password => {
            const item = document.createElement('div');
            item.className = 'saved-password-item';
            
            const passwordText = document.createElement('div');
            passwordText.className = 'saved-password-text';
            passwordText.textContent = password;
            item.appendChild(passwordText);
            
            const actions = document.createElement('div');
            actions.className = 'saved-password-actions';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn-icon';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.title = 'Copier';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(password)
                    .then(() => {
                        this.showNotification('Mot de passe copié dans le presse-papiers', 'success');
                    })
                    .catch(err => {
                        console.error('Erreur lors de la copie:', err);
                    });
            };
            
            const useBtn = document.createElement('button');
            useBtn.className = 'btn-icon';
            useBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
            useBtn.title = 'Utiliser';
            useBtn.onclick = () => {
                const passwordOutput = document.getElementById('passwordOutput');
                if (passwordOutput) {
                    passwordOutput.value = password;
                    this.state.generatedPassword = password;
                    this.evaluatePasswordStrength(password);
                    this.estimateCrackTime(password);
                    this.analyzePassword(password);
                }
            };
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = 'Supprimer';
            deleteBtn.onclick = () => {
                this.state.history = this.state.history.filter(p => p !== password);
                this.savePasswordHistory();
                this.updatePasswordHistoryDisplay();
                this.showNotification('Mot de passe supprimé', 'info');
            };
            
            actions.appendChild(copyBtn);
            actions.appendChild(useBtn);
            actions.appendChild(deleteBtn);
            
            item.appendChild(actions);
            historyContainer.appendChild(item);
        });
    }

    /**
     * Efface l'historique des mots de passe
     */
    static clearPasswordHistory() {
        if (this.state.history.length === 0) {
            this.showNotification('L\'historique est déjà vide', 'info');
            return;
        }
        
        if (confirm('Êtes-vous sûr de vouloir effacer tous les mots de passe sauvegardés ?')) {
            this.state.history = [];
            this.savePasswordHistory();
            this.updatePasswordHistoryDisplay();
            this.showNotification('Historique effacé', 'success');
        }
    }

    /**
     * Sauvegarde l'historique des mots de passe dans le stockage local
     */
    static savePasswordHistory() {
        try {
            localStorage.setItem('passwordHistory', JSON.stringify(this.state.history));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique:', error);
        }
    }

    /**
     * Charge l'historique des mots de passe depuis le stockage local
     */
    static loadPasswordHistory() {
        try {
            const savedHistory = localStorage.getItem('passwordHistory');
            if (savedHistory) {
                this.state.history = JSON.parse(savedHistory);
                this.updatePasswordHistoryDisplay();
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            // En cas d'erreur, réinitialiser l'historique
            this.state.history = [];
        }
    }

    /**
     * Synchronise l'interface utilisateur avec l'état actuel
     */
    static syncUIWithState() {
        // Synchroniser les options
        document.getElementById('passwordLength').value = this.state.config.length;
        document.getElementById('passwordLengthNumber').value = this.state.config.length;
        document.getElementById('includeUppercase').checked = this.state.config.uppercase;
        document.getElementById('includeLowercase').checked = this.state.config.lowercase;
        document.getElementById('includeNumbers').checked = this.state.config.numbers;
        document.getElementById('includeSymbols').checked = this.state.config.symbols;
        document.getElementById('excludeSimilar').checked = this.state.config.excludeSimilar;
        document.getElementById('excludeAmbiguous').checked = this.state.config.excludeAmbiguous;
    }

    /**
     * Bascule le mode plein écran pour un élément
     * @param {HTMLElement} element - L'élément à mettre en plein écran
     */
    static toggleFullscreen(element) {
        if (!element) return;
        
        if (!document.fullscreenElement && 
            !document.mozFullScreenElement && 
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            // Passer en plein écran
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            // Quitter le plein écran
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    /**
     * Affiche une notification à l'utilisateur
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type de notification (success, error, warning, info)
     */
    static showNotification(message, type = 'info') {
        // Vérifier si une notification existe déjà
        let notification = document.querySelector('.notification');
        
        // Créer une nouvelle notification si nécessaire
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Définir les couleurs selon le type
        const colors = {
            success: 'var(--success-color, #2ecc40)',
            error: 'var(--danger-color, #ff4136)',
            warning: 'var(--warning-color, #ff851b)',
            info: 'var(--info-color, #0074d9)'
        };
        
        // Appliquer le style
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        // Afficher la notification
        notification.classList.add('show');
        
        // Masquer après un délai
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    /**
     * Fonction debounce pour limiter les appels rapides à une fonction
     * @param {Function} func - La fonction à appeler
     * @param {number} wait - Le délai d'attente en ms
     * @returns {Function} - La fonction avec debounce
     */
    static debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    /**
     * Estime le temps nécessaire pour craquer le mot de passe
     * @param {string} password - Le mot de passe à analyser
     */
    static estimateCrackTime(password) {
        try {
            const onlineCrackTimeEl = document.getElementById('onlineCrackTime');
            const offlineCrackTimeEl = document.getElementById('offlineCrackTime');
            const supercomputerCrackTimeEl = document.getElementById('supercomputerCrackTime');
            
            if (!onlineCrackTimeEl || !offlineCrackTimeEl || !supercomputerCrackTimeEl) return;
            
            // Calculer l'entropie du mot de passe
            const entropy = this.calculateEntropy(password);
            
            // Estimations des taux de craquage (tentatives par seconde)
            const onlineRate = 100; // 100 tentatives/seconde (limitées par réseau)
            const offlineRate = 1000000000; // 1 milliard/seconde (PC moderne)
            const supercomputerRate = 100000000000000; // 100 billions/seconde (superordinateur)
            
            // Calcul du nombre de possibilités
            const possibleCombinations = Math.pow(2, entropy);
            
            // Calcul des temps en secondes
            const onlineTimeSeconds = possibleCombinations / (2 * onlineRate);
            const offlineTimeSeconds = possibleCombinations / (2 * offlineRate);
            const supercomputerTimeSeconds = possibleCombinations / (2 * supercomputerRate);
            
            // Formater les temps pour l'affichage
            onlineCrackTimeEl.textContent = this.formatCrackTime(onlineTimeSeconds);
            offlineCrackTimeEl.textContent = this.formatCrackTime(offlineTimeSeconds);
            supercomputerCrackTimeEl.textContent = this.formatCrackTime(supercomputerTimeSeconds);
        } catch (error) {
            console.error('Erreur lors de l\'estimation du temps de craquage:', error);
        }
    }

    /**
     * Calcule l'entropie d'un mot de passe
     * @param {string} password - Le mot de passe à analyser
     * @returns {number} - L'entropie estimée en bits
     */
    static calculateEntropy(password) {
        // Déterminer l'ensemble de caractères utilisés
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSymbols = /[^A-Za-z0-9]/.test(password);
        
        // Déterminer la taille de l'ensemble de caractères
        let charsetSize = 0;
        if (hasUppercase) charsetSize += 26;
        if (hasLowercase) charsetSize += 26;
        if (hasNumbers) charsetSize += 10;
        if (hasSymbols) charsetSize += 33; // Estimation du nombre de symboles courants
        
        // Calculer l'entropie de base (log2 de nombre de possibilités)
        const basicEntropy = Math.log2(Math.pow(charsetSize, password.length));
        
        // Ajuster l'entropie en tenant compte des schémas et répétitions
        const uniqueChars = new Set(password).size;
        const uniqueRatio = uniqueChars / password.length;
        
        // Réduire l'entropie pour les schémas communs
        let patternPenalty = 0;
        
        // Séquences communes
        if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
            patternPenalty += 0.2;
        }
        
        // Séquences numériques
        if (/123|234|345|456|567|678|789|987|876|765|654|543|432|321/.test(password)) {
            patternPenalty += 0.2;
        }
        
        // Caractères répétitifs
        if (/(.)(\1{2,})/.test(password)) {
            patternPenalty += 0.3;
        }
        
        // Ajuster l'entropie
        const adjustedEntropy = basicEntropy * (0.8 + (0.2 * uniqueRatio)) * (1 - patternPenalty);
        
        return adjustedEntropy;
    }

    /**
     * Formate un temps en secondes en une chaîne lisible
     * @param {number} seconds - Le temps en secondes
     * @returns {string} - Temps formaté (ex: "3 jours", "200 années")
     */
    static formatCrackTime(seconds) {
        if (seconds < 60) {
            return this.formatTimeUnit(seconds, 'seconds');
        } else if (seconds < 3600) {
            return this.formatTimeUnit(seconds / 60, 'minutes');
        } else if (seconds < 86400) {
            return this.formatTimeUnit(seconds / 3600, 'hours');
        } else if (seconds < 2592000) {
            return this.formatTimeUnit(seconds / 86400, 'days');
        } else if (seconds < 31536000) {
            return this.formatTimeUnit(seconds / 2592000, 'months');
        } else if (seconds < 3153600000) {
            return this.formatTimeUnit(seconds / 31536000, 'years');
        } else {
            return this.formatTimeUnit(seconds / 3153600000, 'centuries');
        }
    }

    /**
     * Formate une valeur numérique avec son unité
     * @param {number} value - La valeur à formater
     * @param {string} unit - L'unité de temps (seconds, minutes, etc.)
     * @returns {string} - Chaîne formatée
     */
    static formatTimeUnit(value, unit) {
        const roundedValue = Math.round(value);
        if (roundedValue === 1) {
            return `1 ${this.CRACK_TIME_DISPLAY[unit].singular}`;
        } else if (roundedValue >= 1000000000000000) {
            return 'plus que l\'âge de l\'univers';
        } else {
            return `${roundedValue.toLocaleString('fr-FR')} ${this.CRACK_TIME_DISPLAY[unit].plural}`;
        }
    }

    /**
     * Analyse les caractéristiques du mot de passe pour l'affichage des critères
     * @param {string} password - Le mot de passe à analyser
     */
    static analyzePassword(password) {
        try {
            const lengthAnalysis = document.getElementById('lengthAnalysis');
            const uppercaseAnalysis = document.getElementById('uppercaseAnalysis');
            const lowercaseAnalysis = document.getElementById('lowercaseAnalysis');
            const numbersAnalysis = document.getElementById('numbersAnalysis');
            const symbolsAnalysis = document.getElementById('symbolsAnalysis');
            const patternAnalysis = document.getElementById('patternAnalysis');
            const repeatingAnalysis = document.getElementById('repeatingAnalysis');
            
            if (!lengthAnalysis || !uppercaseAnalysis || !lowercaseAnalysis || 
                !numbersAnalysis || !symbolsAnalysis || !patternAnalysis || !repeatingAnalysis) {
                return;
            }
            
            // Analyser chaque critère
            const length = password.length;
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumbers = /[0-9]/.test(password);
            const hasSymbols = /[^A-Za-z0-9]/.test(password);
            const hasPatterns = /abc|bcd|cde|def|123|234|345|456|password|azerty|qwerty/i.test(password);
            const hasRepeating = /(.)(\1{2,})/.test(password);
            
            // Mettre à jour les éléments d'analyse
            this.updateAnalysisItem(lengthAnalysis, length >= 12, 
                length >= 12 ? "Longueur suffisante" : "Trop court, utilisez au moins 12 caractères");
            
            this.updateAnalysisItem(uppercaseAnalysis, hasUppercase, 
                hasUppercase ? "Contient des majuscules" : "Pas de majuscules");
            
            this.updateAnalysisItem(lowercaseAnalysis, hasLowercase, 
                hasLowercase ? "Contient des minuscules" : "Pas de minuscules");
            
            this.updateAnalysisItem(numbersAnalysis, hasNumbers, 
                hasNumbers ? "Contient des chiffres" : "Pas de chiffres");
            
            this.updateAnalysisItem(symbolsAnalysis, hasSymbols, 
                hasSymbols ? "Contient des symboles" : "Pas de symboles");
            
            this.updateAnalysisItem(patternAnalysis, !hasPatterns, 
                !hasPatterns ? "Pas de motifs reconnaissables" : "Contient des motifs prévisibles");
            
            this.updateAnalysisItem(repeatingAnalysis, !hasRepeating, 
                !hasRepeating ? "Pas de caractères répétitifs" : "Contient des répétitions");
        } catch (error) {
            console.error('Erreur lors de l\'analyse du mot de passe:', error);
        }
    }
}

// Initialiser le générateur de mot de passe quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    PasswordManager.init();
});

// Exposer les fonctions globalement
window.generatePassword = PasswordManager.generatePassword;
window.copyPassword = PasswordManager.copyPassword;
window.togglePasswordVisibility = PasswordManager.togglePasswordVisibility;
window.saveCurrentPassword = PasswordManager.saveCurrentPassword;
window.clearPasswordHistory = PasswordManager.clearPasswordHistory;
