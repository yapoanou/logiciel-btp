# 🔍 Diagnostic - Portail Partenaires

## ❌ Problème Identifié

**Erreur** : "Code d'accès invalide ou expiré à chaque fois"

**Cause Racine** : Les migrations SQL n'ont pas été exécutées dans Supabase.

---

## 📋 Vérification Préalable

### Étape 1 : Vérifier les Tables dans Supabase

Allez dans **Supabase → SQL Editor** et exécutez cette requête :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('acces_partenaires', 'visites_partenaires');
```

**Résultat attendu** : Vous devez voir 2 tables :
- `acces_partenaires`
- `visites_partenaires`

**Si vous ne voyez rien** → Les migrations n'ont pas été exécutées

---

### Étape 2 : Vérifier les Colonnes de la Table `chantiers`

Exécutez cette requête :

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chantiers' 
AND column_name IN ('code_acces', 'lien_acces_securise', 'acces_partenaires');
```

**Résultat attendu** : Vous devez voir 3 colonnes :
- `code_acces`
- `lien_acces_securise`
- `acces_partenaires`

**Si vous ne voyez rien** → Les migrations n'ont pas été exécutées

---

### Étape 3 : Vérifier les Fonctions RPC

Exécutez cette requête :

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'verifier_acces_partenaire',
    'obtenir_info_chantier_partenaire',
    'obtenir_photos_chantier_partenaire',
    'enregistrer_visite_partenaire',
    'activer_acces_partenaire',
    'generer_code_acces'
);
```

**Résultat attendu** : Vous devez voir 6 fonctions

**Si vous ne voyez rien** → Les migrations n'ont pas été exécutées

---

## ✅ Solution : Exécuter les Migrations

### Étape 1 : Ouvrir Supabase SQL Editor

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** (à gauche)
4. Cliquez sur **New Query**

### Étape 2 : Exécuter la Première Migration

1. Ouvrez le fichier [`MIGRATIONS_FOURNISSEURS.sql`](MIGRATIONS_FOURNISSEURS.sql)
2. Copiez **tout le contenu**
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (ou Ctrl+Enter)
5. Attendez que l'exécution se termine (✅ Success)

### Étape 3 : Exécuter la Deuxième Migration

1. Ouvrez le fichier [`MIGRATIONS_PORTAIL_PARTENAIRES.sql`](MIGRATIONS_PORTAIL_PARTENAIRES.sql)
2. Copiez **tout le contenu**
3. Collez-le dans une **nouvelle requête** SQL
4. Cliquez sur **Run**
5. Attendez que l'exécution se termine (✅ Success)

---

## 🧪 Tester Après les Migrations

### Étape 1 : Vérifier que les Tables Existent

Exécutez cette requête dans Supabase :

```sql
SELECT COUNT(*) as nombre_acces 
FROM acces_partenaires;
```

Vous devez obtenir un résultat (même si c'est 0).

### Étape 2 : Activer un Accès Partenaire

1. Allez dans le **Tableau de Bord PDG**
2. Cliquez sur **"👥 Gestion Partenaires"**
3. Trouvez un chantier
4. Cliquez sur **"✓ Activer"**
5. Un code d'accès s'affiche (ex: `ABC123`)

### Étape 3 : Tester la Connexion

1. Ouvrez une **fenêtre privée/incognito**
2. Allez à `http://localhost:8000/portail-partenaire.html`
3. Entrez le code d'accès
4. Cliquez sur **"Se Connecter"**
5. ✅ Vous devez voir les photos du chantier

---

## 🐛 Dépannage Avancé

### ❌ "Erreur lors de l'exécution de la requête SQL"

**Cause** : Syntaxe SQL incorrecte ou permissions insuffisantes

**Solution** :
1. Vérifiez que vous êtes connecté en tant qu'administrateur Supabase
2. Vérifiez que vous copiez **tout le contenu** du fichier SQL
3. Essayez d'exécuter les migrations **une par une** (pas ensemble)

### ❌ "Fonction non trouvée" dans la console du navigateur

**Cause** : Les fonctions RPC n'existent pas (migrations non exécutées)

**Solution** :
1. Vérifiez que les migrations ont été exécutées avec succès
2. Attendez quelques secondes après l'exécution
3. Rechargez la page du navigateur (F5)

### ❌ "Accès refusé" après activation

**Cause** : Les politiques RLS bloquent l'accès

**Solution** :
1. Vérifiez que vous êtes connecté en tant que partenaire (pas PDG)
2. Vérifiez que le code d'accès est correct
3. Vérifiez que l'accès est marqué comme `actif = true` dans la table `acces_partenaires`

---

## 📞 Besoin d'Aide ?

Si vous avez toujours des problèmes :

1. **Ouvrez la console du navigateur** (F12)
2. **Allez dans l'onglet "Console"**
3. **Cherchez les messages d'erreur en rouge**
4. **Partagez-les pour que je puisse vous aider**

---

## 🎯 Résumé Rapide

| Étape | Action | Résultat |
|-------|--------|---------|
| 1 | Exécuter `MIGRATIONS_FOURNISSEURS.sql` | Tables fournisseurs créées |
| 2 | Exécuter `MIGRATIONS_PORTAIL_PARTENAIRES.sql` | Tables et fonctions portail créées |
| 3 | Activer accès depuis tableau de bord | Code d'accès généré |
| 4 | Tester connexion au portail | ✅ Accès réussi |

---

**Version** : 1.0  
**Date** : 2026-08-08  
**Statut** : 🔧 En Diagnostic
