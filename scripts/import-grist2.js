/**
 * Script pour convertir l'export Grist en format 11ty
 * 
 * Usage:
 * 1. Exportez votre table Grist en CSV ou JSON
 * 2. Placez le fichier dans ce dossier
 * 3. Exécutez: node scripts/import-grist.js votre-fichier.csv
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = path.join(__dirname, '../src/_data/livres.json');

function convertCsvToJson(csvFile) {
  const csv = fs.readFileSync(csvFile, 'utf-8');
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const books = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Parse CSV en gérant les guillemets
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Créer l'objet livre
    const book = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      value = value.replace(/^"|"$/g, ''); // Enlever guillemets
      
      // Mapper les colonnes Grist vers le format attendu
      switch(header.toLowerCase()) {
        case 'id':
          book.id = value;
          break;
        case 'titre':
        case 'nom':
        case 'title':
          book.nom = value;
          break;
        case 'nom auteur complet':
        case 'auteur':
        case 'author':
          book.auteur = value;
          break;
        case 'resume':
        case 'résumé':
        case 'description':
        case 'summary':
          book.resume = value;
          break;
        case 'type':
          book.type = value;
          break;
        case 'isbn':
          book.isbn = value;
          break;
        case 'annee':
        case 'année':
          book.annee = value;
          break;
        case 'pages':
          book.pages = value;
          break;
        case 'langues':
          book.langues = value;
          break;
        case 'couverture-bnum':
          book.couverture_url = value;
          break;
        default:
          // Garder les autres champs tels quels si nécessaire
          // book[header] = value;
      }
    });
    
    if (book.id) {
      books.push(book);
    }
  }
  
  return books;
}

function convertJsonToFormat(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  
  // Si c'est déjà au bon format, retourner tel quel
  if (Array.isArray(data) && data[0]?.id && data[0]?.nom) {
    return data;
  }
  
  // Sinon mapper les champs
  return data.map(item => ({
    id: item.id || item.ID || item._id,
    nom: item.nom || item.titre || item.title || item.name,
    auteur: item.auteur || item.author,
    resume: item.resume || item.résumé || item.description || item.summary || ''
  }));
}

// Script principal
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Usage: node scripts/import-grist.js <fichier.csv|fichier.json>');
  process.exit(1);
}

const inputFile = args[0];

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Fichier non trouvé: ${inputFile}`);
  process.exit(1);
}

try {
  console.log('📖 Lecture du fichier...');
  
  let books;
  if (inputFile.endsWith('.csv')) {
    books = convertCsvToJson(inputFile);
  } else if (inputFile.endsWith('.json')) {
    books = convertJsonToFormat(inputFile);
  } else {
    console.error('❌ Format non supporté. Utilisez .csv ou .json');
    process.exit(1);
  }
  
  // Validation
  console.log(`✅ ${books.length} livres trouvés`);
  
  // Vérifier que les IDs sont uniques
  const ids = books.map(b => b.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    console.warn('⚠️  ATTENTION: Des IDs en double détectés !');
  }
  
  // Statistiques
  const missingAuthors = books.filter(b => !b.auteur).length;
  const missingResumes = books.filter(b => !b.resume).length;
  
  console.log(`📊 Statistiques:`);
  console.log(`   - Auteurs manquants: ${missingAuthors}`);
  console.log(`   - Résumés manquants: ${missingResumes}`);
  
  // Écrire le fichier
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(books, null, 2), 'utf-8');
  console.log(`\n✨ Fichier généré: ${OUTPUT_FILE}`);
  console.log(`\n🚀 Vous pouvez maintenant lancer: npm start`);
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}