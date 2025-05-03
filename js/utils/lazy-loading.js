/**
 * Module de chargement différé (lazy loading) pour les images et autres ressources
 * Utilise l'API IntersectionObserver pour charger les ressources lorsqu'elles entrent dans le viewport
 */

class LazyLoader {
    constructor(options = {}) {
        // Options par défaut
        this.options = {
            rootMargin: '200px 0px', // Marge autour du viewport pour précharger les ressources
            threshold: 0.1,          // Pourcentage de visibilité avant chargement
            selector: '[data-src], [data-srcset], [data-background-src]', // Sélecteurs pour les éléments à charger
            placeholderSrc: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"%3E%3Crect width="300" height="150" fill="%23f0f0f0"/%3E%3C/svg%3E',
            ...options
        };

        // Vérifier si IntersectionObserver est supporté
        this.supportsIntersectionObserver = 'IntersectionObserver' in window;
        
        // Initialiser l'observer
        if (this.supportsIntersectionObserver) {
            this.observer = new IntersectionObserver(this._onIntersection.bind(this), {
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            });
        }
    }

    /**
     * Initialise le lazy loading pour tous les éléments correspondant au sélecteur
     */
    init() {
        const elements = document.querySelectorAll(this.options.selector);
        
        if (this.supportsIntersectionObserver) {
            // Utiliser l'IntersectionObserver si supporté
            elements.forEach(element => {
                this._prepareElement(element);
                this.observer.observe(element);
            });
        } else {
            // Fallback pour les navigateurs qui ne supportent pas IntersectionObserver
            this._loadAllElements(elements);
        }

        // Retourner le nombre d'éléments trouvés
        return elements.length;
    }

    /**
     * Prépare un élément pour le lazy loading
     * @param {HTMLElement} element - L'élément à préparer
     */
    _prepareElement(element) {
        // Ajouter une classe pour identifier les éléments non chargés
        element.classList.add('lazy-load');

        // Pour les images, ajouter un placeholder
        if (element.tagName === 'IMG') {
            // Sauvegarder les attributs alt et title originaux
            const alt = element.getAttribute('alt') || '';
            const title = element.getAttribute('title') || '';
            
            // Ajouter un attribut aria-busy pour indiquer le chargement
            element.setAttribute('aria-busy', 'true');
            
            // Ajouter un placeholder si l'image n'a pas déjà une src
            if (!element.src || element.src === '') {
                element.src = this.options.placeholderSrc;
            }
            
            // S'assurer que l'image a un attribut alt
            if (!element.hasAttribute('alt')) {
                element.setAttribute('alt', 'Image en cours de chargement');
            }
        }

        // Pour les éléments avec background-image
        if (element.hasAttribute('data-background-src')) {
            // Ajouter une classe pour indiquer que le fond n'est pas encore chargé
            element.classList.add('lazy-background');
        }
    }

    /**
     * Callback appelé quand un élément entre dans le viewport
     * @param {IntersectionObserverEntry[]} entries - Les entrées observées
     */
    _onIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Charger l'élément lorsqu'il est visible
                this._loadElement(entry.target);
                // Arrêter d'observer cet élément
                this.observer.unobserve(entry.target);
            }
        });
    }

    /**
     * Charge les ressources d'un élément spécifique
     * @param {HTMLElement} element - L'élément à charger
     */
    _loadElement(element) {
        // Pour les images
        if (element.hasAttribute('data-src')) {
            const src = element.getAttribute('data-src');
            
            // Créer une image temporaire pour précharger
            const tempImage = new Image();
            
            tempImage.onload = () => {
                element.src = src;
                element.removeAttribute('data-src');
                element.classList.remove('lazy-load');
                element.classList.add('lazy-loaded');
                element.setAttribute('aria-busy', 'false');
            };
            
            tempImage.onerror = () => {
                console.error(`Erreur de chargement de l'image: ${src}`);
                element.setAttribute('aria-busy', 'false');
                // Ajouter une classe pour indiquer une erreur
                element.classList.add('lazy-error');
            };
            
            tempImage.src = src;
        }
        
        // Pour les images avec srcset
        if (element.hasAttribute('data-srcset')) {
            element.srcset = element.getAttribute('data-srcset');
            element.removeAttribute('data-srcset');
        }
        
        // Pour les éléments avec background-image
        if (element.hasAttribute('data-background-src')) {
            const src = element.getAttribute('data-background-src');
            
            // Créer une image temporaire pour précharger
            const tempImage = new Image();
            
            tempImage.onload = () => {
                element.style.backgroundImage = `url(${src})`;
                element.removeAttribute('data-background-src');
                element.classList.remove('lazy-background');
                element.classList.add('lazy-background-loaded');
            };
            
            tempImage.onerror = () => {
                console.error(`Erreur de chargement de l'image de fond: ${src}`);
                element.classList.add('lazy-background-error');
            };
            
            tempImage.src = src;
        }
    }

    /**
     * Charge tous les éléments (fallback pour navigateurs sans IntersectionObserver)
     * @param {NodeList} elements - Liste des éléments à charger
     */
    _loadAllElements(elements) {
        elements.forEach(element => {
            this._loadElement(element);
        });
    }

    /**
     * Ajoute de nouveaux éléments après l'initialisation
     * @param {HTMLElement|HTMLElement[]} elements - Élément(s) à ajouter
     */
    observe(elements) {
        if (!elements) return;
        
        // Convertir un seul élément en tableau
        const elementArray = Array.isArray(elements) ? elements : [elements];
        
        elementArray.forEach(element => {
            if (this.supportsIntersectionObserver) {
                this._prepareElement(element);
                this.observer.observe(element);
            } else {
                this._loadElement(element);
            }
        });
    }

    /**
     * Force le chargement de tous les éléments, même s'ils ne sont pas visibles
     */
    loadAll() {
        const elements = document.querySelectorAll(this.options.selector);
        this._loadAllElements(elements);
    }

    /**
     * Arrête d'observer tous les éléments
     */
    disconnect() {
        if (this.supportsIntersectionObserver && this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Crée un nouvel attribut src avec chargement différé pour une image
 * @param {string} src - URL de l'image à charger
 * @param {Object} options - Options supplémentaires (width, height, alt, etc.)
 * @returns {string} - Chaîne HTML pour l'image avec lazy loading
 */
function createLazyImage(src, options = {}) {
    const { width, height, alt = '', className = '', placeholderSrc = null } = options;
    
    const widthAttr = width ? ` width="${width}"` : '';
    const heightAttr = height ? ` height="${height}"` : '';
    const classAttr = className ? ` class="${className} lazy-load"` : ' class="lazy-load"';
    const placeholder = placeholderSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"%3E%3Crect width="300" height="150" fill="%23f0f0f0"/%3E%3C/svg%3E';
    
    return `<img src="${placeholder}" data-src="${src}" alt="${alt}"${widthAttr}${heightAttr}${classAttr} loading="lazy" aria-busy="true">`;
}

// Exporter les méthodes et classes du module
export { LazyLoader, createLazyImage }; 