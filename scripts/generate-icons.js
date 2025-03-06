const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../icons');

async function generateIcons() {
    // Créer le dossier icons s'il n'existe pas
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir);
    }

    // Générer les icônes PNG
    for (const size of sizes) {
        await sharp(path.join(iconsDir, 'icon.svg'))
            .resize(size, size)
            .png()
            .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    }

    // Générer le favicon.ico
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    
    // Dessiner un cercle bleu
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Dessiner un cercle blanc au centre
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(16, 16, 8, 0, Math.PI * 2);
    ctx.fill();

    // Sauvegarder en .ico
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, 'favicon.ico'), buffer);
}

generateIcons().catch(console.error); 