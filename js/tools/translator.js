import { CONFIG } from '../config.js';
import { Utils } from '../utils.js';

export const TranslatorManager = {
    /**
     * Initialise le gestionnaire de traduction
     */
    init() {
        this.setupListeners();
        this.loadHistory();
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        const sourceText = document.getElementById('sourceText');
        const sourceLanguage = document.getElementById('sourceLanguage');
        const targetLanguage = document.getElementById('targetLanguage');
        const swapButton = document.querySelector('.swap-btn');

        if (sourceText) {
            sourceText.addEventListener('input', () => this.handleSourceTextChange());
        }

        if (sourceLanguage) {
            sourceLanguage.addEventListener('change', () => this.handleLanguageChange());
        }

        if (targetLanguage) {
            targetLanguage.addEventListener('change', () => this.handleLanguageChange());
        }

        if (swapButton) {
            swapButton.addEventListener('click', () => this.swapLanguages());
        }
    },

    /**
     * Gère le changement de texte source
     */
    handleSourceTextChange() {
        const sourceText = document.getElementById('sourceText').value;
        const sourceCharCount = document.getElementById('sourceCharCount');
        
        // Mise à jour du compteur de caractères
        if (sourceCharCount) {
            sourceCharCount.textContent = `${sourceText.length}/5000`;
        }

        // Traduction automatique si activée
        if (CONFIG.AUTO_TRANSLATE) {
            this.translate();
        }
    },

    /**
     * Gère le changement de langue
     */
    handleLanguageChange() {
        this.translate();
    },

    /**
     * Échange les langues source et cible
     */
    swapLanguages() {
        const sourceLanguage = document.getElementById('sourceLanguage');
        const targetLanguage = document.getElementById('targetLanguage');
        const sourceText = document.getElementById('sourceText');
        const translatedText = document.getElementById('translatedText');

        if (sourceLanguage && targetLanguage && sourceText && translatedText) {
            const tempLang = sourceLanguage.value;
            sourceLanguage.value = targetLanguage.value;
            targetLanguage.value = tempLang;

            const tempText = sourceText.value;
            sourceText.value = translatedText.value;
            translatedText.value = tempText;
        }
    },

    /**
     * Traduit le texte
     */
    async translate() {
        const sourceText = document.getElementById('sourceText').value;
        const sourceLanguage = document.getElementById('sourceLanguage').value;
        const targetLanguage = document.getElementById('targetLanguage').value;
        const translatedText = document.getElementById('translatedText');

        if (!sourceText || !translatedText) return;

        try {
            // Simulation de traduction (à remplacer par une vraie API)
            const translated = await this.mockTranslate(sourceText, sourceLanguage, targetLanguage);
            
            translatedText.value = translated;
            this.updateHistory(sourceText, translated, sourceLanguage, targetLanguage);
        } catch (error) {
            console.error('Erreur de traduction :', error);
            Utils.showNotification('Erreur lors de la traduction', 'error');
        }
    },

    /**
     * Simule une traduction (à remplacer par une vraie API)
     */
    async mockTranslate(text, from, to) {
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        return `[Traduit de ${from} vers ${to}] ${text}`;
    },

    /**
     * Met à jour l'historique des traductions
     */
    updateHistory(sourceText, translatedText, sourceLang, targetLang) {
        const history = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.TRANSLATION_HISTORY) || [];
        const newEntry = {
            source: sourceText,
            translated: translatedText,
            sourceLang,
            targetLang,
            timestamp: new Date().toISOString()
        };

        history.unshift(newEntry);
        if (history.length > CONFIG.MAX_HISTORY_ITEMS) {
            history.pop();
        }

        Utils.saveToStorage(CONFIG.STORAGE_KEYS.TRANSLATION_HISTORY, history);
        this.displayHistory();
    },

    /**
     * Charge l'historique des traductions
     */
    loadHistory() {
        const history = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.TRANSLATION_HISTORY) || [];
        this.displayHistory(history);
    },

    /**
     * Affiche l'historique des traductions
     */
    displayHistory(history = []) {
        const historyContainer = document.getElementById('translationHistory');
        if (!historyContainer) return;

        historyContainer.innerHTML = history.map(entry => `
            <div class="history-item">
                <div class="history-content">
                    <div class="original-text">${entry.source}</div>
                    <div class="translated-text">${entry.translated}</div>
                    <div class="language-info">
                        ${entry.sourceLang} → ${entry.targetLang}
                    </div>
                </div>
                <div class="history-actions">
                    <button onclick="TranslatorManager.reuseTranslation('${entry.source}')" title="Réutiliser">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button onclick="TranslatorManager.deleteHistoryItem('${entry.timestamp}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Réutilise une traduction précédente
     */
    reuseTranslation(text) {
        const sourceText = document.getElementById('sourceText');
        if (sourceText) {
            sourceText.value = text;
            this.translate();
        }
    },

    /**
     * Supprime un élément de l'historique
     */
    deleteHistoryItem(timestamp) {
        const history = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.TRANSLATION_HISTORY) || [];
        const newHistory = history.filter(item => item.timestamp !== timestamp);
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.TRANSLATION_HISTORY, newHistory);
        this.displayHistory(newHistory);
    },

    /**
     * Efface tout l'historique
     */
    clearHistory() {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.TRANSLATION_HISTORY, []);
        this.displayHistory();
        Utils.showNotification('Historique effacé', 'success');
    }
}; 