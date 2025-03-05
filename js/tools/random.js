import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de nombres aléatoires
 */
export const RandomManager = {
    state: {
        type: 'integer', // integer | float | sequence | dice | card | uuid | bytes
        options: {
            min: 1,
            max: 100,
            count: 1,
            precision: 2,
            unique: false,
            sorted: false,
            format: 'decimal', // decimal | binary | octal | hexadecimal
            separator: '\n'
        },
        customDice: '',
        customCards: '',
        result: '',
        history: []
    },

    // Configuration des types de générateurs
    types: {
        integer: {
            name: 'Entier',
            description: 'Nombres entiers dans un intervalle',
            validate: (min, max) => {
                min = Math.floor(min);
                max = Math.floor(max);
                return { min, max };
            },
            generate: (min, max) => {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        },
        float: {
            name: 'Décimal',
            description: 'Nombres décimaux dans un intervalle',
            validate: (min, max) => ({ min, max }),
            generate: (min, max, precision) => {
                const value = Math.random() * (max - min) + min;
                return Number(value.toFixed(precision));
            }
        },
        sequence: {
            name: 'Séquence',
            description: 'Suite de nombres consécutifs mélangés',
            validate: (min, max) => {
                min = Math.floor(min);
                max = Math.floor(max);
                return { min, max };
            },
            generate: (min, max) => {
                const sequence = Array.from(
                    { length: max - min + 1 },
                    (_, i) => min + i
                );
                return sequence.sort(() => Math.random() - 0.5);
            }
        },
        dice: {
            name: 'Dés',
            description: 'Lancers de dés (ex: 2d6+3)',
            validate: (expression) => {
                const match = expression.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
                if (!match) throw new Error('Format invalide (ex: 2d6+3)');
                
                const [, count = '1', sides, modifier = '+0'] = match;
                return {
                    count: parseInt(count, 10),
                    sides: parseInt(sides, 10),
                    modifier: parseInt(modifier, 10)
                };
            },
            generate: (count, sides, modifier) => {
                const rolls = Array.from(
                    { length: count },
                    () => Math.floor(Math.random() * sides) + 1
                );
                return {
                    rolls,
                    total: rolls.reduce((a, b) => a + b, 0) + modifier
                };
            }
        },
        card: {
            name: 'Cartes',
            description: 'Tirage de cartes',
            validate: (deck) => {
                if (!deck) {
                    return {
                        suits: ['♠', '♥', '♦', '♣'],
                        ranks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
                    };
                }
                return { custom: deck.split(/[,\n]/).map(c => c.trim()).filter(Boolean) };
            },
            generate: (deck, count) => {
                let cards;
                if (deck.custom) {
                    cards = [...deck.custom];
                } else {
                    cards = deck.suits.flatMap(suit =>
                        deck.ranks.map(rank => `${rank}${suit}`)
                    );
                }
                return cards.sort(() => Math.random() - 0.5).slice(0, count);
            }
        },
        uuid: {
            name: 'UUID',
            description: 'Identifiants uniques universels',
            validate: () => ({}),
            generate: () => {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        },
        bytes: {
            name: 'Octets',
            description: 'Séquences d\'octets aléatoires',
            validate: (count) => ({ count: Math.min(1024, Math.max(1, count)) }),
            generate: (count) => {
                return Array.from(
                    { length: count },
                    () => Math.floor(Math.random() * 256)
                );
            }
        }
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
        const savedState = Utils.loadFromStorage('randomState', {
            type: this.state.type,
            options: this.state.options,
            customDice: this.state.customDice,
            customCards: this.state.customCards,
            history: []
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Type de générateur
        document.getElementById('randomType')?.addEventListener('change', (e) => {
            this.updateType(e.target.value);
        });

        // Options numériques
        document.getElementById('randomMin')?.addEventListener('input', (e) => {
            this.updateOption('min', parseFloat(e.target.value));
        });

        document.getElementById('randomMax')?.addEventListener('input', (e) => {
            this.updateOption('max', parseFloat(e.target.value));
        });

        document.getElementById('randomCount')?.addEventListener('input', (e) => {
            this.updateOption('count', parseInt(e.target.value, 10));
        });

        document.getElementById('randomPrecision')?.addEventListener('input', (e) => {
            this.updateOption('precision', parseInt(e.target.value, 10));
        });

        // Options de format
        document.getElementById('randomUnique')?.addEventListener('change', (e) => {
            this.updateOption('unique', e.target.checked);
        });

        document.getElementById('randomSorted')?.addEventListener('change', (e) => {
            this.updateOption('sorted', e.target.checked);
        });

        document.getElementById('randomFormat')?.addEventListener('change', (e) => {
            this.updateOption('format', e.target.value);
        });

        document.getElementById('randomSeparator')?.addEventListener('change', (e) => {
            this.updateOption('separator', e.target.value);
        });

        // Options personnalisées
        document.getElementById('randomCustomDice')?.addEventListener('input', (e) => {
            this.updateCustomDice(e.target.value);
        });

        document.getElementById('randomCustomCards')?.addEventListener('input', (e) => {
            this.updateCustomCards(e.target.value);
        });

        // Boutons d'action
        document.getElementById('generateRandom')?.addEventListener('click', () => {
            this.generate();
        });

        document.getElementById('copyRandom')?.addEventListener('click', () => {
            this.copy();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isRandomGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generate();
            } else if (e.ctrlKey && e.key === 'c' && document.activeElement?.id !== 'randomOutput') {
                e.preventDefault();
                this.copy();
            }
        });
    },

    /**
     * Vérifie si le générateur est visible
     */
    isRandomGeneratorVisible() {
        const generator = document.getElementById('randomTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour le type de générateur
     */
    updateType(type) {
        if (!this.types[type]) return;

        this.state.type = type;
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
     * Met à jour les dés personnalisés
     */
    updateCustomDice(dice) {
        this.state.customDice = dice;
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour les cartes personnalisées
     */
    updateCustomCards(cards) {
        this.state.customCards = cards;
        this.generate();
        this.saveState();
    },

    /**
     * Génère des nombres aléatoires
     */
    generate() {
        try {
            const type = this.types[this.state.type];
            let result;

            switch (this.state.type) {
                case 'integer':
                case 'float': {
                    const { min, max } = type.validate(
                        this.state.options.min,
                        this.state.options.max
                    );

                    if (this.state.options.count === 1) {
                        result = type.generate(min, max, this.state.options.precision);
                    } else {
                        result = Array.from(
                            { length: this.state.options.count },
                            () => type.generate(min, max, this.state.options.precision)
                        );

                        if (this.state.options.unique) {
                            result = [...new Set(result)];
                        }

                        if (this.state.options.sorted) {
                            result.sort((a, b) => a - b);
                        }
                    }
                    break;
                }

                case 'sequence': {
                    const { min, max } = type.validate(
                        this.state.options.min,
                        this.state.options.max
                    );
                    result = type.generate(min, max);
                    break;
                }

                case 'dice': {
                    const params = type.validate(this.state.customDice || '1d6');
                    result = type.generate(
                        params.count,
                        params.sides,
                        params.modifier
                    );
                    break;
                }

                case 'card': {
                    const deck = type.validate(this.state.customCards);
                    result = type.generate(deck, this.state.options.count);
                    break;
                }

                case 'uuid': {
                    if (this.state.options.count === 1) {
                        result = type.generate();
                    } else {
                        result = Array.from(
                            { length: this.state.options.count },
                            () => type.generate()
                        );
                    }
                    break;
                }

                case 'bytes': {
                    const { count } = type.validate(this.state.options.count);
                    result = type.generate(count);
                    break;
                }
            }

            // Formate le résultat
            this.state.result = this.formatResult(result);

            // Met à jour l'affichage
            this.updateDisplay();

            // Ajoute à l'historique
            this.addToHistory();
        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            Utils.showNotification(error.message, 'error');
        }
    },

    /**
     * Formate le résultat selon les options
     */
    formatResult(result) {
        if (result === undefined || result === null) return '';

        if (Array.isArray(result)) {
            if (this.state.type === 'bytes') {
                switch (this.state.options.format) {
                    case 'binary':
                        return result.map(n => n.toString(2).padStart(8, '0')).join(this.state.options.separator);
                    case 'octal':
                        return result.map(n => n.toString(8).padStart(3, '0')).join(this.state.options.separator);
                    case 'hexadecimal':
                        return result.map(n => n.toString(16).padStart(2, '0')).join(this.state.options.separator);
                    default:
                        return result.join(this.state.options.separator);
                }
            }
            return result.join(this.state.options.separator);
        }

        if (typeof result === 'number') {
            switch (this.state.options.format) {
                case 'binary':
                    return result.toString(2);
                case 'octal':
                    return result.toString(8);
                case 'hexadecimal':
                    return result.toString(16);
                default:
                    return result.toString();
            }
        }

        if (typeof result === 'object' && result.rolls) {
            return `[${result.rolls.join(', ')}] = ${result.total}`;
        }

        return result.toString();
    },

    /**
     * Copie le résultat
     */
    copy() {
        if (!this.state.result) return;

        Utils.copyToClipboard(this.state.result)
            .then(() => Utils.showNotification('Résultat copié !', 'success'))
            .catch(() => Utils.showNotification('Erreur lors de la copie', 'error'));
    },

    /**
     * Ajoute le résultat à l'historique
     */
    addToHistory() {
        if (!this.state.result) return;

        this.state.history.unshift({
            type: this.state.type,
            result: this.state.result,
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
        const output = document.getElementById('randomOutput');
        if (output) {
            output.value = this.state.result;
        }
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('randomHistory');
        if (!container) return;

        container.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="randomManager.useHistoryEntry(${this.state.history.indexOf(entry)})">
                    <div class="history-result">
                        ${entry.result}
                    </div>
                    <div class="history-meta">
                        <span class="history-type">
                            ${this.types[entry.type].name}
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

        this.state.result = entry.result;
        this.updateDisplay();
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('randomState', {
            type: this.state.type,
            options: this.state.options,
            customDice: this.state.customDice,
            customCards: this.state.customCards,
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