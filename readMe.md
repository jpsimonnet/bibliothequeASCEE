# Bibliothèque ASCEE

Catalogue en ligne de la bibliothèque ASCEE : livres physiques et ebooks (EPUB). Site statique généré avec [Eleventy (11ty)](https://www.11ty.dev/) et hébergé sur GitHub Pages.

## Mettre à jour le catalogue

Aucune installation requise. Tout se fait depuis un navigateur.

### 1. Mettre à jour les livres physiques

Les données livres sont **directement lues depuis Grist** à chaque build. Il suffit de modifier les données dans Grist — le site se met à jour automatiquement à 3h du matin, ou manuellement via le bouton GitHub Actions.

Plus besoin d'exporter un CSV.

### 2. Ajouter des couvertures de livres physiques

1. Préparer les images au format **`.webp`**
2. Nommer chaque fichier avec l'**ID du livre** (ex : `7425.webp`)
3. Les déposer dans le sous-dossier **`couvertures/`** du mDrive :
   `https://bnum.din.gouv.fr/mdrive/index.php/s/LL4kWAiiWsdmGgP`

### 3. Gérer les avis des lecteurs

Les avis sont saisis via le formulaire intégré sur chaque fiche livre. Ils sont stockés dans la table **`avis`** du document Grist et apparaissent sur le site au prochain build.

Pour modérer un avis : l'ouvrir directement dans Grist et supprimer ou modifier la ligne.

### 4. Mettre à jour les ebooks

Les ebooks sont gérés via **Calibre** (base `metadata.db`). Les fichiers EPUB et couvertures sont hébergés sur **Cloudflare R2** :

- Bucket : `bibliotheque-ascee`
- URL publique : `https://pub-ad35d75f972549028d32a8686e002705.r2.dev`

Pour synchroniser de nouveaux ebooks vers R2 :

```bash
rclone sync '/Volumes/4TO/ASCEE/Livres Libres de droits' ascee:bibliotheque-ascee --progress
```

### 5. Lancer la mise à jour du site

Le site se reconstruit automatiquement dans 3 cas :

| Déclencheur | Quand |
|---|---|
| **Automatique** | Chaque nuit à 3h |
| **Push sur main** | Quand un fichier du dépôt GitHub est modifié |
| **Bouton manuel** | Onglet "Actions" sur GitHub > "Deploy to GitHub Pages" > "Run workflow" |

Pour une mise à jour immédiate après avoir modifié des données dans Grist, utiliser le **bouton manuel** sur GitHub.

### Ce qui se passe en coulisses

Le workflow GitHub Actions effectue automatiquement :

1. Appel à l'API Grist → récupère les 7 000+ livres physiques et les avis
2. Extraction des métadonnées ebooks depuis la base Calibre (`scripts/extract-ebooks.js`)
3. Téléchargement des nouvelles couvertures depuis le dossier `couvertures/` du mDrive
4. Génération du site avec 11ty (pages livres, ebooks, auteurs, catégories, avis, index de recherche)
5. Déploiement sur GitHub Pages

## Structure du projet

```
├── CLAUDE.md                   # Documentation technique (pour Claude Code)
├── metadata.db                 # Base Calibre (ebooks)
├── scripts/
│   ├── extract-ebooks.js       # Extraction Calibre → JSON
│   ├── test-grist.js           # Diagnostic colonnes Grist (usage local)
│   └── download-fast.js        # Téléchargement couvertures (usage local)
├── src/
│   ├── _data/
│   │   ├── livres.js           # Livres physiques — fetch API Grist au build
│   │   ├── livres-static.json  # Fallback local (si pas de clé API)
│   │   ├── avis.js             # Avis lecteurs — fetch API Grist au build
│   │   ├── config.json         # Config site (URL formulaire Grist)
│   │   └── ebooks.json         # Données ebooks (généré par extract-ebooks.js)
│   ├── _includes/layouts/
│   │   └── base.njk            # Template principal
│   ├── css/style.css           # Styles
│   ├── images/covers/          # Couvertures livres physiques (.webp par ID)
│   ├── index.njk               # Accueil : recherche, nouveautés, avis, epub
│   ├── catalogue.njk           # Catalogue livres physiques paginé
│   ├── livres.njk              # Fiches livres : infos + avis + formulaire
│   ├── avis.njk                # Page tous les avis (tri date/note)
│   ├── search.njk              # Index de recherche (JSON)
│   ├── auteurs.njk             # Liste des auteurs
│   ├── auteur.njk              # Pages par auteur
│   ├── categories.njk          # Liste des catégories
│   ├── categorie.njk           # Pages par catégorie
│   ├── reservation.njk         # Formulaire de réservation (Grist iframe)
│   ├── suggestions.njk         # Formulaire de suggestion (Grist iframe)
│   └── epub/                   # Section ebooks
│       ├── index.njk
│       ├── livre.njk
│       ├── auteurs.njk / auteur.njk
│       └── categories.njk / categorie.njk
├── .github/workflows/
│   └── deploy.yml              # Pipeline CI/CD
├── .eleventy.js                # Configuration 11ty (filtres, collections)
└── package.json
```

## Configuration Grist

| Paramètre | Valeur |
|---|---|
| Document | `sH5fAFqm9fRs` |
| Table livres | `LIVRES` |
| Table avis | `avis` |
| Secret GitHub | `GRIST_API_KEY` |
| Formulaire avis | configuré dans `src/_data/config.json` |

Colonnes de la table `avis` :

| Colonne | Type | Description |
|---|---|---|
| `date` | DateTime | Date de saisie (automatique via formule Grist) |
| `nom` | Texte | Nom du lecteur (défaut : Anonyme) |
| `note` | Choix unique | Étoiles ★ à ★★★★★ |
| `commentaire` | Texte | Texte de l'avis |
| `livre_id` | Entier | ID du livre (pré-rempli par l'URL) |

## Développement local (optionnel)

```bash
npm install
GRIST_API_KEY=votre_cle npm start   # Serveur de dev sur http://localhost:8080
npm run build                        # Build de production
```

Sans `GRIST_API_KEY`, le build utilise `src/_data/livres-static.json` comme fallback et charge zéro avis.

Pour vérifier les colonnes Grist :
```bash
GRIST_API_KEY=votre_cle node scripts/test-grist.js
```

Note : le build nécessite ~8 Go de RAM Node.js en raison du volume de données (7 000+ pages générées).
