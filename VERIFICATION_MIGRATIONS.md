# ✅ Vérification et Exécution des Migrations

## 🔴 État Actuel

Le système affiche l'erreur **"Code d'accès invalide ou expiré"** car les migrations SQL n'ont **PAS** été exécutées dans Supabase.

---

## 📋 Checklist de Vérification

### ✅ Étape 1 : Vérifier que les Migrations Existent

Les fichiers suivants doivent exister dans votre dossier racine :

- ✅ [`MIGRATIONS_FOURNISSEURS.sql`](MIGRATIONS_FOURNISSEURS.sql)
- ✅ [`MIGRATIONS_PORTAIL_PARTENAIRES.sql`](MIGRATIONS_PORTAIL_PARTENAIRES.sql)

**Status** : ✅ Les deux fichiers existent

---

### ❌ Étape 2 : Vérifier que les Migrations Ont Été Exécutées

Pour vérifier si les migrations ont été exécutées, allez dans **Supabase** et exécutez cette requête :

```sql
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'acces_partenaires'
) as table_exists;
```

**Résultat attendu** : `true`

**Résultat actuel** : Probablement `false` (table n'existe pas)

---

## 🚀 Solution : Exécuter les Migrations

### Étape 1 : Accéder à Supabase SQL Editor

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**

### Étape 2 : Exécuter la Migration Fournisseurs

1. Ouvrez le fichier [`MIGRATIONS_FOURNISSEURS.sql`](MIGRATIONS_FOURNISSEURS.sql)
2. **Sélectionnez tout** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. Dans Supabase SQL Editor, **collez** (Ctrl+V)
5. Cliquez sur **Run** (ou Ctrl+Enter)
6. ⏳ Attendez que l'exécution se termine
7. ✅ Vous devez voir "Success" en bas

**Contenu** : Crée les tables et colonnes pour la gestion des fournisseurs

### Étape 3 : Exécuter la Migration Portail Partenaires

1. Cliquez sur **New Query** (pour une nouvelle requête)
2. Ouvrez le fichier [`MIGRATIONS_PORTAIL_PARTENAIRES.sql`](MIGRATIONS_PORTAIL_PARTENAIRES.sql)
3. **Sélectionnez tout** (Ctrl+A)
4. **Copiez** (Ctrl+C)
5. Dans Supabase SQL Editor, **collez** (Ctrl+V)
6. Cliquez sur **Run**
7. ⏳ Attendez que l'exécution se termine
8. ✅ Vous devez voir "Success" en bas

**Contenu** : Crée les tables, fonctions RPC et politiques RLS pour le portail partenaires

---

## ✅ Vérification Post-Migration

Après avoir exécuté les deux migrations, vérifiez que tout est en place :

### Vérification 1 : Tables Créées

Exécutez cette requête dans Supabase :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('acces_partenaires', 'visites_partenaires')
ORDER BY table_name;
```

**Résultat attendu** :
```
acces_partenaires
visites_partenaires
```

### Vérification 2 : Colonnes Ajoutées à `chantiers`

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chantiers' 
AND column_name IN ('code_acces', 'lien_acces_securise', 'acces_partenaires')
ORDER BY column_name;
```

**Résultat attendu** :
```
acces_partenaires
code_acces
lien_acces_securise
```

### Vérification 3 : Fonctions RPC Créées

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%acces_partenaire%'
ORDER BY routine_name;
```

**Résultat attendu** :
```
activer_acces_partenaire
enregistrer_visite_partenaire
obtenir_info_chantier_partenaire
obtenir_photos_chantier_partenaire
verifier_acces_partenaire
```

---

## 🧪 Test Complet Après Migration

### Étape 1 : Recharger la Page

1. Allez à `http://localhost:8000/tableau-de-bord.html`
2. Appuyez sur **F5** pour recharger
3. Connectez-vous si nécessaire

### Étape 2 : Activer un Accès Partenaire

1. Cliquez sur **"👥 Gestion Partenaires"** dans le menu
2. Trouvez un chantier dans la liste
3. Cliquez sur **"✓ Activer"** (ou "🔄 Régénérer" si déjà activé)
4. ✅ Un code d'accès s'affiche (ex: `ABC123`)
5. **Notez ce code**

### Étape 3 : Tester la Connexion au Portail

1. Ouvrez une **fenêtre privée/incognito** (Ctrl+Shift+N)
2. Allez à `http://localhost:8000/portail-partenaire.html`
3. L'onglet **"Code d'Accès"** est sélectionné
4. Entrez le code noté à l'étape 2
5. Cliquez sur **"Se Connecter"**
6. ✅ Vous devez voir les photos du chantier

### Étape 4 : Tester le Lien Direct

1. Retournez au tableau de bord
2. Cliquez sur **"📋 Copier Lien"** pour le même chantier
3. Ouvrez une **nouvelle fenêtre privée**
4. **Collez** le lien dans la barre d'adresse
5. ✅ Vous devez être connecté automatiquement

---

## 🐛 Dépannage

### ❌ "Erreur lors de l'exécution de la requête SQL"

**Cause** : Syntaxe SQL incorrecte ou permissions insuffisantes

**Solution** :
1. Vérifiez que vous êtes connecté en tant qu'administrateur Supabase
2. Vérifiez que vous copiez **tout le contenu** du fichier SQL
3. Vérifiez qu'il n'y a pas de caractères spéciaux ou d'encodage incorrect
4. Essayez d'exécuter les migrations **une par une** (pas ensemble)

### ❌ "Fonction non trouvée" dans la console

**Cause** : Les fonctions RPC n'existent pas

**Solution** :
1. Vérifiez que la migration Portail a été exécutée avec succès
2. Attendez quelques secondes
3. Rechargez la page (F5)
4. Vérifiez dans Supabase que les fonctions existent

### ❌ "Accès refusé" après activation

**Cause** : Les politiques RLS bloquent l'accès

**Solution** :
1. Vérifiez que vous êtes connecté en tant que partenaire (pas PDG)
2. Vérifiez que le code d'accès est correct
3. Vérifiez que l'accès est marqué comme `actif = true`

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
| 1 | Exécuter `MIGRATIONS_FOURNISSEURS.sql` dans Supabase | ✅ Tables fournisseurs créées |
| 2 | Exécuter `MIGRATIONS_PORTAIL_PARTENAIRES.sql` dans Supabase | ✅ Tables et fonctions portail créées |
| 3 | Recharger `tableau-de-bord.html` | ✅ Page rechargée |
| 4 | Cliquer "✓ Activer" sur un chantier | ✅ Code d'accès généré |
| 5 | Aller à `portail-partenaire.html` | ✅ Page de connexion affichée |
| 6 | Entrer le code et se connecter | ✅ Galerie photos affichée |

---

**Version** : 1.0  
**Date** : 2026-08-08  
**Statut** : 🔧 Guide d'Exécution
