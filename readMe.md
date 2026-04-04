# Bibliothèque ASCEE

Catalogue en ligne de la bibliothèque ASCEE : livres physiques et ebooks (EPUB). Site statique généré avec [Eleventy (11ty)](https://www.11ty.dev/) et hébergé sur GitHub Pages.

## Mettre à jour le catalogue

Aucune installation requise. Tout se fait depuis un navigateur.

### 1. Mettre à jour les livres physiques

1. Modifier les données dans **Grist**
2. Exporter le CSV et le déposer dans le dossier partagé mDrive :
   `https://bnum.din.gouv.fr/mdrive/index.php/s/LL4kWAiiWsdmGgP`
3. Le fichier doit s'appeler **`livres.csv`** et être à la racine du dossier partagé

### 2. Ajouter des couvertures de livres physiques

1. Préparer les images au format **`.webp`**
2. Nommer chaque fichier avec l'**ID du livre** (ex : `7425.webp`)
3. Les déposer dans le sous-dossier **`couvertures/`** du mDrive

### 3. Mettre à jour les ebooks

Les ebooks sont gérés via **Calibre** (base `metadata.db`). Les fichiers EPUB et couvertures sont hébergés sur **Cloudflare R2** :

- Bucket : `bibliotheque-ascee`
- URL publique : `https://pub-ad35d75f972549028d32a8686e002705.r2.dev`

Pour synchroniser de nouveaux ebooks vers R2 :

```bash
rclone sync '/Volumes/4TO/ASCEE/Livres Libres de droits' ascee:bibliotheque-ascee --progress
```

### 4. Lancer la mise à jour du site

Le site se reconstruit automatiquement dans 3 cas :

| Déclencheur | Quand |
|---|---|
| **Automatique** | Chaque nuit à 3h |
| **Push sur main** | Quand un fichier du dépôt GitHub est modifié |
| **Bouton manuel** | Onglet "Actions" sur GitHub > "Deploy to GitHub Pages" > "Run workflow" |

Pour une mise à jour immédiate, utiliser le **bouton manuel** sur GitHub.

### Ce qui se passe en coulisses

Le workflow GitHub Actions effectue automatiquement :

1. Télécharge `livres.csv` depuis le mDrive
2. Convertit le CSV en JSON (`scripts/import-csv-final.js`)
3. Extrait les métadonnées ebooks depuis la base Calibre (`scripts/extract-ebooks.js`)
4. Télécharge les couvertures depuis le dossier `couvertures/` du mDrive
5. Génère le site avec 11ty (pages livres, ebooks, auteurs, catégories, index de recherche)
6. Déploie sur GitHub Pages

## Structure du projet

```
├── metadata.db                 # Base Calibre (ebooks)
├── livres.csv                  # Données livres physiques (téléchargé depuis mDrive)
├── scripts/
│   ├── import-csv-final.js     # Conversion CSV → JSON
│   ├── extract-ebooks.js       # Extraction Calibre → JSON
│   └── download-fast.js        # Téléchargement couvertures (usage local)
├── src/
│   ├── _data/
│   │   ├── livres.json         # Données livres physiques (généré)
│   │   └── ebooks.json         # Données ebooks (généré)
│   ├── _includes/layouts/
│   │   └── base.njk            # Template principal
│   ├── css/style.css           # Styles
│   ├── images/covers/          # Couvertures livres physiques (.webp par ID)
│   ├── index.njk               # Page d'accueil avec recherche
│   ├── catalogue.njk           # Catalogue livres physiques paginé
│   ├── livres.njk              # Pages individuelles des livres
│   ├── search.njk              # Index de recherche (JSON)
│   ├── auteurs.njk             # Liste des auteurs
│   ├── auteur.njk              # Pages par auteur
│   ├── categories.njk          # Liste des catégories
│   ├── categorie.njk           # Pages par catégorie
│   └── epub/
│       ├── index.njk           # Catalogue ebooks paginé
│       ├── livre.njk           # Pages individuelles ebooks
│       ├── categories.njk      # Catégories ebooks
│       ├── categorie.njk       # Pages par catégorie ebook
│       └── auteur.njk          # Pages par auteur ebook
├── .github/workflows/
│   └── deploy.yml              # Pipeline de déploiement automatique
├── .eleventy.js                # Configuration 11ty
└── package.json
```

## Format du CSV

Le fichier `livres.csv` exporté de Grist doit contenir ces colonnes :

| Colonne | Description |
|---|---|
| ID | Identifiant unique du livre |
| Type | Catégorie (ex : Littérature française) |
| Titre | Titre du livre |
| Résumé | Description du livre |
| ISBN | Numéro ISBN (optionnel) |
| Annee | Année de publication |
| Pages | Nombre de pages |
| Langues | Langue(s) |
| Nouveautée | `true` ou `false` |
| Nom auteur | Nom de famille |
| Prénom Auteur | Prénom |
| Particule - auteur | Particule (de, du, etc.) |
| Nom auteur complet | Nom complet affiché |

## Développement local (optionnel)

Pour travailler en local (non requis pour les mises à jour) :

```bash
npm install
npm start        # Serveur de dev sur http://localhost:8080
npm run build    # Build de production
```

Note : le build nécessite ~8 Go de RAM Node.js en raison du volume de données.
