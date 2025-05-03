/**
 * Configuration de build pour minifier les fichiers CSS et JavaScript
 * Utilise terser pour JS et clean-css pour CSS
 * 
 * Pour utiliser ce fichier:
 * 1. Installer les dépendances: npm install terser clean-css-cli html-minifier-terser --save-dev
 * 2. Ajouter les scripts dans package.json:
 *    "scripts": {
 *      "build": "node build-config.js",
 *      "minify-js": "terser js/main.js -c -m -o dist/js/main.min.js",
 *      "minify-css": "cleancss -o dist/styles/main.min.css styles/main.css"
 *    }
 * 3. Exécuter: npm run build
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Fonction d'attente pour éviter les conflits de fichiers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configuration du build
const config = {
    // Répertoires source et destination
    srcDir: './',
    distDir: './dist',
    
    // Fichiers à ignorer lors de la copie
    ignore: [
        'node_modules',
        '.git',
        '.github',
        '.vscode',
        'dist',
        'docs',
        'package.json',
        'package-lock.json',
        'build-config.js',
        '*.md',
        '*.log',
        '*.config.js'
    ],
    
    // Configuration de minification JS
    js: {
        minify: true,
        files: [
            // Fichiers JS principaux à minifier individuellement
            { src: 'js/main.js', dest: 'js/main.min.js' },
            { src: 'js/theme.js', dest: 'js/theme.min.js' },
            { src: 'js/utils.js', dest: 'js/utils.min.js' },
            { src: 'js/navigation.js', dest: 'js/navigation.min.js' },
            { src: 'js/clock.js', dest: 'js/clock.min.js' },
            { src: 'sw.js', dest: 'sw.min.js' }
        ],
        // Répertoires contenant des fichiers JS à minifier
        directories: [
            { src: 'js/tools', dest: 'js/tools' },
            { src: 'js/utils', dest: 'js/utils' }
        ]
    },
    
    // Configuration de minification CSS
    css: {
        minify: true,
        files: [
            // Fichiers CSS principaux à minifier individuellement
            { src: 'styles/main.css', dest: 'styles/main.min.css' },
            { src: 'styles/variables.css', dest: 'styles/variables.min.css' }
        ],
        // Répertoires contenant des fichiers CSS à minifier
        directories: [
            { src: 'styles/components', dest: 'styles/components' },
            { src: 'styles/tools', dest: 'styles/tools' }
        ]
    },
    
    // Configuration de minification HTML
    html: {
        minify: true,
        files: [
            { src: 'index.html', dest: 'index.html' },
            { src: 'outils.html', dest: 'outils.html' },
            { src: '404.html', dest: '404.html' }
        ],
        // Options pour html-minifier-terser
        htmlMinifierOptions: '--collapse-whitespace --remove-comments --remove-redundant-attributes --remove-script-type-attributes --remove-style-link-type-attributes --use-short-doctype --minify-css --minify-js --minify-urls --sort-attributes --sort-class-name'
    },
    
    // Optimisation d'images
    images: {
        optimize: true,
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
        directories: [
            { src: 'icons', dest: 'icons' },
            { src: 'images', dest: 'images' }
        ]
    }
};

// Fonction principale de build
async function build() {
    try {
        console.log('Démarrage du build...');
        
        // Vérifier si le dossier dist existe et le supprimer si c'est le cas
        if (fs.existsSync(config.distDir)) {
            try {
                // Supprimer le dossier dist avec une commande système (plus fiable)
                console.log('Suppression du dossier dist existant...');
                await sleep(100);
                
                if (process.platform === 'win32') {
                    // Sur Windows, utiliser rmdir avec force
                    await execPromise('rmdir /s /q dist');
                } else {
                    // Sur Linux/Mac
                    await execPromise('rm -rf ./dist');
                }
                console.log('Suppression du dossier dist terminée.');
            } catch (err) {
                console.error(`Erreur lors de la suppression du dossier dist: ${err.message}`);
                console.log('Tentative de continuer...');
            }
        }
        
        // Attendre un peu pour s'assurer que le système de fichiers est prêt
        await sleep(500);
        
        // Créer le répertoire de destination
        console.log('Création du dossier dist...');
        fs.mkdirSync(config.distDir, { recursive: true });
        await sleep(200);
        
        // Copier les fichiers de base
        await copyBaseFiles();
        
        // Minifier les fichiers
        if (config.js.minify) {
            await minifyJavaScript();
        }
        
        if (config.css.minify) {
            await minifyCSS();
        }
        
        if (config.html.minify) {
            await minifyHTML();
        }
        
        if (config.images.optimize) {
            await optimizeImages();
        }
        
        // Nettoyer le dossier dist (supprimer les fichiers originaux et renommer les minifiés)
        await cleanupDistFolder();
        
        console.log('Build terminé avec succès!');
    } catch (error) {
        console.error('Erreur lors du build:', error);
        process.exit(1);
    }
}

// Copier les fichiers de base en ignorant certains dossiers/fichiers
async function copyBaseFiles() {
    console.log('Copie des fichiers de base...');
    
    // Créer une expression régulière pour les fichiers à ignorer
    const ignorePattern = new RegExp(`^(${config.ignore.map(pattern => 
        pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')
    ).join('|')})`, 'i');
    
    // Fonction récursive pour copier les fichiers
    async function copyRecursive(srcPath, destPath) {
        // Vérifier si le fichier/dossier doit être ignoré
        const relativePath = path.relative(config.srcDir, srcPath);
        if (ignorePattern.test(relativePath)) {
            return;
        }
        
        // Obtenir les informations sur le fichier/dossier source
        const stat = fs.statSync(srcPath);
        
        // Si c'est un dossier
        if (stat.isDirectory()) {
            // Créer le dossier de destination s'il n'existe pas
            if (!fs.existsSync(destPath)) {
                try {
                    fs.mkdirSync(destPath, { recursive: true });
                } catch (err) {
                    console.error(`Erreur lors de la création du dossier ${destPath}: ${err.message}`);
                    return;
                }
            } else {
                // Si le chemin de destination existe mais n'est pas un dossier
                const destStat = fs.lstatSync(destPath);
                if (!destStat.isDirectory()) {
                    try {
                        fs.unlinkSync(destPath); // Supprimer le fichier
                        await sleep(50);
                        fs.mkdirSync(destPath, { recursive: true }); // Créer le dossier
                    } catch (err) {
                        console.error(`Erreur lors de la conversion de ${destPath} en dossier: ${err.message}`);
                        return;
                    }
                }
            }
            
            // Récursivement copier le contenu du dossier
            const entries = fs.readdirSync(srcPath);
            for (const entry of entries) {
                await copyRecursive(
                    path.join(srcPath, entry), 
                    path.join(destPath, entry)
                );
            }
        } 
        // Si c'est un fichier
        else {
            try {
                // Vérifier si la destination existe et est un dossier
                if (fs.existsSync(destPath)) {
                    const destStat = fs.lstatSync(destPath);
                    if (destStat.isDirectory()) {
                        try {
                            fs.rmdirSync(destPath, { recursive: true }); // Supprimer le dossier
                            await sleep(50);
                        } catch (err) {
                            console.error(`Erreur lors de la suppression du dossier ${destPath}: ${err.message}`);
                            return;
                        }
                    } else {
                        // Si c'est un fichier, le supprimer simplement
                        fs.unlinkSync(destPath);
                        await sleep(20);
                    }
                }
                
                // S'assurer que le dossier parent existe
                const destDir = path.dirname(destPath);
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                
                // Lire et écrire le fichier
                const content = fs.readFileSync(srcPath);
                fs.writeFileSync(destPath, content);
                console.log(`Copié: ${relativePath}`);
            } catch (err) {
                console.error(`Erreur lors de la copie de ${srcPath} vers ${destPath}: ${err.message}`);
            }
        }
    }
    
    // Démarrer la copie récursive depuis le répertoire source
    await copyRecursive(config.srcDir, config.distDir);
}

// Minifier les fichiers JavaScript
async function minifyJavaScript() {
    console.log('Minification des fichiers JavaScript...');
    
    // Minifier les fichiers JS spécifiés individuellement
    for (const file of config.js.files) {
        const srcPath = path.join(config.srcDir, file.src);
        const destPath = path.join(config.distDir, file.dest);
        
        // Vérifier si le fichier source existe
        if (!fs.existsSync(srcPath)) {
            console.log(`Le fichier ${srcPath} n'existe pas, minification ignorée.`);
            continue;
        }
        
        console.log(`Minification de ${file.src}...`);
        
        // Créer le répertoire de destination
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Supprimer le fichier de destination s'il existe et est un dossier
        if (fs.existsSync(destPath)) {
            const destStat = fs.lstatSync(destPath);
            if (destStat.isDirectory()) {
                await execPromise(`rmdir "${destPath}" /s /q`);
                await sleep(100);
            }
        }
        
        try {
            // Utiliser terser avec des options directes
            await execPromise(`npx terser "${srcPath}" -c dead_code=true,drop_debugger=true,ecma=2020,passes=2 -m -o "${destPath}"`);
        } catch (err) {
            console.error(`Erreur lors de la minification de ${srcPath}: ${err.message}`);
        }
    }
    
    // Minifier les fichiers JS dans les répertoires spécifiés
    for (const dir of config.js.directories) {
        const srcDir = path.join(config.srcDir, dir.src);
        const destDir = path.join(config.distDir, dir.dest);
        
        // Vérifier si le répertoire source existe
        if (!fs.existsSync(srcDir)) {
            console.log(`Le répertoire ${srcDir} n'existe pas, minification ignorée.`);
            continue;
        }
        
        console.log(`Minification des fichiers JS dans ${dir.src}...`);
        
        // Créer le répertoire de destination
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Trouver tous les fichiers JS
        const files = fs.readdirSync(srcDir).filter(file => file.endsWith('.js'));
        
        for (const file of files) {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file.replace('.js', '.min.js'));
            
            // Supprimer le fichier de destination s'il existe et est un dossier
            if (fs.existsSync(destFile)) {
                const destStat = fs.lstatSync(destFile);
                if (destStat.isDirectory()) {
                    await execPromise(`rmdir "${destFile}" /s /q`);
                    await sleep(100);
                }
            }
            
            try {
                // Utiliser terser pour minifier
                await execPromise(`npx terser "${srcFile}" -c dead_code=true,drop_debugger=true,ecma=2020,passes=2 -m -o "${destFile}"`);
            } catch (err) {
                console.error(`Erreur lors de la minification de ${srcFile}: ${err.message}`);
            }
        }
    }
}

// Minifier les fichiers CSS
async function minifyCSS() {
    console.log('Minification des fichiers CSS...');
    
    // Minifier les fichiers CSS spécifiés individuellement
    for (const file of config.css.files) {
        const srcPath = path.join(config.srcDir, file.src);
        const destPath = path.join(config.distDir, file.dest);
        
        // Vérifier si le fichier source existe
        if (!fs.existsSync(srcPath)) {
            console.log(`Le fichier ${srcPath} n'existe pas, minification ignorée.`);
            continue;
        }
        
        console.log(`Minification de ${file.src}...`);
        
        // Créer le répertoire de destination
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Supprimer le fichier de destination s'il existe et est un dossier
        if (fs.existsSync(destPath)) {
            const destStat = fs.lstatSync(destPath);
            if (destStat.isDirectory()) {
                await execPromise(`rmdir "${destPath}" /s /q`);
                await sleep(100);
            }
        }
        
        try {
            // Utiliser clean-css
            await execPromise(`npx cleancss -o "${destPath}" "${srcPath}"`);
        } catch (err) {
            console.error(`Erreur lors de la minification de ${srcPath}: ${err.message}`);
        }
    }
    
    // Minifier les fichiers CSS dans les répertoires spécifiés
    for (const dir of config.css.directories) {
        const srcDir = path.join(config.srcDir, dir.src);
        const destDir = path.join(config.distDir, dir.dest);
        
        // Vérifier si le répertoire source existe
        if (!fs.existsSync(srcDir)) {
            console.log(`Le répertoire ${srcDir} n'existe pas, minification ignorée.`);
            continue;
        }
        
        console.log(`Minification des fichiers CSS dans ${dir.src}...`);
        
        // Créer le répertoire de destination
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Trouver tous les fichiers CSS
        const files = fs.readdirSync(srcDir).filter(file => file.endsWith('.css'));
        
        for (const file of files) {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file.replace('.css', '.min.css'));
            
            // Supprimer le fichier de destination s'il existe et est un dossier
            if (fs.existsSync(destFile)) {
                const destStat = fs.lstatSync(destFile);
                if (destStat.isDirectory()) {
                    await execPromise(`rmdir "${destFile}" /s /q`);
                    await sleep(100);
                }
            }
            
            try {
                // Utiliser clean-css pour minifier
                await execPromise(`npx cleancss -o "${destFile}" "${srcFile}"`);
            } catch (err) {
                console.error(`Erreur lors de la minification de ${srcFile}: ${err.message}`);
            }
        }
    }
}

// Minifier les fichiers HTML
async function minifyHTML() {
    console.log('Minification des fichiers HTML...');
    
    // Installer html-minifier-terser si nécessaire
    try {
        await execPromise('npx html-minifier-terser --version');
    } catch (error) {
        console.log('Installation de html-minifier-terser...');
        await execPromise('npm install html-minifier-terser --save-dev');
    }
    
    // Minifier les fichiers HTML spécifiés
    for (const file of config.html.files) {
        const srcPath = path.join(config.srcDir, file.src);
        const destPath = path.join(config.distDir, file.dest);
        
        // Vérifier si le fichier source existe
        if (!fs.existsSync(srcPath)) {
            console.log(`Le fichier ${srcPath} n'existe pas, minification ignorée.`);
            continue;
        }
        
        console.log(`Minification de ${file.src}...`);
        
        // Créer le répertoire de destination
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Supprimer le fichier de destination s'il existe et est un dossier
        if (fs.existsSync(destPath)) {
            const destStat = fs.lstatSync(destPath);
            if (destStat.isDirectory()) {
                await execPromise(`rmdir "${destPath}" /s /q`);
                await sleep(100);
            }
        }
        
        try {
            // Utiliser html-minifier-terser
            await execPromise(`npx html-minifier-terser "${srcPath}" -o "${destPath}" ${config.html.htmlMinifierOptions}`);
        } catch (err) {
            console.error(`Erreur lors de la minification de ${srcPath}: ${err.message}`);
        }
    }
}

// Optimiser les images
async function optimizeImages() {
    console.log('Optimisation des images...');
    
    // Vérifier si imagemin est installé
    try {
        await execPromise('npx imagemin --version');
    } catch (error) {
        console.log('Installation d\'imagemin et des plugins nécessaires...');
        await execPromise('npm install imagemin imagemin-cli imagemin-mozjpeg imagemin-pngquant imagemin-gifsicle imagemin-svgo --save-dev');
    }
    
    // Parcourir les répertoires d'images
    for (const dir of config.images.directories) {
        const srcDir = path.join(config.srcDir, dir.src);
        const destDir = path.join(config.distDir, dir.dest);
        
        // Vérifier si le répertoire source existe
        if (!fs.existsSync(srcDir)) {
            console.log(`Le répertoire ${srcDir} n'existe pas, optimisation ignorée.`);
            continue;
        }
        
        console.log(`Optimisation des images dans ${dir.src}...`);
        
        // Créer le répertoire de destination
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        try {
            // Utiliser imagemin pour optimiser les images
            await execPromise(`npx imagemin "${srcDir}/**/*.{jpg,jpeg,png,gif,svg}" --out-dir="${destDir}"`);
        } catch (err) {
            console.error(`Erreur lors de l'optimisation des images dans ${srcDir}: ${err.message}`);
        }
    }
}

// Nettoyer le dossier dist (supprimer les fichiers originaux et renommer les minifiés)
async function cleanupDistFolder() {
    console.log('Nettoyage du dossier dist...');
    
    // Liste des fichiers que nous avons minifiés (en format dist/js/...)
    const minifiedFiles = [
        ...config.js.files.map(file => ({
            original: path.join(config.distDir, file.src),
            minified: path.join(config.distDir, file.dest)
        })),
        ...config.css.files.map(file => ({
            original: path.join(config.distDir, file.src),
            minified: path.join(config.distDir, file.dest)
        }))
    ];
    
    // Fonction récursive pour nettoyer un répertoire
    async function cleanupDirectory(dirPath) {
        // Vérifier si le répertoire existe
        if (!fs.existsSync(dirPath)) {
            return;
        }
        
        console.log(`Nettoyage du répertoire: ${dirPath}`);
        
        try {
            const entries = fs.readdirSync(dirPath);
            
            // D'abord traiter les sous-répertoires récursivement
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                try {
                    const stat = fs.lstatSync(fullPath);
                    if (stat.isDirectory()) {
                        await cleanupDirectory(fullPath);
                    }
                } catch (err) {
                    console.error(`Erreur lors de l'accès à ${fullPath}: ${err.message}`);
                }
            }
            
            // Ensuite, renommer les fichiers minifiés
            // Relire le répertoire car il peut avoir changé pendant le traitement des sous-répertoires
            const currentEntries = fs.readdirSync(dirPath);
            for (const entry of currentEntries) {
                const fullPath = path.join(dirPath, entry);
                
                try {
                    // Ne traiter que les fichiers
                    const stat = fs.lstatSync(fullPath);
                    if (!stat.isDirectory()) {
                        if (entry.endsWith('.min.js') || entry.endsWith('.min.css')) {
                            const newName = entry.replace('.min.', '.');
                            const newPath = path.join(dirPath, newName);
                            
                            console.log(`Renommage de ${fullPath} vers ${newPath}`);
                            
                            try {
                                // Supprimer le fichier non-minifié s'il existe
                                if (fs.existsSync(newPath)) {
                                    console.log(`Suppression du fichier non-minifié: ${newPath}`);
                                    fs.unlinkSync(newPath);
                                    await sleep(50);
                                }
                                
                                // Renommer le fichier minifié
                                fs.renameSync(fullPath, newPath);
                                console.log(`Renommé: ${fullPath} → ${newPath}`);
                            } catch (err) {
                                console.error(`Erreur lors du renommage de ${fullPath}: ${err.message}`);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Erreur lors de l'accès à ${fullPath}: ${err.message}`);
                }
            }
            
            // Finalement, supprimer les fichiers originaux spécifiques qui ont été traités par notre build
            for (const fileObj of minifiedFiles) {
                // Vérifier si ce fichier original existe dans ce répertoire
                if (fileObj.original.startsWith(dirPath)) {
                    try {
                        if (fs.existsSync(fileObj.original)) {
                            console.log(`Suppression du fichier original traité: ${fileObj.original}`);
                            fs.unlinkSync(fileObj.original);
                            await sleep(20);
                        }
                    } catch (err) {
                        console.error(`Erreur lors de la suppression de ${fileObj.original}: ${err.message}`);
                    }
                }
            }
        } catch (err) {
            console.error(`Erreur lors du traitement du répertoire ${dirPath}: ${err.message}`);
        }
    }
    
    // Commencer le nettoyage à partir du répertoire dist
    await cleanupDirectory(config.distDir);
    
    console.log('Nettoyage du dossier dist terminé!');
}

// Lancer le build
build(); 