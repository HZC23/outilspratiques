import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de texte
 */
export const TextManager = {
    state: {
        text: '',
        type: 'case', // case | format | count | convert | encode | generate
        options: {
            case: 'lower', // lower | upper | title | sentence | camel | pascal | snake | kebab | constant
            format: 'trim', // trim | clean | wrap | indent | align | justify
            lineWidth: 80,
            indentSize: 4,
            indentChar: ' ',
            encoding: 'base64', // base64 | url | html | unicode | morse | binary
            separator: '\n'
        },
        result: '',
        history: []
    },

    // Configuration des types de transformations
    types: {
        case: {
            name: 'Casse',
            description: 'Transforme la casse du texte',
            operations: {
                lower: {
                    name: 'Minuscules',
                    transform: text => text.toLowerCase()
                },
                upper: {
                    name: 'Majuscules',
                    transform: text => text.toUpperCase()
                },
                title: {
                    name: 'Titre',
                    transform: text => text.replace(
                        /\w\S*/g,
                        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                    )
                },
                sentence: {
                    name: 'Phrase',
                    transform: text => text.toLowerCase().replace(
                        /(^\w|\.\s+\w)/g,
                        letter => letter.toUpperCase()
                    )
                },
                camel: {
                    name: 'Camel Case',
                    transform: text => text.toLowerCase()
                        .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
                },
                pascal: {
                    name: 'Pascal Case',
                    transform: text => text.toLowerCase()
                        .replace(/(^|[^a-zA-Z0-9]+)(.)/g, (_, __, c) => c.toUpperCase())
                },
                snake: {
                    name: 'Snake Case',
                    transform: text => text.toLowerCase()
                        .replace(/[^a-zA-Z0-9]+/g, '_')
                        .replace(/^_|_$/g, '')
                },
                kebab: {
                    name: 'Kebab Case',
                    transform: text => text.toLowerCase()
                        .replace(/[^a-zA-Z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')
                },
                constant: {
                    name: 'Constante',
                    transform: text => text.toUpperCase()
                        .replace(/[^A-Z0-9]+/g, '_')
                        .replace(/^_|_$/g, '')
                }
            }
        },
        format: {
            name: 'Format',
            description: 'Formate et aligne le texte',
            operations: {
                trim: {
                    name: 'Nettoyer',
                    transform: text => text.trim()
                        .replace(/\s+/g, ' ')
                },
                clean: {
                    name: 'Normaliser',
                    transform: text => text
                        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Caractères invisibles
                        .replace(/['']/g, "'") // Apostrophes
                        .replace(/[""]/g, '"') // Guillemets
                        .replace(/…/g, '...') // Points de suspension
                        .replace(/[—–]/g, '-') // Tirets
                        .normalize('NFKC')
                },
                wrap: {
                    name: 'Retour à la ligne',
                    transform: (text, width) => {
                        const words = text.split(/\s+/);
                        const lines = [];
                        let line = [];
                        let lineLength = 0;

                        words.forEach(word => {
                            if (lineLength + word.length + 1 <= width) {
                                line.push(word);
                                lineLength += word.length + 1;
                            } else {
                                lines.push(line.join(' '));
                                line = [word];
                                lineLength = word.length + 1;
                            }
                        });

                        if (line.length > 0) {
                            lines.push(line.join(' '));
                        }

                        return lines.join('\n');
                    }
                },
                indent: {
                    name: 'Indentation',
                    transform: (text, size, char) => {
                        const indent = char.repeat(size);
                        return text.split('\n')
                            .map(line => indent + line)
                            .join('\n');
                    }
                },
                align: {
                    name: 'Alignement',
                    transform: (text, width, align = 'left') => {
                        return text.split('\n').map(line => {
                            line = line.trim();
                            const padding = width - line.length;
                            if (padding <= 0) return line;

                            switch (align) {
                                case 'right':
                                    return ' '.repeat(padding) + line;
                                case 'center':
                                    const left = Math.floor(padding / 2);
                                    return ' '.repeat(left) + line + ' '.repeat(padding - left);
                                default:
                                    return line + ' '.repeat(padding);
                            }
                        }).join('\n');
                    }
                },
                justify: {
                    name: 'Justification',
                    transform: (text, width) => {
                        return text.split('\n').map(line => {
                            const words = line.trim().split(/\s+/);
                            if (words.length <= 1) return line;

                            const textLength = words.join('').length;
                            const spaces = width - textLength;
                            const gaps = words.length - 1;
                            const spacePerGap = Math.floor(spaces / gaps);
                            const extraSpaces = spaces % gaps;

                            return words.map((word, i) => {
                                if (i === words.length - 1) return word;
                                const extra = i < extraSpaces ? 1 : 0;
                                return word + ' '.repeat(spacePerGap + extra);
                            }).join('');
                        }).join('\n');
                    }
                }
            }
        },
        count: {
            name: 'Statistiques',
            description: 'Analyse le texte',
            operations: {
                all: {
                    name: 'Tout',
                    analyze: text => {
                        const chars = text.length;
                        const letters = (text.match(/[a-zA-Z]/g) || []).length;
                        const words = text.trim().split(/\s+/).length;
                        const sentences = (text.match(/[.!?]+/g) || []).length;
                        const paragraphs = text.split(/\n\s*\n/).length;
                        const lines = text.split('\n').length;
                        
                        return {
                            chars,
                            letters,
                            words,
                            sentences,
                            paragraphs,
                            lines
                        };
                    }
                },
                frequency: {
                    name: 'Fréquence',
                    analyze: text => {
                        const freq = {};
                        text.toLowerCase().split('').forEach(char => {
                            if (char.match(/[a-z]/)) {
                                freq[char] = (freq[char] || 0) + 1;
                            }
                        });
                        return Object.entries(freq)
                            .sort((a, b) => b[1] - a[1])
                            .reduce((obj, [char, count]) => {
                                obj[char] = count;
                                return obj;
                            }, {});
                    }
                }
            }
        },
        convert: {
            name: 'Conversion',
            description: 'Convertit le format du texte',
            operations: {
                markdown: {
                    name: 'Markdown → HTML',
                    transform: text => {
                        // Implémentation basique
                        return text
                            .replace(/#{6}\s+([^\n]+)/g, '<h6>$1</h6>')
                            .replace(/#{5}\s+([^\n]+)/g, '<h5>$1</h5>')
                            .replace(/#{4}\s+([^\n]+)/g, '<h4>$1</h4>')
                            .replace(/#{3}\s+([^\n]+)/g, '<h3>$1</h3>')
                            .replace(/#{2}\s+([^\n]+)/g, '<h2>$1</h2>')
                            .replace(/#{1}\s+([^\n]+)/g, '<h1>$1</h1>')
                            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                            .replace(/`([^`]+)`/g, '<code>$1</code>')
                            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
                            .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
                            .replace(/^-\s+([^\n]+)/gm, '<li>$1</li>')
                            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                            .replace(/\n\n([^\n]+)/g, '<p>$1</p>');
                    }
                },
                html: {
                    name: 'HTML → Texte',
                    transform: text => {
                        const div = document.createElement('div');
                        div.innerHTML = text;
                        return div.textContent || div.innerText || '';
                    }
                },
                csv: {
                    name: 'CSV → JSON',
                    transform: (text, separator = ',') => {
                        const lines = text.split('\n').map(line => 
                            line.split(separator).map(cell => 
                                cell.trim().replace(/^["']|["']$/g, '')
                            )
                        );
                        const headers = lines[0];
                        const rows = lines.slice(1);
                        return JSON.stringify(
                            rows.map(row => 
                                Object.fromEntries(
                                    headers.map((header, i) => [header, row[i]])
                                )
                            ),
                            null,
                            2
                        );
                    }
                },
                json: {
                    name: 'JSON → CSV',
                    transform: (text, separator = ',') => {
                        const data = JSON.parse(text);
                        if (!Array.isArray(data)) return '';
                        
                        const headers = Array.from(
                            new Set(
                                data.flatMap(obj => Object.keys(obj))
                            )
                        );

                        const rows = data.map(obj =>
                            headers.map(header => {
                                const cell = obj[header] || '';
                                return /[",\n]/.test(cell)
                                    ? `"${cell.replace(/"/g, '""')}"`
                                    : cell;
                            })
                        );

                        return [headers, ...rows]
                            .map(row => row.join(separator))
                            .join('\n');
                    }
                }
            }
        },
        encode: {
            name: 'Encodage',
            description: 'Encode ou décode le texte',
            operations: {
                base64: {
                    name: 'Base64',
                    encode: text => btoa(unescape(encodeURIComponent(text))),
                    decode: text => decodeURIComponent(escape(atob(text)))
                },
                url: {
                    name: 'URL',
                    encode: text => encodeURIComponent(text),
                    decode: text => decodeURIComponent(text)
                },
                html: {
                    name: 'HTML',
                    encode: text => text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;'),
                    decode: text => text
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#039;/g, "'")
                },
                unicode: {
                    name: 'Unicode',
                    encode: text => text.split('')
                        .map(char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
                        .join(''),
                    decode: text => text.replace(/\\u([a-fA-F0-9]{4})/g,
                        (_, hex) => String.fromCharCode(parseInt(hex, 16))
                    )
                },
                morse: {
                    name: 'Morse',
                    encode: text => {
                        const morse = {
                            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
                            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
                            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
                            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
                            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
                            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
                            '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
                            '!': '-.-.--', ' ': ' '
                        };
                        return text.toUpperCase().split('')
                            .map(char => morse[char] || char)
                            .join(' ');
                    },
                    decode: text => {
                        const morse = {
                            '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
                            '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
                            '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
                            '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
                            '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
                            '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
                            '---..': '8', '----.': '9', '.-.-.-': '.', '--..--': ',', '..--..': '?',
                            '-.-.--': '!', ' ': ' '
                        };
                        return text.split(' ')
                            .map(char => morse[char] || char)
                            .join('');
                    }
                },
                binary: {
                    name: 'Binaire',
                    encode: text => text.split('')
                        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
                        .join(' '),
                    decode: text => text.split(' ')
                        .map(bin => String.fromCharCode(parseInt(bin, 2)))
                        .join('')
                }
            }
        },
        generate: {
            name: 'Génération',
            description: 'Génère du texte',
            operations: {
                repeat: {
                    name: 'Répétition',
                    generate: (text, count, separator = '\n') => {
                        return Array(count).fill(text).join(separator);
                    }
                },
                sequence: {
                    name: 'Séquence',
                    generate: (start, count, prefix = '', suffix = '') => {
                        return Array.from(
                            { length: count },
                            (_, i) => `${prefix}${start + i}${suffix}`
                        ).join('\n');
                    }
                },
                pattern: {
                    name: 'Motif',
                    generate: (pattern, count) => {
                        return Array.from(
                            { length: count },
                            () => pattern.replace(/\{(\d+)\}/g, (_, n) => {
                                const length = parseInt(n, 10);
                                return Math.random().toString(36).substr(2, length);
                            })
                        ).join('\n');
                    }
                }
            }
        }
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.transform();
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('textState', {
            text: this.state.text,
            type: this.state.type,
            options: this.state.options,
            history: []
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Texte
        document.getElementById('textInput')?.addEventListener('input', (e) => {
            this.updateText(e.target.value);
        });

        // Type de transformation
        document.getElementById('textType')?.addEventListener('change', (e) => {
            this.updateType(e.target.value);
        });

        // Options de casse
        document.getElementById('textCase')?.addEventListener('change', (e) => {
            this.updateOption('case', e.target.value);
        });

        // Options de format
        document.getElementById('textFormat')?.addEventListener('change', (e) => {
            this.updateOption('format', e.target.value);
        });

        document.getElementById('textLineWidth')?.addEventListener('input', (e) => {
            this.updateOption('lineWidth', parseInt(e.target.value, 10));
        });

        document.getElementById('textIndentSize')?.addEventListener('input', (e) => {
            this.updateOption('indentSize', parseInt(e.target.value, 10));
        });

        document.getElementById('textIndentChar')?.addEventListener('input', (e) => {
            this.updateOption('indentChar', e.target.value);
        });

        // Options d'encodage
        document.getElementById('textEncoding')?.addEventListener('change', (e) => {
            this.updateOption('encoding', e.target.value);
        });

        // Options de séparateur
        document.getElementById('textSeparator')?.addEventListener('change', (e) => {
            this.updateOption('separator', e.target.value);
        });

        // Boutons d'action
        document.getElementById('transformText')?.addEventListener('click', () => {
            this.transform();
        });

        document.getElementById('copyText')?.addEventListener('click', () => {
            this.copy();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isTextGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.transform();
            } else if (e.ctrlKey && e.key === 'c' && document.activeElement?.id !== 'textOutput') {
                e.preventDefault();
                this.copy();
            }
        });
    },

    /**
     * Vérifie si le générateur est visible
     */
    isTextGeneratorVisible() {
        const generator = document.getElementById('textTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour le texte
     */
    updateText(text) {
        this.state.text = text;
        this.transform();
        this.saveState();
    },

    /**
     * Met à jour le type de transformation
     */
    updateType(type) {
        if (!this.types[type]) return;

        this.state.type = type;
        this.transform();
        this.saveState();
    },

    /**
     * Met à jour une option
     */
    updateOption(option, value) {
        this.state.options[option] = value;
        this.transform();
        this.saveState();
    },

    /**
     * Transforme le texte
     */
    transform() {
        try {
            const type = this.types[this.state.type];
            let result = '';

            switch (this.state.type) {
                case 'case': {
                    const operation = type.operations[this.state.options.case];
                    result = operation.transform(this.state.text);
                    break;
                }

                case 'format': {
                    const operation = type.operations[this.state.options.format];
                    result = operation.transform(
                        this.state.text,
                        this.state.options.lineWidth,
                        this.state.options.indentSize,
                        this.state.options.indentChar
                    );
                    break;
                }

                case 'count': {
                    const stats = type.operations.all.analyze(this.state.text);
                    const freq = type.operations.frequency.analyze(this.state.text);
                    
                    result = [
                        'Statistiques :',
                        `- Caractères : ${stats.chars}`,
                        `- Lettres : ${stats.letters}`,
                        `- Mots : ${stats.words}`,
                        `- Phrases : ${stats.sentences}`,
                        `- Paragraphes : ${stats.paragraphs}`,
                        `- Lignes : ${stats.lines}`,
                        '',
                        'Fréquence des lettres :',
                        ...Object.entries(freq).map(([char, count]) =>
                            `- ${char} : ${count} (${(count / stats.letters * 100).toFixed(1)}%)`
                        )
                    ].join('\n');
                    break;
                }

                case 'convert': {
                    const operation = type.operations[this.state.options.format];
                    result = operation.transform(
                        this.state.text,
                        this.state.options.separator
                    );
                    break;
                }

                case 'encode': {
                    const operation = type.operations[this.state.options.encoding];
                    const isEncode = !this.state.text.split('').every(char => {
                        const code = char.charCodeAt(0);
                        return code >= 32 && code <= 126;
                    });
                    result = isEncode
                        ? operation.encode(this.state.text)
                        : operation.decode(this.state.text);
                    break;
                }

                case 'generate': {
                    const operation = type.operations[this.state.options.format];
                    result = operation.generate(
                        this.state.text,
                        this.state.options.count,
                        this.state.options.separator
                    );
                    break;
                }
            }

            // Met à jour l'état
            this.state.result = result;

            // Met à jour l'affichage
            this.updateDisplay();

            // Ajoute à l'historique
            this.addToHistory();
        } catch (error) {
            console.error('Erreur lors de la transformation:', error);
            Utils.showNotification(error.message, 'error');
        }
    },

    /**
     * Copie le résultat
     */
    copy() {
        if (!this.state.result) return;

        Utils.copyToClipboard(this.state.result)
            .then(() => Utils.showNotification('Texte copié !', 'success'))
            .catch(() => Utils.showNotification('Erreur lors de la copie', 'error'));
    },

    /**
     * Ajoute le résultat à l'historique
     */
    addToHistory() {
        if (!this.state.result) return;

        this.state.history.unshift({
            text: this.state.text,
            type: this.state.type,
            options: { ...this.state.options },
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
        const output = document.getElementById('textOutput');
        if (output) {
            output.value = this.state.result;
        }
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('textHistory');
        if (!container) return;

        container.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="textManager.useHistoryEntry(${this.state.history.indexOf(entry)})">
                    <div class="history-text">
                        ${entry.text.substring(0, 50)}${entry.text.length > 50 ? '...' : ''}
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

        this.state.text = entry.text;
        this.state.type = entry.type;
        this.state.options = { ...entry.options };
        this.state.result = entry.result;

        // Met à jour les champs
        const input = document.getElementById('textInput');
        if (input) input.value = entry.text;

        const typeSelect = document.getElementById('textType');
        if (typeSelect) typeSelect.value = entry.type;

        this.updateDisplay();
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('textState', {
            text: this.state.text,
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