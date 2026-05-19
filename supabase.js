// ============================================================
// supabase.js — FICHIER UNIQUE — ne jamais dupliquer
// ============================================================
const SUPABASE_URL  = 'https://hkwyxsbejhzizevlxiys.supabase.co';
// CORRECTION : Ajout du guillemet fermant à la fin de la clé
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd3l4c2Jlamh6aXpldmx4aXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDYxNDYsImV4cCI6MjA4NDgyMjE0Nn0.sar7yU83mUMCVi6lc_Edl9KKktCui4CLk3-UWEf-ySc'; 

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: true, autoRefreshToken: true }
});

async function getSession() {
    const { data: { session } } = await sb.auth.getSession();
    return session;
}

 
async function getUserProfile() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb
        .from('profiles')
        .select('id, full_name, role, entreprise_id, phone, email')
        .eq('id', user.id)
        .single();
    if (error) {
        console.error('getUserProfile error:', error.message);
        return null;
    }
    return data;
}

async function requireAuth() {
    const session = await getSession();
    if (!session) { 
        window.location.href = 'login.html'; 
        return null; 
    }
    return session;
}

async function requireRole(role) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== role) {
        alert('Accès non autorisé.');
        window.location.href = 'login.html';
        return null;
    }
    return profile;
}

// AJOUT INDISPENSABLE : Rendre les fonctions accessibles au HTML
window.sb = sb;
window.getSession = getSession;
window.getUserProfile = getUserProfile;
window.requireAuth = requireAuth;
window.requireRole = requireRole;