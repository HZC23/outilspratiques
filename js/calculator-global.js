/**
 * calculator-global.js
 * Fonctions globales pour la calculatrice utilisées dans plusieurs pages
 */

// Constantes et variables globales pour la calculatrice
const OPERATORS = ['+', '-', '*', '/', '^', '%'];
const FUNCTIONS = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'cbrt', 'abs'];
const CONSTANTS = {
    'π': Math.PI,
    'e': Math.E,
    'φ': 1.618033988749895, // Nombre d'or
};

// État de la calculatrice
const calculatorState = {
    currentValue: '0',
    previousValue: '',
    operator: null,
    shouldResetScreen: false
};

// Éléments DOM
const display = {
    current: document.getElementById('current'),
    previous: document.getElementById('previous')
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeCalculator();
});

function initializeCalculator() {
    // Écouteurs pour les boutons numériques
    document.querySelectorAll('.calculator-button[data-value]').forEach(button => {
        button.addEventListener('click', () => handleNumber(button.dataset.value));
    });

    // Écouteurs pour les opérateurs
    document.querySelectorAll('.calculator-button[data-action]').forEach(button => {
        button.addEventListener('click', () => handleAction(button.dataset.action));
    });

    // Écouteurs clavier
    document.addEventListener('keydown', handleKeyboard);
    
    // Initialiser les références au display
    updateDisplayReferences();
}

// Fonction pour mettre à jour les références au display
function updateDisplayReferences() {
    display.current = document.getElementById('current');
    display.previous = document.getElementById('previous');
}

function handleNumber(value) {
    if (calculatorState.shouldResetScreen) {
        calculatorState.currentValue = value;
        calculatorState.shouldResetScreen = false;
    } else {
        calculatorState.currentValue = calculatorState.currentValue === '0' ? value : calculatorState.currentValue + value;
    }
    updateDisplay();
}

function handleAction(action) {
    switch (action) {
        case 'clear':
            clearCalculator();
            break;
        case 'toggle-sign':
            toggleSign();
            break;
        case 'percent':
            calculatePercent();
            break;
        case 'divide':
        case 'multiply':
        case 'subtract':
        case 'add':
            handleOperator(action);
            break;
        case 'calculate':
            calculate();
            break;
    }
    updateDisplay();
}

function handleOperator(action) {
    if (calculatorState.operator !== null) {
        calculate();
    }
    calculatorState.previousValue = calculatorState.currentValue;
    calculatorState.operator = action;
    calculatorState.shouldResetScreen = true;
}

function calculate() {
    if (calculatorState.operator === null || calculatorState.shouldResetScreen) return;

    const prev = parseFloat(calculatorState.previousValue);
    const current = parseFloat(calculatorState.currentValue);
    let result;

    switch (calculatorState.operator) {
        case 'add':
            result = prev + current;
            break;
        case 'subtract':
            result = prev - current;
            break;
        case 'multiply':
            result = prev * current;
            break;
        case 'divide':
            result = current !== 0 ? prev / current : 'Error';
            break;
    }

    calculatorState.currentValue = result.toString();
    calculatorState.operator = null;
    calculatorState.shouldResetScreen = true;
}

function clearCalculator() {
    calculatorState.currentValue = '0';
    calculatorState.previousValue = '';
    calculatorState.operator = null;
    calculatorState.shouldResetScreen = false;
}

function toggleSign() {
    calculatorState.currentValue = (parseFloat(calculatorState.currentValue) * -1).toString();
}

function calculatePercent() {
    calculatorState.currentValue = (parseFloat(calculatorState.currentValue) / 100).toString();
}

function updateDisplay() {
    // Mettre à jour les références au cas où les éléments ne seraient pas encore chargés
    updateDisplayReferences();
    
    // Vérifier si les éléments existent avant de les manipuler
    if (!display.current || !display.previous) {
        // Si les éléments DOM ne sont pas disponibles, ne rien faire
        console.debug('Éléments d\'affichage de la calculatrice non disponibles');
        return;
    }
    
    // Vérifier si les éléments existent avant de les manipuler
    if (display.current) {
        display.current.textContent = calculatorState.currentValue;
    }
    
    if (display.previous) {
        if (calculatorState.operator) {
            const operatorSymbol = getOperatorSymbol(calculatorState.operator);
            display.previous.textContent = `${calculatorState.previousValue} ${operatorSymbol}`;
        } else {
            display.previous.textContent = '';
        }
    }
}

function getOperatorSymbol(operator) {
    const symbols = {
        add: '+',
        subtract: '−',
        multiply: '×',
        divide: '÷'
    };
    return symbols[operator] || '';
}

function handleKeyboard(event) {
    // Vérifier d'abord si les éléments d'affichage existent
    updateDisplayReferences();
    if (!display.current || !display.previous) {
        // Si les éléments n'existent pas, ne pas traiter les événements clavier
        return;
    }

    if (event.key >= '0' && event.key <= '9' || event.key === '.') {
        event.preventDefault();
        handleNumber(event.key);
    } else if (event.key === '+') {
        event.preventDefault();
        handleAction('add');
    } else if (event.key === '-') {
        event.preventDefault();
        handleAction('subtract');
    } else if (event.key === '*') {
        event.preventDefault();
        handleAction('multiply');
    } else if (event.key === '/') {
        event.preventDefault();
        handleAction('divide');
    } else if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        handleAction('calculate');
    } else if (event.key === 'Escape') {
        event.preventDefault();
        handleAction('clear');
    } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
    }
}

function handleBackspace() {
    if (calculatorState.currentValue.length > 1) {
        calculatorState.currentValue = calculatorState.currentValue.slice(0, -1);
    } else {
        calculatorState.currentValue = '0';
    }
    updateDisplay();
}

// Fonction pour vérifier si une chaîne représente un nombre
function isNumeric(str) {
    return !isNaN(parseFloat(str)) && isFinite(str);
}

// Fonction pour vérifier si une chaîne est un opérateur
function isOperator(token) {
    return OPERATORS.includes(token);
}

// Fonction pour vérifier si une chaîne est une fonction
function isFunction(token) {
    return FUNCTIONS.includes(token);
}

// Fonction pour vérifier si une chaîne est une constante
function isConstant(token) {
    return Object.keys(CONSTANTS).includes(token);
}

// Récupérer la valeur d'une constante
function getConstantValue(constant) {
    return CONSTANTS[constant] || 0;
}

// Formatter un nombre pour l'affichage
function formatNumber(num) {
    if (isNaN(num)) return 'Erreur';
    
    // Si le nombre est trop grand ou trop petit, utiliser la notation scientifique
    if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-7 && num !== 0)) {
        return num.toExponential(8);
    }
    
    // Convertir en chaîne avec un maximum de 10 chiffres significatifs
    const str = num.toString();
    
    // Si c'est un nombre entier, le retourner tel quel
    if (Number.isInteger(num)) {
        return str;
    }
    
    // Pour les nombres décimaux, limiter à 10 chiffres au total
    const parts = str.split('.');
    if (parts.length === 2) {
        const integerLength = parts[0].length;
        const maxDecimalPlaces = Math.max(10 - integerLength, 0);
        return num.toFixed(Math.min(parts[1].length, maxDecimalPlaces));
    }
    
    return str;
}

// Calculer le résultat d'une fonction mathématique
function calculateFunction(func, value) {
    switch (func) {
        case 'sin': return Math.sin(value);
        case 'cos': return Math.cos(value);
        case 'tan': return Math.tan(value);
        case 'log': return value <= 0 ? NaN : Math.log10(value);
        case 'ln': return value <= 0 ? NaN : Math.log(value);
        case 'sqrt': return value < 0 ? NaN : Math.sqrt(value);
        case 'cbrt': return Math.cbrt(value);
        case 'abs': return Math.abs(value);
        default: return NaN;
    }
}

// Exporter les fonctions pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isNumeric,
        isOperator,
        isFunction,
        isConstant,
        getConstantValue,
        formatNumber,
        calculate,
        calculateFunction,
        OPERATORS,
        FUNCTIONS,
        CONSTANTS
    };
} 