-- ============================================================
-- KORE Software - Migrations Supabase (VERSION SÉCURISÉE)
-- ============================================================
-- Cette version vérifie l'existence des colonnes avant de les ajouter
-- Exécuter ce script dans Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : Ajouter colonnes GPS à la table CHANTIERS
-- ============================================================

-- Ajouter latitude si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chantiers' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE chantiers ADD COLUMN latitude FLOAT;
  END IF;
END $$;

-- Ajouter longitude si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chantiers' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE chantiers ADD COLUMN longitude FLOAT;
  END IF;
END $$;

-- Ajouter rayon_geofence si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chantiers' AND column_name = 'rayon_geofence'
  ) THEN
    ALTER TABLE chantiers ADD COLUMN rayon_geofence INT DEFAULT 100;
  END IF;
END $$;

-- Ajouter gps_calibre_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chantiers' AND column_name = 'gps_calibre_at'
  ) THEN
    ALTER TABLE chantiers ADD COLUMN gps_calibre_at TIMESTAMP;
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 2 : Ajouter colonnes GPS à la table POINTAGE
-- ============================================================

-- Ajouter latitude si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pointage' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE pointage ADD COLUMN latitude FLOAT;
  END IF;
END $$;

-- Ajouter longitude si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pointage' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE pointage ADD COLUMN longitude FLOAT;
  END IF;
END $$;

-- Ajouter distance_m si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pointage' AND column_name = 'distance_m'
  ) THEN
    ALTER TABLE pointage ADD COLUMN distance_m INT;
  END IF;
END $$;

-- Ajouter gps_valide si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pointage' AND column_name = 'gps_valide'
  ) THEN
    ALTER TABLE pointage ADD COLUMN gps_valide BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 3 : Ajouter colonnes GPS à la table MATERIAUX
-- ============================================================

-- Ajouter latitude si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE materiaux ADD COLUMN latitude FLOAT;
  END IF;
END $$;

-- Ajouter longitude si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE materiaux ADD COLUMN longitude FLOAT;
  END IF;
END $$;

-- Ajouter photo_recu_url si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'photo_recu_url'
  ) THEN
    ALTER TABLE materiaux ADD COLUMN photo_recu_url TEXT;
  END IF;
END $$;

-- Ajouter photo_recu_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'photo_recu_at'
  ) THEN
    ALTER TABLE materiaux ADD COLUMN photo_recu_at TIMESTAMP;
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 4 : Créer la table AUDIT_FRAUDE (si elle n'existe pas)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_fraude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
  auteur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_fraude TEXT NOT NULL,
  details JSONB,
  statut TEXT DEFAULT 'bloqué',
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ÉTAPE 5 : Créer les INDEX pour performance
-- ============================================================

-- Index sur chantiers
CREATE INDEX IF NOT EXISTS idx_chantiers_gps ON chantiers(latitude, longitude);

-- Index sur pointage
CREATE INDEX IF NOT EXISTS idx_pointage_gps ON pointage(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pointage_gps_valide ON pointage(gps_valide);

-- Index sur materiaux
CREATE INDEX IF NOT EXISTS idx_materiaux_photo ON materiaux(photo_recu_url);
CREATE INDEX IF NOT EXISTS idx_materiaux_gps ON materiaux(latitude, longitude);

-- Index sur audit_fraude
CREATE INDEX IF NOT EXISTS idx_audit_fraude_entreprise ON audit_fraude(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_audit_fraude_chantier ON audit_fraude(chantier_id);
CREATE INDEX IF NOT EXISTS idx_audit_fraude_auteur ON audit_fraude(auteur_id);
CREATE INDEX IF NOT EXISTS idx_audit_fraude_type ON audit_fraude(type_fraude);
CREATE INDEX IF NOT EXISTS idx_audit_fraude_timestamp ON audit_fraude(timestamp DESC);

-- ============================================================
-- ÉTAPE 6 : Activer Row Level Security (RLS) sur AUDIT_FRAUDE
-- ============================================================

ALTER TABLE audit_fraude ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ÉTAPE 7 : Créer les POLICIES RLS pour AUDIT_FRAUDE
-- ============================================================

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Voir fraudes de son entreprise" ON audit_fraude;
DROP POLICY IF EXISTS "Système insère fraudes" ON audit_fraude;

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

-- ============================================================
-- ÉTAPE 8 : Vérification finale
-- ============================================================

-- Vérifier toutes les colonnes ajoutées
SELECT 
  'chantiers' as table_name,
  COUNT(*) as columns_added
FROM information_schema.columns 
WHERE table_name = 'chantiers' 
AND column_name IN ('latitude', 'longitude', 'rayon_geofence', 'gps_calibre_at')

UNION ALL

SELECT 
  'pointage' as table_name,
  COUNT(*) as columns_added
FROM information_schema.columns 
WHERE table_name = 'pointage' 
AND column_name IN ('latitude', 'longitude', 'distance_m', 'gps_valide')

UNION ALL

SELECT 
  'materiaux' as table_name,
  COUNT(*) as columns_added
FROM information_schema.columns 
WHERE table_name = 'materiaux' 
AND column_name IN ('latitude', 'longitude', 'photo_recu_url', 'photo_recu_at')

UNION ALL

SELECT 
  'audit_fraude' as table_name,
  COUNT(*) as columns_added
FROM information_schema.columns 
WHERE table_name = 'audit_fraude';

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
