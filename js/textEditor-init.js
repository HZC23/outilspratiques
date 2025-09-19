// Importer la fonction d'initialisation de l'éditeur de texte
import { init, clearContent, downloadContent, copyToClipboard, importFile, insertTextAtCursor } from './tools/text-editor.js';

// Variable globale pour l'instance de l'éditeur
let textEditorInstance = null;

// Fonction pour désactiver les extensions qui pourraient interférer avec l'éditeur
function disableExternalEditingTools() {
    // Désactiver les extensions et outils qui pourraient interférer
    document.querySelectorAll('[class*="grammar"], [id*="grammar"], [class*="spell"], [id*="spell"]').forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
    });
    
    // Désactiver les attributs data-gramm et similaires
    document.querySelectorAll('[data-gramm], [data-gramm_editor], [data-enable-grammarly]').forEach(el => {
        el.removeAttribute('data-gramm');
        el.removeAttribute('data-gramm_editor');
        el.removeAttribute('data-enable-grammarly');
    });
    
    // Ajouter des styles pour empêcher les interférences des outils externes
    const style = document.createElement('style');
    style.textContent = `
        [contenteditable="true"] {
            user-modify: read-write !important;
            -webkit-user-modify: read-write !important;
            -moz-user-modify: read-write !important;
            white-space: pre-wrap !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            -webkit-nbsp-mode: space !important;
        }
        
        /* Support spécifique pour les espaces */
        [contenteditable="true"] br {
            display: block !important;
            content: " " !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Désactivation des outils externes d\'édition');
}

// Fonction pour appliquer la solution d'accessibilité des espaces
function applySpaceAccessibilityFix() {
    // Observer les changements dans le DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.id === 'textEditorTool') {
                const editor = document.querySelector('.text-editor');
                if (editor) {
                    // S'assurer que la gestion des espaces fonctionne
                    editor.setAttribute('aria-multiline', 'true');
                    // S'assurer que les espaces sont correctement rendus
                    document.execCommand('defaultParagraphSeparator', false, 'p');
                }
            }
        });
    });
    
    // Configuration de l'observer
    const config = { childList: true, subtree: true };
    
    // Commencer à observer le document
    observer.observe(document.body, config);
}

// Initialiser l'éditeur de texte quand le DOM est complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('textEditorTool')) {
        // Désactiver les outils externes qui pourraient interférer
        disableExternalEditingTools();
        
        // Appliquer la solution pour les espaces
        applySpaceAccessibilityFix();
        
        // Initialiser l'éditeur
        textEditorInstance = init();
        console.log('Gestionnaire d\'éditeur de texte initialisé avec succès');

        // === Gestion des boutons de la barre latérale ===
        // Liste à puces
        const bulletBtn = document.getElementById('insertBulletList');
        if (bulletBtn) {
            bulletBtn.addEventListener('click', () => {
                insertTextAtCursor('<ul><li>Nouvel élément</li></ul>');
            });
        }
        // Liste numérotée
        const numberedBtn = document.getElementById('insertNumberedList');
        if (numberedBtn) {
            numberedBtn.addEventListener('click', () => {
                insertTextAtCursor('<ol><li>Nouvel élément</li></ol>');
            });
        }
        // Lien
        const linkBtn = document.getElementById('insertLink');
        if (linkBtn) {
            linkBtn.addEventListener('click', () => {
                const url = prompt('Adresse du lien :', 'https://');
                if (url) insertTextAtCursor(`<a href="${url}" target="_blank">Nouveau lien</a>`);
            });
        }
        // Tableau
        const tableBtn = document.getElementById('insertTable');
        if (tableBtn) {
            tableBtn.addEventListener('click', () => {
                insertTextAtCursor('<table border="1" style="border-collapse:collapse;width:100%"><tr><th>Colonne 1</th><th>Colonne 2</th></tr><tr><td>Cellule 1</td><td>Cellule 2</td></tr></table>');
            });
        }
        // Image
        const imageBtn = document.getElementById('insertImage');
        if (imageBtn) {
            imageBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            insertTextAtCursor(`<img src="${evt.target.result}" alt="Image" style="max-width:100%">`);
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            });
        }
        // === Fin gestion boutons barre latérale ===
    }
});

// Exposer les fonctions globalement si besoin
window.TextEditorManager = {
    clearContent: () => {
        if (textEditorInstance) {
            clearContent();
        }
    },
    downloadContent: () => {
        if (textEditorInstance) {
            downloadContent();
        }
    },
    copyToClipboard: () => {
        if (textEditorInstance) {
            copyToClipboard();
        }
    },
    importFile: (file) => {
        if (textEditorInstance) {
            importFile(file);
        }
    }
}; 