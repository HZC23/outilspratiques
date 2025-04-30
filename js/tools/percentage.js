window.percentageTool = {
    init: function() {
        // S'assurer que le DOM est prêt
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => window.percentageTool.init());
            return;
        }
        // Fonctionnalité des onglets
        const tabs = document.querySelectorAll('.tab-button');
        const contents = document.querySelectorAll('.tab-content');
        if (tabs.length && contents.length) {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));
                    tab.classList.add('active');
                    const targetTab = tab.getAttribute('data-tab');
                    const targetContent = document.getElementById(targetTab);
                    if (targetContent) targetContent.classList.add('active');
                });
            });
        }
        // Panneau d'aide
        const helpButton = document.getElementById('percentageHelp');
        const helpPanel = document.getElementById('percentageHelpPanel');
        const closeHelpButton = document.getElementById('closePercentageHelp');
        if (helpButton && helpPanel && closeHelpButton) {
            helpButton.addEventListener('click', () => {
                helpPanel.classList.add('active');
            });
            closeHelpButton.addEventListener('click', () => {
                helpPanel.classList.remove('active');
            });
        }
        // Calcul de base
        const percentageValueInput = document.getElementById('percentageValue');
        const percentageRateInput = document.getElementById('percentageRate');
        const calculatePercentageButton = document.getElementById('calculatePercentage');
        const percentageResultSpan = document.getElementById('percentageResult');
        if (calculatePercentageButton && percentageValueInput && percentageRateInput && percentageResultSpan) {
            calculatePercentageButton.addEventListener('click', () => {
                const value = parseFloat(percentageValueInput.value);
                const rate = parseFloat(percentageRateInput.value);
                if (!isNaN(value) && !isNaN(rate)) {
                    const result = (value * rate) / 100;
                    percentageResultSpan.textContent = result.toFixed(2);
                } else {
                    percentageResultSpan.textContent = 'Entrée invalide';
                }
            });
        }
        // Variation en pourcentage
        const oldValueInput = document.getElementById('oldValue');
        const newValueInput = document.getElementById('newValue');
        const calculateChangeButton = document.getElementById('calculateChange');
        const changeResultSpan = document.getElementById('changeResult');
        const differenceResultSpan = document.getElementById('differenceResult');
        if (calculateChangeButton && oldValueInput && newValueInput && changeResultSpan && differenceResultSpan) {
            calculateChangeButton.addEventListener('click', () => {
                const oldValue = parseFloat(oldValueInput.value);
                const newValue = parseFloat(newValueInput.value);
                if (!isNaN(oldValue) && !isNaN(newValue)) {
                    const difference = newValue - oldValue;
                    const percentageChange = (difference / oldValue) * 100;
                    differenceResultSpan.textContent = difference.toFixed(2);
                    if (!isNaN(percentageChange) && isFinite(percentageChange)) {
                        changeResultSpan.textContent = percentageChange.toFixed(2) + '%';
                        if (percentageChange > 0) {
                            changeResultSpan.style.color = 'green';
                        } else if (percentageChange < 0) {
                            changeResultSpan.style.color = 'red';
                        } else {
                            changeResultSpan.style.color = 'inherit';
                        }
                    } else if (oldValue === 0) {
                        changeResultSpan.textContent = 'Impossible (ancienne valeur est 0)';
                        changeResultSpan.style.color = 'inherit';
                    } else {
                        changeResultSpan.textContent = 'Erreur';
                        changeResultSpan.style.color = 'inherit';
                    }
                } else {
                    changeResultSpan.textContent = 'Entrée invalide';
                    differenceResultSpan.textContent = 'Entrée invalide';
                    changeResultSpan.style.color = 'inherit';
                }
            });
        }
        // Pourcentage de
        const partValueInput = document.getElementById('partValue');
        const totalValueInput = document.getElementById('totalValue');
        const calculateOfButton = document.getElementById('calculateOf');
        const ofResultSpan = document.getElementById('ofResult');
        if (calculateOfButton && partValueInput && totalValueInput && ofResultSpan) {
            calculateOfButton.addEventListener('click', () => {
                const partValue = parseFloat(partValueInput.value);
                const totalValue = parseFloat(totalValueInput.value);
                if (!isNaN(partValue) && !isNaN(totalValue) && totalValue !== 0) {
                    const percentage = (partValue / totalValue) * 100;
                    ofResultSpan.textContent = percentage.toFixed(2) + '%';
                } else if (totalValue === 0) {
                    ofResultSpan.textContent = 'Impossible (total est 0)';
                } else {
                    ofResultSpan.textContent = 'Entrée invalide';
                }
            });
        }
        // Calcul pourboire
        const billAmountInput = document.getElementById('billAmount');
        const tipPercentageInput = document.getElementById('tipPercentage');
        const numPeopleInput = document.getElementById('numPeople');
        const calculateTipButton = document.getElementById('calculateTip');
        const tipResultSpan = document.getElementById('tipResult');
        const totalWithTipResultSpan = document.getElementById('totalWithTipResult');
        const perPersonResultSpan = document.getElementById('perPersonResult');
        if (calculateTipButton && billAmountInput && tipPercentageInput && numPeopleInput && tipResultSpan && totalWithTipResultSpan && perPersonResultSpan) {
            calculateTipButton.addEventListener('click', () => {
                const billAmount = parseFloat(billAmountInput.value);
                const tipPercentage = parseFloat(tipPercentageInput.value);
                const numPeople = parseInt(numPeopleInput.value);
                if (!isNaN(billAmount) && !isNaN(tipPercentage) && !isNaN(numPeople) && numPeople > 0) {
                    const tipAmount = (billAmount * tipPercentage) / 100;
                    const totalAmount = billAmount + tipAmount;
                    const amountPerPerson = totalAmount / numPeople;
                    tipResultSpan.textContent = tipAmount.toFixed(2);
                    totalWithTipResultSpan.textContent = totalAmount.toFixed(2);
                    perPersonResultSpan.textContent = amountPerPerson.toFixed(2);
                } else {
                    tipResultSpan.textContent = 'Entrée invalide';
                    totalWithTipResultSpan.textContent = 'Entrée invalide';
                    perPersonResultSpan.textContent = 'Entrée invalide';
                }
            });
        }
    }
}; 