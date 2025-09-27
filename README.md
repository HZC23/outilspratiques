# Outils Pratiques

[![Licence: MIT](https://img.shields.io/badge/Licence-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://outilspratiques.github.io/)

**Outils Pratiques** est une collection d'outils en ligne gratuits et open-source, conçus pour faciliter vos tâches quotidiennes. Accessibles directement dans votre navigateur sans installation, ces outils sont optimisés pour fonctionner sur ordinateurs, tablettes et smartphones.

**➡️ [Visiter le site : outilspratiques.github.io](https://outilspratiques.github.io/)**

## ✨ Fonctionnalités

Notre suite d'outils inclut :

*   **Calculs et Mathématiques**: Calculatrice scientifique, pourcentages, convertisseurs (unités, devises).
*   **Gestion du temps**: Minuteur, chronomètre, métronome.
*   **Organisation et Texte**: Bloc-notes, liste de tâches, éditeur de texte, styliseur de texte.
*   **Utilitaires**: Sélecteur de couleurs, générateur/lecteur de QR code, traducteur, générateur de mots de passe, dictionnaire, et plus encore.

### Avantages Clés
*   **Interface moderne et intuitive** avec mode sombre/clair.
*   **Application web progressive (PWA)** installable pour un accès rapide.
*   **Fonctionne hors ligne** pour la plupart des outils.
*   **Respect de la vie privée** : aucune donnée n'est envoyée à des serveurs externes.
*   **Open source et entièrement gratuit**.

## 🚀 Améliorations Récentes

Le projet est constamment amélioré, avec un focus sur :
*   **Performance**: Lazy loading, minification, cache avancé via Service Worker.
*   **Accessibilité (a11y)**: Navigation au clavier, support des lecteurs d'écran, contrastes optimisés.
*   **SEO**: Sitemap, balises meta optimisées, données structurées (schema.org).
*   **Responsive Design**: Interface entièrement adaptée à toutes les tailles d'écran.
*   **Sécurité**: Content Security Policy, protection XSS.

## 🛠️ Installation et Développement

### Prérequis
*   [Node.js](https://nodejs.org/) (v14 ou supérieur)
*   [npm](https://www.npmjs.com/) (v6 ou supérieur)

### Étapes d'installation
1.  Clonez le dépôt :
    ```bash
    git clone https://github.com/outilspratiques/outilspratiques.github.io.git
    cd outilspratiques.github.io
    ```
2.  Installez les dépendances :
    ```bash
    npm install
    ```

### Scripts Disponibles
*   `npm start`: Lance un serveur de développement local.
*   `npm run build`: Construit une version optimisée pour la production.
*   `npm run lint`: Vérifie la qualité du code (JavaScript et CSS).
*   `npm run optimize-images`: Optimise les images pour le web.
*   `npm run generate-sitemap`: Génère le `sitemap.xml`.

## 📁 Structure du Projet
```
outilspratiques.github.io/
├── index.html          # Page d'accueil
├── outils.html         # Page des outils
├── styles/             # Fichiers CSS
├── js/                 # Fichiers JavaScript
├── icons/              # Icônes et assets
├── dist/               # Fichiers de production (générés par le build)
└── ...
```

## 🚀 Déploiement
Le site est automatiquement déployé sur GitHub Pages à chaque `push` sur la branche `main`.

## 🤝 Contribution
Les contributions sont les bienvenues !
1.  Forkez le projet.
2.  Créez une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-feature`).
3.  Commitez vos changements (`git commit -m 'Ajout de nouvelle-feature'`).
4.  Pushez la branche (`git push origin feature/nouvelle-feature`).
5.  Ouvrez une Pull Request.

## 📄 Licence
Ce projet est sous licence MIT. Consultez le fichier `LICENSE` pour plus de détails.