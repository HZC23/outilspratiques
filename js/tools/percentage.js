// Module principal pour le calculateur de pourcentage
window.percentageTool = (function() {
    // Fonctions privées et variables
    let isInitialized = false;
    
    // Constructeur du calculateur de pourcentage
    function init() {
        // Vérifier si déjà initialisé pour éviter les doublons d'événements
        if (isInitialized) {
            console.warn('Le calculateur de pourcentage est déjà initialisé');
            return;
        }
        
        // S'assurer que le DOM est prêt
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", init);
            return;
        }
        
        try {
            console.log('Initialisation du calculateur de pourcentages...');
            // Initialisation des composants
            initTabs();
            initHelpPanel();
            initBasicPercentage();
            initPercentageChange();
            initPercentageOf();
            initTipCalculator();
            initFullscreenButton();
            initFormSubmit();
            
            // Marquer comme initialisé
            isInitialized = true;
            console.log('Calculateur de pourcentage initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du calculateur:', error);
        }
    }
    
    // Initialisation de la soumission des formulaires
    function initFormSubmit() {
        try {
            const forms = document.querySelectorAll('.percentage-form');
            
            if (!forms.length) {
                console.error('Aucun formulaire trouvé');
                return;
            }
            
            forms.forEach(form => {
                form.addEventListener('submit', function(event) {
                    event.preventDefault();
                    
                    // Trouver le bouton de calcul dans ce formulaire et cliquer dessus
                    const calcButton = form.querySelector('.btn-primary');
                    if (calcButton) {
                        calcButton.click();
                    }
                    
                    return false;
                });
            });
            
            console.log('Gestion des formulaires initialisée');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des formulaires:', error);
        }
    }
    
    // Initialisation des onglets
    function initTabs() {
        try {
            // Utiliser le sélecteur spécifique pour trouver les onglets
            const tabs = document.querySelectorAll('#percentageTool .tab-button');
            const contents = document.querySelectorAll('#percentageTool .tab-content');
            
            if (!tabs.length || !contents.length) {
                console.error('Éléments d\'onglets non trouvés');
                return;
            }
            
            console.log(`${tabs.length} onglets trouvés, ${contents.length} contenus trouvés`);
            
            // Attacher les écouteurs d'événements à chaque onglet
            tabs.forEach(tab => {
                tab.addEventListener('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Désactiver tous les onglets et contenus
                    tabs.forEach(t => {
                        t.classList.remove('active');
                        t.setAttribute('aria-selected', 'false');
                    });
                    contents.forEach(c => c.classList.remove('active'));
                    
                    // Activer l'onglet cliqué et son contenu
                    this.classList.add('active');
                    this.setAttribute('aria-selected', 'true');
                    
                    const targetTabId = this.getAttribute('data-tab');
                    const targetContent = document.getElementById(targetTabId);
                    
                    if (targetContent) {
                        targetContent.classList.add('active');
                        console.log(`Changement vers l'onglet: ${targetTabId}`);
                    } else {
                        console.error(`Contenu cible non trouvé: ${targetTabId}`);
                    }
                });
            });
            
            // Ajouter la navigation au clavier
            enableKeyboardNavigation(tabs);
            
            console.log('Navigation par onglets initialisée');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des onglets:', error);
        }
    }
    
    // Navigation au clavier pour les onglets
    function enableKeyboardNavigation(tabs) {
        if (!tabs || !tabs.length) return;
        
        try {
            tabs.forEach((tab, index) => {
                tab.addEventListener('keydown', (event) => {
                    let targetIndex;
                    
                    switch (event.key) {
                        case 'ArrowRight':
                            targetIndex = (index + 1) % tabs.length;
                            break;
                        case 'ArrowLeft':
                            targetIndex = (index - 1 + tabs.length) % tabs.length;
                            break;
                        case 'Home':
                            targetIndex = 0;
                            break;
                        case 'End':
                            targetIndex = tabs.length - 1;
                            break;
                        default:
                            return;
                    }
                    
                    event.preventDefault();
                    event.stopPropagation();
                    tabs[targetIndex].click();
                    tabs[targetIndex].focus();
                });
            });
            
            console.log('Navigation clavier des onglets activée');
        } catch (error) {
            console.error('Erreur lors de l\'activation de la navigation clavier:', error);
        }
    }
    
    // Initialisation du panneau d'aide
    function initHelpPanel() {
        try {
            const helpButton = document.getElementById('percentageHelp');
            const helpPanel = document.getElementById('percentageHelpPanel');
            const closeHelpButton = document.getElementById('closePercentageHelp');
            
            if (!helpButton || !helpPanel || !closeHelpButton) {
                console.error('Éléments du panneau d\'aide non trouvés');
                return;
            }
            
            helpButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                helpPanel.classList.add('active');
            });
            
            closeHelpButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                helpPanel.classList.remove('active');
            });
            
            // Fermer le panneau d'aide en cliquant en dehors
            document.addEventListener('click', (event) => {
                if (helpPanel.classList.contains('active') && 
                    !helpPanel.contains(event.target) && 
                    event.target !== helpButton) {
                    helpPanel.classList.remove('active');
                }
            });
            
            // Fermer avec Escape
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && helpPanel.classList.contains('active')) {
                    helpPanel.classList.remove('active');
                }
            });
            
            console.log('Panneau d\'aide initialisé');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du panneau d\'aide:', error);
        }
    }
    
    // Calcul de pourcentage de base
    function initBasicPercentage() {
        try {
            const form = document.getElementById('basicPercentageForm');
            const valueInput = document.getElementById('percentageValue');
            const rateInput = document.getElementById('percentageRate');
            const calculateButton = document.getElementById('calculatePercentage');
            const resultSpan = document.getElementById('percentageResult');
            
            if (!form || !calculateButton || !valueInput || !rateInput || !resultSpan) {
                console.error('Éléments du calculateur de base non trouvés');
                return;
            }
            
            // Ajouter la validation d'entrée et des écouteurs d'événements
            addInputListeners(valueInput);
            addInputListeners(rateInput);
            
            const calculate = () => {
                try {
                    const value = parseFloat(valueInput.value || '0');
                    const rate = parseFloat(rateInput.value || '0');
                    
                    if (!isNaN(value) && !isNaN(rate)) {
                        const result = (value * rate) / 100;
                        resultSpan.textContent = formatNumber(result);
                    } else {
                        resultSpan.textContent = 'Entrée invalide';
                    }
                } catch (error) {
                    console.error('Erreur lors du calcul de base:', error);
                    resultSpan.textContent = 'Erreur de calcul';
                }
            };
            
            calculateButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                calculate();
            });
            
            // Calculer en appuyant sur Entrée
            [valueInput, rateInput].forEach(input => {
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        calculate();
                    }
                });
            });
            
            // Gérer la soumission du formulaire
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                calculate();
                return false;
            });
            
            console.log('Calculateur de base initialisé');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du calculateur de base:', error);
        }
    }
    
    // Calcul de variation en pourcentage
    function initPercentageChange() {
        try {
            const form = document.getElementById('percentageChangeForm');
            const oldValueInput = document.getElementById('oldValue');
            const newValueInput = document.getElementById('newValue');
            const calculateButton = document.getElementById('calculateChange');
            const changeResultSpan = document.getElementById('changeResult');
            const differenceResultSpan = document.getElementById('differenceResult');
            
            if (!form || !calculateButton || !oldValueInput || !newValueInput || !changeResultSpan || !differenceResultSpan) {
                console.error('Éléments du calculateur de variation non trouvés');
                return;
            }
            
            // Ajouter la validation d'entrée et des écouteurs d'événements
            addInputListeners(oldValueInput);
            addInputListeners(newValueInput);
            
            const calculate = () => {
                try {
                    const oldValue = parseFloat(oldValueInput.value || '0');
                    const newValue = parseFloat(newValueInput.value || '0');
                    
                    if (!isNaN(oldValue) && !isNaN(newValue)) {
                        const difference = newValue - oldValue;
                        differenceResultSpan.textContent = formatNumber(difference);
                        
                        // Gérer le cas où l'ancienne valeur est 0
                        if (oldValue === 0) {
                            if (newValue === 0) {
                                changeResultSpan.textContent = '0,00%';
                                changeResultSpan.style.color = 'inherit';
                            } else {
                                changeResultSpan.textContent = 'Impossible (valeur initiale est 0)';
                                changeResultSpan.style.color = 'inherit';
                            }
                        } else {
                            const percentageChange = (difference / Math.abs(oldValue)) * 100;
                            changeResultSpan.textContent = formatNumber(percentageChange) + '%';
                            
                            // Colorier le résultat selon la variation
                            if (percentageChange > 0) {
                                changeResultSpan.style.color = 'green';
                            } else if (percentageChange < 0) {
                                changeResultSpan.style.color = 'red';
                            } else {
                                changeResultSpan.style.color = 'inherit';
                            }
                        }
                    } else {
                        changeResultSpan.textContent = 'Entrée invalide';
                        differenceResultSpan.textContent = 'Entrée invalide';
                        changeResultSpan.style.color = 'inherit';
                    }
                } catch (error) {
                    console.error('Erreur lors du calcul de variation:', error);
                    changeResultSpan.textContent = 'Erreur de calcul';
                    differenceResultSpan.textContent = 'Erreur de calcul';
                }
            };
            
            calculateButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                calculate();
            });
            
            // Calculer en appuyant sur Entrée
            [oldValueInput, newValueInput].forEach(input => {
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        calculate();
                    }
                });
            });
            
            // Gérer la soumission du formulaire
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                calculate();
                return false;
            });
            
            console.log('Calculateur de variation initialisé');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du calculateur de variation:', error);
        }
    }
    
    // Calcul "Pourcentage de"
    function initPercentageOf() {
        try {
            const form = document.getElementById('percentageOfForm');
            const partValueInput = document.getElementById('partValue');
            const totalValueInput = document.getElementById('totalValue');
            const calculateButton = document.getElementById('calculateOf');
            const resultSpan = document.getElementById('ofResult');
            
            if (!form || !calculateButton || !partValueInput || !totalValueInput || !resultSpan) {
                console.error('Éléments du calculateur de pourcentage non trouvés');
                return;
            }
            
            // Ajouter la validation d'entrée et des écouteurs d'événements
            addInputListeners(partValueInput);
            addInputListeners(totalValueInput);
            
            const calculate = () => {
                try {
                    const partValue = parseFloat(partValueInput.value || '0');
                    const totalValue = parseFloat(totalValueInput.value || '0');
                    
                    if (!isNaN(partValue) && !isNaN(totalValue)) {
                        if (totalValue === 0) {
                            resultSpan.textContent = 'Impossible (total est 0)';
                        } else {
                            const percentage = (partValue / totalValue) * 100;
                            resultSpan.textContent = formatNumber(percentage) + '%';
                        }
                    } else {
                        resultSpan.textContent = 'Entrée invalide';
                    }
                } catch (error) {
                    console.error('Erreur lors du calcul de pourcentage:', error);
                    resultSpan.textContent = 'Erreur de calcul';
                }
            };
            
            calculateButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                calculate();
            });
            
            // Calculer en appuyant sur Entrée
            [partValueInput, totalValueInput].forEach(input => {
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        calculate();
                    }
                });
            });
            
            // Gérer la soumission du formulaire
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                calculate();
                return false;
            });
            
            console.log('Calculateur de pourcentage initialisé');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du calculateur de pourcentage:', error);
        }
    }
    
    // Calcul de pourboire
    function initTipCalculator() {
        try {
            const form = document.getElementById('percentageTipForm');
            const billAmountInput = document.getElementById('billAmount');
            const tipPercentageInput = document.getElementById('tipPercentage');
            const numPeopleInput = document.getElementById('numPeople');
            const calculateButton = document.getElementById('calculateTip');
            const tipResultSpan = document.getElementById('tipResult');
            const totalWithTipResultSpan = document.getElementById('totalWithTipResult');
            const perPersonResultSpan = document.getElementById('perPersonResult');
            
            if (!form || !calculateButton || !billAmountInput || !tipPercentageInput || !numPeopleInput || 
                !tipResultSpan || !totalWithTipResultSpan || !perPersonResultSpan) {
                console.error('Éléments du calculateur de pourboire non trouvés');
                return;
            }
            
            // Ajouter la validation d'entrée et des écouteurs d'événements
            addInputListeners(billAmountInput);
            addInputListeners(tipPercentageInput);
            addInputListeners(numPeopleInput, true); // true pour entier
            
            const calculate = () => {
                try {
                    const billAmount = parseFloat(billAmountInput.value || '0');
                    const tipPercentage = parseFloat(tipPercentageInput.value || '0');
                    const numPeople = parseInt(numPeopleInput.value || '1');
                    
                    if (!isNaN(billAmount) && !isNaN(tipPercentage) && !isNaN(numPeople)) {
                        if (numPeople <= 0) {
                            tipResultSpan.textContent = 'Nombre de personnes invalide';
                            totalWithTipResultSpan.textContent = 'Entrée invalide';
                            perPersonResultSpan.textContent = 'Entrée invalide';
                            return;
                        }
                        
                        const tipAmount = (billAmount * tipPercentage) / 100;
                        const totalAmount = billAmount + tipAmount;
                        const amountPerPerson = totalAmount / numPeople;
                        
                        tipResultSpan.textContent = formatNumber(tipAmount);
                        totalWithTipResultSpan.textContent = formatNumber(totalAmount);
                        perPersonResultSpan.textContent = formatNumber(amountPerPerson);
                    } else {
                        tipResultSpan.textContent = 'Entrée invalide';
                        totalWithTipResultSpan.textContent = 'Entrée invalide';
                        perPersonResultSpan.textContent = 'Entrée invalide';
                    }
                } catch (error) {
                    console.error('Erreur lors du calcul de pourboire:', error);
                    tipResultSpan.textContent = 'Erreur de calcul';
                    totalWithTipResultSpan.textContent = 'Erreur de calcul';
                    perPersonResultSpan.textContent = 'Erreur de calcul';
                }
            };
            
            calculateButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                calculate();
            });
            
            // Calculer en appuyant sur Entrée
            [billAmountInput, tipPercentageInput, numPeopleInput].forEach(input => {
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        calculate();
                    }
                });
            });
            
            // Gérer la soumission du formulaire
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                calculate();
                return false;
            });
            
            console.log('Calculateur de pourboire initialisé');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du calculateur de pourboire:', error);
        }
    }
    
    // Fonction pour ajouter des écouteurs d'entrée et la validation
    function addInputListeners(input, isInteger = false) {
        if (!input) return;
        
        try {
            // Validation à la perte de focus
            input.addEventListener('blur', () => {
                const value = input.value.trim();
                
                if (value === '') return;
                
                const numValue = isInteger ? parseInt(value) : parseFloat(value);
                
                if (isNaN(numValue)) {
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                    
                    // Formater la valeur correctement
                    if (isInteger) {
                        input.value = Math.max(1, numValue); // Minimum 1 pour numPeople
                    } else {
                        input.value = numValue;
                    }
                }
            });
            
            // Réinitialiser la classe d'erreur lors de la saisie
            input.addEventListener('input', () => {
                input.classList.remove('error');
            });
        } catch (error) {
            console.error('Erreur lors de l\'ajout des écouteurs d\'entrée:', error);
        }
    }
    
    // Initialisation du bouton plein écran
    function initFullscreenButton() {
        try {
            const fullscreenBtn = document.getElementById('percentageFullscreenBtn');
            const toolContainer = document.getElementById('percentageTool');
            
            if (!fullscreenBtn || !toolContainer) {
                console.error('Éléments du bouton plein écran non trouvés');
                return;
            }
            
            fullscreenBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                if (toolContainer.classList.contains('fullscreen')) {
                    toolContainer.classList.remove('fullscreen');
                    fullscreenBtn.innerHTML = '<i class="fas fa-expand" aria-hidden="true"></i>';
                    fullscreenBtn.setAttribute('aria-label', 'Plein écran');
                } else {
                    toolContainer.classList.add('fullscreen');
                    fullscreenBtn.innerHTML = '<i class="fas fa-compress" aria-hidden="true"></i>';
                    fullscreenBtn.setAttribute('aria-label', 'Quitter le plein écran');
                }
            });
            
            // Gérer la touche Escape pour quitter le mode plein écran
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && toolContainer.classList.contains('fullscreen')) {
                    fullscreenBtn.click();
                }
            });
            
            console.log('Bouton plein écran initialisé');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du bouton plein écran:', error);
        }
    }
    
    // Fonction d'aide pour formater les nombres avec 2 décimales
    function formatNumber(number) {
        try {
            return parseFloat(number.toFixed(2)).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } catch (error) {
            console.error('Erreur lors du formatage du nombre:', error);
            return '0,00';
        }
    }
    
    // API publique
    return {
        init: init,
        // Pour le débogage
        _debug: {
            formatNumber: formatNumber
        }
    };
})(); 