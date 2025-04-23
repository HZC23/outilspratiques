/**
 * unit.js - Gestionnaire de conversion d'unités
 * Module pour gérer les conversions entre différentes unités de mesure
 */

import { formatNumber } from '../calculator-global.js';

// Catégories d'unités et leurs valeurs de conversion
const unitCategories = {
    // Longueur (mètre comme unité de base)
    length: {
        km: { name: 'Kilomètre', toBase: value => value * 1000, fromBase: value => value / 1000 },
        m: { name: 'Mètre', toBase: value => value, fromBase: value => value },
        cm: { name: 'Centimètre', toBase: value => value / 100, fromBase: value => value * 100 },
        mm: { name: 'Millimètre', toBase: value => value / 1000, fromBase: value => value * 1000 },
        mi: { name: 'Mile', toBase: value => value * 1609.344, fromBase: value => value / 1609.344 },
        yd: { name: 'Yard', toBase: value => value * 0.9144, fromBase: value => value / 0.9144 },
        ft: { name: 'Pied', toBase: value => value * 0.3048, fromBase: value => value / 0.3048 },
        in: { name: 'Pouce', toBase: value => value * 0.0254, fromBase: value => value / 0.0254 }
    },
    
    // Masse (kilogramme comme unité de base)
    mass: {
        t: { name: 'Tonne', toBase: value => value * 1000, fromBase: value => value / 1000 },
        kg: { name: 'Kilogramme', toBase: value => value, fromBase: value => value },
        g: { name: 'Gramme', toBase: value => value / 1000, fromBase: value => value * 1000 },
        mg: { name: 'Milligramme', toBase: value => value / 1000000, fromBase: value => value * 1000000 },
        lb: { name: 'Livre', toBase: value => value * 0.45359237, fromBase: value => value / 0.45359237 },
        oz: { name: 'Once', toBase: value => value * 0.028349523125, fromBase: value => value / 0.028349523125 }
    },
    
    // Volume (litre comme unité de base)
    volume: {
        kl: { name: 'Kilolitre', toBase: value => value * 1000, fromBase: value => value / 1000 },
        l: { name: 'Litre', toBase: value => value, fromBase: value => value },
        ml: { name: 'Millilitre', toBase: value => value / 1000, fromBase: value => value * 1000 },
        gal: { name: 'Gallon (US)', toBase: value => value * 3.78541178, fromBase: value => value / 3.78541178 },
        qt: { name: 'Quart (US)', toBase: value => value * 0.946352946, fromBase: value => value / 0.946352946 },
        pt: { name: 'Pinte (US)', toBase: value => value * 0.473176473, fromBase: value => value / 0.473176473 },
        cup: { name: 'Tasse (US)', toBase: value => value * 0.2365882365, fromBase: value => value / 0.2365882365 },
        floz: { name: 'Once liquide (US)', toBase: value => value * 0.0295735, fromBase: value => value / 0.0295735 }
    },
    
    // Température (conversion spéciale)
    temperature: {
        c: { 
            name: 'Celsius', 
            toBase: value => value, 
            fromBase: value => value 
        },
        f: { 
            name: 'Fahrenheit', 
            toBase: value => (value - 32) * 5/9, 
            fromBase: value => value * 9/5 + 32 
        },
        k: { 
            name: 'Kelvin', 
            toBase: value => value - 273.15, 
            fromBase: value => value + 273.15 
        }
    },
    
    // Vitesse (mètre par seconde comme unité de base)
    speed: {
        mps: { name: 'Mètre/seconde', toBase: value => value, fromBase: value => value },
        kph: { name: 'Kilomètre/heure', toBase: value => value / 3.6, fromBase: value => value * 3.6 },
        mph: { name: 'Mile/heure', toBase: value => value * 0.44704, fromBase: value => value / 0.44704 },
        fps: { name: 'Pied/seconde', toBase: value => value * 0.3048, fromBase: value => value / 0.3048 },
        knot: { name: 'Nœud', toBase: value => value * 0.51444444444, fromBase: value => value / 0.51444444444 }
    },
    
    // Surface (mètre carré comme unité de base)
    area: {
        km2: { name: 'Kilomètre carré', toBase: value => value * 1000000, fromBase: value => value / 1000000 },
        m2: { name: 'Mètre carré', toBase: value => value, fromBase: value => value },
        cm2: { name: 'Centimètre carré', toBase: value => value / 10000, fromBase: value => value * 10000 },
        mm2: { name: 'Millimètre carré', toBase: value => value / 1000000, fromBase: value => value * 1000000 },
        ha: { name: 'Hectare', toBase: value => value * 10000, fromBase: value => value / 10000 },
        acre: { name: 'Acre', toBase: value => value * 4046.8564224, fromBase: value => value / 4046.8564224 },
        ft2: { name: 'Pied carré', toBase: value => value * 0.09290304, fromBase: value => value / 0.09290304 },
        in2: { name: 'Pouce carré', toBase: value => value * 0.00064516, fromBase: value => value / 0.00064516 }
    },
    
    // Temps (seconde comme unité de base)
    time: {
        y: { name: 'Année', toBase: value => value * 31536000, fromBase: value => value / 31536000 },
        mo: { name: 'Mois', toBase: value => value * 2592000, fromBase: value => value / 2592000 },
        w: { name: 'Semaine', toBase: value => value * 604800, fromBase: value => value / 604800 },
        d: { name: 'Jour', toBase: value => value * 86400, fromBase: value => value / 86400 },
        h: { name: 'Heure', toBase: value => value * 3600, fromBase: value => value / 3600 },
        min: { name: 'Minute', toBase: value => value * 60, fromBase: value => value / 60 },
        s: { name: 'Seconde', toBase: value => value, fromBase: value => value },
        ms: { name: 'Milliseconde', toBase: value => value / 1000, fromBase: value => value * 1000 }
    },
    
    // Pression (Pascal comme unité de base)
    pressure: {
        pa: { name: 'Pascal', toBase: value => value, fromBase: value => value },
        kpa: { name: 'Kilopascal', toBase: value => value * 1000, fromBase: value => value / 1000 },
        mpa: { name: 'Mégapascal', toBase: value => value * 1000000, fromBase: value => value / 1000000 },
        bar: { name: 'Bar', toBase: value => value * 100000, fromBase: value => value / 100000 },
        atm: { name: 'Atmosphère', toBase: value => value * 101325, fromBase: value => value / 101325 },
        mmhg: { name: 'mmHg', toBase: value => value * 133.322, fromBase: value => value / 133.322 },
        psi: { name: 'PSI', toBase: value => value * 6894.76, fromBase: value => value / 6894.76 }
    },
    
    // Énergie (Joule comme unité de base)
    energy: {
        j: { name: 'Joule', toBase: value => value, fromBase: value => value },
        kj: { name: 'Kilojoule', toBase: value => value * 1000, fromBase: value => value / 1000 },
        cal: { name: 'Calorie', toBase: value => value * 4.184, fromBase: value => value / 4.184 },
        kcal: { name: 'Kilocalorie', toBase: value => value * 4184, fromBase: value => value / 4184 },
        wh: { name: 'Watt-heure', toBase: value => value * 3600, fromBase: value => value / 3600 },
        kwh: { name: 'Kilowatt-heure', toBase: value => value * 3600000, fromBase: value => value / 3600000 },
        ev: { name: 'Électron-volt', toBase: value => value * 1.602176634e-19, fromBase: value => value / 1.602176634e-19 }
    },
    
    // Puissance (Watt comme unité de base)
    power: {
        w: { name: 'Watt', toBase: value => value, fromBase: value => value },
        kw: { name: 'Kilowatt', toBase: value => value * 1000, fromBase: value => value / 1000 },
        mw: { name: 'Mégawatt', toBase: value => value * 1000000, fromBase: value => value / 1000000 },
        hp: { name: 'Cheval-vapeur', toBase: value => value * 745.7, fromBase: value => value / 745.7 }
    },
    
    // Données informatiques (octet comme unité de base)
    data: {
        b: { name: 'Octet', toBase: value => value, fromBase: value => value },
        kb: { name: 'Kilooctet', toBase: value => value * 1024, fromBase: value => value / 1024 },
        mb: { name: 'Mégaoctet', toBase: value => value * 1048576, fromBase: value => value / 1048576 },
        gb: { name: 'Gigaoctet', toBase: value => value * 1073741824, fromBase: value => value / 1073741824 },
        tb: { name: 'Téraoctet', toBase: value => value * 1099511627776, fromBase: value => value / 1099511627776 },
        bit: { name: 'Bit', toBase: value => value / 8, fromBase: value => value * 8 },
        kbit: { name: 'Kilobit', toBase: value => value * 128, fromBase: value => value / 128 },
        mbit: { name: 'Mégabit', toBase: value => value * 131072, fromBase: value => value / 131072 },
        gbit: { name: 'Gigabit', toBase: value => value * 134217728, fromBase: value => value / 134217728 }
    }
};

// État de l'application
const state = {
    currentCategory: 'length',
    fromUnit: 'm',
    toUnit: 'cm',
    fromValue: 1,
    conversionHistory: []
};

/**
 * Initialise l'outil de conversion d'unités
 */
function initUnitConverter() {
    const categorySelect = document.getElementById('conversionCategory');
    const fromUnitSelect = document.getElementById('fromUnit');
    const toUnitSelect = document.getElementById('toUnit');
    const fromValueInput = document.getElementById('fromValue');
    const toValueInput = document.getElementById('toValue');
    const swapButton = document.getElementById('swapUnits');
    const formulaElement = document.getElementById('conversionFormula');
    const historyElement = document.getElementById('conversionHistory');
    const clearHistoryButton = document.getElementById('clearConversionHistory');
    const commonConversionsElement = document.getElementById('commonConversions');
    
    if (!categorySelect || !fromUnitSelect || !toUnitSelect || !fromValueInput || !toValueInput) {
        console.error('Éléments du convertisseur d\'unités non trouvés');
        return;
    }
    
    // Initialiser les listes déroulantes des catégories
    populateCategorySelect(categorySelect);
    
    // Événements
    categorySelect.addEventListener('change', () => {
        state.currentCategory = categorySelect.value;
        populateUnitSelects(fromUnitSelect, toUnitSelect);
        generateCommonConversions(commonConversionsElement);
        convert();
    });
    
    fromUnitSelect.addEventListener('change', () => {
        state.fromUnit = fromUnitSelect.value;
        convert();
    });
    
    toUnitSelect.addEventListener('change', () => {
        state.toUnit = toUnitSelect.value;
        convert();
    });
    
    fromValueInput.addEventListener('input', () => {
        state.fromValue = parseFloat(fromValueInput.value) || 0;
        convert();
    });
    
    swapButton.addEventListener('click', () => {
        const tempUnit = state.fromUnit;
        state.fromUnit = state.toUnit;
        state.toUnit = tempUnit;
        
        // Mettre à jour les contrôles
        fromUnitSelect.value = state.fromUnit;
        toUnitSelect.value = state.toUnit;
        
        // Inverser les valeurs
        const tempValue = fromValueInput.value;
        fromValueInput.value = toValueInput.value;
        state.fromValue = parseFloat(fromValueInput.value) || 0;
        
        convert();
    });
    
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', () => {
            state.conversionHistory = [];
            updateConversionHistory(historyElement);
            // Enregistrer l'historique vide dans le stockage local
            localStorage.setItem('conversionHistory', JSON.stringify(state.conversionHistory));
        });
    }
    
    // Charger l'historique depuis le stockage local
    try {
        const savedHistory = localStorage.getItem('conversionHistory');
        if (savedHistory) {
            state.conversionHistory = JSON.parse(savedHistory);
            updateConversionHistory(historyElement);
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
    }
    
    // Initialisation
    populateUnitSelects(fromUnitSelect, toUnitSelect);
    generateCommonConversions(commonConversionsElement);
    convert();
}

/**
 * Remplit le sélecteur de catégories
 * @param {HTMLSelectElement} categorySelect - L'élément select pour les catégories
 */
function populateCategorySelect(categorySelect) {
    categorySelect.innerHTML = '';
    
    Object.keys(unitCategories).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        
        // Nom formatté pour l'affichage
        switch(category) {
            case 'length': option.textContent = 'Longueur'; break;
            case 'mass': option.textContent = 'Masse'; break;
            case 'volume': option.textContent = 'Volume'; break;
            case 'temperature': option.textContent = 'Température'; break;
            case 'speed': option.textContent = 'Vitesse'; break;
            case 'area': option.textContent = 'Surface'; break;
            case 'time': option.textContent = 'Temps'; break;
            case 'pressure': option.textContent = 'Pression'; break;
            case 'energy': option.textContent = 'Énergie'; break;
            case 'power': option.textContent = 'Puissance'; break;
            case 'data': option.textContent = 'Données'; break;
            default: option.textContent = category;
        }
        
        categorySelect.appendChild(option);
    });
    
    categorySelect.value = state.currentCategory;
}

/**
 * Remplit les sélecteurs d'unités
 * @param {HTMLSelectElement} fromSelect - Sélecteur d'unité de départ
 * @param {HTMLSelectElement} toSelect - Sélecteur d'unité d'arrivée
 */
function populateUnitSelects(fromSelect, toSelect) {
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    const units = unitCategories[state.currentCategory];
    
    Object.keys(units).forEach(unit => {
        const fromOption = document.createElement('option');
        fromOption.value = unit;
        fromOption.textContent = units[unit].name;
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = unit;
        toOption.textContent = units[unit].name;
        toSelect.appendChild(toOption);
    });
    
    // Réinitialiser les unités sélectionnées par défaut pour cette catégorie
    state.fromUnit = Object.keys(units)[0];
    state.toUnit = Object.keys(units)[1];
    
    fromSelect.value = state.fromUnit;
    toSelect.value = state.toUnit;
}

/**
 * Effectue la conversion et met à jour l'affichage
 */
function convert() {
    const fromValueInput = document.getElementById('fromValue');
    const toValueInput = document.getElementById('toValue');
    const formulaElement = document.getElementById('conversionFormula');
    const historyElement = document.getElementById('conversionHistory');
    const units = unitCategories[state.currentCategory];
    
    if (!units || !fromValueInput || !toValueInput) return;
    
    const fromUnit = units[state.fromUnit];
    const toUnit = units[state.toUnit];
    
    if (!fromUnit || !toUnit) return;
    
    // Conversion: valeur de départ → unité de base → valeur d'arrivée
    const baseValue = fromUnit.toBase(state.fromValue);
    const result = toUnit.fromBase(baseValue);
    
    // Afficher le résultat avec formatage
    toValueInput.value = formatNumber(result);
    
    // Mettre à jour la formule de conversion
    if (formulaElement) {
        updateConversionFormula(formulaElement, fromUnit, toUnit);
    }
    
    // Ajouter à l'historique
    if (state.fromValue && result) {
        addToConversionHistory(historyElement, {
            category: state.currentCategory,
            fromValue: state.fromValue,
            fromUnit: state.fromUnit,
            toValue: result,
            toUnit: state.toUnit,
            timestamp: new Date()
        });
    }
}

/**
 * Met à jour la formule de conversion
 * @param {HTMLElement} formulaElement - Élément d'affichage de la formule
 * @param {Object} fromUnit - Unité de départ
 * @param {Object} toUnit - Unité d'arrivée
 */
function updateConversionFormula(formulaElement, fromUnit, toUnit) {
    if (!formulaElement) return;
    
    // Calcul d'un exemple simple pour la formule
    const exampleValue = 1;
    const baseValue = fromUnit.toBase(exampleValue);
    const result = toUnit.fromBase(baseValue);
    
    formulaElement.textContent = `1 ${fromUnit.name} = ${formatNumber(result)} ${toUnit.name}`;
}

/**
 * Ajoute une conversion à l'historique
 * @param {HTMLElement} historyElement - Élément d'affichage de l'historique
 * @param {Object} conversion - Détails de la conversion
 */
function addToConversionHistory(historyElement, conversion) {
    if (!historyElement) return;
    
    // Limiter l'historique à 10 entrées
    if (state.conversionHistory.length >= 10) {
        state.conversionHistory.pop();
    }
    
    // Ajouter la nouvelle conversion au début
    state.conversionHistory.unshift(conversion);
    
    // Mettre à jour l'affichage
    updateConversionHistory(historyElement);
    
    // Sauvegarder dans le stockage local
    try {
        localStorage.setItem('conversionHistory', JSON.stringify(state.conversionHistory));
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'historique:', error);
    }
}

/**
 * Met à jour l'affichage de l'historique
 * @param {HTMLElement} historyElement - Élément d'affichage de l'historique
 */
function updateConversionHistory(historyElement) {
    if (!historyElement) return;
    
    historyElement.innerHTML = '';
    
    if (state.conversionHistory.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'history-empty';
        emptyMessage.textContent = 'Aucune conversion récente';
        historyElement.appendChild(emptyMessage);
        return;
    }
    
    state.conversionHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Formatage de la date
        const date = new Date(item.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        
        // Obtenir les noms complets des unités
        const fromUnitName = unitCategories[item.category][item.fromUnit].name;
        const toUnitName = unitCategories[item.category][item.toUnit].name;
        
        historyItem.innerHTML = `
            <div class="history-conversion">
                <span class="history-value">${formatNumber(item.fromValue)} ${fromUnitName}</span>
                <span class="history-arrow">→</span>
                <span class="history-value">${formatNumber(item.toValue)} ${toUnitName}</span>
            </div>
            <div class="history-time">${formattedDate}</div>
        `;
        
        // Ajouter un événement pour réutiliser cette conversion
        historyItem.addEventListener('click', () => {
            state.currentCategory = item.category;
            state.fromUnit = item.fromUnit;
            state.toUnit = item.toUnit;
            state.fromValue = item.fromValue;
            
            // Mettre à jour l'interface
            const categorySelect = document.getElementById('conversionCategory');
            const fromUnitSelect = document.getElementById('fromUnit');
            const toUnitSelect = document.getElementById('toUnit');
            const fromValueInput = document.getElementById('fromValue');
            
            if (categorySelect) categorySelect.value = state.currentCategory;
            
            // Réinitialiser les sélecteurs d'unités pour la catégorie sélectionnée
            if (fromUnitSelect && toUnitSelect) {
                populateUnitSelects(fromUnitSelect, toUnitSelect);
                fromUnitSelect.value = state.fromUnit;
                toUnitSelect.value = state.toUnit;
            }
            
            if (fromValueInput) fromValueInput.value = state.fromValue;
            
            convert();
        });
        
        historyElement.appendChild(historyItem);
    });
}

/**
 * Génère les conversions courantes pour la catégorie actuelle
 * @param {HTMLElement} container - Conteneur pour les conversions courantes
 */
function generateCommonConversions(container) {
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
            { from: 'l', to: 'gal', value: 1 },
            { from: 'ml', to: 'floz', value: 100 }
        ],
        temperature: [
            { from: 'c', to: 'f', value: 0 },
            { from: 'c', to: 'k', value: 20 }
        ],
        area: [
            { from: 'm2', to: 'ft2', value: 1 },
            { from: 'ha', to: 'acre', value: 1 }
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
        power: [
            { from: 'kw', to: 'hp', value: 1 }
        ],
        data: [
            { from: 'mb', to: 'kb', value: 1 },
            { from: 'gb', to: 'mb', value: 1 }
        ]
    };
    
    const currentCommonConversions = commonConversions[state.currentCategory] || [];
    
    currentCommonConversions.forEach(conv => {
        const units = unitCategories[state.currentCategory];
        const fromUnit = units[conv.from];
        const toUnit = units[conv.to];
        
        if (!fromUnit || !toUnit) return;
        
        const baseValue = fromUnit.toBase(conv.value);
        const result = toUnit.fromBase(baseValue);
        
        const conversionCard = document.createElement('div');
        conversionCard.className = 'common-conversion-card';
        conversionCard.innerHTML = `
            <div class="common-conversion-value">${formatNumber(conv.value)} ${fromUnit.name}</div>
            <div class="common-conversion-equals">=</div>
            <div class="common-conversion-result">${formatNumber(result)} ${toUnit.name}</div>
        `;
        
        // Ajouter un événement pour appliquer cette conversion
        conversionCard.addEventListener('click', () => {
            state.fromUnit = conv.from;
            state.toUnit = conv.to;
            state.fromValue = conv.value;
            
            // Mettre à jour l'interface
            const fromUnitSelect = document.getElementById('fromUnit');
            const toUnitSelect = document.getElementById('toUnit');
            const fromValueInput = document.getElementById('fromValue');
            
            if (fromUnitSelect) fromUnitSelect.value = state.fromUnit;
            if (toUnitSelect) toUnitSelect.value = state.toUnit;
            if (fromValueInput) fromValueInput.value = state.fromValue;
            
            convert();
        });
        
        container.appendChild(conversionCard);
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si les éléments du convertisseur sont présents dans la page
    if (document.getElementById('conversionCategory')) {
        initUnitConverter();
    }
});

// Initialisation quand l'outil est chargé dynamiquement
if (document.getElementById('conversionCategory')) {
    initUnitConverter();
}

export { initUnitConverter }; 