// Script pour corriger les fichiers d'outils
const fs = require('fs');
const path = require('path');

// Chemin du répertoire d'outils
const toolsDir = path.join(__dirname, 'tools');

// Liste tous les fichiers HTML dans le répertoire des outils
const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.html'));

console.log(`Traitement de ${toolFiles.length} fichiers d'outils...`);

// Pour chaque fichier d'outil
toolFiles.forEach(file => {
    const filePath = path.join(toolsDir, file);
    
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Supprimer la balise base
    content = content.replace(/<base href="https:\/\/hzc23\.github\.io\/outilspratiques\.github\.io\/">/g, '');
    
    // Remplacer les chemins CSS et JS
    content = content.replace(/<link rel="stylesheet" href="styles\.css">/g, '<link rel="stylesheet" href="../styles/main.css">');
    content = content.replace(/<link rel="stylesheet" href="css\/tools\.css">/g, '<link rel="stylesheet" href="../styles/tools.css">');
    
    // Remplacer les chemins pour les fichiers CSS spécifiques aux outils
    content = content.replace(/<link rel="stylesheet" href="css\/tools\/([^"]+)\.css">/g, '<!-- Styles spécifiques à l\'outil -->');
    
    // Remplacer les chemins pour les fichiers JS
    content = content.replace(/src="js\//g, 'src="../js/');
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(filePath, content);
    
    console.log(`Fichier corrigé : ${file}`);
});

console.log('Tous les fichiers ont été corrigés avec succès !'); 