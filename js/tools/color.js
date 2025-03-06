import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de couleurs
 */
export const ColorManager = {
    state: {
        color: '#3498db',
        format: 'hex', // hex | rgb | hsl | hsv | cmyk
        scheme: 'monochrome', // monochrome | analogous | complementary | triadic | tetradic | split
        options: {
            saturation: 100,
            brightness: 100,
            variation: 10
        },
        history: []
    },

    // Configuration des formats de couleur
    formats: {
        hex: {
            name: 'Hexadécimal',
            description: 'Format hexadécimal (#RRGGBB)',
            placeholder: '#3498db',
            validate: color => /^#[0-9A-Fa-f]{6}$/.test(color)
        },
        rgb: {
            name: 'RGB',
            description: 'Rouge, Vert, Bleu (0-255)',
            placeholder: 'rgb(52, 152, 219)',
            validate: color => /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(color)
        },
        hsl: {
            name: 'HSL',
            description: 'Teinte, Saturation, Luminosité',
            placeholder: 'hsl(204, 70%, 53%)',
            validate: color => /^hsl\(\d{1,3},\s*\d{1,3}%,\s*\d{1,3}%\)$/.test(color)
        },
        hsv: {
            name: 'HSV',
            description: 'Teinte, Saturation, Valeur',
            placeholder: 'hsv(204, 76%, 86%)',
            validate: color => /^hsv\(\d{1,3},\s*\d{1,3}%,\s*\d{1,3}%\)$/.test(color)
        },
        cmyk: {
            name: 'CMYK',
            description: 'Cyan, Magenta, Jaune, Noir',
            placeholder: 'cmyk(76%, 31%, 0%, 14%)',
            validate: color => /^cmyk\(\d{1,3}%,\s*\d{1,3}%,\s*\d{1,3}%,\s*\d{1,3}%\)$/.test(color)
        }
    },

    // Configuration des schémas de couleur
    schemes: {
        monochrome: {
            name: 'Monochrome',
            description: 'Variations de luminosité et saturation',
            count: 5
        },
        analogous: {
            name: 'Analogue',
            description: 'Couleurs adjacentes sur le cercle chromatique',
            count: 3
        },
        complementary: {
            name: 'Complémentaire',
            description: 'Couleurs opposées sur le cercle chromatique',
            count: 2
        },
        triadic: {
            name: 'Triadique',
            description: 'Trois couleurs équidistantes',
            count: 3
        },
        tetradic: {
            name: 'Tétradique',
            description: 'Quatre couleurs en rectangle',
            count: 4
        },
        split: {
            name: 'Complémentaire divisé',
            description: 'Une couleur et deux adjacentes à sa complémentaire',
            count: 3
        }
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.updateDisplay();
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('colorState', {
            color: '#3498db',
            format: 'hex',
            scheme: 'monochrome',
            options: this.state.options,
            history: []
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Sélecteur de couleur
        document.getElementById('colorPicker')?.addEventListener('input', (e) => {
            this.updateColor(e.target.value);
        });

        // Format de couleur
        document.getElementById('colorFormat')?.addEventListener('change', (e) => {
            this.updateFormat(e.target.value);
        });

        // Schéma de couleur
        document.getElementById('colorScheme')?.addEventListener('change', (e) => {
            this.updateScheme(e.target.value);
        });

        // Options
        ['saturation', 'brightness', 'variation'].forEach(option => {
            document.getElementById(`color${option}`)?.addEventListener('input', (e) => {
                this.updateOption(option, parseInt(e.target.value, 10));
            });
        });

        // Boutons d'action
        document.getElementById('generateRandomColor')?.addEventListener('click', () => {
            this.generateRandomColor();
        });

        document.getElementById('copyColor')?.addEventListener('click', () => {
            this.copyCurrentColor();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isColorGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generateRandomColor();
            } else if (e.ctrlKey && e.key === 'c' && !window.getSelection().toString()) {
                e.preventDefault();
                this.copyCurrentColor();
            }
        });
    },

    /**
     * Vérifie si le générateur est visible
     */
    isColorGeneratorVisible() {
        const generator = document.getElementById('colorTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour la couleur
     */
    updateColor(color) {
        this.state.color = color;
        this.generatePalette();
        this.addToHistory(color);
        this.updateDisplay();
        this.saveState();
    },

    /**
     * Met à jour le format
     */
    updateFormat(format) {
        this.state.format = format;
        this.updateDisplay();
        this.saveState();
    },

    /**
     * Met à jour le schéma
     */
    updateScheme(scheme) {
        this.state.scheme = scheme;
        this.generatePalette();
        this.saveState();
    },

    /**
     * Génère une couleur aléatoire
     */
    generateRandomColor() {
        const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        this.updateColor(color);
    },

    /**
     * Génère la palette de couleurs
     */
    generatePalette() {
        const scheme = this.schemes[this.state.scheme];
        const colors = [];
        const [h, s, l] = this.hexToHsl(this.state.color);

        switch (this.state.scheme) {
            case 'monochrome':
                for (let i = 0; i < scheme.count; i++) {
                    const newL = Math.max(0, Math.min(100, l + (i - 2) * 20));
                    colors.push(this.hslToHex(h, s, newL));
                }
                break;

            case 'analogous':
                colors.push(this.hslToHex(h, s, l));
                colors.push(this.hslToHex((h + 30) % 360, s, l));
                colors.push(this.hslToHex((h - 30 + 360) % 360, s, l));
                break;

            case 'complementary':
                colors.push(this.hslToHex(h, s, l));
                colors.push(this.hslToHex((h + 180) % 360, s, l));
                break;

            case 'triadic':
                colors.push(this.hslToHex(h, s, l));
                colors.push(this.hslToHex((h + 120) % 360, s, l));
                colors.push(this.hslToHex((h + 240) % 360, s, l));
                break;

            case 'tetradic':
                colors.push(this.hslToHex(h, s, l));
                colors.push(this.hslToHex((h + 90) % 360, s, l));
                colors.push(this.hslToHex((h + 180) % 360, s, l));
                colors.push(this.hslToHex((h + 270) % 360, s, l));
                break;

            case 'split':
                colors.push(this.hslToHex(h, s, l));
                colors.push(this.hslToHex((h + 150) % 360, s, l));
                colors.push(this.hslToHex((h + 210) % 360, s, l));
                break;
        }

        this.updatePaletteDisplay(colors);
    },

    /**
     * Analyse une couleur
     */
    parseColor(input) {
        let color = input.toLowerCase();
        let rgb, hsl, hsv, cmyk;

        if (color.startsWith('#')) {
            rgb = this.hexToRgb(color);
            hsl = this.rgbToHsl(...Object.values(rgb));
            hsv = this.rgbToHsv(...Object.values(rgb));
            cmyk = this.rgbToCmyk(...Object.values(rgb));
        } else if (color.startsWith('rgb')) {
            const matches = color.match(/\d+/g);
            rgb = { r: parseInt(matches[0]), g: parseInt(matches[1]), b: parseInt(matches[2]) };
            color = this.rgbToHex(rgb.r, rgb.g, rgb.b);
            hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
            cmyk = this.rgbToCmyk(rgb.r, rgb.g, rgb.b);
        }

        return {
            hex: color,
            rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
            hsl: `hsl(${Math.round(hsl[0])}, ${Math.round(hsl[1])}%, ${Math.round(hsl[2])}%)`,
            hsv: `hsv(${Math.round(hsv[0])}, ${Math.round(hsv[1])}%, ${Math.round(hsv[2])}%)`,
            cmyk: `cmyk(${Math.round(cmyk[0])}%, ${Math.round(cmyk[1])}%, ${Math.round(cmyk[2])}%, ${Math.round(cmyk[3])}%)`
        };
    },

    /**
     * Copie la couleur actuelle
     */
    copyCurrentColor() {
        const color = this.formatColor(this.state.color);
        Utils.copyToClipboard(color)
            .then(() => Utils.showNotification('Couleur copiée !', 'success'))
            .catch(() => Utils.showNotification('Erreur lors de la copie', 'error'));
    },

    /**
     * Ajoute une couleur à l'historique
     */
    addToHistory(color) {
        this.state.history.unshift({
            color,
            format: this.state.format,
            scheme: this.state.scheme,
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
     * Formate une couleur selon le format choisi
     */
    formatColor(color) {
        const formats = this.parseColor(color);
        return formats[this.state.format];
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay() {
        // Couleur principale
        const colorDisplay = document.getElementById('colorDisplay');
        if (colorDisplay) {
            colorDisplay.style.backgroundColor = this.state.color;
            colorDisplay.textContent = this.formatColor(this.state.color);
        }

        // Génère la palette
        this.generatePalette();
    },

    /**
     * Met à jour l'affichage de la palette
     */
    updatePaletteDisplay(colors) {
        const container = document.getElementById('colorPalette');
        if (!container) return;

        container.innerHTML = colors
            .map(color => `
                <div class="color-item" style="background-color: ${color}">
                    <span class="color-value">${this.formatColor(color)}</span>
                </div>
            `)
            .join('');
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('colorHistory');
        if (!container) return;

        container.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="colorManager.useHistoryEntry('${entry.color}')">
                    <div class="color-preview" style="background-color: ${entry.color}"></div>
                    <div class="history-meta">
                        <span class="color-value">${this.formatColor(entry.color)}</span>
                        <span class="history-date">
                            ${new Date(entry.timestamp).toLocaleString('fr-FR')}
                        </span>
                    </div>
                </div>
            `)
            .join('');
    },

    /**
     * Convertit une couleur hexadécimale en RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Convertit des valeurs RGB en hexadécimal
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Convertit des valeurs RGB en HSL
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
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

        return [h * 360, s * 100, l * 100];
    },

    /**
     * Convertit une couleur hexadécimale en HSL
     */
    hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    },

    /**
     * Convertit des valeurs HSL en RGB
     */
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    },

    /**
     * Convertit des valeurs HSL en hexadécimal
     */
    hslToHex(h, s, l) {
        const rgb = this.hslToRgb(h, s, l);
        return this.rgbToHex(...rgb);
    },

    /**
     * Convertit des valeurs RGB en HSV
     */
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

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

        return [h * 360, s * 100, v * 100];
    },

    /**
     * Convertit une couleur hexadécimale en HSV
     */
    hexToHsv(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHsv(rgb.r, rgb.g, rgb.b);
    },

    /**
     * Convertit des valeurs RGB en CMYK
     */
    rgbToCmyk(r, g, b) {
        if (r === 0 && g === 0 && b === 0) {
            return [0, 0, 0, 100];
        }

        r = r / 255;
        g = g / 255;
        b = b / 255;

        const k = 1 - Math.max(r, g, b);
        const c = (1 - r - k) / (1 - k);
        const m = (1 - g - k) / (1 - k);
        const y = (1 - b - k) / (1 - k);

        return [c * 100, m * 100, y * 100, k * 100];
    },

    /**
     * Convertit une couleur hexadécimale en CMYK
     */
    hexToCmyk(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('colorState', {
            color: this.state.color,
            format: this.state.format,
            scheme: this.state.scheme,
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