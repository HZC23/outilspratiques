import { Utils } from '../utils.js';

/**
 * Gestionnaire du générateur de Lorem Ipsum
 */
export const LoremManager = {
    state: {
        type: 'paragraphs', // paragraphs | sentences | words
        count: 3,
        options: {
            startWithLorem: true,
            minWordsPerSentence: 5,
            maxWordsPerSentence: 15,
            minSentencesPerParagraph: 3,
            maxSentencesPerParagraph: 7,
            format: 'plain' // plain | html
        },
        history: []
    },

    // Dictionnaire de mots latins
    words: [
        // Noms
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'praesent', 'viverra', 'nulla', 'ut', 'metus', 'varius', 'laoreet',
        'quisque', 'rutrum', 'aenean', 'imperdiet', 'etiam', 'ultricies',
        'tellus', 'augue', 'integer', 'congue', 'risus', 'semper', 'porta',
        'mauris', 'massa', 'vestibulum', 'lacinia', 'arcu', 'eget', 'nunc',
        'vitae', 'sapien', 'libero', 'aliquam', 'diam', 'duis', 'sagittis',
        'tortor', 'tempus', 'ac', 'felis', 'donec', 'odio', 'orci', 'dignissim',

        // Adjectifs
        'magna', 'sed', 'consequat', 'leo', 'egestas', 'porttitor', 'sodales',
        'vehicula', 'eleifend', 'mollis', 'suscipit', 'quis', 'luctus', 'cursus',
        'aliquet', 'fringilla', 'euismod', 'turpis', 'pretium', 'ultrices',
        'posuere', 'cubilia', 'curae', 'faucibus', 'ornare', 'tempor', 'auctor',
        'neque', 'pulvinar', 'nisl', 'sollicitudin', 'non', 'pharetra', 'vulputate',

        // Verbes
        'est', 'urna', 'mi', 'placerat', 'elementum', 'pellentesque', 'habitant',
        'morbi', 'tristique', 'senectus', 'netus', 'malesuada', 'fames', 'quam',
        'velit', 'facilisis', 'ante', 'primis', 'faucibus', 'accumsan', 'ullamcorper',
        'sociis', 'natoque', 'penatibus', 'magnis', 'parturient', 'montes', 'nascetur',
        'ridiculus', 'mus', 'vivamus', 'vestibulum', 'sagittis', 'nibh', 'fusce',

        // Adverbes
        'nunc', 'vel', 'venenatis', 'fermentum', 'nullam', 'purus', 'molestie',
        'facilisi', 'cras', 'gravida', 'mattis', 'tempor', 'lacus', 'erat',
        'tincidunt', 'hendrerit', 'suspendisse', 'feugiat', 'blandit', 'ligula',
        'volutpat', 'condimentum', 'vulputate', 'commodo', 'molestie', 'rhoncus'
    ],

    // Ponctuation
    punctuation: ['.', '.', '.', '.', '?', '!'],

    /**
     * Initialise le générateur
     */
    init() {
        this.loadState();
        this.setupListeners();
        this.generate();
    },

    /**
     * Charge l'état sauvegardé
     */
    loadState() {
        const savedState = Utils.loadFromStorage('loremState', {
            type: 'paragraphs',
            count: 3,
            options: this.state.options,
            history: []
        });

        this.state = { ...this.state, ...savedState };
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupListeners() {
        // Type de génération
        document.getElementById('loremType')?.addEventListener('change', (e) => {
            this.updateType(e.target.value);
        });

        // Nombre d'éléments
        document.getElementById('loremCount')?.addEventListener('input', (e) => {
            this.updateCount(parseInt(e.target.value, 10));
        });

        // Options
        document.getElementById('loremStartWithLorem')?.addEventListener('change', (e) => {
            this.updateOption('startWithLorem', e.target.checked);
        });

        document.getElementById('loremFormat')?.addEventListener('change', (e) => {
            this.updateOption('format', e.target.value);
        });

        // Paramètres avancés
        ['minWordsPerSentence', 'maxWordsPerSentence', 
         'minSentencesPerParagraph', 'maxSentencesPerParagraph'].forEach(option => {
            document.getElementById(`lorem${option}`)?.addEventListener('input', (e) => {
                this.updateOption(option, parseInt(e.target.value, 10));
            });
        });

        // Boutons d'action
        document.getElementById('generateLorem')?.addEventListener('click', () => {
            this.generate();
        });

        document.getElementById('copyLorem')?.addEventListener('click', () => {
            this.copyText();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isLoremGeneratorVisible()) return;

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generate();
            } else if (e.ctrlKey && e.key === 'c' && !window.getSelection().toString()) {
                e.preventDefault();
                this.copyText();
            }
        });
    },

    /**
     * Vérifie si le générateur est visible
     */
    isLoremGeneratorVisible() {
        const generator = document.getElementById('loremTool');
        return generator?.style.display !== 'none';
    },

    /**
     * Met à jour le type de génération
     */
    updateType(type) {
        this.state.type = type;
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour le nombre d'éléments
     */
    updateCount(count) {
        this.state.count = Math.max(1, Math.min(100, count));
        this.generate();
        this.saveState();
    },

    /**
     * Met à jour une option
     */
    updateOption(option, value) {
        this.state.options[option] = value;
        this.generate();
        this.saveState();
    },

    /**
     * Génère le texte Lorem Ipsum
     */
    generate() {
        let text = '';

        switch (this.state.type) {
            case 'paragraphs':
                text = this.generateParagraphs();
                break;
            case 'sentences':
                text = this.generateSentences();
                break;
            case 'words':
                text = this.generateWords();
                break;
        }

        // Ajoute à l'historique
        this.addToHistory(text);

        // Met à jour l'affichage
        this.updateDisplay(text);
    },

    /**
     * Génère des paragraphes
     */
    generateParagraphs() {
        const paragraphs = [];
        
        for (let i = 0; i < this.state.count; i++) {
            const numSentences = this.getRandomInt(
                this.state.options.minSentencesPerParagraph,
                this.state.options.maxSentencesPerParagraph
            );
            
            let paragraph = this.generateSentences(numSentences);
            
            if (this.state.options.format === 'html') {
                paragraph = `<p>${paragraph}</p>`;
            }
            
            paragraphs.push(paragraph);
        }

        return paragraphs.join(this.state.options.format === 'html' ? '\n' : '\n\n');
    },

    /**
     * Génère des phrases
     */
    generateSentences(count = this.state.count) {
        const sentences = [];
        
        for (let i = 0; i < count; i++) {
            const numWords = this.getRandomInt(
                this.state.options.minWordsPerSentence,
                this.state.options.maxWordsPerSentence
            );
            
            let sentence = this.generateWords(numWords);
            
            // Première lettre en majuscule
            sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
            
            // Ajoute la ponctuation
            sentence += this.punctuation[
                Math.floor(Math.random() * this.punctuation.length)
            ];
            
            sentences.push(sentence);
        }

        return sentences.join(' ');
    },

    /**
     * Génère des mots
     */
    generateWords(count = this.state.count) {
        const words = [];
        
        // Commence par "Lorem ipsum dolor sit amet" si demandé
        if (this.state.options.startWithLorem && words.length === 0) {
            words.push('lorem', 'ipsum', 'dolor', 'sit', 'amet');
            count = Math.max(0, count - 5);
        }
        
        // Ajoute des mots aléatoires
        for (let i = 0; i < count; i++) {
            words.push(this.words[Math.floor(Math.random() * this.words.length)]);
        }

        return words.join(' ');
    },

    /**
     * Retourne un nombre aléatoire entre min et max
     */
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Ajoute le texte à l'historique
     */
    addToHistory(text) {
        this.state.history.unshift({
            text,
            type: this.state.type,
            count: this.state.count,
            timestamp: new Date().toISOString()
        });

        // Limite la taille de l'historique
        if (this.state.history.length > 10) {
            this.state.history.pop();
        }

        this.updateHistoryDisplay();
        this.saveState();
    },

    /**
     * Copie le texte dans le presse-papiers
     */
    copyText() {
        const output = document.getElementById('loremOutput');
        if (!output?.value) return;

        Utils.copyToClipboard(output.value)
            .then(() => Utils.showNotification('Texte copié !', 'success'))
            .catch(() => Utils.showNotification('Erreur lors de la copie', 'error'));
    },

    /**
     * Met à jour l'affichage
     */
    updateDisplay(text) {
        const output = document.getElementById('loremOutput');
        if (output) {
            output.value = text;
        }
    },

    /**
     * Met à jour l'affichage de l'historique
     */
    updateHistoryDisplay() {
        const container = document.getElementById('loremHistory');
        if (!container) return;

        container.innerHTML = this.state.history
            .map(entry => `
                <div class="history-item" onclick="loremManager.useHistoryEntry(${this.state.history.indexOf(entry)})">
                    <div class="history-text">${entry.text.substring(0, 100)}...</div>
                    <div class="history-meta">
                        <span class="history-type">
                            ${entry.count} ${entry.type}
                        </span>
                        <span class="history-date">
                            ${new Date(entry.timestamp).toLocaleString('fr-FR')}
                        </span>
                    </div>
                </div>
            `)
            .join('');
    },

    /**
     * Utilise une entrée de l'historique
     */
    useHistoryEntry(index) {
        const entry = this.state.history[index];
        if (!entry) return;

        this.updateDisplay(entry.text);
    },

    /**
     * Sauvegarde l'état
     */
    saveState() {
        Utils.saveToStorage('loremState', {
            type: this.state.type,
            count: this.state.count,
            options: this.state.options,
            history: this.state.history
        });
    },

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.saveState();
    }
}; 