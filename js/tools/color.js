/**
 * Module de sélection de couleurs
 * Gère la sélection et la conversion de couleurs entre différents formats
 */

// État du sélecteur de couleurs
let state = {
    history: [],
    currentColor: '#4a90e2'
};

/**
 * Initialise le sélecteur de couleurs
 */
function initColorPicker() {
    // Charger l'historique depuis le stockage local
    loadColorHistory();
    
    // Initialiser la couleur actuelle
    updateColorPicker(state.currentColor);
    
    // Initialiser les écouteurs d'événements
    document.getElementById('colorPicker').addEventListener('input', (e) => {
        updateColorPicker(e.target.value);
    });
    
    console.log('Sélecteur de couleurs initialisé');
}

/**
 * Met à jour le sélecteur de couleurs avec la couleur spécifiée
 * @param {string} color - La couleur au format hexadécimal
 */
function updateColorPicker(color) {
    // Mettre à jour l'état
    state.currentColor = color;
    
    // Mettre à jour l'aperçu
    const colorPreview = document.getElementById('colorPreview');
    colorPreview.style.backgroundColor = color;
    
    // Mettre à jour les champs de valeur
    updateColorValues(color);
    
    // Ajouter à l'historique
    addToColorHistory(color);
}

/**
 * Met à jour les valeurs de couleur dans les différents formats
 * @param {string} hexColor - La couleur au format hexadécimal
 */
function updateColorValues(hexColor) {
    // Mettre à jour le champ hexadécimal
    document.getElementById('colorHex').value = hexColor;
    
    // Convertir en RGB
    const rgb = hexToRgb(hexColor);
    document.getElementById('colorRgb').value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    
    // Convertir en HSL
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    document.getElementById('colorHsl').value = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
}

/**
 * Convertit une couleur hexadécimale en RGB
 * @param {string} hex - La couleur au format hexadécimal
 * @returns {Object} - Les composantes RGB
 */
function hexToRgb(hex) {
    // Supprimer le # si présent
    hex = hex.replace(/^#/, '');
    
    // Convertir en RGB
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    
    return { r, g, b };
}

/**
 * Convertit une couleur RGB en HSL
 * @param {number} r - Composante rouge (0-255)
 * @param {number} g - Composante verte (0-255)
 * @param {number} b - Composante bleue (0-255)
 * @returns {Object} - Les composantes HSL
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatique
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
    }
    
    return {
        h: h * 360,
        s: s * 100,
        l: l * 100
    };
}

/**
 * Copie la valeur de couleur dans le presse-papiers
 * @param {string} format - Le format à copier (Hex, Rgb, Hsl)
 */
function copyColorValue(format) {
    const element = document.getElementById(`color${format}`);
    element.select();
    document.execCommand('copy');
    
    // Afficher une notification
    showNotification(`Valeur ${format} copiée dans le presse-papiers`, 'success');
}

/**
 * Ajoute une couleur à l'historique
 * @param {string} color - La couleur au format hexadécimal
 */
function addToColorHistory(color) {
    // Éviter les doublons
    if (state.history.includes(color)) return;
    
    // Ajouter au début de l'historique
    state.history.unshift(color);
    
    // Limiter la taille de l'historique
    if (state.history.length > 20) {
        state.history = state.history.slice(0, 20);
    }
    
    // Sauvegarder l'historique
    saveColorHistory();
    
    // Mettre à jour l'affichage
    updateColorHistoryDisplay();
}

/**
 * Met à jour l'affichage de l'historique des couleurs
 */
function updateColorHistoryDisplay() {
    const historyContainer = document.getElementById('colorHistory');
    historyContainer.innerHTML = '';
    
    if (state.history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">Aucun historique</div>';
        return;
    }
    
    state.history.forEach(color => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.style.backgroundColor = color;
        item.title = color;
        item.onclick = () => updateColorPicker(color);
        
        historyContainer.appendChild(item);
    });
}

/**
 * Efface l'historique des couleurs
 */
function clearColorHistory() {
    state.history = [];
    saveColorHistory();
    updateColorHistoryDisplay();
    showNotification('Historique des couleurs effacé', 'info');
}

/**
 * Sauvegarde l'historique des couleurs dans le stockage local
 */
function saveColorHistory() {
    localStorage.setItem('colorHistory', JSON.stringify(state.history));
}

/**
 * Charge l'historique des couleurs depuis le stockage local
 */
function loadColorHistory() {
    const savedHistory = localStorage.getItem('colorHistory');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
        updateColorHistoryDisplay();
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

// Initialiser le sélecteur de couleurs au chargement du document
document.addEventListener('DOMContentLoaded', initColorPicker);

// Exposer les fonctions globalement
window.updateColorPicker = updateColorPicker;
window.copyColorValue = copyColorValue;
window.clearColorHistory = clearColorHistory;
