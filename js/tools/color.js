/**
 * Module de sélection de couleurs
 * Permet de sélectionner, prévisualiser et copier des couleurs
 * Génère automatiquement des couleurs harmonieuses et des dégradés
 */

import { Utils } from '../utils.js';

export const ColorManager = {
    // État du sélecteur de couleurs
    state: {
        currentColor: '#0066cc',
        history: [],
        isColorPickerOpen: false,
        format: 'hex',
        scheme: 'monochrome',
        favorites: [],
        palette: []
    },

    /**
     * Initialise le sélecteur de couleurs
     */
    init() {
        // Charger l'historique
        this.loadColorHistory();
        
        // Initialiser les écouteurs d'événements
        this.setupEventListeners();
        
        // Initialiser la couleur par défaut
        this.updateColorPicker(this.state.currentColor);
        
        console.log('Sélecteur de couleurs initialisé');
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                this.updateColorPicker(e.target.value);
            });
        }

        // Sliders HSL/Température
        const hueSlider = document.getElementById('hueAdjust');
        const satSlider = document.getElementById('satAdjust');
        const lightSlider = document.getElementById('lightAdjust');
        const tempSlider = document.getElementById('tempAdjust');
        const hueValue = document.getElementById('hueAdjustValue');
        const satValue = document.getElementById('satAdjustValue');
        const lightValue = document.getElementById('lightAdjustValue');
        const tempValue = document.getElementById('tempAdjustValue');

        // Fonction de mise à jour de la couleur à partir des sliders
        const updateFromSliders = () => {
            // Prend la couleur actuelle, la convertit en HSL
            const rgb = this.hexToRgb(this.state.currentColor);
            let hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            // Remplace les valeurs par celles des sliders
            if (hueSlider) hsl.h = parseInt(hueSlider.value, 10);
            if (satSlider) hsl.s = parseInt(satSlider.value, 10);
            if (lightSlider) hsl.l = parseInt(lightSlider.value, 10);
            // Température : simple ajustement sur la teinte (pour l'exemple)
            if (tempSlider) hsl.h = (hsl.h + parseInt(tempSlider.value, 10) + 360) % 360;
            // Met à jour la couleur courante
            const hex = this.hslToHex(hsl.h, hsl.s, hsl.l);
            this.updateColorPicker(hex);
            // Met à jour l'affichage des valeurs
            if (hueValue) hueValue.textContent = hsl.h + '°';
            if (satValue) satValue.textContent = hsl.s + '%';
            if (lightValue) lightValue.textContent = hsl.l + '%';
            if (tempValue) tempValue.textContent = tempSlider ? tempSlider.value : '0';
        };

        if (hueSlider) {
            hueSlider.addEventListener('input', updateFromSliders);
        }
        if (satSlider) {
            satSlider.addEventListener('input', updateFromSliders);
        }
        if (lightSlider) {
            lightSlider.addEventListener('input', updateFromSliders);
        }
        if (tempSlider) {
            tempSlider.addEventListener('input', updateFromSliders);
        }

        // Synchronise les sliders avec la couleur courante à chaque changement
        this.syncSlidersWithColor = () => {
            const rgb = this.hexToRgb(this.state.currentColor);
            const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            if (hueSlider) hueSlider.value = Math.round(hsl.h);
            if (satSlider) satSlider.value = Math.round(hsl.s);
            if (lightSlider) lightSlider.value = Math.round(hsl.l);
            if (tempSlider) tempSlider.value = 0;
            if (hueValue) hueValue.textContent = Math.round(hsl.h) + '°';
            if (satValue) satValue.textContent = Math.round(hsl.s) + '%';
            if (lightValue) lightValue.textContent = Math.round(hsl.l) + '%';
            if (tempValue) tempValue.textContent = '0';
        };

        // Appelle la synchronisation à chaque updateColorPicker
        const originalUpdateColorPicker = this.updateColorPicker.bind(this);
        this.updateColorPicker = (color) => {
            originalUpdateColorPicker(color);
            this.syncSlidersWithColor();
        };

        // Ajout des écouteurs pour les champs HEX, RGB, HSL, CMYK
        const hexInput = document.getElementById('hexValue');
        const rgbInput = document.getElementById('rgbValue');
        const hslInput = document.getElementById('hslValue');
        const cmykInput = document.getElementById('cmykValue');

        if (hexInput) {
            hexInput.addEventListener('blur', () => this.handleHexInput(hexInput.value));
            hexInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleHexInput(hexInput.value);
            });
        }
        if (rgbInput) {
            rgbInput.addEventListener('blur', () => this.handleRgbInput(rgbInput.value));
            rgbInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleRgbInput(rgbInput.value);
            });
        }
        if (hslInput) {
            hslInput.addEventListener('blur', () => this.handleHslInput(hslInput.value));
            hslInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleHslInput(hslInput.value);
            });
        }
        if (cmykInput) {
            cmykInput.addEventListener('blur', () => this.handleCmykInput(cmykInput.value));
            cmykInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleCmykInput(cmykInput.value);
            });
        }

        // Écouteur pour la prévisualisation de couleur
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) {
            colorPreview.addEventListener('click', () => {
                this.copyColorValue('Hex');
            });
        }

        // Écouteur pour le bouton favori (étoile)
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                if (this.isFavorite(this.state.currentColor)) {
                    this.removeFavorite(this.state.currentColor);
                } else {
                    this.addFavorite(this.state.currentColor);
                }
                this.updateAllDisplays();
                this.saveState();
            });
        }

        // Générer les couleurs harmonieuses au chargement
        this.generateHarmonies(this.state.currentColor);
        
        // Générer les dégradés au chargement
        this.generateGradients(this.state.currentColor);
        
        // Générer les couleurs nommées
        this.generateNamedColors();
        
        // Évaluer l'accessibilité de la couleur actuelle
        this.evaluateColorAccessibility(this.state.currentColor);
        
        // Exposer les fonctions au contexte global
        window.updateColorPicker = (color) => this.updateColorPicker(color);
        window.copyColorValue = (format) => this.copyColorValue(format);
        window.clearColorHistory = () => this.clearColorHistory();

        // Ajout des écouteurs pour les boutons de copie
        setTimeout(() => {
            document.querySelectorAll('.btn-copy').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const type = btn.getAttribute('data-value');
                    let value = '';
                    if (type === 'hex') {
                        value = document.getElementById('hexValue')?.value || '';
                    } else if (type === 'rgb') {
                        value = document.getElementById('rgbValue')?.value || '';
                    } else if (type === 'hsl') {
                        value = document.getElementById('hslValue')?.value || '';
                    } else if (type === 'cmyk') {
                        value = document.getElementById('cmykValue')?.value || '';
                    }
                    if (value) {
                        this.copyToClipboard(value);
                        this.showCopyNotification(`${type.toUpperCase()} copié : ${value}`);
                    }
                });
            }); 
        }, 0);

        // Gestion des onglets (Palettes, Harmonies, Ajustement, Accessibilité)
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Retirer la classe active de tous les boutons et onglets
                tabButtons.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                // Ajouter la classe active au bouton et à l'onglet correspondant
                btn.classList.add('active');
                const tab = btn.getAttribute('data-tab');
                const pane = document.getElementById(tab);
                if (pane) pane.classList.add('active');
            });
        });
    },

    /**
     * Met à jour l'affichage de la couleur sélectionnée
     * @param {string} color - La couleur au format hexadécimal
     */
    updateColorPicker(color) {
        this.state.currentColor = color;
        
        // Mettre à jour le sélecteur de couleur
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.value = color;
        }
        
        // Mettre à jour la prévisualisation
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) {
            colorPreview.style.backgroundColor = color;
        }
        
        // Mettre à jour les valeurs de couleur
        this.updateColorValues(color);
        
        // Mettre à jour les harmonies
        this.generateHarmonies(color);
        
        // Mettre à jour les dégradés
        this.generateGradients(color);
        
        // Évaluer l'accessibilité
        this.evaluateColorAccessibility(color);
        
        // Ajouter à l'historique
        this.addToColorHistory(color);
        
        // Synchroniser tout l'UI
        this.updateAllDisplays();
    },

    /**
     * Met à jour les champs de valeur de couleur
     * @param {string} color - La couleur au format hexadécimal
     */
    updateColorValues(color) {
        // Valeur hexadécimale
        const colorHex = document.getElementById('hexValue');
        if (colorHex) {
            colorHex.value = color.toUpperCase();
        }
        
        // Valeur RGB
        const rgb = this.hexToRgb(color);
        const colorRgb = document.getElementById('rgbValue');
        if (colorRgb && rgb) {
            colorRgb.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }
        
        // Valeur HSL
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        const colorHsl = document.getElementById('hslValue');
        if (colorHsl && hsl) {
            colorHsl.value = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
        }
        
        // Valeur CMYK
        const cmyk = this.rgbToCmyk(rgb.r, rgb.g, rgb.b);
        const colorCmyk = document.getElementById('cmykValue');
        if (colorCmyk && cmyk) {
            colorCmyk.value = `cmyk(${Math.round(cmyk[0]*100)}%, ${Math.round(cmyk[1]*100)}%, ${Math.round(cmyk[2]*100)}%, ${Math.round(cmyk[3]*100)}%)`;
        }
    },

    /**
     * Génère les harmonies de couleurs
     * @param {string} color - La couleur au format hexadécimal
     */
    generateHarmonies(color) {
        const container = document.getElementById('harmonySamples');
        if (!container) {
            return;
        }
        
        const rgb = this.hexToRgb(color);
        if (!rgb) return;
        
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        // Créer le contenu des harmonies
        container.innerHTML = '';
        
        // Créer les sections de couleurs harmonieuses
        const harmonies = [
            { 
                title: 'Monochrome', 
                colors: this.generateMonochromatic(hsl) 
            },
            { 
                title: 'Complémentaire', 
                colors: this.generateComplementary(hsl) 
            },
            { 
                title: 'Analogue', 
                colors: this.generateAnalogous(hsl) 
            },
            { 
                title: 'Triadique', 
                colors: this.generateTriadic(hsl) 
            }
        ];
        
        // Ajouter chaque section d'harmonie
        harmonies.forEach(harmony => {
            const group = document.createElement('div');
            group.className = 'harmony-group';
            
            const title = document.createElement('div');
            title.className = 'harmony-title';
            title.textContent = harmony.title;
            
            const colors = document.createElement('div');
            colors.className = 'harmony-colors';
            
            harmony.colors.forEach(c => {
                const colorDiv = document.createElement('div');
                colorDiv.className = 'harmony-color';
                colorDiv.style.backgroundColor = c;
                colorDiv.setAttribute('data-color', c.toUpperCase());
                colorDiv.addEventListener('click', () => {
                    this.updateColorPicker(c);
                });
                colors.appendChild(colorDiv);
            });
            
            group.appendChild(title);
            group.appendChild(colors);
            container.appendChild(group);
        });
    },

    /**
     * Génère des dégradés basés sur la couleur sélectionnée
     * @param {string} color - La couleur au format hexadécimal
     */
    generateGradients(color) {
        const container = document.getElementById('gradientSamples');
        if (!container) {
            return;
        }
        
        // Obtenir les couleurs complémentaires
        const rgb = this.hexToRgb(color);
        if (!rgb) return;
        
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        const complementary = this.hslToHex(
            (hsl.h + 180) % 360, 
            hsl.s, 
            hsl.l
        );
        
        // Créer différents types de dégradés
        const gradients = [
            {
                name: 'Linéaire',
                value: `linear-gradient(to right, ${color}, ${complementary})`
            },
            {
                name: 'Radial',
                value: `radial-gradient(circle, ${color}, ${complementary})`
            },
            {
                name: 'Angle',
                value: `linear-gradient(45deg, ${color}, ${complementary})`
            },
            {
                name: 'Trois couleurs',
                value: `linear-gradient(to right, ${color}, ${this.adjustBrightness(color, 30)}, ${complementary})`
            }
        ];
        
        // Ajouter les dégradés au conteneur
        container.innerHTML = '';
        
        gradients.forEach(gradient => {
            const sample = document.createElement('div');
            sample.className = 'gradient-sample';
            sample.style.background = gradient.value;
            sample.setAttribute('data-gradient', gradient.name);
            
            sample.addEventListener('click', () => {
                this.copyToClipboard(gradient.value);
                this.showCopyNotification(`Dégradé ${gradient.name} copié !`);
            });
            
            container.appendChild(sample);
        });
    },

    /**
     * Génère des couleurs nommées populaires
     */
    generateNamedColors() {
        const container = document.getElementById('namedColors');
        if (!container) {
            return;
        }
        
        // Liste des couleurs nommées populaires
        const namedColors = [
            { name: 'Rouge', value: '#FF0000' },
            { name: 'Vert', value: '#00FF00' },
            { name: 'Bleu', value: '#0000FF' },
            { name: 'Jaune', value: '#FFFF00' },
            { name: 'Cyan', value: '#00FFFF' },
            { name: 'Magenta', value: '#FF00FF' },
            { name: 'Noir', value: '#000000' },
            { name: 'Blanc', value: '#FFFFFF' },
            { name: 'Gris', value: '#808080' },
            { name: 'Orange', value: '#FFA500' },
            { name: 'Violet', value: '#800080' },
            { name: 'Rose', value: '#FFC0CB' },
            { name: 'Marron', value: '#A52A2A' },
            { name: 'Olive', value: '#808000' },
            { name: 'Marine', value: '#000080' },
            { name: 'Turquoise', value: '#40E0D0' }
        ];
        
        // Ajouter les couleurs nommées au conteneur
        container.innerHTML = '';
        
        namedColors.forEach(colorInfo => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'named-color';
            colorDiv.style.backgroundColor = colorInfo.value;
            colorDiv.setAttribute('data-name', colorInfo.name);
            colorDiv.addEventListener('click', () => {
                this.updateColorPicker(colorInfo.value);
            });
            container.appendChild(colorDiv);
        });
    },

    /**
     * Évalue l'accessibilité de la couleur actuelle
     * @param {string} color - La couleur au format hexadécimal
     */
    evaluateColorAccessibility(color) {
        const container = document.getElementById('contrastSamples');
        if (!container) {
            return;
        }
        
        // Créer les échantillons de contraste
        container.innerHTML = '';
        
        // Échantillon texte sur fond blanc
        const sampleWhite = document.createElement('div');
        sampleWhite.className = 'contrast-sample';
        sampleWhite.style.backgroundColor = '#FFFFFF';
        
        const whiteText = document.createElement('div');
        whiteText.className = 'contrast-text';
        whiteText.style.color = color;
        whiteText.textContent = 'Texte sur fond blanc';
        
        const whiteContrast = this.calculateContrast(color, '#FFFFFF');
        const whiteScore = document.createElement('span');
        whiteScore.className = `contrast-score ${whiteContrast >= 4.5 ? 'score-pass' : 'score-fail'}`;
        whiteScore.textContent = `${whiteContrast.toFixed(2)}:1 ${whiteContrast >= 4.5 ? '✓' : '✗'}`;
        
        sampleWhite.appendChild(whiteText);
        sampleWhite.appendChild(whiteScore);
        container.appendChild(sampleWhite);
        
        // Échantillon texte sur fond noir
        const sampleBlack = document.createElement('div');
        sampleBlack.className = 'contrast-sample';
        sampleBlack.style.backgroundColor = '#000000';
        
        const blackText = document.createElement('div');
        blackText.className = 'contrast-text';
        blackText.style.color = color;
        blackText.textContent = 'Texte sur fond noir';
        
        const blackContrast = this.calculateContrast(color, '#000000');
        const blackScore = document.createElement('span');
        blackScore.className = `contrast-score ${blackContrast >= 4.5 ? 'score-pass' : 'score-fail'}`;
        blackScore.textContent = `${blackContrast.toFixed(2)}:1 ${blackContrast >= 4.5 ? '✓' : '✗'}`;
        
        sampleBlack.appendChild(blackText);
        sampleBlack.appendChild(blackScore);
        container.appendChild(sampleBlack);
        
        // Échantillon fond sur texte blanc
        const sampleColorBg = document.createElement('div');
        sampleColorBg.className = 'contrast-sample';
        sampleColorBg.style.backgroundColor = color;
        
        const colorText = document.createElement('div');
        colorText.className = 'contrast-text';
        colorText.style.color = '#FFFFFF';
        colorText.textContent = 'Texte blanc sur ce fond';
        
        const colorContrast = this.calculateContrast('#FFFFFF', color);
        const colorScore = document.createElement('span');
        colorScore.className = `contrast-score ${colorContrast >= 4.5 ? 'score-pass' : 'score-fail'}`;
        colorScore.textContent = `${colorContrast.toFixed(2)}:1 ${colorContrast >= 4.5 ? '✓' : '✗'}`;
        colorScore.style.color = '#FFFFFF';
        
        sampleColorBg.appendChild(colorText);
        sampleColorBg.appendChild(colorScore);
        container.appendChild(sampleColorBg);
    },

    /**
     * Copie une valeur de couleur dans le presse-papier
     * @param {string} format - Le format de couleur à copier (Hex, Rgb, Hsl)
     */
    copyColorValue(format) {
        const element = document.getElementById(`color${format}`);
        if (!element) return;
        
        this.copyToClipboard(element.value);
        this.showCopyNotification(`${format} copié : ${element.value}`);
        
        // Vibrer si disponible (mobile)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    },

    /**
     * Affiche une notification de copie
     * @param {string} message - Le message à afficher
     */
    showCopyNotification(message) {
        let notification = document.querySelector('.copy-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'copy-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    },

    /**
     * Ajoute une couleur à l'historique
     * @param {string} color - La couleur au format hexadécimal
     */
    addToColorHistory(color) {
        // Vérifier si la couleur existe déjà dans l'historique
        const existingIndex = this.state.history.findIndex(item => item.color === color);
        if (existingIndex !== -1) {
            // Mettre à jour la date et déplacer en haut
            this.state.history.splice(existingIndex, 1);
        }
        
        // Ajouter la nouvelle couleur au début
        this.state.history.unshift({
            color,
            timestamp: new Date().toISOString()
        });
        
        // Limiter la taille de l'historique
        if (this.state.history.length > 24) {
            this.state.history.pop();
        }
        
        // Sauvegarder l'historique
        this.saveColorHistory();
        
        // Mettre à jour l'affichage
        this.updateColorHistoryDisplay();
    },

    /**
     * Met à jour l'affichage de l'historique des couleurs
     */
    updateColorHistoryDisplay() {
        const container = document.getElementById('colorHistory');
        if (!container) return;
        
        // Vider le conteneur
        container.innerHTML = '';
        
        // Ajouter chaque couleur de l'historique
        this.state.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const colorDiv = document.createElement('div');
            colorDiv.className = 'history-color';
            colorDiv.style.backgroundColor = item.color;
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'history-info';
            
            const hexDiv = document.createElement('div');
            hexDiv.className = 'history-hex';
            hexDiv.textContent = item.color.toUpperCase();
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'history-date';
            dateDiv.textContent = this.formatDate(new Date(item.timestamp));
            
            infoDiv.appendChild(hexDiv);
            infoDiv.appendChild(dateDiv);
            
            historyItem.appendChild(colorDiv);
            historyItem.appendChild(infoDiv);
            
            historyItem.addEventListener('click', () => {
                this.updateColorPicker(item.color);
            });
            
            container.appendChild(historyItem);
        });
        
        // Si l'historique est vide, afficher un message
        if (this.state.history.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.textContent = 'Aucune couleur dans l\'historique';
            emptyMessage.style.padding = '1rem';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = 'var(--text-muted)';
            container.appendChild(emptyMessage);
        }
    },

    /**
     * Efface l'historique des couleurs
     */
    clearColorHistory() {
        this.state.history = [];
        this.saveColorHistory();
        this.updateAllDisplays();
        Utils.showNotification('Historique des couleurs effacé', 'info');
    },

    /**
     * Sauvegarde l'historique des couleurs
     */
    saveColorHistory() {
        localStorage.setItem('colorHistory', JSON.stringify(this.state.history));
    },

    /**
     * Charge l'historique des couleurs
     */
    loadColorHistory() {
        const savedHistory = localStorage.getItem('colorHistory');
        if (savedHistory) {
            try {
                this.state.history = JSON.parse(savedHistory);
                this.updateColorHistoryDisplay();
            } catch (e) {
                console.error('Erreur lors du chargement de l\'historique des couleurs:', e);
                this.state.history = [];
            }
        }
    },

    /**
     * Formate une date pour l'affichage
     * @param {Date} date - La date à formatter
     * @returns {string} La date formatée
     */
    formatDate(date) {
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Copie un texte dans le presse-papier
     * @param {string} text - Le texte à copier
     */
    copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // Évite de faire défiler la page
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            document.execCommand('copy');
            return true;
        } catch (err) {
            console.error('Erreur lors de la copie :', err);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    },

    /**
     * Convertit une couleur hexadécimale en RGB
     * @param {string} hex - La couleur au format hexadécimal
     * @returns {Object|null} Objet contenant les valeurs r, g, b ou null si invalide
     */
    hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Convertit des valeurs RGB en hexadécimal
     * @param {number} r - Valeur rouge (0-255)
     * @param {number} g - Valeur verte (0-255)
     * @param {number} b - Valeur bleue (0-255)
     * @returns {string} Couleur au format hexadécimal
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    /**
     * Convertit des valeurs RGB en HSL
     * @param {number} r - Valeur rouge (0-255)
     * @param {number} g - Valeur verte (0-255)
     * @param {number} b - Valeur bleue (0-255)
     * @returns {Object} Objet contenant les valeurs h, s, l
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatique
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    },

    /**
     * Convertit des valeurs HSL en hexadécimal
     * @param {number} h - Teinte (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Luminosité (0-100)
     * @returns {string} Couleur au format hexadécimal
     */
    hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        
        let c = (1 - Math.abs(2 * l - 1)) * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = l - c/2;
        let r = 0, g = 0, b = 0;
        
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return this.rgbToHex(r, g, b);
    },

    /**
     * Calcule le contraste entre deux couleurs
     * @param {string} color1 - Première couleur au format hexadécimal
     * @param {string} color2 - Deuxième couleur au format hexadécimal
     * @returns {number} Ratio de contraste
     */
    calculateContrast(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return 0;
        
        // Calculer la luminance relative
        const luminance1 = this.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
        const luminance2 = this.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
        
        // Calculer le contraste
        const brightest = Math.max(luminance1, luminance2);
        const darkest = Math.min(luminance1, luminance2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    },

    /**
     * Calcule la luminance relative d'une couleur RGB
     * @param {number} r - Valeur rouge (0-255)
     * @param {number} g - Valeur verte (0-255)
     * @param {number} b - Valeur bleue (0-255)
     * @returns {number} Luminance relative
     */
    calculateLuminance(r, g, b) {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    },

    /**
     * Génère des couleurs monochromatiques
     * @param {Object} hsl - Objet contenant les valeurs h, s, l
     * @returns {Array} Tableau de couleurs hexadécimales
     */
    generateMonochromatic(hsl) {
        const colors = [];
        const h = hsl.h;
        
        // Générer 5 variations de luminosité
        for (let i = 0; i < 5; i++) {
            const l = Math.max(10, Math.min(90, 20 * i + 10));
            colors.push(this.hslToHex(h, hsl.s, l));
        }
        
        return colors;
    },

    /**
     * Génère des couleurs complémentaires
     * @param {Object} hsl - Objet contenant les valeurs h, s, l
     * @returns {Array} Tableau de couleurs hexadécimales
     */
    generateComplementary(hsl) {
        const colors = [];
        const h = hsl.h;
        const complementary = (h + 180) % 360;
        
        // Couleur principale
        colors.push(this.hslToHex(h, hsl.s, hsl.l));
        
        // Variations de la couleur principale
        colors.push(this.hslToHex(h, hsl.s, Math.max(30, hsl.l - 20)));
        colors.push(this.hslToHex(h, hsl.s, Math.min(90, hsl.l + 20)));
        
        // Couleur complémentaire
        colors.push(this.hslToHex(complementary, hsl.s, hsl.l));
        
        return colors;
    },

    /**
     * Génère des couleurs analogues
     * @param {Object} hsl - Objet contenant les valeurs h, s, l
     * @returns {Array} Tableau de couleurs hexadécimales
     */
    generateAnalogous(hsl) {
        const colors = [];
        const h = hsl.h;
        
        colors.push(this.hslToHex((h - 30 + 360) % 360, hsl.s, hsl.l));
        colors.push(this.hslToHex((h - 15 + 360) % 360, hsl.s, hsl.l));
        colors.push(this.hslToHex(h, hsl.s, hsl.l));
        colors.push(this.hslToHex((h + 15) % 360, hsl.s, hsl.l));
        colors.push(this.hslToHex((h + 30) % 360, hsl.s, hsl.l));
        
        return colors;
    },

    /**
     * Génère des couleurs triadiques
     * @param {Object} hsl - Objet contenant les valeurs h, s, l
     * @returns {Array} Tableau de couleurs hexadécimales
     */
    generateTriadic(hsl) {
        const colors = [];
        const h = hsl.h;
        
        colors.push(this.hslToHex(h, hsl.s, hsl.l));
        colors.push(this.hslToHex((h + 120) % 360, hsl.s, hsl.l));
        colors.push(this.hslToHex((h + 240) % 360, hsl.s, hsl.l));
        
        return colors;
    },

    /**
     * Ajuste la luminosité d'une couleur
     * @param {string} color - Couleur au format hexadécimal
     * @param {number} percent - Pourcentage d'ajustement
     * @returns {string} Couleur ajustée au format hexadécimal
     */
    adjustBrightness(color, percent) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        let l = hsl.l + percent;
        l = Math.max(0, Math.min(100, l));
        
        return this.hslToHex(hsl.h, hsl.s, l);
    },

    // Gestion des entrées utilisateur pour chaque format
    handleHexInput(value) {
        let hex = value.trim();
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
            this.updateColorPicker(hex);
        } else {
            this.showCopyNotification('Format HEX invalide');
        }
    },
    handleRgbInput(value) {
        const match = value.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
        if (match) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            if ([r, g, b].every(v => v >= 0 && v <= 255)) {
                this.updateColorPicker(this.rgbToHex(r, g, b));
                return;
            }
        }
        this.showCopyNotification('Format RGB invalide');
    },
    handleHslInput(value) {
        const match = value.match(/^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i);
        if (match) {
            const h = parseInt(match[1], 10);
            const s = parseInt(match[2], 10);
            const l = parseInt(match[3], 10);
            if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
                this.updateColorPicker(this.hslToHex(h, s, l));
                return;
            }
        }
        this.showCopyNotification('Format HSL invalide');
    },
    handleCmykInput(value) {
        const match = value.match(/^cmyk\s*\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i);
        if (match) {
            const c = parseInt(match[1], 10) / 100;
            const m = parseInt(match[2], 10) / 100;
            const y = parseInt(match[3], 10) / 100;
            const k = parseInt(match[4], 10) / 100;
            if ([c, m, y, k].every(v => v >= 0 && v <= 1)) {
                const rgb = this.cmykToRgb(c, m, y, k);
                this.updateColorPicker(this.rgbToHex(rgb.r, rgb.g, rgb.b));
                return;
            }
        }
        this.showCopyNotification('Format CMYK invalide');
    },

    // Conversion CMYK -> RGB
    cmykToRgb(c, m, y, k) {
        const r = Math.round(255 * (1 - c) * (1 - k));
        const g = Math.round(255 * (1 - m) * (1 - k));
        const b = Math.round(255 * (1 - y) * (1 - k));
        return { r, g, b };
    },
    // Conversion RGB -> CMYK
    rgbToCmyk(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const k = 1 - Math.max(r, g, b);
        const c = (1 - r - k) / (1 - k) || 0;
        const m = (1 - g - k) / (1 - k) || 0;
        const y = (1 - b - k) / (1 - k) || 0;
        return [c, m, y, k];
    },
    // Conversion HEX -> CMYK
    hexToCmyk(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    },

    // Conversion RGB -> HSV
    rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h * 360, s, v];
    },
    hexToHsv(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHsv(rgb.r, rgb.g, rgb.b);
    },

    // Ajout des schémas de couleurs et de la gestion avancée de palette et favoris (fusion color.js)
    schemes: {
        monochrome: {
            name: 'Monochrome',
            generate: (h, s, l) => [
                [h, s, l],
                [h, s, l * 0.8],
                [h, s * 0.8, l],
                [h, s * 0.8, l * 0.8],
                [h, s * 0.6, l * 0.6]
            ]
        },
        analogous: {
            name: 'Analogue',
            generate: (h, s, l) => [
                [h, s, l],
                [(h + 30) % 360, s, l],
                [(h + 60) % 360, s, l],
                [(h - 30 + 360) % 360, s, l],
                [(h - 60 + 360) % 360, s, l]
            ]
        },
        complementary: {
            name: 'Complémentaire',
            generate: (h, s, l) => [
                [h, s, l],
                [(h + 180) % 360, s, l],
                [h, s * 0.8, l],
                [(h + 180) % 360, s * 0.8, l],
                [h, s * 0.6, l * 0.6]
            ]
        },
        triadic: {
            name: 'Triadique',
            generate: (h, s, l) => [
                [h, s, l],
                [(h + 120) % 360, s, l],
                [(h + 240) % 360, s, l],
                [h, s * 0.8, l],
                [(h + 120) % 360, s * 0.8, l]
            ]
        },
        tetradic: {
            name: 'Tétradique',
            generate: (h, s, l) => [
                [h, s, l],
                [(h + 90) % 360, s, l],
                [(h + 180) % 360, s, l],
                [(h + 270) % 360, s, l],
                [h, s * 0.8, l]
            ]
        },
        split: {
            name: 'Complémentaire divisé',
            generate: (h, s, l) => [
                [h, s, l],
                [(h + 150) % 360, s, l],
                [(h + 210) % 360, s, l],
                [h, s * 0.8, l],
                [(h + 180) % 360, s * 0.8, l]
            ]
        }
    },

    // Ajout de la gestion des favoris et de l'état avancé
    defaultState: {
        format: 'hex',
        scheme: 'monochrome',
        history: [],
        favorites: []
    },

    saveState() {
        localStorage.setItem('colorState', JSON.stringify({
            currentColor: this.state.currentColor,
            format: this.state.format,
            scheme: this.state.scheme,
            history: this.state.history,
            favorites: this.state.favorites
        }));
    },

    loadState() {
        const saved = localStorage.getItem('colorState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.state.currentColor = state.currentColor || '#0066cc';
                this.state.format = state.format || 'hex';
                this.state.scheme = state.scheme || 'monochrome';
                this.state.history = state.history || [];
                this.state.favorites = state.favorites || [];
            } catch (e) {
                // Valeurs par défaut
            }
        }
    },

    // Génération de palette avancée
    generatePalette() {
        const [h, s, l] = this.hexToHsl(this.state.currentColor || '#000000');
        const scheme = this.state.scheme || 'monochrome';
        this.state.palette = this.schemes[scheme]
            .generate(h, s, l)
            .map(([h, s, l]) => this.hslToHex(h, s, l));
        this.updatePaletteDisplay && this.updatePaletteDisplay();
    },

    updatePaletteDisplay() {
        const container = document.getElementById('colorPalette');
        if (!container) return;
        container.innerHTML = (this.state.palette || [])
            .map(color => `
                <div class="color-item" 
                     style="background-color: ${color}"
                     onclick="updateColorPicker('${color}')">
                    <div class="color-value">${color.toUpperCase()}</div>
                </div>
            `)
            .join('');
    },

    // Ajout/Retrait des favoris
    addFavorite(color) {
        if (!this.state.favorites) this.state.favorites = [];
        if (!this.state.favorites.includes(color)) {
            this.state.favorites.push(color);
            this.saveState();
        }
    },
    removeFavorite(color) {
        if (!this.state.favorites) return;
        this.state.favorites = this.state.favorites.filter(c => c !== color);
        this.saveState();
    },

    updateAllDisplays() {
        this.updateColorValues(this.state.currentColor);
        this.updatePaletteDisplay && this.updatePaletteDisplay();
        this.updateColorHistoryDisplay && this.updateColorHistoryDisplay();
        this.updateFavoritesDisplay && this.updateFavoritesDisplay();
        this.updateFavoriteIcon && this.updateFavoriteIcon();
    },

    /**
     * Affiche dynamiquement les favoris dans la section dédiée
     */
    updateFavoritesDisplay() {
        const container = document.getElementById('colorFavorites');
        if (!container) return;
        container.innerHTML = '';
        if (!this.state.favorites || this.state.favorites.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucun favori';
            empty.style.padding = '1rem';
            empty.style.textAlign = 'center';
            empty.style.color = 'var(--text-muted)';
            container.appendChild(empty);
            return;
        }
        this.state.favorites.forEach(color => {
            const favDiv = document.createElement('div');
            favDiv.className = 'favorite-item';
            favDiv.style.backgroundColor = color;
            favDiv.title = color.toUpperCase();
            favDiv.addEventListener('click', () => {
                this.updateColorPicker(color);
            });
            container.appendChild(favDiv);
        });
    },

    /**
     * Met à jour l'icône étoile selon l'état favori
     */
    updateFavoriteIcon() {
        const icon = document.getElementById('favoriteIcon');
        if (!icon) return;
        if (this.isFavorite(this.state.currentColor)) {
            icon.classList.add('is-favorite');
            icon.classList.add('fas');
            icon.classList.remove('far');
        } else {
            icon.classList.remove('is-favorite');
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    },

    /**
     * Vérifie si une couleur est dans les favoris
     */
    isFavorite(color) {
        return this.state.favorites && this.state.favorites.includes(color);
    },
};

// Initialiser le gestionnaire de couleurs au chargement du document
document.addEventListener('DOMContentLoaded', () => {
    ColorManager.loadState();
    window.updateColorPicker = (color) => ColorManager.updateColorPicker(color);
    window.copyColorValue = (format) => ColorManager.copyColorValue(format);
    window.clearColorHistory = () => ColorManager.clearColorHistory();
    ColorManager.init();
});
