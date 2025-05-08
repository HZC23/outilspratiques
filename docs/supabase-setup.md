# Configuration de Supabase

Ce document explique comment configurer Supabase pour l'application Outils Pratiques.

## Création d'un projet Supabase

1. Créez un compte sur [Supabase](https://supabase.com/) si ce n'est pas déjà fait
2. Créez un nouveau projet avec un nom de votre choix (par exemple "outils-pratiques")
3. Notez l'URL de votre projet et la clé anon/public (vous en aurez besoin plus tard)

## Configuration des tables

Après avoir créé votre projet, vous devez créer les tables nécessaires pour stocker les données des utilisateurs.

### Table `todos`

```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT
);
```

### Table `notes`

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  color TEXT
);
```

### Table `calculator_history`

```sql
CREATE TABLE calculator_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expression TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table `settings`

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT,
  language TEXT,
  last_tool TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  favorites JSONB DEFAULT '[]'::jsonb,
  tools_order JSONB DEFAULT '[]'::jsonb
);
```

## Configuration des politiques RLS (Row Level Security)

Pour garantir que chaque utilisateur ne puisse accéder qu'à ses propres données, configurez les politiques RLS suivantes :

### Policy pour `todos`

```sql
-- Activer RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Politique de lecture (SELECT)
CREATE POLICY "Utilisateurs peuvent lire leurs propres todos" 
ON todos FOR SELECT 
USING (auth.uid() = user_id);

-- Politique d'insertion (INSERT)
CREATE POLICY "Utilisateurs peuvent créer leurs propres todos" 
ON todos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour (UPDATE)
CREATE POLICY "Utilisateurs peuvent mettre à jour leurs propres todos" 
ON todos FOR UPDATE 
USING (auth.uid() = user_id);

-- Politique de suppression (DELETE)
CREATE POLICY "Utilisateurs peuvent supprimer leurs propres todos" 
ON todos FOR DELETE 
USING (auth.uid() = user_id);
```

Répétez ce processus pour les tables `notes`, `calculator_history` et `settings` en adaptant les noms de politiques.

## Mise à jour de la configuration dans l'application

1. Ouvrez le fichier `js/supabase.js`
2. Remplacez les valeurs des variables `supabaseUrl` et `supabaseAnonKey` par celles de votre projet :

```javascript
const supabaseUrl = 'https://votre-projet.supabase.co';
const supabaseAnonKey = 'votre-clé-anon';
```

## Test de la configuration

1. Ouvrez la page `test-login.html` dans votre navigateur
2. Cliquez sur "Tester Supabase" pour vérifier que la bibliothèque est chargée
3. Cliquez sur "Tester le client" pour vérifier que le client Supabase est initialisé
4. Cliquez sur "Afficher le panneau de compte" pour tester la création d'un compte

## Fonctionnalités d'authentification

L'application prend en charge les fonctionnalités suivantes :

- Inscription d'utilisateurs
- Connexion avec email/mot de passe
- Déconnexion
- Réinitialisation de mot de passe
- Synchronisation automatique des données entre les appareils

## Personnalisation de l'authentification

Pour personnaliser davantage l'authentification, vous pouvez :

1. Activer des fournisseurs OAuth (Google, GitHub, etc.) dans la console Supabase
2. Personnaliser les emails envoyés aux utilisateurs
3. Configurer des redirections personnalisées après connexion/déconnexion

## Dépannage

Si vous rencontrez des problèmes :

1. Vérifiez la console du navigateur pour voir les erreurs
2. Assurez-vous que les clés Supabase sont correctes
3. Vérifiez que les tables et les politiques RLS sont correctement configurées
4. Essayez d'effectuer une requête directement via la console Supabase pour vérifier que tout fonctionne 

