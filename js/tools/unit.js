import { Utils } from '../utils.js';

/**
 * UnitConverter - Module unifié pour la conversion d'unités
 * Module fusionnant les fonctionnalités des modules converter.js et unit.js
 */
export const UnitConverter = {
    // État de l'application
    state: {
        // Catégorie sélectionnée
        category: 'length',
        // Unité source
        fromUnit: 'm',
        // Unité cible
        toUnit: 'cm',
        // Valeur à convertir
        value: 1,
        // Résultat de la conversion
        result: '',
        // Historique des conversions récentes
        history: [],
        // Conversions favorites
        favorites: new Set(),
        // Taux de change (pour les devises)
        rates: {},
        // Date de dernière mise à jour des taux
        lastUpdate: null
    },

    // Définition des catégories et unités avec facteurs de conversion
    categories: {
        // Longueur (mètre comme unité de base)
        length: {
            name: 'Longueur',
            units: {
                km: { name: 'Kilomètre', factor: 1000, toBase: value => value * 1000, fromBase: value => value / 1000 },
                m: { name: 'Mètre', factor: 1, toBase: value => value, fromBase: value => value },
                cm: { name: 'Centimètre', factor: 0.01, toBase: value => value / 100, fromBase: value => value * 100 },
                mm: { name: 'Millimètre', factor: 0.001, toBase: value => value / 1000, fromBase: value => value * 1000 },
                mi: { name: 'Mile', factor: 1609.344, toBase: value => value * 1609.344, fromBase: value => value / 1609.344 },
                yd: { name: 'Yard', factor: 0.9144, toBase: value => value * 0.9144, fromBase: value => value / 0.9144 },
                ft: { name: 'Pied', factor: 0.3048, toBase: value => value * 0.3048, fromBase: value => value / 0.3048 },
                in: { name: 'Pouce', factor: 0.0254, toBase: value => value * 0.0254, fromBase: value => value / 0.0254 }
            }
        },
        // Masse (kilogramme comme unité de base)
        mass: {
            name: 'Masse',
            units: {
                t: { name: 'Tonne', factor: 1000, toBase: value => value * 1000, fromBase: value => value / 1000 },
                kg: { name: 'Kilogramme', factor: 1, toBase: value => value, fromBase: value => value },
                g: { name: 'Gramme', factor: 0.001, toBase: value => value / 1000, fromBase: value => value * 1000 },
                mg: { name: 'Milligramme', factor: 0.000001, toBase: value => value / 1000000, fromBase: value => value * 1000000 },
                lb: { name: 'Livre', factor: 0.45359237, toBase: value => value * 0.45359237, fromBase: value => value / 0.45359237 },
                oz: { name: 'Once', factor: 0.028349523125, toBase: value => value * 0.028349523125, fromBase: value => value / 0.028349523125 }
            }
        },
        // Volume (litre comme unité de base)
        volume: {
            name: 'Volume',
            units: {
                m3: { name: 'Mètre cube', factor: 1000, toBase: value => value * 1000, fromBase: value => value / 1000 },
                dm3: { name: 'Décimètre cube', factor: 1, toBase: value => value, fromBase: value => value },
                cm3: { name: 'Centimètre cube', factor: 0.001, toBase: value => value / 1000, fromBase: value => value * 1000 },
                L: { name: 'Litre', factor: 1, toBase: value => value, fromBase: value => value },
                l: { name: 'Litre', factor: 1, toBase: value => value, fromBase: value => value },
                mL: { name: 'Millilitre', factor: 0.001, toBase: value => value / 1000, fromBase: value => value * 1000 },
                ml: { name: 'Millilitre', factor: 0.001, toBase: value => value / 1000, fromBase: value => value * 1000 },
                gal: { name: 'Gallon (US)', factor: 3.78541178, toBase: value => value * 3.78541178, fromBase: value => value / 3.78541178 },
                qt: { name: 'Quart (US)', factor: 0.946352946, toBase: value => value * 0.946352946, fromBase: value => value / 0.946352946 },
                pt: { name: 'Pinte (US)', factor: 0.473176473, toBase: value => value * 0.473176473, fromBase: value => value / 0.473176473 },
                cup: { name: 'Tasse (US)', factor: 0.2365882365, toBase: value => value * 0.2365882365, fromBase: value => value / 0.2365882365 },
                floz: { name: 'Once liquide (US)', factor: 0.0295735295625, toBase: value => value * 0.0295735, fromBase: value => value / 0.0295735 }
            }
        },
        // Température (conversion spéciale)
        temperature: {
            name: 'Température',
            units: {
                C: { name: 'Celsius', toBase: value => value, fromBase: value => value },
                c: { name: 'Celsius', toBase: value => value, fromBase: value => value },
                F: { name: 'Fahrenheit', toBase: value => (value - 32) * 5/9, fromBase: value => value * 9/5 + 32 },
                f: { name: 'Fahrenheit', toBase: value => (value - 32) * 5/9, fromBase: value => value * 9/5 + 32 },
                K: { name: 'Kelvin', toBase: value => value - 273.15, fromBase: value => value + 273.15 },
                k: { name: 'Kelvin', toBase: value => value - 273.15, fromBase: value => value + 273.15 }
            }
        },
        // Surface (mètre carré comme unité de base)
        area: {
            name: 'Surface',
            units: {
                km2: { name: 'Kilomètre carré', factor: 1000000, toBase: value => value * 1000000, fromBase: value => value / 1000000 },
                m2: { name: 'Mètre carré', factor: 1, toBase: value => value, fromBase: value => value },
                cm2: { name: 'Centimètre carré', factor: 0.0001, toBase: value => value / 10000, fromBase: value => value * 10000 },
                mm2: { name: 'Millimètre carré', factor: 0.000001, toBase: value => value / 1000000, fromBase: value => value * 1000000 },
                ha: { name: 'Hectare', factor: 10000, toBase: value => value * 10000, fromBase: value => value / 10000 },
                ac: { name: 'Acre', factor: 4046.8564224, toBase: value => value * 4046.8564224, fromBase: value => value / 4046.8564224 },
                ft2: { name: 'Pied carré', factor: 0.09290304, toBase: value => value * 0.09290304, fromBase: value => value / 0.09290304 },
                in2: { name: 'Pouce carré', factor: 0.00064516, toBase: value => value * 0.00064516, fromBase: value => value / 0.00064516 }
            }
        },
        // Vitesse (mètre par seconde comme unité de base)
        speed: {
            name: 'Vitesse',
            units: {
                mps: { name: 'Mètre par seconde', factor: 1, toBase: value => value, fromBase: value => value },
                kph: { name: 'Kilomètre par heure', factor: 0.277777778, toBase: value => value / 3.6, fromBase: value => value * 3.6 },
                mph: { name: 'Mile par heure', factor: 0.44704, toBase: value => value * 0.44704, fromBase: value => value / 0.44704 },
                fps: { name: 'Pied par seconde', factor: 0.3048, toBase: value => value * 0.3048, fromBase: value => value / 0.3048 },
                knot: { name: 'Nœud', factor: 0.514444444, toBase: value => value * 0.51444444444, fromBase: value => value / 0.51444444444 }
            }
        },
        // Temps (seconde comme unité de base)
        time: {
            name: 'Temps',
            units: {
                y: { name: 'Année', factor: 31536000, toBase: value => value * 31536000, fromBase: value => value / 31536000 },
                mo: { name: 'Mois', factor: 2592000, toBase: value => value * 2592000, fromBase: value => value / 2592000 },
                w: { name: 'Semaine', factor: 604800, toBase: value => value * 604800, fromBase: value => value / 604800 },
                d: { name: 'Jour', factor: 86400, toBase: value => value * 86400, fromBase: value => value / 86400 },
                h: { name: 'Heure', factor: 3600, toBase: value => value * 3600, fromBase: value => value / 3600 },
                min: { name: 'Minute', factor: 60, toBase: value => value * 60, fromBase: value => value / 60 },
                s: { name: 'Seconde', factor: 1, toBase: value => value, fromBase: value => value },
                ms: { name: 'Milliseconde', factor: 0.001, toBase: value => value / 1000, fromBase: value => value * 1000 }
            }
        },
        // Pression (Pascal comme unité de base)
        pressure: {
            name: 'Pression',
            units: {
                pa: { name: 'Pascal', factor: 1, toBase: value => value, fromBase: value => value },
                kpa: { name: 'Kilopascal', factor: 1000, toBase: value => value * 1000, fromBase: value => value / 1000 },
                mpa: { name: 'Mégapascal', factor: 1000000, toBase: value => value * 1000000, fromBase: value => value / 1000000 },
                bar: { name: 'Bar', factor: 100000, toBase: value => value * 100000, fromBase: value => value / 100000 },
                atm: { name: 'Atmosphère', factor: 101325, toBase: value => value * 101325, fromBase: value => value / 101325 },
                mmhg: { name: 'mmHg', factor: 133.322, toBase: value => value * 133.322, fromBase: value => value / 133.322 },
                psi: { name: 'PSI', factor: 6894.76, toBase: value => value * 6894.76, fromBase: value => value / 6894.76 }
            }
        },
        // Énergie (Joule comme unité de base)
        energy: {
            name: 'Énergie',
            units: {
                j: { name: 'Joule', factor: 1, toBase: value => value, fromBase: value => value },
                kj: { name: 'Kilojoule', factor: 1000, toBase: value => value * 1000, fromBase: value => value / 1000 },
                cal: { name: 'Calorie', factor: 4.184, toBase: value => value * 4.184, fromBase: value => value / 4.184 },
                kcal: { name: 'Kilocalorie', factor: 4184, toBase: value => value * 4184, fromBase: value => value / 4184 },
                wh: { name: 'Watt-heure', factor: 3600, toBase: value => value * 3600, fromBase: value => value / 3600 },
                kwh: { name: 'Kilowatt-heure', factor: 3600000, toBase: value => value * 3600000, fromBase: value => value / 3600000 },
                ev: { name: 'Électron-volt', factor: 1.602176634e-19, toBase: value => value * 1.602176634e-19, fromBase: value => value / 1.602176634e-19 }
            }
        },
        // Puissance (Watt comme unité de base)
        power: {
            name: 'Puissance',
            units: {
                w: { name: 'Watt', factor: 1, toBase: value => value, fromBase: value => value },
                kw: { name: 'Kilowatt', factor: 1000, toBase: value => value * 1000, fromBase: value => value / 1000 },
                mw: { name: 'Mégawatt', factor: 1000000, toBase: value => value * 1000000, fromBase: value => value / 1000000 },
                hp: { name: 'Cheval-vapeur', factor: 745.7, toBase: value => value * 745.7, fromBase: value => value / 745.7 }
            }
        },
        // Données informatiques (octet comme unité de base)
        data: {
            name: 'Données',
            units: {
                b: { name: 'Octet', factor: 1, toBase: value => value, fromBase: value => value },
                kb: { name: 'Kilooctet', factor: 1024, toBase: value => value * 1024, fromBase: value => value / 1024 },
                mb: { name: 'Mégaoctet', factor: 1048576, toBase: value => value * 1048576, fromBase: value => value / 1048576 },
                gb: { name: 'Gigaoctet', factor: 1073741824, toBase: value => value * 1073741824, fromBase: value => value / 1073741824 },
                tb: { name: 'Téraoctet', factor: 1099511627776, toBase: value => value * 1099511627776, fromBase: value => value / 1099511627776 },
                bit: { name: 'Bit', factor: 0.125, toBase: value => value / 8, fromBase: value => value * 8 },
                kbit: { name: 'Kilobit', factor: 128, toBase: value => value * 128, fromBase: value => value / 128 },
                mbit: { name: 'Mégabit', factor: 131072, toBase: value => value * 131072, fromBase: value => value / 131072 },
                gbit: { name: 'Gigabit', factor: 134217728, toBase: value => value * 134217728, fromBase: value => value / 134217728 }
            }
        }
    },

    // Devises pour le convertisseur de devises
    CURRENCIES: {
        EUR: { symbol: '€', name: 'Euro' },
        USD: { symbol: '$', name: 'Dollar américain' },
        GBP: { symbol: '£', name: 'Livre sterling' },
        JPY: { symbol: '¥', name: 'Yen japonais' },
        CHF: { symbol: 'CHF', name: 'Franc suisse' },
        CAD: { symbol: 'C$', name: 'Dollar canadien' },
        AUD: { symbol: 'A$', name: 'Dollar australien' },
        CNY: { symbol: '¥', name: 'Yuan chinois' }
    },

    /**
     * Initialise le convertisseur d'unités
     */
    init() {
        console.log("Initialisation du convertisseur d'unités...");
        
        try {
            // Charge l'état sauvegardé
            this.loadState();
            
            // Mise à jour de l'interface utilisateur
            this.updateDisplay();
            
            // Configuration des écouteurs d'événements
            this.setupListeners();
            
            // Calcul initial
            this.convert();
            
            // Déclencher manuellement un événement input pour forcer le calcul automatique
            setTimeout(() => {
                const inputElement = document.getElementById('fromValue');
                if (inputElement) {
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, 300); // Délai pour s'assurer que tout est bien chargé
            
            console.log("Initialisation terminée avec succès");
        } catch (error) {
            console.error("Erreur lors de l'initialisation:", error);
        }
    },

    /**
     * Charge l'état sauvegardé du convertisseur
     */
    loadState() {
        const savedState = Utils.loadFromStorage('unitConverterState', {
            category: 'length',
            history: [],
            favorites: [],
            rates: {},
            lastUpdate: null
        });

        this.state = {
            ...this.state,
            category: savedState.category || 'length',
            history: savedState.history || [],
            favorites: new Set(savedState.favorites || []),
            rates: savedState.rates || {},
            lastUpdate: savedState.lastUpdate || null
        };
        
        // Assurons-nous que la catégorie existe
        if (!this.categories[this.state.category]) {
            this.state.category = 'length';  // Fallback sur la longueur
        }
        
        // Définition des unités par défaut pour la catégorie sélectionnée
        this.setDefaultUnits();
    },

    /**
     * Définit les unités par défaut pour la catégorie sélectionnée
     */
    setDefaultUnits() {
        const units = Object.keys(this.categories[this.state.category].units);
        
        if (units.length >= 2) {
            // Si ce sont des unités courantes et logiques, les utiliser
            if (this.state.category === 'length') {
                this.state.fromUnit = 'm';
                this.state.toUnit = 'cm';
            } else if (this.state.category === 'mass') {
                this.state.fromUnit = 'kg';
                this.state.toUnit = 'g';
            } else if (this.state.category === 'temperature') {
                this.state.fromUnit = 'C';
                this.state.toUnit = 'F';
            } else {
                // Sinon, prendre les deux premières unités
                this.state.fromUnit = units[0];
                this.state.toUnit = units[1];
            }
        } else if (units.length === 1) {
            // S'il n'y a qu'une seule unité, l'utiliser pour les deux
            this.state.fromUnit = units[0];
            this.state.toUnit = units[0];
        } else {
            console.error("Aucune unité trouvée pour la catégorie:", this.state.category);
        }
    },

    /**
     * Configure les écouteurs d'événements pour l'interface utilisateur
     */
    setupListeners() {
        // Sélection de la catégorie
        const categorySelect = document.getElementById('conversionCategory');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.changeCategory(e.target.value);
            });
        }

        // Sélection des unités
        const fromUnitSelect = document.getElementById('fromUnit');
        if (fromUnitSelect) {
            fromUnitSelect.addEventListener('change', (e) => {
                this.state.fromUnit = e.target.value;
                this.convert();
                this.updateFormula();
            });
        }

        const toUnitSelect = document.getElementById('toUnit');
        if (toUnitSelect) {
            toUnitSelect.addEventListener('change', (e) => {
                this.state.toUnit = e.target.value;
                this.convert();
                this.updateFormula();
            });
        }

        // Saisie de la valeur
        const fromValueInput = document.getElementById('fromValue');
        if (fromValueInput) {
            fromValueInput.addEventListener('input', (e) => {
                this.state.value = e.target.value;
                this.convert();
            });
            
            // Assurer que la valeur initiale est définie
            fromValueInput.value = this.state.value;
            
            // Écouter également l'événement change
            fromValueInput.addEventListener('change', (e) => {
                this.state.value = e.target.value;
                this.convert();
            });
        }

        // Inverser les unités
        const swapButton = document.getElementById('swapUnits');
        if (swapButton) {
            swapButton.addEventListener('click', () => {
                this.swapUnits();
            });
        }

        // Effacer l'historique
        const clearHistoryButton = document.getElementById('clearConversionHistory');
        if (clearHistoryButton) {
            clearHistoryButton.addEventListener('click', () => {
                this.clearHistory();
            });
        }
        
        // Favoris (si disponible)
        const favoriteButton = document.getElementById('toggleFavorite');
        if (favoriteButton) {
            favoriteButton.addEventListener('click', () => {
                this.toggleFavorite();
            });
        }
        
        // Copier résultat (si disponible)
        const copyButton = document.getElementById('copyResult');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyResult();
            });
        }
    },

    /**
     * Change la catégorie d'unités
     * @param {string} category - La nouvelle catégorie
     */
    changeCategory(category) {
        if (!this.categories[category]) {
            console.error("Catégorie invalide:", category);
            return;
        }

        this.state.category = category;
        this.setDefaultUnits();
        
        // Mettre à jour l'interface utilisateur
        this.updateDisplay();
        
        // Forcer une mise à jour du formulaire
        this.updateFormula();
        
        // Mettre à jour les sélections dans les éléments DOM
        const fromUnitSelect = document.getElementById('fromUnit');
        const toUnitSelect = document.getElementById('toUnit');
        
        if (fromUnitSelect) {
            fromUnitSelect.value = this.state.fromUnit;
        }
        
        if (toUnitSelect) {
            toUnitSelect.value = this.state.toUnit;
        }
        
        // Sauvegarder le nouvel état
        this.saveState();
    },

    /**
     * Inverse les unités source et cible
     */
    swapUnits() {
        // Sauvegarder la valeur actuelle et le résultat
        const currentValue = this.state.value;
        const currentResult = this.state.result;
        
        // Inverser les unités
        [this.state.fromUnit, this.state.toUnit] = [this.state.toUnit, this.state.fromUnit];
        
        // Mettre à jour l'interface utilisateur pour refléter les nouvelles unités
        this.updateUnitSelects();
        
        // Si un résultat existe, utiliser ce résultat comme nouvelle valeur d'entrée
        if (currentResult && currentResult !== '') {
            this.state.value = currentResult;
            
            // Mettre à jour le champ de saisie
            const fromValueInput = document.getElementById('fromValue');
            if (fromValueInput) {
                fromValueInput.value = this.state.value;
            }
        }
        
        // Effectuer la conversion avec les nouvelles unités
        this.convert();
        
        // Mettre à jour la formule
        this.updateFormula();
    },

    /**
     * Effectue la conversion entre les unités sélectionnées
     */
    convert() {
        // Valider et nettoyer la valeur d'entrée
        let value;
        
        if (this.state.value === '' || this.state.value === null) {
            value = 0;
        } else {
            // Essayer de convertir en nombre, en acceptant différents formats
            value = parseFloat(String(this.state.value).replace(',', '.'));
        }
        
        // Si la valeur n'est pas un nombre valide après conversion
        if (isNaN(value)) {
            this.state.result = '';
            this.updateResult();
            return;
        }

        let result;

        // Cas spécial pour les températures
        if (this.state.category === 'temperature') {
            result = this.convertTemperature(value);
        } else {
            // Conversion standard basée sur les facteurs ou méthodes toBase/fromBase
            const fromUnit = this.categories[this.state.category].units[this.state.fromUnit];
            const toUnit = this.categories[this.state.category].units[this.state.toUnit];
            
            if (!fromUnit || !toUnit) {
                console.error("Unités invalides:", this.state.fromUnit, this.state.toUnit);
                this.state.result = '';
                this.updateResult();
                return;
            }
            
            // Si les méthodes toBase/fromBase sont disponibles, les utiliser
            if (typeof fromUnit.toBase === 'function' && typeof toUnit.fromBase === 'function') {
                const baseValue = fromUnit.toBase(value);
                result = toUnit.fromBase(baseValue);
            } else {
                // Sinon, utiliser les facteurs
                result = value * fromUnit.factor / toUnit.factor;
            }
        }

        // Formate le résultat
        this.state.result = this.formatNumber(result);
        
        // Ajoute à l'historique si la conversion est complète et que la valeur n'est pas zéro
        if (this.state.result && value !== 0) {
            this.addToHistory({
                category: this.state.category,
                fromUnit: this.state.fromUnit,
                toUnit: this.state.toUnit,
                value: this.state.value,
                result: this.state.result,
                timestamp: new Date().toISOString()
            });
        }

        this.updateResult();
        this.updateFormula();
    },

    /**
     * Convertit les températures avec formules spécifiques
     * @param {number} value - Valeur à convertir
     * @returns {number} Résultat de la conversion
     */
    convertTemperature(value) {
        const from = this.state.fromUnit.toUpperCase();
        const to = this.state.toUnit.toUpperCase();

        // Convertit d'abord en Kelvin
        let kelvin;
        switch (from) {
            case 'C':
                kelvin = value + 273.15;
                break;
            case 'F':
                kelvin = (value + 459.67) * 5/9;
                break;
            case 'K':
                kelvin = value;
                break;
            default:
                return null;
        }

        // Puis convertit de Kelvin vers l'unité cible
        switch (to) {
            case 'C':
                return kelvin - 273.15;
            case 'F':
                return kelvin * 9/5 - 459.67;
            case 'K':
                return kelvin;
            default:
                return null;
        }
    },

    /**
     * Formate le résultat avec une précision adaptée
     * @param {number} value - Valeur à formater
     * @returns {string} Valeur formatée
     */
    formatNumber(value) {
        if (value === null || value === undefined || isNaN(value)) return '';

        // Détermine la précision appropriée
        let precision;
        const absValue = Math.abs(value);
        
        if (absValue >= 100) {
            precision = 2;
        } else if (absValue >= 10) {
            precision = 3;
        } else if (absValue >= 1) {
            precision = 4;
        } else if (absValue === 0) {
            precision = 2;
        } else {
            // Trouve la première décimale non nulle et ajoute 2 décimales supplémentaires
            const strValue = absValue.toExponential(10);
            const decimalPart = strValue.split('e')[0].split('.')[1];
            let firstNonZero = 0;
            
            for (let i = 0; i < decimalPart.length; i++) {
                if (decimalPart[i] !== '0') {
                    firstNonZero = i;
                    break;
                }
            }
            
            precision = Math.min(firstNonZero + 3, 10);
        }

        // Formate le nombre avec séparateurs
        return Number(value.toFixed(precision))
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },

    /**
     * Ajoute une conversion à l'historique
     * @param {Object} entry - Détails de la conversion
     */
    addToHistory(entry) {
        // Vérifie si une entrée identique existe déjà
        const existingIndex = this.state.history.findIndex(item => 
            item.category === entry.category &&
            item.fromUnit === entry.fromUnit &&
            item.toUnit === entry.toUnit &&
            item.value === entry.value
        );

        // Si elle existe, la supprimer
        if (existingIndex !== -1) {
            this.state.history.splice(existingIndex, 1);
        }

        // Ajouter la nouvelle entrée au début
        this.state.history.unshift(entry);
        
        // Limiter la taille de l'historique
        if (this.state.history.length > 10) {
            this.state.history.pop();
        }

        this.updateHistory();
        this.saveState();
    },

    /**
     * Efface l'historique des conversions
     */
    clearHistory() {
        this.state.history = [];
        this.updateHistory();
        this.saveState();
        Utils.showNotification('Historique de conversion effacé', 'info');
    },

    /**
     * Active/désactive une conversion favorite
     */
    toggleFavorite() {
        const key = `${this.state.category}:${this.state.fromUnit}:${this.state.toUnit}`;
        
        if (this.state.favorites.has(key)) {
            this.state.favorites.delete(key);
            Utils.showNotification('Conversion retirée des favoris', 'info');
        } else {
            this.state.favorites.add(key);
            Utils.showNotification('Conversion ajoutée aux favoris', 'success');
        }

        this.updateFavoriteButton();
        this.saveState();
    },

    /**
     * Copie le résultat de la conversion dans le presse-papiers
     */
    copyResult() {
        if (!this.state.result) return;
        
        const fromUnitName = this.categories[this.state.category].units[this.state.fromUnit].name;
        const toUnitName = this.categories[this.state.category].units[this.state.toUnit].name;
        const text = `${this.state.value} ${fromUnitName} = ${this.state.result} ${toUnitName}`;
        
        Utils.copyToClipboard(text)
            .then(() => Utils.showNotification('Résultat copié !', 'success'))
            .catch(() => Utils.showNotification('Erreur lors de la copie', 'error'));
    },

    /**
     * Met à jour l'affichage complet de l'interface
     */
    updateDisplay() {
        console.log("Mise à jour de l'affichage...");
        
        // Vérifier et mettre à jour tous les composants d'interface
        this.updateCategorySelect();
        this.updateUnitSelects();
        this.updateResult();
        this.updateFormula();
        this.updateHistory();
        this.updateCommonConversions();
        
        if (document.getElementById('toggleFavorite')) {
            this.updateFavoriteButton();
        }
        
        // Forcer un calcul après la mise à jour de l'affichage
        // si une valeur existe déjà
        if (this.state.value) {
            this.convert();
        }
    },

    /**
     * Met à jour la sélection de catégorie
     */
    updateCategorySelect() {
        const select = document.getElementById('conversionCategory');
        if (!select) return;

        // Générer les options de catégorie
        const options = Object.entries(this.categories)
            .map(([key, category]) => `
                <option value="${key}" ${key === this.state.category ? 'selected' : ''}>
                    ${category.name}
                </option>
            `)
            .join('');
            
        select.innerHTML = options;
        
        // Vérifie que la valeur est correctement définie
        select.value = this.state.category;
    },

    /**
     * Met à jour les sélections d'unités
     */
    updateUnitSelects() {
        const fromSelect = document.getElementById('fromUnit');
        const toSelect = document.getElementById('toUnit');
        
        if (!fromSelect || !toSelect) return;

        const category = this.categories[this.state.category];
        if (!category) return;

        const units = category.units;
        
        // Sauvegarder les sélections actuelles
        const currentFromUnit = this.state.fromUnit;
        const currentToUnit = this.state.toUnit;
        
        // Générer les options pour les unités
        const options = Object.entries(units)
            .map(([key, unit]) => `
                <option value="${key}">
                    ${unit.name} (${key})
                </option>
            `)
            .join('');

        // Mettre à jour les listes déroulantes
        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;

        // S'assurer que les unités sélectionnées existent, sinon utiliser les valeurs par défaut
        if (!units[currentFromUnit]) {
            this.state.fromUnit = Object.keys(units)[0];
        }
        
        if (!units[currentToUnit]) {
            this.state.toUnit = Object.keys(units)[1] || Object.keys(units)[0];
        }

        // Définir les valeurs sélectionnées
        fromSelect.value = this.state.fromUnit;
        toSelect.value = this.state.toUnit;
    },

    /**
     * Met à jour l'affichage du résultat
     */
    updateResult() {
        const toValueInput = document.getElementById('toValue');
        if (!toValueInput) {
            console.error("Élément #toValue non trouvé");
            return;
        }

        toValueInput.value = this.state.result || '';
    },

    /**
     * Met à jour la formule de conversion
     */
    updateFormula() {
        const formulaElement = document.getElementById('conversionFormula');
        if (!formulaElement) {
            console.error("Élément #conversionFormula non trouvé");
            return;
        }

        const category = this.categories[this.state.category];
        if (!category) return;

        const fromUnit = category.units[this.state.fromUnit];
        const toUnit = category.units[this.state.toUnit];
        
        if (!fromUnit || !toUnit) return;

        // Calcul d'un exemple simple pour la formule (1 unité)
        let result;
        
        if (this.state.category === 'temperature') {
            const tempFrom = this.state.fromUnit;
            const tempTo = this.state.toUnit;
            
            // Sauvegarder l'état actuel
            const currentFromUnit = this.state.fromUnit;
            const currentToUnit = this.state.toUnit;
            
            // Conversion pour 1 unité
            this.state.fromUnit = currentFromUnit;
            this.state.toUnit = currentToUnit;
            result = this.convertTemperature(1);
            
            // Restaurer l'état
            this.state.fromUnit = currentFromUnit;
            this.state.toUnit = currentToUnit;
        } else {
            // Si les méthodes toBase/fromBase sont disponibles, les utiliser
            if (typeof fromUnit.toBase === 'function' && typeof toUnit.fromBase === 'function') {
                const baseValue = fromUnit.toBase(1);
                result = toUnit.fromBase(baseValue);
            } else {
                // Sinon, utiliser les facteurs
                result = fromUnit.factor / toUnit.factor;
            }
        }
        
        formulaElement.textContent = `1 ${fromUnit.name} = ${this.formatNumber(result)} ${toUnit.name}`;
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistory() {
        const historyContainer = document.getElementById('conversionHistory');
        if (!historyContainer) return;

        if (this.state.history.length === 0) {
            historyContainer.innerHTML = `
                <p class="history-empty">Aucune conversion récente</p>
            `;
            return;
        }

        historyContainer.innerHTML = this.state.history
            .map((entry, index) => {
                // Vérifier si la catégorie et les unités existent
                const category = this.categories[entry.category];
                if (!category) return '';
                
                const fromUnitObj = category.units[entry.fromUnit];
                const toUnitObj = category.units[entry.toUnit];
                if (!fromUnitObj || !toUnitObj) return '';

                // Formatage de la date
                const date = new Date(entry.timestamp);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

                return `
                    <div class="history-item" data-index="${index}">
                        <div class="history-conversion">
                            <span class="history-value">${entry.value} ${fromUnitObj.name}</span>
                            <span class="history-arrow">→</span>
                            <span class="history-value">${entry.result} ${toUnitObj.name}</span>
                        </div>
                        <div class="history-time">${formattedDate}</div>
                    </div>
                `;
            })
            .join('');

        // Ajouter des écouteurs d'événements pour les éléments de l'historique
        const historyItems = historyContainer.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                if (isNaN(index) || !this.state.history[index]) return;
                
                const entry = this.state.history[index];
                this.useHistoryEntry(entry);
            });
        });
    },

    /**
     * Utilise une entrée de l'historique
     * @param {Object} entry - Entrée d'historique à utiliser
     */
    useHistoryEntry(entry) {
        // Vérifier si la catégorie et les unités existent toujours
        if (!this.categories[entry.category]) return;
        
        const category = this.categories[entry.category];
        if (!category.units[entry.fromUnit] || !category.units[entry.toUnit]) return;

        // Mettre à jour l'état
        this.state.category = entry.category;
        this.state.fromUnit = entry.fromUnit;
        this.state.toUnit = entry.toUnit;
        this.state.value = entry.value;
        
        // Mettre à jour l'interface
        const categorySelect = document.getElementById('conversionCategory');
        const fromValueInput = document.getElementById('fromValue');
        
        if (categorySelect) {
            categorySelect.value = entry.category;
        }
        
        if (fromValueInput) {
            fromValueInput.value = entry.value;
        }
        
        // Mettre à jour les sélecteurs d'unités pour la catégorie sélectionnée
        this.updateUnitSelects();
        
        // Effectuer la conversion
        this.convert();
        
        // Mettre à jour tout l'affichage
        this.updateFormula();
        this.updateCommonConversions();
        
        // Notification
        Utils.showNotification('Conversion chargée depuis l\'historique', 'info');
    },

    /**
     * Met à jour le bouton des favoris
     */
    updateFavoriteButton() {
        const button = document.getElementById('toggleFavorite');
        if (!button) return;

        const key = `${this.state.category}:${this.state.fromUnit}:${this.state.toUnit}`;
        const isFavorite = this.state.favorites.has(key);

        button.innerHTML = `<i class="fas fa-star${isFavorite ? '' : '-o'}"></i>`;
        button.title = isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
        button.setAttribute('aria-label', isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris');
    },

    /**
     * Met à jour la section des conversions courantes
     */
    updateCommonConversions() {
        const container = document.getElementById('commonConversions');
        if (!container) return;

        container.innerHTML = '';

        // Définir quelques conversions courantes par catégorie
        const commonConversions = {
            length: [
                { from: 'm', to: 'cm', value: 1 },
                { from: 'km', to: 'mi', value: 1 },
                { from: 'ft', to: 'cm', value: 1 }
            ],
            mass: [
                { from: 'kg', to: 'lb', value: 1 },
                { from: 'g', to: 'oz', value: 100 }
            ],
            volume: [
                { from: 'L', to: 'gal', value: 1 },
                { from: 'mL', to: 'floz', value: 100 }
            ],
            temperature: [
                { from: 'C', to: 'F', value: 0 },
                { from: 'C', to: 'K', value: 20 }
            ],
            area: [
                { from: 'm2', to: 'ft2', value: 1 },
                { from: 'ha', to: 'ac', value: 1 }
            ],
            speed: [
                { from: 'kph', to: 'mph', value: 100 },
                { from: 'mps', to: 'kph', value: 1 }
            ],
            time: [
                { from: 'h', to: 'min', value: 1 },
                { from: 'd', to: 'h', value: 1 }
            ],
            pressure: [
                { from: 'bar', to: 'psi', value: 1 },
                { from: 'atm', to: 'bar', value: 1 }
            ],
            energy: [
                { from: 'j', to: 'cal', value: 1000 },
                { from: 'kwh', to: 'j', value: 1 }
            ],
            data: [
                { from: 'mb', to: 'kb', value: 1 },
                { from: 'gb', to: 'mb', value: 1 }
            ]
        };

        const currentCommonConversions = commonConversions[this.state.category] || [];

        currentCommonConversions.forEach(conv => {
            const category = this.categories[this.state.category];
            if (!category) return;
            
            const fromUnit = category.units[conv.from];
            const toUnit = category.units[conv.to];
            
            if (!fromUnit || !toUnit) return;

            // Calculer le résultat
            let result;
            if (this.state.category === 'temperature') {
                const tempFrom = this.state.fromUnit;
                const tempTo = this.state.toUnit;
                
                this.state.fromUnit = conv.from;
                this.state.toUnit = conv.to;
                result = this.convertTemperature(conv.value);
                
                // Restaurer les unités
                this.state.fromUnit = tempFrom;
                this.state.toUnit = tempTo;
            } else {
                // Si les méthodes toBase/fromBase sont disponibles, les utiliser
                if (typeof fromUnit.toBase === 'function' && typeof toUnit.fromBase === 'function') {
                    const baseValue = fromUnit.toBase(conv.value);
                    result = toUnit.fromBase(baseValue);
                } else {
                    // Sinon, utiliser les facteurs
                    result = conv.value * fromUnit.factor / toUnit.factor;
                }
            }

            const conversionCard = document.createElement('div');
            conversionCard.className = 'common-conversion-card';
            conversionCard.innerHTML = `
                <div class="common-conversion-value">${conv.value} ${fromUnit.name}</div>
                <div class="common-conversion-equals">=</div>
                <div class="common-conversion-result">${this.formatNumber(result)} ${toUnit.name}</div>
            `;
            
            // Ajouter un événement pour appliquer cette conversion
            conversionCard.addEventListener('click', () => {
                this.state.fromUnit = conv.from;
                this.state.toUnit = conv.to;
                this.state.value = conv.value;
                
                // Mettre à jour l'interface
                const fromValueInput = document.getElementById('fromValue');
                if (fromValueInput) fromValueInput.value = this.state.value;
                
                this.updateUnitSelects();
                this.convert();
            });
            
            container.appendChild(conversionCard);
        });
    },

    /**
     * Sauvegarde l'état actuel du convertisseur
     */
    saveState() {
        try {
            Utils.saveToStorage('unitConverterState', {
                category: this.state.category,
                history: this.state.history,
                favorites: [...this.state.favorites],
                rates: this.state.rates,
                lastUpdate: this.state.lastUpdate
            });
            console.log("État sauvegardé avec succès");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'état:", error);
        }
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveState();
        console.log("Ressources libérées");
    },

    /**
     * Initialise le convertisseur de devises
     */
    initCurrencyConverter() {
        this.loadCurrencyState();
        this.setupCurrencySelects();
        this.updateRates();
    },

    /**
     * Charge l'état sauvegardé du convertisseur de devises
     */
    loadCurrencyState() {
        const savedState = localStorage.getItem('currencyState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            if (parsed.lastUpdate && (Date.now() - new Date(parsed.lastUpdate).getTime() < 3600000)) {
                this.state.rates = parsed.rates || {};
                this.state.lastUpdate = parsed.lastUpdate;
                this.updateDisplay();
                return;
            }
        }
        this.updateRates();
    },

    /**
     * Configure les sélecteurs de devises
     */
    setupCurrencySelects() {
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        
        if (!fromSelect || !toSelect) return;

        Object.entries(this.CURRENCIES).forEach(([code, data]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} - ${data.name}`;
            fromSelect.appendChild(option.cloneNode(true));
            toSelect.appendChild(option);
        });

        // Valeurs par défaut
        fromSelect.value = 'EUR';
        toSelect.value = 'USD';
    },

    /**
     * Met à jour les taux de change
     */
    async updateRates() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
            if (!response.ok) throw new Error('Erreur réseau');
            
            const data = await response.json();
            this.state.rates = data.rates;
            this.state.lastUpdate = new Date().toISOString();
            
            this.saveCurrencyState();
            
            // Notification de succès
            Utils.showNotification('Taux de change mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la mise à jour des taux:', error);
            Utils.showNotification('Impossible de mettre à jour les taux de change', 'error');
        }
    },

    /**
     * Convertit les devises
     */
    convertCurrency() {
        const amount = parseFloat(document.getElementById('fromAmount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        
        if (isNaN(amount)) {
            document.getElementById('toAmount').value = '';
            return;
        }
        
        const result = this.convertCurrencyAmount(amount, fromCurrency, toCurrency);
        document.getElementById('toAmount').value = result.toFixed(2);
        
        // Ajoute à l'historique
        this.addToHistory({
            category: 'currency',
            fromUnit: fromCurrency,
            toUnit: toCurrency,
            value: amount,
            result: result.toFixed(2),
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Convertit un montant entre deux devises
     * @param {number} amount - Montant à convertir
     * @param {string} from - Devise source
     * @param {string} to - Devise cible
     * @returns {number} Montant converti
     */
    convertCurrencyAmount(amount, from, to) {
        if (!this.state.rates[from] || !this.state.rates[to]) return 0;
        
        // Conversion via EUR comme devise de base
        const amountInEUR = from === 'EUR' ? amount : amount / this.state.rates[from];
        return to === 'EUR' ? amountInEUR : amountInEUR * this.state.rates[to];
    },

    /**
     * Échange les devises
     */
    swapCurrencies() {
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        const fromAmount = document.getElementById('fromAmount');
        const toAmount = document.getElementById('toAmount');
        
        if (!fromSelect || !toSelect || !fromAmount || !toAmount) return;
        
        [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
        [fromAmount.value, toAmount.value] = [toAmount.value, fromAmount.value];
        
        this.convertCurrency();
    },

    /**
     * Sauvegarde l'état du convertisseur de devises
     */
    saveCurrencyState() {
        try {
            localStorage.setItem('currencyState', JSON.stringify({
                rates: this.state.rates,
                lastUpdate: this.state.lastUpdate
            }));
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'état des devises:", error);
        }
    }
};

// Initialisation quand l'outil est chargé dynamiquement
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si les éléments du convertisseur sont présents dans la page
    if (document.getElementById('conversionCategory')) {
        UnitConverter.init();
    }
});

// Exporter le module pour une utilisation externe
export { UnitConverter as initUnitConverter }; 