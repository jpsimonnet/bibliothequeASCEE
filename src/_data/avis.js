const GRIST_DOC_ID = 'sH5fAFqm9fRs';
const GRIST_BASE = 'https://grist.numerique.gouv.fr/api';

// Trouve le vrai ID de la table avis (Grist est sensible à la casse)
async function trouverTableAvis(apiKey) {
  const res = await fetch(`${GRIST_BASE}/docs/${GRIST_DOC_ID}/tables`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!res.ok) return 'avis';
  const data = await res.json();
  const table = (data.tables || []).find(t => t.id.toLowerCase() === 'avis');
  return table ? table.id : 'avis';
}

// Convertit un timestamp Grist (Unix secondes ou string) en date lisible
function formatDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    return new Date(val * 1000).toLocaleDateString('fr-FR');
  }
  // string "2026-05-14 12:03pm" → on garde juste la date
  return String(val).split(' ')[0];
}

module.exports = async function() {
  const apiKey = process.env.GRIST_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  GRIST_API_KEY non définie — aucun avis chargé');
    return [];
  }

  console.log('💬 Chargement des avis depuis Grist...');

  const tableId = await trouverTableAvis(apiKey);
  console.log(`🔍 Table avis détectée : "${tableId}"`);

  const url = `${GRIST_BASE}/docs/${GRIST_DOC_ID}/tables/${tableId}/records?limit=5000&sort=-id`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    console.warn(`⚠️  Impossible de charger les avis (${response.status})`);
    return [];
  }

  const data = await response.json();

  const avis = (data.records || [])
    .map(r => ({
      id: r.id,
      date: formatDate(r.fields.date),
      nom: r.fields.nom || 'Anonyme',
      // La note est un choix unique avec étoiles (★★★) → on compte les étoiles
      note: [...(r.fields.note || '')].filter(c => c === '★' || c === '⭐' || c === '🌟').length
            || (r.fields.note || '').trim().length,
      commentaire: r.fields.commentaire || '',
      livre_id: String(r.fields.livre_id || '')
    }))
    .filter(a => a.livre_id && a.commentaire)
    .sort((a, b) => b.id - a.id);

  console.log(`✅ ${avis.length} avis chargés depuis Grist`);
  return avis;
};
