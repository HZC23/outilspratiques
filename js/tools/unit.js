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
    }
};

// État de l'application
const state = {
    currentCategory: 'length',
    fromUnit: 'm',
    toUnit: 'cm',
    fromValue: 1
};

/**
 * Initialise l'outil de conversion d'unités
 */
function initUnitConverter() {
    const categorySelect = document.getElementById('unitCategory');
    const fromUnitSelect = document.getElementById('fromUnit');
    const toUnitSelect = document.getElementById('toUnit');
    const fromValueInput = document.getElementById('fromValue');
    const toValueInput = document.getElementById('toValue');
    const swapButton = document.getElementById('swapUnits');
    
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
    
    // Initialisation
    populateUnitSelects(fromUnitSelect, toUnitSelect);
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
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si les éléments du convertisseur sont présents dans la page
    if (document.getElementById('unitCategory')) {
        initUnitConverter();
    }
});

// Initialisation quand l'outil est chargé dynamiquement
if (document.getElementById('unitCategory')) {
    initUnitConverter();
}

export { initUnitConverter }; 