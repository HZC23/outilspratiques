const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// Configuration des en-têtes de cache pour les fichiers statiques
app.use(express.static(__dirname, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.ico') || path.endsWith('.png')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
}); 