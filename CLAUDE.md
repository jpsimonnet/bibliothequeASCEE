# CLAUDE.md — Bibliothèque ASCEE

Référence technique pour Claude Code. À lire avant toute intervention sur le projet.

## Vue d'ensemble

Site statique 11ty (Eleventy) — catalogue de la bibliothèque ASCEE.
- **~7 400 livres physiques** issus de Grist (API, build-time)
- **~2 800 ebooks** issus de Calibre (base SQLite locale)
- **Hébergement** : GitHub Pages, path prefix `/bibliothequeASCEE/`
- **Couvertures livres** : fichiers `.webp` dans `src/images/covers/{id}.webp`
- **Ebooks (fichiers + couvertures)** : Cloudflare R2 `https://pub-ad35d75f972549028d32a8686e002705.r2.dev`

## Commandes

```bash
npm start        # Dev local (extrait ebooks + serveur 11ty sur :8080)
npm run build    # Build production avec pathprefix
npm run clean    # Supprime _site/

# Diagnostic Grist (affiche les colonnes réelles des tables)
GRIST_API_KEY=... node scripts/test-grist.js
```

## Architecture des données

### Livres physiques — source Grist (build-time)

`src/_data/livres.js` appelle l'API Grist à chaque build :
- DocId : `sH5fAFqm9fRs`
- Table : `LIVRES`
- Clé API : variable d'environnement `GRIST_API_KEY` (secret GitHub Actions)
- Fallback local : `src/_data/livres-static.json` (si GRIST_API_KEY absent)

Colonnes Grist mappées (noms réels vérifiés) :
| Champ interne | Colonne Grist |
|---|---|
| `nom` | `Titre` |
| `auteur` | `Nom_auteur_complet` |
| `resume` | `Resume` |
| `type` | `Type` |
| `isbn` | `ISBN` |
| `annee` | `Annee` |
| `pages` | `Pages` |
| `langues` | `Langues` |
| `couverture_url` | `Couverture_bnum` |
| `nouveaute` | `Nouveautee` (booléen) |
| `etagere` | `Etagere` (auto-détectée : `Etagere`/`Etagère`/`Emplacement`) |

### Avis lecteurs — source Grist (build-time)

`src/_data/avis.js` :
- Même document Grist, table `avis` (l'ID exact est auto-détecté, insensible à la casse)
- Colonnes : `date` (DateTime → timestamp Unix), `nom`, `note` (choix unique étoiles ★), `commentaire`, `livre_id`
- La note "★★★" est convertie en entier (compte les ★)
- Tri par ID décroissant (plus récent en premier)
- Retourne `[]` sans bloquer le build si la table est vide ou introuvable

### Ebooks — source Calibre (build-time)

`scripts/extract-ebooks.js` lit `metadata.db` (SQLite) → `src/_data/ebooks.json`
Exécuté automatiquement avant chaque build (voir `package.json`).

## Formulaire d'avis

URL configurée dans `src/_data/config.json` → clé `gristFormAvisUrl`.
L'iframe est intégrée avec `?livre_id={{ livre.id }}` pour pré-remplir le champ caché.

## Filtres 11ty custom (dans `.eleventy.js`)

| Filtre | Usage |
|---|---|
| `avisPourLivre(livreId)` | Retourne les avis d'un livre depuis le tableau global `avis` |
| `etoiles(n)` | Convertit un entier 0-5 en `★★★☆☆` |
| `noteAverage(avisList)` | Moyenne des notes (retourne 0 si liste vide) |
| `auteurFormat` | Affiche "Auteur inconnu" si vide |
| `truncate(n)` | Coupe un texte à n caractères |
| `limit(n)` | Première n entrées d'un tableau |
| `slugify` | Slugifie en gérant les accents français |
| `ebookCover(ebook)` | URL couverture R2 |
| `ebookDownload(ebook)` | URL téléchargement R2 |
| `etagerePlan(etagere)` | Préfixe du rayonnage : `LF1-1` → `LF1` (nom du fichier plan) |

## Pages

| URL | Template | Description |
|---|---|---|
| `/` | `index.njk` | Accueil : recherche globale, nouveautés (10), derniers avis (6), sélection auteurs epub |
| `/catalogue/` | `catalogue.njk` | Catalogue paginé livres physiques |
| `/livre/{id}/` | `livres.njk` | Fiche livre : infos, avis, formulaire |
| `/avis/` | `avis.njk` | Tous les livres avec avis, tri date/note JS côté client |
| `/auteurs/` | `auteurs.njk` | Liste des auteurs livres physiques |
| `/auteur/{slug}/` | `auteur.njk` | Page par auteur |
| `/categories/` | `categories.njk` | Liste des catégories |
| `/categorie/{slug}/` | `categorie.njk` | Page par catégorie |
| `/epub/` | `epub/index.njk` | Catalogue ebooks paginé |
| `/epub/livre/{id}/` | `epub/livre.njk` | Fiche ebook |
| `/reservation/` | `reservation.njk` | Formulaire Grist iframe |
| `/suggestions/` | `suggestions.njk` | Formulaire Grist iframe |
| `/search.json` | `search.njk` | Index de recherche statique (JSON) |

## Collections 11ty

Les collections `categoriesUniques` et `auteursUniques` sont construites depuis les pages tagguées `livre` (via `collectionApi.getFilteredByTag`) — **ne pas** utiliser `require('./livres.json')` qui n'existe plus.

## Workflow GitHub Actions (`.github/workflows/deploy.yml`)

Déclencheurs : push sur `main`, `workflow_dispatch`, cron `0 3 * * *`

Étapes du build :
1. Extraction ebooks depuis Calibre
2. Téléchargement couvertures (`.webp`) et plans de rayonnage (`.png`) depuis mDrive (Nextcloud)
3. Commit des nouvelles couvertures
4. Build 11ty (avec `GRIST_API_KEY` → fetch Grist pour livres + avis)
5. Déploiement GitHub Pages

Variable requise : secret GitHub `GRIST_API_KEY` (clé API personnelle Grist).

## Points d'attention

- **`livres.json` a été supprimé** — remplacé par `livres.js`. Le fallback est `livres-static.json`.
- **Ne jamais recréer `livres.json`** dans `src/_data/` : conflit de noms avec `livres.js`.
- **RAM** : le build nécessite `--max-old-space-size=8192` (7 000+ pages générées).
- **La clé API Grist** ne doit jamais apparaître dans le code — uniquement dans les secrets GitHub Actions ou en variable d'environnement locale.
- **Plans de rayonnage** : `src/images/covers/{PREFIXE}.png` (ex. `LF1.png`), importés depuis mDrive par le workflow au même titre que les couvertures. Affichés sur la fiche livre au-dessus des avis ; masqués en JS (`onerror`) si le fichier n'existe pas.
- **Les couvertures ebooks** viennent de R2, pas du repo git (pas de `src/images/covers/` pour les ebooks).
- **Tri des avis** sur `/avis/` : fait côté client en JavaScript (tri statique par date à la génération).
