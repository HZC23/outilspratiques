import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de couleurs
 */
export const ColorManager = {
    state: {
        color: '#000000',
        format: 'hex', // hex | rgb | hsl | hsv | cmyk
        scheme: 'monochrome', // monochrome | analogous | complementary | triadic | tetradic | split
        palette: [],
        history: [],
        favorites: new Set()
    },

    // Configuration des schémas de couleurs
    schemes: {
        monochrome: {
            name: 'Monochrome',
            generate: (h, s, l) => {
                return [
                    [h, s, l],
                    [h, s, l * 0.8],
                    [h, s * 0.8, l],
                    [h, s * 0.8, l * 0.8],
                    [h, s * 0.6, l * 0.6]
                ];
            }
        },
        analogous: {
            name: 'Analogue',
            generate: (h, s, l) => {
                return [
                    [h, s, l],
                    [(h + 30) % 360, s, l],
                    [(h + 60) % 360, s, l],
                    [(h - 30 + 360) % 360, s, l],
                    [(h - 60 + 360) % 360, s, l]
                ];
            }
        },
        complementary: {
            name: 'Complémentaire',
            generate: (h, s, l) => {
                return [
                    [h, s, l],
                    [(h + 180) % 360, s, l],
                    [h, s * 0.8, l],
                    [(h + 180) % 360, s * 0.8, l],
                    [h, s * 0.6, l * 0.6]
                ];
            }
        },
        triadic: {
            name: 'Triadique',
            generate: (h, s, l) => {
                return [
                    [h, s, l],
                    [(h + 120) % 360, s, l],
                    [(h + 240) % 360, s, l],
                    [h, s * 0.8, l],
                    [(h + 120) % 360, s * 0.8, l]
                ];
            }
        },
        tetradic: {
            name: 'Tétradique',
            generate: (h, s, l) => {
                return [
                    [h, s, l],
                    [(h + 90) % 360, s, l],
                    [(h + 180) % 360, s, l],
                    [(h + 270) % 360, s, l],
                    [h, s * 0.8, l]
                ];
            }
        },
        split: {
            name: 'Complémentaire divisé',
            generate: (h, s, l) => {
                return [
                    [h, s, l],
                    [(h + 150) % 360, s, l],
                    [(h + 210) % 360, s, l],
                    [h, s * 0.8, l],
                    [(h + 180) % 360, s * 0.8, l]
                ];
            }
        }
    },

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.generatePalette();
        this.updateDisplay();
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('colorState', {
            format: 'hex',
            scheme: 'monochrome',
            history: [],
            favorites: []
        });

        this.state = {
            ...this.state,
            format: savedState.format,
            scheme: savedState.scheme,
            history: savedState.history,
            favorites: new Set(savedState.favorites)
        };
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

        // Entrée manuelle
        document.getElementById('colorInput')?.addEventListener('input', (e) => {
            this.parseColor(e.target.value);
        });

        // Boutons d'action
        document.getElementById('randomColor')?.addEventListener('click', () => {
            this.generateRandomColor();
        });

        document.getElementById('copyColor')?.addEventListener('click', () => {
            this.copyCurrentColor();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isColorGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.generateRandomColor();
            } else if (e.ctrlKey && e.key === 'c' && document.activeElement.id !== 'colorInput') {
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
        this.updateDisplay();
        this.addToHistory(color);
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
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        this.updateColor(color);
    },

    /**
     * Génère la palette de couleurs
     */
    generatePalette() {
        // Convertit la couleur en HSL
        const [h, s, l] = this.hexToHsl(this.state.color);
        
        // Génère la palette selon le schéma
        this.state.palette = this.schemes[this.state.scheme]
            .generate(h, s, l)
            .map(([h, s, l]) => this.hslToHex(h, s, l));

        this.updatePaletteDisplay();
    },

    /**
     * Parse une couleur entrée manuellement
     */
    parseColor(input) {
        let color = input.trim();

        // Hex
        if (color.match(/^#?[0-9a-f]{6}$/i)) {
            color = color.startsWith('#') ? color : '#' + color;
            this.updateColor(color);
            return;
        }

        // RGB
        const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
        if (rgbMatch) {
            const [, r, g, b] = rgbMatch;
            this.updateColor(this.rgbToHex(r, g, b));
            return;
        }

        // HSL
        const hslMatch = color.match(/^hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)$/i);
        if (hslMatch) {
            const [, h, s, l] = hslMatch;
            this.updateColor(this.hslToHex(h, s / 100, l / 100));
            return;
        }
    },

    /**
     * Copie la couleur courante
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
            timestamp: new Date().toISOString()
        });

        // Limite la taille de l'historique
        if (this.state.history.length > 20) {
            this.state.history.pop();
        }

        this.updateHistoryDisplay();
        this.saveState();
    },

    /**
     * Formate une couleur selon le format choisi
     */
    formatColor(color) {
        switch (this.state.format) {
            case 'hex':
                return color.toUpperCase();
            
            case 'rgb': {
                const [r, g, b] = this.hexToRgb(color);
                return `rgb(${r}, ${g}, ${b})`;
            }
            
            case 'hsl': {
                const [h, s, l] = this.hexToHsl(color);
                return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
            }
            
            case 'hsv': {
                const [h, s, v] = this.hexToHsv(color);
                return `hsv(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`;
            }
            
            case 'cmyk': {
                const [c, m, y, k] = this.hexToCmyk(color);
                return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
            }
        }
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay() {
        // Couleur principale
        const picker = document.getElementById('colorPicker');
        const input = document.getElementById('colorInput');
        
        if (picker) picker.value = this.state.color;
        if (input) input.value = this.formatColor(this.state.color);

        this.updatePaletteDisplay();
        this.updateHistoryDisplay();
    },

    /**
     * Met à jour l'affichage de la palette
     */
    updatePaletteDisplay() {
        const container = document.getElementById('colorPalette');
        if (!container) return;

        container.innerHTML = this.state.palette
            .map(color => `
                <div class="color-item" 
                     style="background-color: ${color}"
                     onclick="colorManager.updateColor('${color}')">
                    <div class="color-value">${this.formatColor(color)}</div>
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
                <div class="history-item" onclick="colorManager.updateColor('${entry.color}')">
                    <div class="color-preview" style="background-color: ${entry.color}"></div>
                    <div class="history-meta">
                        <div class="color-value">${this.formatColor(entry.color)}</div>
                        <div class="history-date">
                            ${new Date(entry.timestamp).toLocaleString('fr-FR')}
                        </div>
                    </div>
                </div>
            `)
            .join('');
    },

    /**
     * Convertit un code hexadécimal en RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ];
    },

    /**
     * Convertit RGB en code hexadécimal
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b]
            .map(x => parseInt(x).toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Convertit RGB en HSL
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

        return [h * 360, s, l];
    },

    /**
     * Convertit un code hexadécimal en HSL
     */
    hexToHsl(hex) {
        const [r, g, b] = this.hexToRgb(hex);
        return this.rgbToHsl(r, g, b);
    },

    /**
     * Convertit HSL en RGB
     */
    hslToRgb(h, s, l) {
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

            r = hue2rgb(p, q, h / 360 + 1/3);
            g = hue2rgb(p, q, h / 360);
            b = hue2rgb(p, q, h / 360 - 1/3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    },

    /**
     * Convertit HSL en code hexadécimal
     */
    hslToHex(h, s, l) {
        const [r, g, b] = this.hslToRgb(h, s, l);
        return this.rgbToHex(r, g, b);
    },

    /**
     * Convertit RGB en HSV
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

        return [h * 360, s, v];
    },

    /**
     * Convertit un code hexadécimal en HSV
     */
    hexToHsv(hex) {
        const [r, g, b] = this.hexToRgb(hex);
        return this.rgbToHsv(r, g, b);
    },

    /**
     * Convertit RGB en CMYK
     */
    rgbToCmyk(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const k = 1 - Math.max(r, g, b);
        const c = (1 - r - k) / (1 - k) || 0;
        const m = (1 - g - k) / (1 - k) || 0;
        const y = (1 - b - k) / (1 - k) || 0;

        return [c, m, y, k];
    },

    /**
     * Convertit un code hexadécimal en CMYK
     */
    hexToCmyk(hex) {
        const [r, g, b] = this.hexToRgb(hex);
        return this.rgbToCmyk(r, g, b);
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('colorState', {
            format: this.state.format,
            scheme: this.state.scheme,
            history: this.state.history,
            favorites: [...this.state.favorites]
        });
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveState();
    }
}; 