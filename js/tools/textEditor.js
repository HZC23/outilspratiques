// Super éditeur de texte moderne et complet

// Sélecteurs principaux
const els = {
    container: document.getElementById('textEditorTool'),
    editor: null,
    preview: null,
    tabBtns: null,
    tabContents: null,
    wordCount: null,
    charCount: null,
    filename: null,
    format: null,
    clearBtn: null,
    downloadBtn: null,
    printBtn: null,
    copyBtn: null,
    helpBtn: null,
    helpPanel: null,
    closeHelpBtn: null,
    fullscreenBtn: null,
    toolbar: null,
    alignBtns: null,
    colorBtns: null,
    fontSelect: null,
    boldBtn: null,
    italicBtn: null,
    importBtn: null,
    fileInput: null
};

let isBold = false;
let isItalic = false;

function setActive(group, activeEl) {
    group.forEach(el => el.classList.remove('active'));
    if (activeEl) activeEl.classList.add('active');
}

function updateStats() {
    if (!els.editor) return;
    const text = els.editor.innerText.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    const charCount = text ? text.replace(/\s/g, '').length : 0;
    if (els.wordCount) els.wordCount.textContent = `${wordCount} mot${wordCount > 1 ? 's' : ''}`;
    if (els.charCount) els.charCount.textContent = `${charCount} caractère${charCount > 1 ? 's' : ''}`;
    
    // Gérer la classe empty pour le placeholder
    if (text === '') {
        els.editor.classList.add('empty');
    } else {
        els.editor.classList.remove('empty');
    }
}

function switchTab(tabName) {
    els.tabBtns.forEach(btn => btn.classList.remove('active'));
    els.tabContents.forEach(content => content.classList.remove('active'));
    const btn = Array.from(els.tabBtns).find(b => b.dataset.tab === tabName);
    const content = document.getElementById(`${tabName}-tab`) || document.getElementById(`${tabName}`);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
    if (tabName === 'preview' && els.preview) {
        els.preview.innerHTML = els.editor.innerHTML;
    }
}

function showNotification(message, type = 'success') {
    let notification = document.querySelector('.text-editor-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'text-editor-notification';
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.className = `text-editor-notification notification-${type}`;
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// Fonction pour convertir du texte en HTML simple
function textToHtml(text) {
    return text.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
}

// Fonction pour extraire le texte du HTML
function htmlToText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// Fonction pour convertir de docx à html (simulation)
async function docxToHtml(arrayBuffer) {
    try {
        // Simuler une conversion DOCX à HTML
        const text = new TextDecoder().decode(arrayBuffer);
        return `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
    } catch (error) {
        console.error('Erreur lors de la conversion DOCX:', error);
        throw error;
    }
}

// Fonction pour convertir de odt à html (simulation)
async function odtToHtml(arrayBuffer) {
    try {
        // Simuler une conversion ODT à HTML
        const text = new TextDecoder().decode(arrayBuffer);
        return `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
    } catch (error) {
        console.error('Erreur lors de la conversion ODT:', error);
        throw error;
    }
}

// Fonction pour importer un fichier
async function importFile(file) {
    if (!file) return;
    
    try {
        // Mettre à jour le nom du fichier
        const filename = file.name;
        if (els.filename) els.filename.value = filename;
        
        // Détecter le format du fichier
        const format = filename.split('.').pop().toLowerCase();
        if (els.format && els.format.querySelector(`option[value="${format}"]`)) {
            els.format.value = format;
        }
        
        // Lire le contenu du fichier
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                let content = '';
                
                if (format === 'txt') {
                    // Fichier texte simple
                    content = textToHtml(e.target.result);
                } else if (format === 'docx') {
                    // Convertir DOCX à HTML
                    content = await docxToHtml(e.target.result);
                } else if (format === 'odt') {
                    // Convertir ODT à HTML
                    content = await odtToHtml(e.target.result);
                } else {
                    showNotification(`Format ${format} non supporté`, 'error');
                    return;
                }
                
                // Mettre à jour l'éditeur
                if (els.editor) {
                    els.editor.innerHTML = content;
                    els.editor.classList.remove('empty');
                    updateStats();
                    showNotification(`Fichier ${filename} importé avec succès`);
                }
            } catch (error) {
                console.error('Erreur lors du traitement du fichier:', error);
                showNotification('Erreur lors de l\'importation du fichier', 'error');
            }
        };
        
        reader.onerror = () => {
            showNotification('Erreur lors de la lecture du fichier', 'error');
        };
        
        if (format === 'txt') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    } catch (error) {
        console.error('Erreur lors de l\'importation:', error);
        showNotification('Erreur lors de l\'importation du fichier', 'error');
    }
}

// Fonction pour lancer l'importation
function triggerFileImport() {
    if (els.fileInput) els.fileInput.click();
}

// Fonction pour gérer l'importation de fichier
function handleFileImport(event) {
    const file = event.target.files[0];
    if (file) {
        importFile(file);
    }
}

function downloadContent() {
    const format = els.format.value;
    let content = '';
    let mimeType = '';
    
    if (format === 'txt') {
        content = els.editor.innerText;
        mimeType = 'text/plain';
        downloadFile(content, format, mimeType);
    } else if (format === 'html') {
        content = `<!DOCTYPE html>\n<html><head><meta charset='utf-8'><title>${els.filename.value}</title></head><body>${els.editor.innerHTML}</body></html>`;
        mimeType = 'text/html';
        downloadFile(content, format, mimeType);
    } else if (format === 'docx') {
        // Simuler la création d'un fichier DOCX
        convertToDocx(els.editor.innerHTML)
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = els.filename.value || `document.${format}`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                showNotification(`Document téléchargé : ${els.filename.value}`);
            })
            .catch(error => {
                console.error('Erreur lors de l\'export DOCX:', error);
                showNotification('Erreur lors de l\'export DOCX', 'error');
            });
    } else if (format === 'odt') {
        // Simuler la création d'un fichier ODT
        convertToOdt(els.editor.innerHTML)
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = els.filename.value || `document.${format}`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                showNotification(`Document téléchargé : ${els.filename.value}`);
            })
            .catch(error => {
                console.error('Erreur lors de l\'export ODT:', error);
                showNotification('Erreur lors de l\'export ODT', 'error');
            });
    }
}

// Fonction pour télécharger un fichier simple
function downloadFile(content, format, mimeType) {
    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = els.filename.value || `document.${format}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    showNotification(`Document téléchargé : ${els.filename.value}`);
}

// Simuler la conversion vers DOCX (en réalité on crée juste un fichier texte avec extension .docx)
async function convertToDocx(htmlContent) {
    const textContent = htmlToText(htmlContent);
    return new Blob([textContent], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

// Simuler la conversion vers ODT (en réalité on crée juste un fichier texte avec extension .odt)
async function convertToOdt(htmlContent) {
    const textContent = htmlToText(htmlContent);
    return new Blob([textContent], {type: 'application/vnd.oasis.opendocument.text'});
}

function copyToClipboard() {
    const format = els.format.value;
    let content = format === 'html' ? els.editor.innerHTML : els.editor.innerText;
    navigator.clipboard.writeText(content)
        .then(() => showNotification('Contenu copié dans le presse-papiers'))
        .catch(() => showNotification('Impossible de copier le contenu', 'error'));
}

function printContent() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('Impossible d\'ouvrir la fenêtre d\'impression', 'error');
        return;
    }
    const title = els.filename.value.split('.')[0] || 'Document';
    const content = els.editor.innerHTML;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>${title}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;margin:2cm;}@media print{body{margin:0;}img{max-width:100%;}}</style></head><body>${content}</body></html>`;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() { printWindow.close(); };
    };
}

function clearContent() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le contenu ?')) {
        els.editor.innerHTML = '';
        els.editor.classList.add('empty');
        updateStats();
        showNotification('Contenu effacé');
    }
}

function toggleFullscreen() {
    // Cette fonction est désormais gérée par le module fullscreen.js global
    console.warn('La fonction toggleFullscreen() est déconseillée, utilisez le module fullscreen.js global à la place');
}

function updateFilenameExtension() {
    const val = els.filename.value;
    const format = els.format.value;
    let base = val.replace(/\.[^.]+$/, '');
    els.filename.value = `${base}.${format}`;
}

function showHelpPanel() {
    els.helpPanel.classList.add('show');
}
function hideHelpPanel() {
    els.helpPanel.classList.remove('show');
}

// Fonction pour activer le focus sur l'éditeur
function focusEditor() {
    if (els.editor) {
        els.editor.focus();
        
        // Positionner le curseur à la fin du texte
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(els.editor);
        range.collapse(false); // false = collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function initToolbar() {
    // Alignement
    els.alignBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setActive(els.alignBtns, btn);
            if (els.editor) {
                if (btn.classList.contains('btn-text-left')) els.editor.style.textAlign = 'left';
                if (btn.classList.contains('btn-text-center')) els.editor.style.textAlign = 'center';
                if (btn.classList.contains('btn-text-right')) els.editor.style.textAlign = 'right';
                focusEditor();
            }
        });
    });
    // Couleurs
    els.colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setActive(els.colorBtns, btn);
            if (els.editor) {
                els.editor.style.color = btn.dataset.color;
                focusEditor();
            }
        });
    });
    // Police
    if (els.fontSelect && els.editor) {
        els.fontSelect.addEventListener('change', e => {
            const val = e.target.value;
            els.editor.style.fontFamily = val ? `'${val}', sans-serif` : '';
            focusEditor();
        });
    }
    // Gras
    if (els.boldBtn && els.editor) {
        els.boldBtn.addEventListener('click', () => {
            isBold = !isBold;
            els.editor.style.fontWeight = isBold ? 'bold' : 'normal';
            els.boldBtn.classList.toggle('active', isBold);
            focusEditor();
        });
    }
    // Italique
    if (els.italicBtn && els.editor) {
        els.italicBtn.addEventListener('click', () => {
            isItalic = !isItalic;
            els.editor.style.fontStyle = isItalic ? 'italic' : 'normal';
            els.italicBtn.classList.toggle('active', isItalic);
            focusEditor();
        });
    }
    // Raccourcis clavier sont maintenant gérés dans la fonction init
}

function init() {
    els.editor = document.querySelector('.text-editor');
    els.preview = document.getElementById('texteditor-preview');
    els.tabBtns = document.querySelectorAll('.tab-btn');
    els.tabContents = document.querySelectorAll('.tab-content');
    els.wordCount = document.getElementById('textEditorWordCount');
    els.charCount = document.getElementById('textEditorCharCount');
    els.filename = document.getElementById('textEditorFilename');
    els.format = document.getElementById('textEditorFormat');
    els.clearBtn = document.getElementById('clearTextEditor');
    els.downloadBtn = document.getElementById('downloadTextEditor');
    els.printBtn = document.getElementById('printTextEditor');
    els.copyBtn = document.getElementById('copyTextEditor');
    els.helpBtn = document.getElementById('textEditorHelp');
    els.helpPanel = document.getElementById('textEditorHelpPanel');
    els.closeHelpBtn = document.getElementById('closeTextEditorHelp');
    els.fullscreenBtn = document.getElementById('textEditorFullscreenBtn');
    els.toolbar = document.querySelector('.toolbar');
    els.alignBtns = document.querySelectorAll('.btn-text-left, .btn-text-center, .btn-text-right');
    els.colorBtns = document.querySelectorAll('.colors .color');
    els.fontSelect = document.querySelector('.fonts select');
    els.boldBtn = document.querySelector('.btn-bold');
    els.italicBtn = document.querySelector('.btn-italic');
    els.importBtn = document.getElementById('importBtn');
    els.fileInput = document.getElementById('fileImport');

    // Onglets
    els.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    // Actions
    if (els.clearBtn) {
        els.clearBtn.addEventListener('click', clearContent);
    }
    if (els.downloadBtn) {
        els.downloadBtn.addEventListener('click', downloadContent);
    }
    if (els.copyBtn) {
        els.copyBtn.addEventListener('click', copyToClipboard);
    }
    if (els.printBtn) {
        els.printBtn.addEventListener('click', printContent);
    }
    // Import
    if (els.importBtn) {
        els.importBtn.addEventListener('click', triggerFileImport);
    }
    if (els.fileInput) {
        els.fileInput.addEventListener('change', handleFileImport);
    }
    // Stats
    if (els.editor) {
        // Initialiser l'éditeur avec un contenu vide
        els.editor.innerHTML = '';
        els.editor.classList.add('empty');
        
        // Événements de l'éditeur
        els.editor.addEventListener('input', function() {
            // Si l'éditeur est vide après suppression, réinitialiser
            if (els.editor.innerHTML.trim() === '' || els.editor.innerHTML === '<br>') {
                els.editor.innerHTML = '';
                els.editor.classList.add('empty');
            } else {
                els.editor.classList.remove('empty');
            }
            
            // Mise à jour des statistiques
            updateStats();
        });
        
        // Gestion du focus
        els.editor.addEventListener('focus', () => {
            if (els.editor.classList.contains('empty')) {
                els.editor.innerHTML = '';
                // Forcer un contenu minimum pour maintenir le curseur visible
                document.execCommand('insertHTML', false, '<br>');
            }
        });
        
        // Gestion de la perte de focus
        els.editor.addEventListener('blur', () => {
            if (els.editor.innerHTML.trim() === '' || els.editor.innerHTML === '<br>') {
                els.editor.innerHTML = '';
                els.editor.classList.add('empty');
            }
        });
        
        // Gestion du clic sur la zone d'édition vide
        els.editor.parentElement.addEventListener('click', (e) => {
            if (e.target === els.editor.parentElement || 
                (e.target === els.editor && (els.editor.innerHTML.trim() === '' || els.editor.innerHTML === '<br>'))) {
                focusEditor();
            }
        });
        
        // Gestion des raccourcis clavier et des espaces
        els.editor.addEventListener('keydown', function(e) {
            // Raccourcis clavier
            if (e.ctrlKey && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                if (els.boldBtn) els.boldBtn.click();
                return;
            }
            else if (e.ctrlKey && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                if (els.italicBtn) els.italicBtn.click();
                return;
            }
            else if (e.altKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                switchTab('preview');
                return;
            }
            
            // Gestion spéciale pour l'espace
            if (e.key === ' ' || e.keyCode === 32 || e.code === 'Space') {
                e.preventDefault(); // Bloquer le comportement par défaut
                
                // Si l'éditeur est vide, initialiser avec un espace non sécable
                if (els.editor.classList.contains('empty') || 
                    els.editor.innerHTML === '' || 
                    els.editor.innerHTML === '<br>') {
                    els.editor.innerHTML = '';
                    document.execCommand('insertHTML', false, '&nbsp;');
                    els.editor.classList.remove('empty');
                } else {
                    // Insérer un espace dans le contenu existant
                    document.execCommand('insertHTML', false, '&nbsp;');
                }
                
                updateStats();
                return;
            }
        });
        
        // Prendre en charge explicitement l'événement input pour les caractères spéciaux
        els.editor.addEventListener('beforeinput', function(e) {
            if (e.inputType === 'insertText' && e.data === ' ') {
                e.preventDefault();
                document.execCommand('insertHTML', false, '&nbsp;');
            }
        });
    }
    
    // Format
    if (els.format) {
        els.format.addEventListener('change', updateFilenameExtension);
    }
    if (els.filename) {
        els.filename.addEventListener('input', updateFilenameExtension);
    }
    // Note: Le bouton de plein écran est maintenant géré par le module fullscreen.js global
    
    // Aide
    if (els.helpBtn) {
        els.helpBtn.addEventListener('click', () => showHelpPanel());
    }
    if (els.closeHelpBtn) {
        els.closeHelpBtn.addEventListener('click', () => hideHelpPanel());
    }
    // Barre d'outils
    initToolbar();
    // Stats initiales
    updateStats();
}

document.addEventListener('DOMContentLoaded', init);

export { init, clearContent, downloadContent, copyToClipboard, importFile };

// Fonction améliorée pour insérer du texte à la position actuelle du curseur
function insertTextAtCursor(text) {
    if (!els.editor) return;
    
    // S'assurer que l'éditeur a le focus
    els.editor.focus();
    
    // Remplacer les espaces par des espaces non-sécables pour une meilleure visibilité
    text = text.replace(/ /g, '&nbsp;');
    
    // Utiliser insertHTML qui est plus fiable pour les espaces
    document.execCommand('insertHTML', false, text);
    
    // Vérifier si l'insertion a réussi
    if (els.editor.innerHTML === '' || els.editor.innerHTML === '<br>') {
        // Si l'insertion a échoué, essayer une méthode alternative
        els.editor.innerHTML = text;
        
        // Positionner le curseur à la fin
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(els.editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // Mettre à jour les statistiques
    updateStats();
} 