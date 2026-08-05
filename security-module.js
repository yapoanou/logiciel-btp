// ============================================================
// security-module.js — Module de sécurité anti-fraude
// Gère la validation des pointages et achats avec traçabilité
// ============================================================

const SecurityModule = (function () {
    // Configuration
    const CONFIG = {
        GEOFENCE_RADIUS_M: 100,      // Rayon géofence par défaut (100m)
        RECEIPT_REQUIRED: true,       // Photo de reçu obligatoire
        GPS_REQUIRED: true,           // GPS obligatoire
        LOG_ATTEMPTS: true            // Logger les tentatives
    };

    /**
     * Classe SecurityManager - Gère la validation anti-fraude
     */
    class SecurityManager {
        constructor(supabaseClient) {
            this.sb = supabaseClient;
            this.auditLog = [];
        }

        /**
         * Valide un pointage avec géofencing
         * @param {Object} pointage - { chantier_id, equipe_id, date_pointage, statut }
         * @param {Object} userPosition - { latitude, longitude, accuracy }
         * @param {Object} chantierData - { id, latitude, longitude, rayon_geofence }
         * @returns {Promise<{valid, message, distance, gpsValid}>}
         */
        async validatePointage(pointage, userPosition, chantierData) {
            try {
                // Vérification 1 : Position GPS disponible
                if (!userPosition || !userPosition.latitude || !userPosition.longitude) {
                    await this.logFraudAttempt('gps_missing', {
                        type: 'pointage',
                        chantier_id: pointage.chantier_id,
                        reason: 'Position GPS manquante'
                    });
                    return {
                        valid: false,
                        message: '❌ GPS non disponible. Impossible d\'enregistrer le pointage.',
                        distance: null,
                        gpsValid: false
                    };
                }

                // Vérification 2 : Données du chantier
                if (!chantierData || !chantierData.latitude || !chantierData.longitude) {
                    await this.logFraudAttempt('chantier_gps_missing', {
                        type: 'pointage',
                        chantier_id: pointage.chantier_id,
                        reason: 'Coordonnées du chantier non calibrées'
                    });
                    return {
                        valid: false,
                        message: '⚠️ Chantier non calibré. Contactez votre administrateur.',
                        distance: null,
                        gpsValid: false
                    };
                }

                // Vérification 3 : Géofencing
                const radius = chantierData.rayon_geofence || CONFIG.GEOFENCE_RADIUS_M;
                const geofenceCheck = GeoLocationModule.isWithinGeofence(
                    userPosition,
                    {
                        latitude: chantierData.latitude,
                        longitude: chantierData.longitude
                    },
                    radius
                );

                if (!geofenceCheck.isWithin) {
                    await this.logFraudAttempt('geofencing_violation', {
                        type: 'pointage',
                        chantier_id: pointage.chantier_id,
                        equipe_id: pointage.equipe_id,
                        distance: geofenceCheck.distance,
                        radius: radius,
                        user_position: userPosition,
                        chantier_position: {
                            latitude: chantierData.latitude,
                            longitude: chantierData.longitude
                        }
                    });
                    return {
                        valid: false,
                        message: `❌ Vous êtes hors zone de géofencing (${geofenceCheck.distance}m / ${radius}m). Pointage bloqué.`,
                        distance: geofenceCheck.distance,
                        gpsValid: false
                    };
                }

                // ✅ Validation réussie
                return {
                    valid: true,
                    message: `✅ Pointage validé (${geofenceCheck.distance}m / ${radius}m)`,
                    distance: geofenceCheck.distance,
                    gpsValid: true
                };

            } catch (error) {
                console.error('Erreur validation pointage:', error);
                return {
                    valid: false,
                    message: '⚠️ Erreur lors de la validation. Veuillez réessayer.',
                    distance: null,
                    gpsValid: false
                };
            }
        }

        /**
         * Valide un achat avec photo et GPS
         * @param {Object} achat - { chantier_id, designation, prix_total }
         * @param {File} photoFile - Fichier photo du reçu
         * @param {Object} userPosition - { latitude, longitude, accuracy }
         * @returns {Promise<{valid, message, photoUrl}>}
         */
        async validateAchat(achat, photoFile, userPosition) {
            try {
                // Vérification 1 : Photo obligatoire
                if (CONFIG.RECEIPT_REQUIRED && !photoFile) {
                    await this.logFraudAttempt('missing_receipt', {
                        type: 'achat',
                        chantier_id: achat.chantier_id,
                        montant: achat.prix_total,
                        reason: 'Photo de reçu manquante'
                    });
                    return {
                        valid: false,
                        message: '❌ Photo du reçu obligatoire. Veuillez en ajouter une.',
                        photoUrl: null
                    };
                }

                // Vérification 2 : GPS obligatoire
                if (CONFIG.GPS_REQUIRED && (!userPosition || !userPosition.latitude)) {
                    await this.logFraudAttempt('gps_missing', {
                        type: 'achat',
                        chantier_id: achat.chantier_id,
                        montant: achat.prix_total,
                        reason: 'Position GPS manquante'
                    });
                    return {
                        valid: false,
                        message: '❌ GPS non disponible. Impossible d\'enregistrer l\'achat.',
                        photoUrl: null
                    };
                }

                // Vérification 3 : Taille photo
                if (photoFile && photoFile.size > 5 * 1024 * 1024) {
                    await this.logFraudAttempt('invalid_receipt', {
                        type: 'achat',
                        chantier_id: achat.chantier_id,
                        reason: 'Photo trop volumineuse (>5MB)'
                    });
                    return {
                        valid: false,
                        message: '❌ Photo trop volumineuse (max 5MB).',
                        photoUrl: null
                    };
                }

                // ✅ Validation réussie
                return {
                    valid: true,
                    message: '✅ Achat validé avec photo et GPS',
                    photoUrl: null // URL sera définie après upload
                };

            } catch (error) {
                console.error('Erreur validation achat:', error);
                return {
                    valid: false,
                    message: '⚠️ Erreur lors de la validation. Veuillez réessayer.',
                    photoUrl: null
                };
            }
        }

        /**
         * Enregistre une tentative de fraude dans la table audit_fraude
         * @param {string} typeFraude - Type de fraude détecté
         * @param {Object} details - Détails de la tentative
         * @returns {Promise<void>}
         */
        async logFraudAttempt(typeFraude, details) {
            if (!CONFIG.LOG_ATTEMPTS || !this.sb) return;

            try {
                const { data: userData } = await this.sb.auth.getUser();
                const userId = userData?.user?.id;

                const { error } = await this.sb.from('audit_fraude').insert([{
                    auteur_id: userId,
                    type_fraude: typeFraude,
                    details: details,
                    statut: 'bloqué',
                    timestamp: new Date().toISOString()
                }]);

                if (error) {
                    console.error('Erreur logging fraude:', error);
                } else {
                    console.log(`🚨 Tentative de fraude enregistrée: ${typeFraude}`);
                }
            } catch (error) {
                console.error('Erreur lors du logging:', error);
            }
        }

        /**
         * Récupère le rapport d'audit pour un chantier
         * @param {string} chantier_id
         * @param {Object} filters - { startDate, endDate, typeFraude }
         * @returns {Promise<Array>}
         */
        async getAuditReport(chantier_id, filters = {}) {
            try {
                let query = this.sb
                    .from('audit_fraude')
                    .select('*')
                    .eq('chantier_id', chantier_id)
                    .order('timestamp', { ascending: false });

                if (filters.startDate) {
                    query = query.gte('timestamp', filters.startDate);
                }
                if (filters.endDate) {
                    query = query.lte('timestamp', filters.endDate);
                }
                if (filters.typeFraude) {
                    query = query.eq('type_fraude', filters.typeFraude);
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Erreur récupération audit:', error);
                    return [];
                }

                return data || [];
            } catch (error) {
                console.error('Erreur getAuditReport:', error);
                return [];
            }
        }

        /**
         * Calibre les coordonnées GPS d'un chantier (premier pointage)
         * @param {string} chantier_id
         * @param {Object} position - { latitude, longitude }
         * @returns {Promise<{success, message}>}
         */
        async calibrateChantierGPS(chantier_id, position) {
            try {
                const { error } = await this.sb
                    .from('chantiers')
                    .update({
                        latitude: position.latitude,
                        longitude: position.longitude,
                        rayon_geofence: CONFIG.GEOFENCE_RADIUS_M,
                        gps_calibre_at: new Date().toISOString()
                    })
                    .eq('id', chantier_id);

                if (error) {
                    console.error('Erreur calibrage GPS:', error);
                    return {
                        success: false,
                        message: 'Erreur lors du calibrage GPS'
                    };
                }

                return {
                    success: true,
                    message: '✅ Chantier calibré avec succès'
                };
            } catch (error) {
                console.error('Erreur calibrateChantierGPS:', error);
                return {
                    success: false,
                    message: 'Erreur lors du calibrage'
                };
            }
        }

        /**
         * Enregistre un pointage avec données GPS
         * @param {Object} pointageData - Données du pointage
         * @param {Object} gpsData - { latitude, longitude, distance }
         * @returns {Promise<{success, message, id}>}
         */
        async recordPointageWithGPS(pointageData, gpsData) {
            try {
                const { data, error } = await this.sb
                    .from('pointage')
                    .insert([{
                        ...pointageData,
                        latitude: gpsData.latitude,
                        longitude: gpsData.longitude,
                        distance_m: gpsData.distance,
                        gps_valide: true
                    }])
                    .select();

                if (error) {
                    console.error('Erreur enregistrement pointage:', error);
                    return {
                        success: false,
                        message: 'Erreur lors de l\'enregistrement'
                    };
                }

                return {
                    success: true,
                    message: '✅ Pointage enregistré',
                    id: data?.[0]?.id
                };
            } catch (error) {
                console.error('Erreur recordPointageWithGPS:', error);
                return {
                    success: false,
                    message: 'Erreur lors de l\'enregistrement'
                };
            }
        }

        /**
         * Enregistre un achat avec photo et GPS
         * @param {Object} achatData - Données de l'achat
         * @param {string} photoUrl - URL de la photo uploadée
         * @param {Object} gpsData - { latitude, longitude }
         * @returns {Promise<{success, message, id}>}
         */
        async recordAchatWithGPS(achatData, photoUrl, gpsData) {
            try {
                const { data, error } = await this.sb
                    .from('materiaux')
                    .insert([{
                        ...achatData,
                        photo_recu_url: photoUrl,
                        latitude: gpsData.latitude,
                        longitude: gpsData.longitude,
                        photo_recu_at: new Date().toISOString()
                    }])
                    .select();

                if (error) {
                    console.error('Erreur enregistrement achat:', error);
                    return {
                        success: false,
                        message: 'Erreur lors de l\'enregistrement'
                    };
                }

                return {
                    success: true,
                    message: '✅ Achat enregistré avec traçabilité',
                    id: data?.[0]?.id
                };
            } catch (error) {
                console.error('Erreur recordAchatWithGPS:', error);
                return {
                    success: false,
                    message: 'Erreur lors de l\'enregistrement'
                };
            }
        }
    }

    // ── API publique
    return {
        SecurityManager,
        CONFIG
    };
})();

// Rendre accessible globalement
window.SecurityModule = SecurityModule;
