# 📖 Guide d'Accès au Portail Partenaires

## 🌐 Comment Accéder au Portail Partenaire

### **Option 1 : Accès Direct (Sans Code)**
Ouvrez votre navigateur et allez à :
```
http://localhost:8000/portail-partenaire.html
```
*(Remplacez `localhost:8000` par votre URL réelle)*

Vous arriverez sur la page de connexion où vous pourrez entrer un code ou utiliser un lien.

---

### **Option 2 : Accès avec Code PIN**

#### Étape 1 : Générer un Code d'Accès (PDG/Bureau)
1. Allez dans le **Tableau de Bord PDG**
2. Cliquez sur **"👥 Gestion Partenaires"** dans le menu
3. Trouvez le chantier auquel vous voulez donner accès
4. Cliquez sur **"✓ Activer"** (ou "🔄 Régénérer" si déjà activé)
5. Un code d'accès s'affiche (ex: `ABC123`)
6. Partagez ce code avec le partenaire

#### Étape 2 : Se Connecter (Partenaire)
1. Allez à `http://localhost:8000/portail-partenaire.html`
2. L'onglet **"Code d'Accès"** est sélectionné par défaut
3. Entrez le code reçu (6 caractères)
4. Cliquez **"Se Connecter"**
5. ✅ Vous êtes connecté ! Vous voyez les photos du chantier

---

### **Option 3 : Accès avec Lien Direct Sécurisé**

#### Étape 1 : Générer un Lien (PDG/Bureau)
1. Allez dans le **Tableau de Bord PDG**
2. Cliquez sur **"👥 Gestion Partenaires"** dans le menu
3. Trouvez le chantier auquel vous voulez donner accès
4. Cliquez sur **"✓ Activer"** d'abord (si pas encore activé)
5. Cliquez sur **"📋 Copier Lien"**
6. Le lien complet est copié dans le presse-papiers
7. Partagez ce lien avec le partenaire (par email, SMS, etc.)

#### Étape 2 : Se Connecter (Partenaire)
1. Le partenaire reçoit le lien
2. Il clique sur le lien
3. ✅ Il est connecté automatiquement ! Aucun code requis
4. Il voit immédiatement les photos du chantier

---

## 📋 Exemple de Lien Complet

```
http://localhost:8000/portail-partenaire.html?chantier_id=550e8400-e29b-41d4-a716-446655440000
```

Le paramètre `chantier_id` contient l'UUID du lien d'accès sécurisé.

---

## ✅ Vérification Préalable

Avant d'accéder au portail, assurez-vous que :

1. ✅ **Le fichier `portail-partenaire.html` existe** dans votre dossier racine
2. ✅ **Le fichier `portail-partenaire.js` existe** dans votre dossier racine
3. ✅ **Le script SQL `MIGRATIONS_PORTAIL_PARTENAIRES.sql` a été exécuté** dans Supabase
4. ✅ **Vous avez activé un accès partenaire** depuis le tableau de bord

---

## 🔍 Vérifier que Tout Fonctionne

### Étape 1 : Vérifier les Fichiers
Dans votre dossier racine, vous devez avoir :
```
portail-partenaire.html
portail-partenaire.js
```

### Étape 2 : Vérifier la Base de Données
Dans Supabase, vérifiez que :
- La table `chantiers` a les colonnes : `code_acces`, `lien_acces_securise`, `acces_partenaires`
- La table `acces_partenaires` existe
- La table `visites_partenaires` existe

### Étape 3 : Tester l'Accès
1. Allez dans "👥 Gestion Partenaires"
2. Cliquez "✓ Activer" sur un chantier
3. Copiez le code ou le lien
4. Ouvrez une fenêtre privée/incognito
5. Allez à `portail-partenaire.html`
6. Entrez le code ou le lien
7. Vous devriez voir les photos du chantier

---

## 🐛 Dépannage

### ❌ "Fichier non trouvé"
**Cause** : Le fichier `portail-partenaire.html` n'est pas dans le bon dossier

**Solution** :
- Vérifiez que `portail-partenaire.html` est dans le même dossier que `login.html`, `tableau-de-bord.html`, etc.
- Vérifiez l'URL : elle doit être `http://localhost:8000/portail-partenaire.html`

### ❌ "Module non chargé" ou "Erreur de script"
**Cause** : Le fichier `portail-partenaire.js` n'existe pas ou n'est pas au bon endroit

**Solution** :
- Vérifiez que `portail-partenaire.js` est dans le même dossier que `portail-partenaire.html`
- Ouvrez la console du navigateur (F12) pour voir l'erreur exacte

### ❌ "Accès refusé" ou "Code invalide"
**Cause** : Le script SQL n'a pas été exécuté ou l'accès n'a pas été activé

**Solution** :
1. Exécutez le script `MIGRATIONS_PORTAIL_PARTENAIRES.sql` dans Supabase
2. Allez dans "👥 Gestion Partenaires"
3. Cliquez "✓ Activer" sur un chantier
4. Attendez quelques secondes
5. Réessayez

### ❌ "Aucune photo disponible"
**Cause** : Il n'y a pas de photos pour ce chantier dans la table `photos`

**Solution** :
- Vérifiez que des photos ont été ajoutées pour ce chantier
- Vérifiez que la colonne `chantier_id` est remplie dans la table `photos`

---

## 📞 Besoin d'Aide ?

Si vous avez toujours des problèmes :

1. **Ouvrez la console du navigateur** (F12)
2. **Allez dans l'onglet "Console"**
3. **Cherchez les messages d'erreur en rouge**
4. **Partagez-les pour que je puisse vous aider**

---

## 🎯 Résumé Rapide

| Qui | Quoi | Où |
|-----|------|-----|
| **PDG/Bureau** | Activer accès | Tableau de Bord → 👥 Gestion Partenaires |
| **PDG/Bureau** | Copier code/lien | Cliquer sur "✓ Activer" ou "📋 Copier Lien" |
| **Partenaire** | Accéder au portail | `portail-partenaire.html` |
| **Partenaire** | Se connecter | Entrer code OU cliquer sur lien |
| **Partenaire** | Voir photos | Galerie chronologique du chantier |
| **Partenaire** | Exporter | PDF (attestation) ou JSON (données) |

---

**Version** : 1.0  
**Date** : 2026-08-08  
**Statut** : ✅ Complet et Fonctionnel
