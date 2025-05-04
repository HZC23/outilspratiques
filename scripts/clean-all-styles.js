const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const componentsDir = path.join(__dirname, '../styles/components');
const toolsDir = path.join(__dirname, '../styles/tools');

// Liste des sélecteurs communs à rechercher et à supprimer dans les fichiers d'outils
const commonSelectors = {
  // Sélecteurs de boutons (from buttons.css)
  buttons: [
    '.btn',
    '.btn-primary',
    '.btn.primary',
    '.btn-secondary',
    '.btn.secondary',
    '.btn-danger',
    '.btn.danger',
    '.btn-ghost',
    '.btn.ghost',
    '.btn-icon',
    '.btn.icon',
    '.btn-sm',
    '.btn-lg',
    '.btn-block',
    '.btn-badge',
    '.btn-group',
    '.calculator-button',
    '.todo-button',
    'button[type="button"]',
    'button[type="submit"]',
    'input[type="button"]',
    'input[type="submit"]'
  ],

  // Sélecteurs de texte (from text.css)
  text: [
    '.text-primary',
    '.text-secondary',
    '.text-success',
    '.text-danger',
    '.text-warning',
    '.text-info',
    '.text-light',
    '.text-dark',
    '.text-muted',
    '.text-white',
    '.text-black',
    '.text-center',
    '.text-left',
    '.text-right',
    '.text-justify',
    '.text-uppercase',
    '.text-lowercase',
    '.text-capitalize',
    '.text-truncate',
    '.text-nowrap',
    '.text-break',
    '.font-weight-bold',
    '.font-weight-normal',
    '.font-weight-light',
    '.font-italic'
  ],

  // Sélecteurs de cartes (from tools-cards.css)
  cards: [
    '.card',
    '.card-header',
    '.card-body',
    '.card-footer',
    '.card-title',
    '.card-subtitle',
    '.card-text',
    '.card-link',
    '.card-img',
    '.card-img-top',
    '.card-img-bottom'
  ],

  // Sélecteurs pour l'accessibilité (from accessibility.css)
  accessibility: [
    '.visually-hidden',
    '.sr-only',
    '.focus-visible',
    '.skip-link',
    '[role="button"]',
    '[aria-hidden="true"]',
    '[aria-hidden="false"]',
    '[aria-label]',
    '[aria-labelledby]',
    '[aria-describedby]'
  ],

  // Notification styles (from notification.css)
  notifications: [
    '.notification',
    '.notification-container',
    '.notification-success',
    '.notification-error',
    '.notification-warning',
    '.notification-info'
  ],

  // Sélecteurs de plein écran (from fullscreen.css)
  fullscreen: [
    '.fullscreen-btn',
    '.fullscreen-container',
    '.fullscreen-toggle',
    ':fullscreen',
    ':-webkit-full-screen',
    ':-moz-full-screen',
    ':-ms-fullscreen'
  ],

  // Sélecteurs d'aide (from help-panel.css)
  help: [
    '.help-panel',
    '.help-toggle',
    '.help-icon'
  ]
};

// Fonction pour nettoyer un fichier CSS d'outil
function cleanToolFile(toolFilePath, selectorCategory) {
  try {
    // Lire le contenu du fichier
    let cssContent = fs.readFileSync(toolFilePath, 'utf8');
    let originalSize = cssContent.length;
    let ruleCount = 0;

    // Obtenir la liste des sélecteurs pour cette catégorie
    const selectors = commonSelectors[selectorCategory];

    // Pour chaque sélecteur
    selectors.forEach(selector => {
      // Échapper les caractères spéciaux pour la regex
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Rechercher les règles avec ce sélecteur (standalone ou comme partie d'un groupe)
      const selectorRegex = new RegExp(`(^|,\\s*)${escapedSelector}(\\s*,|\\s*{)`, 'gm');
      
      if (selectorRegex.test(cssContent)) {
        // Trouver les blocs CSS complets associés à ce sélecteur
        const fullRuleRegex = new RegExp(`([^{}]*${escapedSelector}[^{]*){([^}]*)}`, 'g');
        const matches = [...cssContent.matchAll(fullRuleRegex)];
        
        matches.forEach(match => {
          const fullRule = match[0];
          // Supprimer la règle
          cssContent = cssContent.replace(fullRule, '');
          ruleCount++;
          console.log(`Supprimé dans ${path.basename(toolFilePath)} (${selectorCategory}): ${match[1].trim()}`);
        });
      }
    });

    // Si des changements ont été effectués
    if (ruleCount > 0) {
      // Nettoyer les espaces vides multiples
      cssContent = cssContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // Enregistrer le fichier modifié
      fs.writeFileSync(toolFilePath, cssContent);
      
      const newSize = cssContent.length;
      const reduction = originalSize - newSize;
      console.log(`${path.basename(toolFilePath)}: ${ruleCount} règles de ${selectorCategory} supprimées, taille réduite de ${reduction} octets`);
      return { count: ruleCount, bytes: reduction };
    } else {
      return { count: 0, bytes: 0 };
    }
  } catch (error) {
    console.error(`Erreur lors du traitement de ${path.basename(toolFilePath)}:`, error);
    return { count: 0, bytes: 0 };
  }
}

// Fonction principale
function main() {
  try {
    // Vérifier que les fichiers de composants existent
    const requiredComponents = ['buttons.css', 'text.css', 'tools-cards.css', 'accessibility.css', 'notification.css', 'fullscreen.css', 'help-panel.css'];
    for (const component of requiredComponents) {
      const componentPath = path.join(componentsDir, component);
      if (!fs.existsSync(componentPath)) {
        console.warn(`Attention: Le fichier ${component} n'existe pas à l'emplacement ${componentPath}`);
      }
    }
    
    // Obtenir la liste de tous les fichiers CSS dans le dossier tools
    const toolFiles = fs.readdirSync(toolsDir)
      .filter(file => file.endsWith('.css'))
      .map(file => path.join(toolsDir, file));
    
    // Pour chaque catégorie de sélecteurs
    let totalRulesRemoved = 0;
    let totalBytesReduced = 0;
    const stats = {};
    
    for (const category in commonSelectors) {
      console.log(`\n--- Nettoyage des styles ${category} ---`);
      stats[category] = { count: 0, bytes: 0 };
      
      // Nettoyer chaque fichier d'outil pour cette catégorie
      toolFiles.forEach(file => {
        const result = cleanToolFile(file, category);
        stats[category].count += result.count;
        stats[category].bytes += result.bytes;
        totalRulesRemoved += result.count;
        totalBytesReduced += result.bytes;
      });
    }
    
    // Afficher un résumé des suppressions
    console.log('\n=== RÉSUMÉ DES SUPPRESSIONS ===');
    for (const category in stats) {
      if (stats[category].count > 0) {
        console.log(`${category}: ${stats[category].count} règles supprimées, ${stats[category].bytes} octets économisés`);
      }
    }
    
    console.log(`\nOpération terminée: ${totalRulesRemoved} règles redondantes supprimées au total.`);
    console.log(`Économie totale: ${(totalBytesReduced / 1024).toFixed(2)} Ko`);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter le script
main(); 