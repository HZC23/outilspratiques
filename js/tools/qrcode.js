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
        history: [],
        isLoading: false,
        libraryLoaded: false
    },

    // Configuration des types de données
    types: {
        text: {
            name: 'Texte',
            description: 'Texte simple',
            placeholder: 'Entrez votre texte ici',
            format: (text) => text,
            validate: (text) => !!text || 'Le texte ne peut pas être vide'
        },
        url: {
            name: 'URL',
            description: 'Lien web',
            placeholder: 'https://example.com',
            format: (url) => url.startsWith('http') ? url : `https://${url}`,
            validate: (url) => {
                if (!url) return 'L\'URL ne peut pas être vide';
                try {
                    // On essaie de construire une URL valide
                    new URL(url.startsWith('http') ? url : `https://${url}`);
                    return true;
                } catch (e) {
                    return 'URL invalide';
                }
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
            },
            validate: (email) => {
                if (!email) return 'L\'email ne peut pas être vide';
                // Expression régulière simple pour la validation d'email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email) || 'Adresse email invalide';
            }
        },
        tel: {
            name: 'Téléphone',
            description: 'Numéro de téléphone',
            placeholder: '+33612345678',
            format: (tel) => `tel:${tel.replace(/\s+/g, '')}`,
            validate: (tel) => {
                if (!tel) return 'Le numéro de téléphone ne peut pas être vide';
                // Accepte les chiffres, +, espaces, tirets et parenthèses
                const telRegex = /^[+0-9\s\-()]+$/;
                return telRegex.test(tel) || 'Numéro de téléphone invalide';
            }
        },
        sms: {
            name: 'SMS',
            description: 'Message SMS avec numéro',
            placeholder: '+33612345678',
            format: (tel, message = '') => {
                let sms = `sms:${tel.replace(/\s+/g, '')}`;
                if (message) sms += `?body=${encodeURIComponent(message)}`;
                return sms;
            },
            validate: (tel) => {
                if (!tel) return 'Le numéro de téléphone ne peut pas être vide';
                const telRegex = /^[+0-9\s\-()]+$/;
                return telRegex.test(tel) || 'Numéro de téléphone invalide';
            }
        },
        wifi: {
            name: 'Wi-Fi',
            description: 'Configuration réseau Wi-Fi',
            placeholder: 'Nom du réseau',
            format: (ssid, password = '', encryption = 'WPA') => {
                return `WIFI:S:${ssid};T:${encryption};P:${password};;`;
            },
            validate: (ssid) => !!ssid || 'Le nom du réseau ne peut pas être vide'
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
            },
            validate: (data) => {
                if (!data.name) return 'Le nom ne peut pas être vide';
                return true;
            }
        },
        geo: {
            name: 'Géolocalisation',
            description: 'Coordonnées GPS',
            placeholder: 'Latitude',
            format: (lat, lon) => `geo:${lat},${lon}`,
            validate: (lat, lon) => {
                if (!lat || !lon) return 'La latitude et la longitude sont requises';
                // Vérifier que les coordonnées sont des nombres valides
                if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
                    return 'Les coordonnées doivent être des nombres valides';
                }
                // Vérifier que les coordonnées sont dans les plages valides
                if (parseFloat(lat) < -90 || parseFloat(lat) > 90) {
                    return 'La latitude doit être entre -90 et 90';
                }
                if (parseFloat(lon) < -180 || parseFloat(lon) > 180) {
                    return 'La longitude doit être entre -180 et 180';
                }
                return true;
            }
        }
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadQRCodeLibrary()
            .then(() => {
                this.state.libraryLoaded = true;
                this.loadState();
                this.setupListeners();
                this.updateUIForType();
                
                // Génère le QR code initial si un texte est disponible
                if (this.state.text) {
                    this.generate();
                }
                
                // Mise à jour initiale de l'interface
                this.updateInputValues();
            })
            .catch(error => {
                console.error('Erreur lors du chargement de la bibliothèque QR Code:', error);
                Utils.showNotification('Erreur lors du chargement du générateur de QR codes', 'error');
                this.showErrorInQROutput('Impossible de charger la bibliothèque QR Code. Veuillez réessayer plus tard.');
            });
    },

    /**
     * Charge la bibliothèque QR Code
     */
    async loadQRCodeLibrary() {
        // Affiche l'animation de chargement
        this.showLoadingInQROutput();
        
        return new Promise((resolve, reject) => {
            // Vérifie si la bibliothèque est déjà chargée
            if (window.QRCode) {
                this.hideLoadingInQROutput();
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
            
            script.onload = () => {
                this.hideLoadingInQROutput();
                resolve();
            };
            
            script.onerror = () => {
                this.hideLoadingInQROutput();
                reject(new Error('Échec du chargement de la bibliothèque QR Code'));
            };
            
            document.head.appendChild(script);
        });
    },

    /**
     * Affiche l'animation de chargement
     */
    showLoadingInQROutput() {
        this.state.isLoading = true;
        const output = document.getElementById('qrcodeOutput');
        if (!output) return;
        
        output.innerHTML = `
            <div class="qrcode-loading">
                <div></div>
                <div></div>
            </div>
            <p>Chargement...</p>
        `;
    },

    /**
     * Cache l'animation de chargement
     */
    hideLoadingInQROutput() {
        this.state.isLoading = false;
        // Ne pas effacer directement, cela sera fait lors de la génération
    },

    /**
     * Affiche un message d'erreur dans la zone du QR code
     */
    showErrorInQROutput(message) {
        const output = document.getElementById('qrcodeOutput');
        if (!output) return;
        
        output.innerHTML = `
            <div class="qrcode-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message || 'Une erreur est survenue'}</p>
            </div>
        `;
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        try {
            const savedState = Utils.loadFromStorage('qrcodeState', {
                text: '',
                type: 'text',
                options: this.state.options,
                history: []
            });

            this.state = { 
                ...this.state, 
                text: savedState.text || '',
                type: savedState.type || 'text',
                options: { ...this.state.options, ...savedState.options },
                history: savedState.history || []
            };
        } catch (error) {
            console.error('Erreur lors du chargement de l\'état:', error);
            // Continuer avec l'état par défaut
        }
    },

    /**
     * Met à jour les valeurs des champs d'entrée
     */
    updateInputValues() {
        // Texte
        const textInput = document.getElementById('qrcodeText');
        if (textInput) textInput.value = this.state.text;
        
        // Type
        const typeSelect = document.getElementById('qrcodeType');
        if (typeSelect) typeSelect.value = this.state.type;
        
        // Options
        const sizeInput = document.getElementById('qrcodeSize');
        if (sizeInput) {
            sizeInput.value = this.state.options.size;
            const sizeLabel = document.getElementById('qrcodeSizeValue');
            if (sizeLabel) sizeLabel.textContent = `${this.state.options.size} px`;
        }
        
        const marginInput = document.getElementById('qrcodeMargin');
        if (marginInput) {
            marginInput.value = this.state.options.margin;
            const marginLabel = document.getElementById('qrcodeMarginValue');
            if (marginLabel) marginLabel.textContent = this.state.options.margin.toString();
        }
        
        const colorInput = document.getElementById('qrcodeColor');
        if (colorInput) colorInput.value = this.state.options.color;
        
        const backgroundInput = document.getElementById('qrcodeBackground');
        if (backgroundInput) backgroundInput.value = this.state.options.background;
        
        const errorLevelSelect = document.getElementById('qrcodeErrorLevel');
        if (errorLevelSelect) errorLevelSelect.value = this.state.options.errorCorrectionLevel;
        
        const formatSelect = document.getElementById('qrcodeFormat');
        if (formatSelect) formatSelect.value = this.state.options.format;
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
            const size = parseInt(e.target.value, 10);
            this.updateOption('size', size);
            // Mise à jour de l'affichage de la valeur
            const sizeValue = document.getElementById('qrcodeSizeValue');
            if (sizeValue) sizeValue.textContent = `${size} px`;
        });

        document.getElementById('qrcodeMargin')?.addEventListener('input', (e) => {
            const margin = parseInt(e.target.value, 10);
            this.updateOption('margin', margin);
            // Mise à jour de l'affichage de la valeur
            const marginValue = document.getElementById('qrcodeMarginValue');
            if (marginValue) marginValue.textContent = margin.toString();
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

        // Nettoyage de l'historique
        document.querySelector('.qrcode-history .clear-btn')?.addEventListener('click', () => {
            this.clearHistory();
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
     * Met à jour l'interface utilisateur en fonction du type sélectionné
     */
    updateUIForType() {
        const currentType = this.state.type;
        const typeInfo = this.types[currentType];
        
        const textInput = document.getElementById('qrcodeText');
        if (textInput) textInput.placeholder = typeInfo.placeholder;
    },

    /**
     * Vérifie si le générateur est visible
     */
    isQRCodeGeneratorVisible() {
        const generator = document.getElementById('qrcodeTool');
        return generator?.classList.contains('active') || generator?.style.display !== 'none';
    },

    /**
     * Met à jour le type de données
     */
    updateType(type) {
        if (!this.types[type]) return;

        this.state.type = type;
        this.updateUIForType();
        
        // Génération en temps réel
        this.debouncedGenerate();
        this.saveState();
    },

    /**
     * Met à jour le texte
     */
    updateText(text) {
        this.state.text = text;
        
        // Génération en temps réel avec un délai
        this.debouncedGenerate();
        this.saveState();
    },

    /**
     * Génération différée pour éviter les appels trop fréquents
     */
    debouncedGenerate: function() {
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        
        this._debounceTimer = setTimeout(() => {
            this.generate();
        }, 500); // Délai de 500ms
    },

    /**
     * Met à jour une option
     */
    updateOption(option, value) {
        this.state.options[option] = value;
        
        // Génération en temps réel
        this.debouncedGenerate();
        this.saveState();
    },

    /**
     * Valide les données en fonction du type
     */
    validateData() {
        const type = this.types[this.state.type];
        if (!type) return 'Type non supporté';

        // Validation spécifique au type
        return type.validate ? type.validate(this.state.text) : true;
    },

    /**
     * Génère le QR code
     */
    async generate() {
        if (!this.state.libraryLoaded) {
            await this.loadQRCodeLibrary();
        }
        
        if (!window.QRCode) {
            this.showErrorInQROutput('La bibliothèque QR Code n\'est pas disponible');
            return;
        }
        
        if (!this.state.text) {
            this.showErrorInQROutput('Veuillez entrer du contenu pour générer un QR code');
            return;
        }

        // Validation des données
        const validationResult = this.validateData();
        if (validationResult !== true) {
            this.showErrorInQROutput(validationResult);
            return;
        }

        const output = document.getElementById('qrcodeOutput');
        if (!output) return;

        // Affiche l'animation de chargement
        this.showLoadingInQROutput();

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
                
                // Ajoute des classes CSS pour l'animation
                const svgElement = output.querySelector('svg');
                if (svgElement) {
                    svgElement.classList.add('qrcode-animation');
                }
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
                canvas.classList.add('qrcode-animation');
                output.appendChild(canvas);
            }

            // Ajoute à l'historique (seulement si l'opération a réussi)
            this.addToHistory();
            
            // Notification de succès
            Utils.showNotification('QR code généré avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la génération du QR code:', error);
            this.showErrorInQROutput(error.message || 'Erreur lors de la génération du QR code');
            Utils.showNotification('Erreur lors de la génération du QR code', 'error');
        }
    },

    /**
     * Télécharge le QR code
     */
    download() {
        const output = document.getElementById('qrcodeOutput');
        if (!output?.firstChild) {
            Utils.showNotification('Aucun QR code à télécharger', 'warning');
            return;
        }

        try {
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
                if (!canvas) {
                    Utils.showNotification('Aucun QR code à télécharger', 'warning');
                    return;
                }
                link.href = canvas.toDataURL('image/png');
                link.download = `${filename}.png`;
            }

            link.click();
            URL.revokeObjectURL(link.href);
            
            // Notification de succès
            Utils.showNotification('QR code téléchargé', 'success');
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            Utils.showNotification('Erreur lors du téléchargement du QR code', 'error');
        }
    },

    /**
     * Ajoute le QR code à l'historique
     */
    addToHistory() {
        // Évite les doublons consécutifs
        if (this.state.history.length > 0) {
            const lastEntry = this.state.history[0];
            if (lastEntry.text === this.state.text && lastEntry.type === this.state.type) {
                // Met à jour uniquement le timestamp
                lastEntry.timestamp = new Date().toISOString();
                this.updateHistoryDisplay();
                this.saveState();
                return;
            }
        }
        
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
     * Efface l'historique
     */
    clearHistory() {
        if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique des QR codes ?')) {
            this.state.history = [];
            this.updateHistoryDisplay();
            this.saveState();
            Utils.showNotification('Historique effacé', 'info');
        }
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('qrcodeHistory');
        if (!container) return;

        if (this.state.history.length === 0) {
            container.innerHTML = '<div class="empty-history">Aucun QR code dans l\'historique</div>';
            return;
        }

        container.innerHTML = this.state.history
            .map((entry, index) => `
                <div class="history-item" onclick="qrcodeManager.useHistoryEntry(${index})">
                    <div class="history-preview">
                        <div class="qrcode-preview">
                            ${entry.text.substring(0, 30)}${entry.text.length > 30 ? '...' : ''}
                        </div>
                    </div>
                    <div class="history-meta">
                        <span class="history-type">
                            ${this.types[entry.type].name}
                        </span>
                        <span class="history-date">
                            ${this.formatDate(entry.timestamp)}
                        </span>
                    </div>
                </div>
            `)
            .join('');
    },

    /**
     * Formatte une date pour l'affichage
     */
    formatDate(timestamp) {
        try {
            const date = new Date(timestamp);
            
            // Si la date est aujourd'hui, affiche seulement l'heure
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            }
            
            // Sinon affiche la date complète
            return date.toLocaleString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit',
                hour: '2-digit', 
                minute: '2-digit'
            });
        } catch (e) {
            return timestamp;
        }
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
        this.updateInputValues();
        this.updateUIForType();
        
        // Génère le QR code
        this.generate();
        
        // Notification
        Utils.showNotification('QR code restauré depuis l\'historique', 'info');
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
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this.saveState();
    }
}; 