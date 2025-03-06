import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de code-barres
 */
export const BarcodeManager = {
    state: {
        text: '',
        type: 'code128', // code128 | ean13 | ean8 | upc | code39 | itf14 | datamatrix
        options: {
            width: 2,
            height: 100,
            displayValue: true,
            font: 'monospace',
            textAlign: 'center',
            textPosition: 'bottom',
            textMargin: 2,
            fontSize: 20,
            background: '#ffffff',
            lineColor: '#000000'
        },
        history: []
    },

    // Configuration des types de code-barres
    types: {
        code128: {
            name: 'Code 128',
            description: 'Code-barres alphanumérique haute densité',
            placeholder: 'ABC-123456',
            validate: text => text.length > 0,
            format: text => text
        },
        ean13: {
            name: 'EAN-13',
            description: 'Code-barres produit international (13 chiffres)',
            placeholder: '5901234123457',
            validate: text => /^\d{12}$/.test(text),
            format: text => {
                // Calcule le chiffre de contrôle
                let sum = 0;
                for (let i = 0; i < 12; i++) {
                    sum += parseInt(text[i]) * (i % 2 === 0 ? 1 : 3);
                }
                const check = (10 - (sum % 10)) % 10;
                return text + check;
            }
        },
        ean8: {
            name: 'EAN-8',
            description: 'Code-barres produit court (8 chiffres)',
            placeholder: '96385074',
            validate: text => /^\d{7}$/.test(text),
            format: text => {
                // Calcule le chiffre de contrôle
                let sum = 0;
                for (let i = 0; i < 7; i++) {
                    sum += parseInt(text[i]) * (i % 2 === 0 ? 3 : 1);
                }
                const check = (10 - (sum % 10)) % 10;
                return text + check;
            }
        },
        upc: {
            name: 'UPC-A',
            description: 'Code-barres produit américain (12 chiffres)',
            placeholder: '042100005264',
            validate: text => /^\d{11}$/.test(text),
            format: text => {
                // Calcule le chiffre de contrôle
                let sum = 0;
                for (let i = 0; i < 11; i++) {
                    sum += parseInt(text[i]) * (i % 2 === 0 ? 3 : 1);
                }
                const check = (10 - (sum % 10)) % 10;
                return text + check;
            }
        },
        code39: {
            name: 'Code 39',
            description: 'Code-barres alphanumérique standard',
            placeholder: 'CODE-39',
            validate: text => /^[A-Z0-9\-\.\$\/\+\%\s]+$/.test(text),
            format: text => text.toUpperCase()
        },
        itf14: {
            name: 'ITF-14',
            description: 'Code-barres logistique (14 chiffres)',
            placeholder: '15400141288763',
            validate: text => /^\d{13}$/.test(text),
            format: text => {
                // Calcule le chiffre de contrôle
                let sum = 0;
                for (let i = 0; i < 13; i++) {
                    sum += parseInt(text[i]) * (i % 2 === 0 ? 3 : 1);
                }
                const check = (10 - (sum % 10)) % 10;
                return text + check;
            }
        },
        datamatrix: {
            name: 'Data Matrix',
            description: 'Code-barres 2D haute densité',
            placeholder: 'Data Matrix Code',
            validate: text => text.length > 0,
            format: text => text
        }
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.loadBarcodeLibrary().then(() => {
            this.updateDisplay();
        });
    },

    /**
     * Charge la bibliothèque de code-barres
     */
    async loadBarcodeLibrary() {
        return new Promise((resolve, reject) => {
            if (window.JsBarcode) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('barcodeState', {
            type: 'code128',
            options: this.state.options,
            history: []
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Type de code-barres
        document.getElementById('barcodeType')?.addEventListener('change', (e) => {
            this.updateType(e.target.value);
        });

        // Texte du code-barres
        document.getElementById('barcodeText')?.addEventListener('input', (e) => {
            this.updateText(e.target.value);
        });

        // Options d'affichage
        document.getElementById('barcodeWidth')?.addEventListener('input', (e) => {
            this.updateOption('width', parseInt(e.target.value, 10));
        });

        document.getElementById('barcodeHeight')?.addEventListener('input', (e) => {
            this.updateOption('height', parseInt(e.target.value, 10));
        });

        document.getElementById('barcodeDisplayValue')?.addEventListener('change', (e) => {
            this.updateOption('displayValue', e.target.checked);
        });

        document.getElementById('barcodeTextPosition')?.addEventListener('change', (e) => {
            this.updateOption('textPosition', e.target.value);
        });

        document.getElementById('barcodeFontSize')?.addEventListener('input', (e) => {
            this.updateOption('fontSize', parseInt(e.target.value, 10));
        });

        document.getElementById('barcodeBackground')?.addEventListener('input', (e) => {
            this.updateOption('background', e.target.value);
        });

        document.getElementById('barcodeLineColor')?.addEventListener('input', (e) => {
            this.updateOption('lineColor', e.target.value);
        });

        // Boutons d'action
        document.getElementById('generateBarcode')?.addEventListener('click', () => {
            this.generate();
        });

        document.getElementById('downloadBarcode')?.addEventListener('click', () => {
            this.download();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isBarcodeGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generate();
            }
        });
    },

    /**
     * Vérifie si le générateur est visible
     */
    isBarcodeGeneratorVisible() {
        const generator = document.getElementById('barcodeTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour le type de code-barres
     */
    updateType(type) {
        if (!this.types[type]) return;

        this.state.type = type;
        this.updatePlaceholder();
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour le texte du code-barres
     */
    updateText(text) {
        this.state.text = text;
        this.generate();
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
     * Met à jour le placeholder
     */
    updatePlaceholder() {
        const input = document.getElementById('barcodeText');
        if (input) {
            input.placeholder = this.types[this.state.type].placeholder;
        }
    },

    /**
     * Génère le code-barres
     */
    generate() {
        if (!this.state.text) return;

        // Valide le texte
        const type = this.types[this.state.type];
        if (!type.validate(this.state.text)) {
            Utils.showNotification('Format invalide pour ce type de code-barres', 'error');
            return;
        }

        // Formate le texte
        const formattedText = type.format(this.state.text);

        // Génère le code-barres
        try {
            const canvas = document.getElementById('barcodeOutput');
            if (!canvas) return;

            if (this.state.type === 'datamatrix') {
                // TODO: Implémenter Data Matrix
                Utils.showNotification('Data Matrix pas encore supporté', 'warning');
                return;
            }

            JsBarcode(canvas, formattedText, {
                ...this.state.options,
                format: this.state.type
            });

            // Ajoute à l'historique
            this.addToHistory(formattedText);
        } catch (error) {
            Utils.showNotification('Erreur lors de la génération du code-barres', 'error');
        }
    },

    /**
     * Télécharge le code-barres
     */
    download() {
        const canvas = document.getElementById('barcodeOutput');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `barcode-${this.state.type}-${this.state.text}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    /**
     * Ajoute une entrée à l'historique
     */
    addToHistory(text) {
        this.state.history.unshift({
            text,
            type: this.state.type,
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
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('barcodeHistory');
        if (!container) return;

        container.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="barcodeManager.useHistoryEntry('${entry.text}', '${entry.type}')">
                    <div class="history-text">${entry.text}</div>
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
    useHistoryEntry(text, type) {
        this.state.text = text;
        this.state.type = type;
        
        // Met à jour les champs
        const textInput = document.getElementById('barcodeText');
        const typeSelect = document.getElementById('barcodeType');
        
        if (textInput) textInput.value = text;
        if (typeSelect) typeSelect.value = type;

        this.generate();
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('barcodeState', {
            type: this.state.type,
            options: this.state.options,
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