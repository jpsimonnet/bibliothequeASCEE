/**
 * Script de diagnostic Grist
 * Affiche les noms de colonnes réels de la table LIVRE et de la table avis.
 *
 * Usage:
 *   GRIST_API_KEY=votre_cle node scripts/test-grist.js
 */

const GRIST_DOC_ID = 'sH5fAFqm9fRs';
const GRIST_BASE = 'https://grist.numerique.gouv.fr/api';

async function checkTable(apiKey, tableName) {
  console.log(`\n📋 Table: ${tableName}`);

  const url = `${GRIST_BASE}/docs/${GRIST_DOC_ID}/tables/${tableName}/records?limit=1`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    console.error(`  ❌ Erreur ${response.status}: ${await response.text()}`);
    return;
  }

  const data = await response.json();

  if (!data.records || data.records.length === 0) {
    console.warn('  ⚠️  Table vide ou inexistante');
    return;
  }

  const colonnes = Object.keys(data.records[0].fields);
  console.log(`  ✅ ${colonnes.length} colonnes trouvées:`);
  colonnes.forEach(c => console.log(`     - "${c}": ${JSON.stringify(data.records[0].fields[c])}`));
}

async function main() {
  const apiKey = process.env.GRIST_API_KEY;
  if (!apiKey) {
    console.error('❌ Variable GRIST_API_KEY manquante');
    console.error('   Usage: GRIST_API_KEY=votre_cle node scripts/test-grist.js');
    process.exit(1);
  }

  console.log(`🔗 DocId: ${GRIST_DOC_ID}`);
  console.log(`🌐 Base: ${GRIST_BASE}`);

  // Lister toutes les tables du document
  let allTables = [];
  const tablesRes = await fetch(`${GRIST_BASE}/docs/${GRIST_DOC_ID}/tables`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (tablesRes.ok) {
    const tables = await tablesRes.json();
    allTables = tables.tables.map(t => t.id);
    console.log(`\n📂 Tables dans le document: ${allTables.join(', ')}`);
  }

  // Inspecter toutes les tables trouvées
  for (const table of allTables) {
    await checkTable(apiKey, table);
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
