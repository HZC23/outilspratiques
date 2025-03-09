import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de QR codes
 */
export const QRCodeManager = {
    state: {
        text: '',
        type: 'text', // text | url | email | tel | sms | wifi | vcard | geo
        options: {
            size: 256,
            margin: 4,
            color: '#000000',
            background: '#FFFFFF',
            errorCorrectionLevel: 'M', // L | M | Q | H
            format: 'svg' // svg | png
        },
        lastGenerated: null,
        history: []
    },

    // Configuration des types de données
    types: {
        text: {
            name: 'Texte',
            description: 'Texte simple',
            placeholder: 'Entrez votre texte ici',
            format: (text) => text
        },
        url: {
            name: 'URL',
            description: 'Lien web',
            placeholder: 'https://example.com',
            format: (url) => {
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    return 'https://' + url;
                }
                return url;
            }
        },
        email: {
            name: 'Email',
            description: 'Adresse email avec sujet et corps optionnels',
            placeholder: 'email@example.com',
            format: (email, subject = '', body = '') => {
                let mailto = `mailto:${email}`;
                if (subject || body) {
                    mailto += '?';
                    if (subject) mailto += `subject=${encodeURIComponent(subject)}`;
                    if (body) mailto += `${subject ? '&' : ''}body=${encodeURIComponent(body)}`;
                }
                return mailto;
            }
        },
        tel: {
            name: 'Téléphone',
            description: 'Numéro de téléphone',
            placeholder: '+33612345678',
            format: (tel) => `tel:${tel.replace(/\s+/g, '')}`
        },
        sms: {
            name: 'SMS',
            description: 'Message SMS avec numéro',
            placeholder: '+33612345678',
            format: (tel, message = '') => {
                let sms = `sms:${tel.replace(/\s+/g, '')}`;
                if (message) sms += `?body=${encodeURIComponent(message)}`;
                return sms;
            }
        },
        wifi: {
            name: 'Wi-Fi',
            description: 'Configuration réseau Wi-Fi',
            placeholder: 'Nom du réseau',
            format: (ssid, password = '', encryption = 'WPA') => {
                return `WIFI:S:${ssid};T:${encryption};P:${password};;`;
            }
        },
        vcard: {
            name: 'vCard',
            description: 'Carte de visite',
            placeholder: 'Nom',
            format: (data) => {
                const { name, org, title, tel, email, url, note } = data;
                return [
                    'BEGIN:VCARD',
                    'VERSION:3.0',
                    `FN:${name}`,
                    org ? `ORG:${org}` : '',
                    title ? `TITLE:${title}` : '',
                    tel ? `TEL:${tel}` : '',
                    email ? `EMAIL:${email}` : '',
                    url ? `URL:${url}` : '',
                    note ? `NOTE:${note}` : '',
                    'END:VCARD'
                ].filter(Boolean).join('\n');
            }
        },
        geo: {
            name: 'Géolocalisation',
            description: 'Coordonnées GPS',
            placeholder: 'Latitude',
            format: (lat, lon) => `geo:${lat},${lon}`
        }
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.setupListeners();
        
        // Chargement de la bibliothèque QR Code
        this.loadQRCodeLibrary()
            .then(() => {
                console.log('Bibliothèque QR Code chargée avec succès');
                this.updateRangeValues();
                this.updateHistoryDisplay();
                
                // On génère un QR code par défaut si l'état est vide
                if (!this.state.text) {
                    this.state.text = 'https://outilspratiques.github.io';
                    
                    // Met à jour le champ de texte
                    const textInput = document.getElementById('qrcodeText');
                    if (textInput) textInput.value = this.state.text;
                    
                    this.generate();
                } else {
                    // On régénère le QR code si l'état n'est pas vide
                    this.generate();
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement de la bibliothèque QR Code:', error);
                this.showError('Impossible de charger la bibliothèque QR Code. Veuillez réessayer.');
            });
    },

    /**
     * Charge la bibliothèque QR Code
     */
    async loadQRCodeLibrary() {
        return new Promise((resolve, reject) => {
            // Vérifie si la bibliothèque est déjà chargée
            if (window.QRCode) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Type de données
        document.getElementById('qrcodeType')?.addEventListener('change', (e) => {
            this.updateType(e.target.value);
        });

        // Texte
        document.getElementById('qrcodeText')?.addEventListener('input', (e) => {
            this.updateText(e.target.value);
        });

        // Options
        document.getElementById('qrcodeSize')?.addEventListener('input', (e) => {
            this.updateOption('size', parseInt(e.target.value, 10));
            document.getElementById('qrcodeSizeValue').textContent = `${e.target.value} px`;
        });

        document.getElementById('qrcodeMargin')?.addEventListener('input', (e) => {
            this.updateOption('margin', parseInt(e.target.value, 10));
            document.getElementById('qrcodeMarginValue').textContent = e.target.value;
        });

        document.getElementById('qrcodeColor')?.addEventListener('input', (e) => {
            this.updateOption('color', e.target.value);
        });

        document.getElementById('qrcodeBackground')?.addEventListener('input', (e) => {
            this.updateOption('background', e.target.value);
        });

        document.getElementById('qrcodeErrorLevel')?.addEventListener('change', (e) => {
            this.updateOption('errorCorrectionLevel', e.target.value);
        });

        document.getElementById('qrcodeFormat')?.addEventListener('change', (e) => {
            this.updateOption('format', e.target.value);
        });

        // Boutons d'action
        document.getElementById('generateQRCode')?.addEventListener('click', () => {
            this.generate();
        });

        document.getElementById('downloadQRCode')?.addEventListener('click', () => {
            this.download();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isQRCodeGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generate();
            }
        });
    },

    /**
     * Met à jour les valeurs des curseurs
     */
    updateRangeValues() {
        const sizeValue = document.getElementById('qrcodeSizeValue');
        if (sizeValue) sizeValue.textContent = `${this.state.options.size} px`;
        
        const marginValue = document.getElementById('qrcodeMarginValue');
        if (marginValue) marginValue.textContent = `${this.state.options.margin}`;
        
        // Met à jour les valeurs des champs
        const sizeInput = document.getElementById('qrcodeSize');
        if (sizeInput) sizeInput.value = this.state.options.size;
        
        const marginInput = document.getElementById('qrcodeMargin');
        if (marginInput) marginInput.value = this.state.options.margin;
        
        const colorInput = document.getElementById('qrcodeColor');
        if (colorInput) colorInput.value = this.state.options.color;
        
        const backgroundInput = document.getElementById('qrcodeBackground');
        if (backgroundInput) backgroundInput.value = this.state.options.background;
        
        const errorLevelInput = document.getElementById('qrcodeErrorLevel');
        if (errorLevelInput) errorLevelInput.value = this.state.options.errorCorrectionLevel;
        
        const formatInput = document.getElementById('qrcodeFormat');
        if (formatInput) formatInput.value = this.state.options.format;
    },

    /**
     * Vérifie si le générateur est visible
     */
    isQRCodeGeneratorVisible() {
        const generator = document.getElementById('qrcodeTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour le type de données
     */
    updateType(type) {
        if (!this.types[type]) return;

        this.state.type = type;
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour le texte
     */
    updateText(text) {
        this.state.text = text;
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
     * Génère le QR code
     */
    async generate() {
        const outputEl = document.getElementById('qrcodeOutput');
        if (!outputEl) return;

        // Vérifie si la bibliothèque est chargée
        if (!window.QRCode) {
            this.loadQRCodeLibrary()
                .then(() => this.generate())
                .catch(error => {
                    console.error('Erreur lors du chargement de la bibliothèque QR Code:', error);
                    this.showError('Impossible de charger la bibliothèque QR Code');
                });
            return;
        }

        // Validation des données
        if (!this.state.text.trim()) {
            this.showError('Veuillez saisir un texte');
            return;
        }

        try {
            // Efface le contenu précédent
            outputEl.innerHTML = '';
            
            // Applique le formatage selon le type
            const formattedText = this.types[this.state.type].format(this.state.text);
            const options = {
                width: this.state.options.size,
                height: this.state.options.size,
                margin: this.state.options.margin,
                color: {
                    dark: this.state.options.color,
                    light: this.state.options.background
                },
                errorCorrectionLevel: this.state.options.errorCorrectionLevel
            };

            // Génère le QR code
            if (this.state.options.format === 'svg') {
                QRCode.toString(formattedText, {
                    ...options,
                    type: 'svg'
                }, (error, svg) => {
                    if (error) {
                        console.error('Erreur lors de la génération du QR code SVG:', error);
                        this.showError('Erreur lors de la génération du QR code');
                        return;
                    }
                    
                    outputEl.innerHTML = svg;
                    this.state.lastGenerated = { 
                        data: svg, 
                        format: 'svg',
                        text: formattedText
                    };
                    
                    // Ajoute à l'historique
                    this.addToHistory();
                });
            } else {
                // Crée un canvas
                const canvas = document.createElement('canvas');
                outputEl.appendChild(canvas);
                
                QRCode.toCanvas(canvas, formattedText, {
                    ...options,
                    width: this.state.options.size,
                    margin: this.state.options.margin,
                }, (error) => {
                    if (error) {
                        console.error('Erreur lors de la génération du QR code canvas:', error);
                        this.showError('Erreur lors de la génération du QR code');
                        return;
                    }
                    
                    this.state.lastGenerated = { 
                        canvas: canvas, 
                        format: 'png',
                        text: formattedText
                    };
                    
                    // Ajoute à l'historique
                    this.addToHistory();
                });
            }
        } catch (error) {
            console.error('Erreur lors de la génération du QR code:', error);
            this.showError('Erreur lors de la génération du QR code: ' + error.message);
        }
    },

    /**
     * Télécharge le QR code
     */
    download() {
        if (!this.state.lastGenerated) {
            this.showError('Veuillez d\'abord générer un QR code');
            return;
        }
        
        try {
            const link = document.createElement('a');
            
            if (this.state.lastGenerated.format === 'svg') {
                // Téléchargement en SVG
                const blob = new Blob([this.state.lastGenerated.data], { type: 'image/svg+xml' });
                link.href = URL.createObjectURL(blob);
                link.download = `qrcode-${Date.now()}.svg`;
            } else {
                // Téléchargement en PNG
                const canvas = this.state.lastGenerated.canvas;
                link.href = canvas.toDataURL('image/png');
                link.download = `qrcode-${Date.now()}.png`;
            }
            
            // Déclenche le téléchargement
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Affiche une notification de succès
            this.showSuccess('QR code téléchargé avec succès');
        } catch (error) {
            console.error('Erreur lors du téléchargement du QR code:', error);
            this.showError('Erreur lors du téléchargement: ' + error.message);
        }
    },

    /**
     * Affiche une erreur
     */
    showError(message) {
        if (window.notificationManager) {
            window.notificationManager.show({
                type: 'error',
                message: message,
                duration: 3000
            });
        } else {
            alert(message);
        }
    },

    /**
     * Affiche un succès
     */
    showSuccess(message) {
        if (window.notificationManager) {
            window.notificationManager.show({
                type: 'success',
                message: message,
                duration: 3000
            });
        }
    },

    /**
     * Ajoute le QR code à l'historique
     */
    addToHistory() {
        // Crée une entrée d'historique
        const entry = {
            text: this.state.text,
            type: this.state.type,
            options: { ...this.state.options },
            timestamp: Date.now()
        };
        
        // Vérifie si l'entrée existe déjà (même texte et type)
        const existingIndex = this.state.history.findIndex(
            item => item.text === entry.text && item.type === entry.type
        );
        
        if (existingIndex !== -1) {
            // Supprime l'entrée existante
            this.state.history.splice(existingIndex, 1);
        }
        
        // Ajoute la nouvelle entrée en premier
        this.state.history.unshift(entry);
        
        // Limite la taille de l'historique à 10 entrées
        if (this.state.history.length > 10) {
            this.state.history = this.state.history.slice(0, 10);
        }
        
        // Met à jour l'affichage de l'historique
        this.updateHistoryDisplay();
        
        // Sauvegarde l'état
        this.saveState();
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('qrcodeHistory');
        if (!container) return;

        container.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="qrcodeManager.useHistoryEntry(${this.state.history.indexOf(entry)})">
                    <div class="history-preview">
                        <div class="qrcode-preview">
                            ${entry.text.substring(0, 50)}${entry.text.length > 50 ? '...' : ''}
                        </div>
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

        // Met à jour les champs
        const textInput = document.getElementById('qrcodeText');
        if (textInput) textInput.value = entry.text;

        const typeSelect = document.getElementById('qrcodeType');
        if (typeSelect) typeSelect.value = entry.type;
        
        // Met à jour les valeurs des options
        this.updateRangeValues();

        this.generate();
    },

    /**
     * Vide l'historique
     */
    clearHistory() {
        this.state.history = [];
        this.updateHistoryDisplay();
        this.saveState();
        this.showSuccess('Historique effacé avec succès');
    },

    /**
     * Charge l'état depuis le stockage local
     */
    loadState() {
        const savedState = Utils.getFromStorage('qrcodeState');
        if (savedState) {
            this.state = {
                ...this.state,
                ...savedState
            };
            
            // S'assure que les options ont toutes les propriétés nécessaires
            this.state.options = {
                ...this.state.options,
                ...savedState.options
            };
        }
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('qrcodeState', {
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