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
        // ... existing code ...
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
                let cards = []; // Initialisation par défaut
                if (deck.custom) {
                    cards = [...deck.custom];
                } else if (deck.suits && deck.ranks) { // Vérifier que les données du jeu standard existent
                    cards = deck.suits.flatMap(suit =>
                        deck.ranks.map(rank => `${rank}${suit}`)
                    );
                }
                
                // Vérifier que cards est bien un tableau et n'est pas vide avant de mélanger
                if (Array.isArray(cards) && cards.length > 0) {
                    // Utilise Utils.shuffle pour mélanger le tableau
                    Utils.shuffle(cards); // Ajout de Utils.shuffle
                } else {
                    console.warn('Aucune carte définie pour le mélange.');
                    // Optionnel: gérer le cas où aucune carte n'est générée, par exemple, retourner un tableau vide ou une erreur.
                    // Pour l'instant, on continue avec un tableau vide.
                }

                return cards.slice(0, count);
            }
        },
        uuid: {
            // ... existing code ...
        },
        bytes: {
            // ... existing code ...
        }
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.updateUI(); // Met à jour l'UI au démarrage
        this.setupListeners();
        // Pas besoin de générer ici, l'UI est déjà mise à jour avec le dernier résultat sauvegardé
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        // ... existing code ...
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        console.log("Configuration des écouteurs d'événements...");
        
        // Type de générateur
        const typeSelect = document.getElementById('randomType');
        console.log('randomType trouvé:', !!typeSelect);
        typeSelect?.addEventListener('change', (e) => {
            this.updateType(e.target.value);
            console.log('Type changed to:', e.target.value);
        });

        // Options numériques
        const minInput = document.getElementById('randomMin');
        console.log('randomMin trouvé:', !!minInput);
        minInput?.addEventListener('input', (e) => {
            this.updateOption('min', parseFloat(e.target.value));
            console.log('Min changed to:', e.target.value);
        });

        const maxInput = document.getElementById('randomMax');
        console.log('randomMax trouvé:', !!maxInput);
        maxInput?.addEventListener('input', (e) => {
            this.updateOption('max', parseFloat(e.target.value));
            console.log('Max changed to:', e.target.value);
        });

        const countInput = document.getElementById('randomCount');
        console.log('randomCount trouvé:', !!countInput);
        countInput?.addEventListener('input', (e) => {
            // Convertit en entier, assure qu'il est au moins 1 pour éviter les boucles infinies ou erreurs
            const value = Math.max(1, parseInt(e.target.value, 10) || 1);
            this.updateOption('count', value);
            console.log('Count changed to:', value);
        });

        const precisionInput = document.getElementById('randomPrecision');
        console.log('randomPrecision trouvé:', !!precisionInput);
        precisionInput?.addEventListener('input', (e) => {
            this.updateOption('precision', parseInt(e.target.value, 10));
            console.log('Precision changed to:', e.target.value);
        });

        // Options de format
        const uniqueInput = document.getElementById('randomUnique');
        console.log('randomUnique trouvé:', !!uniqueInput);
        uniqueInput?.addEventListener('change', (e) => {
            this.updateOption('unique', e.target.checked);
            console.log('Unique changed to:', e.target.checked);
        });

        const sortedInput = document.getElementById('randomSorted');
        console.log('randomSorted trouvé:', !!sortedInput);
        sortedInput?.addEventListener('change', (e) => {
            this.updateOption('sorted', e.target.checked);
            console.log('Sorted changed to:', e.target.checked);
        });

        const formatSelect = document.getElementById('randomFormat');
        console.log('randomFormat trouvé:', !!formatSelect);
        formatSelect?.addEventListener('change', (e) => {
            this.updateOption('format', e.target.value);
            console.log('Format changed to:', e.target.value);
        });

        const separatorSelect = document.getElementById('randomSeparator');
        console.log('randomSeparator trouvé:', !!separatorSelect);
        separatorSelect?.addEventListener('change', (e) => {
            this.updateOption('separator', e.target.value);
            console.log('Separator changed to:', e.target.value);
        });

        // Options personnalisées
        const customDiceInput = document.getElementById('randomCustomDice');
        console.log('randomCustomDice trouvé:', !!customDiceInput);
        customDiceInput?.addEventListener('input', (e) => {
            this.updateCustomDice(e.target.value);
            console.log('Custom Dice changed to:', e.target.value);
        });

        const customCardsTextarea = document.getElementById('randomCustomCards');
        console.log('randomCustomCards trouvé:', !!customCardsTextarea);
        customCardsTextarea?.addEventListener('input', (e) => {
            this.updateCustomCards(e.target.value);
            console.log('Custom Cards changed to:', e.target.value);
        });

        // Boutons d'action
        const generateButton = document.getElementById('generateRandom');
        console.log('generateRandom trouvé:', !!generateButton);
        generateButton?.addEventListener('click', () => {
            console.log('Bouton Générer cliqué');
            this.generate();
        });

        const copyButton = document.getElementById('copyRandom');
        console.log('copyRandom trouvé:', !!copyButton);
        copyButton?.addEventListener('click', () => {
            console.log('Bouton Copier cliqué');
            this.copy();
        });

        // Raccourcis clavier
        // ... existing code ...
    },

    /**
     * Vérifie si le générateur est visible
     */
    // ... existing code ...

    /**
     * Met à jour le type de générateur
     */
    updateType(type) {
        if (!this.types[type]) return;

        this.state.type = type;
        // Réinitialiser certaines options par défaut pour le nouveau type si nécessaire,
        // ou charger celles sauvegardées si loadState le fait déjà au démarrage.
        // Pour l'instant, on garde les options précédentes si elles sont compatibles.

        this.generate(); // Génère un nouveau résultat pour le nouveau type
        this.updateUI(); // Met à jour toute l'UI pour le nouveau type
        this.saveState();
    },

    /**
     * Met à jour une option
     */
    updateOption(option, value) {
        this.state.options[option] = value;
        this.generate(); // Régénère avec la nouvelle option
        // Pas besoin de updateUI ici, generate appelle déjà updateDisplay et addToHistory
        // et les options spécifiques au type ne changent pas l'affichage des champs,
        // seulement leur valeur. updateUI sera appelé par generate.
        this.saveState();
    },

    /**
     * Met à jour les dés personnalisés
     */
    updateCustomDice(dice) {
        this.state.customDice = dice;
        this.generate(); // Régénère avec la nouvelle expression de dés
         // Pas besoin de updateUI ici, generate appelle déjà updateDisplay et addToHistory
        this.saveState();
    },

    /**
     * Met à jour les cartes personnalisées
     */
    updateCustomCards(cards) {
        this.state.customCards = cards;
        this.generate(); // Régénère avec les nouvelles cartes personnalisées
         // Pas besoin de updateUI ici, generate appelle déjà updateDisplay et addToHistory
        this.saveState();
    },

    /**
     * Génère des nombres aléatoires
     */
    generate() {
        try {
            console.log('Fonction generate appelée');
            console.log('Current state:', this.state);
            console.log('Current options:', this.state.options);
            const type = this.types[this.state.type];
            let result;

            switch (this.state.type) {
                // ... existing code ...
                case 'integer': {
                    // ... existing code ...
                    result = Array.from(
                        // ... existing code ...
                    );
                    this.state.result = result;
                    break;
                }
                case 'float': {
                    // ... existing code ...
                     result = Array.from(
                        // ... existing code ...
                     );
                    this.state.result = result;
                    break;
                }
                 case 'sequence': {
                    // ... existing code ...
                    result = Array.from(
                         // ... existing code ...
                     );
                    this.state.result = result;
                    break;
                }
                case 'dice': {
                    const deck = type.validate(this.state.customDice);
                    // Le compteur est pris des options communes
                    result = type.generate(deck.count, deck.sides, deck.modifier);
                    this.state.result = result.total !== undefined ? result.total : result;
                    break;
                }

                case 'card': {
                    const deck = type.validate(this.state.customCards);
                    // Le compteur est pris des options communes
                    result = type.generate(deck, this.state.options.count);
                    this.state.result = result;
                    break;
                }

                case 'uuid': {
                    // Le compteur est pris des options communes
                    if (this.state.options.count === 1) {
                        result = type.generate();
                    } else {
                        result = Array.from(
                            { length: this.state.options.count },
                            () => type.generate()
                        );
                    }
                    this.state.result = result;
                    break;
                }

                case 'bytes': {
                     // Le compteur est pris des options communes
                    result = type.generate(this.state.options.count);
                    this.state.result = result;
                    break;
                }
            }

            console.log('Résultat avant formatage:', this.state.result);

            // Formate le résultat
            this.state.result = this.formatResult(this.state.result);

            // Met à jour l'affichage du résultat
            this.updateDisplay();

            // Ajoute à l'historique
            this.addToHistory();

             // Met à jour le reste de l'UI si nécessaire (options, etc.)
             this.updateUI();

        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            Utils.showNotification(error.message, 'error');
            this.state.result = `Erreur: ${error.message}`; // Affiche l'erreur dans la sortie
            this.updateDisplay();
             this.updateUI(); // Met à jour l'UI même en cas d'erreur
        }
    },

    /**
     * Formate le résultat selon les options
     */
    formatResult(result) {
        console.log('Appel de formatResult avec:', result);
        // Si le résultat est un tableau, le joindre avec le séparateur
        if (Array.isArray(result)) {
            // Appliquer le tri si l'option sorted est activée
            if (this.state.options.sorted) {
                // Tenter un tri numérique si possible, sinon alphabétique
                if (result.every(item => typeof item === 'number')) {
                    result.sort((a, b) => a - b);
                } else {
                    result.sort();
                }
            }
             // Gérer les différents formats pour les nombres (décimal, binaire, etc.)
             let formattedItems = result.map(item => {
                 if (typeof item === 'number' && this.state.options.format !== 'decimal') {
                     // Convertir selon le format spécifié (exemple simple pour l'instant)
                     // Une logique plus complète serait nécessaire ici pour tous les formats/types
                      switch(this.state.options.format) {
                         case 'binary': return item.toString(2);
                         case 'octal': return item.toString(8);
                         case 'hexadecimal': return item.toString(16).toUpperCase();
                         default: return item.toString();
                     }
                 } else if (typeof item === 'number' && this.state.type === 'float') {
                      // Formater les flottants avec la précision spécifiée
                      return item.toFixed(this.state.options.precision);
                  }
                 return String(item); // Convertir tout autre élément en chaîne
             });

            return formattedItems.join(this.state.options.separator);
        } else if (typeof result === 'number' && this.state.type === 'float') {
             // Formater un flottant unique avec précision
             return result.toFixed(this.state.options.precision);
        } else if (typeof result === 'number' && this.state.options.format !== 'decimal') {
              // Formater un nombre unique selon le format (binaire, octal, hex)
               switch(this.state.options.format) {
                  case 'binary': return result.toString(2);
                  case 'octal': return result.toString(8);
                  case 'hexadecimal': return result.toString(16).toUpperCase();
                  default: return result.toString();
              }
        }
        
        // Pour les types comme UUID ou Bytes, ou d'autres résultats non-tableau/nombre, juste convertir en chaîne
        return String(result);
    },

    /**
     * Copie le résultat
     */
    // ... existing code ...

    /**
     * Ajoute le résultat à l'historique
     */
    // ... existing code ...

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
        // ... existing code ...
    },

    /**
     * Utilise une entrée de l'historique
     */
    useHistoryEntry(index) {
        const entry = this.state.history[index];
        if (!entry) return;

        // Charge l'état depuis l'historique pour pouvoir régénérer ou voir les options
        // Note : cela remplace l'état actuel, y compris les options
        this.state.type = entry.type;
        // Les options spécifiques de l'historique ne sont pas stockées dans l'entrée d'historique actuelle
        // Si tu veux charger les options exactes utilisées pour une entrée d'historique,
        // il faudrait stocker this.state.options (et customDice/Cards) dans chaque entrée.
        // Pour l'instant, on met juste le résultat et on met à jour l'UI pour le type.
        this.state.result = entry.result;

        this.updateUI(); // Met à jour l'UI avec le type et le résultat de l'historique
         // Note: cela ne mettra pas les options précises de l'historique dans les champs,
         // seulement les options actuellement dans this.state pour ce type.

        Utils.showNotification(`Résultat de l'historique chargé`, 'info');
    },

    /**
     * Sauvegarde l'état
     */
    // ... existing code ...

    /**
     * Nettoie les ressources
     */
    // ... existing code ...

    /**
     * Met à jour l'interface utilisateur pour refléter l'état actuel.
     * Cache/affiche les options spécifiques au type et remplit les champs.
     */
    updateUI() {
        // 1. Synchroniser le sélecteur de type
        const typeSelect = document.getElementById('randomType');
        if (typeSelect) {
            typeSelect.value = this.state.type;
        }

        // 2. Gérer l'affichage des groupes d'options
        const optionGroups = document.querySelectorAll('.random-options-group');
        optionGroups.forEach(group => {
            if (group.getAttribute('data-type') === this.state.type) {
                group.classList.add('active');
                group.style.display = 'block'; // Assure qu'il est affiché (utile si tu ne veux pas dépendre uniquement de la classe)
            } else {
                group.classList.remove('active');
                group.style.display = 'none'; // Masque les autres
            }
        });

        // 3. Remplir les champs d'entrée avec les valeurs de l'état
        // Options communes
        const countInput = document.getElementById('randomCount');
        if (countInput) {
             countInput.value = this.state.options.count;
        }

        const uniqueInput = document.getElementById('randomUnique');
        if (uniqueInput) {
            uniqueInput.checked = this.state.options.unique;
        }

        const sortedInput = document.getElementById('randomSorted');
        if (sortedInput) {
            sortedInput.checked = this.state.options.sorted;
        }

        const separatorSelect = document.getElementById('randomSeparator');
         if (separatorSelect) {
             separatorSelect.value = this.state.options.separator;
         }


        // Options spécifiques (les IDs sont présents dans différents groupes, mais on les remplit tous)
        const minInput = document.getElementById('randomMin');
        if (minInput) minInput.value = this.state.options.min;

        const maxInput = document.getElementById('randomMax');
        if (maxInput) maxInput.value = this.state.options.max;

        const precisionInput = document.getElementById('randomPrecision');
        if (precisionInput) precisionInput.value = this.state.options.precision;

        const formatSelect = document.getElementById('randomFormat');
         if (formatSelect) formatSelect.value = this.state.options.format;

        const customDiceInput = document.getElementById('randomCustomDice');
        if (customDiceInput) customDiceInput.value = this.state.customDice;

        const customCardsTextarea = document.getElementById('randomCustomCards');
        if (customCardsTextarea) customCardsTextarea.value = this.state.customCards;


        // 4. Mettre à jour l'affichage du résultat et de l'historique
        this.updateDisplay();
        this.updateHistoryDisplay();
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    RandomManager.init();
});