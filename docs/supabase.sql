-- Schéma de base de données pour Supabase

-- Configuration des extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Pour les recherches textuelles améliorées

-- Fonction pour mettre à jour le timestamp automatiquement
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "username" TEXT UNIQUE,
  "full_name" TEXT,
  "avatar_url" TEXT,
  "website" TEXT,
  "bio" TEXT,
  "preferences" JSONB DEFAULT '{}'::JSONB,
  "role" TEXT DEFAULT 'user',  -- 'user', 'admin', 'premium'
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger pour mettre à jour le timestamp des profils
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Table des catégories d'outils
CREATE TABLE IF NOT EXISTS "categories" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "icon" TEXT,
  "slug" TEXT UNIQUE NOT NULL,
  "order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger pour mettre à jour le timestamp des catégories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Table pour les outils génériques (structure)
CREATE TABLE IF NOT EXISTS "tools" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category_id" UUID REFERENCES categories(id) ON DELETE SET NULL,
  "icon" TEXT,
  "path" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "is_premium" BOOLEAN DEFAULT false,
  "is_featured" BOOLEAN DEFAULT false,
  "metadata" JSONB DEFAULT '{}'::JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger pour mettre à jour le timestamp des outils
CREATE TRIGGER update_tools_updated_at
BEFORE UPDATE ON tools
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Table pour les tags des outils
CREATE TABLE IF NOT EXISTS "tags" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table de relation many-to-many entre outils et tags
CREATE TABLE IF NOT EXISTS "tool_tags" (
  "tool_id" UUID REFERENCES tools(id) ON DELETE CASCADE,
  "tag_id" UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, tag_id)
);

-- TABLES SPECIFIQUES AUX OUTILS (utilisées par data-sync.js)

-- Table pour les tâches (Todo)
CREATE TABLE IF NOT EXISTS "todos" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "task" TEXT NOT NULL,
  "is_completed" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger pour mettre à jour le timestamp des todos
CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Table pour les notes
CREATE TABLE IF NOT EXISTS "notes" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "title" TEXT,
  "content" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger pour mettre à jour le timestamp des notes
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Table pour l'historique de la calculatrice
CREATE TABLE IF NOT EXISTS "calculator_history" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "expression" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table pour les paramètres utilisateur
CREATE TABLE IF NOT EXISTS "settings" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  "settings_data" JSONB DEFAULT '{}'::JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger pour mettre à jour le timestamp des settings
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Configuration des politiques RLS (Row Level Security)

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politiques pour les profils
CREATE POLICY "Les utilisateurs peuvent voir tous les profils" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Les utilisateurs peuvent uniquement modifier leur propre profil" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Les utilisateurs peuvent créer leur propre profil" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Politiques pour les catégories (visibles par tous)
CREATE POLICY "Les catégories sont visibles par tous" ON categories FOR SELECT TO anon, authenticated USING (true);

-- Politiques pour les outils génériques (visibles par tous)
CREATE POLICY "Les outils sont visibles par tous" ON tools FOR SELECT TO anon, authenticated USING (true);

-- Politiques pour les tags (visibles par tous)
CREATE POLICY "Les tags sont visibles par tous" ON tags FOR SELECT TO anon, authenticated USING (true);

-- Politiques pour les relations tool_tags (visibles par tous)
CREATE POLICY "Les relations tool_tags sont visibles par tous" ON tool_tags FOR SELECT TO anon, authenticated USING (true);

-- Politiques pour les Todos (accès par l'utilisateur propriétaire)
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres todos" ON todos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Politiques pour les Notes (accès par l'utilisateur propriétaire)
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres notes" ON notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Politiques pour l'historique de la calculatrice (accès par l'utilisateur propriétaire)
CREATE POLICY "Les utilisateurs peuvent gérer leur propre historique de calculatrice" ON calculator_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Politiques pour les Settings (accès par l'utilisateur propriétaire)
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres settings" ON settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_tools_name_trgm ON tools USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tools_description_trgm ON tools USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tools_category_id ON tools (category_id);
CREATE INDEX IF NOT EXISTS idx_tools_is_premium ON tools (is_premium);
CREATE INDEX IF NOT EXISTS idx_tools_is_featured ON tools (is_featured);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes (user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_history_user_id ON calculator_history (user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings (user_id);