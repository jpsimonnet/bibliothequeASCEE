const GRIST_DOC_ID = 'sH5fAFqm9fRs';
const GRIST_BASE = 'https://grist.numerique.gouv.fr/api';

const FALLBACK = `## 📅 Horaires de la bibliothèque

**La bibliothèque est ouverte :**

- Mardi de 12h30 à 14h
- Jeudi de 13h à 14h

## 📚 Prêts de livres

**Vous pouvez emprunter :**

- 5 livres
- pendant 4 semaines

## 📖 Télécharger des epubs libres de droits

Nous vous proposons une sélection d'epubs libres de droits en téléchargement gratuit. Redécouvrez des livres d'auteurs qui ont traversé le siècle.`;

module.exports = async function() {
  const apiKey = process.env.GRIST_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  GRIST_API_KEY non définie — texte d\'introduction par défaut');
    return FALLBACK;
  }

  try {
    const res = await fetch(`${GRIST_BASE}/docs/${GRIST_DOC_ID}/tables/Introduction/records?limit=1`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!res.ok) {
      console.warn(`⚠️  Table Introduction inaccessible (${res.status}) — texte par défaut`);
      return FALLBACK;
    }

    const data = await res.json();
    const record = (data.records || [])[0];

    if (!record) {
      console.warn('⚠️  Table Introduction vide — texte par défaut');
      return FALLBACK;
    }

    // Prend la première colonne texte non vide
    const contenu = Object.values(record.fields).find(v => typeof v === 'string' && v.trim());
    if (!contenu) {
      console.warn('⚠️  Aucun contenu trouvé dans Introduction — texte par défaut');
      return FALLBACK;
    }

    console.log('✅ Introduction chargée depuis Grist');
    return contenu;

  } catch (e) {
    console.warn('⚠️  Erreur chargement Introduction:', e.message);
    return FALLBACK;
  }
};
