// ============================================================
// alert-system.js — Système d'alerte anti-fraude en temps réel
// Notifications pour PDG/Admin en cas de fraude détectée
// ============================================================

const AlertSystem = (function () {
    // Configuration
    const CONFIG = {
        ALERT_SOUND_ENABLED: true,
        ALERT_NOTIFICATION_ENABLED: true,
        ALERT_EMAIL_ENABLED: true,
        ALERT_SMS_ENABLED: false,
        ALERT_TIMEOUT_MS: 5000,
        CRITICAL_THRESHOLD: 5, // Nombre de fraudes avant alerte critique
        REALTIME_UPDATE_INTERVAL: 5000 // 5 secondes
    };

    // Types d'alerte
    const ALERT_TYPES = {
        GEOFENCING_VIOLATION: {
            level: 'warning',
            icon: '🚫',
            title: 'Violation de géofencing',
            color: '#ef4444'
        },
        MISSING_RECEIPT: {
            level: 'warning',
            icon: '📸',
            title: 'Photo de reçu manquante',
            color: '#f97316'
        },
        GPS_MISSING: {
            level: 'warning',
            icon: '📍',
            title: 'GPS manquant',
            color: '#eab308'
        },
        MULTIPLE_VIOLATIONS: {
            level: 'critical',
            icon: '🚨',
            title: 'Fraudes multiples détectées',
            color: '#dc2626'
        },
        SUSPICIOUS_PATTERN: {
            level: 'critical',
            icon: '⚠️',
            title: 'Comportement suspect détecté',
            color: '#dc2626'
        }
    };

    /**
     * Classe AlertManager - Gère les alertes de fraude
     */
    class AlertManager {
        constructor(supabaseClient) {
            this.sb = supabaseClient;
            this.alertHistory = [];
            this.realtimeSubscription = null;
            this.soundAudio = null;
            this.initializeAlertSound();
        }

        /**
         * Initialise le son d'alerte
         */
        initializeAlertSound() {
            if (!CONFIG.ALERT_SOUND_ENABLED) return;
            
            // Créer un son d'alerte simple avec Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioContext = audioContext;
        }

        /**
         * Joue un son d'alerte
         */
        playAlertSound() {
            if (!CONFIG.ALERT_SOUND_ENABLED || !this.audioContext) return;

            try {
                const ctx = this.audioContext;
                const now = ctx.currentTime;
                
                // Créer une oscillateur pour le son
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                // Fréquence d'alerte (800 Hz)
                osc.frequency.value = 800;
                
                // Durée du son (0.5 secondes)
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                
                osc.start(now);
                osc.stop(now + 0.5);
            } catch (error) {
                console.error('Erreur lors de la lecture du son d\'alerte:', error);
            }
        }

        /**
         * Affiche une notification visuelle
         */
        showVisualAlert(alertData) {
            const alertType = ALERT_TYPES[alertData.type_fraude] || ALERT_TYPES.GEOFENCING_VIOLATION;
            
            // Créer le conteneur d'alerte
            const alertContainer = document.createElement('div');
            alertContainer.className = 'alert-notification';
            alertContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-left: 5px solid ${alertType.color};
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            `;

            // Contenu de l'alerte
            const alertContent = `
                <div style="display: flex; gap: 12px;">
                    <div style="font-size: 24px;">${alertType.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: ${alertType.color}; margin-bottom: 4px;">
                            ${alertType.title}
                        </div>
                        <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 8px;">
                            ${this.formatAlertMessage(alertData)}
                        </div>
                        <div style="font-size: 0.8rem; color: #94a3b8;">
                            ${new Date(alertData.timestamp).toLocaleTimeString('fr-FR')}
                        </div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; font-size: 20px; cursor: pointer; color: #cbd5e1;">
                        ✕
                    </button>
                </div>
            `;

            alertContainer.innerHTML = alertContent;
            document.body.appendChild(alertContainer);

            // Ajouter l'animation CSS
            if (!document.querySelector('style[data-alert-styles]')) {
                const style = document.createElement('style');
                style.setAttribute('data-alert-styles', 'true');
                style.textContent = `
                    @keyframes slideIn {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    .alert-critical {
                        animation: pulse 1s infinite;
                    }
                `;
                document.head.appendChild(style);
            }

            // Ajouter la classe pulse si critique
            if (alertType.level === 'critical') {
                alertContainer.classList.add('alert-critical');
            }

            // Supprimer après 5 secondes
            setTimeout(() => {
                alertContainer.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => alertContainer.remove(), 300);
            }, CONFIG.ALERT_TIMEOUT_MS);
        }

        /**
         * Formate le message d'alerte
         */
        formatAlertMessage(alertData) {
            const details = alertData.details || {};
            
            switch (alertData.type_fraude) {
                case 'geofencing_violation':
                    return `Chef hors zone : ${details.distance}m / ${details.radius}m`;
                case 'missing_receipt':
                    return `Achat sans photo : ${details.montant?.toLocaleString()} F`;
                case 'gps_missing':
                    return `Tentative sans GPS`;
                case 'multiple_violations':
                    return `${details.count} violations détectées`;
                default:
                    return 'Fraude détectée';
            }
        }

        /**
         * Envoie une notification navigateur
         */
        async sendBrowserNotification(alertData) {
            if (!CONFIG.ALERT_NOTIFICATION_ENABLED) return;
            if (!('Notification' in window)) return;

            if (Notification.permission === 'granted') {
                const alertType = ALERT_TYPES[alertData.type_fraude] || ALERT_TYPES.GEOFENCING_VIOLATION;
                
                new Notification(alertType.title, {
                    icon: '/icon.png',
                    badge: '/icon.png',
                    body: this.formatAlertMessage(alertData),
                    tag: `fraud-${alertData.id}`,
                    requireInteraction: alertType.level === 'critical'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }

        /**
         * Envoie une alerte email
         */
        async sendEmailAlert(alertData) {
            if (!CONFIG.ALERT_EMAIL_ENABLED) return;

            try {
                const { data: { user } } = await this.sb.auth.getUser();
                const { data: profile } = await this.sb
                    .from('profiles')
                    .select('email')
                    .eq('id', user.id)
                    .single();

                if (!profile?.email) return;

                // Appeler une fonction Edge (à implémenter côté Supabase)
                const response = await fetch('/api/send-alert-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: profile.email,
                        alertData: alertData,
                        alertType: ALERT_TYPES[alertData.type_fraude]
                    })
                });

                if (!response.ok) {
                    console.error('Erreur envoi email:', response.statusText);
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi de l\'email:', error);
            }
        }

        /**
         * Envoie une alerte SMS
         */
        async sendSMSAlert(alertData) {
            if (!CONFIG.ALERT_SMS_ENABLED) return;

            try {
                const { data: { user } } = await this.sb.auth.getUser();
                const { data: profile } = await this.sb
                    .from('profiles')
                    .select('phone')
                    .eq('id', user.id)
                    .single();

                if (!profile?.phone) return;

                // Appeler une fonction Edge (à implémenter côté Supabase)
                const response = await fetch('/api/send-alert-sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: profile.phone,
                        message: this.formatAlertMessage(alertData)
                    })
                });

                if (!response.ok) {
                    console.error('Erreur envoi SMS:', response.statusText);
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi du SMS:', error);
            }
        }

        /**
         * Traite une alerte de fraude
         */
        async handleFraudAlert(alertData) {
            // Ajouter à l'historique
            this.alertHistory.push({
                ...alertData,
                processedAt: new Date().toISOString()
            });

            // Jouer le son
            this.playAlertSound();

            // Afficher la notification visuelle
            this.showVisualAlert(alertData);

            // Envoyer les notifications
            await Promise.all([
                this.sendBrowserNotification(alertData),
                this.sendEmailAlert(alertData),
                this.sendSMSAlert(alertData)
            ]);

            // Vérifier les patterns suspects
            await this.checkSuspiciousPatterns();
        }

        /**
         * Vérifie les patterns suspects
         */
        async checkSuspiciousPatterns() {
            // Compter les fraudes des 5 dernières minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            
            const { data: recentFrauds, error } = await this.sb
                .from('audit_fraude')
                .select('*')
                .gte('timestamp', fiveMinutesAgo)
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Erreur vérification patterns:', error);
                return;
            }

            // Si plus de 5 fraudes en 5 minutes, alerte critique
            if (recentFrauds && recentFrauds.length >= CONFIG.CRITICAL_THRESHOLD) {
                const alertData = {
                    id: `critical-${Date.now()}`,
                    type_fraude: 'multiple_violations',
                    timestamp: new Date().toISOString(),
                    details: {
                        count: recentFrauds.length,
                        timeWindow: '5 minutes'
                    }
                };

                this.showVisualAlert(alertData);
                this.playAlertSound();
            }
        }

        /**
         * Démarre le monitoring en temps réel
         */
        startRealtimeMonitoring() {
            if (this.realtimeSubscription) return;

            // S'abonner aux changements de la table audit_fraude
            this.realtimeSubscription = this.sb
                .channel('audit_fraude_changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'audit_fraude'
                    },
                    (payload) => {
                        this.handleFraudAlert(payload.new);
                    }
                )
                .subscribe((status) => {
                    console.log('Realtime subscription status:', status);
                });
        }

        /**
         * Arrête le monitoring en temps réel
         */
        stopRealtimeMonitoring() {
            if (this.realtimeSubscription) {
                this.sb.removeChannel(this.realtimeSubscription);
                this.realtimeSubscription = null;
            }
        }

        /**
         * Récupère l'historique des alertes
         */
        getAlertHistory(limit = 50) {
            return this.alertHistory.slice(-limit);
        }

        /**
         * Efface l'historique des alertes
         */
        clearAlertHistory() {
            this.alertHistory = [];
        }
    }

    // ── API publique
    return {
        AlertManager,
        ALERT_TYPES,
        CONFIG
    };
})();

// Rendre accessible globalement
window.AlertSystem = AlertSystem;
