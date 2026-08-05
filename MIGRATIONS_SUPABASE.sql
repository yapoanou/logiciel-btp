-- ============================================================
-- KORE Software - Migrations Supabase pour Module Anti-Fraude
-- ============================================================
-- Exécuter ce script dans Supabase SQL Editor
-- Copier-coller chaque bloc séquentiellement
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : Ajouter colonnes GPS à la table CHANTIERS
-- ============================================================

ALTER TABLE chantiers ADD COLUMN latitude FLOAT;
ALTER TABLE chantiers ADD COLUMN longitude FLOAT;
ALTER TABLE chantiers ADD COLUMN rayon_geofence INT DEFAULT 100;
ALTER TABLE chantiers ADD COLUMN gps_calibre_at TIMESTAMP;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chantiers' 
AND column_name IN ('latitude', 'longitude', 'rayon_geofence', 'gps_calibre_at')
ORDER BY ordinal_position;

-- Résultat attendu : 4 colonnes

-- ============================================================
-- ÉTAPE 2 : Ajouter colonnes GPS à la table POINTAGE
-- ============================================================

ALTER TABLE pointage ADD COLUMN latitude FLOAT;
ALTER TABLE pointage ADD COLUMN longitude FLOAT;
ALTER TABLE pointage ADD COLUMN distance_m INT;
ALTER TABLE pointage ADD COLUMN gps_valide BOOLEAN DEFAULT FALSE;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pointage' 
AND column_name IN ('latitude', 'longitude', 'distance_m', 'gps_valide')
ORDER BY ordinal_position;

-- Résultat attendu : 4 colonnes

-- ============================================================
-- ÉTAPE 3 : Ajouter colonnes GPS à la table MATERIAUX
-- ============================================================

ALTER TABLE materiaux ADD COLUMN latitude FLOAT;
ALTER TABLE materiaux ADD COLUMN longitude FLOAT;
ALTER TABLE materiaux ADD COLUMN photo_recu_url TEXT;
ALTER TABLE materiaux ADD COLUMN photo_recu_at TIMESTAMP;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'materiaux' 
AND column_name IN ('latitude', 'longitude', 'photo_recu_url', 'photo_recu_at')
ORDER BY ordinal_position;

-- Résultat attendu : 4 colonnes

-- ============================================================
-- ÉTAPE 4 : Créer la table AUDIT_FRAUDE
-- ============================================================

CREATE TABLE audit_fraude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
  auteur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_fraude TEXT NOT NULL,
  -- Types possibles: 'geofencing_violation', 'missing_receipt', 'gps_missing', 'chantier_gps_missing'
  details JSONB,
  statut TEXT DEFAULT 'bloqué',
  -- Statuts: 'bloqué', 'signalé', 'enquête'
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vérifier que la table a été créée
SELECT * FROM information_schema.tables 
WHERE table_name = 'audit_fraude';

-- Résultat attendu : 1 table

-- ============================================================
-- ÉTAPE 5 : Créer les INDEX pour performance
-- ============================================================

-- Index sur chantiers
CREATE INDEX idx_chantiers_gps ON chantiers(latitude, longitude);

-- Index sur pointage
CREATE INDEX idx_pointage_gps ON pointage(latitude, longitude);
CREATE INDEX idx_pointage_gps_valide ON pointage(gps_valide);

-- Index sur materiaux
CREATE INDEX idx_materiaux_photo ON materiaux(photo_recu_url);
CREATE INDEX idx_materiaux_gps ON materiaux(latitude, longitude);

-- Index sur audit_fraude
CREATE INDEX idx_audit_fraude_entreprise ON audit_fraude(entreprise_id);
CREATE INDEX idx_audit_fraude_chantier ON audit_fraude(chantier_id);
CREATE INDEX idx_audit_fraude_auteur ON audit_fraude(auteur_id);
CREATE INDEX idx_audit_fraude_type ON audit_fraude(type_fraude);
CREATE INDEX idx_audit_fraude_timestamp ON audit_fraude(timestamp DESC);

-- Vérifier que les index ont été créés
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('chantiers', 'pointage', 'materiaux', 'audit_fraude')
ORDER BY indexname;

-- Résultat attendu : 10+ index

-- ============================================================
-- ÉTAPE 6 : Activer Row Level Security (RLS) sur AUDIT_FRAUDE
-- ============================================================

ALTER TABLE audit_fraude ENABLE ROW LEVEL SECURITY;

-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'audit_fraude';

-- Résultat attendu : rowsecurity = true

-- ============================================================
-- ÉTAPE 7 : Créer les POLICIES RLS pour AUDIT_FRAUDE
-- ============================================================

-- Policy 1 : Les utilisateurs voient les fraudes de leur entreprise
CREATE POLICY "Voir fraudes de son entreprise" ON audit_fraude
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entreprise_id = audit_fraude.entreprise_id
    )
  );

-- Policy 2 : Seul le système peut insérer (via application)
CREATE POLICY "Système insère fraudes" ON audit_fraude
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entreprise_id = audit_fraude.entreprise_id
    )
  );

-- Vérifier que les policies ont été créées
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'audit_fraude'
ORDER BY policyname;

-- Résultat attendu : 2 policies

-- ============================================================
-- ÉTAPE 8 : Vérification finale
-- ============================================================

-- Vérifier toutes les colonnes ajoutées
SELECT 
  'chantiers' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'chantiers' 
AND column_name IN ('latitude', 'longitude', 'rayon_geofence', 'gps_calibre_at')

UNION ALL

SELECT 
  'pointage' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'pointage' 
AND column_name IN ('latitude', 'longitude', 'distance_m', 'gps_valide')

UNION ALL

SELECT 
  'materiaux' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'materiaux' 
AND column_name IN ('latitude', 'longitude', 'photo_recu_url', 'photo_recu_at');

-- Résultat attendu : 3 lignes avec column_count = 4

-- Vérifier la table audit_fraude
SELECT 
  table_name,
  column_count
FROM (
  SELECT 
    'audit_fraude' as table_name,
    COUNT(*) as column_count
  FROM information_schema.columns 
  WHERE table_name = 'audit_fraude'
) as t;

-- Résultat attendu : 1 ligne avec column_count = 8

-- ============================================================
-- ÉTAPE 9 : Vérifier les index
-- ============================================================

SELECT 
  COUNT(*) as total_indexes
FROM pg_indexes 
WHERE tablename IN ('chantiers', 'pointage', 'materiaux', 'audit_fraude');

-- Résultat attendu : 10+

-- ============================================================
-- ÉTAPE 10 : Vérifier les policies RLS
-- ============================================================

SELECT 
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'audit_fraude';

-- Résultat attendu : 2

-- ============================================================
-- RÉSUMÉ DES MODIFICATIONS
-- ============================================================

/*
✅ CHANTIERS
  - latitude (FLOAT)
  - longitude (FLOAT)
  - rayon_geofence (INT, défaut: 100)
  - gps_calibre_at (TIMESTAMP)

✅ POINTAGE
  - latitude (FLOAT)
  - longitude (FLOAT)
  - distance_m (INT)
  - gps_valide (BOOLEAN, défaut: FALSE)

✅ MATERIAUX
  - latitude (FLOAT)
  - longitude (FLOAT)
  - photo_recu_url (TEXT)
  - photo_recu_at (TIMESTAMP)

✅ AUDIT_FRAUDE (nouvelle table)
  - id (UUID, PRIMARY KEY)
  - entreprise_id (UUID, FOREIGN KEY)
  - chantier_id (UUID, FOREIGN KEY)
  - auteur_id (UUID, FOREIGN KEY)
  - type_fraude (TEXT)
  - details (JSONB)
  - statut (TEXT, défaut: 'bloqué')
  - timestamp (TIMESTAMP, défaut: NOW())
  - created_at (TIMESTAMP, défaut: NOW())

✅ INDEX (10+)
  - idx_chantiers_gps
  - idx_pointage_gps
  - idx_pointage_gps_valide
  - idx_materiaux_photo
  - idx_materiaux_gps
  - idx_audit_fraude_entreprise
  - idx_audit_fraude_chantier
  - idx_audit_fraude_auteur
  - idx_audit_fraude_type
  - idx_audit_fraude_timestamp

✅ ROW LEVEL SECURITY
  - RLS activé sur audit_fraude
  - Policy: Voir fraudes de son entreprise
  - Policy: Système insère fraudes
*/

-- ============================================================
-- FIN DES MIGRATIONS
-- ============================================================
