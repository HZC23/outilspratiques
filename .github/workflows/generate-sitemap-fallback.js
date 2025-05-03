/**
 * Script de génération de sitemap simplifié pour GitHub Actions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://outilspratiques.github.io';
const REPO_ROOT = process.cwd();

// Extensions de fichiers à inclure dans le sitemap
const INCLUDE_EXTENSIONS = ['.html', '.htm', '.pdf'];

// Chemins à exclure
const EXCLUDE_PATHS = [
  '/.git/',
  '/.github/',
  '/.vscode/',
  '/docs/',
  '/node_modules/'
];

/**
 * Récupérer la date de dernière modification d'un fichier via git
 */
function getLastModifiedDate(filePath) {
  try {
    const relPath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
    const dateStr = execSync(`git log -1 --format="%ad" --date=iso -- "${relPath}"`, { encoding: 'utf-8' }).trim();
    return dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Vérifier si un chemin doit être exclu
 */
function shouldExclude(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return EXCLUDE_PATHS.some(excludePath => normalizedPath.includes(excludePath));
}

/**
 * Parcourir récursivement un répertoire
 */
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

/**
 * Générer le contenu du sitemap
 */
function generateSitemap() {
  const urls = [];
  
  // Parcourir tous les fichiers du projet
  walkDir(REPO_ROOT, (filePath) => {
    if (shouldExclude(filePath)) {
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    if (!INCLUDE_EXTENSIONS.includes(ext)) {
      return;
    }
    
    // Créer l'URL relative
    let relativePath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
    
    // Traiter les fichiers index.html spécialement
    if (path.basename(filePath).toLowerCase() === 'index.html') {
      relativePath = path.dirname(relativePath);
      if (relativePath === '.') {
        relativePath = '';
      }
    }
    
    // Créer l'URL complète
    let url = `${BASE_URL}/${relativePath}`;
    url = url.replace(/\/\//g, '/').replace('https:/', 'https://');
    
    // Obtenir la date de dernière modification
    const lastmod = getLastModifiedDate(filePath);
    
    // Calculer la priorité (plus haute pour les fichiers à la racine)
    const depth = relativePath.split('/').length;
    const priority = Math.max(0.5, 1.0 - (depth * 0.1)).toFixed(1);
    
    // Définir la fréquence de changement
    const changefreq = depth <= 1 ? 'weekly' : 'monthly';
    
    urls.push({
      url,
      lastmod,
      changefreq,
      priority
    });
  });
  
  // Trier les URLs par profondeur puis alphabétiquement
  urls.sort((a, b) => {
    const depthA = a.url.split('/').length;
    const depthB = b.url.split('/').length;
    
    if (depthA !== depthB) {
      return depthA - depthB;
    }
    
    return a.url.localeCompare(b.url);
  });
  
  return urls;
}

/**
 * Générer le XML du sitemap
 */
function generateSitemapXml(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.url}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

// Générer et écrire le sitemap
const urls = generateSitemap();
const xml = generateSitemapXml(urls);
fs.writeFileSync(path.join(REPO_ROOT, 'sitemap.xml'), xml);

console.log(`Sitemap généré avec ${urls.length} URLs.`); 