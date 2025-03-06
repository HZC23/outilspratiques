import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de mots de passe
 */
export const PasswordManager = {
    state: {
        length: 16,
        options: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            similar: false, // Caractères similaires (0O, 1l, etc.)
            ambiguous: false, // Caractères ambigus ({}, [], (), /, \, etc.)
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1,
            minLowercase: 1
        },
        customSymbols: '!@#$%^&*',
        excludeChars: '',
        password: '',
        strength: 0,
        history: []
    },

    // Ensembles de caractères
    charSets: {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*',
        similar: '0O1lI',
        ambiguous: '{}[]()/\\\'"`~,;:.<>',
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.generate();
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('passwordState', {
            length: this.state.length,
            options: this.state.options,
            customSymbols: this.state.customSymbols,
            excludeChars: this.state.excludeChars,
            history: []
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Longueur
        document.getElementById('passwordLength')?.addEventListener('input', (e) => {
            this.updateLength(parseInt(e.target.value, 10));
        });

        // Options
        document.getElementById('passwordUppercase')?.addEventListener('change', (e) => {
            this.updateOption('uppercase', e.target.checked);
        });

        document.getElementById('passwordLowercase')?.addEventListener('change', (e) => {
            this.updateOption('lowercase', e.target.checked);
        });

        document.getElementById('passwordNumbers')?.addEventListener('change', (e) => {
            this.updateOption('numbers', e.target.checked);
        });

        document.getElementById('passwordSymbols')?.addEventListener('change', (e) => {
            this.updateOption('symbols', e.target.checked);
        });

        document.getElementById('passwordSimilar')?.addEventListener('change', (e) => {
            this.updateOption('similar', e.target.checked);
        });

        document.getElementById('passwordAmbiguous')?.addEventListener('change', (e) => {
            this.updateOption('ambiguous', e.target.checked);
        });

        // Minimums
        document.getElementById('passwordMinNumbers')?.addEventListener('input', (e) => {
            this.updateOption('minNumbers', parseInt(e.target.value, 10));
        });

        document.getElementById('passwordMinSymbols')?.addEventListener('input', (e) => {
            this.updateOption('minSymbols', parseInt(e.target.value, 10));
        });

        document.getElementById('passwordMinUppercase')?.addEventListener('input', (e) => {
            this.updateOption('minUppercase', parseInt(e.target.value, 10));
        });

        document.getElementById('passwordMinLowercase')?.addEventListener('input', (e) => {
            this.updateOption('minLowercase', parseInt(e.target.value, 10));
        });

        // Symboles personnalisés
        document.getElementById('passwordCustomSymbols')?.addEventListener('input', (e) => {
            this.updateCustomSymbols(e.target.value);
        });

        // Caractères exclus
        document.getElementById('passwordExcludeChars')?.addEventListener('input', (e) => {
            this.updateExcludeChars(e.target.value);
        });

        // Boutons d'action
        document.getElementById('generatePassword')?.addEventListener('click', () => {
            this.generate();
        });

        document.getElementById('copyPassword')?.addEventListener('click', () => {
            this.copy();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isPasswordGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generate();
            } else if (e.ctrlKey && e.key === 'c' && document.activeElement?.id !== 'passwordOutput') {
                e.preventDefault();
                this.copy();
            }
        });
    },

    /**
     * Vérifie si le générateur est visible
     */
    isPasswordGeneratorVisible() {
        const generator = document.getElementById('passwordTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour la longueur
     */
    updateLength(length) {
        this.state.length = Math.max(1, Math.min(128, length));
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour une option
     */
    updateOption(option, value) {
        this.state.options[option] = value;
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour les symboles personnalisés
     */
    updateCustomSymbols(symbols) {
        this.state.customSymbols = symbols;
        this.charSets.symbols = symbols || '!@#$%^&*';
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour les caractères exclus
     */
    updateExcludeChars(chars) {
        this.state.excludeChars = chars;
        this.generate();
        this.saveState();
    },

    /**
     * Génère un mot de passe
     */
    generate() {
        // Vérifie les options activées
        const hasNoOptions = !Object.values(this.state.options).slice(0, 4).some(Boolean);
        if (hasNoOptions) {
            this.state.options.lowercase = true;
        }

        // Prépare les ensembles de caractères
        let chars = '';
        let required = '';

        if (this.state.options.uppercase) {
            chars += this.charSets.uppercase;
            required += this.getRandomChars(this.charSets.uppercase, this.state.options.minUppercase);
        }

        if (this.state.options.lowercase) {
            chars += this.charSets.lowercase;
            required += this.getRandomChars(this.charSets.lowercase, this.state.options.minLowercase);
        }

        if (this.state.options.numbers) {
            chars += this.charSets.numbers;
            required += this.getRandomChars(this.charSets.numbers, this.state.options.minNumbers);
        }

        if (this.state.options.symbols) {
            chars += this.charSets.symbols;
            required += this.getRandomChars(this.charSets.symbols, this.state.options.minSymbols);
        }

        // Retire les caractères similaires si l'option est désactivée
        if (!this.state.options.similar) {
            this.charSets.similar.split('').forEach(char => {
                chars = chars.replace(new RegExp(char, 'g'), '');
            });
        }

        // Retire les caractères ambigus si l'option est désactivée
        if (!this.state.options.ambiguous) {
            this.charSets.ambiguous.split('').forEach(char => {
                chars = chars.replace(new RegExp('\\' + char, 'g'), '');
            });
        }

        // Retire les caractères exclus
        this.state.excludeChars.split('').forEach(char => {
            chars = chars.replace(new RegExp('\\' + char, 'g'), '');
            required = required.replace(new RegExp('\\' + char, 'g'), '');
        });

        // Génère le mot de passe
        let password = required;
        const remainingLength = this.state.length - required.length;

        for (let i = 0; i < remainingLength; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Mélange le mot de passe
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        // Met à jour l'état
        this.state.password = password;
        this.state.strength = this.calculateStrength(password);

        // Met à jour l'affichage
        this.updateDisplay();

        // Ajoute à l'historique
        this.addToHistory();
    },

    /**
     * Obtient des caractères aléatoires d'un ensemble
     */
    getRandomChars(charSet, count) {
        let result = '';
        for (let i = 0; i < count; i++) {
            result += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        return result;
    },

    /**
     * Calcule la force du mot de passe
     */
    calculateStrength(password) {
        let strength = 0;

        // Longueur
        strength += Math.min(8, password.length) * 10;
        if (password.length > 8) {
            strength += (password.length - 8) * 5;
        }

        // Complexité
        if (/[A-Z]/.test(password)) strength += 20;
        if (/[a-z]/.test(password)) strength += 20;
        if (/[0-9]/.test(password)) strength += 20;
        if (/[^A-Za-z0-9]/.test(password)) strength += 30;

        // Variété
        const uniqueChars = new Set(password).size;
        strength += uniqueChars * 2;

        // Motifs
        if (/(.)\1\1/.test(password)) strength -= 30;
        if (/^[A-Z]+$|^[a-z]+$|^[0-9]+$/.test(password)) strength -= 30;
        if (/^[A-Za-z]+$|^[A-Z0-9]+$|^[a-z0-9]+$/.test(password)) strength -= 20;

        return Math.max(0, Math.min(100, strength));
    },

    /**
     * Copie le mot de passe
     */
    copy() {
        if (!this.state.password) return;

        Utils.copyToClipboard(this.state.password)
            .then(() => Utils.showNotification('Mot de passe copié !', 'success'))
            .catch(() => Utils.showNotification('Erreur lors de la copie', 'error'));
    },

    /**
     * Ajoute le mot de passe à l'historique
     */
    addToHistory() {
        if (!this.state.password) return;

        this.state.history.unshift({
            password: this.state.password,
            strength: this.state.strength,
            timestamp: new Date().toISOString()
        });

        // Limite la taille de l'historique
        if (this.state.history.length > 10) {
            this.state.history.pop();
        }

        this.updateHistoryDisplay();
        this.saveState();
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay() {
        // Mot de passe
        const output = document.getElementById('passwordOutput');
        if (output) {
            output.value = this.state.password;
        }

        // Force
        const strength = document.getElementById('passwordStrength');
        if (strength) {
            const level = this.state.strength < 40 ? 'faible' :
                         this.state.strength < 70 ? 'moyen' :
                         'fort';
            
            strength.className = `strength-${level}`;
            strength.textContent = `${this.state.strength}% - ${level}`;
        }
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('passwordHistory');
        if (!container) return;

        container.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="passwordManager.useHistoryEntry(${this.state.history.indexOf(entry)})">
                    <div class="history-password">
                        ${entry.password}
                    </div>
                    <div class="history-meta">
                        <span class="history-strength strength-${entry.strength < 40 ? 'faible' : entry.strength < 70 ? 'moyen' : 'fort'}">
                            ${entry.strength}%
                        </span>
                        <span class="history-date">
                            ${new Date(entry.timestamp).toLocaleString('fr-FR')}
                        </span>
                    </div>
                </div>
            `)
            .join('');
    },

    /**
     * Utilise une entrée de l'historique
     */
    useHistoryEntry(index) {
        const entry = this.state.history[index];
        if (!entry) return;

        this.state.password = entry.password;
        this.state.strength = entry.strength;

        this.updateDisplay();
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('passwordState', {
            length: this.state.length,
            options: this.state.options,
            customSymbols: this.state.customSymbols,
            excludeChars: this.state.excludeChars,
            history: this.state.history
        });
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveState();
    }
}; 