// ============================================================
// suppliers-module.js — Gestion des Fournisseurs & Dettes
// ============================================================

class SuppliersModule {
    constructor(supabaseClient) {
        this.sb = supabaseClient;
        this.suppliers = [];
        this.debts = [];
    }

    /**
     * Charger tous les fournisseurs d'une entreprise
     */
    async loadSuppliers(entrepriseId) {
        try {
            const { data, error } = await this.sb
                .from('fournisseurs')
                .select('*')
                .eq('entreprise_id', entrepriseId)
                .eq('statut', 'actif')
                .order('nom_entreprise', { ascending: true });

            if (error) throw error;
            this.suppliers = data || [];
            return this.suppliers;
        } catch (err) {
            console.error('Erreur chargement fournisseurs:', err);
            return [];
        }
    }

    /**
     * Créer un nouveau fournisseur
     */
    async createSupplier(entrepriseId, supplierData) {
        try {
            const { data, error } = await this.sb
                .from('fournisseurs')
                .insert([{
                    entreprise_id: entrepriseId,
                    nom_entreprise: supplierData.nom_entreprise.trim(),
                    telephone: supplierData.telephone?.trim() || null,
                    categorie: supplierData.categorie?.trim() || null,
                    email: supplierData.email?.trim() || null,
                    adresse: supplierData.adresse?.trim() || null,
                    contact_principal: supplierData.contact_principal?.trim() || null,
                    statut: 'actif'
                }])
                .select()
                .single();

            if (error) throw error;
            this.suppliers.push(data);
            return { success: true, data };
        } catch (err) {
            console.error('Erreur création fournisseur:', err);
            return { success: false, message: err.message };
        }
    }

    /**
     * Obtenir les dettes totales par fournisseur
     */
    async getSupplierDebts(entrepriseId) {
        try {
            const { data, error } = await this.sb
                .from('vue_dettes_par_fournisseur')
                .select('*')
                .eq('entreprise_id', entrepriseId);

            if (error) throw error;
            this.debts = data || [];
            return this.debts;
        } catch (err) {
            console.error('Erreur chargement dettes:', err);
            return [];
        }
    }

    /**
     * Obtenir les achats en attente de paiement
     */
    async getPendingPurchases(entrepriseId) {
        try {
            const { data, error } = await this.sb
                .from('vue_achats_en_attente')
                .select('*')
                .eq('entreprise_id', entrepriseId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Erreur chargement achats en attente:', err);
            return [];
        }
    }

    /**
     * Marquer un achat comme payé
     */
    async markAsPaid(materiauId, montantPaye, typePaiement, referencePaiement, notes = null) {
        try {
            const { data, error } = await this.sb
                .rpc('marquer_achat_comme_paye', {
                    p_materiau_id: materiauId,
                    p_montant_paye: montantPaye,
                    p_type_paiement: typePaiement,
                    p_reference_paiement: referencePaiement,
                    p_notes: notes
                });

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            console.error('Erreur marquage paiement:', err);
            return { success: false, message: err.message };
        }
    }

    /**
     * Obtenir l'historique des paiements pour un fournisseur
     */
    async getPaymentHistory(fournisseurId) {
        try {
            const { data, error } = await this.sb
                .from('paiements_dettes')
                .select('*')
                .eq('fournisseur_id', fournisseurId)
                .order('date_paiement', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Erreur historique paiements:', err);
            return [];
        }
    }

    /**
     * Obtenir les détails d'un achat avec ses infos de fournisseur
     */
    async getPurchaseDetails(materiauId) {
        try {
            const { data, error } = await this.sb
                .from('materiaux')
                .select(`
                    *,
                    fournisseur:fournisseur_id(id, nom_entreprise, telephone, categorie),
                    chantier:chantier_id(id, nom_chantier)
                `)
                .eq('id', materiauId)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Erreur détails achat:', err);
            return null;
        }
    }

    /**
     * Calculer le total des dettes pour un fournisseur
     */
    async calculateSupplierTotal(fournisseurId) {
        try {
            const { data, error } = await this.sb
                .rpc('calculer_total_dettes_fournisseur', {
                    p_fournisseur_id: fournisseurId
                });

            if (error) throw error;
            return data || 0;
        } catch (err) {
            console.error('Erreur calcul total:', err);
            return 0;
        }
    }

    /**
     * Obtenir les statistiques de dettes
     */
    async getDebtStatistics(entrepriseId) {
        try {
            const { data, error } = await this.sb
                .from('materiaux')
                .select('statut_paiement, prix_total, prix_unitaire, quantite')
                .eq('entreprise_id', entrepriseId);

            if (error) throw error;

            const stats = {
                totalNonPaye: 0,
                totalPaye: 0,
                nombreAchatNonPaye: 0,
                nombreAchatPaye: 0
            };

            data?.forEach(m => {
                const montant = m.prix_total || (m.prix_unitaire * m.quantite);
                if (m.statut_paiement === 'non_paye') {
                    stats.totalNonPaye += montant;
                    stats.nombreAchatNonPaye++;
                } else if (m.statut_paiement === 'paye') {
                    stats.totalPaye += montant;
                    stats.nombreAchatPaye++;
                }
            });

            return stats;
        } catch (err) {
            console.error('Erreur statistiques dettes:', err);
            return {
                totalNonPaye: 0,
                totalPaye: 0,
                nombreAchatNonPaye: 0,
                nombreAchatPaye: 0
            };
        }
    }

    /**
     * Formater un montant en devise
     */
    formatCurrency(amount) {
        return Number(amount || 0).toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    /**
     * Formater une date
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Formater une date et heure
     */
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
}

// Rendre le module accessible globalement
window.SuppliersModule = SuppliersModule;
