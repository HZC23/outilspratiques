/**
 * Module de conversion de devises
 * Gère la conversion entre différentes devises avec des taux de change
 */

// Dernière mise à jour des taux
let lastUpdateDate = '2024-03-15';

// Taux de change (dernière mise à jour: 2024-03-15)
const exchangeRates = {
    EUR: 1.00,     // Euro (base)
    USD: 1.09,     // Dollar américain
    GBP: 0.85,     // Livre sterling
    JPY: 161.12,   // Yen japonais
    CHF: 0.96,     // Franc suisse
    CAD: 1.47,     // Dollar canadien
    AUD: 1.65,     // Dollar australien
    CNY: 7.87,     // Yuan chinois
    INR: 90.39,    // Roupie indienne
    BRL: 5.47,     // Real brésilien
    RUB: 98.23,    // Rouble russe
    KRW: 1454.86,  // Won sud-coréen
    TRY: 35.06,    // Livre turque
    MXN: 18.15,    // Peso mexicain
    ZAR: 20.12,    // Rand sud-africain
    SGD: 1.46,     // Dollar de Singapour
    HKD: 8.52,     // Dollar de Hong Kong
    SEK: 11.31,    // Couronne suédoise
    NZD: 1.78,     // Dollar néo-zélandais
    PLN: 4.31      // Złoty polonais
};

// Symboles des devises
const currencySymbols = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥',
    CHF: 'Fr',
    CAD: 'C$',
    AUD: 'A$',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
    RUB: '₽',
    KRW: '₩',
    TRY: '₺',
    MXN: '$',
    ZAR: 'R',
    SGD: 'S$',
    HKD: 'HK$',
    SEK: 'kr',
    NZD: 'NZ$',
    PLN: 'zł'
};

// Groupement des devises par région
const currencyRegions = {
    popular: ['EUR', 'USD', 'GBP', 'JPY', 'CHF'],
    europe: ['EUR', 'GBP', 'CHF', 'SEK', 'PLN'],
    americas: ['USD', 'CAD', 'MXN', 'BRL'],
    asia: ['JPY', 'CNY', 'INR', 'SGD', 'HKD', 'KRW'],
    oceania: ['AUD', 'NZD']
};

// État du convertisseur
let state = {
    amount: 1,
    fromCurrency: 'EUR',
    toCurrency: 'USD',
    result: 0,
    history: [],
    currentRegion: 'popular',
    rates: { ...exchangeRates },
    lastUpdate: new Date().toISOString(),
    isOffline: false,
    historicalData: {},
    chartInstance: null
};

// Liste des devises principales
const MAIN_CURRENCIES = [
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', name: 'Dollar américain', symbol: '$', flag: '🇺🇸' },
    { code: 'GBP', name: 'Livre sterling', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: 'Yen japonais', symbol: '¥', flag: '🇯🇵' },
    { code: 'CAD', name: 'Dollar canadien', symbol: 'C$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Dollar australien', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CHF', name: 'Franc suisse', symbol: 'Fr', flag: '🇨🇭' },
    { code: 'CNY', name: 'Yuan chinois', symbol: '¥', flag: '🇨🇳' },
    { code: 'INR', name: 'Roupie indienne', symbol: '₹', flag: '🇮🇳' },
    { code: 'BRL', name: 'Real brésilien', symbol: 'R$', flag: '🇧🇷' },
    { code: 'RUB', name: 'Rouble russe', symbol: '₽', flag: '🇷🇺' },
    { code: 'KRW', name: 'Won sud-coréen', symbol: '₩', flag: '🇰🇷' },
    { code: 'SGD', name: 'Dollar de Singapour', symbol: 'S$', flag: '🇸🇬' },
    { code: 'NZD', name: 'Dollar néo-zélandais', symbol: 'NZ$', flag: '🇳🇿' },
    { code: 'MXN', name: 'Peso mexicain', symbol: 'Mex$', flag: '🇲🇽' },
    { code: 'HKD', name: 'Dollar de Hong Kong', symbol: 'HK$', flag: '🇭🇰' },
    { code: 'TRY', name: 'Livre turque', symbol: '₺', flag: '🇹🇷' },
    { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R', flag: '🇿🇦' },
    { code: 'SEK', name: 'Couronne suédoise', symbol: 'kr', flag: '🇸🇪' },
    { code: 'NOK', name: 'Couronne norvégienne', symbol: 'kr', flag: '🇳🇴' }
];

// URL de l'API pour les taux de change (utiliser votre propre clé API si nécessaire)
const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/EUR';
const HISTORICAL_API_BASE = 'https://open.er-api.com/v6/historical/';

/**
 * Initialise le convertisseur de devises
 */
function initCurrencyConverter() {
    // Vérifier si les éléments existent
    const container = document.getElementById('currencyTool');
    
    if (!container) {
        console.log('Le convertisseur de devises n\'est pas présent dans la page actuelle');
        return;
    }
    
    // Charger les taux sauvegardés
    loadSavedRates();
    
    // Charger l'historique des conversions
    loadConversionHistory();
    
    // Initialiser les sélecteurs de devises
    initCurrencySelects();
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
    
    // Vérifier si une mise à jour est nécessaire
    checkAndUpdateRates();
    
    // Charger les conversions populaires
    loadPopularConversions();
    
    // Initialiser le graphique
    initCurrencyChart();
    
    // Effectuer une conversion initiale
    convertCurrency();
    
    // Vérifier la connectivité et afficher le mode hors ligne si nécessaire
    checkOfflineStatus();
    
    console.log('Convertisseur de devises initialisé');
}

/**
 * Initialise les sélecteurs de devises
 */
function initCurrencySelects() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    if (!fromSelect || !toSelect) {
        return;
    }
    
    // Vider les sélecteurs
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Remplir les sélecteurs avec les devises disponibles
    Object.keys(exchangeRates).forEach(currency => {
        const fromOption = document.createElement('option');
        fromOption.value = currency;
        fromOption.textContent = `${currency} (${currencySymbols[currency]})`;
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = currency;
        toOption.textContent = `${currency} (${currencySymbols[currency]})`;
        toSelect.appendChild(toOption);
    });
    
    // Définir les valeurs par défaut
    fromSelect.value = state.fromCurrency;
    toSelect.value = state.toCurrency;
}

/**
 * Configurer les écouteurs d'événements
 */
function setupEventListeners() {
    // Éléments
    const amountInput = document.getElementById('fromAmount');
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const swapButton = document.getElementById('swapCurrencies');
    const refreshButton = document.getElementById('refreshRates');
    const chartPeriodButtons = document.querySelectorAll('.chart-period button');
    const helpButton = document.getElementById('currencyHelp');
    const closeHelpButton = document.getElementById('closeCurrencyHelp');
    const fullscreenButton = document.getElementById('currencyFullscreen');
    
    if (amountInput) amountInput.addEventListener('input', convertCurrency);
    if (fromSelect) fromSelect.addEventListener('change', handleCurrencyChange);
    if (toSelect) toSelect.addEventListener('change', handleCurrencyChange);
    if (swapButton) swapButton.addEventListener('click', swapCurrencies);
    if (refreshButton) refreshButton.addEventListener('click', forceUpdateRates);
    
    // Écouteurs pour les périodes du graphique
    if (chartPeriodButtons) {
        chartPeriodButtons.forEach(button => {
            button.addEventListener('click', () => {
                const period = parseInt(button.dataset.period);
                if (!isNaN(period)) {
                    updateChartPeriod(period);
                }
            });
        });
    }
    
    // Écouteurs pour l'aide
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            document.getElementById('currencyHelpPanel').classList.toggle('visible');
        });
    }
    
    if (closeHelpButton) {
        closeHelpButton.addEventListener('click', () => {
            document.getElementById('currencyHelpPanel').classList.remove('visible');
        });
    }
    
    // Écouteur pour le mode plein écran
    if (fullscreenButton && container) {
        fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        });
        function updateCurrencyFullscreenIcon() {
            const icon = fullscreenButton.querySelector('i');
            if (document.fullscreenElement === container) {
                icon.classList.remove('fa-expand');
                icon.classList.add('fa-compress');
            } else {
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
            }
        }
        document.addEventListener('fullscreenchange', updateCurrencyFullscreenIcon);
        document.addEventListener('webkitfullscreenchange', updateCurrencyFullscreenIcon);
        document.addEventListener('mozfullscreenchange', updateCurrencyFullscreenIcon);
        document.addEventListener('MSFullscreenChange', updateCurrencyFullscreenIcon);
    }
    
    // Écouteur pour détecter les changements de connectivité
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
}

/**
 * Gère les changements de devise pour mettre à jour le graphique
 */
function handleCurrencyChange() {
    convertCurrency();
    
    // Mettre à jour le graphique avec les nouvelles devises
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    if (fromCurrency && toCurrency) {
        fetchHistoricalData(fromCurrency, toCurrency);
    }
}

/**
 * Vérifie si les taux de change doivent être mis à jour
 */
function checkAndUpdateRates() {
    // Si pas de taux ou pas de date de dernière mise à jour, mettre à jour
    if (!state.rates || !state.lastUpdate) {
        updateRates();
        return;
    }
    
    // Mettre à jour si la dernière mise à jour date de plus de 24 heures
    const now = new Date();
    const lastUpdate = new Date(state.lastUpdate);
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
        updateRates();
    } else {
        // Afficher la date de dernière mise à jour
        document.getElementById('lastUpdate').textContent = `${formatDate(lastUpdate)}`;
    }
}

/**
 * Force une mise à jour des taux de change
 */
function forceUpdateRates() {
    updateRates(true);
}

/**
 * Met à jour les taux de change depuis une API
 * @param {boolean} force - Force la mise à jour même si ce n'est pas nécessaire
 */
function updateRates(force = false) {
    if (!navigator.onLine) {
        showNotification('Vous êtes hors ligne. Impossible de mettre à jour les taux.', 'warning');
        return;
    }
    
    // Afficher un message de chargement
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.innerHTML = '<span class="loading-indicator">Mise à jour en cours...</span>';
    }
    
    // Requête à l'API de taux de change
    fetch(EXCHANGE_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau lors de la récupération des taux de change');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.rates) {
                // Mettre à jour l'état avec les nouveaux taux
                state.rates = data.rates;
                state.lastUpdate = new Date().toISOString();
                
                // Sauvegarder les taux
                saveRates();
                
                // Afficher la date de mise à jour
                if (lastUpdateElement) {
                    lastUpdateElement.textContent = formatDate(new Date());
                }
                
                // Mettre à jour la conversion
                convertCurrency();
                
                // Rafraîchir les conversions populaires
                loadPopularConversions();
                
                // Notification de succès
                showNotification('Taux de change mis à jour avec succès', 'success');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour des taux de change:', error);
            showNotification('Impossible de mettre à jour les taux de change', 'error');
            
            // Rétablir l'affichage normal si erreur
            if (lastUpdateElement && state.lastUpdate) {
                lastUpdateElement.textContent = formatDate(new Date(state.lastUpdate));
            }
        });
}

/**
 * Convertit la devise
 */
function convertCurrency() {
    const amountInput = document.getElementById('fromAmount');
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const toAmount = document.getElementById('toAmount');
    const conversionRate = document.getElementById('conversionRate');
    const inverseRate = document.getElementById('inverseRate');
    
    if (!amountInput || !fromSelect || !toSelect || !toAmount) {
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const fromCurrency = fromSelect.value;
    const toCurrency = toSelect.value;
    
    if (isNaN(amount) || !fromCurrency || !toCurrency) {
        return;
    }
    
    // Mettre à jour l'état
    state.amount = amount;
    state.fromCurrency = fromCurrency;
    state.toCurrency = toCurrency;
    
    // Calculer le résultat
    const result = calculateConversion(amount, fromCurrency, toCurrency);
    state.result = result;
    
    // Afficher le résultat
    if (toAmount) {
        toAmount.value = result.toFixed(2);
    }
    
    // Mettre à jour l'affichage des taux
    if (conversionRate) {
        const rate = calculateConversion(1, fromCurrency, toCurrency);
        conversionRate.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
    }
    
    if (inverseRate) {
        const rate = calculateConversion(1, toCurrency, fromCurrency);
        inverseRate.textContent = `1 ${toCurrency} = ${rate.toFixed(4)} ${fromCurrency}`;
    }
    
    // Ajouter à l'historique
    addToConversionHistory({
        fromAmount: amount,
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        toAmount: result,
        timestamp: new Date().toISOString()
    });
}

/**
 * Calcule la conversion entre deux devises
 * @param {number} amount - Montant à convertir
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @returns {number} - Montant converti
 */
function calculateConversion(amount, fromCurrency, toCurrency) {
    if (!state.rates) {
        console.warn('Taux de change non disponibles');
        return 0;
    }
    
    // Si c'est la même devise, renvoyer le même montant
    if (fromCurrency === toCurrency) {
        return amount;
    }
    
    // Taux de conversion pour la devise source (vers EUR)
    const fromRate = state.rates[fromCurrency] || 1;
    
    // Taux de conversion pour la devise cible (depuis EUR)
    const toRate = state.rates[toCurrency] || 1;
    
    // Convertir en devise de base (EUR) puis vers la devise cible
    return amount * (toRate / fromRate);
}

/**
 * Échange les devises source et cible
 */
function swapCurrencies() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    if (!fromSelect || !toSelect) {
        return;
    }
    
    // Échanger les valeurs
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    
    // Mettre à jour la conversion
    convertCurrency();
    
    // Mettre à jour le graphique avec les nouvelles devises
    fetchHistoricalData(fromSelect.value, toSelect.value);
    
    // Animation du bouton
    const swapButton = document.getElementById('swapCurrencies');
    if (swapButton) {
        swapButton.classList.add('active');
        setTimeout(() => {
            swapButton.classList.remove('active');
        }, 500);
    }
}

/**
 * Charge les conversions populaires
 */
function loadPopularConversions() {
    const popularDiv = document.getElementById('popularConversions');
    
    if (!popularDiv) {
        return;
    }
    
    // Vider la div
    popularDiv.innerHTML = '';
    
    // Récupérer les devises populaires
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY'];
    
    // Créer un conteneur flex pour l'affichage en grille
    const gridContainer = document.createElement('div');
    gridContainer.className = 'conversion-grid';
    
    // Pour chaque paire de devises populaires
    for (let i = 0; i < currencies.length; i++) {
        for (let j = i + 1; j < currencies.length; j++) {
            // Éviter les paires de même devise
            if (currencies[i] === currencies[j]) continue;
            
            // Limiter à 8 paires pour éviter de surcharger l'interface
            if (gridContainer.children.length >= 8) break;
            
            const fromCurrency = currencies[i];
            const toCurrency = currencies[j];
            
            // Calculer les taux
            const directRate = calculateConversion(1, fromCurrency, toCurrency);
            
            // Créer l'élément de conversion
            const conversionItem = document.createElement('div');
            conversionItem.className = 'conversion-item';
            
            // Ajouter les drapeaux et symboles
            const fromCurrencyInfo = MAIN_CURRENCIES.find(c => c.code === fromCurrency) || { flag: '', symbol: '' };
            const toCurrencyInfo = MAIN_CURRENCIES.find(c => c.code === toCurrency) || { flag: '', symbol: '' };
            
            conversionItem.innerHTML = `
                <div class="conversion-header">
                    <span class="currency-flag">${fromCurrencyInfo.flag}</span>
                    <span class="currency-code">${fromCurrency}</span>
                    <span class="conversion-arrow">→</span>
                    <span class="currency-flag">${toCurrencyInfo.flag}</span>
                    <span class="currency-code">${toCurrency}</span>
                </div>
                <div class="conversion-rate">${directRate.toFixed(4)}</div>
                <button class="use-conversion" data-from="${fromCurrency}" data-to="${toCurrency}">
                    <i class="fas fa-exchange-alt"></i>
                </button>
            `;
            
            // Ajouter un écouteur pour utiliser cette conversion
            const useButton = conversionItem.querySelector('.use-conversion');
            if (useButton) {
                useButton.addEventListener('click', function() {
                    const fromCurrency = this.dataset.from;
                    const toCurrency = this.dataset.to;
                    
                    // Mettre à jour les sélecteurs
                    document.getElementById('fromCurrency').value = fromCurrency;
                    document.getElementById('toCurrency').value = toCurrency;
                    
                    // Mettre à jour la conversion
                    convertCurrency();
                    
                    // Mettre à jour le graphique
                    fetchHistoricalData(fromCurrency, toCurrency);
                });
            }
            
            gridContainer.appendChild(conversionItem);
        }
    }
    
    popularDiv.appendChild(gridContainer);
}

/**
 * Met en majuscule la première lettre d'une chaîne
 * @param {string} str - La chaîne à modifier
 * @returns {string} - La chaîne modifiée
 */
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sauvegarde les taux de change dans le stockage local
 */
function saveRates() {
    try {
        localStorage.setItem('currencyRates', JSON.stringify(state.rates));
        localStorage.setItem('ratesLastUpdate', state.lastUpdate);
    } catch (e) {
        console.error('Erreur lors de l\'enregistrement des taux:', e);
    }
}

/**
 * Charge les taux de change depuis le stockage local
 */
function loadSavedRates() {
    try {
        const savedRates = localStorage.getItem('currencyRates');
        const lastUpdate = localStorage.getItem('ratesLastUpdate');
        
        if (savedRates && lastUpdate) {
            state.rates = JSON.parse(savedRates);
            state.lastUpdate = lastUpdate;
            
            // Afficher la date de dernière mise à jour
            const lastUpdateElement = document.getElementById('lastUpdate');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = formatDate(new Date(lastUpdate));
            }
        }
    } catch (e) {
        console.error('Erreur lors du chargement des taux sauvegardés:', e);
    }
}

/**
 * Affiche les taux de change dans l'interface
 */
function displayRates() {
    const ratesList = document.getElementById('ratesList');
    const lastUpdateElement = document.getElementById('lastUpdate');
    
    // Vérifier si les éléments existent
    if (!ratesList || !lastUpdateElement) {
        console.warn('Éléments HTML manquants pour l\'affichage des taux');
        return;
    }
    
    ratesList.innerHTML = '';
    
    // Afficher la date de dernière mise à jour
    if (state.lastUpdate) {
        const lastUpdateDate = new Date(state.lastUpdate);
        lastUpdateElement.textContent = `Dernière mise à jour : ${formatDate(lastUpdateDate)}`;
    }
    
    // Afficher les taux pour chaque devise
    MAIN_CURRENCIES.forEach(currency => {
        if (currency.code === state.baseCurrency) return;
        
        const rate = state.rates[currency.code];
        if (!rate) return;
        
        const rateItem = document.createElement('div');
        rateItem.className = 'rate-item';
        rateItem.innerHTML = `
            <span class="currency-flag">${currency.flag}</span>
            <span class="currency-code">${currency.code}</span>
            <span class="currency-rate">${rate.toFixed(4)}</span>
        `;
        ratesList.appendChild(rateItem);
    });
}

/**
 * Sélectionne un groupe de devises
 * @param {string} groupName - Le nom du groupe à sélectionner
 */
function selectCurrencyGroup(groupName) {
    const group = CURRENCY_GROUPS[groupName];
    if (!group) {
        console.warn(`Groupe de devises "${groupName}" non trouvé`);
        return;
    }
    
    // Mettre à jour les sélecteurs de devises
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    if (fromSelect && toSelect && group.length >= 2) {
        // Sélectionner la première devise du groupe comme devise source
        fromSelect.value = group[0];
        // Sélectionner la deuxième devise du groupe comme devise cible
        toSelect.value = group[1];
        // Déclencher la conversion
        convertCurrency();
    }
}

/**
 * Ajoute une conversion à l'historique
 * @param {Object} conversion - La conversion à ajouter
 */
function addToConversionHistory(conversion) {
    // Éviter les doublons ou les conversions trop similaires
    const isDuplicate = state.history.some(item => 
        Math.abs(item.fromAmount - conversion.fromAmount) < 0.01 && 
        item.fromCurrency === conversion.fromCurrency &&
        item.toCurrency === conversion.toCurrency
    );
    
    if (isDuplicate) return;
    
    // Ajouter au début de l'historique
    state.history.unshift(conversion);
    
    // Limiter la taille de l'historique
    if (state.history.length > 10) {
        state.history = state.history.slice(0, 10);
    }
    
    // Sauvegarder l'historique
    saveConversionHistory();
    
    // Mettre à jour l'affichage si l'élément existe
    const historyContainer = document.getElementById('currencyHistory');
    if (historyContainer) {
        updateConversionHistoryDisplay();
    }
}

/**
 * Met à jour l'affichage de l'historique des conversions
 */
function updateConversionHistoryDisplay() {
    const historyContainer = document.getElementById('currencyHistory');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    if (state.history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">Aucun historique</div>';
        return;
    }
    
    state.history.forEach(conversion => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = document.createElement('div');
        date.className = 'history-date';
        date.textContent = formatDate(new Date(conversion.timestamp));
        
        const content = document.createElement('div');
        content.className = 'history-content';
        content.innerHTML = `
            ${conversion.fromAmount.toFixed(2)} 
            <span class="currency-code">${conversion.fromCurrency}</span> = 
            ${conversion.toAmount.toFixed(2)} 
            <span class="currency-code">${conversion.toCurrency}</span>
        `;
        
        const useBtn = document.createElement('button');
        useBtn.className = 'use-btn';
        useBtn.innerHTML = '<i class="fas fa-redo"></i>';
        useBtn.title = 'Réutiliser';
        useBtn.onclick = () => {
            document.getElementById('fromAmount').value = conversion.fromAmount;
            document.getElementById('fromCurrency').value = conversion.fromCurrency;
            document.getElementById('toCurrency').value = conversion.toCurrency;
            convertCurrency();
        };
        
        item.appendChild(date);
        item.appendChild(content);
        item.appendChild(useBtn);
        
        historyContainer.appendChild(item);
    });
}

/**
 * Sauvegarde l'historique des conversions dans le stockage local
 */
function saveConversionHistory() {
    try {
        localStorage.setItem('currencyHistory', JSON.stringify(state.history));
    } catch (e) {
        console.error('Erreur lors de l\'enregistrement de l\'historique:', e);
    }
}

/**
 * Charge l'historique des conversions depuis le stockage local
 */
function loadConversionHistory() {
    try {
        const savedHistory = localStorage.getItem('currencyHistory');
        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
        }
    } catch (e) {
        console.error('Erreur lors du chargement de l\'historique:', e);
    }
}

/**
 * Efface l'historique des conversions
 */
function clearCurrencyHistory() {
    state.history = [];
    saveConversionHistory();
    updateConversionHistoryDisplay();
    showNotification('Historique des conversions effacé', 'info');
}

/**
 * Formate une date
 * @param {Date} date - La date à formater
 * @returns {string} - La date formatée
 */
function formatDate(date) {
    if (!date) return 'N/A';
    
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Affiche une notification
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de notification (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
    // Créer l'élément de notification s'il n'existe pas déjà
    let notificationContainer = document.getElementById('currencyNotifications');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'currencyNotifications';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Ajouter une icône selon le type
    let icon = '';
    switch (type) {
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
        case 'error': icon = '<i class="fas fa-times-circle"></i>'; break;
        default: icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Ajouter au conteneur
    notificationContainer.appendChild(notification);
    
    // Bouton de fermeture
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.classList.add('closing');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Auto-fermeture après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('closing');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

/**
 * Vérifie et gère le statut hors ligne
 */
function checkOfflineStatus() {
    const offlineMessage = document.getElementById('currencyOfflineMessage');
    const cachedTime = document.getElementById('cachedTime');
    
    if (!navigator.onLine) {
        handleOfflineStatus();
    } else {
        // Cacher le message hors ligne
        if (offlineMessage) {
            offlineMessage.classList.remove('visible');
        }
        state.isOffline = false;
    }
}

/**
 * Gère le passage en mode hors ligne
 */
function handleOfflineStatus() {
    const offlineMessage = document.getElementById('currencyOfflineMessage');
    const cachedTime = document.getElementById('cachedTime');
    
    state.isOffline = true;
    
    if (offlineMessage) {
        offlineMessage.classList.add('visible');
    }
    
    if (cachedTime && state.lastUpdate) {
        cachedTime.textContent = formatDate(new Date(state.lastUpdate));
    }
    
    showNotification('Vous êtes hors ligne. Utilisation des taux enregistrés.', 'warning');
}

/**
 * Gère le retour en ligne
 */
function handleOnlineStatus() {
    const offlineMessage = document.getElementById('currencyOfflineMessage');
    
    if (offlineMessage) {
        offlineMessage.classList.remove('visible');
    }
    
    state.isOffline = false;
    
    showNotification('Connexion rétablie', 'success');
    
    // Vérifier si une mise à jour des taux est nécessaire
    checkAndUpdateRates();
}

/**
 * Initialise le graphique des taux de change
 */
function initCurrencyChart() {
    const chartCanvas = document.getElementById('currencyChart');
    
    if (!chartCanvas) {
        return;
    }
    
    // Vérifier si Chart.js est disponible
    if (typeof Chart === 'undefined') {
        // Charger Chart.js dynamiquement s'il n'est pas déjà chargé
        loadChartJS().then(() => {
            createChart(chartCanvas);
            fetchHistoricalData(state.fromCurrency, state.toCurrency);
        }).catch(err => {
            console.error('Impossible de charger Chart.js:', err);
        });
    } else {
        createChart(chartCanvas);
        fetchHistoricalData(state.fromCurrency, state.toCurrency);
    }
}

/**
 * Charge dynamiquement Chart.js si nécessaire
 * @returns {Promise} - Promise résolue quand Chart.js est chargé
 */
function loadChartJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Impossible de charger Chart.js'));
        document.head.appendChild(script);
    });
}

/**
 * Crée le graphique initial
 * @param {HTMLCanvasElement} canvas - L'élément canvas pour le graphique
 */
function createChart(canvas) {
    // Détruire l'instance précédente si elle existe
    if (state.chartInstance) {
        state.chartInstance.destroy();
    }
    
    // Créer un nouveau graphique vide
    state.chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Taux de change',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 128, 240)',
                tension: 0.1,
                pointBackgroundColor: 'rgb(75, 128, 240)',
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const date = new Date(tooltipItems[0].label);
                            return date.toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            });
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    display: true,
                    beginAtZero: false
                }
            }
        }
    });
}

/**
 * Met à jour la période du graphique
 * @param {number} days - Nombre de jours d'historique à afficher
 */
function updateChartPeriod(days) {
    // Mettre à jour l'apparence des boutons
    document.querySelectorAll('.chart-period button').forEach(btn => {
        if (parseInt(btn.dataset.period) === days) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Obtenir les devises actuelles
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    // Charger les données historiques pour la période
    fetchHistoricalData(fromCurrency, toCurrency, days);
}

/**
 * Récupère les données historiques des taux de change
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @param {number} days - Nombre de jours d'historique (défaut: 30)
 */
function fetchHistoricalData(fromCurrency, toCurrency, days = 30) {
    if (!navigator.onLine) {
        showNotification('Vous êtes hors ligne. Impossible de charger les données historiques.', 'warning');
        return;
    }
    
    // Calculer les dates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Formater les dates pour l'API (YYYY-MM-DD)
    const formatAPIDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    // URL de l'API pour les données historiques
    const endDateStr = formatAPIDate(endDate);
    const startDateStr = formatAPIDate(startDate);
    
    // Pour cet exemple, on utilise une API simple ou simulation
    // En production, utiliser une vraie API avec authentification
    // Exemples: EXCHANGERATE-API, Alpha Vantage, Fixer.io
    
    // Simuler des données historiques pour la démo
    const simulateHistoricalData = () => {
        const data = {
            labels: [],
            rates: []
        };
        
        // Générer des données pour chaque jour
        let currentDate = new Date(startDate);
        const baseCurrencyRate = 1;
        
        while (currentDate <= endDate) {
            // Formater la date pour l'affichage
            const dateStr = formatAPIDate(currentDate);
            data.labels.push(dateStr);
            
            // Simuler une fluctuation aléatoire autour de la valeur actuelle
            const currentRate = calculateConversion(1, fromCurrency, toCurrency);
            const randomFactor = 0.98 + (Math.random() * 0.04); // Entre 0.98 et 1.02
            data.rates.push(currentRate * randomFactor);
            
            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return data;
    };
    
    // Simuler le chargement des données
    const simulatedData = simulateHistoricalData();
    
    // Mettre à jour le graphique
    updateChart(fromCurrency, toCurrency, simulatedData);
}

/**
 * Met à jour le graphique avec de nouvelles données
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @param {Object} data - Données historiques
 */
function updateChart(fromCurrency, toCurrency, data) {
    if (!state.chartInstance) {
        console.warn('Le graphique n\'est pas initialisé');
        return;
    }
    
    // Mettre à jour les labels et les données
    state.chartInstance.data.labels = data.labels;
    state.chartInstance.data.datasets[0].data = data.rates;
    
    // Mettre à jour le titre du dataset
    state.chartInstance.data.datasets[0].label = `${fromCurrency} vers ${toCurrency}`;
    
    // Rafraîchir le graphique
    state.chartInstance.update();
}

// Initialiser le convertisseur de devises seulement quand le DOM est complètement chargé
// et seulement si nous sommes sur la page du convertisseur de devises
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('currencyTool')) {
        initCurrencyConverter();
    }
});

// Exposer les fonctions globalement
window.updateRates = updateRates;
window.swapCurrencies = swapCurrencies;
window.convertCurrency = convertCurrency;
window.clearCurrencyHistory = clearCurrencyHistory;

// Ajouter un écouteur d'événement pour initialiser le convertisseur quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    initCurrencyConverter();
});

// Exporter les fonctions pour permettre l'utilisation comme module
export {
    initCurrencyConverter,
    convertCurrency,
    swapCurrencies,
    calculateConversion
}; 