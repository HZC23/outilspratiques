/**
 * Gestionnaire de notifications
 * Permet d'afficher des messages à l'utilisateur
 */

import { PerformanceManager } from './performance.js';

export const NotificationManager = {
    /**
     * Affiche une notification
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type de notification (info, success, error, warning)
     * @param {number} duration - La durée d'affichage en millisecondes
     */
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="close-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée optimisée
        PerformanceManager.requestAnimationFrameOnce(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
        
        // Auto-suppression
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },
    
    /**
     * Retourne l'icône correspondant au type de notification
     * @param {string} type - Le type de notification
     * @returns {string} - Le nom de l'icône
     */
    getIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    },
    
    /**
     * Affiche une notification de succès
     * @param {string} message - Le message à afficher
     * @param {number} duration - La durée d'affichage en millisecondes
     */
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    
    /**
     * Affiche une notification d'erreur
     * @param {string} message - Le message à afficher
     * @param {number} duration - La durée d'affichage en millisecondes
     */
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    },
    
    /**
     * Affiche une notification d'avertissement
     * @param {string} message - Le message à afficher
     * @param {number} duration - La durée d'affichage en millisecondes
     */
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    },
    
    /**
     * Affiche une notification d'information
     * @param {string} message - Le message à afficher
     * @param {number} duration - La durée d'affichage en millisecondes
     */
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}; 