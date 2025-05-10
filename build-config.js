const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const UglifyJS = require('uglify-js');
const cssnano = require('cssnano');
const postcss = require('postcss');

const execAsync = promisify(exec);

const excludePatterns = [
    'node_modules', '.git', 'build-config.js', 'README.md',
    'package-lock.json', 'package.json', '.env', '.vscode',
    'docs', '.github', '.gitignore', 'postcss-svgo', 'postcss-url', 'postcss-import', 'postcss-preset-env'
];

function shouldExclude(filePath) {
    const relative = path.relative(__dirname, filePath);
    return excludePatterns.some(pattern =>
        relative.split(path.sep).includes(pattern) || path.basename(relative) === pattern
    );
}

function getFilesFromDirectory(directory) {
    return fs.readdirSync(directory).reduce((files, file) => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            return [...files, ...getFilesFromDirectory(filePath)];
        } else {
            return [...files, filePath];
        }
    }, []);
}

function clearDistDirectory() {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
    }
}

function createDistDirectory() {
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath);
    }
    return distPath;
}

function copyAllFilesToDist(srcDir, distDir) {
    const files = getFilesFromDirectory(srcDir);
    files.forEach(file => {
        if (shouldExclude(file)) return;
        const dest = path.join(distDir, path.relative(srcDir, file));
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(file, dest);
    });
}

function minifyJavaScript(file) {
    try {
        const code = fs.readFileSync(file, 'utf8');
        const result = UglifyJS.minify(code);
        if (result.error) {
            console.error(`Erreur minification JS ${file}: ${result.error.message}`);
            return;
        }
        fs.writeFileSync(file, result.code);
        console.log(`Minifié JS : ${file}`);
    } catch (err) {
        console.error(`Erreur lors du traitement JS ${file}: ${err.message}`);
    }
}

async function minifyCSS(file) {
    try {
        const css = fs.readFileSync(file, 'utf8');
        const result = await postcss([cssnano]).process(css, { from: file, to: file });
        fs.writeFileSync(file, result.css);
        console.log(`Minifié CSS : ${file}`);
    } catch (err) {
        console.error(`Erreur lors du traitement CSS ${file}: ${err.message}`);
    }
}
function copyDistToZDrive() {
    const srcDir = path.join(__dirname, 'dist');
    const destDir = 'Y:\\outilspratiques'; // Destination principale

    const files = getFilesFromDirectory(srcDir);
    for (const file of files) {
        const relativePath = path.relative(srcDir, file);
        const targetPath = path.join(destDir, relativePath);

        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.copyFileSync(file, targetPath);
        console.log(`✔️  Copié : ${relativePath} → ${targetPath}`);
    }

    console.log('✅ Tous les fichiers ont été copiés vers Y:\\ en conservant la structure.');
}


async function minifyAllFiles() {
    clearDistDirectory();
    const distPath = createDistDirectory();
    copyAllFilesToDist(__dirname, distPath);

    const files = getFilesFromDirectory(distPath);
    for (const file of files) {
        if (file.endsWith('.js')) {
            await minifyJavaScript(file);
        } else if (file.endsWith('.css')) {
            await minifyCSS(file);
        }
    }

    copyDistToZDrive();
}

// Lancer le processus
(async () => {
    try {
        await minifyAllFiles();
        console.log('✅ Build et upload terminés.');
    } catch (err) {
        console.error(`❌ Erreur globale : ${err.message}`);
    }
})();
