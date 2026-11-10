/* BâtiOS — barre latérale automatique pour les pages qui n'en ont pas
   (page « Achats & stocks » du chef de chantier, etc.)
   Utilisation : <script src="batios-sidebar.js" data-titre="Achats & stocks"></script>
   à mettre juste avant </body>. Le style est dans batios-pages.css. */
(function () {
  'use strict';
  if (document.getElementById('batios-sidebar')) return;

  var script = document.currentScript;
  var titrePage = (script && script.getAttribute('data-titre')) || 'Cette page';
  var fichier = (location.pathname.split('/').pop() || 'index.html');

  // ---- MENUS (modifie ici pour ajouter / retirer des pages) ----
  var MENU_PDG = [
    ['▦', 'Tableau de bord', 'tableau-de-bord.html'],
    ['▤', 'Gestion des chantiers', 'chantiers.html'],
    ['♧', 'Équipe & pointage', 'equipe.html'],
    ['◈', 'Bilan & matériaux', 'bilan.html'],
    ['⇄', 'Fournisseurs & dettes', 'tableau-de-bord.html#fournisseurs'],
    ['❖', 'Gestion partenaires', 'tableau-de-bord.html#partenaires'],
    ['⬡', 'Détection de fraude', 'admin-fraude.html'],
    ['⚙', 'Profil entreprise', 'profil.html']
  ];
  var MENU_CHEF = [
    ['▦', 'Accueil', 'chef-accueil.html'],
    ['♧', 'Pointage', 'chef-pointages.html'],
    ['▤', 'Journal', 'chef-journal.html']
    // Si tu veux voir « Achats & stocks » depuis les autres pages du chef,
    // ajoute ici une ligne avec le VRAI nom du fichier, par exemple :
    // ['◈', 'Achats & stocks', 'chef-achats.html'],
  ];
  // La page courante est ajoutée automatiquement si elle n'est pas déjà dans la liste
  var dejaLa = MENU_CHEF.some(function (m) { return m[2] === fichier; });
  if (!dejaLa) { MENU_CHEF.splice(2, 0, ['◈', titrePage, fichier]); }

  var role = '';
  try { role = localStorage.getItem('user_role') || ''; } catch (e) {}
  var menu = role === 'pdg' ? MENU_PDG : MENU_CHEF;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var liens = menu.map(function (m) {
    var actif = m[2].split('#')[0] === fichier && m[2].indexOf('#') === -1;
    return '<a class="bsb-link' + (actif ? ' active' : '') + '" href="' + m[2] + '"><span class="bsb-icon">' +
      m[0] + '</span>' + esc(m[1]) + '</a>';
  }).join('');

  var aside = document.createElement('aside');
  aside.id = 'batios-sidebar';
  aside.className = 'batios-sidebar';
  aside.innerHTML =
    '<div class="bsb-brand"><div class="bsb-mark">B</div><div><div class="bsb-name">BâtiOS</div>' +
    '<div class="bsb-sub">PLATEFORME BTP</div></div></div>' +
    '<div class="bsb-label">' + (role === 'pdg' ? 'ESPACE DE TRAVAIL' : 'ESPACE CHEF DE CHANTIER') + '</div>' +
    '<nav class="bsb-nav">' + liens + '</nav>' +
    '<div class="bsb-bottom"><button type="button" class="bsb-logout" id="bsb-logout">↪ Se déconnecter</button>' +
    '<div class="bsb-foot">CONÇU POUR LES PROFESSIONNELS<br><strong>BâtiOS Corporation</strong></div></div>';

  var fond = document.createElement('div');
  fond.className = 'bsb-backdrop';

  var burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'bsb-burger';
  burger.setAttribute('aria-label', 'Ouvrir le menu');
  burger.textContent = '☰';

  document.body.classList.add('has-batios-sidebar');
  document.body.appendChild(aside);
  document.body.appendChild(fond);

  // Le bouton menu remplace le bloc vide à droite de l'en-tête, sinon il flotte en haut à droite
  var vide = document.querySelector('header .header-content > div[style*="width"]');
  if (vide && !vide.children.length) { vide.replaceWith(burger); }
  else { burger.classList.add('flottant'); document.body.appendChild(burger); }

  function ouvrir(o) {
    aside.classList.toggle('open', o);
    fond.classList.toggle('open', o);
  }
  burger.addEventListener('click', function () { ouvrir(!aside.classList.contains('open')); });
  fond.addEventListener('click', function () { ouvrir(false); });
  aside.addEventListener('click', function (e) { if (e.target.closest('a')) ouvrir(false); });

  document.getElementById('bsb-logout').addEventListener('click', function () {
    if (typeof window.deconnexion === 'function') { window.deconnexion(); return; }
    if (window.sb) {
      window.sb.auth.signOut().then(function () {
        try { localStorage.clear(); } catch (e) {}
        location.replace('login.html');
      });
    } else { location.replace('login.html'); }
  });
})();