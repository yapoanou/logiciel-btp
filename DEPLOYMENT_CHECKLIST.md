# 🚀 KORE Software - Checklist de déploiement anti-fraude

**Version** : 1.0  
**Date** : 5 août 2026  
**Durée estimée** : 2-3 heures

---

## ✅ Pré-déploiement (30 min)

### Vérifications préalables

- [ ] Accès Supabase disponible
- [ ] Accès serveur production disponible
- [ ] Backup base de données effectué
- [ ] Équipe notifiée du déploiement
- [ ] Fenêtre de maintenance planifiée

### Fichiers à déployer

```
✅ Nouveaux fichiers (3)
   [ ] geolocation.js
   [ ] security-module.js
   [ ] admin-fraude.html

✅ Fichiers modifiés (2)
   [ ] chef-pointages.html
   [ ] chef-materiaux.html

✅ Documentation (2)
   [ ] DOCUMENTATION_ANTI_FRAUDE.md
   [ ] IMPLEMENTATION_SUMMARY.md
```

---

## 🗄️ Phase 1 : Migrations Supabase (45 min)

### Étape 1.1 : Ajouter colonnes à `chantiers`

```sql
-- Exécuter dans Supabase SQL Editor
ALTER TABLE chantiers ADD COLUMN latitude FLOAT;
ALTER TABLE chantiers ADD COLUMN longitude FLOAT;
ALTER TABLE chantiers ADD COLUMN rayon_geofence INT DEFAULT 100;
ALTER TABLE chantiers ADD COLUMN gps_calibre_at TIMESTAMP;

-- Vérifier
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chantiers' 
AND column_name IN ('latitude', 'longitude', 'rayon_geofence', 'gps_calibre_at');

-- Résultat attendu : 4 colonnes
```

**Checklist :**
- [ ] Colonnes ajoutées sans erreur
- [ ] Vérification effectuée
- [ ] Pas de données perdues

---

### Étape 1.2 : Ajouter colonnes à `pointage`

```sql
-- Exécuter dans Supabase SQL Editor
ALTER TABLE pointage ADD COLUMN latitude FLOAT;
ALTER TABLE pointage ADD COLUMN longitude FLOAT;
ALTER TABLE pointage ADD COLUMN distance_m INT;
ALTER TABLE pointage ADD COLUMN gps_valide BOOLEAN DEFAULT FALSE;

-- Vérifier
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pointage' 
AND column_name IN ('latitude', 'longitude', 'distance_m', 'gps_valide');

-- Résultat attendu : 4 colonnes
```

**Checklist :**
- [ ] Colonnes ajoutées sans erreur
- [ ] Vérification effectuée
- [ ] Pas de données perdues

---

### Étape 1.3 : Ajouter colonnes à `materiaux`

```sql
-- Exécuter dans Supabase SQL Editor
ALTER TABLE materiaux ADD COLUMN latitude FLOAT;
ALTER TABLE materiaux ADD COLUMN longitude FLOAT;
ALTER TABLE materiaux ADD COLUMN photo_recu_url TEXT;
ALTER TABLE materiaux ADD COLUMN photo_recu_at TIMESTAMP;

-- Vérifier
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'materiaux' 
AND column_name IN ('latitude', 'longitude', 'photo_recu_url', 'photo_recu_at');

-- Résultat attendu : 4 colonnes
```

**Checklist :**
- [ ] Colonnes ajoutées sans erreur
- [ ] Vérification effectuée
- [ ] Pas de données perdues

---

### Étape 1.4 : Créer table `audit_fraude`

```sql
-- Exécuter dans Supabase SQL Editor
CREATE TABLE audit_fraude (
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

-- Créer index
CREATE INDEX idx_audit_fraude_entreprise ON audit_fraude(entreprise_id);
CREATE INDEX idx_audit_fraude_chantier ON audit_fraude(chantier_id);
CREATE INDEX idx_audit_fraude_auteur ON audit_fraude(auteur_id);
CREATE INDEX idx_audit_fraude_type ON audit_fraude(type_fraude);
CREATE INDEX idx_audit_fraude_timestamp ON audit_fraude(timestamp DESC);

-- Activer RLS
ALTER TABLE audit_fraude ENABLE ROW LEVEL SECURITY;

-- Créer policies
CREATE POLICY "Voir fraudes de son entreprise" ON audit_fraude
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entreprise_id = audit_fraude.entreprise_id
    )
  );

CREATE POLICY "Système insère fraudes" ON audit_fraude
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entreprise_id = audit_fraude.entreprise_id
    )
  );

-- Vérifier
SELECT * FROM information_schema.tables 
WHERE table_name = 'audit_fraude';

-- Résultat attendu : 1 table
```

**Checklist :**
- [ ] Table créée sans erreur
- [ ] Index créés
- [ ] RLS activé
- [ ] Policies créées
- [ ] Vérification effectuée

---

### Étape 1.5 : Créer index pour performance

```sql
-- Index géospatiales (optionnel mais recommandé)
CREATE INDEX idx_chantiers_gps ON chantiers(latitude, longitude);
CREATE INDEX idx_pointage_gps ON pointage(latitude, longitude);
CREATE INDEX idx_pointage_gps_valide ON pointage(gps_valide);
CREATE INDEX idx_materiaux_photo ON materiaux(photo_recu_url);
CREATE INDEX idx_materiaux_gps ON materiaux(latitude, longitude);

-- Vérifier
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('chantiers', 'pointage', 'materiaux', 'audit_fraude');

-- Résultat attendu : 10+ index
```

**Checklist :**
- [ ] Index créés
- [ ] Vérification effectuée
- [ ] Performance optimisée

---

## 📦 Phase 2 : Déploiement des fichiers (30 min)

### Étape 2.1 : Copier les fichiers

```bash
# Sur le serveur production
cd /var/www/kore

# Copier les nouveaux fichiers
cp /tmp/geolocation.js .
cp /tmp/security-module.js .
cp /tmp/admin-fraude.html .

# Copier les fichiers modifiés (backup d'abord)
cp chef-pointages.html chef-pointages.html.backup
cp chef-materiaux.html chef-materiaux.html.backup

cp /tmp/chef-pointages.html .
cp /tmp/chef-materiaux.html .

# Copier la documentation
cp /tmp/DOCUMENTATION_ANTI_FRAUDE.md .
cp /tmp/IMPLEMENTATION_SUMMARY.md .
```

**Checklist :**
- [ ] Fichiers copiés
- [ ] Backups effectués
- [ ] Permissions correctes (644)

---

### Étape 2.2 : Vérifier les fichiers

```bash
# Vérifier que tous les fichiers sont présents
ls -la /var/www/kore/geolocation.js
ls -la /var/www/kore/security-module.js
ls -la /var/www/kore/admin-fraude.html
ls -la /var/www/kore/chef-pointages.html
ls -la /var/www/kore/chef-materiaux.html

# Vérifier les permissions
stat /var/www/kore/*.js | grep Access
stat /var/www/kore/*.html | grep Access

# Résultat attendu : -rw-r--r-- (644)
```

**Checklist :**
- [ ] Tous les fichiers présents
- [ ] Permissions correctes
- [ ] Pas d'erreurs de copie

---

### Étape 2.3 : Vérifier les dépendances

```bash
# Vérifier que supabase.js existe
ls -la /var/www/kore/supabase.js

# Vérifier que app-core.js existe
ls -la /var/www/kore/app-core.js

# Vérifier les URLs dans les fichiers HTML
grep -n "supabase.js" /var/www/kore/chef-pointages.html
grep -n "geolocation.js" /var/www/kore/chef-pointages.html
grep -n "security-module.js" /var/www/kore/chef-pointages.html

# Résultat attendu : 3 lignes pour chaque fichier
```

**Checklist :**
- [ ] Dépendances présentes
- [ ] URLs correctes
- [ ] Pas de chemins cassés

---

## 🧪 Phase 3 : Tests en développement (45 min)

### Étape 3.1 : Tester en local

```bash
# Démarrer le serveur local HTTPS
powershell -ExecutionPolicy Bypass -File serve.ps1

# Ouvrir dans le navigateur
https://localhost:8000/chef-pointages.html
https://localhost:8000/chef-materiaux.html
https://localhost:8000/admin-fraude.html
```

**Checklist :**
- [ ] Pages chargent sans erreur
- [ ] Console (F12) sans erreurs
- [ ] Styles CSS appliqués
- [ ] Icônes FontAwesome visibles

---

### Étape 3.2 : Tester géofencing

```javascript
// Dans la console (F12)

// Test 1 : Vérifier que GeoLocationModule est chargé
console.log(GeoLocationModule);
// Résultat attendu : Object { getPosition, calculateDistance, ... }

// Test 2 : Vérifier que SecurityModule est chargé
console.log(SecurityModule);
// Résultat attendu : Object { SecurityManager, CONFIG }

// Test 3 : Tester calcul de distance
const dist = GeoLocationModule.calculateDistance(48.8566, 2.3522, 48.8566, 2.3523);
console.log(dist);
// Résultat attendu : ~111 (mètres)

// Test 4 : Tester géofencing
const result = GeoLocationModule.isWithinGeofence(
  { latitude: 48.8566, longitude: 2.3522 },
  { latitude: 48.8566, longitude: 2.3522 },
  100
);
console.log(result);
// Résultat attendu : { isWithin: true, distance: 0, ... }
```

**Checklist :**
- [ ] GeoLocationModule chargé
- [ ] SecurityModule chargé
- [ ] Calcul distance correct
- [ ] Géofencing fonctionne

---

### Étape 3.3 : Tester GPS (sur mobile)

```
1. Ouvrir https://localhost:8000/chef-pointages.html sur mobile
2. Cliquer sur "ACTIVER GPS"
3. Autoriser la géolocalisation
4. Vérifier que la position s'affiche
5. Vérifier que le statut GPS devient vert
```

**Checklist :**
- [ ] GPS fonctionne sur mobile
- [ ] Position affichée correctement
- [ ] Statut GPS vert
- [ ] Distance calculée

---

### Étape 3.4 : Tester photo

```
1. Ouvrir https://localhost:8000/chef-materiaux.html
2. Cliquer sur la zone photo
3. Sélectionner une image
4. Vérifier l'aperçu
5. Vérifier que la zone devient verte
```

**Checklist :**
- [ ] Upload photo fonctionne
- [ ] Aperçu affiché
- [ ] Zone devient verte
- [ ] Pas d'erreur console

---

### Étape 3.5 : Tester dashboard admin

```
1. Ouvrir https://localhost:8000/admin-fraude.html
2. Vérifier que les stats s'affichent
3. Tester les filtres
4. Vérifier que le tableau se remplit
```

**Checklist :**
- [ ] Dashboard charge
- [ ] Stats affichées
- [ ] Filtres fonctionnent
- [ ] Tableau remplit

---

## 🌐 Phase 4 : Tests en production (30 min)

### Étape 4.1 : Vérifier HTTPS

```bash
# Vérifier que HTTPS est activé
curl -I https://kore.example.com/chef-pointages.html

# Résultat attendu : HTTP/2 200
```

**Checklist :**
- [ ] HTTPS activé
- [ ] Certificat valide
- [ ] Pas d'avertissements

---

### Étape 4.2 : Tester en production

```
1. Ouvrir https://kore.example.com/chef-pointages.html
2. Vérifier que la page charge
3. Tester "ACTIVER GPS"
4. Vérifier que Supabase répond
5. Tester enregistrement pointage
```

**Checklist :**
- [ ] Page charge
- [ ] GPS fonctionne
- [ ] Supabase répond
- [ ] Enregistrement fonctionne
- [ ] Pas d'erreurs console

---

### Étape 4.3 : Vérifier Supabase

```sql
-- Vérifier que les données sont enregistrées
SELECT COUNT(*) FROM pointage WHERE gps_valide = true;
SELECT COUNT(*) FROM materiaux WHERE photo_recu_url IS NOT NULL;
SELECT COUNT(*) FROM audit_fraude;

-- Résultat attendu : Nombres > 0 après tests
```

**Checklist :**
- [ ] Pointages enregistrés
- [ ] Photos enregistrées
- [ ] Fraudes enregistrées

---

### Étape 4.4 : Tester sur mobile

```
1. Ouvrir https://kore.example.com/chef-pointages.html sur mobile
2. Tester GPS
3. Tester pointage
4. Vérifier que tout fonctionne
```

**Checklist :**
- [ ] Mobile fonctionne
- [ ] GPS fonctionne
- [ ] Pointage enregistré
- [ ] Pas de lag

---

## 📊 Phase 5 : Validation finale (15 min)

### Étape 5.1 : Vérifier les logs

```bash
# Vérifier les logs serveur
tail -f /var/log/nginx/access.log | grep kore

# Vérifier les logs Supabase
# Dans Supabase Dashboard → Logs

# Résultat attendu : Pas d'erreurs 5xx
```

**Checklist :**
- [ ] Pas d'erreurs serveur
- [ ] Pas d'erreurs Supabase
- [ ] Logs propres

---

### Étape 5.2 : Vérifier les performances

```bash
# Tester la vitesse de chargement
curl -w "@curl-format.txt" -o /dev/null -s https://kore.example.com/chef-pointages.html

# Résultat attendu : < 2 secondes
```

**Checklist :**
- [ ] Temps de chargement < 2s
- [ ] Pas de timeout
- [ ] Performance acceptable

---

### Étape 5.3 : Vérifier la sécurité

```bash
# Vérifier les headers de sécurité
curl -I https://kore.example.com/chef-pointages.html | grep -i "security\|x-frame\|x-content"

# Résultat attendu : Headers de sécurité présents
```

**Checklist :**
- [ ] Headers de sécurité présents
- [ ] HTTPS forcé
- [ ] Pas de vulnérabilités évidentes

---

## 🎉 Phase 6 : Finalisation (15 min)

### Étape 6.1 : Notifier l'équipe

```
✉️ Email à envoyer :

Sujet : ✅ Déploiement module anti-fraude KORE Software

Contenu :
- Module anti-fraude déployé avec succès
- Géofencing activé (100m)
- Photo obligatoire sur achats
- GPS obligatoire sur achats
- Dashboard admin disponible
- Documentation : DOCUMENTATION_ANTI_FRAUDE.md

Accès :
- Pointages : https://kore.example.com/chef-pointages.html
- Achats : https://kore.example.com/chef-materiaux.html
- Admin : https://kore.example.com/admin-fraude.html

Support : Consulter DOCUMENTATION_ANTI_FRAUDE.md
```

**Checklist :**
- [ ] Email envoyé
- [ ] Équipe notifiée
- [ ] Documentation partagée

---

### Étape 6.2 : Documenter le déploiement

```bash
# Créer un fichier de log
cat > /var/www/kore/DEPLOYMENT_LOG.txt << EOF
Date : $(date)
Version : 1.0
Statut : ✅ Succès

Fichiers déployés :
- geolocation.js
- security-module.js
- admin-fraude.html
- chef-pointages.html (modifié)
- chef-materiaux.html (modifié)

Migrations Supabase :
- Colonnes chantiers : OK
- Colonnes pointage : OK
- Colonnes materiaux : OK
- Table audit_fraude : OK

Tests :
- Développement : OK
- Production : OK
- Mobile : OK

Déployé par : [Votre nom]
EOF
```

**Checklist :**
- [ ] Log créé
- [ ] Informations documentées
- [ ] Archivé

---

### Étape 6.3 : Planifier le suivi

```
📅 Suivi recommandé :

J+1 : Vérifier qu'il n'y a pas d'erreurs
J+7 : Analyser les données de fraude
J+30 : Rapport complet

Métriques à suivre :
- Nombre de tentatives bloquées
- Nombre de photos uploadées
- Nombre de pointages avec GPS
- Temps de réponse
```

**Checklist :**
- [ ] Suivi planifié
- [ ] Métriques définies
- [ ] Calendrier créé

---

## 🆘 Rollback (en cas de problème)

### Si erreur Supabase

```bash
# Restaurer les backups
psql -U postgres -d kore < backup_chantiers.sql
psql -U postgres -d kore < backup_pointage.sql
psql -U postgres -d kore < backup_materiaux.sql

# Supprimer la table audit_fraude
DROP TABLE IF EXISTS audit_fraude;
```

### Si erreur fichiers

```bash
# Restaurer les backups
cp /var/www/kore/chef-pointages.html.backup /var/www/kore/chef-pointages.html
cp /var/www/kore/chef-materiaux.html.backup /var/www/kore/chef-materiaux.html

# Supprimer les nouveaux fichiers
rm /var/www/kore/geolocation.js
rm /var/www/kore/security-module.js
rm /var/www/kore/admin-fraude.html
```

---

## ✅ Checklist finale

```
AVANT DÉPLOIEMENT
☐ Backup base de données
☐ Backup fichiers
☐ Équipe notifiée
☐ Fenêtre de maintenance planifiée

MIGRATIONS SUPABASE
☐ Colonnes chantiers
☐ Colonnes pointage
☐ Colonnes materiaux
☐ Table audit_fraude
☐ Index créés
☐ RLS activé

DÉPLOIEMENT FICHIERS
☐ Fichiers copiés
☐ Permissions correctes
☐ Dépendances vérifiées
☐ URLs correctes

TESTS DÉVELOPPEMENT
☐ Pages chargent
☐ Modules chargés
☐ GPS fonctionne
☐ Photo fonctionne
☐ Dashboard fonctionne

TESTS PRODUCTION
☐ HTTPS activé
☐ Pages chargent
☐ GPS fonctionne
☐ Supabase répond
☐ Mobile fonctionne

VALIDATION
☐ Logs propres
☐ Performance OK
☐ Sécurité OK
☐ Équipe notifiée
☐ Documentation partagée

SUIVI
☐ Suivi planifié
☐ Métriques définies
☐ Calendrier créé
```

---

**Durée totale estimée : 2-3 heures**

**Statut : ✅ Prêt pour déploiement**

KORE Software • Module Anti-Fraude • v1.0
