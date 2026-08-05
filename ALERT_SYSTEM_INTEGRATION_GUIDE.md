# Guide d'Intégration du Système d'Alerte Anti-Fraude

## 📋 Vue d'ensemble

Le système d'alerte anti-fraude de KORE Software fournit une surveillance en temps réel des tentatives de fraude avec notifications multi-canaux (visuelles, navigateur, email, SMS).

## 🎯 Fonctionnalités principales

### 1. **Monitoring en temps réel**
- Écoute des changements dans la table `audit_fraude` via Supabase Realtime
- Détection instantanée des nouvelles tentatives de fraude
- Mise à jour automatique du tableau de bord

### 2. **Notifications multi-canaux**
- **Alertes visuelles** : Toast notifications animées dans le coin supérieur droit
- **Notifications navigateur** : Notifications système du navigateur (avec permission)
- **Alertes sonores** : Tonalité d'alerte (800Hz) via Web Audio API
- **Email** : Notifications par email via Edge Functions (à configurer)
- **SMS** : Notifications par SMS via Edge Functions (à configurer)

### 3. **Détection de patterns suspects**
- Détecte 5+ tentatives de fraude en 5 minutes
- Déclenche une alerte critique "SUSPICIOUS_PATTERN"
- Notifie immédiatement le PDG/Admin

### 4. **Historique des alertes**
- Affiche les 50 dernières alertes
- Tri par sévérité (critique/warning)
- Timestamps précis en heure locale
- Bouton pour effacer l'historique

## 🔧 Architecture technique

### Fichiers impliqués

```
alert-system.js          # Module AlertManager (280 lignes)
admin-fraude.html        # Dashboard avec intégration (1200+ lignes)
security-module.js       # Logging des tentatives de fraude
geolocation.js          # Données GPS pour contexte
```

### Classe AlertManager

```javascript
class AlertManager {
    constructor(supabaseClient)
    
    // Méthodes principales
    startRealtimeMonitoring(entrepriseId, callback)
    showVisualAlert(message, type)
    playAlertSound()
    sendBrowserNotification(title, options)
    sendEmailAlert(data)
    sendSMSAlert(data)
    checkSuspiciousPatterns(fraudAttempts)
}
```

## 📊 Types d'alertes

### 1. GEOFENCING_VIOLATION
```javascript
{
    type: 'GEOFENCING_VIOLATION',
    severity: 'warning',
    message: '⚠️ Violation géofencing détectée',
    details: {
        distance: 250,
        radius: 100,
        chantier: 'Chantier Paris'
    }
}
```

### 2. MISSING_RECEIPT
```javascript
{
    type: 'MISSING_RECEIPT',
    severity: 'warning',
    message: '📸 Photo de reçu manquante',
    details: {
        montant: 1500,
        user: 'Chef de chantier'
    }
}
```

### 3. GPS_MISSING
```javascript
{
    type: 'GPS_MISSING',
    severity: 'warning',
    message: '📍 GPS manquant sur achat',
    details: {
        montant: 2000
    }
}
```

### 4. SUSPICIOUS_PATTERN
```javascript
{
    type: 'SUSPICIOUS_PATTERN',
    severity: 'critical',
    message: '🚨 Pattern suspect détecté : 5+ fraudes en 5 min',
    details: {
        count: 7,
        timeWindow: '5 minutes',
        user: 'Chef de chantier'
    }
}
```

## 🚀 Utilisation

### Initialisation dans admin-fraude.html

```javascript
// Dans la fonction init()
if (window.AlertManager) {
    alertManager = new window.AlertManager(window.sb);
    
    // Démarrer le monitoring
    alertManager.startRealtimeMonitoring(ENTREPRISE_ID, (alert) => {
        handleNewAlert(alert);
    });
}
```

### Gestion des alertes

```javascript
function handleNewAlert(alert) {
    // Ajouter à l'historique
    alertHistory.unshift({
        timestamp: new Date(),
        type: alert.type,
        message: alert.message,
        severity: alert.severity
    });

    // Afficher l'alerte visuelle
    if (alertManager) {
        alertManager.showVisualAlert(alert.message, alert.type);
    }

    // Mettre à jour l'UI
    updateAlertHistoryUI();

    // Recharger les données
    chargerDonnees();
}
```

## 🎨 Interface utilisateur

### Élément de monitoring
```html
<div id="monitoring-status" class="monitoring-badge">
    <div class="monitoring-dot"></div>
    <span>Monitoring actif</span>
</div>
```

### Historique des alertes
```html
<div class="alert-history-section">
    <div class="alert-history-header">
        <h2><i class="fas fa-bell"></i> Historique des alertes</h2>
        <button onclick="clearAlertHistory()">Effacer</button>
    </div>
    <div class="alert-history-list" id="alert-history-list">
        <!-- Alertes dynamiques -->
    </div>
</div>
```

### Conteneur d'alertes
```html
<div id="alerts-container" class="alerts-container"></div>
```

## 🔐 Sécurité

### Row Level Security (RLS)
La table `audit_fraude` doit avoir les politiques RLS suivantes :

```sql
-- Lecture : Admins et PDG seulement
CREATE POLICY "Admins can read fraud attempts"
ON audit_fraude FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('admin', 'pdg')
    )
);

-- Insertion : Système seulement
CREATE POLICY "System can insert fraud attempts"
ON audit_fraude FOR INSERT
WITH CHECK (true);
```

### Validation des données
- Tous les types d'alertes sont validés
- Les détails sont sérialisés en JSON
- Les timestamps sont en UTC

## 📱 Notifications navigateur

### Activation
```javascript
// Demander la permission
Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
        // Notifications activées
    }
});
```

### Exemple
```javascript
alertManager.sendBrowserNotification('Alerte fraude', {
    body: 'Violation géofencing détectée',
    icon: 'icon.png',
    badge: 'icon.png',
    tag: 'fraud-alert'
});
```

## 🔊 Alertes sonores

### Tonalité d'alerte
- Fréquence : 800 Hz
- Durée : 500ms
- Volume : 0.3 (30%)
- Répétition : 3 fois avec délai

```javascript
alertManager.playAlertSound();
```

## 📧 Email et SMS (À configurer)

### Edge Functions requises

#### `send-fraud-alert-email`
```javascript
// Envoie un email au PDG/Admin
// Paramètres : { email, subject, message, fraudDetails }
```

#### `send-fraud-alert-sms`
```javascript
// Envoie un SMS au PDG/Admin
// Paramètres : { phone, message, fraudDetails }
```

### Configuration
1. Créer les Edge Functions dans Supabase
2. Configurer les variables d'environnement (SendGrid, Twilio)
3. Mettre à jour les URLs dans `alert-system.js`

## 📊 Statistiques et métriques

### Données affichées
- **Tentatives bloquées** : Total des fraudes détectées
- **Violations géofencing** : Pointages hors zone
- **Photos manquantes** : Achats sans photo
- **GPS manquants** : Achats sans GPS

### Mise à jour en temps réel
Les statistiques se mettent à jour automatiquement quand une nouvelle fraude est détectée.

## 🧪 Tests

### Test de l'alerte visuelle
```javascript
alertManager.showVisualAlert('Test alert', 'GEOFENCING_VIOLATION');
```

### Test du son
```javascript
alertManager.playAlertSound();
```

### Test de la notification navigateur
```javascript
alertManager.sendBrowserNotification('Test', {
    body: 'Ceci est un test'
});
```

### Test du monitoring
1. Ouvrir admin-fraude.html
2. Vérifier que "Monitoring actif" s'affiche
3. Créer une tentative de fraude depuis chef-pointages.html
4. Vérifier que l'alerte apparaît en temps réel

## 🐛 Dépannage

### Le monitoring ne démarre pas
- Vérifier que `alert-system.js` est chargé
- Vérifier que `window.AlertManager` existe
- Vérifier les permissions Supabase Realtime

### Les alertes ne s'affichent pas
- Vérifier que `#alerts-container` existe dans le DOM
- Vérifier la console pour les erreurs JavaScript
- Vérifier que les données arrivent via Realtime

### Les notifications navigateur ne fonctionnent pas
- Vérifier que le navigateur supporte les notifications
- Vérifier que l'utilisateur a donné la permission
- Vérifier que le site est en HTTPS (requis pour les notifications)

### Le son ne joue pas
- Vérifier que le navigateur autorise l'audio
- Vérifier que le volume du système n'est pas muet
- Vérifier que Web Audio API est supportée

## 📈 Performance

### Optimisations implémentées
- Debouncing des mises à jour UI (300ms)
- Limitation à 50 alertes en historique
- Lazy loading des détails de fraude
- Compression des données JSON

### Recommandations
- Archiver les alertes anciennes (> 30 jours)
- Implémenter la pagination pour les alertes
- Ajouter un cache côté client
- Utiliser IndexedDB pour l'historique local

## 🔄 Intégration avec le reste du système

### Flux complet
1. **Chef de chantier** : Tente une action (pointage/achat)
2. **security-module.js** : Valide et log la tentative
3. **audit_fraude** : Enregistre la tentative
4. **Supabase Realtime** : Notifie les abonnés
5. **alert-system.js** : Reçoit et traite l'alerte
6. **admin-fraude.html** : Affiche l'alerte et met à jour le tableau

### Données partagées
```javascript
// Depuis security-module.js
await this.logFraudAttempt(typeFraude, details);

// Reçu par alert-system.js
alertManager.startRealtimeMonitoring(entrepriseId, callback);
```

## 📚 Ressources

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## ✅ Checklist de déploiement

- [ ] `alert-system.js` est chargé dans admin-fraude.html
- [ ] `AlertManager` est initialisé dans la fonction `init()`
- [ ] Les permissions Supabase Realtime sont configurées
- [ ] Les Edge Functions email/SMS sont créées (optionnel)
- [ ] Les tests d'alerte passent
- [ ] L'historique des alertes s'affiche correctement
- [ ] Les notifications navigateur fonctionnent
- [ ] Le son d'alerte joue correctement
- [ ] Les statistiques se mettent à jour en temps réel
- [ ] La documentation est à jour

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs de la console (F12)
2. Vérifier les logs Supabase
3. Consulter la documentation
4. Contacter l'équipe de développement
