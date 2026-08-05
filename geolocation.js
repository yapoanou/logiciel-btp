// ============================================================
// geolocation.js — Module de géolocalisation anti-fraude
// Gère la capture GPS, calcul de distance et vérification géofencing
// ============================================================

const GeoLocationModule = (function () {
    // Configuration
    const CONFIG = {
        TIMEOUT_MS: 10000,           // Timeout GPS (10s)
        ACCURACY_THRESHOLD_M: 50,    // Précision acceptable (50m)
        RETRY_ATTEMPTS: 3,           // Nombre de tentatives
        RETRY_DELAY_MS: 2000         // Délai entre tentatives (2s)
    };

    // ── Constantes d'erreur
    const ERROR_CODES = {
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
        TIMEOUT: 'TIMEOUT',
        UNKNOWN: 'UNKNOWN',
        NOT_SUPPORTED: 'NOT_SUPPORTED'
    };

    /**
     * Récupère la position GPS actuelle avec gestion d'erreurs
     * @param {Object} options - { timeout, enableHighAccuracy }
     * @returns {Promise<{latitude, longitude, accuracy, timestamp}>}
     */
    async function getPosition(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject({
                    code: ERROR_CODES.NOT_SUPPORTED,
                    message: 'Géolocalisation non supportée par ce navigateur'
                });
                return;
            }

            const geoOptions = {
                enableHighAccuracy: options.enableHighAccuracy !== false,
                timeout: options.timeout || CONFIG.TIMEOUT_MS,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    });
                },
                (error) => {
                    let errorCode = ERROR_CODES.UNKNOWN;
                    let errorMessage = 'Erreur de géolocalisation inconnue';

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorCode = ERROR_CODES.PERMISSION_DENIED;
                            errorMessage = 'Permission de géolocalisation refusée. Vérifiez les paramètres de votre navigateur.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorCode = ERROR_CODES.POSITION_UNAVAILABLE;
                            errorMessage = 'Position indisponible. Vérifiez que le GPS est activé.';
                            break;
                        case error.TIMEOUT:
                            errorCode = ERROR_CODES.TIMEOUT;
                            errorMessage = 'Délai d\'attente dépassé. Vérifiez votre connexion GPS.';
                            break;
                    }

                    reject({
                        code: errorCode,
                        message: errorMessage,
                        originalError: error
                    });
                },
                geoOptions
            );
        });
    }

    /**
     * Récupère la position avec retry automatique
     * @param {number} attempts - Nombre de tentatives restantes
     * @returns {Promise<{latitude, longitude, accuracy, timestamp}>}
     */
    async function getPositionWithRetry(attempts = CONFIG.RETRY_ATTEMPTS) {
        try {
            return await getPosition();
        } catch (error) {
            if (attempts > 1) {
                console.warn(`Tentative GPS échouée, nouvelle tentative dans ${CONFIG.RETRY_DELAY_MS}ms...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
                return getPositionWithRetry(attempts - 1);
            }
            throw error;
        }
    }

    /**
     * Calcule la distance entre deux points GPS (formule Haversine)
     * @param {number} lat1 - Latitude point 1
     * @param {number} lon1 - Longitude point 1
     * @param {number} lat2 - Latitude point 2
     * @param {number} lon2 - Longitude point 2
     * @returns {number} Distance en mètres
     */
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Rayon terrestre en mètres
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }

    /**
     * Convertit degrés en radians
     * @param {number} degrees
     * @returns {number}
     */
    function toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Vérifie si une position est dans la zone géofence
     * @param {Object} userPosition - { latitude, longitude }
     * @param {Object} chantierPosition - { latitude, longitude }
     * @param {number} radiusMeters - Rayon en mètres
     * @returns {Object} { isWithin, distance, message }
     */
    function isWithinGeofence(userPosition, chantierPosition, radiusMeters = 100) {
        if (!userPosition || !chantierPosition) {
            return {
                isWithin: false,
                distance: null,
                message: 'Données GPS manquantes'
            };
        }

        const distance = calculateDistance(
            userPosition.latitude,
            userPosition.longitude,
            chantierPosition.latitude,
            chantierPosition.longitude
        );

        const isWithin = distance <= radiusMeters;

        return {
            isWithin,
            distance,
            radiusMeters,
            message: isWithin
                ? `✅ Vous êtes dans la zone (${distance}m / ${radiusMeters}m)`
                : `❌ Vous êtes hors zone (${distance}m / ${radiusMeters}m)`
        };
    }

    /**
     * Formate une position GPS pour affichage
     * @param {Object} position - { latitude, longitude, accuracy }
     * @returns {string}
     */
    function formatPosition(position) {
        if (!position) return 'N/A';
        return `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)} (±${Math.round(position.accuracy)}m)`;
    }

    /**
     * Formate une distance pour affichage
     * @param {number} meters
     * @returns {string}
     */
    function formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(2)}km`;
    }

    /**
     * Crée une URL Google Maps pour une position
     * @param {number} latitude
     * @param {number} longitude
     * @returns {string}
     */
    function getMapsUrl(latitude, longitude) {
        return `https://maps.google.com/?q=${latitude},${longitude}`;
    }

    // ── API publique
    return {
        getPosition,
        getPositionWithRetry,
        calculateDistance,
        isWithinGeofence,
        formatPosition,
        formatDistance,
        getMapsUrl,
        ERROR_CODES,
        CONFIG
    };
})();

// Rendre accessible globalement
window.GeoLocationModule = GeoLocationModule;
