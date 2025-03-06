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

// État du générateur
let state = {
    history: [],
    lastPassword: '',
    options: {
        length: 16,
        useUppercase: true,
        useLowercase: true,
        useNumbers: true,
        useSpecial: true
    }
};

/**
 * Initialise le générateur de mots de passe
 */
function initPasswordGenerator() {
    // Charger l'historique depuis le stockage local
    loadPasswordHistory();
    
    // Initialiser les écouteurs d'événements
    document.getElementById('passwordLength').addEventListener('input', updateLengthValue);
    document.getElementById('useUppercase').addEventListener('change', updateOptions);
    document.getElementById('useLowercase').addEventListener('change', updateOptions);
    document.getElementById('useNumbers').addEventListener('change', updateOptions);
    document.getElementById('useSpecial').addEventListener('change', updateOptions);
    
    // Générer un mot de passe initial
    generatePassword();
    
    console.log('Générateur de mots de passe initialisé');
}

/**
 * Met à jour la valeur affichée de la longueur du mot de passe
 */
function updateLengthValue() {
    const length = document.getElementById('passwordLength').value;
    document.getElementById('lengthValue').textContent = `${length} caractères`;
    state.options.length = parseInt(length);
}

/**
 * Met à jour les options du générateur
 */
function updateOptions() {
    state.options.useUppercase = document.getElementById('useUppercase').checked;
    state.options.useLowercase = document.getElementById('useLowercase').checked;
    state.options.useNumbers = document.getElementById('useNumbers').checked;
    state.options.useSpecial = document.getElementById('useSpecial').checked;
    
    // S'assurer qu'au moins une option est sélectionnée
    if (!state.options.useUppercase && !state.options.useLowercase && 
        !state.options.useNumbers && !state.options.useSpecial) {
        document.getElementById('useLowercase').checked = true;
        state.options.useLowercase = true;
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
    if (state.options.useUppercase) availableChars += CHARS.uppercase;
    if (state.options.useLowercase) availableChars += CHARS.lowercase;
    if (state.options.useNumbers) availableChars += CHARS.numbers;
    if (state.options.useSpecial) availableChars += CHARS.special;
    
    // Générer le mot de passe
    let password = '';
    for (let i = 0; i < state.options.length; i++) {
        const randomIndex = Math.floor(Math.random() * availableChars.length);
        password += availableChars[randomIndex];
    }
    
    // Vérifier que le mot de passe contient au moins un caractère de chaque type sélectionné
    let isValid = true;
    if (state.options.useUppercase && !/[A-Z]/.test(password)) isValid = false;
    if (state.options.useLowercase && !/[a-z]/.test(password)) isValid = false;
    if (state.options.useNumbers && !/[0-9]/.test(password)) isValid = false;
    if (state.options.useSpecial && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) isValid = false;
    
    // Régénérer si le mot de passe n'est pas valide
    if (!isValid) {
        return generatePassword();
    }
    
    // Afficher le mot de passe
    document.getElementById('generatedPassword').value = password;
    state.lastPassword = password;
    
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
    let score = 0;
    
    // Longueur (jusqu'à 40 points)
    score += Math.min(40, password.length * 2.5);
    
    // Variété de caractères (jusqu'à 60 points)
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 15;
    
    // Complexité supplémentaire
    if (/[A-Z].*[A-Z]/.test(password)) score += 5;
    if (/[a-z].*[a-z]/.test(password)) score += 5;
    if (/[0-9].*[0-9]/.test(password)) score += 5;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?].*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 5;
    
    // Mettre à jour la barre de progression
    const strengthBar = document.getElementById('passwordStrength');
    strengthBar.value = score;
    
    // Mettre à jour le texte
    const strengthText = document.getElementById('strengthText');
    if (score < 40) {
        strengthText.textContent = 'Faible';
        strengthText.style.color = '#ff4d4d';
    } else if (score < 70) {
        strengthText.textContent = 'Moyen';
        strengthText.style.color = '#ffa64d';
    } else if (score < 90) {
        strengthText.textContent = 'Fort';
        strengthText.style.color = '#4dff4d';
    } else {
        strengthText.textContent = 'Très fort';
        strengthText.style.color = '#4d4dff';
    }
}

/**
 * Copie le mot de passe généré dans le presse-papiers
 */
function copyPassword() {
    const passwordField = document.getElementById('generatedPassword');
    passwordField.select();
    document.execCommand('copy');
    
    // Afficher une notification
    showNotification('Mot de passe copié dans le presse-papiers', 'success');
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

// Initialiser le générateur au chargement du document
document.addEventListener('DOMContentLoaded', initPasswordGenerator);

// Exposer les fonctions globalement
window.generatePassword = generatePassword;
window.copyPassword = copyPassword;
window.clearPasswordHistory = clearPasswordHistory;
