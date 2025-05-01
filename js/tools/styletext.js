/**
 * Module de style de texte
 * 
 * Ce module permet de transformer du texte normal en différents styles typographiques
 * en utilisant des caractères Unicode spéciaux. Il prend en charge les styles suivants :
 * - Serif
 * - Script
 * - Bold
 * - Italic
 * - Gothic
 * - Double
 * 
 * Le module gère également un historique des conversions pour faciliter la réutilisation.
 */

import { Utils } from '../utils.js';

export const StyleTextManager = {
    /**
     * État du gestionnaire de style de texte
     */
    state: {
        history: [],
        input: '',
        output: '',
        currentStyle: 'serif',
        maxHistoryItems: 10,
        charLimit: 500
    },

    /**
     * Initialise le gestionnaire de style de texte
     */
    init() {
        this.loadHistory();
        this.setupListeners();
        
        // Définir le style initial
        const styleButtons = document.querySelectorAll('.style-btn');
        if (styleButtons && styleButtons.length > 0) {
            styleButtons[0].classList.add('active');
        }
        
        // Actualiser l'affichage de l'historique vide si nécessaire
        this.updateEmptyHistoryState();
        
        console.log('Gestionnaire de style de texte initialisé');
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        const styleInput = document.getElementById('styleInput');
        const styleOutput = document.getElementById('styleOutput');
        const styleButtons = document.querySelectorAll('.style-btn');
        const inputCounter = document.getElementById('inputCounter');
        const shareButton = document.getElementById('shareButton');

        if (styleInput) {
            styleInput.addEventListener('input', () => {
                this.state.input = styleInput.value;
                this.applyCurrentStyle();
                
                // Mettre à jour le compteur de caractères
                if (inputCounter) {
                    const count = styleInput.value.length;
                    inputCounter.textContent = `${count} caractère${count > 1 ? 's' : ''}`;
                    
                    // Avertir si le nombre de caractères est trop élevé
                    if (count > this.state.charLimit) {
                        inputCounter.classList.add('limit-exceeded');
                        inputCounter.setAttribute('data-tooltip', `Limite recommandée: ${this.state.charLimit} caractères`);
                    } else {
                        inputCounter.classList.remove('limit-exceeded');
                        inputCounter.removeAttribute('data-tooltip');
                    }
                }
            });
            
            // Gérer le collage
            styleInput.addEventListener('paste', (e) => {
                // Permettre au navigateur de coller le texte d'abord
                setTimeout(() => {
                    this.state.input = styleInput.value;
                    this.applyCurrentStyle();
                    
                    // Mettre à jour le compteur de caractères
                    if (inputCounter) {
                        const count = styleInput.value.length;
                        inputCounter.textContent = `${count} caractère${count > 1 ? 's' : ''}`;
                    }
                }, 0);
            });
        }

        if (styleButtons) {
            styleButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Retirer la classe active de tous les boutons
                    styleButtons.forEach(btn => btn.classList.remove('active'));
                    // Ajouter la classe active au bouton cliqué
                    button.classList.add('active');
                    
                    const style = button.getAttribute('data-style');
                    this.applyStyle(style);
                });
            });
        }

        // Exposer les fonctions au contexte global pour les appels depuis HTML
        window.applyStyle = (style) => this.applyStyle(style);
        window.copyStyleOutput = () => this.copyOutput();
        window.clearHistory = () => this.clearHistory();
    },

    /**
     * Applique le style spécifié au texte
     * @param {string} style - Le style à appliquer
     */
    applyStyle(style) {
        this.state.currentStyle = style;
        this.applyCurrentStyle();
    },

    /**
     * Applique le style actuel au texte
     */
    applyCurrentStyle() {
        const input = this.state.input;
        const styleOutput = document.getElementById('styleOutput');
        
        if (!styleOutput) return;
        
        let output = '';
        
        // Si l'entrée est vide, effacer également la sortie
        if (!input || input.trim() === '') {
            styleOutput.value = '';
            this.state.output = '';
            return;
        }
        
        // Appliquer une animation de chargement si le texte est long
        if (input.length > 200) {
            styleOutput.classList.add('processing');
        }
        
        // Utiliser setTimeout pour ne pas bloquer l'UI pendant la conversion
        setTimeout(() => {
            switch (this.state.currentStyle) {
                case 'serif':
                    output = this.convertToSerif(input);
                    break;
                case 'script':
                    output = this.convertToScript(input);
                    break;
                case 'bold':
                    output = this.convertToBold(input);
                    break;
                case 'italic':
                    output = this.convertToItalic(input);
                    break;
                case 'gothic':
                    output = this.convertToGothic(input);
                    break;
                case 'double':
                    output = this.convertToDouble(input);
                    break;
                default:
                    output = input;
            }
            
            this.state.output = output;
            styleOutput.value = output;
            styleOutput.classList.remove('processing');
            
            // Ajouter à l'historique si le texte n'est pas vide
            if (input.trim() !== '' && output.trim() !== '') {
                this.addToHistory(input, output, this.state.currentStyle);
            }
        }, 10);
    },

    /**
     * Convertit le texte en style serif
     * @param {string} text - Le texte à convertir
     * @returns {string} - Le texte converti
     */
    convertToSerif(text) {
        const serifMap = {
            'a': '𝔞', 'b': '𝔟', 'c': '𝔠', 'd': '𝔡', 'e': '𝔢', 'f': '𝔣', 'g': '𝔤', 'h': '𝔥', 'i': '𝔦',
            'j': '𝔧', 'k': '𝔨', 'l': '𝔩', 'm': '𝔪', 'n': '𝔫', 'o': '𝔬', 'p': '𝔭', 'q': '𝔮', 'r': '𝔯',
            's': '𝔰', 't': '𝔱', 'u': '𝔲', 'v': '𝔳', 'w': '𝔴', 'x': '𝔵', 'y': '𝔶', 'z': '𝔷',
            'A': '𝔄', 'B': '𝔅', 'C': 'ℭ', 'D': '𝔇', 'E': '𝔈', 'F': '𝔉', 'G': '𝔊', 'H': 'ℌ', 'I': 'ℑ',
            'J': '𝔍', 'K': '𝔎', 'L': '𝔏', 'M': '𝔐', 'N': '𝔑', 'O': '𝔒', 'P': '𝔓', 'Q': '𝔔', 'R': 'ℜ',
            'S': '𝔖', 'T': '𝔗', 'U': '𝔘', 'V': '𝔙', 'W': '𝔚', 'X': '𝔛', 'Y': '𝔜', 'Z': 'ℨ',
            '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
        };
        
        return this.mapCharacters(text, serifMap);
    },

    /**
     * Convertit le texte en style script
     * @param {string} text - Le texte à convertir
     * @returns {string} - Le texte converti
     */
    convertToScript(text) {
        const scriptMap = {
            'a': '𝓪', 'b': '𝓫', 'c': '𝓬', 'd': '𝓭', 'e': '𝓮', 'f': '𝓯', 'g': '𝓰', 'h': '𝓱', 'i': '𝓲',
            'j': '𝓳', 'k': '𝓴', 'l': '𝓵', 'm': '𝓶', 'n': '𝓷', 'o': '𝓸', 'p': '𝓹', 'q': '𝓺', 'r': '𝓻',
            's': '𝓼', 't': '𝓽', 'u': '𝓾', 'v': '𝓿', 'w': '𝔀', 'x': '𝔁', 'y': '𝔂', 'z': '𝔃',
            'A': '𝓐', 'B': '𝓑', 'C': '𝓒', 'D': '𝓓', 'E': '𝓔', 'F': '𝓕', 'G': '𝓖', 'H': '𝓗', 'I': '𝓘',
            'J': '𝓙', 'K': '𝓚', 'L': '𝓛', 'M': '𝓜', 'N': '𝓝', 'O': '𝓞', 'P': '𝓟', 'Q': '𝓠', 'R': '𝓡',
            'S': '𝓢', 'T': '𝓣', 'U': '𝓤', 'V': '𝓥', 'W': '𝓦', 'X': '𝓧', 'Y': '𝓨', 'Z': '𝓩',
            '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
        };
        
        return this.mapCharacters(text, scriptMap);
    },

    /**
     * Convertit le texte en style gras
     * @param {string} text - Le texte à convertir
     * @returns {string} - Le texte converti
     */
    convertToBold(text) {
        const boldMap = {
            'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢',
            'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫',
            's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
            'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈',
            'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑',
            'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
            '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
        };
        
        return this.mapCharacters(text, boldMap);
    },

    /**
     * Convertit le texte en style italique
     * @param {string} text - Le texte à convertir
     * @returns {string} - Le texte converti
     */
    convertToItalic(text) {
        const italicMap = {
            'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪',
            'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳',
            's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
            'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐',
            'J': '𝘑', 'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙',
            'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡',
            '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
        };
        
        return this.mapCharacters(text, italicMap);
    },

    /**
     * Convertit le texte en style gothique
     * @param {string} text - Le texte à convertir
     * @returns {string} - Le texte converti
     */
    convertToGothic(text) {
        const gothicMap = {
            'a': '𝖆', 'b': '𝖇', 'c': '𝖈', 'd': '𝖉', 'e': '𝖊', 'f': '𝖋', 'g': '𝖌', 'h': '𝖍', 'i': '𝖎',
            'j': '𝖏', 'k': '𝖐', 'l': '𝖑', 'm': '𝖒', 'n': '𝖓', 'o': '𝖔', 'p': '𝖕', 'q': '𝖖', 'r': '𝖗',
            's': '𝖘', 't': '𝖙', 'u': '𝖚', 'v': '𝖛', 'w': '𝖜', 'x': '𝖝', 'y': '𝖞', 'z': '𝖟',
            'A': '𝕬', 'B': '𝕭', 'C': '𝕮', 'D': '𝕯', 'E': '𝕰', 'F': '𝕱', 'G': '𝕲', 'H': '𝕳', 'I': '𝕴',
            'J': '𝕵', 'K': '𝕶', 'L': '𝕷', 'M': '𝕸', 'N': '𝕹', 'O': '𝕺', 'P': '𝕻', 'Q': '𝕼', 'R': '𝕽',
            'S': '𝕾', 'T': '𝕿', 'U': '𝖀', 'V': '𝖁', 'W': '𝖂', 'X': '𝖃', 'Y': '𝖄', 'Z': '𝖅',
            '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
        };
        
        return this.mapCharacters(text, gothicMap);
    },

    /**
     * Convertit le texte en style double
     * @param {string} text - Le texte à convertir
     * @returns {string} - Le texte converti
     */
    convertToDouble(text) {
        const doubleMap = {
            'a': '𝕒', 'b': '𝕓', 'c': '𝕔', 'd': '𝕕', 'e': '𝕖', 'f': '𝕗', 'g': '𝕘', 'h': '𝕙', 'i': '𝕚',
            'j': '𝕛', 'k': '𝕜', 'l': '𝕝', 'm': '𝕞', 'n': '𝕟', 'o': '𝕠', 'p': '𝕡', 'q': '𝕢', 'r': '𝕣',
            's': '𝕤', 't': '𝕥', 'u': '𝕦', 'v': '𝕧', 'w': '𝕨', 'x': '𝕩', 'y': '𝕪', 'z': '𝕫',
            'A': '𝔸', 'B': '𝔹', 'C': 'ℂ', 'D': '𝔻', 'E': '𝔼', 'F': '𝔽', 'G': '𝔾', 'H': 'ℍ', 'I': '𝕀',
            'J': '𝕁', 'K': '𝕂', 'L': '𝕃', 'M': '𝕄', 'N': 'ℕ', 'O': '𝕆', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ',
            'S': '𝕊', 'T': '𝕋', 'U': '𝕌', 'V': '𝕍', 'W': '𝕎', 'X': '𝕏', 'Y': '𝕐', 'Z': 'ℤ',
            '0': '𝟖', '1': '𝟗', '2': '𝟚', '3': '𝟛', '4': '𝟜', '5': '𝟝', '6': '𝟞', '7': '𝟟', '8': '𝟠', '9': '𝟡'
        };
        
        return this.mapCharacters(text, doubleMap);
    },

    /**
     * Mappe les caractères d'un texte selon un dictionnaire
     * @param {string} text - Le texte à mapper
     * @param {object} charMap - Le dictionnaire de caractères
     * @returns {string} - Le texte mappé
     */
    mapCharacters(text, charMap) {
        if (!text) return '';
        
        return text.split('').map(char => {
            // Vérifier si le caractère existe dans la carte
            if (charMap[char] !== undefined) {
                return charMap[char];
            }
            
            // Si non, conserver le caractère original
            return char;
        }).join('');
    },

    /**
     * Copie le texte stylisé dans le presse-papier
     */
    copyOutput() {
        const output = this.state.output;
        if (output) {
            navigator.clipboard.writeText(output)
                .then(() => {
                    Utils.showNotification('Texte copié dans le presse-papier', 'success');
                    this.animateCopyButton();
                })
                .catch(err => {
                    console.error('Erreur lors de la copie :', err);
                    Utils.showNotification('Erreur lors de la copie du texte', 'error');
                });
        } else {
            Utils.showNotification('Aucun texte à copier', 'warning');
        }
    },

    /**
     * Anime le bouton de copie
     */
    animateCopyButton() {
        const copyButton = document.querySelector('.styletext-button');
        if (copyButton) {
            copyButton.classList.add('copied');
            setTimeout(() => {
                copyButton.classList.remove('copied');
            }, 1000);
        }
    },

    /**
     * Ajoute une entrée à l'historique
     * @param {string} input - Le texte d'entrée
     * @param {string} output - Le texte stylisé
     * @param {string} style - Le style appliqué
     */
    addToHistory(input, output, style) {
        // Ne pas ajouter si l'entrée ou la sortie est vide
        if (!input.trim() || !output.trim()) return;
        
        // Limiter la taille de l'historique
        if (this.state.history.length >= this.state.maxHistoryItems) {
            this.state.history.pop();
        }
        
        const historyItem = {
            input: input.length > 50 ? input.substring(0, 50) + '...' : input,
            output: output.length > 50 ? output.substring(0, 50) + '...' : output,
            fullInput: input,
            fullOutput: output,
            style,
            timestamp: new Date().toISOString()
        };
        
        // Vérifier si l'entrée existe déjà dans l'historique
        const existingIndex = this.state.history.findIndex(item => 
            item.fullInput === input && item.style === style
        );
        
        if (existingIndex > -1) {
            // Déplacer l'élément existant en haut de la liste
            const existingItem = this.state.history.splice(existingIndex, 1)[0];
            existingItem.timestamp = new Date().toISOString(); // Mettre à jour l'horodatage
            this.state.history.unshift(existingItem);
        } else {
            // Ajouter un nouvel élément
            this.state.history.unshift(historyItem);
        }
        
        this.saveHistory();
        this.updateHistoryDisplay();
        this.updateEmptyHistoryState();
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const historyContainer = document.getElementById('style-history');
        if (!historyContainer) return;
        
        // Conserver l'élément d'historique vide s'il existe
        const emptyHistoryElement = document.getElementById('emptyHistory');
        
        // Vider le conteneur de l'historique, sauf pour l'élément vide
        Array.from(historyContainer.children).forEach(child => {
            if (child.id !== 'emptyHistory') {
                child.remove();
            }
        });
        
        this.state.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.setAttribute('data-style', item.style);
            
            const date = new Date(item.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            
            // Ajouter un badge de style
            let badgeIcon = '';
            switch (item.style) {
                case 'serif': badgeIcon = '𝔖'; break;
                case 'script': badgeIcon = '𝓢'; break;
                case 'bold': badgeIcon = '𝐁'; break;
                case 'italic': badgeIcon = '𝘐'; break;
                case 'gothic': badgeIcon = '𝖌'; break;
                case 'double': badgeIcon = '𝕕'; break;
                default: badgeIcon = 'S'; 
            }
            
            historyItem.innerHTML = `
                <div class="history-badge" data-style="${item.style}">${badgeIcon}</div>
                <div class="history-content">
                    <div class="history-input" title="${item.fullInput}">${item.input}</div>
                    <div class="history-output" title="${item.fullOutput}">${item.output}</div>
                </div>
                <div class="history-meta">
                    <div class="history-style">${item.style}</div>
                    <div class="history-timestamp">${formattedDate}</div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn reuse-btn" data-tooltip="Réutiliser"><i class="fas fa-redo-alt"></i></button>
                    <button class="history-action-btn copy-btn" data-tooltip="Copier"><i class="fas fa-copy"></i></button>
                </div>
            `;
            
            // Configurer les boutons d'action
            const reuseBtn = historyItem.querySelector('.reuse-btn');
            const copyBtn = historyItem.querySelector('.copy-btn');
            
            if (reuseBtn) {
                reuseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.reuseHistoryItem(item);
                });
            }
            
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.copyHistoryItem(item);
                });
            }
            
            // Configurer l'action de clic sur l'élément d'historique
            historyItem.addEventListener('click', () => {
                this.reuseHistoryItem(item);
            });
            
            historyContainer.appendChild(historyItem);
        });
    },
    
    /**
     * Met à jour l'état de l'historique vide
     */
    updateEmptyHistoryState() {
        const emptyHistory = document.getElementById('emptyHistory');
        if (emptyHistory) {
            if (this.state.history.length === 0) {
                emptyHistory.style.display = 'flex';
            } else {
                emptyHistory.style.display = 'none';
            }
        }
    },
    
    /**
     * Réutilise un élément de l'historique
     * @param {object} item - L'élément d'historique à réutiliser
     */
    reuseHistoryItem(item) {
        const styleInput = document.getElementById('styleInput');
        const styleButtons = document.querySelectorAll('.style-btn');
        const inputCounter = document.getElementById('inputCounter');
        
        if (styleInput) {
            styleInput.value = item.fullInput;
            this.state.input = item.fullInput;
            
            // Mettre à jour le compteur de caractères
            if (inputCounter) {
                const count = item.fullInput.length;
                inputCounter.textContent = `${count} caractère${count > 1 ? 's' : ''}`;
            }
        }
        
        this.state.currentStyle = item.style;
        
        // Mettre à jour le bouton actif
        styleButtons.forEach(button => {
            const style = button.getAttribute('data-style');
            if (style === item.style) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        this.applyCurrentStyle();
        
        // Animation de feedback
        const historyItems = document.querySelectorAll('.history-item');
        historyItems.forEach(historyItem => {
            if (historyItem.getAttribute('data-style') === item.style) {
                historyItem.classList.add('reused');
                setTimeout(() => {
                    historyItem.classList.remove('reused');
                }, 1000);
            }
        });
    },
    
    /**
     * Copie un élément de l'historique
     * @param {object} item - L'élément d'historique à copier
     */
    copyHistoryItem(item) {
        navigator.clipboard.writeText(item.fullOutput)
            .then(() => {
                Utils.showNotification('Texte de l\'historique copié', 'success');
            })
            .catch(err => {
                console.error('Erreur lors de la copie :', err);
                Utils.showNotification('Erreur lors de la copie du texte', 'error');
            });
    },

    /**
     * Sauvegarde l'historique dans le stockage local
     */
    saveHistory() {
        localStorage.setItem('styleTextHistory', JSON.stringify(this.state.history));
    },

    /**
     * Charge l'historique depuis le stockage local
     */
    loadHistory() {
        const savedHistory = localStorage.getItem('styleTextHistory');
        if (savedHistory) {
            try {
                this.state.history = JSON.parse(savedHistory);
                
                // Assurer la compatibilité avec l'ancien format
                this.state.history = this.state.history.map(item => ({
                    input: item.input,
                    output: item.output,
                    fullInput: item.fullInput || item.input,
                    fullOutput: item.fullOutput || item.output,
                    style: item.style,
                    timestamp: item.timestamp
                }));
                
                this.updateHistoryDisplay();
                this.updateEmptyHistoryState();
            } catch (error) {
                console.error('Erreur lors du chargement de l\'historique :', error);
                this.state.history = [];
            }
        }
    },

    /**
     * Efface l'historique
     */
    clearHistory() {
        // Demander confirmation avant de supprimer
        if (this.state.history.length > 0 && confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
            this.state.history = [];
            this.saveHistory();
            this.updateHistoryDisplay();
            this.updateEmptyHistoryState();
            Utils.showNotification('Historique effacé', 'info');
        }
    }
};

// Initialiser le gestionnaire lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Exposer les fonctions au contexte global immédiatement
    window.applyStyle = (style) => StyleTextManager.applyStyle(style);
    window.copyStyleOutput = () => StyleTextManager.copyOutput();
    window.clearHistory = () => StyleTextManager.clearHistory();

    // Initialiser le gestionnaire
    StyleTextManager.init();
    
    // Configurer les écouteurs d'événements pour l'accessibilité
    setupAccessibilityFeatures();
});

/**
 * Configure les fonctionnalités d'accessibilité
 */
function setupAccessibilityFeatures() {
    // Gérer les raccourcis clavier
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter pour convertir le texte
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const styleInput = document.getElementById('styleInput');
            if (styleInput && document.activeElement === styleInput) {
                StyleTextManager.applyCurrentStyle();
                e.preventDefault();
            }
        }
        
        // Échap pour fermer les popups
        if (e.key === 'Escape') {
            StyleTextManager.closeSharePopup();
        }
        
        // Ctrl/Cmd + C pour copier la sortie quand elle est en focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            const styleOutput = document.getElementById('styleOutput');
            if (styleOutput && document.activeElement === styleOutput) {
                StyleTextManager.copyOutput();
                e.preventDefault();
            }
        }
    });
    
    // Configurer l'autocomplétion et les suggestions
    const styleInput = document.getElementById('styleInput');
    if (styleInput) {
        styleInput.addEventListener('focus', () => {
            // Charger les suggestions basées sur l'historique
            if (StyleTextManager.state.history.length > 0) {
                const datalist = document.createElement('datalist');
                datalist.id = 'styleInputSuggestions';
                
                // Utiliser les entrées uniques de l'historique comme suggestions
                const uniqueInputs = [...new Set(
                    StyleTextManager.state.history.map(item => item.fullInput)
                )];
                
                uniqueInputs.forEach(input => {
                    const option = document.createElement('option');
                    option.value = input;
                    datalist.appendChild(option);
                });
                
                // Supprimer l'ancien datalist s'il existe
                const oldDatalist = document.getElementById('styleInputSuggestions');
                if (oldDatalist) {
                    oldDatalist.remove();
                }
                
                document.body.appendChild(datalist);
                styleInput.setAttribute('list', 'styleInputSuggestions');
            }
        });
    }
    
    // Support du copier-coller pour le champ de sortie
    const styleOutput = document.getElementById('styleOutput');
    if (styleOutput) {
        styleOutput.addEventListener('click', () => {
            // Sélectionner tout le texte au clic
            styleOutput.select();
        });
    }
    
    // Gérer le panneau d'aide
    const helpButton = document.getElementById('styletextHelp');
    const helpPanel = document.getElementById('styletextHelpPanel');
    const closeHelpButton = document.getElementById('closeStyletextHelp');
    
    if (helpButton && helpPanel && closeHelpButton) {
        helpButton.addEventListener('click', () => {
            helpPanel.classList.add('active');
        });
        
        closeHelpButton.addEventListener('click', () => {
            helpPanel.classList.remove('active');
        });
    }
} 