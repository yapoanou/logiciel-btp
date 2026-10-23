# 🎯 Résolution Finale - Portail Partenaires

## 🔴 Problème

**Erreur** : "Code d'accès invalide ou lien expiré"

**Cause** : La table `acces_partenaires` est vide ou n'existe pas

---

## ✅ Solution Complète en 5 Étapes

### **ÉTAPE 1 : Vérifier que les Migrations Ont Fonctionné**

Allez dans **Supabase → SQL Editor** et exécutez :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('acces_partenaires', 'visites_partenaires');
```

**Résultat attendu** : 2 tables
```
acces_partenaires
visites_partenaires
```

**Si aucun résultat** :
1. Allez dans **SQL Editor**
2. Cliquez sur **New Query**
3. Ouvrez [`MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql`](MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql)
4. Copiez tout et collez dans Supabase
5. Cliquez sur **Run**
6. ✅ Attendez "Success"

---

### **ÉTAPE 2 : Vérifier que la Table est Vide ou Pleine**

Exécutez :

```sql
SELECT COUNT(*) as nombre_acces FROM acces_partenaires;
```

**Résultat attendu** : Un nombre > 0

**Si le résultat est 0** → La table est vide → Allez à l'ÉTAPE 3

---

### **ÉTAPE 3 : Créer un Accès Partenaire Manuellement**

#### 3.1 - Trouver l'ID d'un Chantier

Exécutez :

```sql
SELECT id, nom_chantier FROM chantiers LIMIT 5;
```

**Résultat attendu** : Une liste de chantiers avec leurs IDs

**Notez l'ID du chantier** (ex: `550e8400-e29b-41d4-a716-446655440000`)

#### 3.2 - Créer un Accès Partenaire

Exécutez (remplacez `VOTRE_CHANTIER_ID` par l'ID noté) :

```sql
INSERT INTO acces_partenaires (
    chantier_id,
    code_acces,
    lien_acces,
    actif,
    created_by
) VALUES (
    'VOTRE_CHANTIER_ID',
    'TEST123',
    gen_random_uuid(),
    true,
    auth.uid()
);
```

**Résultat attendu** : "1 row inserted"

#### 3.3 - Vérifier que l'Accès a été Créé

Exécutez :

```sql
SELECT code_acces, lien_acces, actif 
FROM acces_partenaires 
WHERE code_acces = 'TEST123';
```

**Résultat attendu** : Une ligne avec `TEST123`, un UUID, et `true`

---

### **ÉTAPE 4 : Tester la Connexion au Portail**

1. Ouvrez une **fenêtre privée/incognito** (Ctrl+Shift+N)
2. Allez à `http://localhost:8000/portail-partenaire.html`
3. Entrez le code : `TEST123`
4. Cliquez sur **"Se Connecter"**
5. ✅ Vous devez voir les infos du chantier

**Si vous voyez une erreur** :
1. Ouvrez la console (F12)
2. Allez dans l'onglet "Console"
3. Cherchez les messages d'erreur en rouge
4. Partagez-les

---

### **ÉTAPE 5 : Tester avec le Bouton "✓ Activer" du Tableau de Bord**

1. Allez à `http://localhost:8000/tableau-de-bord.html`
2. Connectez-vous
3. Cliquez sur **"👥 Gestion Partenaires"**
4. Trouvez un chantier
5. Cliquez sur **"✓ Activer"**
6. ✅ Un code d'accès s'affiche
7. Notez ce code
8. Testez la connexion au portail avec ce code

---

## 🐛 Dépannage

### ❌ "Erreur lors de l'insertion" à l'ÉTAPE 3

**Cause** : L'ID du chantier n'existe pas ou est incorrect

**Solution** :
1. Vérifiez que vous avez copié l'ID correctement
2. Vérifiez que le chantier existe dans la table `chantiers`
3. Essayez avec un autre chantier

### ❌ "Code d'accès invalide" à l'ÉTAPE 4

**Cause** : Le code n'est pas dans la table

**Solution** :
1. Vérifiez que l'insertion a fonctionné (ÉTAPE 3.3)
2. Vérifiez que vous entrez le bon code (`TEST123`)
3. Vérifiez que `actif = true`

### ❌ Le bouton "✓ Activer" n'existe pas à l'ÉTAPE 5

**Cause** : La migration n'a pas fonctionné

**Solution** :
1. Vérifiez que la table `acces_partenaires` existe (ÉTAPE 1)
2. Exécutez [`MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql`](MIGRATIONS_PORTAIL_PARTENAIRES_CORRIGEE.sql)
3. Rechargez la page (F5)

---

## 📋 Résumé Rapide

| # | Action | Résultat |
|---|--------|---------|
| 1 | Vérifier les migrations | Tables existent |
| 2 | Vérifier la table | Contient des données |
| 3 | Créer un accès manuel | Code `TEST123` créé |
| 4 | Tester la connexion | Portail fonctionne |
| 5 | Tester le bouton "✓ Activer" | Nouveau code généré |

---

## 📞 Besoin d'Aide ?

Si vous avez toujours des problèmes :

1. **Exécutez les requêtes SQL ci-dessus**
2. **Partagez les résultats**
3. **Ouvrez la console du navigateur (F12)**
4. **Partagez les messages d'erreur**

---

**Version** : 1.0  
**Date** : 2026-08-08  
**Statut** : 🎯 Résolution Complète
