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
        ],
        // Options pour terser
        terserOptions: {
            compress: {
                dead_code: true,
                drop_console: false,
                drop_debugger: true,
                ecma: 2020,
                passes: 2
            },
            mangle: true,
            ecma: 2020,
            module: true,
            sourceMap: false
        }
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
        ],
        // Options pour clean-css
        cleanCssOptions: {
            level: {
                1: {
                    all: true,
                    specialComments: 0
                },
                2: {
                    all: true,
                    restructureRules: true
                }
            },
            format: 'keep-breaks',
            sourceMap: false
        }
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
        htmlMinifierOptions: {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
            minifyURLs: true,
            sortAttributes: true,
            sortClassName: true
        }
    },
    
    // Optimisation d'images
    images: {
        optimize: true,
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
        directories: [
            { src: 'icons', dest: 'icons' },
            { src: 'images', dest: 'images' }
        ],
        // Options pour imagemin (à installer séparément)
        imageminOptions: {
            plugins: [
                ['imagemin-mozjpeg', { quality: 80 }],
                ['imagemin-pngquant', { quality: [0.6, 0.8] }],
                ['imagemin-gifsicle', { optimizationLevel: 3 }],
                ['imagemin-svgo', { plugins: [{ removeViewBox: false }] }]
            ]
        }
    }
};

// Fonction principale de build
async function build() {
    try {
        console.log('Démarrage du build...');
        
        // Créer le répertoire de destination s'il n'existe pas
        if (!fs.existsSync(config.distDir)) {
            fs.mkdirSync(config.distDir, { recursive: true });
        }
        
        // Copier les fichiers de base (non-minifiés)
        await copyBaseFiles();
        
        // Minifier les fichiers si configuré
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
    function copyRecursive(src, dest) {
        // Vérifier si le fichier/dossier doit être ignoré
        const relativePath = path.relative(config.srcDir, src);
        if (ignorePattern.test(relativePath)) {
            return;
        }
        
        // Créer le dossier de destination s'il n'existe pas
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        // Si c'est un dossier, récursivement copier son contenu
        if (fs.statSync(src).isDirectory()) {
            const entries = fs.readdirSync(src);
            for (const entry of entries) {
                const srcPath = path.join(src, entry);
                const destPath = path.join(dest, entry);
                copyRecursive(srcPath, destPath);
            }
        } 
        // Si c'est un fichier, simplement le copier
        else {
            fs.copyFileSync(src, dest);
        }
    }
    
    // Démarrer la copie récursive depuis le répertoire source
    copyRecursive(config.srcDir, config.distDir);
}

// Minifier les fichiers JavaScript
async function minifyJavaScript() {
    console.log('Minification des fichiers JavaScript...');
    
    // Minifier les fichiers JS spécifiés individuellement
    for (const file of config.js.files) {
        const srcPath = path.join(config.srcDir, file.src);
        const destPath = path.join(config.distDir, file.dest);
        
        console.log(`Minification de ${file.src}...`);
        
        // Créer le répertoire de destination si nécessaire
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Exécuter terser pour minifier
        const terserOptions = JSON.stringify(config.js.terserOptions)
            .replace(/"/g, '\\"');
        
        await execPromise(`npx terser ${srcPath} -c -m -o ${destPath} --config-file "${terserOptions}"`);
    }
    
    // Minifier les fichiers JS dans les répertoires spécifiés
    for (const dir of config.js.directories) {
        const srcDir = path.join(config.srcDir, dir.src);
        const destDir = path.join(config.distDir, dir.dest);
        
        console.log(`Minification des fichiers JS dans ${dir.src}...`);
        
        // Créer le répertoire de destination si nécessaire
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Lire tous les fichiers JavaScript dans le répertoire
        const files = fs.readdirSync(srcDir).filter(file => file.endsWith('.js'));
        
        for (const file of files) {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file.replace('.js', '.min.js'));
            
            // Exécuter terser pour minifier
            await execPromise(`npx terser ${srcFile} -c -m -o ${destFile}`);
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
        
        console.log(`Minification de ${file.src}...`);
        
        // Créer le répertoire de destination si nécessaire
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Exécuter clean-css pour minifier
        const cleanCssOptions = JSON.stringify(config.css.cleanCssOptions)
            .replace(/"/g, '\\"');
        
        await execPromise(`npx cleancss -o ${destPath} ${srcPath}`);
    }
    
    // Minifier les fichiers CSS dans les répertoires spécifiés
    for (const dir of config.css.directories) {
        const srcDir = path.join(config.srcDir, dir.src);
        const destDir = path.join(config.distDir, dir.dest);
        
        console.log(`Minification des fichiers CSS dans ${dir.src}...`);
        
        // Créer le répertoire de destination si nécessaire
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Lire tous les fichiers CSS dans le répertoire
        const files = fs.readdirSync(srcDir).filter(file => file.endsWith('.css'));
        
        for (const file of files) {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file.replace('.css', '.min.css'));
            
            // Exécuter clean-css pour minifier
            await execPromise(`npx cleancss -o ${destFile} ${srcFile}`);
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
        
        console.log(`Minification de ${file.src}...`);
        
        // Créer le répertoire de destination si nécessaire
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Exécuter html-minifier-terser pour minifier
        const htmlMinifierOptions = Object.entries(config.html.htmlMinifierOptions)
            .map(([key, value]) => `--${key} ${value}`)
            .join(' ');
        
        await execPromise(`npx html-minifier-terser ${srcPath} -o ${destPath} ${htmlMinifierOptions}`);
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
        
        // Créer le répertoire de destination si nécessaire
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Exécuter imagemin pour optimiser les images
        await execPromise(`npx imagemin "${srcDir}/**/*.{jpg,jpeg,png,gif,svg}" --out-dir="${destDir}"`);
    }
}

// Lancer le build
build(); 