# Bibliothèque ASCEE

Catalogue en ligne de la bibliothèque ASCEE. Site statique généré avec [Eleventy (11ty)](https://www.11ty.dev/) et hébergé sur GitHub Pages.

## Mettre à jour le catalogue

Aucune installation requise. Tout se fait depuis un navigateur.

### 1. Mettre à jour les livres

1. Modifier les données dans **Grist**
2. Exporter le CSV et le déposer dans le dossier partagé mDrive :
   `https://bnum.din.gouv.fr/mdrive/index.php/s/LL4kWAiiWsdmGgP`
3. Le fichier doit s'appeler **`livres.csv`** et être à la racine du dossier partagé

### 2. Ajouter des couvertures

1. Préparer les images au format **`.webp`**
2. Nommer chaque fichier avec l'**ID du livre** (ex : `7425.webp`)
3. Les déposer dans le sous-dossier **`couvertures/`** du mDrive

### 3. Lancer la mise à jour du site

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
3. Télécharge les couvertures depuis le dossier `couvertures/` du mDrive
4. Génère le site avec 11ty (pages livres, auteurs, catégories, index de recherche)
5. Déploie sur GitHub Pages

## Structure du projet

```
├── livres.csv                  # Données source (téléchargé depuis mDrive)
├── scripts/
│   ├── import-csv-final.js     # Conversion CSV → JSON
│   └── download-fast.js        # Téléchargement couvertures (usage local)
├── src/
│   ├── _data/
│   │   └── livres.json         # Données générées (ne pas modifier à la main)
│   ├── _includes/layouts/
│   │   └── base.njk            # Template principal
│   ├── css/style.css           # Styles
│   ├── images/covers/          # Couvertures au format webp (par ID)
│   ├── index.njk               # Page d'accueil avec recherche
│   ├── catalogue.njk           # Catalogue paginé
│   ├── livres.njk              # Pages individuelles des livres
│   ├── recherche.njk           # Page de recherche
│   ├── search.njk              # Index de recherche (JSON)
│   ├── auteurs.njk             # Liste des auteurs
│   ├── auteur.njk              # Pages par auteur
│   ├── categories.njk          # Liste des catégories
│   └── categorie.njk           # Pages par catégorie
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
