import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de QR codes
 */
export const QRCodeManager = {
    state: {
        text: '',
        type: 'url', // text | url | email | tel | sms | wifi | vcard | geo
        options: {
            size: 256,
            margin: 4,
            color: '#000000',
            background: '#FFFFFF',
            errorCorrectionLevel: 'M', // L | M | Q | H
            format: 'svg', // svg | png
            logo: null,
            logoSize: 20, // en pourcentage
            logoBorder: true
        },
        lastGenerated: null,
        history: [],
        isGenerating: false,
        activeTab: 'url'
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
            placeholder: 'https://exemple.com',
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
            placeholder: 'email@exemple.com',
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
            format: (ssid, password = '', encryption = 'WPA', hidden = false) => {
                return `WIFI:S:${ssid};T:${encryption};P:${password};H:${hidden ? 'true' : 'false'};;`;
            }
        },
        vcard: {
            name: 'vCard',
            description: 'Carte de visite',
            placeholder: 'Nom',
            format: (data) => {
                const { name, org, title, tel, email, url, address, note } = data;
                return [
                    'BEGIN:VCARD',
                    'VERSION:3.0',
                    `FN:${name || ''}`,
                    org ? `ORG:${org}` : '',
                    title ? `TITLE:${title}` : '',
                    tel ? `TEL:${tel}` : '',
                    email ? `EMAIL:${email}` : '',
                    url ? `URL:${url}` : '',
                    address ? `ADR:;;${address};;;` : '',
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
        try {
            this.loadState();
            this.setupEventListeners();
            
            // Charge la bibliothèque QR Code
            this.loadQRCodeLibrary()
                .then(() => {
                    console.log('Bibliothèque QR Code chargée avec succès');
                    this.setupTabNavigation();
                    this.updateRangeValues();
                    this.updateHistoryDisplay();
                    
                    // Remplit le champ URL par défaut si vide
                    if (!this.state.text) {
                        this.state.text = 'https://hzc23.github.io/outilspratiques.github.io/';
                        
                        // Met à jour le champ de texte selon l'onglet actif
                        const inputEl = document.getElementById('urlInput');
                        if (inputEl) inputEl.value = this.state.text;
                        
                        // Initialisation du générateur
                        this.generate();
                    } else {
                        // Restaure les données précédentes
                        this.updateTabInputs();
                        this.generate();
                    }
                })
                .catch(error => {
                    console.error('Erreur lors du chargement de la bibliothèque QR Code:', error);
                    this.showError('Impossible de charger la bibliothèque QR Code. Veuillez actualiser la page et réessayer.');
                    this.handleLibraryLoadingError();
                });
        } catch (error) {
            console.error('Erreur d\'initialisation du générateur QR Code:', error);
            this.showError('Une erreur est survenue lors de l\'initialisation. Veuillez actualiser la page.');
        }
    },

    /**
     * Gère l'erreur de chargement de la bibliothèque
     */
    handleLibraryLoadingError() {
        const outputEl = document.getElementById('qrcodeOutput');
        if (outputEl) {
            outputEl.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Impossible de charger la bibliothèque QR Code</p>
                    <button type="button" class="btn btn-primary" onclick="QRCodeManager.retryLoadLibrary()">
                        <i class="fas fa-sync-alt"></i> Réessayer
                    </button>
                </div>
            `;
        }
        
        // Désactive les boutons
        const buttons = document.querySelectorAll('#generateQrCode, #downloadQrCode');
        buttons.forEach(btn => {
            btn.disabled = true;
        });
    },
    
    /**
     * Réessaie de charger la bibliothèque
     */
    retryLoadLibrary() {
        this.loadQRCodeLibrary()
            .then(() => {
                console.log('Bibliothèque QR Code chargée avec succès après nouveau essai');
                this.showSuccess('Bibliothèque chargée avec succès');
                
                // Réactive les boutons
                const buttons = document.querySelectorAll('#generateQrCode, #downloadQrCode');
                buttons.forEach(btn => {
                    btn.disabled = false;
                });
                
                // Génère le QR code
                this.generate();
            })
            .catch(error => {
                console.error('Échec du rechargement de la bibliothèque QR Code:', error);
                this.showError('Échec du chargement. Veuillez vérifier votre connexion internet.');
            });
    },

    /**
     * Charge la bibliothèque QR Code avec une stratégie de repli
     */
    async loadQRCodeLibrary() {
        return new Promise((resolve, reject) => {
            // Vérifie si la bibliothèque est déjà chargée
            if (window.QRCode) {
                resolve();
                return;
            }
            
            // Sources alternatives pour la bibliothèque
            const sources = [
                'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js',
                'https://unpkg.com/qrcode/build/qrcode.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
            ];
            
            let loadedSuccessfully = false;
            let attemptsCount = 0;
            
            // Fonction pour essayer de charger depuis une source
            const trySource = (index) => {
                if (loadedSuccessfully || index >= sources.length) {
                    if (!loadedSuccessfully) {
                        reject(new Error('Toutes les tentatives de chargement ont échoué'));
                    }
                    return;
                }
                
                attemptsCount++;
                const script = document.createElement('script');
                script.src = sources[index];
                script.async = true;
                
                // Définit un timeout pour chaque tentative
                const timeout = setTimeout(() => {
                    console.warn(`Timeout lors du chargement depuis ${sources[index]}`);
                    trySource(index + 1);
                }, 5000);
                
                script.onload = () => {
                    clearTimeout(timeout);
                    console.log(`Bibliothèque QR Code chargée depuis ${sources[index]}`);
                    loadedSuccessfully = true;
                    resolve();
                };
                
                script.onerror = () => {
                    clearTimeout(timeout);
                    console.warn(`Échec du chargement depuis ${sources[index]}`);
                    trySource(index + 1);
                };
                
                document.head.appendChild(script);
            };
            
            // Commence avec la première source
            trySource(0);
        });
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Boutons d'action principaux
        document.getElementById('generateQrCode')?.addEventListener('click', () => {
            this.generate();
        });

        document.getElementById('downloadQrCode')?.addEventListener('click', () => {
            this.download();
        });
        
        // Options du menu déroulant de téléchargement
        document.querySelectorAll('#downloadOptions .dropdown-item')?.forEach(item => {
            item.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                this.download(format);
            });
        });
        
        // Affichage du menu déroulant
        document.getElementById('downloadQrCode')?.addEventListener('click', (e) => {
            const menu = document.getElementById('downloadOptions');
            if (menu) {
                menu.classList.toggle('show');
                e.stopPropagation();
            }
        });
        
        // Ferme le menu déroulant en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                const dropdowns = document.querySelectorAll('.dropdown-menu.show');
                dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
            }
        });
        
        // Panneau d'aide
        document.getElementById('qrcodeHelp')?.addEventListener('click', () => {
            const helpPanel = document.getElementById('qrcodeHelpPanel');
            if (helpPanel) helpPanel.classList.add('show');
        });
        
        document.getElementById('closeQrcodeHelp')?.addEventListener('click', () => {
            const helpPanel = document.getElementById('qrcodeHelpPanel');
            if (helpPanel) helpPanel.classList.remove('show');
        });

        // Impression
        document.getElementById('printQrCode')?.addEventListener('click', () => {
            this.printQRCode();
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isQRCodeGeneratorVisible()) return;

            // Génération avec Ctrl+Enter
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generate();
            }
            
            // Ferme le panneau d'aide avec Echap
            if (e.key === 'Escape') {
                const helpPanel = document.getElementById('qrcodeHelpPanel');
                if (helpPanel && helpPanel.classList.contains('show')) {
                    helpPanel.classList.remove('show');
                }
            }
        });
        
        // Écouteurs pour les champs d'entrée
        document.getElementById('urlInput')?.addEventListener('input', (e) => {
            this.updateInputValue(e.target.value);
        });
        
        document.getElementById('textInput')?.addEventListener('input', (e) => {
            this.updateInputValue(e.target.value);
        });
        
        // Toggle mot de passe WiFi
        document.getElementById('toggleWifiPassword')?.addEventListener('click', () => {
            const passwordField = document.getElementById('wifiPassword');
            if (passwordField) {
                const type = passwordField.type === 'password' ? 'text' : 'password';
                passwordField.type = type;
                
                // Change l'icône
                const icon = document.querySelector('#toggleWifiPassword i');
                if (icon) {
                    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            }
        });
        
        // Options QR code
        document.getElementById('qrSize')?.addEventListener('input', (e) => {
            this.updateOption('size', parseInt(e.target.value, 10));
            document.getElementById('qrSizeValue').textContent = `${e.target.value} px`;
        });
        
        document.getElementById('errorCorrectionLevel')?.addEventListener('change', (e) => {
            this.updateOption('errorCorrectionLevel', e.target.value);
        });
        
        // Gestion des couleurs
        document.getElementById('foregroundColor')?.addEventListener('input', (e) => {
            this.updateOption('color', e.target.value);
            document.getElementById('foregroundColorText').value = e.target.value;
        });
        
        document.getElementById('foregroundColorText')?.addEventListener('input', (e) => {
            if (this.validateHexColor(e.target.value)) {
                this.updateOption('color', e.target.value);
                document.getElementById('foregroundColor').value = e.target.value;
            }
        });
        
        document.getElementById('backgroundColor')?.addEventListener('input', (e) => {
            this.updateOption('background', e.target.value);
            document.getElementById('backgroundColorText').value = e.target.value;
        });
        
        document.getElementById('backgroundColorText')?.addEventListener('input', (e) => {
            if (this.validateHexColor(e.target.value)) {
                this.updateOption('background', e.target.value);
                document.getElementById('backgroundColor').value = e.target.value;
            }
        });
        
        // Gestion du logo
        document.getElementById('logoUpload')?.addEventListener('change', (e) => {
            this.handleLogoUpload(e);
        });
        
        document.getElementById('logoSize')?.addEventListener('input', (e) => {
            this.updateOption('logoSize', parseInt(e.target.value, 10));
            document.getElementById('logoSizeValue').textContent = `${e.target.value}%`;
        });
        
        document.getElementById('logoBorder')?.addEventListener('change', (e) => {
            this.updateOption('logoBorder', e.target.checked);
        });
    },
    
    /**
     * Configure la navigation par onglets
     */
    setupTabNavigation() {
        // Récupère tous les boutons d'onglet
        const tabButtons = document.querySelectorAll('.qrcode-tabs .tab-btn');
        
        // Ajoute les écouteurs d'événements
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Retire la classe active de tous les onglets
                tabButtons.forEach(tab => tab.classList.remove('active'));
                
                // Ajoute la classe active à l'onglet cliqué
                btn.classList.add('active');
                
                // Met à jour l'onglet actif
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
    },
    
    /**
     * Change d'onglet
     */
    switchTab(tabId) {
        // Désactive tous les panneaux
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Active le panneau correspondant
        const activePane = document.getElementById(`${tabId}Tab`);
        if (activePane) activePane.classList.add('active');
        
        // Met à jour l'état
        this.state.activeTab = tabId;
        this.state.type = this.mapTabToType(tabId);
        
        // Met à jour les champs d'entrée
        this.updateTabInputs();
    },
    
    /**
     * Mappe l'onglet au type de données QR
     */
    mapTabToType(tabId) {
        const mapping = {
            'url': 'url',
            'text': 'text',
            'contact': 'vcard',
            'wifi': 'wifi'
        };
        
        return mapping[tabId] || 'text';
    },
    
    /**
     * Met à jour les champs d'entrée en fonction de l'onglet actif
     */
    updateTabInputs() {
        const tabId = this.state.activeTab;
        
        if (tabId === 'url') {
            const urlInput = document.getElementById('urlInput');
            if (urlInput && this.state.type === 'url') urlInput.value = this.state.text;
        } else if (tabId === 'text') {
            const textInput = document.getElementById('textInput');
            if (textInput && this.state.type === 'text') textInput.value = this.state.text;
        } else if (tabId === 'wifi') {
            // Pour l'instant vide, sera implémenté pour stocker les informations WiFi
        } else if (tabId === 'contact') {
            // Pour l'instant vide, sera implémenté pour stocker les informations de contact
        }
    },

    /**
     * Valide le format d'une couleur hexadécimale
     */
    validateHexColor(color) {
        return /^#([0-9A-F]{3}){1,2}$/i.test(color);
    },
    
    /**
     * Gère le téléchargement d'un logo
     */
    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Vérifie le type de fichier
        if (!file.type.match('image.*')) {
            this.showError('Veuillez sélectionner une image');
            return;
        }
        
        // Vérifie la taille du fichier (max 1MB)
        if (file.size > 1024 * 1024) {
            this.showError('L\'image est trop volumineuse (max 1MB)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Affiche l'aperçu
            const logoPreview = document.getElementById('logoPreview');
            if (logoPreview) {
                logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo">`;
            }
            
            // Stocke le logo dans l'état
            this.state.options.logo = e.target.result;
            
            // Affiche les options du logo
            const logoOptions = document.getElementById('logoOptions');
            if (logoOptions) logoOptions.style.display = 'block';
            
            // Recommande un niveau de correction d'erreur élevé
            if (this.state.options.errorCorrectionLevel === 'L' || this.state.options.errorCorrectionLevel === 'M') {
                this.showError('Pour utiliser un logo, il est recommandé d\'utiliser un niveau de correction d\'erreur élevé ou maximum');
                const errorLevelSelect = document.getElementById('errorCorrectionLevel');
                if (errorLevelSelect) errorLevelSelect.value = 'H';
                this.state.options.errorCorrectionLevel = 'H';
            }
            
            // Régénère le QR code
            this.generate();
        };
        
        reader.onerror = () => {
            this.showError('Erreur lors de la lecture du fichier');
        };
        
        reader.readAsDataURL(file);
    },
    
    /**
     * Imprime le QR code
     */
    printQRCode() {
        if (!this.state.lastGenerated) {
            this.showError('Veuillez d\'abord générer un QR code');
            return;
        }
        
        try {
            // Crée une fenêtre d'impression
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                this.showError('Veuillez autoriser les fenêtres pop-up pour l\'impression');
                return;
            }
            
            // Contenu HTML pour l'impression
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>QR Code - Impression</title>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            text-align: center;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                        }
                        h1 {
                            font-size: 18px;
                            margin-bottom: 20px;
                        }
                        .qrcode {
                            padding: 20px;
                            background: white;
                            display: inline-block;
                            border: 1px solid #ccc;
                        }
                        .text {
                            margin-top: 15px;
                            word-break: break-all;
                            font-size: 14px;
                        }
                        @media print {
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>QR Code</h1>
                        <div class="qrcode">
                            ${this.state.lastGenerated.format === 'svg' 
                                ? this.state.lastGenerated.data 
                                : `<img src="${this.state.lastGenerated.canvas.toDataURL('image/png')}" alt="QR Code">`
                            }
                        </div>
                        <div class="text">
                            ${this.state.lastGenerated.text}
                        </div>
                        <div class="no-print" style="margin-top: 30px;">
                            <button onclick="window.print();setTimeout(window.close, 500);">Imprimer</button>
                            <button onclick="window.close();">Fermer</button>
                        </div>
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
        } catch (error) {
            console.error('Erreur lors de l\'impression du QR code:', error);
            this.showError('Erreur lors de l\'impression du QR code');
        }
    },

    /**
     * Met à jour les valeurs des curseurs
     */
    updateRangeValues() {
        const sizeValue = document.getElementById('qrSizeValue');
        if (sizeValue) sizeValue.textContent = `${this.state.options.size} px`;
        
        const logoSizeValue = document.getElementById('logoSizeValue');
        if (logoSizeValue) logoSizeValue.textContent = `${this.state.options.logoSize}%`;
        
        // Met à jour les valeurs des champs
        const sizeInput = document.getElementById('qrSize');
        if (sizeInput) sizeInput.value = this.state.options.size;
        
        const logoSizeInput = document.getElementById('logoSize');
        if (logoSizeInput) logoSizeInput.value = this.state.options.logoSize;
        
        const logoBorderInput = document.getElementById('logoBorder');
        if (logoBorderInput) logoBorderInput.checked = this.state.options.logoBorder;
        
        const foregroundColorInput = document.getElementById('foregroundColor');
        if (foregroundColorInput) foregroundColorInput.value = this.state.options.color;
        
        const foregroundColorTextInput = document.getElementById('foregroundColorText');
        if (foregroundColorTextInput) foregroundColorTextInput.value = this.state.options.color;
        
        const backgroundColorInput = document.getElementById('backgroundColor');
        if (backgroundColorInput) backgroundColorInput.value = this.state.options.background;
        
        const backgroundColorTextInput = document.getElementById('backgroundColorText');
        if (backgroundColorTextInput) backgroundColorTextInput.value = this.state.options.background;
        
        const errorLevelInput = document.getElementById('errorCorrectionLevel');
        if (errorLevelInput) errorLevelInput.value = this.state.options.errorCorrectionLevel;
    },

    /**
     * Vérifie si le générateur est visible
     */
    isQRCodeGeneratorVisible() {
        const generator = document.getElementById('qrcodeTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour la valeur d'entrée selon l'onglet actif
     */
    updateInputValue(value) {
        this.state.text = value;
        this.debouncedGenerate();
    },
    
    /**
     * Version avec debounce de la génération pour éviter trop d'appels
     */
    debouncedGenerate: function() {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
            this.generate();
        }, 500);
    },

    /**
     * Met à jour une option
     */
    updateOption(option, value) {
        this.state.options[option] = value;
        
        // Certaines options nécessitent une régénération immédiate
        if (['logoSize', 'logoBorder', 'size', 'margin', 'color', 'background', 'errorCorrectionLevel'].includes(option)) {
            this.debouncedGenerate();
        }
        
        this.saveState();
    },

    /**
     * Génère le QR code
     */
    async generate() {
        const outputEl = document.getElementById('qrcodeOutput');
        if (!outputEl) return;
        
        // Évite les générations multiples simultanées
        if (this.state.isGenerating) return;
        this.state.isGenerating = true;

        try {
            // Affiche un indicateur de chargement
            outputEl.innerHTML = `<div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i></div>`;
            
            // Vérifie si la bibliothèque est chargée
            if (!window.QRCode) {
                await this.loadQRCodeLibrary();
            }

            // Validation des données
            if (!this.getInputValueForCurrentTab().trim()) {
                outputEl.innerHTML = `<div class="empty-state">Entrez du contenu pour générer un QR code</div>`;
                this.state.isGenerating = false;
                return;
            }

            // Formate le texte selon le type
            let formattedText = '';
            
            try {
                formattedText = this.getFormattedTextForCurrentTab();
            } catch (error) {
                console.error('Erreur de formatage:', error);
                this.showError('Erreur de formatage: ' + error.message);
                outputEl.innerHTML = `<div class="error-state">Erreur de formatage du contenu</div>`;
                this.state.isGenerating = false;
                return;
            }
            
            // Options pour la génération du QR code
            const options = {
                width: this.state.options.size,
                height: this.state.options.size,
                margin: 4, // Marge fixe pour éviter les problèmes de lecture
                color: {
                    dark: this.state.options.color,
                    light: this.state.options.background
                },
                errorCorrectionLevel: this.state.options.errorCorrectionLevel
            };

            // Génère le QR code selon le format choisi
            this.createQRCode(formattedText, options, outputEl);
        } catch (error) {
            console.error('Erreur lors de la génération du QR code:', error);
            this.showError('Erreur lors de la génération du QR code: ' + error.message);
            outputEl.innerHTML = `<div class="error-state">Erreur de génération</div>`;
            this.state.isGenerating = false;
        }
    },
    
    /**
     * Récupère la valeur d'entrée pour l'onglet actif
     */
    getInputValueForCurrentTab() {
        const activeTab = this.state.activeTab;
        
        switch (activeTab) {
            case 'url':
                return document.getElementById('urlInput')?.value || '';
            case 'text':
                return document.getElementById('textInput')?.value || '';
            case 'wifi':
                const ssid = document.getElementById('wifiSsid')?.value || '';
                return ssid;
            case 'contact':
                const name = document.getElementById('contactName')?.value || '';
                return name;
            default:
                return this.state.text;
        }
    },
    
    /**
     * Formate le texte selon l'onglet actif
     */
    getFormattedTextForCurrentTab() {
        const activeTab = this.state.activeTab;
        
        switch (activeTab) {
            case 'url':
                const url = document.getElementById('urlInput')?.value || '';
                return this.types.url.format(url);
                
            case 'text':
                const text = document.getElementById('textInput')?.value || '';
                return this.types.text.format(text);
                
            case 'wifi':
                const ssid = document.getElementById('wifiSsid')?.value || '';
                const password = document.getElementById('wifiPassword')?.value || '';
                const encryption = document.getElementById('wifiEncryption')?.value || 'WPA';
                const hidden = document.getElementById('wifiHidden')?.checked || false;
                
                if (!ssid) throw new Error('Le nom du réseau (SSID) est requis');
                return this.types.wifi.format(ssid, password, encryption, hidden);
                
            case 'contact':
                const name = document.getElementById('contactName')?.value || '';
                const phone = document.getElementById('contactPhone')?.value || '';
                const email = document.getElementById('contactEmail')?.value || '';
                const address = document.getElementById('contactAddress')?.value || '';
                const website = document.getElementById('contactWebsite')?.value || '';
                
                if (!name) throw new Error('Le nom est requis');
                
                return this.types.vcard.format({
                    name,
                    tel: phone,
                    email,
                    address,
                    url: website
                });
                
            default:
                return this.state.text;
        }
    },
    
    /**
     * Crée le QR code avec ou sans logo
     */
    createQRCode(formattedText, options, outputEl) {
        // Préparation pour l'ajout du logo
        const hasLogo = this.state.options.logo !== null;
        
        // Format SVG
        if (this.state.options.format === 'svg') {
            QRCode.toString(formattedText, {
                ...options,
                type: 'svg'
            }, (error, svg) => {
                if (error) {
                    console.error('Erreur lors de la génération du QR code SVG:', error);
                    this.showError('Erreur lors de la génération du QR code');
                    this.state.isGenerating = false;
                    return;
                }
                
                if (hasLogo) {
                    // Pour SVG + logo, on crée un canvas temporaire et on ajoute le logo dessus
                    this.createCanvasWithLogo(formattedText, options, outputEl);
                } else {
                    outputEl.innerHTML = svg;
                    this.state.lastGenerated = { 
                        data: svg, 
                        format: 'svg',
                        text: formattedText
                    };
                    
                    // Ajoute à l'historique
                    this.addToHistory();
                    this.state.isGenerating = false;
                }
            });
        } else {
            // Format Canvas (PNG)
            outputEl.innerHTML = '';
            const canvas = document.createElement('canvas');
            outputEl.appendChild(canvas);
            
            QRCode.toCanvas(canvas, formattedText, {
                ...options
            }, (error) => {
                if (error) {
                    console.error('Erreur lors de la génération du QR code canvas:', error);
                    this.showError('Erreur lors de la génération du QR code');
                    this.state.isGenerating = false;
                    return;
                }
                
                if (hasLogo) {
                    // Ajoute le logo au canvas
                    this.addLogoToCanvas(canvas, () => {
                        this.state.lastGenerated = { 
                            canvas: canvas, 
                            format: 'png',
                            text: formattedText
                        };
                        
                        // Ajoute à l'historique
                        this.addToHistory();
                        this.state.isGenerating = false;
                    });
                } else {
                    this.state.lastGenerated = { 
                        canvas: canvas, 
                        format: 'png',
                        text: formattedText
                    };
                    
                    // Ajoute à l'historique
                    this.addToHistory();
                    this.state.isGenerating = false;
                }
            });
        }
    },
    
    /**
     * Crée un canvas avec un QR code et y ajoute un logo
     */
    createCanvasWithLogo(text, options, outputEl) {
        // Crée un canvas temporaire pour le QR code
        const tempCanvas = document.createElement('canvas');
        
        QRCode.toCanvas(tempCanvas, text, {
            ...options
        }, (error) => {
            if (error) {
                console.error('Erreur lors de la génération du QR code canvas pour logo:', error);
                this.showError('Erreur lors de l\'ajout du logo');
                this.state.isGenerating = false;
                return;
            }
            
            // Ajoute le logo au canvas
            this.addLogoToCanvas(tempCanvas, () => {
                // Affiche le canvas
                outputEl.innerHTML = '';
                outputEl.appendChild(tempCanvas);
                
                this.state.lastGenerated = { 
                    canvas: tempCanvas, 
                    format: 'png',
                    text: text
                };
                
                // Ajoute à l'historique
                this.addToHistory();
                this.state.isGenerating = false;
            });
        });
    },
    
    /**
     * Ajoute un logo au centre du canvas
     */
    addLogoToCanvas(canvas, callback) {
        if (!this.state.options.logo) {
            if (callback) callback();
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const logoImg = new Image();
        logoImg.crossOrigin = 'Anonymous';
        
        logoImg.onload = () => {
            // Calcule la taille du logo en fonction du pourcentage défini
            const logoSize = Math.min(canvas.width, canvas.height) * (this.state.options.logoSize / 100);
            
            // Coordonnées pour centrer le logo
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            
            // Si une bordure est demandée
            if (this.state.options.logoBorder) {
                // Dessine un cercle blanc légèrement plus grand que le logo
                const padding = logoSize * 0.1;
                ctx.fillStyle = this.state.options.background;
                ctx.beginPath();
                ctx.arc(
                    x + logoSize / 2, 
                    y + logoSize / 2, 
                    logoSize / 2 + padding, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
            
            // Dessine le logo
            ctx.drawImage(logoImg, x, y, logoSize, logoSize);
            
            if (callback) callback();
        };
        
        logoImg.onerror = () => {
            console.error('Erreur lors du chargement du logo');
            this.showError('Erreur lors du chargement du logo');
            if (callback) callback();
        };
        
        logoImg.src = this.state.options.logo;
    },

    /**
     * Télécharge le QR code
     */
    download(format = 'png') {
        if (!this.state.lastGenerated) {
            this.showError('Veuillez d\'abord générer un QR code');
            return;
        }
        
        try {
            const link = document.createElement('a');
            
            // Nom du fichier avec la date
            const dateStr = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            let filename = `qrcode-${dateStr}`;
            
            switch (format) {
                case 'svg':
                    // Téléchargement en SVG
                    if (this.state.lastGenerated.format === 'svg' && !this.state.options.logo) {
                        const blob = new Blob([this.state.lastGenerated.data], { type: 'image/svg+xml' });
                        link.href = URL.createObjectURL(blob);
                        link.download = `${filename}.svg`;
                    } else {
                        // Si on a un logo ou si le format généré n'est pas SVG, on exporte depuis le canvas
                        this.showNotice('Export en PNG car SVG ne supporte pas les logos');
                        const canvas = this.state.lastGenerated.canvas;
                        link.href = canvas.toDataURL('image/png');
                        link.download = `${filename}.png`;
                    }
                    break;
                    
                case 'jpg':
                    // Téléchargement en JPG
                    if (!this.state.lastGenerated.canvas) {
                        // Si on n'a pas de canvas, on crée une image à partir du SVG
                        this.convertSvgToCanvas((canvas) => {
                            link.href = canvas.toDataURL('image/jpeg', 0.9);
                            link.download = `${filename}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        });
                        return;
                    } else {
                        link.href = this.state.lastGenerated.canvas.toDataURL('image/jpeg', 0.9);
                        link.download = `${filename}.jpg`;
                    }
                    break;
                    
                case 'pdf':
                    // Téléchargement en PDF (nécessite une bibliothèque PDF)
                    this.exportToPdf(filename);
                    return;
                    
                case 'png':
                default:
                    // Téléchargement en PNG (par défaut)
                    if (!this.state.lastGenerated.canvas) {
                        // Si on n'a pas de canvas, on crée une image à partir du SVG
                        this.convertSvgToCanvas((canvas) => {
                            link.href = canvas.toDataURL('image/png');
                            link.download = `${filename}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        });
                        return;
                    } else {
                        link.href = this.state.lastGenerated.canvas.toDataURL('image/png');
                        link.download = `${filename}.png`;
                    }
                    break;
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
     * Convertit un SVG en canvas pour l'exportation
     */
    convertSvgToCanvas(callback) {
        if (!this.state.lastGenerated || !this.state.lastGenerated.data) {
            this.showError('Aucun QR code SVG disponible');
            return;
        }
        
        const svg = this.state.lastGenerated.data;
        const img = new Image();
        const canvas = document.createElement('canvas');
        const size = this.state.options.size;
        
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Fond blanc
        ctx.fillStyle = this.state.options.background;
        ctx.fillRect(0, 0, size, size);
        
        img.onload = function() {
            ctx.drawImage(img, 0, 0, size, size);
            callback(canvas);
        };
        
        img.onerror = () => {
            this.showError('Erreur lors de la conversion du SVG');
        };
        
        // Encode le SVG pour l'URL
        const svgBlob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
        img.src = URL.createObjectURL(svgBlob);
    },
    
    /**
     * Exporte le QR code en PDF
     */
    exportToPdf(filename) {
        // Vérifier si jsPDF est disponible
        if (typeof jspdf === 'undefined') {
            // Charge dynamiquement jsPDF si nécessaire
            this.loadJsPdf()
                .then(() => {
                    this.createPdf(filename);
                })
                .catch(error => {
                    console.error('Erreur lors du chargement de jsPDF:', error);
                    this.showError('Impossible de créer un PDF. Essayez un autre format.');
                });
        } else {
            this.createPdf(filename);
        }
    },
    
    /**
     * Charge la bibliothèque jsPDF
     */
    loadJsPdf() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    /**
     * Crée un PDF avec le QR code
     */
    createPdf(filename) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Page title
            doc.setFontSize(16);
            doc.text('QR Code', 105, 20, { align: 'center' });
            
            // QR Code
            if (this.state.lastGenerated.canvas) {
                // À partir du canvas
                const imgData = this.state.lastGenerated.canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 65, 30, 80, 80);
            } else if (this.state.lastGenerated.data) {
                // Convertit d'abord le SVG en image pour l'ajouter au PDF
                this.convertSvgToCanvas((canvas) => {
                    const imgData = canvas.toDataURL('image/png');
                    doc.addImage(imgData, 'PNG', 65, 30, 80, 80);
                    
                    // Texte
                    doc.setFontSize(12);
                    
                    // Wrap le texte si nécessaire pour éviter qu'il ne sorte de la page
                    const textLines = doc.splitTextToSize(
                        this.state.lastGenerated.text, 
                        180
                    );
                    doc.text(textLines, 105, 120, { align: 'center' });
                    
                    // Sauvegarde du PDF
                    doc.save(`${filename}.pdf`);
                    this.showSuccess('PDF créé avec succès');
                });
                return;
            }
            
            // Texte
            doc.setFontSize(12);
            
            // Wrap le texte si nécessaire pour éviter qu'il ne sorte de la page
            const textLines = doc.splitTextToSize(
                this.state.lastGenerated.text, 
                180
            );
            doc.text(textLines, 105, 120, { align: 'center' });
            
            // Sauvegarde du PDF
            doc.save(`${filename}.pdf`);
            this.showSuccess('PDF créé avec succès');
        } catch (error) {
            console.error('Erreur lors de la création du PDF:', error);
            this.showError('Erreur lors de la création du PDF: ' + error.message);
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
                duration: 4000
            });
        } else {
            console.error(message);
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
        } else {
            console.log(message);
        }
    },
    
    /**
     * Affiche une notification d'information
     */
    showNotice(message) {
        if (window.notificationManager) {
            window.notificationManager.show({
                type: 'info',
                message: message,
                duration: 3000
            });
        } else {
            console.info(message);
        }
    },

    /**
     * Ajoute le QR code à l'historique
     */
    addToHistory() {
        // Vérifie si le QR code a été généré
        if (!this.state.lastGenerated) return;
        
        // Crée une miniature du QR code
        let thumbnail = null;
        
        try {
            // Si c'est un canvas, on l'utilise directement
            if (this.state.lastGenerated.canvas) {
                thumbnail = this.state.lastGenerated.canvas.toDataURL('image/png', 0.5);
            }
            // Si c'est un SVG, on le convertit en image data URL
            else if (this.state.lastGenerated.format === 'svg') {
                const svgString = this.state.lastGenerated.data;
                const svgBlob = new Blob([svgString], {type: 'image/svg+xml'});
                thumbnail = URL.createObjectURL(svgBlob);
            }
        } catch (error) {
            console.error('Erreur lors de la création de la miniature:', error);
        }
        
        // Crée une entrée d'historique
        const entry = {
            text: this.state.text,
            type: this.state.type,
            options: JSON.parse(JSON.stringify(this.state.options)), // Copie profonde
            thumbnail: thumbnail,
            timestamp: Date.now()
        };
        
        // Vérifie si l'entrée existe déjà (même texte et type)
        const existingIndex = this.state.history.findIndex(
            item => item.text === entry.text && item.type === entry.type
        );
        
        if (existingIndex !== -1) {
            // Met à jour l'entrée existante
            this.state.history[existingIndex] = entry;
        } else {
            // Ajoute la nouvelle entrée en premier
            this.state.history.unshift(entry);
            
            // Limite la taille de l'historique à 10 entrées
            if (this.state.history.length > 10) {
                // Libère les ressources des anciennes miniatures avant de les supprimer
                const removedEntries = this.state.history.slice(10);
                removedEntries.forEach(item => {
                    if (item.thumbnail && item.thumbnail.startsWith('blob:')) {
                        URL.revokeObjectURL(item.thumbnail);
                    }
                });
                
                this.state.history = this.state.history.slice(0, 10);
            }
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
        
        // S'il n'y a pas d'historique, affiche un message
        if (this.state.history.length === 0) {
            container.innerHTML = `
                <div class="empty-history">
                    <p>Aucun historique disponible</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="history-header">
                <h3>Historique récent</h3>
                <button type="button" class="btn-clear-history" onclick="QRCodeManager.clearHistory()">
                    <i class="fas fa-trash-alt"></i> Effacer
                </button>
            </div>
            <div class="history-items">
                ${this.state.history.map((entry, index) => `
                    <div class="history-item" onclick="QRCodeManager.useHistoryEntry(${index})">
                        <div class="history-thumbnail">
                            ${entry.thumbnail 
                                ? `<img src="${entry.thumbnail}" alt="QR Code" class="history-image">` 
                                : `<div class="history-placeholder"><i class="fas fa-qrcode"></i></div>`
                            }
                        </div>
                        <div class="history-info">
                            <div class="history-text" title="${this.escapeHtml(entry.text)}">
                                ${this.truncateText(entry.text, 30)}
                            </div>
                            <div class="history-meta">
                                <span class="history-type">
                                    ${this.types[entry.type]?.name || entry.type}
                                </span>
                                <span class="history-date">
                                    ${this.formatDate(entry.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    /**
     * Échappe les caractères HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Tronque un texte à une longueur donnée
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    
    /**
     * Formate une date pour l'affichage
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        // Si moins d'une minute, affiche "à l'instant"
        if (diffMins < 1) {
            return "À l'instant";
        }
        
        // Si moins d'une heure, affiche "Il y a X minutes"
        if (diffHours < 1) {
            return `Il y a ${diffMins} min`;
        }
        
        // Si moins d'un jour, affiche "Il y a X heures"
        if (diffDays < 1) {
            return `Il y a ${diffHours} h`;
        }
        
        // Si moins d'une semaine, affiche le jour
        if (diffDays < 7) {
            return `Il y a ${diffDays} j`;
        }
        
        // Sinon, affiche la date complète
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit'
        });
    },

    /**
     * Utilise une entrée de l'historique
     */
    useHistoryEntry(index) {
        const entry = this.state.history[index];
        if (!entry) {
            this.showError('Entrée d\'historique introuvable');
            return;
        }

        // Met à jour l'état avec les données historiques
        this.state.text = entry.text;
        this.state.type = entry.type;
        
        // Copie profonde des options pour éviter les références partagées
        this.state.options = JSON.parse(JSON.stringify(entry.options));
        
        // Sélectionne l'onglet correspondant au type
        this.selectTabForType(entry.type);
        
        // Met à jour les champs d'entrée selon le type
        this.updateInputFieldsFromHistory(entry);
        
        // Met à jour les contrôles d'options
        this.updateRangeValues();
        
        // Génère le QR code
        this.generate();
        
        // Affiche une notification
        this.showSuccess('QR code restauré depuis l\'historique');
    },
    
    /**
     * Sélectionne l'onglet correspondant au type
     */
    selectTabForType(type) {
        let tabId;
        
        switch (type) {
            case 'url':
                tabId = 'url';
                break;
            case 'text':
                tabId = 'text';
                break;
            case 'vcard':
                tabId = 'contact';
                break;
            case 'wifi':
                tabId = 'wifi';
                break;
            default:
                tabId = 'text';
        }
        
        // Change d'onglet
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (tabBtn) {
            // Simule un clic sur l'onglet
            tabBtn.click();
        } else {
            // Fallback en cas d'erreur
            this.switchTab(tabId);
        }
    },
    
    /**
     * Met à jour les champs d'entrée à partir de l'historique
     */
    updateInputFieldsFromHistory(entry) {
        const type = entry.type;
        const text = entry.text;
        
        switch (type) {
            case 'url':
                const urlInput = document.getElementById('urlInput');
                if (urlInput) urlInput.value = text;
                break;
                
            case 'text':
                const textInput = document.getElementById('textInput');
                if (textInput) textInput.value = text;
                break;
                
            case 'wifi':
                // Pour l'instant, pas d'implémentation spécifique
                // Nécessiterait de parser le format WIFI:S:...
                break;
                
            case 'vcard':
                // Pour l'instant, pas d'implémentation spécifique
                // Nécessiterait de parser le format vCard
                break;
                
            default:
                // Type non géré spécifiquement
                break;
        }
    },

    /**
     * Vide l'historique
     */
    clearHistory() {
        // Demande confirmation
        if (!confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
            return;
        }
        
        // Libère les ressources des miniatures avant de les supprimer
        this.state.history.forEach(item => {
            if (item.thumbnail && item.thumbnail.startsWith('blob:')) {
                URL.revokeObjectURL(item.thumbnail);
            }
        });
        
        this.state.history = [];
        this.updateHistoryDisplay();
        this.saveState();
        this.showSuccess('Historique effacé avec succès');
    },

    /**
     * Charge l'état depuis le stockage local
     */
    loadState() {
        try {
            const savedState = Utils.loadFromStorage('qrcodeState');
            if (savedState) {
                // Fusionne les options sauvegardées avec les valeurs par défaut
                const defaultOptions = { ...this.state.options };
                
                this.state = {
                    ...this.state,
                    ...savedState,
                    options: {
                        ...defaultOptions,
                        ...(savedState.options || {})
                    }
                };
                
                // Restaure les miniatures de l'historique si possible
                if (Array.isArray(this.state.history)) {
                    this.state.history = this.state.history.map(entry => {
                        // S'assure que chaque entrée a les propriétés requises
                        return {
                            text: entry.text || '',
                            type: entry.type || 'text',
                            options: entry.options || { ...defaultOptions },
                            thumbnail: entry.thumbnail || null,
                            timestamp: entry.timestamp || Date.now()
                        };
                    });
                } else {
                    // Réinitialise l'historique si invalide
                    this.state.history = [];
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données sauvegardées:', error);
            // En cas d'erreur, utilise les valeurs par défaut
            this.state.history = [];
        }
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        try {
            // Crée une copie de l'état pour la sauvegarde
            const stateToSave = {
                text: this.state.text,
                type: this.state.type,
                activeTab: this.state.activeTab,
                options: { ...this.state.options },
                history: this.state.history.map(entry => ({
                    text: entry.text,
                    type: entry.type,
                    options: { ...entry.options },
                    thumbnail: entry.thumbnail,
                    timestamp: entry.timestamp
                }))
            };
            
            Utils.saveToStorage('qrcodeState', stateToSave);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'état:', error);
            this.showError('Erreur lors de la sauvegarde de vos préférences');
        }
    },

    /**
     * Nettoie les ressources avant de quitter
     */
    destroy() {
        // Sauvegarde l'état
        this.saveState();
        
        // Annule tout timer en cours
        clearTimeout(this._debounceTimer);
        
        // Libère les ressources des miniatures
        if (Array.isArray(this.state.history)) {
            this.state.history.forEach(item => {
                if (item.thumbnail && item.thumbnail.startsWith('blob:')) {
                    URL.revokeObjectURL(item.thumbnail);
                }
            });
        }
        
        // Supprime toutes les références aux éléments DOM
        // pour éviter les fuites de mémoire
        this.state.lastGenerated = null;
    }
}; 

// Initialisation lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Initialise le gestionnaire de QR code
    if (window.QRCodeManager) {
        window.QRCodeManager.init();
    }
}); 