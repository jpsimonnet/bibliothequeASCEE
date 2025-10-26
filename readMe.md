# ✅ Checklist complète des fichiers à créer

# Principales Commandes

# Tout en une fois
```
cd ~/Sites\ web/bibliothequeASCEE
node scripts/import-csv-final.js livres.csv
node scripts/download-from-json.js  # Si nouvelles images
npm start  # Tester
```

## 📁 Structure complète du projet

```
votre-repo/
│
├── 📄 package.json                      ✅ Dépendances npm
├── 📄 .eleventy.js                      ✅ Configuration 11ty
├── 📄 .gitignore                        ✅ Fichiers à ignorer
├── 📄 README.md                         ✅ Documentation principale
├── 📄 GUIDE_DEMARRAGE.md               ✅ Guide pas à pas
├── 📄 COMMANDES.md                      ✅ Aide-mémoire commandes
├── 📄 CHECKLIST_FICHIERS.md            ✅ Ce fichier
│
├── 📂 .github/
│   └── 📂 workflows/
│       └── 📄 deploy.yml                ✅ Workflow GitHub Actions
│
├── 📂 scripts/
│   ├── 📄 import-grist.js               ✅ Convertir CSV → JSON
│   └── 📄 download-covers.js            ✅ Télécharger images
│
└── 📂 src/
    ├── 📂 _data/
    │   └── 📄 livres.json               ⚠️  À GENERER (via script)
    │
    ├── 📂 _includes/
    │   └── 📂 layouts/
    │       └── 📄 base.njk              ✅ Layout de base
    │
    ├── 📂 css/
    │   └── 📄 style.css                 ✅ Styles CSS
    │
    ├── 📂 js/                           📁 (vide pour l'instant)
    │
    ├── 📂 images/
    │   └── 📂 covers/
    │       ├── 📄 1.webp                ⚠️  À TELECHARGER (7240 fichiers)
    │       ├── 📄 2.webp
    │       └── 📄 ...
    │
    ├── 📄 index.njk                     ✅ Page d'accueil
    ├── 📄 catalogue.njk                 ✅ Catalogue paginé
    ├── 📄 livres.njk                    ✅ Template pages livres
    ├── 📄 auteurs.njk                   ✅ Liste auteurs
    ├── 📄 auteur.njk                    ✅ Pages auteurs
    ├── 📄 recherche.njk                 ✅ Recherche globale
    └── 📄 search.njk                    ✅ API JSON recherche
```

## 🎯 Étapes de création

### Phase 1 : Configuration de base

- [ ] Créer le dossier projet
- [ ] Créer `package.json`
- [ ] Créer `.eleventy.js`
- [ ] Créer `.gitignore`
- [ ] Créer la structure de dossiers :
  ```bash
  mkdir -p src/{_data,_includes/layouts,css,js,images/covers}
  mkdir -p scripts
  mkdir -p .github/workflows
  ```

### Phase 2 : Scripts et workflows

- [ ] Créer `scripts/import-grist.js`
- [ ] Créer `scripts/download-covers.js`
- [ ] Créer `.github/workflows/deploy.yml`

### Phase 3 : Layouts et styles

- [ ] Créer `src/_includes/layouts/base.njk`
- [ ] Créer `src/css/style.css`

### Phase 4 : Pages principales

- [ ] Créer `src/index.njk`
- [ ] Créer `src/catalogue.njk`
- [ ] Créer `src/livres.njk`
- [ ] Créer `src/auteurs.njk`
- [ ] Créer `src/auteur.njk`
- [ ] Créer `src/recherche.njk`
- [ ] Créer `src/search.njk`

### Phase 5 : Documentation

- [ ] Créer `README.md`
- [ ] Créer `GUIDE_DEMARRAGE.md`
- [ ] Créer `COMMANDES.md`

### Phase 6 : Données

- [ ] Exporter CSV depuis Grist
- [ ] Exécuter `node scripts/import-grist.js livres.csv`
- [ ] Vérifier `src/_data/livres.json` créé
- [ ] Exécuter `node scripts/download-covers.js livres.csv`
- [ ] Vérifier les 7240 images dans `src/images/covers/`

### Phase 7 : Test local

- [ ] Exécuter `npm install`
- [ ] Exécuter `npm start`
- [ ] Tester http://localhost:8080
- [ ] Vérifier toutes les pages
- [ ] Tester la recherche
- [ ] Tester les filtres

### Phase 8 : Déploiement

- [ ] Initialiser Git : `git init`
- [ ] Créer repo GitHub
- [ ] Premier commit : `git add . && git commit -m "Initial commit"`
- [ ] Pousser : `git push -u origin main`
- [ ] Activer GitHub Pages (Settings → Pages → GitHub Actions)
- [ ] Attendre le build (5-10 min)
- [ ] Vérifier le site en ligne

## 📝 Contenu de chaque fichier

### 1. package.json

```json
{
  "name": "bibliotheque-11ty",
  "version": "1.0.0",
  "scripts": {
    "start": "eleventy --serve",
    "build": "eleventy",
    "clean": "rm -rf _site"
  },
  "devDependencies": {
    "@11ty/eleventy": "^2.0.1"
  }
}
```

### 2. .gitignore

```
node_modules/
_site/
.eleventy-cache/
.DS_Store
```

### 3-11. Les autres fichiers

✅ Tous les fichiers ont été fournis dans les artifacts précédents !

## 🔧 Installation rapide (copier-coller)

```bash
# Créer la structure
mkdir -p mon-projet/{src/{_data,_includes/layouts,css,images/covers},scripts,.github/workflows}
cd mon-projet

# Créer package.json
cat > package.json << 'EOF'
{
  "name": "bibliotheque-11ty",
  "version": "1.0.0",
  "scripts": {
    "start": "eleventy --serve",
    "build": "eleventy",
    "clean": "rm -rf _site"
  },
  "devDependencies": {
    "@11ty/eleventy": "^2.0.1"
  }
}
EOF

# Installer
npm install

# Copier tous les autres fichiers depuis les artifacts Claude
# ...puis...

# Tester
npm start
```

## ⚡ Commandes de vérification

```bash
# Vérifier la structure
tree -L 3 -I 'node_modules|_site'

# Compter les fichiers
find src -type f | wc -l

# Vérifier que tous les fichiers requis existent
for file in package.json .eleventy.js .gitignore README.md; do
  [[ -f "$file" ]] && echo "✅ $file" || echo "❌ $file manquant"
done

# Vérifier les dossiers
for dir in src/_{data,includes} src/{css,images/covers} scripts .github/workflows; do
  [[ -d "$dir" ]] && echo "✅ $dir/" || echo "❌ $dir/ manquant"
done
```

## 📊 Statistiques finales attendues

Après tout avoir créé et build :

```
📁 Fichiers source :       ~15 fichiers
📁 Images :                7240 fichiers webp (182 Mo)
📁 Pages générées :        ~7400 pages HTML
📦 Taille _site/ :         ~200-250 Mo
⏱️  Temps de build :       3-5 minutes
🚀 Temps de déploiement :  6-8 minutes
```

## 🎉 Projet terminé quand...

- ✅ Tous les fichiers créés
- ✅ `npm start` fonctionne
- ✅ 7240 livres dans le JSON
- ✅ 7240 images téléchargées
- ✅ Build réussit sans erreur
- ✅ Site visible en local
- ✅ Site déployé sur GitHub Pages
- ✅ Recherche fonctionne
- ✅ Filtres fonctionnent
- ✅ Pages auteurs générées

## 💡 Aide-mémoire

**Problème ?** → Vérifier dans l'ordre :

1. ✅ Tous les fichiers existent ?
2. ✅ `npm install` exécuté ?
3. ✅ Données converties (`livres.json` existe) ?
4. ✅ Images téléchargées ?
5. ✅ Pas d'erreur dans la console ?

**Besoin d'aide ?** → Consulter :
- `README.md` : vue d'ensemble
- `GUIDE_DEMARRAGE.md` : guide détaillé
- `COMMANDES.md` : toutes les commandes