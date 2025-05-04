const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Chemins des dossiers
const componentsDir = path.join(__dirname, '../styles/components');
const toolsDir = path.join(__dirname, '../styles/tools');

// Fonction pour extraire les règles CSS d'un fichier
function extractRules(cssContent) {
  // Extraction des blocs de règles (sélecteur + déclarations)
  const ruleRegex = /([^{]+){([^}]*)}/g;
  const matches = [...cssContent.matchAll(ruleRegex)];
  
  const rules = new Map();
  
  matches.forEach(match => {
    const selector = match[1].trim();
    const declarations = normalizeDeclarations(match[2].trim());
    
    // Diviser les sélecteurs groupés (séparés par des virgules)
    selector.split(',').forEach(sel => {
      const trimmedSelector = sel.trim();
      rules.set(trimmedSelector, declarations);
    });
  });
  
  return rules;
}

// Normalise les déclarations CSS (supprime les espaces inutiles)
function normalizeDeclarations(declarations) {
  return declarations
    .split(';')
    .filter(decl => decl.trim())
    .map(decl => {
      const [property, value] = decl.split(':').map(part => part.trim());
      return `${property}: ${value}`;
    })
    .sort()
    .join('; ');
}

// Fonction pour vérifier si une règle du fichier tool est présente dans les fichiers components
function isRedundantRule(toolSelector, toolDeclarations, componentsRules) {
  // Si le sélecteur existe dans les composants
  if (componentsRules.has(toolSelector)) {
    const componentDeclarations = componentsRules.get(toolSelector);
    
    // Vérifier si les déclarations sont les mêmes
    // Ou si les déclarations du composant contiennent celles de l'outil
    return toolDeclarations === componentDeclarations || 
           componentDeclarations.includes(toolDeclarations);
  }
  
  return false;
}

// Fonction pour nettoyer un fichier CSS des outils
async function cleanToolFile(toolFile, componentsRules) {
  const toolPath = path.join(toolsDir, toolFile);
  
  try {
    // Lire le contenu du fichier CSS de l'outil
    const toolContent = await readFile(toolPath, 'utf8');
    
    // Extraction des blocs de règles CSS
    const ruleRegex = /([^{]+){([^}]*)}/g;
    const matches = [...toolContent.matchAll(ruleRegex)];
    
    let cleanedContent = toolContent;
    let removed = 0;
    
    // Pour chaque bloc de règles dans le fichier outil
    for (const match of matches) {
      const fullMatch = match[0];
      const selector = match[1].trim();
      const declarations = normalizeDeclarations(match[2].trim());
      
      // Vérifier si toutes les règles sont redondantes
      const selectors = selector.split(',').map(s => s.trim());
      const allRedundant = selectors.every(sel => 
        isRedundantRule(sel, declarations, componentsRules)
      );
      
      if (allRedundant) {
        // Supprimer la règle redondante
        cleanedContent = cleanedContent.replace(fullMatch, '');
        removed++;
        console.log(`Suppression dans ${toolFile} : ${selector}`);
      }
    }
    
    // Si des règles ont été supprimées, écrire le fichier nettoyé
    if (removed > 0) {
      // Nettoyer les lignes vides multiples
      cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      await writeFile(toolPath, cleanedContent, 'utf8');
      console.log(`${toolFile}: ${removed} règles redondantes supprimées`);
    } else {
      console.log(`${toolFile}: Aucune règle redondante trouvée`);
    }
    
    return removed;
  } catch (error) {
    console.error(`Erreur lors du traitement de ${toolFile}:`, error);
    return 0;
  }
}

// Fonction principale
async function main() {
  try {
    // Lire tous les fichiers CSS des composants
    const componentFiles = await readdir(componentsDir);
    const componentsRules = new Map();
    
    // Extraire toutes les règles des fichiers de composants
    for (const file of componentFiles) {
      if (path.extname(file) === '.css') {
        const filePath = path.join(componentsDir, file);
        try {
          const content = await readFile(filePath, 'utf8');
          const rules = extractRules(content);
          
          // Fusionner les règles
          rules.forEach((declarations, selector) => {
            componentsRules.set(selector, declarations);
          });
          
          console.log(`Traitement de ${file}: ${rules.size} règles extraites`);
        } catch (error) {
          console.error(`Erreur lors de la lecture de ${file}:`, error);
        }
      }
    }
    
    console.log(`${componentsRules.size} règles trouvées dans les fichiers de composants`);
    
    // Lire tous les fichiers CSS des outils
    const toolFiles = await readdir(toolsDir);
    let totalRemoved = 0;
    
    // Nettoyer chaque fichier d'outil
    for (const file of toolFiles) {
      if (path.extname(file) === '.css') {
        const removed = await cleanToolFile(file, componentsRules);
        totalRemoved += removed;
      }
    }
    
    console.log(`Nettoyage terminé: ${totalRemoved} règles redondantes supprimées au total`);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter le script
main(); 