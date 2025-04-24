function formatNumber(number, precision = 10) {
    number = typeof number === 'string' ? parseFloat(number) : number;
    
    if (isNaN(number)) return 'Non défini';
    if (!isFinite(number)) return number < 0 ? '-Infini' : 'Infini';
    
    if (Math.abs(number) < 1e-10) return '0';
    
    let result = number.toPrecision(precision);
    
    // Supprimer les zéros inutiles et le point décimal si entier
    result = result.replace(/\.?0+$/, '');
    
    // Si le nombre est très grand ou très petit, utiliser la notation scientifique
    if (Math.abs(number) > 1e12 || (Math.abs(number) < 1e-6 && Math.abs(number) > 0)) {
        result = number.toExponential(precision - 1).replace(/\.?0+e/, 'e');
    }
    
    return result;
}

// Évaluer une expression mathématique
function evaluateExpression(expression) {
    try {
        // Sécuriser l'évaluation en remplaçant les fonctions dangereuses
        expression = expression
            .replace(/Math\./g, '')
            .replace(/eval\(/g, '')
            .replace(/Function\(/g, '')
            .replace(/new Function/g, '')
            .replace(/setTimeout/g, '')
            .replace(/setInterval/g, '')
            .replace(/fetch/g, '')
            .replace(/XMLHttpRequest/g, '');
        
        // Remplacer les fonctions mathématiques courantes
        expression = expression
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/abs\(/g, 'Math.abs(')
            .replace(/pow\(/g, 'Math.pow(')
            .replace(/pi/gi, 'Math.PI')
            .replace(/e(?![a-zA-Z0-9])/g, 'Math.E');
        
        // Évaluer l'expression sécurisée
        return eval(expression);
    } catch (error) {
        console.error('Erreur d\'évaluation:', error);
        return NaN;
    }
}

// Calculer le pourcentage
function calculatePercentage(base, percentage) {
    return (base * percentage) / 100;
}

// Exposer les fonctions globalement pour une utilisation dans les balises script
window.calculatorUtils = {
    formatNumber,
    evaluateExpression,
    calculatePercentage
}; 