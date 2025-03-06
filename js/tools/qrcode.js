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
            format: (url) => url.startsWith('http') ? url : `https://${url}`
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
        this.loadQRCodeLibrary()
            .then(() => {
                this.loadState();
                this.setupListeners();
                this.generate();
            })
            .catch(error => {
                console.error('Erreur lors du chargement de la bibliothèque QR Code:', error);
                Utils.showNotification('Erreur lors du chargement du générateur de QR codes', 'error');
            });
    },

    /**
     * Charge la bibliothèque QR Code
     */
    async loadQRCodeLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('qrcodeState', {
            text: '',
            type: 'text',
            options: this.state.options,
            history: []
        });

        this.state = { ...this.state, ...savedState };
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
        });

        document.getElementById('qrcodeMargin')?.addEventListener('input', (e) => {
            this.updateOption('margin', parseInt(e.target.value, 10));
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
        if (!window.QRCode || !this.state.text) return;

        const output = document.getElementById('qrcodeOutput');
        if (!output) return;

        // Nettoie l'affichage
        output.innerHTML = '';

        // Prépare les données selon le type
        const type = this.types[this.state.type];
        const data = type.format(this.state.text);

        try {
            // Génère le QR code
            if (this.state.options.format === 'svg') {
                const svg = await QRCode.toString(data, {
                    type: 'svg',
                    width: this.state.options.size,
                    margin: this.state.options.margin,
                    color: {
                        dark: this.state.options.color,
                        light: this.state.options.background
                    },
                    errorCorrectionLevel: this.state.options.errorCorrectionLevel
                });
                output.innerHTML = svg;
            } else {
                const canvas = document.createElement('canvas');
                await QRCode.toCanvas(canvas, data, {
                    width: this.state.options.size,
                    margin: this.state.options.margin,
                    color: {
                        dark: this.state.options.color,
                        light: this.state.options.background
                    },
                    errorCorrectionLevel: this.state.options.errorCorrectionLevel
                });
                output.appendChild(canvas);
            }

            // Ajoute à l'historique
            this.addToHistory();
        } catch (error) {
            console.error('Erreur lors de la génération du QR code:', error);
            Utils.showNotification('Erreur lors de la génération du QR code', 'error');
        }
    },

    /**
     * Télécharge le QR code
     */
    download() {
        const output = document.getElementById('qrcodeOutput');
        if (!output?.firstChild) return;

        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `qrcode-${timestamp}`;

        if (this.state.options.format === 'svg') {
            const svg = output.innerHTML;
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}.svg`;
        } else {
            const canvas = output.querySelector('canvas');
            if (!canvas) return;
            link.href = canvas.toDataURL('image/png');
            link.download = `${filename}.png`;
        }

        link.click();
        URL.revokeObjectURL(link.href);
    },

    /**
     * Ajoute le QR code à l'historique
     */
    addToHistory() {
        this.state.history.unshift({
            text: this.state.text,
            type: this.state.type,
            options: { ...this.state.options },
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

        this.generate();
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