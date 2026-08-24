# Bibliothèque ASCEE — Mode d'emploi

Catalogue en ligne de la bibliothèque ASCEE : **~7 400 livres physiques** et **~2 800 ebooks (EPUB)**. Site statique généré avec [Eleventy (11ty)](https://www.11ty.dev/) et hébergé sur GitHub Pages.

🌐 **URL du site** : [https://ascee.github.io/bibliothequeASCEE/](https://ascee.github.io/bibliothequeASCEE/)

---

## Sommaire

1. [Mettre à jour les livres physiques](#1-mettre-à-jour-les-livres-physiques)
2. [Ajouter ou modifier des couvertures](#2-ajouter-ou-modifier-des-couvertures)
3. [Gérer les avis des lecteurs](#3-gérer-les-avis-des-lecteurs)
4. [Mettre à jour les ebooks](#4-mettre-à-jour-les-ebooks)
5. [Déclencher une mise à jour du site](#5-déclencher-une-mise-à-jour-du-site)
6. [Développement local](#6-développement-local)
7. [Architecture technique](#7-architecture-technique)

---

## 1. Mettre à jour les livres physiques

Les données des livres sont **lues directement depuis Grist** à chaque build du site. Il n'y a rien à exporter ni à télécharger.

### Comment faire

1. Ouvrir le document Grist → table **`LIVRES`**
2. Ajouter, modifier ou supprimer des lignes directement
3. Le site se mettra à jour automatiquement la nuit suivante (3h), ou immédiatement via le [bouton manuel](#5-déclencher-une-mise-à-jour-du-site)

### Champs disponibles dans Grist

| Colonne Grist | Description | Remarque |
|---|---|---|
| `Titre` | Titre du livre | Obligatoire |
| `Nom_auteur_complet` | Auteur(s) | Affiché "Auteur inconnu" si vide |
| `Resume` | Résumé / description | Texte libre |
| `Type` | Référence vers la table `TYPOLOGIE` | Catégorie du livre |
| `ISBN` | Code ISBN | Optionnel |
| `Annee` | Année de publication | Optionnel |
| `Pages` | Nombre de pages | Optionnel |
| `Langues` | Langue(s) du livre | Optionnel |
| `Couverture_bnum` | URL de la couverture | Rempli automatiquement si l'image est déposée sur mDrive |
| `Nouveautee` | Booléen — affiche le livre dans la section "Nouveautés" | Cocher pour mettre en avant |

### Règle de filtrage

Les livres dont la **typologie est "En cours de classement"** sont automatiquement exclus du site — ils n'apparaissent ni dans le catalogue, ni dans la recherche.

---

## 2. Ajouter ou modifier des couvertures

Les couvertures des livres physiques sont des images au format **`.webp`**, nommées par l'**ID du livre** dans Grist (ex : `7425.webp`).

### Comment déposer une couverture

1. Préparer l'image au format **`.webp`** (outil de conversion en ligne : [Squoosh](https://squoosh.app/))
2. Nommer le fichier avec l'**ID numérique du livre** tel qu'il apparaît dans Grist
3. Déposer le fichier dans le sous-dossier **`couvertures/`** du mDrive :
   👉 [https://bnum.din.gouv.fr/mdrive/index.php/s/LL4kWAiiWsdmGgP](https://bnum.din.gouv.fr/mdrive/index.php/s/LL4kWAiiWsdmGgP)

Le workflow de build récupère automatiquement les nouveaux fichiers à chaque déploiement et les intègre au site.

### Remarques

- Si aucune couverture n'est disponible, le site affiche une image de remplacement générique
- Les couvertures des **ebooks** ne passent pas par mDrive — elles sont hébergées sur Cloudflare R2 et extraites directement depuis Calibre

---

## 3. Gérer les avis des lecteurs

### Saisie d'un avis

Chaque fiche livre du site contient un **formulaire intégré** (iframe Grist). Les visiteurs peuvent y saisir :
- Leur prénom (optionnel, "Anonyme" par défaut)
- Une note de 1 à 5 étoiles
- Un commentaire libre

Les avis sont stockés dans la table **`avis`** du document Grist et apparaissent sur le site au prochain build.

### Modérer un avis

1. Ouvrir le document Grist → table **`avis`**
2. Trouver la ligne correspondante
3. La modifier ou la supprimer directement

La suppression est prise en compte au prochain build.

### Structure de la table `avis` dans Grist

| Colonne | Type | Description |
|---|---|---|
| `date` | DateTime | Date de saisie (remplie automatiquement) |
| `nom` | Texte | Prénom du lecteur |
| `note` | Choix unique | ★ à ★★★★★ |
| `commentaire` | Texte | Contenu de l'avis |
| `livre_id` | Entier | ID du livre (pré-rempli par l'URL de la fiche) |

---

## 4. Mettre à jour les ebooks

Les ebooks sont gérés via **Calibre** (logiciel de gestion de bibliothèque numérique). Les fichiers EPUB et leurs couvertures sont hébergés sur **Cloudflare R2**.

### Workflow pour ajouter des ebooks

1. Ajouter les livres dans Calibre (sur le poste qui héberge la bibliothèque)
2. Synchroniser les fichiers vers R2 avec rclone :

```bash
rclone sync '/Volumes/4TO/ASCEE/Livres Libres de droits' ascee:bibliotheque-ascee --progress
```

3. Copier le fichier `metadata.db` de Calibre à la racine du dépôt GitHub
4. Pousser sur `main` — le build extrait automatiquement les métadonnées et régénère le catalogue ebooks

### Infos Cloudflare R2

| Paramètre | Valeur |
|---|---|
| Bucket | `bibliotheque-ascee` |
| URL publique | `https://pub-ad35d75f972549028d32a8686e002705.r2.dev` |

---

## 5. Déclencher une mise à jour du site

Le site se reconstruit automatiquement dans trois cas :

| Déclencheur | Quand |
|---|---|
| **Automatique (cron)** | Chaque nuit à 3h00 |
| **Push sur `main`** | Dès qu'un fichier du dépôt est modifié et poussé |
| **Bouton manuel** | Onglet **Actions** sur GitHub → workflow "Deploy to GitHub Pages" → bouton **Run workflow** |

Pour une mise à jour immédiate après une modification dans Grist (livres, avis), utiliser le **bouton manuel**.

### Ce qui se passe lors d'un build

1. Extraction des métadonnées ebooks depuis `metadata.db` (Calibre)
2. Téléchargement des nouvelles couvertures depuis le dossier `couvertures/` du mDrive
3. Commit des nouvelles couvertures dans le dépôt
4. Appel à l'API Grist → récupération des livres physiques et des avis
5. Génération du site avec 11ty (7 000+ pages : livres, ebooks, auteurs, catégories, avis, index de recherche)
6. Déploiement sur GitHub Pages

---

## 6. Développement local

Pour travailler sur le site en local (modifications de templates, CSS, filtres…).

### Prérequis

- Node.js 20+
- Clé API Grist (demander à l'administrateur du document)

### Installation

```bash
git clone https://github.com/ascee/bibliothequeASCEE.git
cd bibliothequeASCEE
npm install
```

### Lancer le serveur de développement

```bash
GRIST_API_KEY=votre_cle npm start
# Serveur disponible sur http://localhost:8080
```

Sans `GRIST_API_KEY`, le build utilise le fichier de secours `src/_data/livres-static.json` (données figées) et ne charge pas les avis.

### Build de production

```bash
GRIST_API_KEY=votre_cle npm run build
# Génère le site dans _site/ avec le préfixe /bibliothequeASCEE/
```

### Commandes disponibles

| Commande | Description |
|---|---|
| `npm start` | Serveur de dev avec rechargement automatique (port 8080) |
| `npm run build` | Build de production (avec pathprefix GitHub Pages) |
| `npm run clean` | Supprime le dossier `_site/` |
| `npm run extract-ebooks` | Régénère `src/_data/ebooks.json` depuis `metadata.db` |
| `GRIST_API_KEY=... node scripts/test-grist.js` | Affiche les colonnes réelles des tables Grist (diagnostic) |

---

## 7. Architecture technique

### Sources de données

| Source | Données | Moment de lecture |
|---|---|---|
| **Grist** (API REST) | Livres physiques, typologies, avis lecteurs | À chaque build |
| **Calibre** (`metadata.db`) | Métadonnées ebooks | À chaque build |
| **mDrive (Nextcloud)** | Couvertures livres physiques (`.webp`) | À chaque build |
| **Cloudflare R2** | Fichiers EPUB + couvertures ebooks | En ligne (servis directement) |

### Configuration Grist

| Paramètre | Valeur |
|---|---|
| Document | `sH5fAFqm9fRs` |
| Table livres | `LIVRES` |
| Table typologies | `TYPOLOGIE` |
| Table avis | `avis` |
| Secret GitHub Actions | `GRIST_API_KEY` |

### Pages du site

| URL | Description |
|---|---|
| `/` | Accueil : recherche, nouveautés, derniers avis, sélection ebooks |
| `/catalogue/` | Catalogue livres physiques (paginé) |
| `/livre/{id}/` | Fiche livre : infos, avis, formulaire |
| `/auteurs/` | Liste des auteurs |
| `/auteur/{slug}/` | Page par auteur |
| `/categories/` | Liste des catégories |
| `/categorie/{slug}/` | Livres par catégorie |
| `/avis/` | Tous les avis (tri date/note côté client) |
| `/epub/` | Catalogue ebooks (paginé) |
| `/epub/livre/{id}/` | Fiche ebook |
| `/reservation/` | Formulaire de réservation |
| `/suggestions/` | Formulaire de suggestions d'achat |
| `/search.json` | Index de recherche (JSON statique) |

### Structure des fichiers clés

```
├── metadata.db                   # Base Calibre (ebooks) — à mettre à jour manuellement
├── src/
│   ├── _data/
│   │   ├── livres.js             # Fetch API Grist → livres physiques
│   │   ├── livres-static.json    # Fallback local (build sans clé API)
│   │   ├── avis.js               # Fetch API Grist → avis lecteurs
│   │   ├── ebooks.json           # Généré automatiquement par extract-ebooks.js
│   │   └── config.json           # URL du formulaire Grist (avis)
│   ├── images/covers/            # Couvertures livres physiques (.webp, par ID)
│   └── (templates .njk)          # Pages et mises en page Nunjucks
├── scripts/
│   ├── extract-ebooks.js         # Lit metadata.db → génère ebooks.json
│   ├── test-grist.js             # Diagnostic colonnes Grist
│   └── download-fast.js          # Téléchargement couvertures (usage local)
├── .eleventy.js                  # Configuration 11ty (filtres, collections, pagination)
├── .github/workflows/deploy.yml  # Pipeline CI/CD complet
└── package.json
```

### Notes techniques

- Le build nécessite jusqu'à **8 Go de RAM** Node.js en raison du volume de données (7 000+ pages générées simultanément)
- La clé API Grist ne doit **jamais** apparaître dans le code — uniquement dans les secrets GitHub Actions ou en variable d'environnement locale
- Ne pas recréer de fichier `livres.json` dans `src/_data/` — il entrerait en conflit avec `livres.js`
