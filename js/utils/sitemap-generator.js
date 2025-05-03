/**
 * Générateur de sitemap pour améliorer le SEO du site
 * Ce script peut être exécuté côté serveur (Node.js) ou
 * être utilisé pour générer un sitemap statique
 */

/**
 * Structure d'une URL de sitemap
 * @typedef {Object} SitemapUrl
 * @property {string} url - URL complète de la page
 * @property {string} [lastmod] - Date de dernière modification (format ISO)
 * @property {string} [changefreq] - Fréquence de modification (always, hourly, daily, weekly, monthly, yearly, never)
 * @property {number} [priority] - Priorité de la page (0.0 à 1.0)
 */

class SitemapGenerator {
    /**
     * Initialise le générateur de sitemap
     * @param {Object} options - Options de configuration
     * @param {string} options.baseUrl - URL de base du site (ex: https://outilspratiques.github.io)
     * @param {string} [options.defaultChangefreq='monthly'] - Fréquence de modification par défaut
     * @param {number} [options.defaultPriority=0.5] - Priorité par défaut
     */
    constructor(options) {
        if (!options || !options.baseUrl) {
            throw new Error('L\'URL de base est requise pour le générateur de sitemap');
        }

        this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Supprimer le slash final s'il existe
        this.defaultChangefreq = options.defaultChangefreq || 'monthly';
        this.defaultPriority = options.defaultPriority || 0.5;
        this.urls = [];
    }

    /**
     * Ajoute une URL au sitemap
     * @param {string|SitemapUrl} url - URL à ajouter ou objet URL
     * @param {string} [lastmod] - Date de dernière modification (format ISO)
     * @param {string} [changefreq] - Fréquence de modification
     * @param {number} [priority] - Priorité de la page
     * @returns {SitemapGenerator} - L'instance courante pour chaînage
     */
    addUrl(url, lastmod, changefreq, priority) {
        // Si l'URL est déjà un objet complet
        if (typeof url === 'object' && url.url) {
            this.urls.push({
                url: this._formatUrl(url.url),
                lastmod: url.lastmod || this._getCurrentDate(),
                changefreq: url.changefreq || this.defaultChangefreq,
                priority: url.priority || this.defaultPriority
            });
            return this;
        }

        // Si l'URL est une chaîne
        this.urls.push({
            url: this._formatUrl(url),
            lastmod: lastmod || this._getCurrentDate(),
            changefreq: changefreq || this.defaultChangefreq,
            priority: priority || this.defaultPriority
        });

        return this;
    }

    /**
     * Ajoute plusieurs URLs au sitemap
     * @param {Array<string|SitemapUrl>} urls - Tableau d'URLs ou d'objets URL
     * @returns {SitemapGenerator} - L'instance courante pour chaînage
     */
    addUrls(urls) {
        if (!Array.isArray(urls)) {
            throw new Error('Le paramètre urls doit être un tableau');
        }

        urls.forEach(url => {
            if (typeof url === 'string') {
                this.addUrl(url);
            } else {
                this.addUrl(url);
            }
        });

        return this;
    }

    /**
     * Génère automatiquement des URLs pour les outils disponibles
     * @param {Array<string>} toolIds - IDs des outils disponibles
     * @param {number} [priority=0.8] - Priorité des pages d'outils
     * @returns {SitemapGenerator} - L'instance courante pour chaînage
     */
    addToolUrls(toolIds, priority = 0.8) {
        toolIds.forEach(toolId => {
            this.addUrl(`outils.html#${toolId}`, null, 'weekly', priority);
        });
        return this;
    }

    /**
     * Formate correctement une URL en la complétant avec l'URL de base si nécessaire
     * @param {string} url - URL à formater
     * @returns {string} - URL formatée
     * @private
     */
    _formatUrl(url) {
        // Si l'URL est déjà absolue
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Si l'URL commence par un slash, le supprimer
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return `${this.baseUrl}/${cleanUrl}`;
    }

    /**
     * Obtient la date courante au format ISO
     * @returns {string} - Date au format ISO (YYYY-MM-DD)
     * @private
     */
    _getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Génère le contenu XML du sitemap
     * @returns {string} - Contenu XML du sitemap
     */
    generateXml() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        this.urls.forEach(url => {
            xml += '  <url>\n';
            xml += `    <loc>${this._escapeXml(url.url)}</loc>\n`;
            
            if (url.lastmod) {
                xml += `    <lastmod>${this._escapeXml(url.lastmod)}</lastmod>\n`;
            }
            
            if (url.changefreq) {
                xml += `    <changefreq>${this._escapeXml(url.changefreq)}</changefreq>\n`;
            }
            
            if (url.priority !== undefined) {
                xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
            }
            
            xml += '  </url>\n';
        });

        xml += '</urlset>';
        return xml;
    }

    /**
     * Échappe les caractères spéciaux XML
     * @param {string} str - Chaîne à échapper
     * @returns {string} - Chaîne échappée
     * @private
     */
    _escapeXml(str) {
        return str.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&apos;');
    }

    /**
     * Génère le sitemap et le télécharge (utilisation côté client)
     */
    downloadSitemap() {
        const xml = this.generateXml();
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * Analyse la structure du site et ajoute automatiquement les pages
     * @param {Object} [options] - Options d'analyse
     * @param {boolean} [options.includeHash=true] - Inclure les URLs avec hash (#)
     * @returns {Promise<SitemapGenerator>} - L'instance courante pour chaînage
     */
    async autoDiscover(options = {}) {
        const includeHash = options.includeHash !== false;
        
        // Ici, vous pourriez implémenter une logique pour parcourir les pages du site
        // et découvrir automatiquement les URLs
        
        // Par exemple, pour une application monopage (SPA) :
        if (typeof document !== 'undefined') {
            // Récupérer tous les liens de la page
            const links = document.querySelectorAll('a[href]');
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                
                // Ignorer les liens externes et les ancres vides
                if (href && !href.startsWith('http') && href !== '#') {
                    if (href.includes('#')) {
                        if (includeHash) {
                            this.addUrl(href);
                        }
                    } else {
                        this.addUrl(href);
                    }
                }
            });
        }
        
        return this;
    }
}

/**
 * Exemple d'utilisation du générateur de sitemap
 * @returns {string} - Contenu XML du sitemap
 */
function generateSampleSitemap() {
    const sitemapGenerator = new SitemapGenerator({
        baseUrl: 'https://outilspratiques.github.io'
    });
    
    // Ajouter les pages principales
    sitemapGenerator.addUrl('index.html', null, 'weekly', 1.0);
    sitemapGenerator.addUrl('outils.html', null, 'weekly', 0.9);
    
    // Ajouter les pages d'outils
    const toolIds = [
        'calculatorTool', 'timerTool', 'stopwatchTool', 'noteTool', 
        'colorTool', 'textEditorTool', 'percentageTool', 'unitTool',
        'currencyTool', 'qrcodeTool', 'translatorTool', 'schedulerTool'
    ];
    
    sitemapGenerator.addToolUrls(toolIds);
    
    return sitemapGenerator.generateXml();
}

// Exporter la classe et la fonction d'exemple
export { SitemapGenerator, generateSampleSitemap }; 