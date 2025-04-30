/**
 * Fichier d'importation pour le module chronomètre
 */
import { StopwatchManager } from '../stopwatch.js';

// Initialiser le chronomètre lorsque le contenu est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que l'élément existe dans la page actuelle
    if (document.getElementById('timeCounter')) {
        console.log('Initialisation du chronomètre...');
        StopwatchManager.init();
    }
});

// Ajout d'un gestionnaire d'événements pour initialiser le chronomètre 
// lorsqu'il est chargé dynamiquement dans la page
document.addEventListener('toolLoaded', (event) => {
    if (event.detail && event.detail.toolId === 'stopwatchTool') {
        console.log('Outil chronomètre chargé, initialisation...');
        setTimeout(() => {
            StopwatchManager.init();
        }, 100);
    }
}); 