const fs = require('fs');
const { parse } = require('csv-parse/sync');

const inputFile = process.argv[2] || 'livres.csv';
const csvContent = fs.readFileSync(inputFile, 'utf-8');

// Afficher les 200 premiers caractères pour voir
console.log('📄 Début du fichier:');
console.log(csvContent.substring(0, 200));
console.log('\n---\n');

// Essayer différents délimiteurs
const delimiters = ['\t', ',', ';', '|'];

for (const delimiter of delimiters) {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: delimiter,
      relax_quotes: true,
      relax_column_count: true
    });
    
    if (records.length > 0) {
      console.log(`✅ Délimiteur trouvé: "${delimiter === '\t' ? '\\t (tab)' : delimiter}"`);
      console.log(`📊 ${records.length} lignes trouvées`);
      console.log('\n🔍 Colonnes disponibles:');
      console.log(Object.keys(records[0]));
      console.log('\n📖 Premier enregistrement:');
      console.log(records[0]);
      break;
    }
  } catch (e) {
    // Ignorer les erreurs et essayer le suivant
  }
}
