# 🚨 KORE Software - Module Anti-Fraude
## Documentation Complète

---

## 📋 Table des matières

1. [Architecture du système](#architecture)
2. [Migrations Supabase](#migrations)
3. [Modules JavaScript](#modules)
4. [Guide utilisateur - Chefs](#guide-chefs)
5. [Guide administrateur](#guide-admin)
6. [Configuration et déploiement](#deploiement)
7. [Troubleshooting](#troubleshooting)

---

## <a name="architecture"></a>🏗️ Architecture du système

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    KORE Software - Anti-Fraude              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Pointages       │         │  Matériaux       │          │
│  │  (Géofencing)    │         │  (Photo + GPS)   │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
│           ┌────────────▼──────────────┐                     │
│           │  SecurityManager          │                     │
│           │  (Validation centralisée) │                     │
│           └────────────┬──────────────┘                     │
│                        │                                     │
│           ┌────────────▼──────────────┐                     │
│           │  Supabase                 │                     │
│           │  - audit_fraude (logs)    │                     │
│           │  - chantiers (GPS)        │                     │
│           │  - pointage (GPS)         │                     │
│           │  - materiaux (photo+GPS)  │                     │
│           └───────────────────────────┘                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Composants principaux

| Fichier | Rôle | Dépendances |
|---------|------|-------------|
| `geolocation.js` | Gestion GPS, calcul distance, géofencing | Aucune |
| `security-module.js` | Validation anti-fraude centralisée | `geolocation.js`, Supabase |
| `chef-pointages.html` | Interface pointages avec géofencing | `geolocation.js`, `security-module.js` |
| `chef-materiaux.html` | Interface achats avec photo + GPS | `geolocation.js`, `security-module.js` |
| `admin-fraude.html` | Dashboard monitoring fraude | Supabase |

---

## <a name="migrations"></a>🗄️ Migrations Supabase

### 1. Ajouter colonnes GPS à la table `chantiers`

```sql
-- Ajouter les colonnes de géolocalisation
ALTER TABLE chantiers ADD COLUMN latitude FLOAT;
ALTER TABLE chantiers ADD COLUMN longitude FLOAT;
ALTER TABLE chantiers ADD COLUMN rayon_geofence INT DEFAULT 100;
ALTER TABLE chantiers ADD COLUMN gps_calibre_at TIMESTAMP;

-- Créer un index pour les requêtes géospatiales
CREATE INDEX idx_chantiers_gps ON chantiers(latitude, longitude);
```

**Colonnes ajoutées :**
- `latitude` (FLOAT) : Latitude du chantier
- `longitude` (FLOAT) : Longitude du chantier
- `rayon_geofence` (INT) : Rayon en mètres (défaut: 100m)
- `gps_calibre_at` (TIMESTAMP) : Date de calibrage GPS

---

### 2. Ajouter colonnes GPS à la table `pointage`

```sql
-- Ajouter les colonnes de traçabilité GPS
ALTER TABLE pointage ADD COLUMN latitude FLOAT;
ALTER TABLE pointage ADD COLUMN longitude FLOAT;
ALTER TABLE pointage ADD COLUMN distance_m INT;
ALTER TABLE pointage ADD COLUMN gps_valide BOOLEAN DEFAULT FALSE;

-- Créer des index
CREATE INDEX idx_pointage_gps ON pointage(latitude, longitude);
CREATE INDEX idx_pointage_gps_valide ON pointage(gps_valide);
```

**Colonnes ajoutées :**
- `latitude` (FLOAT) : Latitude du pointage
- `longitude` (FLOAT) : Longitude du pointage
- `distance_m` (INT) : Distance vs chantier en mètres
- `gps_valide` (BOOLEAN) : GPS dans la zone ?

---

### 3. Ajouter colonnes à la table `materiaux`

```sql
-- Ajouter les colonnes de traçabilité
ALTER TABLE materiaux ADD COLUMN latitude FLOAT;
ALTER TABLE materiaux ADD COLUMN longitude FLOAT;
ALTER TABLE materiaux ADD COLUMN photo_recu_url TEXT;
ALTER TABLE materiaux ADD COLUMN photo_recu_at TIMESTAMP;

-- Créer des index
CREATE INDEX idx_materiaux_photo ON materiaux(photo_recu_url);
CREATE INDEX idx_materiaux_gps ON materiaux(latitude, longitude);
```

**Colonnes ajoutées :**
- `latitude` (FLOAT) : Latitude de l'achat
- `longitude` (FLOAT) : Longitude de l'achat
- `photo_recu_url` (TEXT) : URL de la photo du reçu
- `photo_recu_at` (TIMESTAMP) : Date d'upload photo

---

### 4. Créer la table `audit_fraude`

```sql
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

-- Créer des index
CREATE INDEX idx_audit_fraude_entreprise ON audit_fraude(entreprise_id);
CREATE INDEX idx_audit_fraude_chantier ON audit_fraude(chantier_id);
CREATE INDEX idx_audit_fraude_auteur ON audit_fraude(auteur_id);
CREATE INDEX idx_audit_fraude_type ON audit_fraude(type_fraude);
CREATE INDEX idx_audit_fraude_timestamp ON audit_fraude(timestamp DESC);

-- Activer RLS
ALTER TABLE audit_fraude ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs ne voient que les fraudes de leur entreprise
CREATE POLICY "Voir fraudes de son entreprise" ON audit_fraude
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entreprise_id = audit_fraude.entreprise_id
    )
  );

-- Politique RLS : Seul le système peut insérer
CREATE POLICY "Système insère fraudes" ON audit_fraude
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entreprise_id = audit_fraude.entreprise_id
    )
  );
```

**Structure de la table :**
- `id` (UUID) : Identifiant unique
- `entreprise_id` (UUID) : Entreprise concernée
- `chantier_id` (UUID) : Chantier concerné (nullable)
- `auteur_id` (UUID) : Utilisateur qui a tenté la fraude
- `type_fraude` (TEXT) : Type de fraude détecté
- `details` (JSONB) : Détails spécifiques (distance, montant, etc.)
- `statut` (TEXT) : État de la tentative
- `timestamp` (TIMESTAMP) : Date/heure de la tentative

---

## <a name="modules"></a>📦 Modules JavaScript

### `geolocation.js`

Module de géolocalisation réutilisable avec gestion d'erreurs robuste.

#### Fonctions principales

```javascript
// Récupérer la position GPS actuelle
const position = await GeoLocationModule.getPosition();
// Retourne: { latitude, longitude, accuracy, timestamp }

// Récupérer avec retry automatique
const position = await GeoLocationModule.getPositionWithRetry(3);

// Calculer distance entre deux points (Haversine)
const distance = GeoLocationModule.calculateDistance(lat1, lon1, lat2, lon2);
// Retourne: distance en mètres

// Vérifier si dans la zone géofence
const result = GeoLocationModule.isWithinGeofence(userPos, chantierPos, 100);
// Retourne: { isWithin, distance, radiusMeters, message }

// Formater position pour affichage
const text = GeoLocationModule.formatPosition(position);
// Retourne: "48.856613, 2.352222 (±15m)"

// Formater distance
const text = GeoLocationModule.formatDistance(250);
// Retourne: "250m"

// Créer URL Google Maps
const url = GeoLocationModule.getMapsUrl(lat, lon);
```

#### Gestion des erreurs

```javascript
try {
  const position = await GeoLocationModule.getPositionWithRetry();
} catch (error) {
  switch (error.code) {
    case GeoLocationModule.ERROR_CODES.PERMISSION_DENIED:
      // Permission refusée
      break;
    case GeoLocationModule.ERROR_CODES.POSITION_UNAVAILABLE:
      // GPS désactivé
      break;
    case GeoLocationModule.ERROR_CODES.TIMEOUT:
      // Timeout GPS
      break;
    case GeoLocationModule.ERROR_CODES.NOT_SUPPORTED:
      // Navigateur non supporté
      break;
  }
}
```

---

### `security-module.js`

Module de sécurité centralisé pour validation anti-fraude.

#### Classe `SecurityManager`

```javascript
// Initialiser
const securityManager = new SecurityModule.SecurityManager(supabaseClient);

// Valider un pointage
const validation = await securityManager.validatePointage(
  pointage,           // { chantier_id, equipe_id, date_pointage, statut }
  userPosition,       // { latitude, longitude, accuracy }
  chantierData        // { id, latitude, longitude, rayon_geofence }
);
// Retourne: { valid, message, distance, gpsValid }

// Valider un achat
const validation = await securityManager.validateAchat(
  achat,              // { chantier_id, designation, prix_total }
  photoFile,          // File object
  userPosition        // { latitude, longitude, accuracy }
);
// Retourne: { valid, message, photoUrl }

// Logger une tentative de fraude
await securityManager.logFraudAttempt(
  'geofencing_violation',
  { type: 'pointage', chantier_id: '...', distance: 150, radius: 100 }
);

// Calibrer GPS d'un chantier
const result = await securityManager.calibrateChantierGPS(
  chantier_id,
  { latitude, longitude }
);

// Enregistrer pointage avec GPS
const result = await securityManager.recordPointageWithGPS(
  pointageData,
  { latitude, longitude, distance }
);

// Enregistrer achat avec GPS et photo
const result = await securityManager.recordAchatWithGPS(
  achatData,
  photoUrl,
  { latitude, longitude }
);

// Récupérer rapport d'audit
const report = await securityManager.getAuditReport(
  chantier_id,
  { startDate: '2026-01-01', endDate: '2026-12-31', typeFraude: 'geofencing_violation' }
);
```

---

## <a name="guide-chefs"></a>👷 Guide utilisateur - Chefs de chantier

### Pointages avec géofencing

#### Procédure

1. **Accéder à la page Pointage**
   - Cliquez sur "Pointage Équipe" depuis l'accueil

2. **Sélectionner le chantier et l'ouvrier**
   - Choisissez le chantier dans le dropdown
   - Sélectionnez l'ouvrier à pointer

3. **Activer le GPS**
   - Cliquez sur le bouton **"ACTIVER GPS"** (orange)
   - Attendez la localisation (max 10 secondes)
   - Vérifiez le statut GPS affiché

4. **Vérifier la zone de géofencing**
   - ✅ **Vert** : Vous êtes dans la zone (pointage autorisé)
   - ❌ **Rouge** : Vous êtes hors zone (pointage bloqué)
   - Distance affichée : `XXXm / 100m`

5. **Sélectionner le statut**
   - Cliquez sur **"Présent"** ou **"Absent"**

6. **Enregistrer le pointage**
   - Cliquez sur **"ENREGISTRER LE POINTAGE"**
   - Confirmation : "✅ POINTAGE BIEN REÇU"

#### Dépannage

| Problème | Solution |
|----------|----------|
| GPS non trouvé | Vérifiez que le GPS est activé sur votre téléphone |
| Timeout GPS | Attendez quelques secondes, puis réessayez |
| Hors zone | Rapprochez-vous du chantier (max 100m) |
| Permission refusée | Autorisez la géolocalisation dans les paramètres du navigateur |

---

### Achats avec photo et GPS

#### Procédure

1. **Accéder à la page Achats**
   - Cliquez sur "Achats & Stocks" depuis l'accueil

2. **Remplir les informations**
   - Sélectionnez le chantier
   - Entrez la désignation (ex: "50 sacs de ciment")
   - Entrez la quantité
   - Entrez le prix total
   - Sélectionnez le mode de paiement

3. **Ajouter la photo du reçu** ⭐ OBLIGATOIRE
   - Cliquez sur la zone bleue "Cliquez pour ajouter une photo"
   - Prenez une photo du reçu ou sélectionnez une image
   - Vérifiez l'aperçu affiché
   - La zone devient verte : "✅ Photo sélectionnée"

4. **Capturer le GPS**
   - Cliquez sur **"CAPTURER GPS"** (orange)
   - Attendez la localisation
   - Vérifiez le statut GPS (vert = succès)

5. **Valider l'achat**
   - Cliquez sur **"VALIDER L'ACHAT"**
   - Confirmation : "✅ ACHAT ENREGISTRÉ"

#### Points importants

- 📸 **Photo obligatoire** : Tous les achats doivent avoir une photo du reçu
- 📍 **GPS obligatoire** : La position est enregistrée avec chaque achat
- 📤 **Upload sécurisé** : Les photos sont uploadées sur Supabase Storage
- 🔒 **Traçabilité complète** : Chaque achat est lié à un utilisateur, un chantier et une position GPS

---

## <a name="guide-admin"></a>👨‍💼 Guide administrateur

### Dashboard Anti-Fraude

#### Accès

- URL : `/admin-fraude.html`
- Rôle requis : `admin` ou `pdg`
- Redirection automatique si accès non autorisé

#### Sections principales

##### 1. Statistiques (Haut de page)

Affiche 4 KPIs en temps réel :
- 🚫 **Tentatives bloquées** : Total des fraudes détectées
- 🚫 **Violations géofencing** : Pointages hors zone
- 📸 **Photos manquantes** : Achats sans photo
- 📍 **GPS manquants** : Tentatives sans GPS

##### 2. Filtres

Filtrez les données par :
- **Chantier** : Sélectionnez un chantier spécifique
- **Type** : Violation géofencing, photo manquante, GPS manquant
- **Date début** : Filtrer à partir d'une date
- **Date fin** : Filtrer jusqu'à une date
- **Bouton Rechercher** : Appliquer les filtres

##### 3. Tableau des tentatives

Affiche toutes les tentatives de fraude avec :
- **Date/Heure** : Quand la tentative a eu lieu
- **Type** : Type de fraude (badge coloré)
- **Utilisateur** : Nom et email du chef
- **Chantier** : Chantier concerné
- **Détails** : Distance ou montant
- **Statut** : Bloqué, Signalé, Enquête
- **Actions** : Bouton "Détails" pour voir plus d'infos

##### 4. Modal Détails

Cliquez sur "Détails" pour voir :
- Informations complètes de la tentative
- Détails spécifiques (distance, montant, raison)
- Données de l'utilisateur
- Timestamp exact

#### Cas d'usage

**Cas 1 : Violation géofencing**
```
Chef tente de pointer à 150m du chantier (limite: 100m)
→ Pointage bloqué
→ Tentative enregistrée dans audit_fraude
→ Admin voit dans le dashboard
→ Admin peut enquêter
```

**Cas 2 : Photo manquante**
```
Chef tente d'enregistrer un achat sans photo
→ Achat bloqué
→ Message d'erreur : "Photo du reçu obligatoire"
→ Tentative enregistrée
→ Admin voit dans le dashboard
```

**Cas 3 : GPS manquant**
```
Chef tente de pointer sans GPS activé
→ Pointage bloqué
→ Message d'erreur : "GPS non disponible"
→ Tentative enregistrée
→ Admin voit dans le dashboard
```

---

## <a name="deploiement"></a>🚀 Configuration et déploiement

### Prérequis

1. **Supabase**
   - Projet Supabase actif
   - Clé anon configurée dans `supabase.js`
   - Bucket `photos-chantiers` créé

2. **Navigateur**
   - Support HTTPS (géolocalisation requiert HTTPS)
   - Support Geolocation API
   - Support localStorage

3. **Permissions**
   - Géolocalisation activée sur l'appareil
   - Caméra activée (pour photos)

### Étapes de déploiement

#### 1. Exécuter les migrations Supabase

```sql
-- Copier-coller les migrations SQL ci-dessus dans Supabase SQL Editor
-- Exécuter chaque bloc séquentiellement
```

#### 2. Vérifier les fichiers

```bash
# Vérifier que tous les fichiers sont présents
- geolocation.js
- security-module.js
- chef-pointages.html
- chef-materiaux.html
- admin-fraude.html
- DOCUMENTATION_ANTI_FRAUDE.md
```

#### 3. Tester en développement

```bash
# Tester sur localhost avec HTTPS
# Utiliser serve.ps1 ou un serveur local HTTPS
```

#### 4. Déployer en production

```bash
# Déployer tous les fichiers sur le serveur
# Vérifier les URLs dans les scripts
# Tester sur mobile (géolocalisation)
```

### Configuration des variables

Dans `supabase.js` :
```javascript
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON = 'votre-clé-anon';
```

Dans `security-module.js` (optionnel) :
```javascript
const CONFIG = {
    GEOFENCE_RADIUS_M: 100,      // Rayon géofence (mètres)
    RECEIPT_REQUIRED: true,       // Photo obligatoire
    GPS_REQUIRED: true,           // GPS obligatoire
    LOG_ATTEMPTS: true            // Logger les tentatives
};
```

---

## <a name="troubleshooting"></a>🔧 Troubleshooting

### Problèmes GPS

#### "GPS non supporté par ce navigateur"
- **Cause** : Navigateur ancien ou sans support Geolocation API
- **Solution** : Utiliser un navigateur moderne (Chrome, Firefox, Safari)

#### "Permission de géolocalisation refusée"
- **Cause** : Utilisateur a refusé la permission
- **Solution** : 
  1. Aller dans les paramètres du navigateur
  2. Autoriser la géolocalisation pour le site
  3. Rafraîchir la page

#### "Position indisponible"
- **Cause** : GPS désactivé sur l'appareil
- **Solution** : Activer le GPS dans les paramètres du téléphone

#### "Délai d'attente dépassé"
- **Cause** : Mauvaise réception GPS
- **Solution** : 
  1. Aller dehors ou près d'une fenêtre
  2. Attendre quelques secondes
  3. Cliquer sur "RÉESSAYER"

### Problèmes de géofencing

#### "Vous êtes hors zone"
- **Cause** : Utilisateur trop loin du chantier
- **Solution** : 
  1. Rapprochez-vous du chantier
  2. Vérifiez que le chantier est bien calibré
  3. Contactez l'admin si le rayon est trop petit

#### "Chantier non calibré"
- **Cause** : Première utilisation du chantier
- **Solution** : 
  1. Le premier pointage calibrera automatiquement
  2. Assurez-vous d'être au bon endroit
  3. Activez le GPS avant de pointer

### Problèmes de photo

#### "Photo trop volumineuse"
- **Cause** : Fichier > 5MB
- **Solution** : 
  1. Compresser l'image
  2. Utiliser une photo de meilleure qualité
  3. Réduire la résolution

#### "Upload photo échoué"
- **Cause** : Problème de connexion ou bucket non configuré
- **Solution** : 
  1. Vérifier la connexion internet
  2. Vérifier que le bucket `photos-chantiers` existe
  3. Vérifier les permissions Supabase Storage

### Problèmes de base de données

#### "Erreur lors de l'enregistrement"
- **Cause** : Problème Supabase ou RLS
- **Solution** : 
  1. Vérifier la connexion Supabase
  2. Vérifier les politiques RLS
  3. Vérifier les colonnes de la table

#### "Tentatives de fraude non enregistrées"
- **Cause** : Table `audit_fraude` non créée
- **Solution** : Exécuter la migration SQL pour créer la table

---

## 📞 Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs du navigateur (F12 → Console)
3. Contacter l'équipe technique

---

## 📝 Changelog

### Version 1.0 (2026-08-05)
- ✅ Module de géolocalisation
- ✅ Géofencing sur pointages (100m)
- ✅ Photo obligatoire sur achats
- ✅ GPS obligatoire sur achats
- ✅ Dashboard admin anti-fraude
- ✅ Logging des tentatives de fraude
- ✅ Documentation complète

---

**KORE Software • Propulsé par Bâtisys Tech**
