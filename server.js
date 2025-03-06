const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

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

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, '500.html'));
});

// Démarrage du serveur
const server = app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});

// Gestion des erreurs de démarrage du serveur
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Le port ${port} est déjà utilisé. Essayez de fermer l'application qui utilise ce port ou utilisez un port différent.`);
        process.exit(1);
    } else {
        console.error('Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}); 