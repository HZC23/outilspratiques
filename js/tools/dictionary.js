 let localStorageKey = 'dictionarySearchHistory'; // Définir la clé pour le stockage local
 let dictionaryState = {
    currentLanguage: 'fr',
    currentWord: '',
    currentResult: null,
    isLoading: false,
    searchHistory: JSON.parse(localStorage.getItem(localStorageKey)) || []
};

let historyStack = []; // Pour stocker l'historique des pages

function initDictionary() {
    const searchInput = document.getElementById('dictionaryInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') searchWord();
        });
    }

    const searchButton = document.getElementById('dictionarySearchBtn');
    if (searchButton) {
        searchButton.addEventListener('click', searchWord);
    }
    
    const languageSelector = document.getElementById('dictionaryLanguage');
    if (languageSelector) {
        languageSelector.addEventListener('change', e => {
            dictionaryState.currentLanguage = e.target.value;
        });
    }

    const clearHistoryButton = document.getElementById('clearDictionaryHistory');
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', () => {
            dictionaryState.searchHistory = [];
            localStorage.removeItem(DICTIONARY_CONFIG.localStorageKey);
            updateHistoryUI();
        });
    }

    initUI();
    updateHistoryUI();
}

function initUI() {
    hideError();
    hideResult();
    hideWelcome();
    updateHistoryUI();
}

function hideError() {
    const errorElement = document.getElementById('dictionaryError');
    if (errorElement) errorElement.classList.add('hidden');
}

function showError(message) {
    const errorElement = document.getElementById('dictionaryError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function hideResult() {
    const resultElement = document.getElementById('dictionaryResult');
    if (resultElement) resultElement.classList.add('hidden');
}

function hideWelcome() {
    const welcomeElement = document.getElementById('dictionaryWelcome');
    if (welcomeElement) welcomeElement.classList.add('hidden');
}

function setLoadingState(isLoading) {
    dictionaryState.isLoading = isLoading;
    const loader = document.getElementById('dictionaryLoader');
    if (loader) loader.style.display = isLoading ? 'block' : 'none';
}

function shakeInput() {
    const input = document.getElementById('dictionaryInput');
    if (!input) return;
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
}

function getLocalDefinition(lang, word) {
    return DICTIONARY_CONFIG.localDictionary?.[lang]?.[word.toLowerCase()] || null;
}

function checkLocalDictionary(word, lang) {
    const entry = getLocalDefinition(lang, word);
    if (!entry) return null;
    if (typeof entry === 'object' && entry.meanings) {
        return entry;
    }
    return {
        meanings: [
            {
                partOfSpeech: '',
                definitions: [
                    { definition: typeof entry === 'string' ? entry : '', example: '' }
                ]
            }
        ]
    };
}

function updateHistoryUI() {
    const historyElement = document.getElementById('dictionaryHistoryList');
    if (!historyElement) return;
    historyElement.innerHTML = '';
    dictionaryState.searchHistory.slice().reverse().forEach(entry => {
        const li = document.createElement('li');
        li.className = 'dictionary-history-item';
        li.textContent = `${entry.word} (${entry.language})`;
        li.addEventListener('click', () => {
            const input = document.getElementById('dictionaryInput');
            const language = document.getElementById('dictionaryLanguage');
            if (input) input.value = entry.word;
            if (language) language.value = entry.language;
            searchWord();
        });
        historyElement.appendChild(li);
    });
}

function displayResult(result) {
    const container = document.getElementById('dictionaryResult');
    if (!container) return;

    container.innerHTML = `<h3 id="dictionaryWord" class="dictionary-word">${result.word}</h3>`;
    
    // Remplacer les URLs d'images HTTP par HTTPS
    const contentWithHttps = result.content.replace(/http:\/\/(upload\.wikimedia\.org)/g, 'https://$1');
    
    container.innerHTML += `<div class="dictionary-content">${contentWithHttps}</div>`;
    
    // Ajouter un bouton retour
    const backButton = document.createElement('button');
    backButton.textContent = 'Retour';
    backButton.className = 'btn-back';
    backButton.addEventListener('click', () => {
        if (historyStack.length > 0) {
            const previousPage = historyStack.pop(); // Récupérer la dernière page
            displayResult(previousPage); // Afficher la page précédente
        }
    });
    
    container.appendChild(backButton);
    container.classList.remove('hidden');
}

function addLinkClickHandler() {
    const contentElement = document.querySelector('.dictionary-content');
    if (!contentElement) return;

    contentElement.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Empêche le comportement par défaut du lien
            const url = link.getAttribute('href');
            fetch(`https://fr.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(url)}&format=json&origin=*`)
                .then(response => {
                    if (!response.ok) throw new Error('Page non trouvée');
                    return response.json();
                })
                .then(data => {
                    const page = data.parse;
                    const content = page.text['*'];
                    historyStack.push({ word: url, content }); // Ajouter la page actuelle à l'historique
                    displayResult({ word: url, content }); // Affiche le contenu de la nouvelle page
                })
                .catch(err => {
                    showError(err.message);
                });
        });
    });
}

function searchWord() {
    const inputElement = document.getElementById('dictionaryInput');
    if (!inputElement) return;
    
    const word = inputElement.value.trim();
    const languageElement = document.getElementById('dictionaryLanguage');
    const language = languageElement ? languageElement.value : 'fr';

    if (!word) {
        showError('Veuillez entrer un mot à rechercher');
        shakeInput();
        return;
    }

    hideError();
    hideResult();
    setLoadingState(true);

    fetch(`https://fr.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&format=json&origin=*`)
        .then(response => {
            if (!response.ok) throw new Error('Mot non trouvé');
            return response.json();
        })
        .then(data => {
            const page = data.parse;
            const content = page.text['*'];
            historyStack.push({ word, content }); // Ajouter la page actuelle à l'historique
            displayResult({ word, content });
            saveToHistory(word, language);
        })
        .catch(err => {
            showError(err.message);
        })
        .finally(() => {
            setLoadingState(false);
        });
}

function saveToHistory(word, language) {
    const newEntry = { word, language };
    const exists = dictionaryState.searchHistory.some(
        entry => entry.word === word && entry.language === language
    );
    if (!exists) {
        dictionaryState.searchHistory.push(newEntry);
        localStorage.setItem(DICTIONARY_CONFIG.localStorageKey, JSON.stringify(dictionaryState.searchHistory));
        updateHistoryUI();
    }
}

// Initialisation du dictionnaire au chargement du document
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initDictionary);
}

// Export de la fonction pour utilisation comme module
export { initDictionary };
