/**
 * Module de génération de mots de passe
 * Gère la génération de mots de passe sécurisés et l'évaluation de leur force
 */

// Caractères disponibles pour la génération de mots de passe
const CHARS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Configuration par défaut
const DEFAULT_CONFIG = {
    length: 12,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false
};

// État du générateur
let state = {
    config: {...DEFAULT_CONFIG},
    generatedPassword: '',
    passwordStrength: 0,
    history: []
};

/**
 * Initialise le générateur de mots de passe
 */
function initPasswordGenerator() {
    // Vérifier si les éléments existent
    const container = document.getElementById('passwordGenerator');
    
    if (!container) {
        console.log('Le générateur de mot de passe n\'est pas présent dans la page actuelle');
        return;
    }
    
    const lengthSlider = document.getElementById('passwordLength');
    const lengthValue = document.getElementById('lengthValue');
    const generateBtn = document.getElementById('generatePassword');
    const passwordOutput = document.getElementById('generatedPassword');
    
    if (!lengthSlider || !lengthValue || !generateBtn || !passwordOutput) {
        console.log('Éléments du générateur de mot de passe manquants dans la page');
        return;
    }
    
    // Charger l'historique depuis le stockage local
    loadPasswordHistory();
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
    
    // Générer un mot de passe initial
    generatePassword();
    
    console.log('Générateur de mot de passe initialisé');
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    const lengthSlider = document.getElementById('passwordLength');
    const uppercaseCheck = document.getElementById('useUppercase');
    const lowercaseCheck = document.getElementById('useLowercase');
    const numbersCheck = document.getElementById('useNumbers');
    const symbolsCheck = document.getElementById('useSpecial');
    const generateBtn = document.getElementById('generatePassword');
    const copyBtn = document.getElementById('copyPassword');
    
    if (!lengthSlider || !uppercaseCheck || !lowercaseCheck || !numbersCheck || 
        !symbolsCheck || !generateBtn || !copyBtn) {
        return;
    }
    
    // Écouteur pour le slider de longueur
    lengthSlider.addEventListener('input', updateLengthValue);
    
    // Écouteurs pour les options
    uppercaseCheck.addEventListener('change', updateOptions);
    lowercaseCheck.addEventListener('change', updateOptions);
    numbersCheck.addEventListener('change', updateOptions);
    symbolsCheck.addEventListener('change', updateOptions);
    
    // Écouteur pour le bouton de génération
    generateBtn.addEventListener('click', generatePassword);
    
    // Écouteur pour le bouton de copie
    copyBtn.addEventListener('click', copyPassword);
}

/**
 * Met à jour la valeur affichée de la longueur du mot de passe
 */
function updateLengthValue() {
    const length = document.getElementById('passwordLength').value;
    const display = document.getElementById('lengthValue');
    
    if (!display) return;
    
    display.textContent = `${length} caractères`;
    state.config.length = parseInt(length);
}

/**
 * Met à jour les options du générateur
 */
function updateOptions() {
    const uppercaseCheck = document.getElementById('useUppercase');
    const lowercaseCheck = document.getElementById('useLowercase');
    const numbersCheck = document.getElementById('useNumbers');
    const symbolsCheck = document.getElementById('useSpecial');
    
    if (!uppercaseCheck || !lowercaseCheck || !numbersCheck || !symbolsCheck) {
        return;
    }
    
    state.config.uppercase = uppercaseCheck.checked;
    state.config.lowercase = lowercaseCheck.checked;
    state.config.numbers = numbersCheck.checked;
    state.config.symbols = symbolsCheck.checked;
    
    // S'assurer qu'au moins une option est sélectionnée
    if (!state.config.uppercase && !state.config.lowercase && 
        !state.config.numbers && !state.config.symbols) {
        lowercaseCheck.checked = true;
        state.config.lowercase = true;
    }
}

/**
 * Génère un mot de passe aléatoire selon les options définies
 */
function generatePassword() {
    // Mettre à jour les options
    updateOptions();
    updateLengthValue();
    
    // Construire la chaîne de caractères disponibles
    let availableChars = '';
    if (state.config.uppercase) availableChars += CHARS.uppercase;
    if (state.config.lowercase) availableChars += CHARS.lowercase;
    if (state.config.numbers) availableChars += CHARS.numbers;
    if (state.config.symbols) availableChars += CHARS.special;
    
    // Générer le mot de passe
    let password = '';
    for (let i = 0; i < state.config.length; i++) {
        const randomIndex = Math.floor(Math.random() * availableChars.length);
        password += availableChars[randomIndex];
    }
    
    // Vérifier que le mot de passe contient au moins un caractère de chaque type sélectionné
    let isValid = true;
    if (state.config.uppercase && !/[A-Z]/.test(password)) isValid = false;
    if (state.config.lowercase && !/[a-z]/.test(password)) isValid = false;
    if (state.config.numbers && !/[0-9]/.test(password)) isValid = false;
    if (state.config.symbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) isValid = false;
    
    // Régénérer si le mot de passe n'est pas valide
    if (!isValid) {
        return generatePassword();
    }
    
    // Afficher le mot de passe
    const passwordOutput = document.getElementById('generatedPassword');
    if (passwordOutput) {
        passwordOutput.value = password;
        state.generatedPassword = password;
    }
    
    // Évaluer la force du mot de passe
    evaluatePasswordStrength(password);
    
    // Ajouter à l'historique
    addToPasswordHistory(password);
    
    return password;
}

/**
 * Évalue la force du mot de passe
 * @param {string} password - Le mot de passe à évaluer
 */
function evaluatePasswordStrength(password) {
    const strengthMeter = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthMeter || !strengthText) return;
    
    // Critères
    const length = password.length;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);
    const hasRepeatingChars = /(.).*\1/.test(password);
    
    // Calcul du score (0-100)
    let score = 0;
    
    // Longueur
    score += Math.min(length * 4, 40);
    
    // Diversité de caractères
    if (hasUppercase) score += 10;
    if (hasLowercase) score += 10;
    if (hasNumbers) score += 10;
    if (hasSymbols) score += 20;
    
    // Pénalités
    if (hasRepeatingChars) score -= 10;
    
    // Ajuster le score final
    score = Math.max(0, Math.min(score, 100));
    
    // Mettre à jour l'affichage
    strengthMeter.value = score;
    
    // Définir le niveau de force
    let strengthLevel;
    if (score < 30) {
        strengthLevel = 'Très faible';
        strengthText.style.color = '#ff4136';
    } else if (score < 50) {
        strengthLevel = 'Faible';
        strengthText.style.color = '#ff851b';
    } else if (score < 70) {
        strengthLevel = 'Moyen';
        strengthText.style.color = '#ffdc00';
    } else if (score < 90) {
        strengthLevel = 'Fort';
        strengthText.style.color = '#2ecc40';
    } else {
        strengthLevel = 'Très fort';
        strengthText.style.color = '#4d4dff';
    }
    
    strengthText.textContent = strengthLevel;
    state.passwordStrength = score;
}

/**
 * Copie le mot de passe généré dans le presse-papiers
 */
function copyPassword() {
    const passwordOutput = document.getElementById('generatedPassword');
    
    if (!passwordOutput) return;
    
    passwordOutput.select();
    document.execCommand('copy');
    
    // Afficher une notification
    const notification = document.querySelector('.password-notification');
    if (notification) {
        notification.textContent = 'Mot de passe copié dans le presse-papiers';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
}

/**
 * Ajoute un mot de passe à l'historique
 * @param {string} password - Le mot de passe à ajouter
 */
function addToPasswordHistory(password) {
    // Éviter les doublons
    if (state.history.includes(password)) return;
    
    // Ajouter au début de l'historique
    state.history.unshift(password);
    
    // Limiter la taille de l'historique
    if (state.history.length > 10) {
        state.history = state.history.slice(0, 10);
    }
    
    // Sauvegarder l'historique
    savePasswordHistory();
    
    // Mettre à jour l'affichage
    updatePasswordHistoryDisplay();
}

/**
 * Met à jour l'affichage de l'historique des mots de passe
 */
function updatePasswordHistoryDisplay() {
    const historyContainer = document.getElementById('passwordHistory');
    historyContainer.innerHTML = '';
    
    if (state.history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">Aucun historique</div>';
        return;
    }
    
    state.history.forEach(password => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const passwordText = document.createElement('span');
        passwordText.textContent = password;
        item.appendChild(passwordText);
        
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.className = 'copy-btn';
        copyBtn.title = 'Copier';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(password);
            showNotification('Mot de passe copié dans le presse-papiers', 'success');
        };
        item.appendChild(copyBtn);
        
        historyContainer.appendChild(item);
    });
}

/**
 * Efface l'historique des mots de passe
 */
function clearPasswordHistory() {
    state.history = [];
    savePasswordHistory();
    updatePasswordHistoryDisplay();
    showNotification('Historique des mots de passe effacé', 'info');
}

/**
 * Sauvegarde l'historique des mots de passe dans le stockage local
 */
function savePasswordHistory() {
    localStorage.setItem('passwordHistory', JSON.stringify(state.history));
}

/**
 * Charge l'historique des mots de passe depuis le stockage local
 */
function loadPasswordHistory() {
    const savedHistory = localStorage.getItem('passwordHistory');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
        updatePasswordHistoryDisplay();
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

// Initialiser le générateur de mot de passe seulement quand le DOM est complètement chargé
// et seulement si nous sommes sur la page du générateur
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('passwordGenerator')) {
        initPasswordGenerator();
    }
});

// Exposer les fonctions globalement
window.generatePassword = generatePassword;
window.copyPassword = copyPassword;
window.clearPasswordHistory = clearPasswordHistory;
