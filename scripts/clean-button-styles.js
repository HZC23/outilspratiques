const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const buttonsComponentFile = path.join(__dirname, '../styles/components/buttons.css');
const toolsDir = path.join(__dirname, '../styles/tools');

// Liste des sélecteurs de boutons à rechercher et à supprimer dans les fichiers d'outils
const buttonSelectors = [
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
  '.calculator-button',
  '.todo-button',
  'button[type="button"]',
  'button[type="submit"]',
  'input[type="button"]',
  'input[type="submit"]'
];

// Fonction pour nettoyer un fichier CSS d'outil
function cleanToolFile(toolFilePath) {
  try {
    // Lire le contenu du fichier
    let cssContent = fs.readFileSync(toolFilePath, 'utf8');
    let originalSize = cssContent.length;
    let ruleCount = 0;

    // Pour chaque sélecteur de bouton
    buttonSelectors.forEach(selector => {
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
          console.log(`Supprimé dans ${path.basename(toolFilePath)}: ${match[1].trim()}`);
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
      console.log(`${path.basename(toolFilePath)}: ${ruleCount} règles supprimées, taille réduite de ${reduction} octets`);
      return ruleCount;
    } else {
      console.log(`${path.basename(toolFilePath)}: Aucune règle de bouton redondante trouvée`);
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
    // Vérifier que le fichier de composants buttons.css existe
    if (!fs.existsSync(buttonsComponentFile)) {
      console.error(`Le fichier buttons.css n'existe pas à l'emplacement ${buttonsComponentFile}`);
      return;
    }
    
    // Obtenir la liste de tous les fichiers CSS dans le dossier tools
    const toolFiles = fs.readdirSync(toolsDir)
      .filter(file => file.endsWith('.css'))
      .map(file => path.join(toolsDir, file));
    
    let totalRulesRemoved = 0;
    
    // Nettoyer chaque fichier d'outil
    toolFiles.forEach(file => {
      const rulesRemoved = cleanToolFile(file);
      totalRulesRemoved += rulesRemoved;
    });
    
    console.log(`\nOpération terminée: ${totalRulesRemoved} règles de boutons redondantes supprimées au total.`);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter le script
main(); 