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
    if (currentCalc === '0' && value !== '.') {
        currentCalc = value;
    } else {
        currentCalc += value;
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
        // Remplacer les symboles pour l'évaluation
        let expression = currentCalc.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Évaluer l'expression
        const result = eval(expression);
        
        // Ajouter à l'historique
        addToCalcHistory(currentCalc, result);
        
        // Mettre à jour l'affichage
        previousCalc = currentCalc;
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