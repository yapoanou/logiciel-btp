# 📖 Guide Pas à Pas - Exécution des Migrations

## 🎯 Objectif

Exécuter les deux fichiers SQL dans Supabase pour activer le système de gestion des fournisseurs et le portail partenaires.

---

## 📋 Prérequis

- ✅ Accès à Supabase (https://app.supabase.com)
- ✅ Droits administrateur sur votre projet
- ✅ Les fichiers SQL existent dans votre dossier racine

---

## 🚀 Exécution Étape par Étape

### **ÉTAPE 1 : Accéder à Supabase SQL Editor**

1. Ouvrez https://app.supabase.com dans votre navigateur
2. Connectez-vous avec vos identifiants
3. Sélectionnez votre **projet BTP**
4. Dans le menu de gauche, cliquez sur **SQL Editor**

```
Menu Supabase
├── Dashboard
├── SQL Editor ← CLIQUEZ ICI
├── Database
├── Authentication
└── ...
```

---

### **ÉTAPE 2 : Créer une Nouvelle Requête**

1. Cliquez sur le bouton **"New Query"** (en haut à droite)
2. Une nouvelle fenêtre d'édition s'ouvre

```
┌─────────────────────────────────────┐
│ New Query  │ Saved Queries │ ...    │
└─────────────────────────────────────┘
```

---

### **ÉTAPE 3 : Exécuter la Migration Fournisseurs**

#### 3.1 - Copier le Contenu du Fichier

1. Ouvrez le fichier [`MIGRATIONS_FOURNISSEURS.sql`](MIGRATIONS_FOURNISSEURS.sql) dans votre éditeur
2. **Sélectionnez tout** : Ctrl+A
3. **Copiez** : Ctrl+C

#### 3.2 - Coller dans Supabase

1. Cliquez dans la zone d'édition SQL de Supabase
2. **Collez** : Ctrl+V
3. Tout le contenu du fichier s'affiche

#### 3.3 - Exécuter la Requête

1. Cliquez sur le bouton **"Run"** (en bas à droite)
   - OU appuyez sur **Ctrl+Enter**

```
┌──────────────────────────────────────┐
│ SELECT * FROM ...                    │
│                                      │
│                                      │
│                                      │
└──────────────────────────────────────┘
                    [Run] [Save]
```

#### 3.4 - Vérifier le Succès

- ✅ **Succès** : Vous voyez "Success" en bas avec un message vert
- ❌ **Erreur** : Vous voyez un message d'erreur en rouge

**Si erreur** : Vérifiez que vous avez copié **tout le contenu** du fichier

---

### **ÉTAPE 4 : Exécuter la Migration Portail Partenaires**

#### 4.1 - Créer une Nouvelle Requête

1. Cliquez sur **"New Query"** (pour une nouvelle requête)
2. Une nouvelle fenêtre d'édition s'ouvre

#### 4.2 - Copier le Contenu du Fichier

1. Ouvrez le fichier [`MIGRATIONS_PORTAIL_PARTENAIRES.sql`](MIGRATIONS_PORTAIL_PARTENAIRES.sql)
2. **Sélectionnez tout** : Ctrl+A
3. **Copiez** : Ctrl+C

#### 4.3 - Coller dans Supabase

1. Cliquez dans la nouvelle zone d'édition SQL
2. **Collez** : Ctrl+V

#### 4.4 - Exécuter la Requête

1. Cliquez sur **"Run"** (ou Ctrl+Enter)
2. ⏳ Attendez que l'exécution se termine

#### 4.5 - Vérifier le Succès

- ✅ **Succès** : Message vert "Success"
- ❌ **Erreur** : Message rouge avec détails

---

## ✅ Vérification Post-Migration

Après avoir exécuté les deux migrations, vérifiez que tout est en place.

### Vérification 1 : Tables Créées

1. Créez une **nouvelle requête** dans Supabase
2. Collez cette requête :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('acces_partenaires', 'visites_partenaires')
ORDER BY table_name;
```

3. Cliquez sur **"Run"**
4. ✅ Vous devez voir 2 lignes :
   - `acces_partenaires`
   - `visites_partenaires`

### Vérification 2 : Colonnes Ajoutées

1. Créez une **nouvelle requête**
2. Collez cette requête :

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chantiers' 
AND column_name IN ('code_acces', 'lien_acces_securise', 'acces_partenaires')
ORDER BY column_name;
```

3. Cliquez sur **"Run"**
4. ✅ Vous devez voir 3 lignes :
   - `acces_partenaires`
   - `code_acces`
   - `lien_acces_securise`

### Vérification 3 : Fonctions RPC Créées

1. Créez une **nouvelle requête**
2. Collez cette requête :

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%acces_partenaire%'
ORDER BY routine_name;
```

3. Cliquez sur **"Run"**
4. ✅ Vous devez voir 5 lignes :
   - `activer_acces_partenaire`
   - `enregistrer_visite_partenaire`
   - `obtenir_info_chantier_partenaire`
   - `obtenir_photos_chantier_partenaire`
   - `verifier_acces_partenaire`

---

## 🧪 Test Complet du Système

Une fois les migrations exécutées et vérifiées, testez le système complet.

### Test 1 : Activer un Accès Partenaire

1. Allez à `http://localhost:8000/tableau-de-bord.html`
2. Appuyez sur **F5** pour recharger la page
3. Connectez-vous si nécessaire
4. Cliquez sur **"👥 Gestion Partenaires"** dans le menu
5. Trouvez un chantier dans la liste
6. Cliquez sur **"✓ Activer"**
7. ✅ Un code d'accès s'affiche (ex: `ABC123`)
8. **Notez ce code**

### Test 2 : Se Connecter au Portail avec le Code

1. Ouvrez une **fenêtre privée/incognito** (Ctrl+Shift+N)
2. Allez à `http://localhost:8000/portail-partenaire.html`
3. L'onglet **"Code d'Accès"** est sélectionné
4. Entrez le code noté au Test 1
5. Cliquez sur **"Se Connecter"**
6. ✅ Vous devez voir :
   - Les informations du chantier
   - La galerie de photos
   - Les boutons d'export (PDF, JSON)

### Test 3 : Tester le Lien Direct

1. Retournez au tableau de bord
2. Cliquez sur **"📋 Copier Lien"** pour le même chantier
3. Ouvrez une **nouvelle fenêtre privée**
4. **Collez** le lien dans la barre d'adresse
5. Appuyez sur **Entrée**
6. ✅ Vous devez être connecté automatiquement (sans code)

### Test 4 : Exporter un PDF

1. Dans le portail partenaires, cliquez sur **"📄 Exporter PDF"**
2. ✅ Un fichier PDF se télécharge
3. Ouvrez-le pour vérifier qu'il contient :
   - Les infos du chantier
   - Les photos
   - Les coordonnées GPS

### Test 5 : Exporter en JSON

1. Dans le portail partenaires, cliquez sur **"📥 Exporter JSON"**
2. ✅ Un fichier JSON se télécharge
3. Ouvrez-le pour vérifier qu'il contient les données du chantier

---

## 🐛 Dépannage

### ❌ "Erreur lors de l'exécution de la requête SQL"

**Cause** : Syntaxe SQL incorrecte ou permissions insuffisantes

**Solution** :
1. Vérifiez que vous êtes connecté en tant qu'administrateur
2. Vérifiez que vous avez copié **tout le contenu** du fichier
3. Vérifiez qu'il n'y a pas de caractères spéciaux
4. Essayez d'exécuter les migrations **une par une**

### ❌ "Fonction non trouvée" dans la console du navigateur

**Cause** : Les fonctions RPC n'existent pas (migrations non exécutées)

**Solution** :
1. Vérifiez que les deux migrations ont été exécutées avec succès
2. Attendez quelques secondes
3. Rechargez la page (F5)
4. Vérifiez dans Supabase que les fonctions existent

### ❌ "Code d'accès invalide ou expiré"

**Cause** : Les tables n'existent pas ou l'accès n'a pas été activé

**Solution** :
1. Vérifiez que la migration Portail a été exécutée
2. Vérifiez que vous avez cliqué sur "✓ Activer"
3. Vérifiez que le code est correct
4. Attendez quelques secondes et réessayez

### ❌ "Aucune photo disponible"

**Cause** : Il n'y a pas de photos pour ce chantier

**Solution** :
1. Vérifiez que des photos ont été ajoutées pour ce chantier
2. Vérifiez que la colonne `chantier_id` est remplie dans la table `photos`
3. Essayez avec un autre chantier

---

## 📞 Besoin d'Aide ?

Si vous avez toujours des problèmes :

1. **Ouvrez la console du navigateur** (F12)
2. **Allez dans l'onglet "Console"**
3. **Cherchez les messages d'erreur en rouge**
4. **Partagez-les pour que je puisse vous aider**

---

## 🎯 Résumé Rapide

| # | Action | Résultat |
|---|--------|---------|
| 1 | Aller à Supabase SQL Editor | ✅ Éditeur ouvert |
| 2 | Exécuter `MIGRATIONS_FOURNISSEURS.sql` | ✅ Tables fournisseurs créées |
| 3 | Exécuter `MIGRATIONS_PORTAIL_PARTENAIRES.sql` | ✅ Tables et fonctions portail créées |
| 4 | Vérifier les tables et fonctions | ✅ Tout existe |
| 5 | Recharger `tableau-de-bord.html` | ✅ Page rechargée |
| 6 | Cliquer "✓ Activer" sur un chantier | ✅ Code d'accès généré |
| 7 | Aller à `portail-partenaire.html` | ✅ Page de connexion affichée |
| 8 | Entrer le code et se connecter | ✅ Galerie photos affichée |

---

**Version** : 1.0  
**Date** : 2026-08-08  
**Statut** : 📖 Guide Complet
