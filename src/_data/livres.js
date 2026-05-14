const path = require('path');
const fs = require('fs');

const GRIST_DOC_ID = 'sH5fAFqm9fRs';
const GRIST_BASE = 'https://grist.numerique.gouv.fr/api';

// Essaie plusieurs noms de colonnes possibles (les IDs Grist varient selon les accents/espaces)
function col(fields, ...keys) {
  for (const k of keys) {
    if (fields[k] !== undefined && fields[k] !== null && fields[k] !== '') return fields[k];
  }
  return '';
}

module.exports = async function() {
  const apiKey = process.env.GRIST_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  GRIST_API_KEY non définie — chargement du fichier statique livres-static.json');
    const staticPath = path.join(__dirname, 'livres-static.json');
    return JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
  }

  console.log('📚 Chargement des livres depuis Grist...');

  const url = `${GRIST_BASE}/docs/${GRIST_DOC_ID}/tables/LIVRES/records?limit=10000&sort=id`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erreur API Grist (livres): ${response.status} — ${text}`);
  }

  const data = await response.json();

  if (!data.records || data.records.length === 0) {
    throw new Error('Aucun livre retourné par Grist — vérifier le nom de la table (LIVRE) et les droits API');
  }

  // Affiche les colonnes disponibles pour diagnostic (visible dans les logs du build)
  const colonnes = Object.keys(data.records[0].fields);
  console.log(`🔍 Colonnes Grist disponibles: ${colonnes.join(', ')}`);

  const livres = data.records.map(r => ({
    id: String(r.id),
    nom:          col(r.fields, 'Titre', 'titre', 'Nom', 'nom'),
    auteur:       col(r.fields, 'Nom_auteur_complet', 'Nom auteur complet', 'Auteur', 'auteur'),
    resume:      (col(r.fields, 'R_sum_', 'Résumé', 'Resume', 'resume', 'Résumé') || '').replace(/\s+/g, ' ').trim(),
    type:         col(r.fields, 'Type', 'type'),
    isbn:         col(r.fields, 'ISBN', 'isbn'),
    annee:        col(r.fields, 'Annee', 'annee', 'Année') || '0',
    pages:        col(r.fields, 'Pages', 'pages'),
    langues:      col(r.fields, 'Langues', 'langues'),
    couverture_url: col(r.fields, 'Couverture_bnum', 'Couverture-bnum', 'couverture_url'),
    nouveaute:    String(col(r.fields, 'Nouveaut_e', 'Nouveautée', 'Nouveaute', 'nouveaute') || 'false')
  })).filter(book => book.id && book.nom);

  console.log(`✅ ${livres.length} livres chargés depuis Grist`);
  return livres;
};
