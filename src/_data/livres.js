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

  // Charge la table TYPOLOGIE pour résoudre la colonne de référence Type
  // Colonne libellé confirmée : Genre_complet (ex: "Littérature française")
  let typeMap = {};
  try {
    const typRes = await fetch(`${GRIST_BASE}/docs/${GRIST_DOC_ID}/tables/TYPOLOGIE/records?limit=1000`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (typRes.ok) {
      const typData = await typRes.json();
      for (const r of (typData.records || [])) {
        typeMap[r.id] = r.fields.Genre_complet || r.fields.abr || '';
      }
      console.log(`✅ Table TYPOLOGIE chargée : ${Object.keys(typeMap).length} types (ex: ${Object.values(typeMap)[0] || '?'})`);
    } else {
      console.warn(`⚠️  Table TYPOLOGIE inaccessible (${typRes.status})`);
    }
  } catch (e) {
    console.warn('⚠️  Impossible de charger la table TYPOLOGIE:', e.message);
  }

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

  // Identifie la colonne nouveauté (booléen Grist)
  const colNouveaute = colonnes.find(c => c.toLowerCase().replace(/[^a-z]/g, '').includes('nouveaut'));
  console.log(`🔍 Colonne nouveauté détectée: "${colNouveaute || 'non trouvée'}"`);

  const livres = data.records.map(r => ({
    id: String(r.id),
    nom:           r.fields.Titre || '',
    auteur:        r.fields.Nom_auteur_complet || '',
    resume:       (r.fields.Resume || '').replace(/\s+/g, ' ').trim(),
    type:          (typeof r.fields.Type === 'number' ? typeMap[r.fields.Type] : r.fields.Type) || '',
    isbn:          r.fields.ISBN || '',
    annee:         r.fields.Annee || '0',
    pages:         r.fields.Pages || '',
    langues:       r.fields.Langues || '',
    couverture_url: r.fields.Couverture_bnum || '',
    nouveaute:    (colNouveaute && r.fields[colNouveaute] === true) ? 'true' : 'false'
  })).filter(book => book.id && book.nom);

  console.log(`✅ ${livres.length} livres chargés depuis Grist`);
  return livres;
};
