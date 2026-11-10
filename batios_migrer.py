#!/usr/bin/env python3
"""
BâtiOS — migration des pages : nom (Kore -> BâtiOS) + thème clair orange/blanc/vert.

Utilisation :
  1. Mets ce fichier ET batios-theme.css + batios-pages.css dans le dossier de tes pages .html
  2. Lance :  python batios_migrer.py
     (ou :     python batios_migrer.py chemin/vers/le/dossier)

Le script :
  - sauvegarde chaque page modifiée dans le dossier _sauvegarde_avant_batios
  - remplace le nom, la lettre du logo, la couleur de la barre mobile
  - ajoute <link rel="stylesheet" href="batios-theme.css"> avant </head>
    UNIQUEMENT sur les pages qui ont une barre latérale (id="sidebar")
  - les autres pages (accueil, connexion, pages chef...) : seul le nom change
  - ignore les pages déjà migrées
  - peut être relancé sans risque
"""
import re
import shutil
import sys
from pathlib import Path

dossier = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent
sauvegarde = dossier / "_sauvegarde_avant_batios"
LIEN = '<link rel="stylesheet" href="batios-theme.css">'
LIEN2 = '<link rel="stylesheet" href="batios-pages.css">'
# pages sans barre latérale reconnues (achats du chef, portail, fournisseurs)
MARQUEURS_PAGES = ('class="flag-top"', 'id="login-screen"', 'class="btn-valider"', 'class="photo-upload-section"')

# (motif regex, remplacement) — l'ordre compte
REMPLACEMENTS = [
    # anciens noms mélangés (BâtiOS Software, Bâtisys Tech...)
    (r'BâtiOS Software • Portail Partenaires • Propulsé par Bât\w+ Tech', 'BâtiOS Corporation • Portail Partenaires'),
    (r'BâtiOS Software • Propulsé par Bât\w+ Tech', 'BâtiOS Corporation'),
    (r'Propulsé par Bât\w+ Tech', 'BâtiOS Corporation'),
    (r'BâtiOS Software', 'BâtiOS'),
    (r'(<meta name="theme-color" content=")#[0-9a-fA-F]{6}(")', r'\1#fffaf3\2'),
    (r'KORE / ', 'BâtiOS / '),
    (r'>K</div>', '>B</div>'),
    (r'content:"K"', 'content:"B"'),
    (r'<div class="brand-name">KORE</div>', '<div class="brand-name">BâtiOS</div>'),
    (r'SOFTWARE · BTP', 'PLATEFORME BTP'),
    (r'<strong>KORE SOFTWARE</strong>', '<strong>BâtiOS Corporation</strong>'),
    (r'<span>KORE SOFTWARE</span>', '<span>BâtiOS Corporation</span>'),
    (r'KORE SOFTWARE', 'BâtiOS'),
    (r'Kore Software', 'BâtiOS'),
    (r'\bKORE\b', 'BâtiOS'),
    (r'\bKore\b', 'BâtiOS'),
    # couleurs des PDF (jsPDF) : bleu nuit -> brun foncé, orange/vert du thème
    (r'\[20,\s*33,\s*61\]', '[28, 21, 16]'),
    (r'\[242,\s*138,\s*36\]', '[255, 122, 0]'),
    (r'\[7,\s*132,\s*71\]', '[15, 157, 88]'),
    (r'\[37,\s*99,\s*235\]', '[245, 158, 11]'),
    (r'\[239,\s*246,\s*255\]', '[255, 247, 236]'),
]

for css in ("batios-theme.css", "batios-pages.css"):
    if not (dossier / css).exists():
        sys.exit("❌ " + css + " est introuvable dans " + str(dossier))

traitees, ignorees, sans_theme = [], [], []
for page in sorted(dossier.glob("*.html")):
    texte = page.read_text(encoding="utf-8")

    if "batios-theme.css" in texte or "batios-pages.css" in texte or "THÈME CLAIR" in texte:
        ignorees.append(page.name)
        continue

    original = texte
    for motif, remplacement in REMPLACEMENTS:
        texte = re.sub(motif, remplacement, texte)

    a_sidebar = re.search(r'(id|class)="sidebar"', texte) is not None
    if a_sidebar and "</head>" in texte:
        texte = texte.replace("</head>", "  " + LIEN + "\n</head>", 1)
    elif any(m in texte for m in MARQUEURS_PAGES) and "</head>" in texte:
        texte = texte.replace("</head>", "  " + LIEN2 + "\n</head>", 1)
    elif texte != original:
        sans_theme.append(page.name)

    if texte != original:
        sauvegarde.mkdir(exist_ok=True)
        shutil.copy2(page, sauvegarde / page.name)
        page.write_text(texte, encoding="utf-8")
        traitees.append(page.name)

print("\n✅ Pages migrées :", ", ".join(traitees) or "aucune")
print("🎨 Nom changé mais thème NON appliqué (pas de barre latérale) :", ", ".join(sans_theme) or "aucune")
print("⏭️  Pages ignorées (déjà faites) :", ", ".join(ignorees) or "aucune")

# Rapport : restes à vérifier à la main
print("\n🔎 À vérifier manuellement :")
trouve = False
for page in sorted(dossier.glob("*.html")):
    for numero, ligne in enumerate(page.read_text(encoding="utf-8").splitlines(), 1):
        if re.search(r'kore', ligne, re.IGNORECASE):
            trouve = True
            print(f"  {page.name}:{numero}  {ligne.strip()[:110]}")
if not trouve:
    print("  rien : plus aucune trace de « Kore »")
print("\nSauvegardes dans :", sauvegarde)