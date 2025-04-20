/**
 * Module de conversion de devises
 * Gère la conversion entre différentes devises avec des taux de change
 */

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
    currentRegion: 'popular'
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
    
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const amountInput = document.getElementById('amount');
    const resultDisplay = document.getElementById('result');
    
    if (!fromSelect || !toSelect || !amountInput || !resultDisplay) {
        console.log('Éléments du convertisseur de devises manquants dans la page');
        return;
    }
    
    // Initialiser les sélecteurs de devises
    initCurrencySelects();
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
    
    // Charger les conversions populaires
    loadPopularConversions();
    
    // Effectuer une conversion initiale
    convertCurrency();
    
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
    const amountInput = document.getElementById('amount');
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const swapButton = document.getElementById('swapCurrencies');
    const tabs = document.querySelectorAll('.tab');
    
    if (!amountInput || !fromSelect || !toSelect || !swapButton || tabs.length === 0) {
        return;
    }
    
    // Écouteurs pour les entrées
    amountInput.addEventListener('input', convertCurrency);
    fromSelect.addEventListener('change', convertCurrency);
    toSelect.addEventListener('change', convertCurrency);
    
    // Écouteur pour le bouton d'échange
    swapButton.addEventListener('click', swapCurrencies);
    
    // Écouteurs pour les onglets de région
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Mettre à jour l'onglet actif
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Changer la région sélectionnée
            state.currentRegion = tab.dataset.region;
            
            // Charger les conversions pour cette région
            loadRegionConversions(state.currentRegion);
        });
    });
}

/**
 * Convertit la devise
 */
function convertCurrency() {
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
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
    updateResultDisplay(result);
}

/**
 * Calcule la conversion entre deux devises
 * @param {number} amount - Montant à convertir
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @returns {number} - Montant converti
 */
function calculateConversion(amount, fromCurrency, toCurrency) {
    // Convertir en EUR d'abord (la devise de base)
    const amountInEUR = fromCurrency === 'EUR' ? amount : amount / exchangeRates[fromCurrency];
    
    // Puis convertir de EUR vers la devise cible
    return toCurrency === 'EUR' ? amountInEUR : amountInEUR * exchangeRates[toCurrency];
}

/**
 * Mettre à jour l'affichage du résultat
 * @param {number} result - Résultat de la conversion
 */
function updateResultDisplay(result) {
    const resultInput = document.getElementById('result');
    const resultText = document.getElementById('conversionResult');
    
    if (!resultInput || !resultText) {
        return;
    }
    
    const formatted = result.toFixed(2);
    resultInput.value = formatted;
    
    resultText.textContent = `${state.amount} ${state.fromCurrency} = ${formatted} ${state.toCurrency}`;
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
}

/**
 * Charge les conversions populaires
 */
function loadPopularConversions() {
    loadRegionConversions('popular');
}

/**
 * Charge les conversions pour une région donnée
 * @param {string} region - Région à charger
 */
function loadRegionConversions(region) {
    const popularDiv = document.getElementById('popularConversions');
    
    if (!popularDiv) {
        return;
    }
    
    // Vider la div
    popularDiv.innerHTML = '';
    
    // Récupérer les devises de la région
    const currencies = currencyRegions[region] || currencyRegions.popular;
    
    // Pour chaque devise, afficher la conversion par rapport à l'euro
    currencies.forEach(currency => {
        if (currency === 'EUR') return; // Éviter EUR vers EUR
        
        const conversionItem = document.createElement('div');
        conversionItem.className = 'conversion-item';
        
        const rate = calculateConversion(1, 'EUR', currency).toFixed(2);
        
        conversionItem.innerHTML = `
            <div class="from">1 EUR = ${rate} ${currency}</div>
            <div class="to">1 ${currency} = ${calculateConversion(1, currency, 'EUR').toFixed(2)} EUR</div>
        `;
        
        popularDiv.appendChild(conversionItem);
    });
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
 * Vérifie si les taux de change doivent être mis à jour
 * @returns {boolean} - True si les taux doivent être mis à jour
 */
function shouldUpdateRates() {
    // Si pas de taux ou pas de date de dernière mise à jour, mettre à jour
    if (!state.rates || !state.lastUpdate) {
        return true;
    }
    
    // Mettre à jour si la dernière mise à jour date de plus de 24 heures
    const now = new Date();
    const lastUpdate = new Date(state.lastUpdate);
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
    
    return hoursDiff > 24;
}

/**
 * Met à jour les taux de change depuis une API
 */
function updateRates() {
    // Afficher un message de chargement
    document.getElementById('lastUpdate').textContent = 'Mise à jour en cours...';
    
    // Simuler une requête API (à remplacer par une vraie API)
    setTimeout(() => {
        // Taux de change simulés (à remplacer par des taux réels)
        const mockRates = {
            EUR: 1,
            USD: 1.09,
            GBP: 0.85,
            JPY: 160.23,
            CAD: 1.47,
            AUD: 1.63,
            CHF: 0.97,
            CNY: 7.86,
            INR: 90.82,
            BRL: 5.42
        };
        
        // Mettre à jour l'état
        state.rates = mockRates;
        state.lastUpdate = new Date().toISOString();
        
        // Sauvegarder les taux
        saveRates();
        
        // Afficher les taux et convertir
        displayRates();
        convertCurrency();
        
        // Afficher une notification
        showNotification('Taux de change mis à jour', 'success');
    }, 1000);
}

/**
 * Sauvegarde les taux de change dans le stockage local
 */
function saveRates() {
    localStorage.setItem('currencyRates', JSON.stringify(state.rates));
    localStorage.setItem('ratesLastUpdate', state.lastUpdate);
}

/**
 * Charge les taux de change depuis le stockage local
 */
function loadSavedRates() {
    const savedRates = localStorage.getItem('currencyRates');
    const lastUpdate = localStorage.getItem('ratesLastUpdate');
    
    if (savedRates && lastUpdate) {
        state.rates = JSON.parse(savedRates);
        state.lastUpdate = lastUpdate;
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
    // Éviter les doublons
    const isDuplicate = state.history.some(item => 
        item.fromAmount === conversion.fromAmount && 
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
    
    // Mettre à jour l'affichage
    updateConversionHistoryDisplay();
}

/**
 * Met à jour l'affichage de l'historique des conversions
 */
function updateConversionHistoryDisplay() {
    const historyContainer = document.getElementById('currencyHistory');
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
        content.textContent = `${conversion.fromAmount} ${conversion.fromCurrency} = ${conversion.toAmount.toFixed(2)} ${conversion.toCurrency}`;
        
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
    localStorage.setItem('currencyHistory', JSON.stringify(state.history));
}

/**
 * Charge l'historique des conversions depuis le stockage local
 */
function loadConversionHistory() {
    const savedHistory = localStorage.getItem('currencyHistory');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
        updateConversionHistoryDisplay();
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
    // Vérifier si la fonction est disponible globalement
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`Notification (${type}): ${message}`);
    }
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