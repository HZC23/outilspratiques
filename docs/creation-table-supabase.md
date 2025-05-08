# Guide de création de tables dans Supabase

## Introduction

Supabase est une alternative open source à Firebase qui permet de créer une base de données PostgreSQL avec une API REST automatique. Voici comment créer des tables dans Supabase.

## Prérequis

- Avoir un compte Supabase (inscription gratuite sur [supabase.com](https://supabase.com))
- Avoir créé un projet dans Supabase

## Étapes pour créer une table

### 1. Accéder au tableau de bord

1. Connectez-vous à votre compte Supabase
2. Sélectionnez votre projet
3. Dans le menu latéral gauche, cliquez sur "Table editor" (Éditeur de tables)

### 2. Créer une nouvelle table

1. Cliquez sur le bouton "New table" (Nouvelle table)
2. Remplissez les informations suivantes :
   - **Name** (Nom) : le nom de votre table (ex: `taches`, `utilisateurs`, etc.)
   - **Description** (optionnel) : une description de l'utilité de cette table
   - **RLS** (Row Level Security) : activez cette option pour sécuriser l'accès aux données

### 3. Définir les colonnes

Pour chaque colonne, vous devez définir :

- **Name** (Nom) : le nom de la colonne (ex: `id`, `titre`, `description`, etc.)
- **Type** (Type) : le type de données (texte, nombre, date, etc.)
- **Default Value** (Valeur par défaut) : valeur par défaut si rien n'est spécifié
- **Primary** (Clé primaire) : cochez si c'est une clé primaire
- **Allow Nullable** (Autoriser NULL) : si la colonne peut être vide

Exemple de colonnes pour une table `taches` :

| Nom | Type | Par défaut | Clé primaire | Nullable |
|-----|------|------------|--------------|----------|
| id | uuid | gen_random_uuid() | ✓ | ✗ |
| titre | text | | ✗ | ✗ |
| description | text | | ✗ | ✓ |
| terminee | boolean | false | ✗ | ✗ |
| date_creation | timestamp with time zone | now() | ✗ | ✗ |
| user_id | uuid | auth.uid() | ✗ | ✗ |

### 4. Créer la table

Une fois les colonnes définies, cliquez sur "Save" (Sauvegarder) pour créer votre table.

## Configurer la sécurité (RLS)

Si vous avez activé RLS, vous devez définir des politiques de sécurité :

1. Allez dans l'onglet "Authentication" > "Policies"
2. Trouvez votre table et cliquez sur "New Policy" (Nouvelle politique)
3. Choisissez un modèle ou créez une politique personnalisée

Exemple de politique simple pour que les utilisateurs voient uniquement leurs propres données :

```sql
(auth.uid() = user_id)
```

## Accéder à votre table depuis le code

Pour accéder à votre table depuis votre application :

```javascript
// Récupérer les données
const { data, error } = await supabase
  .from('taches')
  .select('*')
  .eq('user_id', userId);

// Insérer une nouvelle entrée
const { data, error } = await supabase
  .from('taches')
  .insert([
    { titre: 'Nouvelle tâche', description: 'Description de la tâche' }
  ]);

// Mettre à jour une entrée
const { data, error } = await supabase
  .from('taches')
  .update({ terminee: true })
  .eq('id', tacheId);

// Supprimer une entrée
const { data, error } = await supabase
  .from('taches')
  .delete()
  .eq('id', tacheId);
```

## Exemple complet d'intégration dans une application

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Gestionnaire de Tâches</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <h1>Mes Tâches</h1>
  
  <div>
    <input type="text" id="nouvelleTache" placeholder="Nouvelle tâche">
    <button id="ajouterTache">Ajouter</button>
  </div>
  
  <ul id="listeTaches"></ul>
  
  <script>
    // Initialiser Supabase
    const supabaseUrl = 'VOTRE_URL_SUPABASE';
    const supabaseKey = 'VOTRE_CLE_ANONYME';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Charger les tâches
    async function chargerTaches() {
      const { data, error } = await supabase
        .from('taches')
        .select('*')
        .order('date_creation', { ascending: false });
        
      if (error) {
        console.error('Erreur:', error);
        return;
      }
      
      const listeTaches = document.getElementById('listeTaches');
      listeTaches.innerHTML = '';
      
      data.forEach(tache => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="${tache.terminee ? 'terminee' : ''}">${tache.titre}</span>
          <button data-id="${tache.id}" class="terminer">✓</button>
          <button data-id="${tache.id}" class="supprimer">×</button>
        `;
        listeTaches.appendChild(li);
      });
      
      // Ajouter les écouteurs d'événements
      document.querySelectorAll('.terminer').forEach(btn => {
        btn.addEventListener('click', terminerTache);
      });
      
      document.querySelectorAll('.supprimer').forEach(btn => {
        btn.addEventListener('click', supprimerTache);
      });
    }
    
    // Ajouter une tâche
    async function ajouterTache() {
      const input = document.getElementById('nouvelleTache');
      const titre = input.value.trim();
      
      if (!titre) return;
      
      const { error } = await supabase
        .from('taches')
        .insert([{ titre }]);
        
      if (error) {
        console.error('Erreur:', error);
        return;
      }
      
      input.value = '';
      chargerTaches();
    }
    
    // Terminer une tâche
    async function terminerTache(e) {
      const id = e.target.getAttribute('data-id');
      
      const { error } = await supabase
        .from('taches')
        .update({ terminee: true })
        .eq('id', id);
        
      if (error) {
        console.error('Erreur:', error);
        return;
      }
      
      chargerTaches();
    }
    
    // Supprimer une tâche
    async function supprimerTache(e) {
      const id = e.target.getAttribute('data-id');
      
      const { error } = await supabase
        .from('taches')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Erreur:', error);
        return;
      }
      
      chargerTaches();
    }
    
    // Initialiser l'application
    document.getElementById('ajouterTache').addEventListener('click', ajouterTache);
    document.getElementById('nouvelleTache').addEventListener('keypress', e => {
      if (e.key === 'Enter') ajouterTache();
    });
    
    // Charger les tâches au démarrage
    chargerTaches();
  </script>
  
  <style>
    .terminee {
      text-decoration: line-through;
      color: #888;
    }
  </style>
</body>
</html>
```

## Dépannage

Si vous rencontrez des problèmes :

1. Vérifiez que les clés Supabase sont correctes
2. Assurez-vous que les politiques RLS sont bien configurées
3. Consultez les journaux dans l'interface Supabase (section "Logs")
4. Vérifiez les erreurs dans la console du navigateur 