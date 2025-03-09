import { Utils } from '../utils.js';

/**
 * Gestionnaire du convertisseur d'unités
 */
export const ConverterManager = {
    state: {
        category: 'length', // Catégorie actuelle
        fromUnit: '', // Unité source
        toUnit: '', // Unité cible
        value: '', // Valeur à convertir
        result: '', // Résultat de la conversion
        history: [], // Historique des conversions
        favorites: new Set(), // Conversions favorites
        rates: {},
        lastUpdate: null
    },

    // Définition des catégories et unités
    categories: {
        length: {
            name: 'Longueur',
            units: {
                km: { name: 'Kilomètre', factor: 1000 },
                m: { name: 'Mètre', factor: 1 },
                cm: { name: 'Centimètre', factor: 0.01 },
                mm: { name: 'Millimètre', factor: 0.001 },
                mi: { name: 'Mile', factor: 1609.344 },
                yd: { name: 'Yard', factor: 0.9144 },
                ft: { name: 'Pied', factor: 0.3048 },
                in: { name: 'Pouce', factor: 0.0254 }
            }
        },
        mass: {
            name: 'Masse',
            units: {
                t: { name: 'Tonne', factor: 1000 },
                kg: { name: 'Kilogramme', factor: 1 },
                g: { name: 'Gramme', factor: 0.001 },
                mg: { name: 'Milligramme', factor: 0.000001 },
                lb: { name: 'Livre', factor: 0.45359237 },
                oz: { name: 'Once', factor: 0.028349523125 }
            }
        },
        volume: {
            name: 'Volume',
            units: {
                m3: { name: 'Mètre cube', factor: 1000 },
                L: { name: 'Litre', factor: 1 },
                mL: { name: 'Millilitre', factor: 0.001 },
                gal: { name: 'Gallon (US)', factor: 3.78541178 },
                qt: { name: 'Quart (US)', factor: 0.946352946 },
                pt: { name: 'Pinte (US)', factor: 0.473176473 },
                cup: { name: 'Tasse (US)', factor: 0.2365882365 },
                floz: { name: 'Once liquide (US)', factor: 0.0295735295625 }
            }
        },
        temperature: {
            name: 'Température',
            units: {
                C: { name: 'Celsius' },
                F: { name: 'Fahrenheit' },
                K: { name: 'Kelvin' }
            }
        },
        area: {
            name: 'Surface',
            units: {
                km2: { name: 'Kilomètre carré', factor: 1000000 },
                m2: { name: 'Mètre carré', factor: 1 },
                cm2: { name: 'Centimètre carré', factor: 0.0001 },
                mm2: { name: 'Millimètre carré', factor: 0.000001 },
                ha: { name: 'Hectare', factor: 10000 },
                ac: { name: 'Acre', factor: 4046.8564224 },
                ft2: { name: 'Pied carré', factor: 0.09290304 },
                in2: { name: 'Pouce carré', factor: 0.00064516 }
            }
        },
        speed: {
            name: 'Vitesse',
            units: {
                mps: { name: 'Mètre par seconde', factor: 1 },
                kph: { name: 'Kilomètre par heure', factor: 0.277777778 },
                mph: { name: 'Mile par heure', factor: 0.44704 },
                fps: { name: 'Pied par seconde', factor: 0.3048 },
                knot: { name: 'Nœud', factor: 0.514444444 }
            }
        },
        time: {
            name: 'Temps',
            units: {
                y: { name: 'Année', factor: 31536000 },
                mo: { name: 'Mois', factor: 2592000 },
                w: { name: 'Semaine', factor: 604800 },
                d: { name: 'Jour', factor: 86400 },
                h: { name: 'Heure', factor: 3600 },
                min: { name: 'Minute', factor: 60 },
                s: { name: 'Seconde', factor: 1 },
                ms: { name: 'Milliseconde', factor: 0.001 }
            }
        }
    },

    /**
     * Initialise le convertisseur
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
        const savedState = Utils.loadFromStorage('converterState', {
            category: 'length',
            history: [],
            favorites: [],
            rates: {},
            lastUpdate: null
        });

        this.state = {
            ...this.state,
            category: savedState.category,
            history: savedState.history,
            favorites: new Set(savedState.favorites),
            rates: savedState.rates,
            lastUpdate: savedState.lastUpdate
        };

        // Définit les unités par défaut pour la catégorie
        const units = Object.keys(this.categories[this.state.category].units);
        this.state.fromUnit = units[0];
        this.state.toUnit = units[1];
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Sélection de la catégorie
        document.getElementById('converterCategory')?.addEventListener('change', (e) => {
            this.changeCategory(e.target.value);
        });

        // Sélection des unités
        document.getElementById('fromUnit')?.addEventListener('change', (e) => {
            this.state.fromUnit = e.target.value;
            this.convert();
        });

        document.getElementById('toUnit')?.addEventListener('change', (e) => {
            this.state.toUnit = e.target.value;
            this.convert();
        });

        // Saisie de la valeur
        document.getElementById('converterInput')?.addEventListener('input', (e) => {
            this.state.value = e.target.value;
            this.convert();
        });

        // Inverser les unités
        document.getElementById('swapUnits')?.addEventListener('click', () => {
            this.swapUnits();
        });

        // Favoris
        document.getElementById('toggleFavorite')?.addEventListener('click', () => {
            this.toggleFavorite();
        });

        // Copier le résultat
        document.getElementById('copyResult')?.addEventListener('click', () => {
            this.copyResult();
        });
    },

    /**
     * Change la catégorie
     */
    changeCategory(category) {
        if (!this.categories[category]) return;

        this.state.category = category;
        
        // Réinitialise les unités
        const units = Object.keys(this.categories[category].units);
        this.state.fromUnit = units[0];
        this.state.toUnit = units[1];
        
        this.updateUnitSelects();
        this.convert();
        this.saveState();
    },

    /**
     * Inverse les unités source et cible
     */
    swapUnits() {
        [this.state.fromUnit, this.state.toUnit] = [this.state.toUnit, this.state.fromUnit];
        this.updateUnitSelects();
        this.convert();
    },

    /**
     * Effectue la conversion
     */
    convert() {
        if (!this.state.value || isNaN(this.state.value)) {
            this.state.result = '';
            this.updateDisplay();
            return;
        }

        const value = parseFloat(this.state.value);
        let result;

        // Cas spécial pour les températures
        if (this.state.category === 'temperature') {
            result = this.convertTemperature(value);
        } else {
            // Conversion standard basée sur les facteurs
            const fromUnit = this.categories[this.state.category].units[this.state.fromUnit];
            const toUnit = this.categories[this.state.category].units[this.state.toUnit];
            
            result = value * fromUnit.factor / toUnit.factor;
        }

        // Formate le résultat
        this.state.result = this.formatResult(result);
        
        // Ajoute à l'historique
        this.addToHistory({
            category: this.state.category,
            fromUnit: this.state.fromUnit,
            toUnit: this.state.toUnit,
            value: this.state.value,
            result: this.state.result,
            timestamp: new Date().toISOString()
        });

        this.updateDisplay();
    },

    /**
     * Convertit les températures
     */
    convertTemperature(value) {
        const from = this.state.fromUnit;
        const to = this.state.toUnit;

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
        }

        // Puis convertit de Kelvin vers l'unité cible
        switch (to) {
            case 'C':
                return kelvin - 273.15;
            case 'F':
                return kelvin * 9/5 - 459.67;
            case 'K':
                return kelvin;
        }
    },

    /**
     * Formate le résultat
     */
    formatResult(value) {
        // Détermine la précision appropriée
        let precision;
        if (Math.abs(value) >= 100) {
            precision = 2;
        } else if (Math.abs(value) >= 10) {
            precision = 3;
        } else if (Math.abs(value) >= 1) {
            precision = 4;
        } else {
            precision = 5;
        }

        // Formate le nombre
        return Number(value.toFixed(precision))
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },

    /**
     * Ajoute une conversion à l'historique
     */
    addToHistory(entry) {
        this.state.history.unshift(entry);
        
        // Limite la taille de l'historique
        if (this.state.history.length > 10) {
            this.state.history.pop();
        }

        this.saveState();
    },

    /**
     * Active/désactive une conversion favorite
     */
    toggleFavorite() {
        const key = `${this.state.category}:${this.state.fromUnit}:${this.state.toUnit}`;
        
        if (this.state.favorites.has(key)) {
            this.state.favorites.delete(key);
        } else {
            this.state.favorites.add(key);
        }

        this.updateFavoriteButton();
        this.saveState();
    },

    /**
     * Copie le résultat dans le presse-papiers
     */
    copyResult() {
        if (!this.state.result) return;

        const text = `${this.state.value} ${this.state.fromUnit} = ${this.state.result} ${this.state.toUnit}`;
        
        Utils.copyToClipboard(text)
            .then(() => Utils.showNotification('Résultat copié !', 'success'))
            .catch(() => Utils.showNotification('Erreur lors de la copie', 'error'));
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay() {
        this.updateCategorySelect();
        this.updateUnitSelects();
        this.updateResult();
        this.updateHistory();
        this.updateFavoriteButton();
    },

    /**
     * Met à jour la sélection de catégorie
     */
    updateCategorySelect() {
        const select = document.getElementById('converterCategory');
        if (!select) return;

        select.innerHTML = Object.entries(this.categories)
            .map(([key, category]) => `
                <option value="${key}" ${key === this.state.category ? 'selected' : ''}>
                    ${category.name}
                </option>
            `)
            .join('');
    },

    /**
     * Met à jour les sélections d'unités
     */
    updateUnitSelects() {
        const fromSelect = document.getElementById('fromUnit');
        const toSelect = document.getElementById('toUnit');
        if (!fromSelect || !toSelect) return;

        const units = this.categories[this.state.category].units;
        const options = Object.entries(units)
            .map(([key, unit]) => `
                <option value="${key}">
                    ${unit.name} (${key})
                </option>
            `)
            .join('');

        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;

        fromSelect.value = this.state.fromUnit;
        toSelect.value = this.state.toUnit;
    },

    /**
     * Met à jour l'affichage du résultat
     */
    updateResult() {
        const resultElement = document.getElementById('converterResult');
        if (!resultElement) return;

        if (this.state.result) {
            resultElement.textContent = `${this.state.result} ${this.state.toUnit}`;
        } else {
            resultElement.textContent = '—';
        }
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistory() {
        const historyContainer = document.getElementById('converterHistory');
        if (!historyContainer) return;

        historyContainer.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="converterManager.useHistoryEntry(${JSON.stringify(entry)})">
                    <div class="history-value">
                        ${entry.value} ${entry.fromUnit} = ${entry.result} ${entry.toUnit}
                    </div>
                    <div class="history-meta">
                        ${this.categories[entry.category].name} • 
                        ${new Date(entry.timestamp).toLocaleString('fr-FR')}
                    </div>
                </div>
            `)
            .join('');
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
    },

    /**
     * Utilise une entrée de l'historique
     */
    useHistoryEntry(entry) {
        this.state.category = entry.category;
        this.state.fromUnit = entry.fromUnit;
        this.state.toUnit = entry.toUnit;
        this.state.value = entry.value;
        
        this.updateDisplay();
        this.convert();
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('converterState', {
            category: this.state.category,
            history: this.state.history,
            favorites: [...this.state.favorites],
            rates: this.state.rates,
            lastUpdate: this.state.lastUpdate
        });
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveState();
    },

    // Configuration des devises
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

    // Initialisation du convertisseur
    initCurrencyConverter() {
        this.loadCurrencyState();
        this.setupCurrencySelects();
        this.updateRates();
    },

    // Charge l'état sauvegardé
    loadCurrencyState() {
        const savedState = localStorage.getItem('currencyState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            if (parsed.lastUpdate && (Date.now() - new Date(parsed.lastUpdate).getTime() < 3600000)) {
                this.state = parsed;
                this.updateDisplay();
                return;
            }
        }
        this.updateRates();
    },

    // Configure les sélecteurs de devises
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

    // Met à jour les taux de change
    async updateRates() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
            if (!response.ok) throw new Error('Erreur réseau');
            
            const data = await response.json();
            this.state.rates = data.rates;
            this.state.lastUpdate = new Date().toISOString();
            
            this.updateDisplay();
            this.saveCurrencyState();
            
            // Notification de succès
            Utils.showNotification('Taux de change mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la mise à jour des taux:', error);
            Utils.showNotification('Impossible de mettre à jour les taux de change', 'error');
        }
    },

    // Convertit les devises
    convertCurrency() {
        const amount = parseFloat(document.getElementById('fromAmount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        
        if (isNaN(amount)) {
            document.getElementById('toAmount').value = '';
            return;
        }
        
        const result = this.convert(amount, fromCurrency, toCurrency);
        document.getElementById('toAmount').value = result.toFixed(2);
        
        // Ajoute à l'historique
        this.addToHistory({
            category: 'currency',
            fromUnit: fromCurrency,
            toUnit: toCurrency,
            value: amount,
            result: result,
            timestamp: new Date().toISOString()
        });
    },

    // Fonction de conversion
    convert(amount, from, to) {
        if (!this.state.rates[from] || !this.state.rates[to]) return 0;
        
        // Conversion via EUR comme devise de base
        const amountInEUR = from === 'EUR' ? amount : amount / this.state.rates[from];
        return to === 'EUR' ? amountInEUR : amountInEUR * this.state.rates[to];
    },

    // Échange les devises
    swapCurrencies() {
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        const fromAmount = document.getElementById('fromAmount');
        const toAmount = document.getElementById('toAmount');
        
        [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
        [fromAmount.value, toAmount.value] = [toAmount.value, fromAmount.value];
        
        this.convertCurrency();
    },

    // Ajoute une conversion à l'historique
    addToHistory(fromAmount, fromCurrency, toAmount, toCurrency) {
        const historyContainer = document.getElementById('currencyHistory');
        if (!historyContainer) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span>${fromAmount.toFixed(2)} ${fromCurrency}</span>
            <i class="fas fa-arrow-right"></i>
            <span>${toAmount.toFixed(2)} ${toCurrency}</span>
            <small>${new Date().toLocaleString()}</small>
        `;
        
        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
        
        // Limite l'historique à 10 entrées
        while (historyContainer.children.length > 10) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    },

    // Efface l'historique
    clearCurrencyHistory() {
        const historyContainer = document.getElementById('currencyHistory');
        if (historyContainer) {
            historyContainer.innerHTML = '';
        }
    },

    // Met à jour l'affichage
    updateDisplay() {
        // Met à jour la date de dernière mise à jour
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement && this.state.lastUpdate) {
            const date = new Date(this.state.lastUpdate);
            lastUpdateElement.textContent = `Dernière mise à jour : ${date.toLocaleString()}`;
        }
        
        // Met à jour la grille des taux
        const ratesGrid = document.getElementById('ratesList');
        if (ratesGrid) {
            ratesGrid.innerHTML = '';
            Object.entries(this.CURRENCIES).forEach(([code, data]) => {
                if (code === 'EUR') return; // Skip EUR as base currency
                
                const rate = this.state.rates[code];
                if (!rate) return;
                
                const rateItem = document.createElement('div');
                rateItem.className = 'rate-item';
                rateItem.innerHTML = `
                    <span class="currency-code">${code}</span>
                    <span class="currency-symbol">${data.symbol}</span>
                    <span class="rate-value">${rate.toFixed(4)}</span>
                `;
                ratesGrid.appendChild(rateItem);
            });
        }
        
        // Déclenche une conversion si des valeurs sont déjà présentes
        const fromAmount = document.getElementById('fromAmount');
        if (fromAmount && fromAmount.value) {
            this.convertCurrency();
        }
    },

    // Sauvegarde l'état
    saveCurrencyState() {
        localStorage.setItem('currencyState', JSON.stringify(this.state));
    },

    // Affiche une notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Initialisation au chargement de la page
    initCurrencyConverter() {
        this.loadCurrencyState();
        this.setupCurrencySelects();
        this.updateRates();
    }
};

// Exposer ConverterManager globalement
window.ConverterManager = ConverterManager; 