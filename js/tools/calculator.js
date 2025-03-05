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
        if (!this.state.currentExpression) return;

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
            Utils.showNotification('Expression invalide', 'error');
        }
    },

    /**
     * Évalue une expression mathématique
     */
    evaluateExpression(expression) {
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

        // Vérifie la sécurité de l'expression
        if (!/^[0-9+\-*/().√πe\s^]*$/.test(expression.replace(/Math\.[a-z]+/g, ''))) {
            throw new Error('Expression non sécurisée');
        }

        // Évalue l'expression
        const result = Function(`'use strict'; return ${expression}`)();
        
        // Arrondi le résultat selon la précision définie
        return Number(result.toFixed(this.state.precision));
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