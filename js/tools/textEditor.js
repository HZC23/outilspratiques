/**
 * Éditeur de texte avancé avec Quill.js
 */
export class TextEditorManager {
    constructor() {
        // État de l'éditeur
        this.editor = null;
        this.splitEditor = null;
        this.currentFormat = 'html';
        this.currentTheme = 'snow';
        this.currentMode = 'editor';
        this.filename = 'document';
        this.wordCount = 0;
        this.charCount = 0;
    }

    /**
     * Initialise l'éditeur de texte
     */
    init() {
        console.log('Initialisation de l\'éditeur de texte avancé...');
        
        // Configurer l'UI et les événements
        this.setupUI();
        this.initQuillEditor();
        this.setupEventListeners();
        
        // Mettre à jour les statistiques
        this.updateStats();
        
        console.log('Éditeur de texte initialisé avec succès');
    }

    /**
     * Configure l'interface utilisateur
     */
    setupUI() {
        // Configurer les onglets
        const tabs = document.querySelectorAll('.tab-btn');
        if (tabs.length) {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    this.switchTab(tabName);
                });
            });
        }
        
        // Configurer le bouton plein écran
        const fullscreenBtn = document.getElementById('textEditorFullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        
        // Configurer le bouton d'aide
        const helpBtn = document.getElementById('textEditorHelp');
        const helpPanel = document.getElementById('textEditorHelpPanel');
        const closeHelpBtn = document.getElementById('closeTextEditorHelp');
        
        if (helpBtn && helpPanel && closeHelpBtn) {
            helpBtn.addEventListener('click', () => {
                helpPanel.classList.add('show');
            });
            
            closeHelpBtn.addEventListener('click', () => {
                helpPanel.classList.remove('show');
            });
        }
        
        // Configurer le sélecteur de thème
        const themeToggle = document.getElementById('textEditorThemeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Configurer le choix de format
        const formatSelect = document.getElementById('textEditorFormat');
        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => {
                this.currentFormat = e.target.value;
                this.updateFilenameExtension();
            });
        }
    }

    /**
     * Initialise l'éditeur Quill
     */
    initQuillEditor() {
        // Créer un conteneur pour l'éditeur si nécessaire
        let editorContainer = document.getElementById('texteditor-container');
        if (!editorContainer) {
            console.error('Conteneur de l\'éditeur non trouvé');
            return;
        }
        
        // Configuration des outils de la barre d'outils pour ressembler à Word
        const toolbarOptions = [
            [{ 'font': [] }], // Police de caractères
            [{ 'size': ['small', false, 'large', 'huge'] }], // Taille de police
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }], // Styles de titres comme Word
            ['bold', 'italic', 'underline', 'strike'], // Mise en forme de base
            [{ 'color': [] }, { 'background': [] }], // Couleurs de texte et surlignage
            [{ 'align': [] }], // Alignement du texte
            [{ 'indent': '-1' }, { 'indent': '+1' }], // Indentation
            [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Listes
            [{ 'script': 'sub'}, { 'script': 'super' }], // Indices et exposants
            ['blockquote'], // Citation
            ['link', 'image', 'video'], // Insertion de liens et médias
            ['clean'] // Nettoyage du formatage
        ];
        
        // Créer un éditeur avec la barre d'outils intégrée
        this.editor = new Quill('#texteditor-container', {
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        'image': () => this.handleImageUpload()
                    }
                },
                history: {
                    delay: 1000,
                    maxStack: 500,
                    userOnly: true
                }
            },
            placeholder: 'Commencez à rédiger ici...',
            theme: this.currentTheme
        });
        
        // Désactiver l'onglet "code" qui est moins pertinent pour un traitement de texte
        const codeTab = document.querySelector('.tab-btn[data-tab="code"]');
        if (codeTab) {
            codeTab.style.display = 'none';
        }
        
        // Configurer l'aperçu en mode divisé si nécessaire
        const splitContainer = document.getElementById('texteditor-container-split');
        if (splitContainer) {
            this.splitEditor = new Quill('#texteditor-container-split', {
                modules: {
                    toolbar: false
                },
                readOnly: false,
                theme: this.currentTheme
            });
            
            // Synchroniser les deux éditeurs
            this.editor.on('text-change', (delta, oldDelta, source) => {
                if (source === 'user' && this.splitEditor) {
                    this.splitEditor.updateContents(delta);
                    this.updatePreview();
                }
            });
        }
        
        // Mettre à jour les statistiques lors des changements
        this.editor.on('text-change', () => {
            this.updateStats();
        });
    }

    /**
     * Gère l'ajout d'images
     */
    handleImageUpload() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.style.display = 'none';
        
        input.addEventListener('change', () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                
                // Vérifier la taille (limite à 5 Mo)
                if (file.size > 5 * 1024 * 1024) {
                    this.showNotification('Image trop volumineuse (max 5 Mo)', 'error');
                    document.body.removeChild(input);
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const range = this.editor.getSelection(true);
                    this.editor.insertEmbed(range.index, 'image', e.target.result);
                    this.editor.setSelection(range.index + 1);
                };
                
                reader.readAsDataURL(file);
            }
            
            document.body.removeChild(input);
        });
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Téléchargement
        const downloadBtn = document.getElementById('downloadTextEditor');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadContent());
        }
        
        // Copie
        const copyBtn = document.getElementById('copyTextEditor');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }
        
        // Effacement
        const clearBtn = document.getElementById('clearTextEditor');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearContent());
        }
        
        // Impression
        const printBtn = document.getElementById('printTextEditor');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printContent());
        }
        
        // Nom de fichier
        const filenameInput = document.getElementById('textEditorFilename');
        if (filenameInput) {
            filenameInput.addEventListener('input', (e) => {
                this.filename = e.target.value;
            });
            
            // Initialiser avec une valeur par défaut
            this.filename = filenameInput.value;
        }
        
        // Thème de l'éditeur
        const themeSelect = document.getElementById('editorTheme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        }
    }

    /**
     * Change d'onglet
     */
    switchTab(tabName) {
        // Désactiver tous les onglets
        const allTabs = document.querySelectorAll('.tab-btn');
        const allContents = document.querySelectorAll('.tab-content');
        
        allTabs.forEach(tab => tab.classList.remove('active'));
        allContents.forEach(content => content.classList.remove('active'));
        
        // Activer l'onglet sélectionné
        const selectedTab = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}-tab`);
        
        if (selectedTab && selectedContent) {
            selectedTab.classList.add('active');
            selectedContent.classList.add('active');
            
            // Actions spécifiques selon l'onglet
            if (tabName === 'preview') {
                this.updatePreview();
            } else if (tabName === 'code') {
                this.updateCodeView();
            } else if (tabName === 'split') {
                if (this.splitEditor) {
                    this.splitEditor.setContents(this.editor.getContents());
                }
                this.updatePreview(true);
            }
            
            this.currentMode = tabName;
        }
    }

    /**
     * Met à jour l'aperçu
     */
    updatePreview(isSplit = false) {
        const previewElement = isSplit 
            ? document.getElementById('texteditor-preview-split')
            : document.getElementById('texteditor-preview');
            
        if (!previewElement) return;
        
        const content = this.editor.root.innerHTML;
        previewElement.innerHTML = content;
    }

    /**
     * Met à jour la vue code
     */
    updateCodeView() {
        const codeElement = document.getElementById('texteditor-code');
        if (!codeElement) return;
        
        const html = this.editor.root.innerHTML;
        codeElement.textContent = html;
    }

    /**
     * Bascule en mode plein écran
     */
    toggleFullscreen() {
        const toolContainer = document.getElementById('textEditorTool');
        if (!toolContainer) return;
        
        toolContainer.classList.toggle('fullscreen');
        
        // Mettre à jour l'icône du bouton
        const fullscreenBtn = document.getElementById('textEditorFullscreen');
        if (fullscreenBtn) {
            const icon = fullscreenBtn.querySelector('i');
            
            if (toolContainer.classList.contains('fullscreen')) {
                icon.classList.remove('fa-expand');
                icon.classList.add('fa-compress');
            } else {
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
            }
        }
    }

    /**
     * Bascule entre les thèmes
     */
    toggleTheme() {
        // Basculer entre les thèmes Snow et Bubble
        this.currentTheme = this.currentTheme === 'snow' ? 'bubble' : 'snow';
        
        // Notifier le changement (une réinitialisation complète serait nécessaire)
        this.showNotification(`Thème ${this.currentTheme} sélectionné. Rechargez la page pour appliquer.`);
    }

    /**
     * Applique un thème spécifique à l'éditeur
     */
    applyTheme(themeName) {
        const editorElement = document.querySelector('.ql-editor');
        if (!editorElement) return;
        
        // Supprimer tous les thèmes précédents
        editorElement.classList.remove('theme-monokai', 'theme-github');
        
        // Appliquer le thème sélectionné
        if (themeName !== 'snow' && themeName !== 'bubble') {
            editorElement.classList.add(`theme-${themeName}`);
        }
        
        this.showNotification(`Thème de l'éditeur: ${themeName}`);
    }

    /**
     * Met à jour l'extension du nom de fichier en fonction du format sélectionné
     */
    updateFilenameExtension() {
        const filenameInput = document.getElementById('textEditorFilename');
        if (!filenameInput) return;
        
        // Extraire le nom sans extension
        const nameParts = filenameInput.value.split('.');
        let baseName;
        
        if (nameParts.length > 1) {
            // Supprimer l'ancienne extension
            baseName = nameParts.slice(0, -1).join('.');
        } else {
            baseName = filenameInput.value;
        }
        
        // Ajouter la nouvelle extension
        filenameInput.value = `${baseName}.${this.currentFormat}`;
        this.filename = filenameInput.value;
    }

    /**
     * Met à jour les statistiques (mots et caractères)
     */
    updateStats() {
        if (!this.editor) return;
        
        const text = this.editor.getText().trim();
        
        // Compter les mots (séparés par des espaces)
        const wordCount = text ? text.split(/\s+/).length : 0;
        
        // Compter les caractères (sans les espaces)
        const charCount = text ? text.length : 0;
        
        // Mettre à jour les compteurs dans l'interface
        const wordCountElement = document.getElementById('textEditorWordCount');
        const charCountElement = document.getElementById('textEditorCharCount');
        
        if (wordCountElement) {
            wordCountElement.textContent = `${wordCount} mot${wordCount > 1 ? 's' : ''}`;
        }
        
        if (charCountElement) {
            charCountElement.textContent = `${charCount} caractère${charCount > 1 ? 's' : ''}`;
        }
        
        this.wordCount = wordCount;
        this.charCount = charCount;
    }

    /**
     * Télécharge le contenu
     */
    downloadContent() {
        if (!this.editor) return;
        
        const format = this.currentFormat;
        let content = '';
        let mimeType = '';
        
        // Préparer le contenu selon le format
        switch (format) {
            case 'txt':
                content = this.editor.getText();
                mimeType = 'text/plain';
                break;
                
            case 'html':
                content = this.getHTMLContent();
                mimeType = 'text/html';
                break;
                
            case 'md':
                // Version simplifiée sans bibliothèque de conversion
                content = this.editor.getText();
                mimeType = 'text/markdown';
                break;
                
            case 'docx':
                this.showNotification('Format DOCX non supporté dans cette version', 'error');
                return;
                
            default:
                content = this.editor.getText();
                mimeType = 'text/plain';
        }
        
        // Créer et télécharger le fichier
        const blob = new Blob([content], {type: mimeType});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.filename || `document.${format}`;
        
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        this.showNotification(`Document téléchargé: ${this.filename}`);
    }

    /**
     * Génère le contenu HTML complet
     */
    getHTMLContent() {
        const title = this.filename.split('.')[0] || 'Document';
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        h1, h2, h3, h4, h5, h6 { color: #333; }
        blockquote { 
            border-left: 4px solid #ccc; 
            padding-left: 16px; 
            margin-left: 0; 
        }
        pre { 
            background-color: #f5f5f5; 
            padding: 10px; 
            border-radius: 4px; 
            overflow-x: auto; 
        }
        code { font-family: monospace; }
        img { max-width: 100%; height: auto; }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1em 0; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
        }
        th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
        }
    </style>
</head>
<body>
    ${this.editor.root.innerHTML}
</body>
</html>`;
    }

    /**
     * Copie le contenu dans le presse-papiers
     */
    copyToClipboard() {
        if (!this.editor) return;
        
        let content = '';
        
        // Choisir le format selon le sélecteur
        switch (this.currentFormat) {
            case 'txt':
                content = this.editor.getText();
                break;
                
            case 'html':
                content = this.editor.root.innerHTML;
                break;
                
            default:
                content = this.editor.getText();
        }
        
        // Copier dans le presse-papiers
        navigator.clipboard.writeText(content)
            .then(() => {
                this.showNotification('Contenu copié dans le presse-papiers');
            })
            .catch(err => {
                console.error('Erreur lors de la copie', err);
                this.showNotification('Impossible de copier le contenu', 'error');
            });
    }

    /**
     * Imprime le contenu
     */
    printContent() {
        if (!this.editor) return;
        
        // Créer une fenêtre d'impression
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            this.showNotification('Impossible d\'ouvrir la fenêtre d\'impression', 'error');
            return;
        }
        
        // Préparer le contenu
        const title = this.filename.split('.')[0] || 'Document';
        const content = this.editor.root.innerHTML;
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 2cm; 
        }
        @media print {
            body { margin: 0; }
            img { max-width: 100%; }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
        
        // Écrire dans la fenêtre
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Lancer l'impression
        printWindow.onload = function() {
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
    }

    /**
     * Efface le contenu
     */
    clearContent() {
        if (!this.editor) return;
        
        if (confirm('Êtes-vous sûr de vouloir effacer tout le contenu ?')) {
            this.editor.setText('');
            this.updateStats();
            this.showNotification('Contenu effacé');
        }
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'success') {
        // Créer l'élément de notification
        let notification = document.querySelector('.text-editor-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'text-editor-notification';
            document.body.appendChild(notification);
        }
        
        // Configurer la notification
        notification.textContent = message;
        notification.className = `text-editor-notification notification-${type}`;
        
        // Afficher la notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Masquer après un délai
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialiser l'éditeur lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'outil d'éditeur de texte est présent dans la page
    const editorTool = document.getElementById('textEditorTool');
    if (editorTool) {
        const textEditor = new TextEditorManager();
        textEditor.init();
        
        // Rendre l'instance disponible globalement pour le débogage
        window.textEditor = textEditor;
    }
}); 