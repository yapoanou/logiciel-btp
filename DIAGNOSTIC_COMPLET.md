# 🔍 Diagnostic Complet - Portail Partenaires

## 🔴 Problème Actuel

**Erreur** : "Code d'accès invalide ou lien expiré" même après les corrections

**Cause Probable** : La table `acces_partenaires` est vide ou n'existe pas

---

## ✅ Vérification Étape par Étape

### Étape 1 : Vérifier que la Table Existe

Allez dans **Supabase → SQL Editor** et exécutez :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'acces_partenaires';
```

**Résultat attendu** : Une ligne avec `acces_partenaires`

**Si aucun résultat** → La table n'existe pas → Exécutez [`MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql`](MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql)

---

### Étape 2 : Vérifier que la Table Contient des Données

```sql
SELECT COUNT(*) as nombre_acces 
FROM acces_partenaires;
```

**Résultat attendu** : Un nombre > 0

**Si le résultat est 0** → La table est vide → Vous n'avez pas activé d'accès partenaire

---

### Étape 3 : Vérifier les Accès Existants

```sql
SELECT 
    id,
    chantier_id,
    code_acces,
    lien_acces,
    actif,
    date_creation
FROM acces_partenaires
ORDER BY date_creation DESC
LIMIT 10;
```

**Résultat attendu** : Une liste des accès créés

**Si aucun résultat** → Aucun accès n'a été créé

---

### Étape 4 : Vérifier que les Chantiers Existent

```sql
SELECT COUNT(*) as nombre_chantiers 
FROM chantiers;
```

**Résultat attendu** : Un nombre > 0

**Si le résultat est 0** → Aucun chantier n'existe

---

### Étape 5 : Vérifier que les Photos Existent

```sql
SELECT COUNT(*) as nombre_photos 
FROM photos;
```

**Résultat attendu** : Un nombre > 0

**Si le résultat est 0** → Aucune photo n'existe

---

## 🔧 Solution Complète

### Étape 1 : Exécuter les Migrations (si pas déjà fait)

1. Allez dans **Supabase → SQL Editor**
2. Cliquez sur **New Query**
3. Ouvrez [`MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql`](MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql)
4. Copiez tout et collez dans Supabase
5. Cliquez sur **Run**
6. ✅ Attendez "Success"

---

### Étape 2 : Créer un Accès Partenaire

1. Allez à `http://localhost:8000/tableau-de-bord.html`
2. Connectez-vous
3. Cliquez sur **"👥 Gestion Partenaires"**
4. Trouvez un chantier
5. Cliquez sur **"✓ Activer"**
6. ✅ Un code d'accès s'affiche

**Important** : Si vous ne voyez pas le bouton "✓ Activer", c'est que la migration n'a pas fonctionné.

---

### Étape 3 : Vérifier que l'Accès a été Créé

Exécutez cette requête dans Supabase :

```sql
SELECT * FROM acces_partenaires 
ORDER BY date_creation DESC 
LIMIT 1;
```

**Résultat attendu** : Une ligne avec le code d'accès que vous avez noté

**Si aucun résultat** → L'accès n'a pas été créé → Vérifiez la console du navigateur (F12)

---

### Étape 4 : Tester la Connexion

1. Ouvrez une **fenêtre privée/incognito**
2. Allez à `http://localhost:8000/portail-partenaire.html`
3. Entrez le code d'accès
4. Cliquez sur **"Se Connecter"**
5. ✅ Vous devez voir les photos

---

## 🐛 Dépannage Avancé

### ❌ "Code d'accès invalide" même après activation

**Cause** : Le code n'est pas dans la table `acces_partenaires`

**Solution** :
1. Vérifiez que vous avez cliqué sur "✓ Activer"
2. Vérifiez que le code s'affiche dans une alerte
3. Vérifiez que le code est dans la table (requête ci-dessus)
4. Ouvrez la console (F12) et cherchez les erreurs

### ❌ Le bouton "✓ Activer" n'existe pas

**Cause** : La migration n'a pas fonctionné

**Solution** :
1. Vérifiez que la table `acces_partenaires` existe
2. Exécutez [`MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql`](MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql)
3. Rechargez la page (F5)

### ❌ Aucune photo n'apparaît

**Cause** : Il n'y a pas de photos pour ce chantier

**Solution** :
1. Vérifiez que des photos existent dans la table `photos`
2. Vérifiez que la colonne `chantier_id` est remplie
3. Essayez avec un autre chantier

---

## 📋 Checklist de Vérification

- [ ] La table `acces_partenaires` existe
- [ ] La table `acces_partenaires` contient des données
- [ ] Le code d'accès s'affiche quand vous cliquez "✓ Activer"
- [ ] Le code d'accès est dans la table `acces_partenaires`
- [ ] Vous pouvez vous connecter avec le code
- [ ] Les photos s'affichent

---

## 📞 Besoin d'Aide ?

Si vous avez toujours des problèmes :

1. **Exécutez les requêtes de diagnostic ci-dessus**
2. **Partagez les résultats**
3. **Ouvrez la console du navigateur (F12)**
4. **Partagez les messages d'erreur**

---

**Version** : 1.0  
**Date** : 2026-08-08  
**Statut** : 🔍 Diagnostic Complet
