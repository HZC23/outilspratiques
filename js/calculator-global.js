// Fonctions globales pour la calculatrice
// Ces fonctions sont appelées directement depuis les attributs onclick dans le HTML

// Variables globales
let currentCalc = '0';
let previousCalc = '';
let memory = 0;
let calcHistory = [];
let angleUnit = 'deg'; // 'deg', 'rad' ou 'grad'
let scientificNotation = false;
let fractionMode = false;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    updateCalcDisplay();
    loadCalcHistory();
});

// Ajouter un caractère à l'expression
function addToCalc(value) {
    // Si c'est un chiffre et qu'il y a eu un calcul précédent
    if (/[0-9]/.test(value) && previousCalc !== '') {
        currentCalc = value;
        previousCalc = '';
    }
    // Si c'est un opérateur
    else if (/[+\-×÷*/()]/.test(value)) {
        if (currentCalc === 'Erreur') {
            currentCalc = '0';
        }
        currentCalc += value;
    }
    // Si c'est un point décimal
    else if (value === '.') {
        // Vérifie si le dernier nombre contient déjà un point
        const lastNumber = currentCalc.split(/[+\-×÷*/()]/).pop();
        if (!lastNumber.includes('.')) {
            currentCalc += value;
        }
    }
    // Pour tous les autres cas (chiffres sans calcul précédent)
    else {
        if (currentCalc === '0' || currentCalc === 'Erreur') {
            currentCalc = value;
        } else {
            currentCalc += value;
        }
    }
    updateCalcDisplay();
}

// Effacer l'expression
function clearCalc() {
    currentCalc = '0';
    previousCalc = '';
    updateCalcDisplay();
}

// Supprimer le dernier caractère
function backspace() {
    if (currentCalc.length > 1) {
        currentCalc = currentCalc.slice(0, -1);
    } else {
        currentCalc = '0';
    }
    updateCalcDisplay();
}

// Calculer le résultat
function calculate() {
    try {
        if (!currentCalc || currentCalc === '0') {
            return;
        }

        // Vérifier si l'expression se termine par un opérateur
        if (/[+\-×÷*\/^]$/.test(currentCalc)) {
            throw new Error('Expression invalide');
        }

        // Vérifier les parenthèses
        const openParens = (currentCalc.match(/\(/g) || []).length;
        const closeParens = (currentCalc.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            throw new Error('Parenthèses non équilibrées');
        }

        // Remplacer les symboles pour l'évaluation
        let expression = currentCalc
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/\^/g, '**') // Traiter les puissances
            .replace(/mod/g, '%'); // Traiter le modulo
            
        // Supprimer les espaces non significatifs
        expression = expression.replace(/\s+/g, '');

        // Vérifier si l'expression est sûre
        if (!/^[0-9+\-*\/().%,**]*$/.test(expression)) {
            throw new Error('Expression non valide');
        }

        // Évaluer l'expression de manière sécurisée
        const result = Function(`'use strict'; return ${expression}`)();

        // Vérifier si le résultat est valide
        if (typeof result !== 'number' || !isFinite(result)) {
            throw new Error('Résultat invalide');
        }

        // Formater le résultat selon les paramètres actifs
        const formattedResult = formatResult(result);
        
        // Ajouter à l'historique
        addToCalcHistory(currentCalc, formattedResult);
        
        // Mettre à jour l'affichage
        previousCalc = currentCalc;
        currentCalc = formattedResult;
        updateCalcDisplay();
    } catch (error) {
        currentCalc = 'Erreur';
        updateCalcDisplay();
        setTimeout(() => {
            currentCalc = previousCalc || '0';
            updateCalcDisplay();
        }, 1500);
    }
}

// Fonctions mathématiques
function calcFunction(func) {
    let result;
    let lastNum = parseFloat(currentCalc);
    
    switch(func) {
        case 'sin':
            result = angleConversion(lastNum, true);
            result = Math.sin(result);
            break;
        case 'cos':
            result = angleConversion(lastNum, true);
            result = Math.cos(result);
            break;
        case 'tan':
            result = angleConversion(lastNum, true);
            result = Math.tan(result);
            break;
        case 'asin':
            result = Math.asin(lastNum);
            result = angleConversion(result, false);
            break;
        case 'acos':
            result = Math.acos(lastNum);
            result = angleConversion(result, false);
            break;
        case 'atan':
            result = Math.atan(lastNum);
            result = angleConversion(result, false);
            break;
        case 'log':
            result = Math.log10(lastNum);
            break;
        case 'ln':
            result = Math.log(lastNum);
            break;
        case 'sqrt':
            result = Math.sqrt(lastNum);
            break;
        case 'cbrt':
            result = Math.cbrt(lastNum);
            break;
        case 'pow':
            result = Math.pow(lastNum, 2);
            break;
        case 'pow3':
            result = Math.pow(lastNum, 3);
            break;
        case 'powY':
            currentCalc += '^';
            updateCalcDisplay();
            return;
        case 'exp':
            result = Math.exp(lastNum);
            break;
        case 'factorial':
            if (lastNum < 0 || !Number.isInteger(lastNum)) {
                previousCalc = currentCalc + '!';
                currentCalc = 'Erreur';
                updateCalcDisplay();
                return;
            }
            result = factorial(lastNum);
            break;
        case 'pi':
            currentCalc = String(Math.PI);
            updateCalcDisplay();
            return;
        case 'e':
            currentCalc = String(Math.E);
            updateCalcDisplay();
            return;
        case 'random':
            result = Math.random();
            break;
        case 'percent':
            if (previousCalc) {
                const prevNum = parseFloat(previousCalc);
                result = (prevNum * lastNum) / 100;
            } else {
                result = lastNum / 100;
            }
            break;
        case '1/x':
            if (lastNum === 0) {
                previousCalc = '1/' + currentCalc;
                currentCalc = 'Erreur';
                updateCalcDisplay();
                return;
            }
            result = 1 / lastNum;
            break;
        case 'negate':
            result = -lastNum;
            break;
        case 'abs':
            result = Math.abs(lastNum);
            break;
        case 'mod':
            currentCalc += ' mod ';
            updateCalcDisplay();
            return;
        case 'gcd':
            // PGCD (Plus grand commun diviseur)
            if (currentCalc.includes(',')) {
                const numbers = currentCalc.split(',').map(n => parseInt(n.trim()));
                if (numbers.length === 2 && !isNaN(numbers[0]) && !isNaN(numbers[1])) {
                    result = gcd(numbers[0], numbers[1]);
                } else {
                    currentCalc = 'Erreur format';
                    updateCalcDisplay();
                    return;
                }
            } else {
                currentCalc += ',';
                updateCalcDisplay();
                return;
            }
            break;
        case 'lcm':
            // PPCM (Plus petit commun multiple)
            if (currentCalc.includes(',')) {
                const numbers = currentCalc.split(',').map(n => parseInt(n.trim()));
                if (numbers.length === 2 && !isNaN(numbers[0]) && !isNaN(numbers[1])) {
                    result = lcm(numbers[0], numbers[1]);
                } else {
                    currentCalc = 'Erreur format';
                    updateCalcDisplay();
                    return;
                }
            } else {
                currentCalc += ',';
                updateCalcDisplay();
                return;
            }
            break;
    }
    
    previousCalc = formatFunctionExpression(func, lastNum);
    currentCalc = formatResult(result);
    updateCalcDisplay();
}

// Fonction de formatage des expressions de fonction
function formatFunctionExpression(func, num) {
    switch(func) {
        case 'sin': return `sin(${num})`;
        case 'cos': return `cos(${num})`;
        case 'tan': return `tan(${num})`;
        case 'asin': return `sin⁻¹(${num})`;
        case 'acos': return `cos⁻¹(${num})`;
        case 'atan': return `tan⁻¹(${num})`;
        case 'log': return `log(${num})`;
        case 'ln': return `ln(${num})`;
        case 'sqrt': return `√(${num})`;
        case 'cbrt': return `∛(${num})`;
        case 'pow': return `(${num})²`;
        case 'pow3': return `(${num})³`;
        case 'exp': return `e^(${num})`;
        case 'factorial': return `${num}!`;
        case 'percent': return `${num}%`;
        case '1/x': return `1/(${num})`;
        case 'negate': return `-(${num})`;
        case 'abs': return `|${num}|`;
        case 'gcd': return `PGCD(${num})`;
        case 'lcm': return `PPCM(${num})`;
        default: return num;
    }
}

// Calcul factorielle
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// PGCD (Plus grand commun diviseur)
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    if (b > a) [a, b] = [b, a];
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// PPCM (Plus petit commun multiple)
function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
}

// Fonction pour basculer l'unité d'angle (degrés, radians, grades)
function toggleAngleUnit() {
    switch(angleUnit) {
        case 'deg':
            angleUnit = 'rad';
            break;
        case 'rad':
            angleUnit = 'grad';
            break;
        case 'grad':
            angleUnit = 'deg';
            break;
    }
    
    // Mettre à jour l'affichage du bouton
    const angleButton = document.querySelector('button[aria-label="Mode angle"]');
    if (angleButton) {
        angleButton.textContent = angleUnit.toUpperCase();
    }
}

// Conversion d'angle
function angleConversion(angle, toRadians) {
    if (toRadians) {
        // Conversion vers radians
        switch(angleUnit) {
            case 'deg': return angle * (Math.PI / 180);
            case 'grad': return angle * (Math.PI / 200);
            default: return angle;
        }
    } else {
        // Conversion depuis radians
        switch(angleUnit) {
            case 'deg': return angle * (180 / Math.PI);
            case 'grad': return angle * (200 / Math.PI);
            default: return angle;
        }
    }
}

// Fonction pour basculer la notation scientifique
function toggleScientificNotation() {
    scientificNotation = !scientificNotation;
    
    // Mettre à jour l'affichage si nécessaire
    if (currentCalc !== '0' && currentCalc !== 'Erreur') {
        const num = parseFloat(currentCalc);
        currentCalc = formatResult(num);
        updateCalcDisplay();
    }
}

// Fonction pour basculer le mode fraction
function toggleFractionMode() {
    fractionMode = !fractionMode;
    
    // Mettre à jour l'affichage si nécessaire
    if (currentCalc !== '0' && currentCalc !== 'Erreur') {
        const num = parseFloat(currentCalc);
        currentCalc = formatResult(num);
        updateCalcDisplay();
    }
}

// Formatage du résultat selon les options actives
function formatResult(value) {
    if (isNaN(value) || !isFinite(value)) {
        return 'Erreur';
    }
    
    if (fractionMode && Number.isFinite(value) && Math.abs(value) < 10000) {
        return decimalToFraction(value);
    }
    
    if (scientificNotation && (Math.abs(value) < 0.0001 || Math.abs(value) > 9999999)) {
        return value.toExponential(6);
    }
    
    // Formatage standard pour les nombres
    if (Number.isInteger(value)) {
        return String(value);
    } else {
        // Limiter à 10 chiffres au total
        return String(parseFloat(value.toPrecision(10)));
    }
}

// Conversion décimal vers fraction
function decimalToFraction(decimal) {
    if (Number.isInteger(decimal)) return String(decimal);
    
    const tolerance = 1.0E-10;
    let sign = decimal < 0 ? "-" : "";
    decimal = Math.abs(decimal);
    
    // Pour les valeurs très proches d'un entier
    if (Math.abs(decimal - Math.round(decimal)) < tolerance) {
        return sign + Math.round(decimal);
    }
    
    // Algorithme de fraction continue
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = decimal;
    
    do {
        let a = Math.floor(b);
        let aux = h1;
        h1 = a * h1 + h2;
        h2 = aux;
        aux = k1;
        k1 = a * k1 + k2;
        k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);
    
    return sign + h1 + "/" + k1;
}

// Fonctions de mémoire
function calcMemory(operation) {
    switch (operation) {
        case 'ms': // Memory Store
            memory = parseFloat(currentCalc);
            break;
        case 'mr': // Memory Recall
            currentCalc = memory.toString();
            break;
        case 'mc': // Memory Clear
            memory = 0;
            break;
        case 'm+': // Memory Add
            memory += parseFloat(currentCalc);
            break;
    }
    updateCalcDisplay();
}

// Mettre à jour l'affichage
function updateCalcDisplay() {
    const currentCalcElement = document.getElementById('currentCalc');
    const previousCalcElement = document.getElementById('previousCalc');
    
    if (currentCalcElement && previousCalcElement) {
        currentCalcElement.textContent = currentCalc;
        previousCalcElement.textContent = previousCalc;
    }
}

// Ajouter à l'historique
function addToCalcHistory(expression, result) {
    const historyItem = {
        expression,
        result: result.toString()
    };
    
    calcHistory.unshift(historyItem);
    
    // Limiter l'historique à 10 éléments
    if (calcHistory.length > 10) {
        calcHistory.pop();
    }
    
    // Sauvegarder l'historique
    saveCalcHistory();
    
    // Mettre à jour l'affichage de l'historique
    displayCalcHistory();
}

// Afficher l'historique
function displayCalcHistory() {
    const historyElement = document.getElementById('calcHistory');
    if (!historyElement) return;
    
    historyElement.innerHTML = '';
    
    calcHistory.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="expression">${item.expression}</span> = <span class="result">${item.result}</span>`;
        li.addEventListener('click', () => {
            currentCalc = item.result;
            updateCalcDisplay();
        });
        historyElement.appendChild(li);
    });
}

// Sauvegarder l'historique
function saveCalcHistory() {
    localStorage.setItem('calculatorHistory', JSON.stringify(calcHistory));
}

// Charger l'historique
function loadCalcHistory() {
    const savedHistory = localStorage.getItem('calculatorHistory');
    if (savedHistory) {
        calcHistory = JSON.parse(savedHistory);
        displayCalcHistory();
    }
}

// Effacer l'historique
function clearcalcHistory() {
    calcHistory = [];
    saveCalcHistory();
    displayCalcHistory();
} 