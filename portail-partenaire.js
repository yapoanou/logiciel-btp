// ============================================================
// portail-partenaire.js — Gestion du Portail Partenaires (version sécurisée)
// Nécessite la fonction SQL public.portail_charger (voir portail-partenaire.sql)
// ============================================================

class PortailPartenaire {
    constructor(supabaseClient) {
        this.sb = supabaseClient;
        this.chantierActuel = null;
        this.codeAcces = null;
        this.lienAcces = null;
        this.photos = [];
    }

    /**
     * Vérifier l'accès et charger chantier + photos en un seul appel RPC
     * (le serveur valide le code, limite les tentatives et filtre les colonnes).
     */
    async verifierAcces(chantierIdOuCode, codeAcces = null, lienAcces = null) {
        try {
            const code = codeAcces ? String(codeAcces).trim() : null;
            const lien = lienAcces && this.isUUID(lienAcces) ? lienAcces : null;

            if (!code && !lien) {
                return { success: false, message: 'Accès refusé ou lien expiré' };
            }

            const { data, error } = await this.sb.rpc('portail_charger', {
                p_code: code,
                p_lien: lien
            });

            if (error) {
                console.error('Erreur RPC portail_charger:', error);
                return { success: false, message: 'Erreur de connexion au serveur. Réessayez.' };
            }

            if (data && data.erreur === 'trop_de_tentatives') {
                return { success: false, message: 'Trop de tentatives. Réessayez dans 10 minutes.' };
            }

            if (!data || !data.chantier) {
                return {
                    success: false,
                    message: code ? 'Code d\'accès invalide ou expiré' : 'Lien d\'accès invalide ou expiré'
                };
            }

            this.codeAcces = code;
            this.lienAcces = lien;
            this.chantierActuel = data.chantier;
            this.photos = data.photos || [];
            return { success: true, chantier: this.chantierActuel };

        } catch (err) {
            console.error('Erreur vérification accès:', err);
            return { success: false, message: err.message || 'Lien d\'accès invalide ou expiré' };
        }
    }

    /**
     * Enregistrer une visite (n'interrompt jamais l'affichage en cas d'échec)
     */
    async enregistrerVisite(chantierId) {
        try {
            const ip = await this.obtenirAdresseIP();
            const { error } = await this.sb.rpc('enregistrer_visite_partenaire', {
                p_chantier_id: chantierId,
                p_adresse_ip: ip,
                p_user_agent: navigator.userAgent
            });

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.warn('Visite non enregistrée:', err);
            return { success: false };
        }
    }

    /**
     * Obtenir l'adresse IP du client
     */
    async obtenirAdresseIP() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            return data.ip;
        } catch (err) {
            return null;
        }
    }

    /**
     * Vérifier si une chaîne est un UUID
     */
    isUUID(str) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatDateTime(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getNombrePhotos() {
        return this.photos.length;
    }

    /**
     * Obtenir les photos groupées par mois
     */
    getPhotosParMois() {
        const groupes = {};

        this.photos.forEach(photo => {
            if (!photo.created_at) return;
            const date = new Date(photo.created_at);
            const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!groupes[cle]) {
                groupes[cle] = [];
            }
            groupes[cle].push(photo);
        });

        return groupes;
    }

    /**
     * Nom de chantier sûr pour un nom de fichier
     */
    nomFichierChantier() {
        const nom = this.chantierActuel?.nom_chantier || 'chantier';
        return String(nom).replace(/[^\w\-]+/g, '_');
    }

    /**
     * Générer un rapport PDF
     */
    async genererPDF() {
        try {
            const JS_PDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;

            if (!JS_PDF) {
                throw new Error('Bibliothèque jsPDF non chargée. Assurez-vous d\'inclure jsPDF via CDN ou NPM.');
            }

            const doc = new JS_PDF();
            let yPosition = 20;

            doc.setFontSize(18);
            doc.text('ATTESTATION D\'AVANCEMENT DE CHANTIER', 20, yPosition);
            yPosition += 15;

            if (this.chantierActuel) {
                doc.setFontSize(12);
                doc.text(`Chantier: ${this.chantierActuel.nom_chantier || 'N/A'}`, 20, yPosition);
                yPosition += 8;
                doc.text(`Statut: ${this.chantierActuel.statut || 'N/A'}`, 20, yPosition);
                yPosition += 8;
                doc.text(`Créé le: ${this.formatDate(this.chantierActuel.created_at)}`, 20, yPosition);
                yPosition += 8;
                if (this.chantierActuel.latitude && this.chantierActuel.longitude) {
                    doc.text(`Position GPS: ${this.chantierActuel.latitude}, ${this.chantierActuel.longitude}`, 20, yPosition);
                    yPosition += 8;
                }
                yPosition += 15;
            }

            doc.setFontSize(14);
            doc.text(`Photographies (${this.photos.length} photos)`, 20, yPosition);
            yPosition += 10;

            doc.setFontSize(10);
            this.photos.slice(0, 10).forEach((photo, index) => {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setTextColor(0);
                doc.text(`${index + 1}. ${photo.caption || 'Photo'}`, 20, yPosition);
                yPosition += 5;
                doc.setTextColor(100);
                doc.text(`Date: ${this.formatDateTime(photo.created_at)}`, 25, yPosition);
                yPosition += 4;
                doc.setTextColor(0);
                yPosition += 6;
            });

            yPosition += 10;
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 20, yPosition);
            doc.text('Portail Partenaires - KORE Software', 20, yPosition + 5);

            doc.save(`attestation_${this.nomFichierChantier()}_${Date.now()}.pdf`);
            return { success: true };
        } catch (err) {
            console.error('Erreur génération PDF:', err);
            return { success: false, message: err.message };
        }
    }

    /**
     * Exporter les données en JSON
     */
    exporterJSON() {
        if (!this.chantierActuel) {
            return { success: false, message: 'Aucun chantier chargé.' };
        }

        const donnees = {
            chantier: this.chantierActuel,
            photos: this.photos,
            dateExport: new Date().toISOString()
        };

        const json = JSON.stringify(donnees, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donnees_${this.nomFichierChantier()}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return { success: true };
    }
}

// Rendre le module accessible globalement
window.PortailPartenaire = PortailPartenaire;