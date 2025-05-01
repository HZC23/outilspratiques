/**
 * Module styletext.js - gestionnaire de stylisation de texte
 * Ce module permet de convertir du texte normal en différents styles de caractères Unicode.
 */

// Objet principal du gestionnaire de stylisation de texte
export const StyleTextManager = {
    // Propriétés
    activeStyle: 'normal',
    styles: {},
    history: [],
    
    // Méthode d'initialisation
    init() {
        console.log('Initialisation du StyleTextManager');
        this.loadStyles();
        this.setupEventListeners();
        this.applyCurrentStyle();
    },
    
    // Méthode pour charger les styles disponibles
    loadStyles() {
        // Style normal (texte par défaut)
        this.styles.normal = {
            name: 'Normal',
            preview: 'Abc',
            transform: text => text
        };
        
        // Style de contour (mathematical double-struck)
        this.styles.outline = {
            name: 'Police de contour',
            preview: '𝕒𝕓𝕔',
            transform: text => {
                return text.split('').map(char => {
                    if (/[a-z]/i.test(char)) {
                        const code = char.toLowerCase().charCodeAt(0) - 97;
                        return String.fromCodePoint(0x1D552 + code + (char === char.toUpperCase() ? 26 : 0));
                    } else if (/[0-9]/.test(char)) {
                        const code = char.charCodeAt(0) - 48;
                        return String.fromCodePoint(0x1D7D8 + code);
                    }
                    return char;
                }).join('');
            }
        };
        
        // Style de texte carré (squared)
        this.styles.squared = {
            name: 'Texte carré',
            preview: '🅐🅑🅒',
            transform: text => {
                return text.split('').map(char => {
                    if (/[a-z]/i.test(char)) {
                        const code = char.toLowerCase().charCodeAt(0) - 97;
                        return String.fromCodePoint(0x1F130 + code);
                    }
                    return char;
                }).join('');
            }
        };
        
        // Style petites majuscules (small caps)
        this.styles.smallcaps = {
            name: 'Petites majuscules',
            preview: 'ᴀʙᴄ',
            transform: text => {
                const smallCapsMap = {
                    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ',
                    'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ',
                    'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x',
                    'y': 'ʏ', 'z': 'ᴢ'
                };
                
                return text.split('').map(char => {
                    const lower = char.toLowerCase();
                    return smallCapsMap[lower] || char;
                }).join('');
            }
        };
        
        // Style gras (bold)
        this.styles.bold = {
            name: 'Gras',
            preview: '𝐀𝐛𝐜',
            transform: text => {
                return text.split('').map(char => {
                    if (/[a-z]/i.test(char)) {
                        const code = char.toLowerCase().charCodeAt(0) - 97;
                        return String.fromCodePoint(0x1D41A + code + (char === char.toUpperCase() ? 26 : 0));
                    }
                    return char;
                }).join('');
            }
        };
        
        // Style vieux texte anglais (fraktur)
        this.styles.fraktur = {
            name: 'Vieux texte anglais',
            preview: '𝔄𝔟𝔠',
            transform: text => {
                return text.split('').map(char => {
                    if (/[a-z]/i.test(char)) {
                        const code = char.toLowerCase().charCodeAt(0) - 97;
                        return String.fromCodePoint(0x1D504 + code + (char === char.toUpperCase() ? 26 : 0));
                    }
                    return char;
                }).join('');
            }
        };
        
        // Style à l'envers (flipped)
        this.styles.flipped = {
            name: 'Texte à l\'envers',
            preview: 'ɐqɔ',
            transform: text => {
                const flipMap = {
                    'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ',
                    'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd',
                    'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x',
                    'y': 'ʎ', 'z': 'z', 'A': '∀', 'B': 'q', 'C': 'Ɔ', 'D': 'p', 'E': 'Ǝ', 'F': 'Ⅎ',
                    'G': 'פ', 'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N',
                    'O': 'O', 'P': 'Ԁ', 'Q': 'Q', 'R': 'ꓤ', 'S': 'S', 'T': '┴', 'U': '∩', 'V': 'Λ',
                    'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z', '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ',
                    '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', ',': '\'', '.': '˙',
                    '?': '¿', '!': '¡', '\'': ',', '"': ',,', '(': ')', ')': '(', '[': ']', ']': '[',
                    '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾'
                };
                
                return text.split('').reverse().map(char => flipMap[char] || char).join('');
            }
        };
        
        // Style sérif (serif)
        this.styles.serif = {
            name: 'Police serif',
            preview: '𝐀𝐛𝐜',
            transform: text => {
                return text.split('').map(char => {
                    if (/[a-z]/i.test(char)) {
                        const code = char.toLowerCase().charCodeAt(0) - 97;
                        return String.fromCodePoint(0x1D5BA + code + (char === char.toUpperCase() ? 26 : 0));
                    }
                    return char;
                }).join('');
            }
        };
        
        // Style cursive (script)
        this.styles.script = {
            name: 'Lettres cursives',
            preview: '𝓐𝓫𝓬',
            transform: text => {
                return text.split('').map(char => {
                    if (/[a-z]/i.test(char)) {
                        const code = char.toLowerCase().charCodeAt(0) - 97;
                        return String.fromCodePoint(0x1D4D0 + code + (char === char.toUpperCase() ? 26 : 0));
                    }
                    return char;
                }).join('');
            }
        };
        
        // Style exposant (superscript)
        this.styles.superscript = {
            name: 'Exposant',
            preview: 'ᴬᵇᶜ',
            transform: text => {
                const superMap = {
                    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ',
                    'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ',
                    'q': 'ᵠ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ',
                    'y': 'ʸ', 'z': 'ᶻ', 'A': 'ᴬ', 'B': 'ᴮ', 'C': 'ᶜ', 'D': 'ᴰ', 'E': 'ᴱ', 'F': 'ᶠ',
                    'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ',
                    'O': 'ᴼ', 'P': 'ᴾ', 'Q': 'Q', 'R': 'ᴿ', 'S': 'ˢ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ',
                    'W': 'ᵂ', 'X': 'ˣ', 'Y': 'ʸ', 'Z': 'ᶻ', '0': '⁰', '1': '¹', '2': '²', '3': '³',
                    '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻',
                    '=': '⁼', '(': '⁽', ')': '⁾'
                };
                
                return text.split('').map(char => superMap[char] || char).join('');
            }
        };
    },
    
    // Méthode pour configurer tous les écouteurs d'événements
    setupEventListeners() {
        // Éléments du DOM
        const inputText = document.getElementById('inputText');
        const outputText = document.getElementById('outputText');
        const copyButton = document.getElementById('copyButton');
        const radioButtons = document.querySelectorAll('input[name="textStyle"]');
        
        if (!inputText || !outputText || !copyButton) {
            console.error('Éléments DOM manquants pour les écouteurs d\'événements');
            return;
        }
        
        // Événement de saisie dans la zone de texte d'entrée
        inputText.addEventListener('input', () => this.applyCurrentStyle());
        
        // Événement de clic sur le bouton de copie
        copyButton.addEventListener('click', () => this.copyToClipboard());
        
        // Événement de touche pour le raccourci Ctrl+Entrée
        inputText.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.applyCurrentStyle();
            }
        });
        
        // Configurer les boutons radio
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.setActiveStyle(radio.value);
                }
            });
        });
    },
    
    // Méthode pour définir le style actif
    setActiveStyle(styleId) {
        if (!this.styles[styleId]) {
            console.error(`Style ${styleId} introuvable`);
            return;
        }
        
        // Mettre à jour la propriété du style actif
        this.activeStyle = styleId;
        
        // Mettre à jour le bouton radio sélectionné
        const radioButton = document.querySelector(`input[name="textStyle"][value="${styleId}"]`);
        if (radioButton) {
            radioButton.checked = true;
        }
        
        // Appliquer le style au texte
        this.applyCurrentStyle();
    },
    
    // Méthode pour appliquer le style actuel au texte
    applyCurrentStyle() {
        const inputText = document.getElementById('inputText');
        const outputText = document.getElementById('outputText');
        
        if (!inputText || !outputText) {
            console.error('Éléments de texte introuvables');
            return;
        }
        
        // Récupérer le texte d'entrée
        const text = inputText.value;
        
        // Si le texte est vide, vider également la sortie
        if (!text.trim()) {
            outputText.value = '';
            return;
        }
        
        // Appliquer la transformation
        try {
            // Récupérer la fonction de transformation du style actif
            const transformFunction = this.styles[this.activeStyle].transform;
            
            // Appliquer la transformation
            const transformedText = transformFunction(text);
            
            // Mettre à jour la sortie
            outputText.value = transformedText;
            
            // Ajouter l'animation de changement de style
            outputText.classList.remove('style-changed');
            // Force le redémarrage de l'animation en utilisant setTimeout
            setTimeout(() => outputText.classList.add('style-changed'), 10);
            
        } catch (error) {
            console.error('Erreur lors de la transformation du texte:', error);
            outputText.value = 'Erreur de transformation';
        }
    },
    
    // Méthode pour copier le texte dans le presse-papiers
    copyToClipboard() {
        const outputText = document.getElementById('outputText');
        const copyButton = document.getElementById('copyButton');
        
        if (!outputText || !copyButton) {
            console.error('Éléments pour la copie introuvables');
            return;
        }
        
        try {
            // Sélectionner le texte
            outputText.select();
            outputText.setSelectionRange(0, 99999);
            
            // Copier dans le presse-papiers
            navigator.clipboard.writeText(outputText.value)
                .then(() => {
                    // Effet visuel pour indiquer le succès
                    copyButton.innerHTML = '<i class="fas fa-check"></i> Copié !';
                    
                    // Rétablir le bouton après un délai
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copier dans le Presse-papiers';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Erreur lors de la copie:', err);
                    alert('Impossible de copier le texte');
                });
        } catch (err) {
            console.error('Erreur lors de la copie (méthode alternative):', err);
            alert('Impossible de copier le texte');
        }
    },
    
    // Méthode pour afficher une notification toast
    showToast(message, type = 'info') {
        // Vérifier si la fonction globale existe
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        
        // Créer un toast personnalisé
        const toast = document.createElement('div');
        toast.className = `styletext-toast ${type}`;
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.backgroundColor = type === 'success' ? '#34a853' : type === 'error' ? '#ea4335' : '#4285f4';
        toast.style.color = 'white';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        toast.style.zIndex = '9999';
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s ease';
        
        document.body.appendChild(toast);
        
        // Afficher avec animation
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Cacher après 3 secondes
        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Fonction de débogage exportée
export function debugStyleText() {
    console.log('---- DÉBOGAGE STYLETEXT MODULE ----');
    console.log('StyleTextManager initialisé:', StyleTextManager);
    console.log('Styles disponibles:', Object.keys(StyleTextManager.styles).length);
    console.log('Style actif:', StyleTextManager.activeStyle);
    
    // Vérifier les éléments DOM critiques
    const elements = {
        inputText: document.getElementById('inputText'),
        outputText: document.getElementById('outputText'),
        copyButton: document.getElementById('copyButton'),
        radioButtons: document.querySelectorAll('input[name="textStyle"]')
    };
    
    for (const [name, element] of Object.entries(elements)) {
        if (name === 'radioButtons') {
            console.log(`Élément ${name} trouvés:`, element.length);
        } else {
            console.log(`Élément ${name} trouvé:`, !!element);
        }
    }
} 