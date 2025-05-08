/**
 * Calculateur de pourcentages
 * Script pour gérer les différents types de calculs de pourcentages
 */

function initPercentageTool() {
    // Sélection des éléments DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const helpButton = document.querySelector('.help-button');
    const helpPanel = document.getElementById('percentage-help');
    const closeHelpButton = document.querySelector('.close-help');

    // Vérifier si les éléments critiques sont présents avant d'initialiser
    if (!tabButtons.length || !tabContents.length || !helpButton || !helpPanel || !closeHelpButton) {
        console.error("Les éléments DOM nécessaires à l'outil de pourcentage ne sont pas trouvés.");
        // Ne pas retourner ici, car initCalculatorX pourrait être appelé par un autre script
        // Et nous voulons que les fonctions d'initialisation existent même si les éléments ne sont pas trouvés immédiatement.
        // Le problème est plus probablement dans la sélection des éléments à l'intérieur de chaque initCalculatorX.
    }

    // Initialisation des calculs - Ces fonctions sélectionnent leurs propres éléments
    initCalculator1(); // Valeur pourcentage
    initCalculator2(); // Pourcentage de
    initCalculator3(); // Augmentation / Réduction
    initCalculator4(); // Remise
    initCalculator5(); // TVA / Taxes
    initCalculator6(); // Marge

    // Gestion des onglets - À ne faire que si les éléments existent
    if (tabButtons.length && tabContents.length) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Masquer tous les contenus et désactiver tous les boutons
                tabContents.forEach(content => content.classList.remove('active'));
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Afficher le contenu sélectionné et activer le bouton
                document.getElementById(tabId).classList.add('active');
                button.classList.add('active');
                
                // Mettre à jour le rôle ARIA
                tabButtons.forEach(btn => btn.setAttribute('aria-selected', 'false'));
                button.setAttribute('aria-selected', 'true');
            });
        });
    }

    // Gestion du panneau d'aide - À ne faire que si les éléments existent
    if (helpButton && helpPanel && closeHelpButton) {
        helpButton.addEventListener('click', () => {
            helpPanel.classList.add('active');
        });

        closeHelpButton.addEventListener('click', () => {
            helpPanel.classList.remove('active');
        });

        // Cliquer en dehors du panneau d'aide le ferme
        document.addEventListener('click', (e) => {
            if (helpPanel.classList.contains('active') && 
                !helpPanel.contains(e.target) && 
                e.target !== helpButton) {
                helpPanel.classList.remove('active');
            }
        });
    }
}

// Fonctions communes
function formatNumber(num) {
    return parseFloat(parseFloat(num).toFixed(2)).toLocaleString();
}

function showResult(resultId) {
    const resultContainer = document.getElementById(resultId);
    if (resultContainer) {
        resultContainer.style.display = 'block';
        resultContainer.classList.add('pulse');
        setTimeout(() => {
            resultContainer.classList.remove('pulse');
        }, 500);
    }
}

function validateInputs(inputs) {
    let valid = true;
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value === '' || isNaN(parseFloat(value))) {
            input.classList.add('error');
            valid = false;
        } else {
            input.classList.remove('error');
        }
    });
    return valid;
}

function resetForm(formId, resultId) {
    const form = document.querySelector(`#${formId} form`);
    const resultContainer = document.getElementById(resultId);
    if (form) {
        form.reset();
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => input.classList.remove('error'));
    }
    if (resultContainer) {
        resultContainer.style.display = 'none';
    }
}

// Calculateur 1: Valeur pourcentage
function initCalculator1() {
    const percent1 = document.getElementById('percent1');
    const total1 = document.getElementById('total1');
    const calculate1 = document.getElementById('calculate1');
    const reset1 = document.getElementById('reset1');
    const resultValue1 = document.getElementById('resultValue1');
    
    // Vérifier si tous les éléments nécessaires pour ce calculateur sont présents
    if (!percent1 || !total1 || !calculate1 || !reset1 || !resultValue1) {
        console.error("Éléments DOM pour Calculateur 1 introuvables.");
        return;
    }

    function calculateValue() {
        if (!validateInputs([percent1, total1])) return;
        
        const percentValue = parseFloat(percent1.value);
        const totalValue = parseFloat(total1.value);
        const result = (percentValue * totalValue) / 100;
        
        resultValue1.textContent = formatNumber(result);
        showResult('result1');
    }
    
    calculate1.addEventListener('click', calculateValue);
    reset1.addEventListener('click', () => resetForm('calc1', 'result1'));
    
    // Calcul sur appui Entrée
    [percent1, total1].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') calculateValue();
        });
    });
}

// Calculateur 2: Pourcentage de
function initCalculator2() {
    const part2 = document.getElementById('part2');
    const total2 = document.getElementById('total2');
    const calculate2 = document.getElementById('calculate2');
    const reset2 = document.getElementById('reset2');
    const resultValue2 = document.getElementById('resultValue2');
    
    if (!part2 || !total2 || !calculate2 || !reset2 || !resultValue2) {
        console.error("Éléments DOM pour Calculateur 2 introuvables.");
        return;
    }

    function calculatePercentage() {
        if (!validateInputs([part2, total2])) return;
        
        const partValue = parseFloat(part2.value);
        const totalValue = parseFloat(total2.value);
        
        if (totalValue === 0) {
            alert('Le total ne peut pas être égal à zéro');
            return;
        }
        
        const result = (partValue / totalValue) * 100;
        
        resultValue2.textContent = formatNumber(result) + '%';
        showResult('result2');
    }
    
    calculate2.addEventListener('click', calculatePercentage);
    reset2.addEventListener('click', () => resetForm('calc2', 'result2'));
    
    // Calcul sur appui Entrée
    [part2, total2].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') calculatePercentage();
        });
    });
}

// Calculateur 3: Augmentation / Réduction
function initCalculator3() {
    const original3 = document.getElementById('original3');
    const final3 = document.getElementById('final3');
    const calculate3 = document.getElementById('calculate3');
    const reset3 = document.getElementById('reset3');
    const differenceValue = document.getElementById('differenceValue');
    const percentageValue = document.getElementById('percentageValue');

     if (!original3 || !final3 || !calculate3 || !reset3 || !differenceValue || !percentageValue) {
        console.error("Éléments DOM pour Calculateur 3 introuvables.");
        return;
    }
    
    function calculateChange() {
        if (!validateInputs([original3, final3])) return;
        
        const originalValue = parseFloat(original3.value);
        const finalValue = parseFloat(final3.value);
        
        if (originalValue === 0) {
            alert('La valeur originale ne peut pas être égale à zéro');
            return;
        }
        
        const difference = finalValue - originalValue;
        const percentage = (difference / originalValue) * 100;
        
        differenceValue.textContent = formatNumber(difference);
        percentageValue.textContent = formatNumber(percentage) + '%';
        
        // Appliquer la classe en fonction du signe
        if (percentage > 0) {
            percentageValue.className = 'result-value positive';
            differenceValue.className = 'result-value positive';
        } else if (percentage < 0) {
            percentageValue.className = 'result-value negative';
            differenceValue.className = 'result-value negative';
        } else {
            percentageValue.className = 'result-value';
            differenceValue.className = 'result-value';
        }
        
        showResult('result3');
    }
    
    calculate3.addEventListener('click', calculateChange);
    reset3.addEventListener('click', () => resetForm('calc3', 'result3'));
    
    // Calcul sur appui Entrée
    [original3, final3].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') calculateChange();
        });
    });
}

// Calculateur 4: Remise
function initCalculator4() {
    const original4 = document.getElementById('original4');
    const discount4 = document.getElementById('discount4');
    const calculate4 = document.getElementById('calculate4');
    const reset4 = document.getElementById('reset4');
    const discountAmount = document.getElementById('discountAmount');
    const finalPrice = document.getElementById('finalPrice');
    const savings = document.getElementById('savings');

    if (!original4 || !discount4 || !calculate4 || !reset4 || !discountAmount || !finalPrice || !savings) {
        console.error("Éléments DOM pour Calculateur 4 introuvables.");
        return;
    }
    
    function calculateDiscount() {
        if (!validateInputs([original4, discount4])) return;
        
        const originalPrice = parseFloat(original4.value);
        const discountPercent = parseFloat(discount4.value);
        
        if (discountPercent < 0 || discountPercent > 100) {
            alert('Le pourcentage de remise doit être entre 0 et 100');
            return;
        }
        
        const discount = (originalPrice * discountPercent) / 100;
        const final = originalPrice - discount;
        
        discountAmount.textContent = formatNumber(discount);
        finalPrice.textContent = formatNumber(final);
        savings.textContent = formatNumber(discountPercent) + '%';
        
        showResult('result4');
    }
    
    calculate4.addEventListener('click', calculateDiscount);
    reset4.addEventListener('click', () => resetForm('calc4', 'result4'));
    
    // Calcul sur appui Entrée
    [original4, discount4].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') calculateDiscount();
        });
    });
}

// Calculateur 5: TVA / Taxes
function initCalculator5() {
    const taxRate = document.getElementById('taxRate');
    const priceType = document.getElementById('priceType');
    const price5 = document.getElementById('price5');
    const calculate5 = document.getElementById('calculate5');
    const reset5 = document.getElementById('reset5');
    const preTaxPrice = document.getElementById('preTaxPrice');
    const taxAmount = document.getElementById('taxAmount');
    const withTaxPrice = document.getElementById('withTaxPrice');

     if (!taxRate || !priceType || !price5 || !calculate5 || !reset5 || !preTaxPrice || !taxAmount || !withTaxPrice) {
        console.error("Éléments DOM pour Calculateur 5 introuvables.");
        return;
    }
    
    function calculateTax() {
        if (!validateInputs([taxRate, price5])) return;
        
        const rate = parseFloat(taxRate.value);
        const price = parseFloat(price5.value);
        let priceHT, priceTTC, tax;
        
        if (priceType.value === 'preTax') {
            // Prix HT vers TTC
            priceHT = price;
            priceTTC = price * (1 + rate / 100);
            tax = priceTTC - priceHT;
        } else {
            // Prix TTC vers HT
            priceTTC = price;
            priceHT = price / (1 + rate / 100);
            tax = priceTTC - priceHT;
        }
        
        preTaxPrice.textContent = formatNumber(priceHT);
        taxAmount.textContent = formatNumber(tax);
        withTaxPrice.textContent = formatNumber(priceTTC);
        
        showResult('result5');
    }
    
    calculate5.addEventListener('click', calculateTax);
    reset5.addEventListener('click', () => resetForm('calc5', 'result5'));
    
    // Calcul sur appui Entrée
    [taxRate, price5].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') calculateTax();
        });
    });
    
    // Aussi recalculer quand le type de prix change
    priceType.addEventListener('change', calculateTax);
}

// Calculateur 6: Marge
function initCalculator6() {
    const cost6 = document.getElementById('cost6');
    const markup6 = document.getElementById('markup6');
    const calculate6 = document.getElementById('calculate6');
    const reset6 = document.getElementById('reset6');
    const markupAmount = document.getElementById('markupAmount');
    const sellingPrice = document.getElementById('sellingPrice');
    const grossMargin = document.getElementById('grossMargin');

     if (!cost6 || !markup6 || !calculate6 || !reset6 || !markupAmount || !sellingPrice || !grossMargin) {
        console.error("Éléments DOM pour Calculateur 6 introuvables.");
        return;
    }
    
    function calculateMargin() {
        if (!validateInputs([cost6, markup6])) return;
        
        const costValue = parseFloat(cost6.value);
        const markupPercent = parseFloat(markup6.value);
        
        const margin = (costValue * markupPercent) / 100;
        const selling = costValue + margin;
        
        markupAmount.textContent = formatNumber(margin);
        sellingPrice.textContent = formatNumber(selling);
        grossMargin.textContent = formatNumber(markupPercent) + '%';
        
        showResult('result6');
    }
    
    calculate6.addEventListener('click', calculateMargin);
    reset6.addEventListener('click', () => resetForm('calc6', 'result6'));
    
    // Calcul sur appui Entrée
    [cost6, markup6].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') calculateMargin();
        });
    });
} 