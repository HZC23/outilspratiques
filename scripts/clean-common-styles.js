const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const componentsDir = path.join(__dirname, '../styles/components');
const toolsDir = path.join(__dirname, '../styles/tools');

// Liste des sélecteurs communs à rechercher et à supprimer dans les fichiers d'outils
const commonSelectors = {
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
    '.notification-success',
    '.notification-error',
    '.notification-warning',
    '.notification-info'
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
      return ruleCount;
    } else {
      return 0;
    }
  } catch (error) {
    console.error(`Erreur lors du traitement de ${path.basename(toolFilePath)}:`, error);
    return 0;
  }
}

// Fonction principale
function main() {
  try {
    // Vérifier que les fichiers de composants existent
    const requiredComponents = ['text.css', 'accessibility.css', 'notification.css'];
    for (const component of requiredComponents) {
      const componentPath = path.join(componentsDir, component);
      if (!fs.existsSync(componentPath)) {
        console.error(`Le fichier ${component} n'existe pas à l'emplacement ${componentPath}`);
        return;
      }
    }
    
    // Obtenir la liste de tous les fichiers CSS dans le dossier tools
    const toolFiles = fs.readdirSync(toolsDir)
      .filter(file => file.endsWith('.css'))
      .map(file => path.join(toolsDir, file));
    
    // Pour chaque catégorie de sélecteurs
    let totalRulesRemoved = 0;
    
    for (const category in commonSelectors) {
      console.log(`\n--- Nettoyage des styles ${category} ---`);
      
      // Nettoyer chaque fichier d'outil pour cette catégorie
      toolFiles.forEach(file => {
        const rulesRemoved = cleanToolFile(file, category);
        totalRulesRemoved += rulesRemoved;
      });
    }
    
    console.log(`\nOpération terminée: ${totalRulesRemoved} règles communes redondantes supprimées au total.`);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter le script
main(); 