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
    
    // Extraire uniquement la section de l'outil en utilisant une expression régulière
    const sectionMatch = content.match(/<section[^>]*>([\s\S]*?)<\/section>/i);
    
    if (sectionMatch && sectionMatch[0]) {
        // Sauvegarder uniquement la section
        fs.writeFileSync(filePath, sectionMatch[0]);
        console.log(`Fichier simplifié : ${file}`);
    } else {
        console.log(`Avertissement : Aucune section trouvée dans ${file}`);
    }
});

console.log('Tous les fichiers ont été convertis au nouveau format simplifié !'); 