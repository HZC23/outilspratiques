import { Utils } from '../utils.js';

/**
 * Script unifié pour toutes les calculatrices
 * Inclut la calculatrice standard, scientifique et mini
 */

// Structure principale de la calculatrice
export const CalculatorManager = {
    state: {
        currentExpression: '',
        history: [],
        memory: 0,
        isScientificMode: false,
        angleUnit: 'deg', // 'deg' | 'rad'
        precision: 8,
        currentCalculator: 'standard' // 'standard' | 'scientific'
    },

    /**
     * Initialise la calculatrice
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.updateDisplay();
        this.initCalculatorNav();
        this.setupResponsiveLayout();
        window.addEventListener('resize', () => this.setupResponsiveLayout());
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('calculatorState', {
            history: [],
            memory: 0,
            isScientificMode: false,
            angleUnit: 'deg',
            precision: 8,
            currentCalculator: 'standard'
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Initialise la navigation entre calculatrices
     */
    initCalculatorNav() {
        const navButtons = document.querySelectorAll('.calculator-nav-btn');
        
        // Afficher la calculatrice active
        this.showCalculator(this.state.currentCalculator);
        
        // Mettre le bon bouton en surbrillance
        navButtons.forEach(btn => {
            if (btn.dataset.calcType === this.state.currentCalculator) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Ajouter les écouteurs d'événements
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const calculatorType = btn.dataset.calcType;
                this.showCalculator(calculatorType);
                this.state.currentCalculator = calculatorType;
                this.saveState();
            });
        });
    },

    /**
     * Affiche la calculatrice demandée
     */
    showCalculator(type) {
        const standard = document.getElementById('standard-calculator');
        const scientific = document.getElementById('scientific-calculator');
        
        if (type === 'standard') {
            standard.style.display = 'block';
            scientific.style.display = 'none';
        } else {
            standard.style.display = 'none';
            scientific.style.display = 'block';
        }
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Touches numériques et opérateurs
        document.querySelectorAll('.calculator-button[data-value]').forEach(key => {
            key.addEventListener('click', () => {
                this.appendToExpression(key.dataset.value);
            });
        });

        // Fonctions spéciales
        const actions = {
            'clear': () => this.clearAll(),
            'backspace': () => this.backspace(),
            'calculate': () => this.calculate(),
            'toggle-sign': () => this.toggleSign(),
            'percent': () => this.handlePercent(),
            'sin': () => this.handleFunction('sin'),
            'cos': () => this.handleFunction('cos'),
            'tan': () => this.handleFunction('tan'),
            'sqrt': () => this.handleFunction('√'),
            'log': () => this.handleFunction('log'),
            'ln': () => this.handleFunction('ln'),
            'square': () => this.handleFunction('square'),
            'power': () => this.appendToExpression('^'),
            '1/x': () => this.handleInverse(),
            'rad-deg': () => this.toggleAngleUnit(),
            'divide': () => this.appendToExpression('/'),
            'multiply': () => this.appendToExpression('*'),
            'add': () => this.appendToExpression('+'),
            'subtract': () => this.appendToExpression('-')
        };

        // Ajouter des écouteurs pour chaque action
        Object.keys(actions).forEach(action => {
            document.querySelectorAll(`.calculator-button[data-action="${action}"]`).forEach(button => {
                button.addEventListener('click', actions[action]);
            });
        });

        // Écouteur pour le bouton d'effacement de l'historique
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isCalculatorVisible()) return;

            e.preventDefault();
            
            const key = e.key.toLowerCase();
            
            if (/[0-9.]/.test(key)) {
                this.appendToExpression(key);
            } else if (['+', '-', '*', '/', '(', ')', '^'].includes(key)) {
                this.appendToExpression(key);
            } else if (key === 'enter') {
                this.calculate();
            } else if (key === 'escape') {
                this.clearAll();
            } else if (key === 'backspace') {
                this.backspace();
            }
        });
    },

    /**
     * Vérifie si la calculatrice est visible
     */
    isCalculatorVisible() {
        const calculator = document.getElementById('calculatorTool');
        return calculator?.style.display !== 'none';
    },

    /**
     * Ajoute un caractère à l'expression
     */
    appendToExpression(value) {
        const lastChar = this.state.currentExpression.slice(-1);
        
        // Vérifie si l'ajout est valide
        if (this.isOperator(value) && this.isOperator(lastChar)) {
            this.state.currentExpression = this.state.currentExpression.slice(0, -1) + value;
        } else if (value === '.' && this.hasDecimalPoint()) {
            return;
        } else {
            this.state.currentExpression += value;
        }

        this.updateDisplay();
    },

    /**
     * Vérifie si un caractère est un opérateur
     */
    isOperator(char) {
        return ['+', '-', '*', '/', '^'].includes(char);
    },

    /**
     * Vérifie si le nombre courant a déjà un point décimal
     */
    hasDecimalPoint() {
        const parts = this.state.currentExpression.split(/[-+*/]/);
        return parts[parts.length - 1].includes('.');
    },

    /**
     * Efface le dernier caractère
     */
    backspace() {
        this.state.currentExpression = this.state.currentExpression.slice(0, -1);
        this.updateDisplay();
    },

    /**
     * Change le signe du nombre actuel
     */
    toggleSign() {
        if (!this.state.currentExpression) return;
        
        if (this.state.currentExpression.startsWith('-')) {
            this.state.currentExpression = this.state.currentExpression.slice(1);
        } else {
            this.state.currentExpression = '-' + this.state.currentExpression;
        }
        
        this.updateDisplay();
    },

    /**
     * Gère le pourcentage
     */
    handlePercent() {
        if (!this.state.currentExpression) return;
        
        try {
            const value = this.evaluateExpression(this.state.currentExpression);
            this.state.currentExpression = (value / 100).toString();
            this.updateDisplay();
        } catch (error) {
            Utils.showNotification('Expression invalide', 'error');
        }
    },

    /**
     * Gère les fonctions scientifiques (sin, cos, etc.)
     */
    handleFunction(func) {
        if (!this.state.currentExpression && func !== 'sqrt' && func !== '√') return;
        
        try {
            let result;
            const value = this.state.currentExpression ? 
                this.evaluateExpression(this.state.currentExpression) : 0;
            
            switch (func) {
                case 'sin':
                    const angleInRad = this.state.angleUnit === 'deg' ? 
                        value * Math.PI / 180 : value;
                    result = Math.sin(angleInRad);
                    break;
                case 'cos':
                    const angleInRadCos = this.state.angleUnit === 'deg' ? 
                        value * Math.PI / 180 : value;
                    result = Math.cos(angleInRadCos);
                    break;
                case 'tan':
                    const angleInRadTan = this.state.angleUnit === 'deg' ? 
                        value * Math.PI / 180 : value;
                    result = Math.tan(angleInRadTan);
                    break;
                case 'sqrt':
                case '√':
                    if (value < 0) {
                        throw new Error('Racine carrée d\'un nombre négatif');
                    }
                    result = Math.sqrt(value);
                    break;
                case 'log':
                    if (value <= 0) {
                        throw new Error('Logarithme d\'un nombre négatif ou nul');
                    }
                    result = Math.log10(value);
                    break;
                case 'ln':
                    if (value <= 0) {
                        throw new Error('Logarithme naturel d\'un nombre négatif ou nul');
                    }
                    result = Math.log(value);
                    break;
                case 'square':
                    result = value * value;
                    break;
            }
            
            this.state.currentExpression = result.toFixed(this.state.precision);
            this.updateDisplay();
        } catch (error) {
            Utils.showNotification(error.message || 'Erreur de calcul', 'error');
        }
    },

    /**
     * Calcule l'inverse (1/x)
     */
    handleInverse() {
        if (!this.state.currentExpression) return;
        
        try {
            const value = this.evaluateExpression(this.state.currentExpression);
            if (value === 0) {
                throw new Error('Division par zéro');
            }
            this.state.currentExpression = (1 / value).toString();
            this.updateDisplay();
        } catch (error) {
            Utils.showNotification(error.message || 'Erreur de calcul', 'error');
        }
    },

    /**
     * Efface tout
     */
    clearAll() {
        this.state.currentExpression = '';
        this.updateDisplay();
    },

    /**
     * Efface l'historique
     */
    clearHistory() {
        this.state.history = [];
        this.updateDisplay();
        this.saveState();
        
        // Afficher une notification
        Utils.showNotification('Historique effacé', 'success');
    },

    /**
     * Calcule le résultat
     */
    calculate() {
        if (!this.state.currentExpression) {
            Utils.showNotification('Veuillez entrer une expression', 'warning');
            return;
        }

        try {
            const result = this.evaluateExpression(this.state.currentExpression);
            
            // Ajoute à l'historique
            this.state.history.unshift({
                expression: this.state.currentExpression,
                result: result,
                timestamp: new Date().toISOString()
            });

            // Limite l'historique à 10 entrées
            if (this.state.history.length > 10) {
                this.state.history = this.state.history.slice(0, 10);
            }

            // Met à jour l'affichage
            this.state.currentExpression = result.toString();
            this.updateDisplay();
            this.saveState();
        } catch (error) {
            let message = 'Expression invalide';
            
            if (error.message.includes('se termine par un opérateur')) {
                message = 'L\'expression ne peut pas se terminer par un opérateur';
            } else if (error.message.includes('parenthèses non équilibrées')) {
                message = 'Les parenthèses ne sont pas équilibrées';
            } else if (error.message.includes('non sécurisée')) {
                message = 'Expression contient des caractères non autorisés';
            } else if (error.message.includes('Résultat invalide')) {
                message = 'Le calcul a produit un résultat invalide';
            } else if (error.message.includes('Erreur de calcul')) {
                message = error.message;
            }

            Utils.showNotification(message, 'error');
        }
    },

    /**
     * Évalue une expression mathématique
     */
    evaluateExpression(expression) {
        // Vérifie si l'expression se termine par un opérateur
        if (this.isOperator(expression.slice(-1))) {
            throw new Error('Expression invalide : se termine par un opérateur');
        }

        // Vérifie les parenthèses
        const openParens = (expression.match(/\(/g) || []).length;
        const closeParens = (expression.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            throw new Error('Expression invalide : parenthèses non équilibrées');
        }

        // Remplace les fonctions scientifiques par leurs équivalents JavaScript
        expression = expression
            .replace(/sin\(/g, `Math.sin(${this.getAngleConversion()}`)
            .replace(/cos\(/g, `Math.cos(${this.getAngleConversion()}`)
            .replace(/tan\(/g, `Math.tan(${this.getAngleConversion()}`)
            .replace(/asin\(/g, `Math.asin(`)
            .replace(/acos\(/g, `Math.acos(`)
            .replace(/atan\(/g, `Math.atan(`)
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/π/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/\^/g, '**');

        // Vérifie la sécurité de l'expression avec une regex plus précise
        const safeExpressionRegex = /^[\d\s+\-*/()\^.√πe]+$/;
        const sanitizedExpression = expression.replace(/Math\.[a-z]+/g, '');
        if (!safeExpressionRegex.test(sanitizedExpression)) {
            throw new Error('Expression non sécurisée');
        }

        try {
            // Évalue l'expression
            const result = Function(`'use strict'; return ${expression}`)();
            
            // Vérifie si le résultat est un nombre valide
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('Résultat invalide');
            }

            // Arrondi le résultat selon la précision définie
            return Number(result.toFixed(this.state.precision));
        } catch (error) {
            throw new Error('Erreur de calcul : ' + error.message);
        }
    },

    /**
     * Obtient la conversion d'angle appropriée
     */
    getAngleConversion() {
        return this.state.angleUnit === 'deg' ? '* Math.PI / 180 * ' : '';
    },

    /**
     * Change l'unité d'angle
     */
    toggleAngleUnit() {
        this.state.angleUnit = this.state.angleUnit === 'deg' ? 'rad' : 'deg';
        this.updateAngleUnitDisplay();
        this.saveState();
    },

    /**
     * Met à jour l'affichage de l'unité d'angle
     */
    updateAngleUnitDisplay() {
        const angleUnitButton = document.querySelector('[data-action="rad-deg"]');
        if (angleUnitButton) {
            angleUnitButton.textContent = this.state.angleUnit.toUpperCase();
        }
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay() {
        // Affichage principal - standard
        const display = document.getElementById('current');
        if (display) {
            display.textContent = this.state.currentExpression || '0';
        }
        
        // Affichage principal - scientifique
        const sciDisplay = document.getElementById('sci-current');
        if (sciDisplay) {
            sciDisplay.textContent = this.state.currentExpression || '0';
        }

        // Historique
        const historyContainer = document.getElementById('calculatorHistory');
        if (historyContainer) {
            historyContainer.innerHTML = this.state.history
                .map(entry => `
                    <div class="history-item">
                        <div class="history-expression">${entry.expression} =</div>
                        <div class="history-result">${entry.result}</div>
                    </div>
                `)
                .join('');
        }

        this.updateAngleUnitDisplay();
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('calculatorState', {
            history: this.state.history,
            memory: this.state.memory,
            isScientificMode: this.state.isScientificMode,
            angleUnit: this.state.angleUnit,
            precision: this.state.precision,
            currentCalculator: this.state.currentCalculator
        });
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveState();
        window.__calculatorAlreadyInitialized = false;
    },

    /**
     * Optimise la disposition pour les écrans mobiles
     */
    setupResponsiveLayout() {
        const screenWidth = window.innerWidth;
        const scientificButtons = document.querySelectorAll('.scientific-grid .calculator-button');
        
        // Ajuste les textes des boutons selon la taille de l'écran
        if (screenWidth <= 350) {
            // Simplifier certains textes sur les très petits écrans
            document.querySelectorAll('[data-action="sin"]').forEach(btn => btn.textContent = 'sin');
            document.querySelectorAll('[data-action="cos"]').forEach(btn => btn.textContent = 'cos');
            document.querySelectorAll('[data-action="tan"]').forEach(btn => btn.textContent = 'tan');
            document.querySelectorAll('[data-action="log"]').forEach(btn => btn.textContent = 'log');
            document.querySelectorAll('[data-action="square"]').forEach(btn => btn.textContent = 'x²');
            document.querySelectorAll('[data-action="power"]').forEach(btn => btn.textContent = 'x^y');
            document.querySelectorAll('[data-action="1/x"]').forEach(btn => btn.textContent = '1/x');
        }
        
        // Vérifie si le layout est trop serré et applique des ajustements supplémentaires
        if (screenWidth <= 320) {
            document.querySelectorAll('[data-action="sin"]').forEach(btn => btn.textContent = 'sin');
            document.querySelectorAll('[data-action="cos"]').forEach(btn => btn.textContent = 'cos');
            document.querySelectorAll('[data-action="tan"]').forEach(btn => btn.textContent = 'tan');
            document.querySelectorAll('[data-action="ln"]').forEach(btn => btn.textContent = 'ln');
            document.querySelectorAll('[data-action="log"]').forEach(btn => btn.textContent = 'lg');
            document.querySelectorAll('[data-action="square"]').forEach(btn => btn.textContent = 'x²');
            document.querySelectorAll('[data-action="power"]').forEach(btn => btn.textContent = 'x^');
            document.querySelectorAll('[data-action="1/x"]').forEach(btn => btn.textContent = '1/x');
            document.querySelectorAll('[data-action="percent"]').forEach(btn => btn.textContent = '%');
        }
    }
};

// Fonction pour animer les résultats
function animateResult(resultElement) {
    resultElement.classList.remove('updated');
    void resultElement.offsetWidth; // Force reflow
    resultElement.classList.add('updated');
}

// Fonction pour calculer le pourcentage de base
export function calculatePercentage() {
    const percent = parseFloat(document.getElementById('percentValue').value);
    const base = parseFloat(document.getElementById('baseValue').value);
    const result = document.getElementById('percentResult');
    
    if (!isNaN(percent) && !isNaN(base)) {
        const calculated = (percent * base) / 100;
        result.textContent = `Résultat : ${calculated.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`;
        animateResult(result);
    }
}

// Fonction pour calculer la variation en pourcentage
export function calculateVariation() {
    const initial = parseFloat(document.getElementById('initialValue').value);
    const final = parseFloat(document.getElementById('finalValue').value);
    const result = document.getElementById('variationResult');
    
    if (!isNaN(initial) && !isNaN(final) && initial !== 0) {
        const variation = ((final - initial) / initial) * 100;
        const sign = variation > 0 ? '+' : '';
        result.textContent = `Variation : ${sign}${variation.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%`;
        animateResult(result);
    }
}

// Fonction pour calculer la valeur initiale
export function calculateInitial() {
    const final = parseFloat(document.getElementById('finalAmount').value);
    const percent = parseFloat(document.getElementById('percentage').value);
    const result = document.getElementById('initialResult');
    
    if (!isNaN(final) && !isNaN(percent) && percent !== 0) {
        const initial = (final * 100) / percent;
        result.textContent = `Valeur initiale : ${initial.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`;
        animateResult(result);
    }
}

// Initialiser la mini-calculatrice au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la mini-calculatrice dans le footer si elle existe
    if (typeof window.initMiniCalculator === 'function') {
        window.initMiniCalculator();
    }
    
    // Ajouter les écouteurs d'événements pour les touches Entrée dans les outils de pourcentage
    const inputs = document.querySelectorAll('.percentage-tools input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const group = input.closest('.calc-group');
                if (group) {
                    const button = group.querySelector('.calc-btn');
                    if (button) button.click();
                }
            }
        });
    });
});

// Exporter les fonctions pour les rendre disponibles globalement
if (typeof window !== 'undefined') {
    window.calculatePercentage = calculatePercentage;
    window.calculateVariation = calculateVariation;
    window.calculateInitial = calculateInitial;
    window.animateResult = animateResult;
} 