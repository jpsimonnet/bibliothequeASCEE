const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../src/_data/livres.json');

function parseTsvFile(tsvFile) {
  const content = fs.readFileSync(tsvFile, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split('\t').map(h => h.trim().replace(/\r/g, ''));
  
  const books = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split('\t').map(v => v.trim().replace(/\r/g, ''));
    const record = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    // Mapper vers le format attendu
    const book = {
      id: record['ID'] || record['id'],
      nom: record['Titre'] || record['titre'],
      auteur: record['Nom auteur complet'] || record['auteur'],
      resume: record['Résumé'] || record['resume'],
      type: record['Type'] || record['type'],
      isbn: record['ISBN'] || '',
      annee: record['Annee'] || record['année'] || '0',
      pages: record['Pages'] || '',
      langues: record['Langues'] || '',
      couverture_url: record['Couverture-bnum'] || ''
    };
    
    if (book.id) {
      books.push(book);
    }
  }
  
  return books;
}

const inputFile = process.argv[2] || 'livres.csv';

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Fichier non trouvé: ${inputFile}`);
  process.exit(1);
}

console.log('📖 Lecture du fichier TSV...');
const books = parseTsvFile(inputFile);

console.log(`✅ ${books.length} livres trouvés`);
console.log(`\n📊 Exemple du premier livre:`);
console.log(JSON.stringify(books[0], null, 2));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(books, null, 2), 'utf-8');
console.log(`\n✨ Fichier généré: ${OUTPUT_FILE}`);
