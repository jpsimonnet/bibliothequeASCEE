const fs = require('fs');
const { parse } = require('csv-parse/sync');

const inputFile = process.argv[2] || 'livres.csv';
const csvContent = fs.readFileSync(inputFile, 'utf-8');

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  delimiter: '\t',
  relax_quotes: true,
  relax_column_count: true
});

const books = records.map(record => ({
  id: record.ID,
  nom: record.Titre,
  auteur: record['Nom auteur complet'],
  resume: record['Résumé'],
  type: record.Type,
  isbn: record.ISBN || '',
  annee: record.Annee || '0',
  pages: record.Pages || '',
  langues: record.Langues || '',
  couverture_url: record['Couverture-bnum'] || ''
})).filter(book => book.id);

console.log(`✅ ${books.length} livres convertis`);
console.log('\n📊 Premier livre:');
console.log(JSON.stringify(books[0], null, 2));

fs.writeFileSync('src/_data/livres.json', JSON.stringify(books, null, 2));
console.log('\n✨ Fichier sauvegardé!');
