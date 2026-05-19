// ============================================================
// rapport-chef.js — corrigé
// ⚠️  Le HTML doit charger supabase.js AVANT ce fichier
// ============================================================

// ── Chargement des chantiers au démarrage
async function chargerListeChantiers() {
    const select = document.getElementById('select-chantier');
    if (!select) return;

    // ✅ On récupère le profil via sb (pas localStorage)
    const profile = await getUserProfile();
    if (!profile) return;

    const { data, error } = await sb
        .from('chantiers')
        .select('id, nom_chantier')
        .eq('statut', 'en_cours')
        .order('nom_chantier');
        // ✅ Pas besoin de .eq('entreprise_id', ...) 
        //    RLS filtre automatiquement par entreprise

    if (error) {
        console.error("Erreur chantiers:", error);
        return;
    }

    select.innerHTML = '<option value="">-- Sélectionner le chantier --</option>';
    data.forEach(chantier => {
        select.innerHTML += `<option value="${chantier.id}">${chantier.nom_chantier}</option>`;
    });
}

// ── Initialisation de la page
document.addEventListener('DOMContentLoaded', async () => {

    // ✅ Vérifie la session — redirige vers login si absent
    const session = await requireAuth();
    if (!session) return;

    // ✅ Charge le profil une seule fois et le stocke
    window._profile = await getUserProfile();
    if (!window._profile) {
        alert("Profil introuvable. Reconnectez-vous.");
        window.location.href = 'login.html';
        return;
    }

    await chargerListeChantiers();

    // ── Soumission du formulaire
    document.getElementById('formRapport').addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn            = e.target.querySelector('button[type="submit"]');
        const fileInput      = document.getElementById('photo-avancement');
        const obstaclesInput = document.getElementById('obstacles');
        const selectChantier = document.getElementById('select-chantier');

        if (!selectChantier.value) {
            return alert("Veuillez sélectionner un chantier.");
        }

        btn.disabled  = true;
        btn.innerText = "Envoi en cours...";

        try {
            const profile      = window._profile;
            const entrepriseId = profile.entreprise_id;
            const chefId       = profile.id;

            // ── 1. Upload photo si présente
            let photoUrl = null;
            const file = fileInput.files[0];

            if (file) {
                // ✅ Vérification taille (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error("Photo trop lourde (max 5MB).");
                }

                const fileExt = file.name.split('.').pop().toLowerCase();
                const fileName = `${entrepriseId}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await sb.storage
                    .from('photos-chantiers')   // ✅ nom du bucket unifié
                    .upload(fileName, file, { upsert: false });

                if (uploadError) throw new Error("Upload photo : " + uploadError.message);

                const { data: urlData } = sb.storage
                    .from('photos-chantiers')
                    .getPublicUrl(fileName);

                photoUrl = urlData.publicUrl;
            }

            // ── 2. Insert dans journal
            // ✅ Colonnes alignées avec le schéma défini plus tôt
            const { error: insertError } = await sb.from('journal').insert([{
                entreprise_id: entrepriseId,
                chantier_id: selectChantier.value,
                auteur_id: chefId,
                note: obstaclesInput.value
            }]);

            if (insertError) throw new Error("Rapport : " + insertError.message);

            if (photoUrl) {
                const { error: photoError } = await sb.from('photos').insert([{
                    entreprise_id: entrepriseId,
                    chantier_id: selectChantier.value,
                    auteur_id: chefId,
                    url: photoUrl
                }]);
                if (photoError) throw new Error("Photo : " + photoError.message);
            }

            alert("Rapport envoyé avec succès !");

            // ── Reset formulaire
            e.target.reset();
            const preview = document.getElementById('preview');
            if (preview) preview.style.display = 'none';

        } catch (err) {
            console.error("Erreur détaillée:", err);
            alert("Erreur : " + err.message);

        } finally {
            btn.disabled  = false;
            btn.innerText = "Envoyer le Rapport";
        }
    });
});
