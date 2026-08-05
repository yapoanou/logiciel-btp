# 🚀 KORE Software - Guide de démarrage rapide

**Module Anti-Fraude • Version 1.0**

---

## 👷 Pour les chefs de chantier

### 📍 Pointage avec géofencing (100m)

#### En 5 étapes

```
1️⃣  Accédez à "Pointage Équipe"
    └─ Depuis l'accueil, cliquez sur "Pointage Équipe"

2️⃣  Sélectionnez le chantier et l'ouvrier
    ├─ Chantier : Dropdown
    └─ Ouvrier : Dropdown

3️⃣  Cliquez sur "ACTIVER GPS" (bouton orange)
    ├─ Attendez la localisation (max 10s)
    ├─ Vérifiez le statut GPS
    └─ ✅ Vert = Dans la zone | ❌ Rouge = Hors zone

4️⃣  Sélectionnez le statut (Présent/Absent)
    └─ Cliquez sur le bouton correspondant

5️⃣  Cliquez sur "ENREGISTRER LE POINTAGE"
    └─ Confirmation : "✅ POINTAGE BIEN REÇU"
```

#### ⚠️ Important

- **GPS obligatoire** : Vous devez activer le GPS avant de pointer
- **Zone de 100m** : Vous devez être à moins de 100m du chantier
- **HTTPS** : Fonctionne uniquement en HTTPS
- **Permissions** : Autorisez la géolocalisation quand demandé

#### 🆘 Si ça ne marche pas

| Problème | Solution |
|---|---|
| "GPS non trouvé" | Vérifiez que le GPS est activé sur votre téléphone |
| "Hors zone" | Rapprochez-vous du chantier (max 100m) |
| "Permission refusée" | Autorisez la géolocalisation dans les paramètres |
| "Timeout" | Attendez quelques secondes, puis réessayez |

---

### 📸 Achats avec photo et GPS

#### En 6 étapes

```
1️⃣  Accédez à "Achats & Stocks"
    └─ Depuis l'accueil, cliquez sur "Achats & Stocks"

2️⃣  Remplissez les informations
    ├─ Chantier : Dropdown
    ├─ Désignation : Ex "50 sacs de ciment"
    ├─ Quantité : Ex "10"
    ├─ Prix total : Ex "50000"
    └─ Mode de paiement : Espèces/Mobile Money/Chèque

3️⃣  Ajoutez la photo du reçu ⭐ OBLIGATOIRE
    ├─ Cliquez sur la zone bleue
    ├─ Prenez une photo ou sélectionnez une image
    ├─ Vérifiez l'aperçu
    └─ La zone devient verte : "✅ Photo sélectionnée"

4️⃣  Cliquez sur "CAPTURER GPS" (bouton orange)
    ├─ Attendez la localisation
    └─ Vérifiez le statut GPS (vert = succès)

5️⃣  Vérifiez que tout est rempli
    ├─ ✅ Désignation
    ├─ ✅ Quantité
    ├─ ✅ Prix
    ├─ ✅ Photo
    └─ ✅ GPS

6️⃣  Cliquez sur "VALIDER L'ACHAT"
    └─ Confirmation : "✅ ACHAT ENREGISTRÉ"
```

#### ⚠️ Important

- **Photo obligatoire** : Tous les achats doivent avoir une photo du reçu
- **GPS obligatoire** : La position est enregistrée avec chaque achat
- **Taille photo** : Max 5MB
- **Traçabilité** : Chaque achat est lié à vous, au chantier et à votre position

#### 🆘 Si ça ne marche pas

| Problème | Solution |
|---|---|
| "Photo trop volumineuse" | Compressez l'image ou prenez une meilleure photo |
| "Upload photo échoué" | Vérifiez votre connexion internet |
| "GPS non disponible" | Activez le GPS et réessayez |
| "Achat bloqué" | Vérifiez que photo ET GPS sont présents |

---

## 👨‍💼 Pour les administrateurs

### 📊 Dashboard anti-fraude

#### Accès

```
URL : https://kore.example.com/admin-fraude.html
Rôle requis : Admin ou PDG
```

#### Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│  🚨 Dashboard Anti-Fraude                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📊 STATISTIQUES (Haut de page)                     │
│  ├─ 🚫 Tentatives bloquées : 42                     │
│  ├─ 🚫 Violations géofencing : 28                   │
│  ├─ 📸 Photos manquantes : 10                       │
│  └─ 📍 GPS manquants : 4                            │
│                                                      │
│  🔍 FILTRES                                         │
│  ├─ Chantier : [Dropdown]                           │
│  ├─ Type : [Dropdown]                               │
│  ├─ Date début : [Date]                             │
│  ├─ Date fin : [Date]                               │
│  └─ [Rechercher]                                    │
│                                                      │
│  📋 TABLEAU DES TENTATIVES                          │
│  ├─ Date/Heure | Type | Utilisateur | Chantier     │
│  ├─ 2026-08-05 | 🚫 Géofencing | Chef A | Chantier 1 │
│  ├─ 2026-08-05 | 📸 Photo | Chef B | Chantier 2    │
│  └─ [Détails] [Détails] [Détails]                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### Utilisation

##### 1. Consulter les statistiques

```
Les 4 KPIs en haut affichent :
- 🚫 Tentatives bloquées : Total des fraudes détectées
- 🚫 Violations géofencing : Pointages hors zone
- 📸 Photos manquantes : Achats sans photo
- 📍 GPS manquants : Tentatives sans GPS

Mise à jour : En temps réel
```

##### 2. Filtrer les données

```
Filtrez par :
├─ Chantier : Sélectionnez un chantier spécifique
├─ Type : Violation géofencing / Photo manquante / GPS manquant
├─ Date début : Filtrer à partir d'une date
└─ Date fin : Filtrer jusqu'à une date

Cliquez sur [Rechercher] pour appliquer
```

##### 3. Analyser les tentatives

```
Le tableau affiche :
├─ Date/Heure : Quand la tentative a eu lieu
├─ Type : Type de fraude (badge coloré)
├─ Utilisateur : Nom et email du chef
├─ Chantier : Chantier concerné
├─ Détails : Distance ou montant
├─ Statut : Bloqué / Signalé / Enquête
└─ Actions : [Détails]

Cliquez sur [Détails] pour voir plus d'infos
```

##### 4. Enquêter sur une tentative

```
Cliquez sur [Détails] pour voir :
├─ Date/Heure exacte
├─ Type de fraude
├─ Utilisateur (nom + email)
├─ Chantier
├─ Détails spécifiques
│  ├─ Distance vs limite (géofencing)
│  ├─ Montant (achats)
│  └─ Raison du blocage
└─ Statut actuel
```

#### 📊 Cas d'usage

##### Cas 1 : Violation géofencing

```
Situation :
- Chef tente de pointer à 150m du chantier
- Limite : 100m
- Pointage bloqué

Action admin :
1. Voir dans le dashboard : "Violation géofencing"
2. Cliquer sur [Détails]
3. Voir : "Distance: 150m / 100m"
4. Enquêter : Pourquoi le chef était loin ?
5. Prendre mesure : Avertissement, formation, etc.
```

##### Cas 2 : Photo manquante

```
Situation :
- Chef tente d'enregistrer un achat sans photo
- Achat bloqué

Action admin :
1. Voir dans le dashboard : "Photo manquante"
2. Cliquer sur [Détails]
3. Voir : Montant de l'achat
4. Enquêter : Pourquoi pas de photo ?
5. Prendre mesure : Rappel des règles, formation
```

##### Cas 3 : GPS manquant

```
Situation :
- Chef tente de pointer sans GPS activé
- Pointage bloqué

Action admin :
1. Voir dans le dashboard : "GPS manquant"
2. Cliquer sur [Détails]
3. Voir : Raison du blocage
4. Enquêter : Problème technique ou intentionnel ?
5. Prendre mesure : Support technique, formation
```

#### 🎯 Bonnes pratiques

```
✅ À faire :
├─ Consulter le dashboard quotidiennement
├─ Analyser les tendances
├─ Enquêter sur les tentatives suspectes
├─ Former les chefs si besoin
└─ Documenter les actions prises

❌ À ne pas faire :
├─ Ignorer les tentatives de fraude
├─ Augmenter le rayon géofence sans raison
├─ Désactiver les vérifications
└─ Partager les données sensibles
```

---

## 🔧 Dépannage

### Problèmes GPS

#### "GPS non supporté"
```
Cause : Navigateur ancien
Solution : Utiliser Chrome, Firefox ou Safari récent
```

#### "Permission refusée"
```
Cause : Utilisateur a refusé la permission
Solution :
1. Aller dans les paramètres du navigateur
2. Autoriser la géolocalisation
3. Rafraîchir la page
```

#### "Position indisponible"
```
Cause : GPS désactivé
Solution : Activer le GPS dans les paramètres du téléphone
```

#### "Délai d'attente dépassé"
```
Cause : Mauvaise réception GPS
Solution :
1. Aller dehors ou près d'une fenêtre
2. Attendre quelques secondes
3. Cliquer sur "RÉESSAYER"
```

### Problèmes de géofencing

#### "Vous êtes hors zone"
```
Cause : Utilisateur trop loin du chantier
Solution :
1. Rapprochez-vous du chantier
2. Vérifiez que le chantier est bien calibré
3. Contactez l'admin si le rayon est trop petit
```

#### "Chantier non calibré"
```
Cause : Première utilisation du chantier
Solution :
1. Le premier pointage calibrera automatiquement
2. Assurez-vous d'être au bon endroit
3. Activez le GPS avant de pointer
```

### Problèmes de photo

#### "Photo trop volumineuse"
```
Cause : Fichier > 5MB
Solution :
1. Compresser l'image
2. Utiliser une photo de meilleure qualité
3. Réduire la résolution
```

#### "Upload photo échoué"
```
Cause : Problème de connexion
Solution :
1. Vérifier la connexion internet
2. Réessayer l'upload
3. Contacter le support si ça persiste
```

---

## 📞 Support

### Avant de contacter le support

```
1. Consulter cette documentation
2. Vérifier les logs du navigateur (F12 → Console)
3. Essayer sur un autre navigateur
4. Essayer sur un autre appareil
5. Redémarrer l'appareil
```

### Informations à fournir

```
Quand vous contactez le support, fournissez :
├─ Description du problème
├─ Étapes pour reproduire
├─ Navigateur et version
├─ Système d'exploitation
├─ Capture d'écran
└─ Message d'erreur exact
```

### Contacts

```
Support technique : support@kore.example.com
Téléphone : +33 1 23 45 67 89
Chat : https://kore.example.com/support
```

---

## 📚 Documentation complète

Pour plus de détails, consultez :

- **DOCUMENTATION_ANTI_FRAUDE.md** : Documentation technique complète
- **IMPLEMENTATION_SUMMARY.md** : Résumé d'implémentation
- **DEPLOYMENT_CHECKLIST.md** : Checklist de déploiement

---

## ✅ Checklist de démarrage

### Pour les chefs

```
☐ J'ai accès à https://kore.example.com/chef-pointages.html
☐ J'ai accès à https://kore.example.com/chef-materiaux.html
☐ J'ai autorisé la géolocalisation
☐ J'ai testé "ACTIVER GPS"
☐ J'ai testé un pointage
☐ J'ai testé un achat avec photo
☐ J'ai lu ce guide
```

### Pour les admins

```
☐ J'ai accès à https://kore.example.com/admin-fraude.html
☐ Je vois les statistiques
☐ Je peux filtrer les données
☐ Je peux voir les détails
☐ J'ai lu ce guide
☐ J'ai lu DOCUMENTATION_ANTI_FRAUDE.md
```

---

## 🎓 Conseils d'utilisation

### Pour les chefs

```
💡 Conseils :
├─ Activez le GPS avant de pointer (gain de temps)
├─ Prenez des photos claires des reçus
├─ Vérifiez que le statut GPS est vert avant de valider
├─ Gardez votre téléphone à proximité du chantier
└─ Contactez l'admin si vous avez des questions

⚠️ À éviter :
├─ Pointer loin du chantier
├─ Oublier la photo sur les achats
├─ Désactiver le GPS
└─ Modifier les données après enregistrement
```

### Pour les admins

```
💡 Conseils :
├─ Consultez le dashboard quotidiennement
├─ Analysez les tendances
├─ Formez les chefs si besoin
├─ Documentez les actions prises
└─ Partagez les bonnes pratiques

⚠️ À éviter :
├─ Ignorer les tentatives de fraude
├─ Augmenter le rayon sans raison
├─ Désactiver les vérifications
└─ Partager les données sensibles
```

---

## 🚀 Prochaines étapes

```
1. Lire ce guide
2. Tester les fonctionnalités
3. Contacter le support si besoin
4. Consulter la documentation complète
5. Participer à la formation (si disponible)
```

---

**KORE Software • Module Anti-Fraude • v1.0**

Dernière mise à jour : 5 août 2026

Pour toute question : support@kore.example.com
