const GRIST_DOC_ID = 'sH5fAFqm9fRs';
const GRIST_BASE = 'https://grist.numerique.gouv.fr/api';

module.exports = async function() {
  const apiKey = process.env.GRIST_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  GRIST_API_KEY non définie — aucun avis chargé');
    return [];
  }

  console.log('💬 Chargement des avis depuis Grist...');

  const url = `${GRIST_BASE}/docs/${GRIST_DOC_ID}/tables/avis/records?limit=5000&sort=-id`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    // Table pas encore créée ou autre erreur → ne pas bloquer le build
    console.warn(`⚠️  Impossible de charger les avis (${response.status}) — table "avis" créée dans Grist ?`);
    return [];
  }

  const data = await response.json();

  const avis = (data.records || [])
    .map(r => ({
      id: r.id,
      date: r.fields.date || '',
      nom: r.fields.nom || 'Anonyme',
      note: parseInt(r.fields.note) || 0,
      commentaire: r.fields.commentaire || '',
      livre_id: String(r.fields.livre_id || '')
    }))
    .filter(a => a.livre_id && a.commentaire)
    // Tri par date décroissante si disponible, sinon par ID (plus récent en premier)
    .sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id - a.id;
    });

  console.log(`✅ ${avis.length} avis chargés depuis Grist`);
  return avis;
};
