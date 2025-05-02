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

// Classe pour gérer le convertisseur de devises
export class CurrencyManager {
    /**
     * Initialise le convertisseur de devises
     */
    static init() {
        console.log('Initialisation du convertisseur de devises...');
        initCurrencyConverter();
    }

    /**
     * Méthode pour convertir une devise
     */
    static convert(amount, fromCurrency, toCurrency) {
        return calculateConversion(amount, fromCurrency, toCurrency);
    }

    /**
     * Méthode pour échanger les devises
     */
    static swap() {
        swapCurrencies();
    }

    /**
     * Méthode pour mettre à jour les taux
     */
    static updateRates() {
        forceUpdateRates();
    }

    /**
     * Méthode pour effacer l'historique
     */
    static clearHistory() {
        clearCurrencyHistory();
    }
}

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
    // Récupérer le conteneur
    const container = document.getElementById('currencyTool');
    
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
    
    // Le bouton de plein écran est maintenant géré par le module fullscreen.js global
    if (fullscreenButton && container) {
        console.log('Le plein écran est désormais géré par le module fullscreen.js global');
        // Cette fonctionnalité personnalisée a été supprimée car elle est maintenant 
        // gérée par le module global fullscreen.js qui détecte automatiquement 
        // les boutons avec la classe fullscreen-btn
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
        
        // Faire tourner le bouton visuellement
        swapButton.style.transform = 'rotate(180deg)';
        
        // Réinitialiser après l'animation
        setTimeout(() => {
            swapButton.classList.remove('active');
            swapButton.style.transform = '';
        }, 500);
    }
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
        console.log('Élément canvas pour le graphique non trouvé');
        return;
    }
    
    // Vérifier si Chart.js est disponible
    if (typeof Chart === 'undefined') {
        console.log('Chart.js non disponible, chargement dynamique...');
        // Charger Chart.js dynamiquement s'il n'est pas déjà chargé
        loadChartJS().then(() => {
            console.log('Chart.js chargé avec succès');
            setTimeout(() => {
                // Utiliser un délai pour s'assurer que Chart.js est complètement chargé
                createChart(chartCanvas);
                fetchHistoricalData(state.fromCurrency, state.toCurrency);
            }, 500);
        }).catch(err => {
            console.error('Impossible de charger Chart.js:', err);
            showNotification('Impossible de charger le graphique', 'error');
        });
    } else {
        console.log('Chart.js déjà disponible');
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
        // Vérifier si Chart.js est déjà en cours de chargement
        if (document.querySelector('script[src*="chart.js"]')) {
            // Attendre que Chart.js soit chargé
            const checkIfLoaded = setInterval(() => {
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkIfLoaded);
                    resolve();
                }
            }, 100);
            
            // Timeout après 10 secondes
            setTimeout(() => {
                clearInterval(checkIfLoaded);
                reject(new Error('Timeout lors du chargement de Chart.js'));
            }, 10000);
            
            return;
        }
        
        // Charger Chart.js
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            console.log('Script Chart.js chargé');
            // Attendre que l'objet Chart soit disponible
            const checkChart = setInterval(() => {
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkChart);
                    resolve();
                }
            }, 100);
            
            // Timeout après 5 secondes
            setTimeout(() => {
                clearInterval(checkChart);
                if (typeof Chart === 'undefined') {
                    reject(new Error('Chart.js chargé mais objet Chart non disponible'));
                } else {
                    resolve();
                }
            }, 5000);
        };
        script.onerror = () => reject(new Error('Impossible de charger Chart.js'));
        document.head.appendChild(script);
    });
}

/**
 * Crée le graphique initial
 * @param {HTMLCanvasElement} canvas - L'élément canvas pour le graphique
 */
function createChart(canvas) {
    try {
        // Vérifier si l'objet Chart est disponible
        if (typeof Chart === 'undefined') {
            console.error('Chart.js n\'est pas chargé');
            showNotification('Impossible de créer le graphique - Chart.js non disponible', 'error');
            return;
        }
        
        // Vérifier si le canvas est valide
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            console.error('Canvas invalide pour le graphique');
            return;
        }
        
        // Détruire l'instance précédente si elle existe
        if (state.chartInstance) {
            try {
                state.chartInstance.destroy();
                console.log('Instance précédente du graphique détruite');
            } catch (e) {
                console.warn('Erreur lors de la destruction de l\'instance précédente:', e);
            }
        }
        
        // Créer un nouveau graphique avec des couleurs adaptées au thème
        const isDarkMode = document.body.classList.contains('dark-mode');
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        
        // Définir des couleurs adaptées au thème
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--currency-primary').trim() || 'rgb(75, 128, 240)';
        
        console.log('Création du graphique avec la couleur:', primaryColor);
        
        // Créer un nouveau graphique vide
        state.chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Taux de change',
                    data: [],
                    fill: {
                        target: 'origin',
                        above: isDarkMode ? 
                            'rgba(75, 128, 240, 0.1)' : 
                            'rgba(75, 128, 240, 0.2)',
                    },
                    borderColor: primaryColor,
                    tension: 0.2,
                    pointBackgroundColor: primaryColor,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2
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
                        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: isDarkMode ? '#fff' : '#000',
                        bodyColor: isDarkMode ? '#eee' : '#333',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 6,
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
                            color: textColor,
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 10
                        },
                        grid: {
                            display: true,
                            color: gridColor
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: false,
                        ticks: {
                            color: textColor,
                            precision: 4
                        },
                        grid: {
                            display: true,
                            color: gridColor
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        console.log('Graphique créé avec succès');
        return state.chartInstance;
    } catch (error) {
        console.error('Erreur lors de la création du graphique:', error);
        showNotification('Erreur lors de la création du graphique', 'error');
        return null;
    }
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
    try {
        if (!fromCurrency || !toCurrency) {
            console.error('Devises non spécifiées pour les données historiques');
            return;
        }
        
        // Limiter le nombre de jours
        days = Math.min(Math.max(1, days), 365);
        
        console.log(`Récupération des données historiques pour ${fromCurrency} → ${toCurrency} sur ${days} jours`);
        
        if (!navigator.onLine) {
            console.warn('Hors ligne - Utilisation de données simulées');
            showNotification('Vous êtes hors ligne. Utilisation de données simulées.', 'warning');
            
            // Utiliser des données simulées
            const simulatedData = simulateHistoricalData(fromCurrency, toCurrency, days);
            updateChart(fromCurrency, toCurrency, simulatedData);
            return;
        }
        
        // En conditions normales, nous ferions un appel API ici
        // Mais pour cette démo, nous allons toujours utiliser des données simulées
        // qui sont plus prévisibles et ne nécessitent pas d'API key
        
        // Simuler un délai de chargement pour une expérience plus réaliste
        showNotification('Chargement des données historiques...', 'info');
        
        setTimeout(() => {
            try {
                const simulatedData = simulateHistoricalData(fromCurrency, toCurrency, days);
                updateChart(fromCurrency, toCurrency, simulatedData);
                console.log('Données historiques simulées chargées avec succès');
            } catch (error) {
                console.error('Erreur lors de la génération des données simulées:', error);
                showNotification('Erreur lors du chargement des données historiques', 'error');
            }
        }, 800); // Délai simulé de 800ms
    } catch (error) {
        console.error('Erreur lors de la récupération des données historiques:', error);
        showNotification('Erreur lors de la récupération des données historiques', 'error');
    }
}

/**
 * Simule des données historiques pour la démo
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @param {number} days - Nombre de jours
 * @returns {Object} - Données simulées
 */
function simulateHistoricalData(fromCurrency, toCurrency, days = 30) {
    try {
        console.log(`Simulation des données historiques : ${fromCurrency} → ${toCurrency} (${days} jours)`);
        
        // Calculer les dates
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Formater les dates pour l'affichage
        const formatAPIDate = (date) => {
            return date.toISOString().split('T')[0];
        };
        
        const data = {
            labels: [],
            rates: []
        };
        
        // Obtenir le taux actuel comme référence
        const currentRate = calculateConversion(1, fromCurrency, toCurrency);
        
        // Vérifier si on a déjà des données historiques pour cette paire
        const historyKey = `${fromCurrency}_${toCurrency}`;
        
        // Si nous avons déjà des données pour cette période, les retourner
        if (state.historicalData[historyKey] && 
            state.historicalData[historyKey].timestamp && 
            state.historicalData[historyKey].days === days) {
            
            // Vérifier si les données ne sont pas trop anciennes (max 1 heure)
            const lastUpdate = new Date(state.historicalData[historyKey].timestamp);
            const hoursDiff = (new Date() - lastUpdate) / (1000 * 60 * 60);
            
            if (hoursDiff < 1) {
                console.log(`Utilisation des données historiques en cache pour ${historyKey}`);
                return state.historicalData[historyKey].data;
            }
        }
        
        // Initialiser une nouvelle série
        console.log(`Génération de nouvelles données historiques pour ${historyKey}`);
        
        // Générer des caractéristiques aléatoires mais réalistes pour cette paire de devises
        const volatility = Math.random() * 0.03 + 0.01; // Entre 1% et 4% de volatilité
        const trendStrength = Math.random() * 0.1 - 0.05; // Tendance entre -5% et +5%
        const seasonality = Math.random() > 0.7; // 30% de chance d'avoir une saisonnalité
        const seasonalityPeriod = Math.floor(Math.random() * 5) + 3; // Période de 3 à 7 jours
        const seasonalityStrength = Math.random() * 0.01 + 0.005; // Force entre 0.5% et 1.5%
        const shocks = Math.random() > 0.8; // 20% de chance d'avoir des chocs
        
        // Paramètres pour les chocs
        const shockProbability = 0.05; // 5% de chance par jour d'avoir un choc
        const shockStrength = Math.random() * 0.04 + 0.01; // Entre 1% et 5%
        
        // Générer des données pour chaque jour
        let currentDate = new Date(startDate);
        let rate = currentRate * (1 - (trendStrength / 2)); // Commencer un peu en dessous de la tendance finale
        
        // Variables pour garder une cohérence dans les données
        let previousRate = rate;
        let momentum = 0;
        
        while (currentDate <= endDate) {
            // Formater la date pour l'affichage
            const dateStr = formatAPIDate(currentDate);
            data.labels.push(dateStr);
            
            // Partie tendancielle
            const dayProgress = (currentDate - startDate) / (endDate - startDate); // 0 à 1
            const trendComponent = currentRate * trendStrength * dayProgress;
            
            // Partie saisonnière (si applicable)
            let seasonalComponent = 0;
            if (seasonality) {
                const dayOfSeason = data.labels.length % seasonalityPeriod;
                seasonalComponent = Math.sin((dayOfSeason / seasonalityPeriod) * Math.PI * 2) * seasonalityStrength * currentRate;
            }
            
            // Momentum (autocorrélation - les marchés tendent à suivre leur direction récente)
            momentum = momentum * 0.7 + (Math.random() - 0.5) * volatility * currentRate * 0.3;
            
            // Composante aléatoire (bruit)
            const randomComponent = (Math.random() - 0.5) * volatility * currentRate;
            
            // Chocs (événements rares mais importants)
            let shockComponent = 0;
            if (shocks && Math.random() < shockProbability) {
                shockComponent = (Math.random() - 0.5) * shockStrength * 2 * currentRate;
                console.log(`Choc simulé le ${dateStr}: ${shockComponent.toFixed(4)}`);
            }
            
            // Combiner tous les composants
            rate = previousRate + trendComponent + seasonalComponent + momentum + randomComponent + shockComponent;
            
            // Limiter les mouvements extrêmes (réalisme de marché)
            const maxDailyChange = 0.03 * currentRate; // Max 3% de variation par jour
            if (Math.abs(rate - previousRate) > maxDailyChange) {
                const direction = rate > previousRate ? 1 : -1;
                rate = previousRate + (direction * maxDailyChange);
            }
            
            // S'assurer que le taux ne devient jamais négatif ou trop éloigné du taux actuel
            rate = Math.max(rate, currentRate * 0.7);
            rate = Math.min(rate, currentRate * 1.3);
            
            data.rates.push(rate);
            previousRate = rate;
            
            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Ajouter un peu de lissage pour plus de réalisme
        if (data.rates.length > 5) {
            for (let i = 2; i < data.rates.length - 2; i++) {
                // Moyenne mobile sur 5 jours (simple)
                const smoothed = (data.rates[i-2] + data.rates[i-1] + data.rates[i] + data.rates[i+1] + data.rates[i+2]) / 5;
                // Ne pas remplacer complètement pour garder certaines variations
                data.rates[i] = data.rates[i] * 0.7 + smoothed * 0.3;
            }
        }
        
        // Mettre en cache les données générées
        state.historicalData[historyKey] = {
            timestamp: new Date().toISOString(),
            days: days,
            data: data,
            params: {
                volatility,
                trendStrength, 
                seasonality,
                seasonalityPeriod
            }
        };
        
        console.log(`Données historiques générées et mises en cache pour ${historyKey}`);
        
        return data;
    } catch (error) {
        console.error('Erreur lors de la génération des données historiques:', error);
        
        // En cas d'erreur, retourner des données minimales mais valides
        return {
            labels: [formatAPIDate(new Date())],
            rates: [calculateConversion(1, fromCurrency, toCurrency)]
        };
    }
}

/**
 * Met à jour le graphique avec de nouvelles données
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @param {Object} data - Données historiques
 */
function updateChart(fromCurrency, toCurrency, data) {
    try {
        if (!state.chartInstance) {
            console.warn('Le graphique n\'est pas initialisé');
            // Tentative de réinitialisation du graphique
            const canvas = document.getElementById('currencyChart');
            if (canvas) {
                console.log('Tentative de réinitialisation du graphique...');
                createChart(canvas);
                if (!state.chartInstance) {
                    showNotification('Impossible de mettre à jour le graphique', 'warning');
                    return;
                }
            } else {
                console.error('Élément canvas non trouvé');
                return;
            }
        }
        
        if (!data || !data.labels || !data.rates || data.labels.length === 0) {
            console.error('Données invalides pour le graphique');
            return;
        }
        
        console.log(`Mise à jour du graphique pour ${fromCurrency} vers ${toCurrency} avec ${data.labels.length} points de données`);
        
        // Formater les dates pour un meilleur affichage
        const formattedLabels = data.labels.map(dateStr => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
            });
        });
        
        // Mettre à jour les labels et les données
        state.chartInstance.data.labels = formattedLabels;
        state.chartInstance.data.datasets[0].data = data.rates;
        
        // Personnaliser le titre du dataset basé sur les devises
        const fromInfo = MAIN_CURRENCIES.find(c => c.code === fromCurrency) || { code: fromCurrency, symbol: '' };
        const toInfo = MAIN_CURRENCIES.find(c => c.code === toCurrency) || { code: toCurrency, symbol: '' };
        
        state.chartInstance.data.datasets[0].label = 
            `${fromInfo.code} (${fromInfo.symbol || ''}) → ${toInfo.code} (${toInfo.symbol || ''})`;
        
        // Déterminer les valeurs min et max pour les échelles
        if (data.rates.length > 0) {
            const values = data.rates;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min;
            const buffer = range * 0.1; // 10% de marge
            
            // Ajuster l'échelle Y pour une meilleure visualisation
            if (state.chartInstance.options.scales.y) {
                state.chartInstance.options.scales.y.min = Math.max(0, min - buffer);
                state.chartInstance.options.scales.y.max = max + buffer;
                
                // Ajouter des informations sur la variation en pourcentage
                const firstRate = data.rates[0];
                const lastRate = data.rates[data.rates.length - 1];
                const percentChange = ((lastRate - firstRate) / firstRate) * 100;
                
                // Mise à jour du titre du graphique
                const chartTitle = document.querySelector('.currency-chart-title');
                if (chartTitle) {
                    const sign = percentChange >= 0 ? '+' : '';
                    const changeClass = percentChange >= 0 ? 'positive-change' : 'negative-change';
                    
                    chartTitle.innerHTML = `Historique du taux <span class="${changeClass}">(${sign}${percentChange.toFixed(2)}%)</span>`;
                }
                
                // Coloration du graphique selon la tendance
                const primaryColor = getComputedStyle(document.documentElement)
                    .getPropertyValue('--currency-primary').trim() || 'rgb(75, 128, 240)';
                const positiveColor = 'rgba(46, 204, 113, 1)';
                const negativeColor = 'rgba(231, 76, 60, 1)';
                
                const gradientColor = percentChange >= 0 ? positiveColor : negativeColor;
                state.chartInstance.data.datasets[0].borderColor = gradientColor;
                
                // Mise à jour du gradient de fond
                const ctx = state.chartInstance.ctx;
                const chartArea = state.chartInstance.chartArea;
                if (ctx && chartArea) {
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, percentChange >= 0 ? 
                        'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    state.chartInstance.data.datasets[0].fill = {
                        target: 'origin',
                        above: gradient
                    };
                    
                    state.chartInstance.data.datasets[0].pointBackgroundColor = gradientColor;
                }
            }
        }
        
        // Rafraîchir le graphique avec une animation
        state.chartInstance.update();
        console.log('Graphique mis à jour avec succès');
        
        // Ajouter des indicateurs de variations si on a des données de paramètres
        const historyKey = `${fromCurrency}_${toCurrency}`;
        if (state.historicalData[historyKey] && state.historicalData[historyKey].params) {
            const params = state.historicalData[historyKey].params;
            const volatilityText = params.volatility < 0.02 ? 'Faible volatilité' : 
                                  params.volatility < 0.03 ? 'Volatilité moyenne' : 
                                  'Forte volatilité';
            
            const trendText = params.trendStrength > 0.02 ? 'Tendance haussière' :
                             params.trendStrength < -0.02 ? 'Tendance baissière' :
                             'Pas de tendance marquée';
            
            // Ajouter des annotations sous le graphique
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer) {
                let chartInfo = chartContainer.nextElementSibling;
                if (!chartInfo || !chartInfo.classList.contains('chart-info')) {
                    chartInfo = document.createElement('div');
                    chartInfo.classList.add('chart-info');
                    chartContainer.after(chartInfo);
                }
                
                chartInfo.innerHTML = `
                    <div class="chart-stats">
                        <span class="chart-stat volatility">${volatilityText}</span>
                        <span class="chart-stat trend">${trendText}</span>
                        ${params.seasonality ? '<span class="chart-stat seasonality">Variations cycliques</span>' : ''}
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du graphique:', error);
        showNotification('Erreur lors de la mise à jour du graphique', 'error');
    }
}

// Initialiser le convertisseur de devises seulement quand le DOM est complètement chargé
// et seulement si nous sommes sur la page du convertisseur de devises
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('currencyTool')) {
        initCurrencyConverter();
    }
});

// Garder pour la rétrocompatibilité
window.updateRates = forceUpdateRates;
window.swapCurrencies = swapCurrencies;
window.convertCurrency = convertCurrency;
window.clearCurrencyHistory = clearCurrencyHistory;

// Exporter les fonctions pour permettre l'utilisation comme module
export {
    initCurrencyConverter,
    convertCurrency,
    swapCurrencies,
    calculateConversion
}; 