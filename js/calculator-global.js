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

// Calculer le résultat d'une opération entre deux nombres
function calculate(a, b, operator) {
    switch (operator) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? NaN : a / b;
        case '^': return Math.pow(a, b);
        case '%': return a % b;
        default: return NaN;
    }
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