/**
 * Module de traduction
 * Gère la traduction de texte entre différentes langues
 */

// État du traducteur
let state = {
    history: [],
    sourceText: '',
    translatedText: '',
    sourceLanguage: 'auto',
    targetLanguage: 'fr',
    isTranslating: false,
    translationTimeout: null
};

/**
 * Initialise le traducteur
 */
function initTranslator() {
    // Vérifier si les éléments du traducteur existent dans la page
    const sourceTextElement = document.getElementById('sourceText');
    const sourceLanguageElement = document.getElementById('sourceLanguage');
    const targetLanguageElement = document.getElementById('targetLanguage');
    
    if (!sourceTextElement || !sourceLanguageElement || !targetLanguageElement) {
        console.log('Éléments du traducteur non présents dans la page actuelle');
        return;
    }
    
    // Charger l'historique depuis le stockage local
    loadTranslationHistory();
    
    // Initialiser les écouteurs d'événements
    sourceTextElement.addEventListener('input', autoTranslate);
    sourceLanguageElement.addEventListener('change', autoTranslate);
    targetLanguageElement.addEventListener('change', autoTranslate);
    
    // Mettre à jour les compteurs de caractères
    updateCharCount();
    
    console.log('Traducteur initialisé');
}

/**
 * Traduit automatiquement le texte après un délai
 */
function autoTranslate() {
    // Mettre à jour les compteurs de caractères
    updateCharCount();
    
    // Récupérer le texte source
    const sourceText = document.getElementById('sourceText').value.trim();
    state.sourceText = sourceText;
    
    // Si le texte est vide, effacer la traduction
    if (!sourceText) {
        document.getElementById('translatedText').value = '';
        return;
    }
    
    // Annuler la traduction précédente si elle est en cours
    if (state.translationTimeout) {
        clearTimeout(state.translationTimeout);
    }
    
    // Attendre un peu avant de traduire pour éviter trop de requêtes
    state.translationTimeout = setTimeout(() => {
        translateText();
    }, 500);
}

/**
 * Traduit le texte
 */
function translateText() {
    // Récupérer les langues
    const sourceLanguage = document.getElementById('sourceLanguage').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    
    // Mettre à jour l'état
    state.sourceLanguage = sourceLanguage;
    state.targetLanguage = targetLanguage;
    
    // Si les langues sont identiques, copier simplement le texte
    if (sourceLanguage === targetLanguage && sourceLanguage !== 'auto') {
        document.getElementById('translatedText').value = state.sourceText;
        return;
    }
    
    // Indiquer que la traduction est en cours
    state.isTranslating = true;
    document.getElementById('translatedText').value = 'Traduction en cours...';
    
    // Simuler une traduction simple
    let translatedText = state.sourceText;

    // Ne traduire que si la langue cible n'est pas le français
    if (targetLanguage !== 'fr') {
        if (targetLanguage === 'en') {
            translatedText = `[EN] ${state.sourceText}`;
        } else if (targetLanguage === 'es') {
            translatedText = `[ES] ${state.sourceText}`;
        } else if (targetLanguage === 'de') {
            translatedText = `[DE] ${state.sourceText}`;
        } else {
            translatedText = `[${targetLanguage.toUpperCase()}] ${state.sourceText}`;
        }
    }

    state.translatedText = translatedText;
    state.isTranslating = false;

    document.getElementById('translatedText').value = translatedText;

    addToTranslationHistory({
        sourceText: state.sourceText,
        translatedText: translatedText,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        timestamp: new Date().getTime()
    });
}

/**
 * Met à jour les compteurs de caractères
 */
function updateCharCount() {
    const sourceText = document.getElementById('sourceText').value;
    const translatedText = document.getElementById('translatedText').value;
    
    document.getElementById('sourceCharCount').textContent = `${sourceText.length}/5000`;
    document.getElementById('translatedCharCount').textContent = `${translatedText.length}/5000`;
}

/**
 * Inverse les langues source et cible
 */
function swapLanguages() {
    // Récupérer les langues
    const sourceLanguage = document.getElementById('sourceLanguage').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    
    // Ne pas échanger si la langue source est 'auto'
    if (sourceLanguage === 'auto') {
        showNotification('Impossible d\'inverser les langues lorsque la détection automatique est activée', 'warning');
        return;
    }
    
    // Échanger les langues
    document.getElementById('sourceLanguage').value = targetLanguage;
    document.getElementById('targetLanguage').value = sourceLanguage;
    
    // Échanger les textes
    const sourceText = document.getElementById('sourceText').value;
    const translatedText = document.getElementById('translatedText').value;
    
    document.getElementById('sourceText').value = translatedText;
    document.getElementById('translatedText').value = sourceText;
    
    // Mettre à jour les compteurs
    updateCharCount();
    
    // Mettre à jour l'état
    state.sourceText = translatedText;
    state.translatedText = sourceText;
    state.sourceLanguage = targetLanguage;
    state.targetLanguage = sourceLanguage;
}

/**
 * Efface le texte source
 */
function clearSourceText() {
    document.getElementById('sourceText').value = '';
    document.getElementById('translatedText').value = '';
    updateCharCount();
    
    // Mettre à jour l'état
    state.sourceText = '';
    state.translatedText = '';
}

/**
 * Copie le texte source dans le presse-papiers
 */
function copySourceText() {
    const sourceText = document.getElementById('sourceText');
    sourceText.select();
    document.execCommand('copy');
    
    showNotification('Texte source copié dans le presse-papiers', 'success');
}

/**
 * Copie la traduction dans le presse-papiers
 */
function copyTranslation() {
    const translatedText = document.getElementById('translatedText');
    translatedText.select();
    document.execCommand('copy');
    
    showNotification('Traduction copiée dans le presse-papiers', 'success');
}

/**
 * Lit le texte source à voix haute
 */
function listenSourceText() {
    const sourceText = document.getElementById('sourceText').value;
    const sourceLanguage = document.getElementById('sourceLanguage').value === 'auto' ? 'fr' : document.getElementById('sourceLanguage').value;
    
    speakText(sourceText, sourceLanguage);
}

/**
 * Lit la traduction à voix haute
 */
function listenTranslation() {
    const translatedText = document.getElementById('translatedText').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    
    speakText(translatedText, targetLanguage);
}

/**
 * Lit un texte à voix haute
 * @param {string} text - Le texte à lire
 * @param {string} language - La langue du texte
 */
function speakText(text, language) {
    if (!text) {
        showNotification('Aucun texte à lire', 'warning');
        return;
    }
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        window.speechSynthesis.speak(utterance);
    } else {
        showNotification('La synthèse vocale n\'est pas prise en charge par votre navigateur', 'error');
    }
}

/**
 * Ajoute une traduction à l'historique
 * @param {Object} translation - La traduction à ajouter
 */
function addToTranslationHistory(translation) {
    // Éviter les doublons
    const isDuplicate = state.history.some(item => 
        item.sourceText === translation.sourceText && 
        item.targetLanguage === translation.targetLanguage
    );
    
    if (isDuplicate) return;
    
    // Ajouter au début de l'historique
    state.history.unshift(translation);
    
    // Limiter la taille de l'historique
    if (state.history.length > 10) {
        state.history = state.history.slice(0, 10);
    }
    
    // Sauvegarder l'historique
    saveTranslationHistory();
    
    // Mettre à jour l'affichage
    updateTranslationHistoryDisplay();
}

/**
 * Met à jour l'affichage de l'historique des traductions
 */
function updateTranslationHistoryDisplay() {
    const historyContainer = document.getElementById('translationHistory');
    historyContainer.innerHTML = '';
    
    if (state.history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">Aucun historique</div>';
        return;
    }
    
    state.history.forEach(translation => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const header = document.createElement('div');
        header.className = 'history-item-header';
        
        const languages = document.createElement('span');
        languages.className = 'history-item-languages';
        languages.textContent = `${getLanguageName(translation.sourceLanguage)} → ${getLanguageName(translation.targetLanguage)}`;
        header.appendChild(languages);
        
        const date = document.createElement('span');
        date.className = 'history-item-date';
        date.textContent = formatDate(translation.timestamp);
        header.appendChild(date);
        
        item.appendChild(header);
        
        const content = document.createElement('div');
        content.className = 'history-item-content';
        
        const sourceText = document.createElement('div');
        sourceText.className = 'history-item-source';
        sourceText.textContent = translation.sourceText;
        content.appendChild(sourceText);
        
        const translatedText = document.createElement('div');
        translatedText.className = 'history-item-translated';
        translatedText.textContent = translation.translatedText;
        content.appendChild(translatedText);
        
        item.appendChild(content);
        
        const actions = document.createElement('div');
        actions.className = 'history-item-actions';
        
        const useBtn = document.createElement('button');
        useBtn.innerHTML = '<i class="fas fa-redo"></i>';
        useBtn.title = 'Réutiliser';
        useBtn.onclick = () => {
            document.getElementById('sourceText').value = translation.sourceText;
            document.getElementById('sourceLanguage').value = translation.sourceLanguage;
            document.getElementById('targetLanguage').value = translation.targetLanguage;
            autoTranslate();
        };
        actions.appendChild(useBtn);
        
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copier la traduction';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(translation.translatedText);
            showNotification('Traduction copiée dans le presse-papiers', 'success');
        };
        actions.appendChild(copyBtn);
        
        item.appendChild(actions);
        
        historyContainer.appendChild(item);
    });
}

/**
 * Retourne le nom d'une langue à partir de son code
 * @param {string} code - Le code de la langue
 * @returns {string} - Le nom de la langue
 */
function getLanguageName(code) {
    const languages = {
        'auto': 'Détection auto',
        'fr': 'Français',
        'en': 'Anglais',
        'es': 'Espagnol',
        'de': 'Allemand',
        'it': 'Italien',
        'pt': 'Portugais',
        'ru': 'Russe',
        'ar': 'Arabe',
        'zh': 'Chinois',
        'ja': 'Japonais',
        'ko': 'Coréen'
    };
    
    return languages[code] || code;
}

/**
 * Formate une date
 * @param {number} timestamp - Le timestamp à formater
 * @returns {string} - La date formatée
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Efface l'historique des traductions
 */
function clearHistory() {
    state.history = [];
    saveTranslationHistory();
    updateTranslationHistoryDisplay();
    showNotification('Historique des traductions effacé', 'info');
}

/**
 * Sauvegarde l'historique des traductions dans le stockage local
 */
function saveTranslationHistory() {
    localStorage.setItem('translationHistory', JSON.stringify(state.history));
}

/**
 * Charge l'historique des traductions depuis le stockage local
 */
function loadTranslationHistory() {
    const savedHistory = localStorage.getItem('translationHistory');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
        updateTranslationHistoryDisplay();
    }
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

// Initialiser le traducteur seulement quand le DOM est chargé
// et seulement si nous sommes sur la page du traducteur
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('sourceText')) {
        initTranslator();
    }
});

// Exposer les fonctions globalement
window.autoTranslate = autoTranslate;
window.swapLanguages = swapLanguages;
window.clearSourceText = clearSourceText;
window.copySourceText = copySourceText;
window.copyTranslation = copyTranslation;
window.listenSourceText = listenSourceText;
window.listenTranslation = listenTranslation;
window.clearHistory = clearHistory;
