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
    translationTimeout: null,
    isOnline: true
};

/**
 * Classe gestionnaire du traducteur
 */
export class TranslatorManager {
    /**
     * Initialise le gestionnaire de traduction
     */
    static init() {
        console.log('Initialisation du TranslatorManager');
        initTranslator();
    }
}

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
    
    // S'assurer que les espaces fonctionnent correctement
    sourceTextElement.addEventListener('keydown', (e) => {
        // Empêcher la gestion par défaut des espaces qui pourrait interférer
        if (e.key === ' ' || e.keyCode === 32) {
            e.stopPropagation();
        }
    });
    
    // Mettre à jour les compteurs de caractères
    updateCharCount();
    
    // Vérifier le statut en ligne et mettre à jour l'indicateur
    updateConnectionStatus(navigator.onLine);
    
    // Écouter les changements de statut en ligne
    window.addEventListener('online', () => updateConnectionStatus(true));
    window.addEventListener('offline', () => updateConnectionStatus(false));
    
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
    
    // Vérifier si nous sommes en ligne
    if (!navigator.onLine) {
        useOfflineTranslation(sourceLanguage, targetLanguage);
        return;
    }
    
    // Si la langue source est 'auto', détectons d'abord la langue
    if (sourceLanguage === 'auto') {
        detectLanguage(state.sourceText)
            .then(detectedLang => {
                // Effectuer la traduction avec la langue détectée
                performTranslation(detectedLang, targetLanguage);
            })
            .catch(error => {
                console.error('Erreur lors de la détection de la langue:', error);
                // Utiliser 'en' comme langue source par défaut en cas d'échec
                performTranslation('en', targetLanguage);
            });
    } else {
        // Langue source spécifiée, traduire directement
        performTranslation(sourceLanguage, targetLanguage);
    }
}

/**
 * Détecte la langue d'un texte
 * @param {string} text - Le texte à analyser
 * @returns {Promise<string>} - La langue détectée
 */
function detectLanguage(text) {
    // Utiliser l'API de détection de langue de MyMemory
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|en`;
    
    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la détection de la langue');
            }
            return response.json();
        })
        .then(data => {
            if (data.responseData && data.responseData.detectedLanguage) {
                const detectedLang = data.responseData.detectedLanguage.language;
                const confidence = Math.round(data.responseData.detectedLanguage.confidence * 100);
                const langName = getLanguageName(detectedLang);
                
                // Afficher la langue détectée
                document.getElementById('detectedLanguage').textContent = 
                    `Langue détectée : ${langName} (${confidence}%)`;
                
                return detectedLang;
            }
            throw new Error('Langue non détectée');
        });
}

/**
 * Effectue la traduction avec les langues spécifiées
 * @param {string} sourceLang - La langue source
 * @param {string} targetLang - La langue cible
 */
function performTranslation(sourceLang, targetLang) {
    // Utiliser l'API MyMemory pour la traduction
    const langPair = `${sourceLang}|${targetLang}`;
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(state.sourceText)}&langpair=${langPair}`;
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de réponse du service de traduction');
            }
            return response.json();
        })
        .then(data => {
            if (data.responseStatus === 200) {
                // Mettre à jour le statut en ligne
                updateConnectionStatus(true);
                
                // Récupérer la traduction depuis la réponse
                const translatedText = data.responseData.translatedText || '';
                
                // Mettre à jour l'état
                state.translatedText = translatedText;
                state.isTranslating = false;
                
                // Afficher la traduction
                document.getElementById('translatedText').value = translatedText;
                
                // Mettre à jour le compteur de caractères
                updateCharCount();
                
                // Ajouter à l'historique
                addToTranslationHistory({
                    sourceText: state.sourceText,
                    translatedText: translatedText,
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang,
                    timestamp: new Date().getTime()
                });
            } else {
                throw new Error('La traduction a échoué');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la traduction:', error);
            
            // Passer en mode hors ligne
            updateConnectionStatus(false);
            useOfflineTranslation(sourceLang, targetLang);
        });
}

/**
 * Utilise la traduction hors ligne
 * @param {string} sourceLanguage - La langue source
 * @param {string} targetLanguage - La langue cible
 */
function useOfflineTranslation(sourceLanguage, targetLanguage) {
    // Traduction simple (mode hors ligne)
    let fallbackTranslation = state.sourceText;
    
    // Ne traduire que si la langue cible n'est pas le français
    if (targetLanguage !== 'fr') {
        if (targetLanguage === 'en') {
            fallbackTranslation = `[EN] ${state.sourceText}`;
        } else if (targetLanguage === 'es') {
            fallbackTranslation = `[ES] ${state.sourceText}`;
        } else if (targetLanguage === 'de') {
            fallbackTranslation = `[DE] ${state.sourceText}`;
        } else {
            fallbackTranslation = `[${targetLanguage.toUpperCase()}] ${state.sourceText}`;
        }
    }
    
    state.translatedText = fallbackTranslation;
    state.isTranslating = false;
    
    document.getElementById('translatedText').value = fallbackTranslation;
    document.getElementById('detectedLanguage').textContent = '';
    showNotification('Mode hors ligne activé', 'warning');
    
    // Mettre à jour le compteur de caractères
    updateCharCount();
    
    // Ajouter à l'historique
    addToTranslationHistory({
        sourceText: state.sourceText,
        translatedText: fallbackTranslation,
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
 * Lit un texte à voix haute avec une meilleure qualité
 * @param {string} text - Le texte à lire
 * @param {string} language - La langue du texte
 */
function speakText(text, language) {
    if (!text) {
        showNotification('Aucun texte à lire', 'warning');
        return;
    }
    
    if ('speechSynthesis' in window) {
        // Arrêter toute synthèse vocale en cours
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Définir la langue
        utterance.lang = language;
        
        // Améliorer la qualité de la diction
        utterance.rate = 0.9;  // Légèrement plus lent pour plus de clarté
        utterance.pitch = 1.0; // Hauteur normale
        utterance.volume = 1.0; // Volume maximum
        
        // Obtenir les voix disponibles
        let voices = window.speechSynthesis.getVoices();
        
        // Si les voix ne sont pas encore chargées, attendre leur chargement
        if (voices.length === 0) {
            window.speechSynthesis.addEventListener('voiceschanged', function() {
                voices = window.speechSynthesis.getVoices();
                setVoice();
            });
        } else {
            setVoice();
        }
        
        function setVoice() {
            // Rechercher une voix de qualité pour la langue spécifiée
            const langPrefix = language.substring(0, 2).toLowerCase();
            
            // Essayer de trouver une voix premium ou de haute qualité
            let bestVoice = voices.find(voice => 
                voice.lang.toLowerCase().startsWith(langPrefix) && 
                (voice.name.includes('Premium') || voice.name.includes('Enhanced'))
            );
            
            // Si aucune voix premium n'est trouvée, prendre une voix standard
            if (!bestVoice) {
                bestVoice = voices.find(voice => 
                    voice.lang.toLowerCase().startsWith(langPrefix)
                );
            }
            
            // Si une voix correspondante est trouvée, l'utiliser
            if (bestVoice) {
                utterance.voice = bestVoice;
            }
            
            // Lancer la synthèse vocale
            window.speechSynthesis.speak(utterance);
        }
        
        // Notifier en cas de fin, d'erreur ou de pause
        utterance.onend = () => console.log('Lecture terminée');
        utterance.onerror = (event) => console.error('Erreur de synthèse vocale:', event);
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
        'pt': 'Portugais'
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

/**
 * Vérifie si le traducteur est en ligne
 */
function checkOnlineStatus() {
    return navigator.onLine && state.isOnline;
}

/**
 * Met à jour l'indicateur de statut de connexion
 * @param {boolean} isOnline - Si le traducteur est en ligne
 */
function updateConnectionStatus(isOnline) {
    const connectionStatus = document.getElementById('connectionStatus');
    if (!connectionStatus) return;
    
    state.isOnline = isOnline;
    
    if (isOnline) {
        connectionStatus.innerHTML = '<i class="fas fa-wifi"></i> En ligne';
        connectionStatus.classList.remove('offline');
    } else {
        connectionStatus.innerHTML = '<i class="fas fa-wifi-slash"></i> Hors ligne';
        connectionStatus.classList.add('offline');
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
