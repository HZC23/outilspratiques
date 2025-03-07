// Fonctions globales pour la calculatrice
// Ces fonctions sont appelées directement depuis les attributs onclick dans le HTML

// Variables globales
let currentCalc = '0';
let previousCalc = '';
let memory = 0;
let calcHistory = [];

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
        if (/[+\-×÷*\/]$/.test(currentCalc)) {
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
            .replace(/\s/g, '');

        // Vérifier si l'expression est sûre
        if (!/^[0-9+\-*\/().]*$/.test(expression)) {
            throw new Error('Expression non valide');
        }

        // Évaluer l'expression de manière sécurisée
        const result = Function(`'use strict'; return ${expression}`)();

        // Vérifier si le résultat est valide
        if (typeof result !== 'number' || !isFinite(result)) {
            throw new Error('Résultat invalide');
        }

        // Arrondir le résultat à 8 décimales
        const roundedResult = Number(result.toFixed(8));
        
        // Ajouter à l'historique
        addToCalcHistory(currentCalc, roundedResult);
        
        // Mettre à jour l'affichage
        previousCalc = currentCalc;
        currentCalc = roundedResult.toString();
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
    try {
        let result;
        const num = parseFloat(currentCalc);
        
        switch (func) {
            case 'sin':
                result = Math.sin(num * Math.PI / 180);
                break;
            case 'cos':
                result = Math.cos(num * Math.PI / 180);
                break;
            case 'tan':
                result = Math.tan(num * Math.PI / 180);
                break;
            case 'log':
                result = Math.log10(num);
                break;
            case 'sqrt':
                result = Math.sqrt(num);
                break;
            case 'pow':
                result = Math.pow(num, 2);
                break;
            case 'exp':
                result = Math.exp(num);
                break;
            case 'pi':
                result = Math.PI;
                break;
            default:
                result = num;
        }
        
        // Ajouter à l'historique
        addToCalcHistory(`${func}(${currentCalc})`, result);
        
        // Mettre à jour l'affichage
        previousCalc = `${func}(${currentCalc})`;
        currentCalc = result.toString();
        updateCalcDisplay();
    } catch (error) {
        currentCalc = 'Erreur';
        updateCalcDisplay();
        setTimeout(() => {
            currentCalc = '0';
            updateCalcDisplay();
        }, 1500);
    }
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