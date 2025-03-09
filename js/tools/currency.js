/**
 * Module de conversion de devises
 * Gère la conversion entre différentes devises avec des taux de change
 */

// État du convertisseur
let state = {
    rates: {},
    baseCurrency: 'EUR',
    lastUpdate: null,
    history: []
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

// Groupes de devises pour un accès rapide
const CURRENCY_GROUPS = {
    'popular': ['EUR', 'USD', 'GBP', 'JPY', 'CHF'],
    'asia': ['JPY', 'CNY', 'HKD', 'SGD', 'KRW', 'INR'],
    'america': ['USD', 'CAD', 'BRL', 'MXN'],
    'europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'TRY'],
    'oceania': ['AUD', 'NZD']
};

/**
 * Initialise le convertisseur de devises
 */
function initCurrencyConverter() {
    // Charger les taux de change sauvegardés
    loadSavedRates();
    
    // Charger l'historique des conversions
    loadConversionHistory();
    
    // Initialiser les listes déroulantes de devises
    initCurrencySelects();
    
    // Mettre à jour les taux si nécessaire
    if (shouldUpdateRates()) {
        updateRates();
    } else {
        displayRates();
    }
    
    // Initialiser les écouteurs d'événements
    document.getElementById('fromAmount').addEventListener('input', convertCurrency);
    document.getElementById('fromCurrency').addEventListener('change', convertCurrency);
    document.getElementById('toCurrency').addEventListener('change', convertCurrency);
    
    console.log('Convertisseur de devises initialisé');
}

/**
 * Initialise les listes déroulantes de devises
 */
function initCurrencySelects() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    // Vider les listes
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Créer les groupes
    Object.entries(CURRENCY_GROUPS).forEach(([groupName, currencies]) => {
        const fromGroup = document.createElement('optgroup');
        const toGroup = document.createElement('optgroup');
        fromGroup.label = toGroup.label = capitalizeFirstLetter(groupName);
        
        // Ajouter les devises du groupe
        currencies.forEach(code => {
            const currency = MAIN_CURRENCIES.find(c => c.code === code);
            if (currency) {
                const fromOption = createCurrencyOption(currency);
                const toOption = createCurrencyOption(currency);
                fromGroup.appendChild(fromOption);
                toGroup.appendChild(toOption);
            }
        });
        
        fromSelect.appendChild(fromGroup);
        toSelect.appendChild(toGroup);
    });
    
    // Ajouter les autres devises dans un groupe séparé
    const otherFromGroup = document.createElement('optgroup');
    const otherToGroup = document.createElement('optgroup');
    otherFromGroup.label = otherToGroup.label = 'Autres devises';
    
    MAIN_CURRENCIES.forEach(currency => {
        if (!Object.values(CURRENCY_GROUPS).flat().includes(currency.code)) {
            const fromOption = createCurrencyOption(currency);
            const toOption = createCurrencyOption(currency);
            otherFromGroup.appendChild(fromOption);
            otherToGroup.appendChild(toOption);
        }
    });
    
    fromSelect.appendChild(otherFromGroup);
    toSelect.appendChild(otherToGroup);
    
    // Définir les valeurs par défaut
    fromSelect.value = 'EUR';
    toSelect.value = 'USD';
}

/**
 * Crée une option pour une devise
 * @param {Object} currency - La devise
 * @returns {HTMLOptionElement} - L'élément option
 */
function createCurrencyOption(currency) {
    const option = document.createElement('option');
    option.value = currency.code;
    option.textContent = `${currency.flag} ${currency.code} (${currency.symbol}) - ${currency.name}`;
    return option;
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
    ratesList.innerHTML = '';
    
    // Afficher la date de dernière mise à jour
    if (state.lastUpdate) {
        const lastUpdateDate = new Date(state.lastUpdate);
        document.getElementById('lastUpdate').textContent = `Dernière mise à jour : ${formatDate(lastUpdateDate)}`;
    }
    
    // Afficher les taux pour chaque devise
    MAIN_CURRENCIES.forEach(currency => {
        if (currency.code === state.baseCurrency) return;
        
        const rate = state.rates[currency.code];
        if (!rate) return;
        
        const rateItem = document.createElement('div');
        rateItem.className = 'rate-item';
        
        const fromAmount = 1;
        const toAmount = rate;
        
        rateItem.innerHTML = `
            <div class="rate-from">${fromAmount} ${state.baseCurrency}</div>
            <div class="rate-equals">=</div>
            <div class="rate-to">${toAmount.toFixed(4)} ${currency.code}</div>
        `;
        
        ratesList.appendChild(rateItem);
    });
}

/**
 * Convertit un montant d'une devise à une autre
 */
function convertCurrency() {
    const fromAmount = parseFloat(document.getElementById('fromAmount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    // Vérifier si le montant est valide
    if (isNaN(fromAmount) || fromAmount <= 0) {
        document.getElementById('toAmount').value = '';
        return;
    }
    
    // Vérifier si les taux sont disponibles
    if (!state.rates || !state.rates[fromCurrency] || !state.rates[toCurrency]) {
        document.getElementById('toAmount').value = 'Taux non disponibles';
        return;
    }
    
    // Convertir le montant
    const rateFrom = state.rates[fromCurrency];
    const rateTo = state.rates[toCurrency];
    const toAmount = (fromAmount / rateFrom) * rateTo;
    
    // Afficher le résultat
    document.getElementById('toAmount').value = toAmount.toFixed(2);
    
    // Ajouter à l'historique
    addToConversionHistory({
        fromAmount,
        fromCurrency,
        toAmount,
        toCurrency,
        timestamp: new Date().getTime()
    });
}

/**
 * Inverse les devises source et cible
 */
function swapCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const fromAmount = document.getElementById('fromAmount').value;
    const toAmount = document.getElementById('toAmount').value;
    
    document.getElementById('fromCurrency').value = toCurrency;
    document.getElementById('toCurrency').value = fromCurrency;
    
    // Si un montant a été converti, inverser aussi les montants
    if (fromAmount && toAmount) {
        document.getElementById('fromAmount').value = toAmount;
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

// Initialiser le convertisseur au chargement du document
document.addEventListener('DOMContentLoaded', initCurrencyConverter);

// Exposer les fonctions globalement
window.updateRates = updateRates;
window.swapCurrencies = swapCurrencies;
window.convertCurrency = convertCurrency;
window.clearCurrencyHistory = clearCurrencyHistory; 