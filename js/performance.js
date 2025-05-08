/**
 * Gestionnaire de performance
 * Fournit des utilitaires pour optimiser les performances
 */
export const PerformanceManager = {
    /**
     * Limite la fréquence d'exécution d'une fonction
     * @param {Function} func - La fonction à exécuter
     * @param {number} wait - Le délai d'attente en millisecondes
     * @returns {Function} - La fonction avec délai
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Limite la fréquence d'exécution d'une fonction à une fois par période
     * @param {Function} func - La fonction à exécuter
     * @param {number} limit - La période minimale entre deux exécutions en millisecondes
     * @returns {Function} - La fonction avec limite
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Exécute une fonction lors du prochain rafraîchissement d'écran
     * @param {Function} func - La fonction à exécuter
     * @returns {number} - L'identifiant de la requête d'animation
     */
    requestAnimationFrameOnce(func) {
        let rafId = null;
        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                func();
                rafId = null;
            });
        }
        return rafId;
    },
    
    /**
     * Limite le taux de rafraîchissement des animations à 60 FPS
     * Particulièrement utile sur mobile pour améliorer les performances
     * @param {Function} animationFunc - La fonction d'animation à exécuter
     * @param {number} targetFPS - Le taux de rafraîchissement cible (défaut: 60)
     * @returns {Function} - Fonction qui démarre l'animation limitée
     */
    frameRateLimiter(animationFunc, targetFPS = 60) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Si ce n'est pas un mobile, utiliser requestAnimationFrame standard
        if (!isMobile) {
            return () => {
                let animationId;
                const animate = (timestamp) => {
                    animationFunc(timestamp);
                    animationId = requestAnimationFrame(animate);
                };
                animationId = requestAnimationFrame(animate);
                
                // Retourner une fonction pour arrêter l'animation
                return () => {
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                };
            };
        }
        
        // Pour mobile, limiter à 60 FPS
        return () => {
            let animationId;
            let lastTime = 0;
            const interval = 1000 / targetFPS; // Intervalle en ms pour atteindre le FPS cible
            
            const animate = (timestamp) => {
                animationId = requestAnimationFrame(animate);
                
                const deltaTime = timestamp - lastTime;
                if (deltaTime >= interval) {
                    // Ajuster le timestamp pour compenser le décalage
                    lastTime = timestamp - (deltaTime % interval);
                    animationFunc(timestamp);
                }
            };
            
            animationId = requestAnimationFrame(animate);
            
            // Retourner une fonction pour arrêter l'animation
            return () => {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            };
        };
    },
    
    /**
     * Mesure le temps d'exécution d'une fonction
     * @param {Function} func - La fonction à mesurer
     * @param {string} label - Le libellé pour l'affichage
     * @returns {*} - Le résultat de la fonction
     */
    measure(func, label = 'Performance') {
        console.time(label);
        const result = func();
        console.timeEnd(label);
        return result;
    },
    
    /**
     * Exécute une fonction en différé
     * @param {Function} func - La fonction à exécuter
     * @param {number} delay - Le délai en millisecondes
     */
    defer(func, delay = 0) {
        setTimeout(func, delay);
    },
    
    /**
     * Exécute une fonction lorsque le navigateur est inactif
     * @param {Function} func - La fonction à exécuter
     */
    idle(func) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(func);
        } else {
            setTimeout(func, 1);
        }
    },
    
    /**
     * Initialise le gestionnaire de performance
     */
    init() {
        console.log('Initialisation du gestionnaire de performance');
        // Pas d'étapes d'initialisation spécifiques nécessaires pour ce gestionnaire pour l'instant.
    }
}; 