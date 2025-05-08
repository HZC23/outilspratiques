const DICTIONARY_CONFIG = {
    apis: {
        en: {
            url: word => `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
            parseResponse: response => response[0]
        },
        fr: {
            url: word => `https://api.dicolink.com/v1/mot/${word}?limite=5&api_key=`,
            parseResponse: response => ({
                word: response[0]?.mot || '',
                phonetic: '',
                meanings: [{
                    partOfSpeech: '',
                    definitions: response.map(entry => ({
                        definition: entry.definition,
                        example: entry.citation || ''
                    }))
                }]
            })
        },
        es: {
            url: word => `https://api.dictionaryapi.dev/api/v2/entries/es/${word}`,
            parseResponse: response => response[0]
        },
        de: {
            url: word => `https://api.dictionaryapi.dev/api/v2/entries/de/${word}`,
            parseResponse: response => response[0]
        },
        la: {
            url: word => `https://latin-dictionary-api.vercel.app/?word=${word}`,
            parseResponse: response => ({
                word: word,
                phonetic: '',
                meanings: [{
                    partOfSpeech: '',
                    definitions: response.map(entry => ({
                        definition: entry.definition,
                        example: ''
                    }))
                }]
            })
        }
    },
    localStorageKey: 'dictionaryHistory',
    localDictionary: {
        fr: {
            bonjour: {
                meanings: [
                    {
                        partOfSpeech: 'interjection',
                        definitions: [
                            {
                                definition: 'Salutation utilisée en français pour dire bonjour.',
                                example: 'Bonjour, comment allez-vous ?'
                            }
                        ]
                    }
                ]
            }
        },
        la: {
            salve: {
                meanings: [
                    {
                        partOfSpeech: 'interjection',
                        definitions: [
                            {
                                definition: 'Formule de salut en latin, équivalent à "bonjour".',
                                example: 'Salve, amice!'
                            }
                        ]
                    }
                ]
            }
        }
    }
};

let dictionaryState = {
    currentLanguage: 'fr',
    currentWord: '',
    currentResult: null,
    isLoading: false,
    searchHistory: JSON.parse(localStorage.getItem(DICTIONARY_CONFIG.localStorageKey)) || []
};

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

    if (result.phonetic) {
        container.innerHTML += `<div id="dictionaryPhonetic" class="dictionary-phonetic">${result.phonetic}</div>`;
    }

    const sectionsDiv = document.createElement('div');
    sectionsDiv.className = 'dictionary-sections';

    // Définitions
    const definitionsSection = document.createElement('div');
    definitionsSection.className = 'dictionary-section';
    definitionsSection.innerHTML = '<h4>Définitions</h4>';
    
    const definitionsDiv = document.createElement('div');
    definitionsDiv.id = 'dictionaryDefinitions';
    definitionsDiv.className = 'dictionary-definitions';

    result.meanings.forEach(meaning => {
        meaning.definitions.forEach((def, index) => {
            const definitionDiv = document.createElement('div');
            definitionDiv.className = 'dictionary-definition';
            
            const numberSpan = document.createElement('span');
            numberSpan.className = 'definition-number';
            numberSpan.textContent = `${index + 1}.`;
            
            const textDiv = document.createElement('div');
            textDiv.className = 'definition-text';
            
            if (meaning.partOfSpeech) {
                const posSpan = document.createElement('span');
                posSpan.className = 'part-of-speech';
                posSpan.textContent = meaning.partOfSpeech;
                textDiv.appendChild(posSpan);
            }
            
            const defText = document.createElement('span');
            defText.textContent = def.definition;
            textDiv.appendChild(defText);
            
            if (def.example) {
                const exampleDiv = document.createElement('div');
                exampleDiv.className = 'dictionary-example';
                exampleDiv.textContent = def.example;
                textDiv.appendChild(exampleDiv);
            }
            
            definitionDiv.appendChild(numberSpan);
            definitionDiv.appendChild(textDiv);
            definitionsDiv.appendChild(definitionDiv);
        });
    });
    
    definitionsSection.appendChild(definitionsDiv);
    sectionsDiv.appendChild(definitionsSection);
    
    // Exemples
    if (result.meanings.some(m => m.definitions.some(d => d.example))) {
        const examplesSection = document.createElement('div');
        examplesSection.className = 'dictionary-section';
        examplesSection.innerHTML = '<h4>Exemples</h4>';
        
        const examplesDiv = document.createElement('div');
        examplesDiv.id = 'dictionaryExamples';
        examplesDiv.className = 'dictionary-examples';
        
        result.meanings.forEach(meaning => {
            meaning.definitions.forEach(def => {
                if (def.example) {
                    const exampleDiv = document.createElement('div');
                    exampleDiv.className = 'dictionary-example';
                    exampleDiv.textContent = def.example;
                    examplesDiv.appendChild(exampleDiv);
                }
            });
        });
        
        examplesSection.appendChild(examplesDiv);
        sectionsDiv.appendChild(examplesSection);
    }

    container.appendChild(sectionsDiv);
    container.classList.remove('hidden');
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

    const localResult = checkLocalDictionary(word, language);
    if (localResult) {
        dictionaryState.currentResult = { word, ...localResult };
        displayResult(dictionaryState.currentResult);
        setLoadingState(false);
        saveToHistory(word, language);
        return;
    }

    const api = DICTIONARY_CONFIG.apis[language];
    if (!api) {
        showError('Langue non prise en charge.');
        setLoadingState(false);
        return;
    }

    fetch(api.url(word))
        .then(response => {
            if (!response.ok) throw new Error('Mot non trouvé');
            return response.json();
        })
        .then(data => {
            dictionaryState.currentResult = api.parseResponse(data);
            displayResult(dictionaryState.currentResult);
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
