# 🔧 Résolution - "Code d'accès invalide ou expiré"

## 🔴 Problème Identifié

Vous recevez l'erreur **"Code d'accès invalide ou expiré"** à chaque tentative de connexion au portail partenaires.

---

## 🎯 Cause Racine

Les **migrations SQL n'ont pas été exécutées** dans Supabase.

Le système JavaScript appelle des fonctions RPC Supabase qui n'existent que si les migrations ont été exécutées :
- `activer_acces_partenaire()` - Génère les codes d'accès
- `verifier_acces_partenaire()` - Vérifie les codes d'accès
- `obtenir_info_chantier_partenaire()` - Récupère les infos du chantier
- `obtenir_photos_chantier_partenaire()` - Récupère les photos

**Sans ces fonctions** → Les codes d'accès ne peuvent pas être générés ni vérifiés → Erreur "Code invalide"

---

## ✅ Solution en 3 Étapes

### **ÉTAPE 1 : Exécuter les Migrations dans Supabase**

#### 1.1 - Accéder à Supabase SQL Editor

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet BTP
3. Cliquez sur **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**

#### 1.2 - Exécuter la Migration Fournisseurs

1. Ouvrez le fichier [`MIGRATIONS_FOURNISSEURS.sql`](MIGRATIONS_FOURNISSEURS.sql)
2. Sélectionnez tout (Ctrl+A) et copiez (Ctrl+C)
3. Collez dans Supabase (Ctrl+V)
4. Cliquez sur **Run** (ou Ctrl+Enter)
5. ✅ Attendez le message "Success"

#### 1.3 - Exécuter la Migration Portail Partenaires

1. Cliquez sur **New Query** (nouvelle requête)
2. Ouvrez le fichier [`MIGRATIONS_PORTAIL_PARTENAIRES.sql`](MIGRATIONS_PORTAIL_PARTENAIRES.sql)
3. Sélectionnez tout (Ctrl+A) et copiez (Ctrl+C)
4. Collez dans Supabase (Ctrl+V)
5. Cliquez sur **Run**
6. ✅ Attendez le message "Success"

**⏱️ Durée estimée** : 2-3 minutes

---

### **ÉTAPE 2 : Vérifier que les Migrations Ont Fonctionné**

Exécutez cette requête dans Supabase pour vérifier :

```sql
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_name = 'acces_partenaires') as table_acces_existe,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_name = 'activer_acces_partenaire') as fonction_existe;
```

**Résultat attendu** :
```
table_acces_existe | fonction_existe
        1          |        1
```

Si vous voyez `0` quelque part → Les migrations n'ont pas fonctionné

---

### **ÉTAPE 3 : Tester le Système**

#### 3.1 - Recharger le Tableau de Bord

1. Allez à `http://localhost:8000/tableau-de-bord.html`
2. Appuyez sur **F5** pour recharger
3. Connectez-vous si nécessaire

#### 3.2 - Activer un Accès Partenaire

1. Cliquez sur **"👥 Gestion Partenaires"** dans le menu
2. Trouvez un chantier
3. Cliquez sur **"✓ Activer"**
4. ✅ Un code d'accès s'affiche (ex: `ABC123`)
5. **Notez ce code**

#### 3.3 - Tester la Connexion

1. Ouvrez une **fenêtre privée/incognito** (Ctrl+Shift+N)
2. Allez à `http://localhost:8000/portail-partenaire.html`
3. Entrez le code noté à l'étape 3.2
4. Cliquez sur **"Se Connecter"**
5. ✅ Vous devez voir les photos du chantier

---

## 🐛 Dépannage

### ❌ "Erreur lors de l'exécution de la requête SQL"

**Cause** : Syntaxe SQL incorrecte

**Solution** :
1. Vérifiez que vous avez copié **tout le contenu** du fichier
2. Vérifiez qu'il n'y a pas de caractères spéciaux
3. Essayez d'exécuter les migrations **une par une**

### ❌ "Fonction non trouvée" dans la console

**Cause** : Les migrations n'ont pas été exécutées

**Solution** :
1. Vérifiez que les deux migrations ont été exécutées avec succès
2. Attendez quelques secondes
3. Rechargez la page (F5)

### ❌ "Code d'accès invalide" après activation

**Cause** : Les tables n'existent pas

**Solution** :
1. Vérifiez que la migration Portail a été exécutée
2. Vérifiez que vous avez cliqué sur "✓ Activer"
3. Attendez quelques secondes et réessayez

---

## 📞 Besoin d'Aide ?

Si vous avez toujours des problèmes :

1. **Ouvrez la console du navigateur** (F12)
2. **Allez dans l'onglet "Console"**
3. **Cherchez les messages d'erreur en rouge**
4. **Partagez-les pour que je puisse vous aider**

---

## 📚 Guides Complémentaires

Pour plus de détails, consultez :

- [`GUIDE_EXECUTION_MIGRATIONS.md`](GUIDE_EXECUTION_MIGRATIONS.md) - Guide pas à pas complet
- [`VERIFICATION_MIGRATIONS.md`](VERIFICATION_MIGRATIONS.md) - Vérification et diagnostic
- [`GUIDE_ACCES_PORTAIL_PARTENAIRES.md`](GUIDE_ACCES_PORTAIL_PARTENAIRES.md) - Guide d'accès au portail

---

**Version** : 1.0  
**Date** : 2026-08-08  
**Statut** : 🔧 Résolution Rapide
