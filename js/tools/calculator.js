import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';

/**
 * Gestionnaire de la calculatrice
 */
export const CalculatorManager = {
    state: {
        currentExpression: '',
        history: [],
        memory: 0,
        isScientificMode: false,
        angleUnit: 'deg', // 'deg' | 'rad'
        precision: 8
    },

    /**
     * Initialise la calculatrice
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
        const savedState = Utils.loadFromStorage('calculatorState', {
            history: [],
            memory: 0,
            isScientificMode: false,
            angleUnit: 'deg',
            precision: 8
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Touches numériques et opérateurs
        document.querySelectorAll('.calculator-key').forEach(key => {
            key.addEventListener('click', () => {
                this.appendToExpression(key.dataset.value);
            });
        });

        // Fonctions spéciales
        document.getElementById('clearEntry')?.addEventListener('click', () => {
            this.clearEntry();
        });

        document.getElementById('clearAll')?.addEventListener('click', () => {
            this.clearAll();
        });

        document.getElementById('backspace')?.addEventListener('click', () => {
            this.backspace();
        });

        document.getElementById('equals')?.addEventListener('click', () => {
            this.calculate();
        });

        // Mémoire
        ['memoryClear', 'memoryRecall', 'memoryAdd', 'memorySubtract'].forEach(action => {
            document.getElementById(action)?.addEventListener('click', () => {
                this.handleMemory(action);
            });
        });

        // Mode scientifique
        document.getElementById('toggleScientific')?.addEventListener('click', () => {
            this.toggleScientificMode();
        });

        document.getElementById('toggleAngleUnit')?.addEventListener('click', () => {
            this.toggleAngleUnit();
        });

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
     * Efface l'entrée courante
     */
    clearEntry() {
        this.state.currentExpression = '';
        this.updateDisplay();
    },

    /**
     * Efface tout
     */
    clearAll() {
        this.state.currentExpression = '';
        this.state.history = [];
        this.updateDisplay();
        this.saveState();
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
     * Gère les opérations de mémoire
     */
    handleMemory(action) {
        switch (action) {
            case 'memoryClear':
                this.state.memory = 0;
                break;
            case 'memoryRecall':
                this.state.currentExpression += this.state.memory.toString();
                break;
            case 'memoryAdd':
                if (this.state.currentExpression) {
                    try {
                        const value = this.evaluateExpression(this.state.currentExpression);
                        this.state.memory += value;
                    } catch (error) {
                        Utils.showNotification('Expression invalide', 'error');
                        return;
                    }
                }
                break;
            case 'memorySubtract':
                if (this.state.currentExpression) {
                    try {
                        const value = this.evaluateExpression(this.state.currentExpression);
                        this.state.memory -= value;
                    } catch (error) {
                        Utils.showNotification('Expression invalide', 'error');
                        return;
                    }
                }
                break;
        }

        this.updateDisplay();
        this.saveState();
    },

    /**
     * Active/désactive le mode scientifique
     */
    toggleScientificMode() {
        this.state.isScientificMode = !this.state.isScientificMode;
        document.getElementById('scientificKeys')?.classList.toggle('hidden');
        this.saveState();
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
     * Met à jour l'affichage
     */
    updateDisplay() {
        // Affichage principal
        const display = document.getElementById('calculatorDisplay');
        if (display) {
            display.textContent = this.state.currentExpression || '0';
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

        // Mémoire
        const memoryIndicator = document.getElementById('memoryIndicator');
        if (memoryIndicator) {
            memoryIndicator.style.display = this.state.memory !== 0 ? 'block' : 'none';
        }

        this.updateAngleUnitDisplay();
    },

    /**
     * Met à jour l'affichage de l'unité d'angle
     */
    updateAngleUnitDisplay() {
        const angleUnitButton = document.getElementById('toggleAngleUnit');
        if (angleUnitButton) {
            angleUnitButton.textContent = this.state.angleUnit.toUpperCase();
        }
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
            precision: this.state.precision
        });
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveState();
    }
};

// Fonction pour animer les résultats
function animateResult(resultElement) {
    resultElement.classList.remove('updated');
    void resultElement.offsetWidth; // Force reflow
    resultElement.classList.add('updated');
}

// Fonction pour calculer le pourcentage de base
function calculatePercentage() {
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
function calculateVariation() {
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
function calculateInitial() {
    const final = parseFloat(document.getElementById('finalAmount').value);
    const percent = parseFloat(document.getElementById('percentage').value);
    const result = document.getElementById('initialResult');
    
    if (!isNaN(final) && !isNaN(percent) && percent !== 0) {
        const initial = (final * 100) / percent;
        result.textContent = `Valeur initiale : ${initial.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`;
        animateResult(result);
    }
}

// Ajout des écouteurs d'événements pour les touches Entrée
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.percentage-tools input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const group = input.closest('.calc-group');
                group.querySelector('.calc-btn').click();
            }
        });
    });
}); 