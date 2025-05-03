#!/usr/bin/env node

/**
 * Script indépendant de génération de sitemap.
 * Peut être exécuté directement avec node js/utils/sitemap-cli.js
 */

console.log('Démarrage de la génération du sitemap...');

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const BASE_URL = 'https://outilspratiques.github.io';
const OUTPUT_FILE = path.join(process.cwd(), 'sitemap.xml');
const EXTENSIONS_TO_INCLUDE = ['.html', '.htm', '.pdf'];
const DIRECTORY_EXCLUDES = ['.git', '.github', '.vscode', 'node_modules', 'dist'];
const FILE_EXCLUDES = [];

// Pages principales et priorités
const MAIN_PAGES = [
  { url: 'index.html', priority: 1.0, changefreq: 'weekly' },
  { url: 'outils.html', priority: 0.9, changefreq: 'weekly' },
  { url: '404.html', priority: 0.3, changefreq: 'yearly' },
  { url: 'plan-amelioration.html', priority: 0.6, changefreq: 'monthly' }
];

// Outils disponibles (sections dans outils.html)
const TOOLS = [
  { id: 'calculatorTool', priority: 0.8 },
  { id: 'timerTool', priority: 0.8 },
  { id: 'stopwatchTool', priority: 0.8 },
  { id: 'noteTool', priority: 0.8 },
  { id: 'colorTool', priority: 0.8 },
  { id: 'textEditorTool', priority: 0.8 },
  { id: 'percentageTool', priority: 0.8 },
  { id: 'unitTool', priority: 0.8 },
  { id: 'currencyTool', priority: 0.8 },
  { id: 'qrcodeTool', priority: 0.8 },
  { id: 'translatorTool', priority: 0.8 },
  { id: 'schedulerTool', priority: 0.8 },
  { id: 'todoTool', priority: 0.8 },
  { id: 'randomTool', priority: 0.7 },
  { id: 'metronome', priority: 0.7 },
  { id: 'passwordTool', priority: 0.8 }
];

// Date de la dernière modification
const CURRENT_DATE = new Date().toISOString().split('T')[0];

/**
 * Génère le contenu XML du sitemap
 */
function generateSitemapXML() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Ajouter les pages principales
  MAIN_PAGES.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/${page.url}</loc>\n`;
    xml += `    <lastmod>${CURRENT_DATE}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority.toFixed(1)}</priority>\n`;
    xml += '  </url>\n';
  });

  // Ajouter les URLs des outils
  TOOLS.forEach(tool => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/outils.html#${tool.id}</loc>\n`;
    xml += `    <lastmod>${CURRENT_DATE}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${tool.priority.toFixed(1)}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

/**
 * Écrit le fichier sitemap.xml
 */
function writeSitemap() {
  const xml = generateSitemapXML();
  
  try {
    fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
    console.log(`✅ Sitemap généré avec succès à ${OUTPUT_FILE}`);
    console.log(`📄 Total d'URLs: ${MAIN_PAGES.length + TOOLS.length}`);
    console.log(`📅 Date de mise à jour: ${CURRENT_DATE}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'écriture du sitemap:', error);
    return false;
  }
}

// Exécuter la génération
writeSitemap(); 