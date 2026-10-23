-- ============================================================
-- TEST MANUEL - Créer un Accès Partenaire pour Tester
-- ============================================================
-- Ce script crée manuellement un accès partenaire pour tester le portail

-- 1. VÉRIFIER QUE LA TABLE EXISTE
SELECT COUNT(*) as nombre_acces FROM acces_partenaires;

-- 2. VÉRIFIER LES CHANTIERS DISPONIBLES
SELECT id, nom_chantier FROM chantiers LIMIT 5;

-- 3. CRÉER UN ACCÈS PARTENAIRE MANUELLEMENT
-- Remplacez 'VOTRE_CHANTIER_ID' par l'ID d'un chantier réel
INSERT INTO acces_partenaires (
    chantier_id,
    code_acces,
    lien_acces,
    actif,
    created_by
) VALUES (
    'VOTRE_CHANTIER_ID',  -- ← Remplacez par l'ID du chantier
    'TEST123',             -- Code d'accès pour tester
    gen_random_uuid(),     -- Lien d'accès aléatoire
    true,                  -- Actif
    auth.uid()             -- Créé par l'utilisateur actuel
)
ON CONFLICT DO NOTHING;

-- 4. VÉRIFIER QUE L'ACCÈS A ÉTÉ CRÉÉ
SELECT * FROM acces_partenaires 
WHERE code_acces = 'TEST123'
ORDER BY date_creation DESC;

-- 5. VÉRIFIER LES PHOTOS POUR CE CHANTIER
-- Remplacez 'VOTRE_CHANTIER_ID' par l'ID du chantier
SELECT COUNT(*) as nombre_photos 
FROM photos 
WHERE chantier_id = 'VOTRE_CHANTIER_ID';

-- 6. AFFICHER LES PHOTOS
SELECT id, url_photo, description, date_prise_vue, latitude, longitude
FROM photos 
WHERE chantier_id = 'VOTRE_CHANTIER_ID'
ORDER BY date_prise_vue DESC
LIMIT 10;
