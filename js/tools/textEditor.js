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
    italicBtn: null
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

function downloadContent() {
    const format = els.format.value;
    let content = '';
    let mimeType = '';
    if (format === 'txt') {
        content = els.editor.innerText;
        mimeType = 'text/plain';
    } else if (format === 'html') {
        content = `<!DOCTYPE html>\n<html><head><meta charset='utf-8'><title>${els.filename.value}</title></head><body>${els.editor.innerHTML}</body></html>`;
        mimeType = 'text/html';
    } else if (format === 'docx') {
        showNotification('Export Word non supporté dans cette version', 'error');
        return;
    }
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
        updateStats();
        showNotification('Contenu effacé');
    }
}

function toggleFullscreen() {
    // Cette fonction est désormais gérée par le module fullscreen.js global
    console.warn('La fonction toggleFullscreen() est déconseillée, utilisez FullscreenManager à la place');
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

function initToolbar() {
    // Alignement
    els.alignBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setActive(els.alignBtns, btn);
            if (els.editor) {
                if (btn.classList.contains('btn-text-left')) els.editor.style.textAlign = 'left';
                if (btn.classList.contains('btn-text-center')) els.editor.style.textAlign = 'center';
                if (btn.classList.contains('btn-text-right')) els.editor.style.textAlign = 'right';
            }
        });
    });
    // Couleurs
    els.colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setActive(els.colorBtns, btn);
            if (els.editor) {
                els.editor.style.color = btn.dataset.color;
            }
        });
    });
    // Police
    if (els.fontSelect && els.editor) {
        els.fontSelect.addEventListener('change', e => {
            const val = e.target.value;
            els.editor.style.fontFamily = val ? `'${val}', sans-serif` : '';
        });
    }
    // Gras
    if (els.boldBtn && els.editor) {
        els.boldBtn.addEventListener('click', () => {
            isBold = !isBold;
            els.editor.style.fontWeight = isBold ? 'bold' : 'normal';
            els.boldBtn.classList.toggle('active', isBold);
        });
    }
    // Italique
    if (els.italicBtn && els.editor) {
        els.italicBtn.addEventListener('click', () => {
            isItalic = !isItalic;
            els.editor.style.fontStyle = isItalic ? 'italic' : 'normal';
            els.italicBtn.classList.toggle('active', isItalic);
        });
    }
    // Raccourcis clavier
    if (els.editor) {
        els.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                if (els.boldBtn) els.boldBtn.click();
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                if (els.italicBtn) els.italicBtn.click();
            }
            if (e.altKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                switchTab('preview');
            }
        });
    }
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
    els.fullscreenBtn = document.getElementById('textEditorFullscreen');
    els.toolbar = document.querySelector('.toolbar');
    els.alignBtns = document.querySelectorAll('.btn-text-left, .btn-text-center, .btn-text-right');
    els.colorBtns = document.querySelectorAll('.colors .color');
    els.fontSelect = document.querySelector('.fonts select');
    els.boldBtn = document.querySelector('.btn-bold');
    els.italicBtn = document.querySelector('.btn-italic');

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
    // Stats
    if (els.editor) {
        els.editor.addEventListener('input', updateStats);
    }
    // Format
    if (els.format) {
        els.format.addEventListener('change', updateFilenameExtension);
    }
    if (els.filename) {
        els.filename.addEventListener('input', updateFilenameExtension);
    }
    // Plein écran
    if (els.fullscreenBtn) {
        els.fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    // Aide
    if (els.helpBtn) {
        els.helpBtn.addEventListener('click', showHelpPanel);
    }
    if (els.closeHelpBtn) {
        els.closeHelpBtn.addEventListener('click', hideHelpPanel);
    }
    // Barre d'outils
    initToolbar();
    // Stats initiales
    updateStats();
}

document.addEventListener('DOMContentLoaded', init);

export { init, clearContent, downloadContent, copyToClipboard }; 