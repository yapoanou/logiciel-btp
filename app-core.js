window.BTPApp = (function () {
    function getSession() {
        return {
            entrepriseId: localStorage.getItem('entreprise_id'),
            userRole: (localStorage.getItem('user_role') || '').toLowerCase().trim(),
            userId: localStorage.getItem('user_id'),
            userNom: localStorage.getItem('user_nom')
        };
    }

    function requireSession(loginPath) {
        const session = getSession();
        if (!session.entrepriseId) {
            window.location.replace(loginPath || 'login.html');
            return null;
        }
        return session;
    }

    function clearSession() {
        localStorage.removeItem('entreprise_id');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_nom');
    }

    function logout(options) {
        const confirmText = (options && options.confirmText) || 'Se déconnecter ?';
        const loginPath = (options && options.loginPath) || 'login.html';
        if (!window.confirm(confirmText)) return;
        clearSession();
        window.location.replace(loginPath);
    }

    function applyRoleMenuFilter(navSelector, role) {
        const nav = document.querySelector(navSelector || 'nav');
        if (!nav || !role) return;
        const links = nav.querySelectorAll('a');
        links.forEach(function (link) {
            const txt = (link.innerText || '').toLowerCase();
            if (role === 'chef') {
                if (txt.includes('bilan') || txt.includes('équipe')) link.style.display = 'none';
            } else if (role === 'pdg' || role === 'admin') {
                if (txt.includes('pointage') || txt.includes('journal') || txt.includes('photos')) {
                    if (!txt.includes('journal')) link.style.display = 'none';
                }
            }
        });
    }

    function showStatus(targetId, message, type, hideAfterMs) {
        const el = document.getElementById(targetId);
        if (!el) return;
        const kind = type === 'error' ? 'error' : 'success';
        el.className = `status-msg status-${kind}`;
        el.innerText = message;
        el.style.display = 'block';
        const timeout = typeof hideAfterMs === 'number' ? hideAfterMs : 3200;
        window.setTimeout(function () {
            el.style.display = 'none';
        }, timeout);
    }

    /**
     * Lit le profil Supabase pour un utilisateur Auth (colonne id OU user_id).
     */
    async function fetchProfileByAuthUserId(sb, authUserId) {
        if (!sb || !authUserId) return null;
        const { data: parId, error: errId } = await sb
            .from('profiles')
            .select('entreprise_id, full_name, role')
            .eq('id', authUserId)
            .maybeSingle();
        if (!errId && parId) return parId;
        const { data: parUid, error: errUid } = await sb
            .from('profiles')
            .select('entreprise_id, full_name, role')
            .eq('user_id', authUserId)
            .maybeSingle();
        if (!errUid && parUid) return parUid;
        return null;
    }

    /**
     * Aligne localStorage avec le profil serveur (source de vérité pour entreprise_id).
     * À appeler au chargement des pages après connexion Supabase.
     */
    async function syncEntrepriseIdFromAuthSession(sb) {
        if (!sb || !sb.auth) return localStorage.getItem('entreprise_id');
        const { data: authData } = await sb.auth.getUser();
        const user = authData && authData.user;
        if (!user) return localStorage.getItem('entreprise_id');

        const profile = await fetchProfileByAuthUserId(sb, user.id);
        if (profile && profile.entreprise_id) {
            localStorage.setItem('entreprise_id', profile.entreprise_id);
            localStorage.setItem('user_id', user.id);
            if (profile.full_name) localStorage.setItem('user_nom', profile.full_name);
            if (profile.role) localStorage.setItem('user_role', String(profile.role).toLowerCase().trim());
            return profile.entreprise_id;
        }
        return localStorage.getItem('entreprise_id');
    }

    return {
        getSession: getSession,
        requireSession: requireSession,
        clearSession: clearSession,
        logout: logout,
        applyRoleMenuFilter: applyRoleMenuFilter,
        showStatus: showStatus,
        fetchProfileByAuthUserId: fetchProfileByAuthUserId,
        syncEntrepriseIdFromAuthSession: syncEntrepriseIdFromAuthSession
    };
})();
