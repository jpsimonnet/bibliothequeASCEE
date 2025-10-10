/**
 * Script pour télécharger toutes les couvertures depuis Grist
 * 
 * Usage: node scripts/download-covers.js [livres.csv]
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const { URL } = require('url');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../src/images/covers');
const DELAY_MS = 100; // Délai entre chaque téléchargement (pour ne pas surcharger le serveur)

// Créer le dossier si nécessaire
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Dossier créé: ${OUTPUT_DIR}`);
}

function parseCsv(csvFile) {
  const content = fs.readFileSync(csvFile, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split('\t').map(h => h.trim().replace(/"/g, ''));
  
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split('\t').map(v => v.trim().replace(/^"|"$/g, ''));
    const record = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    if (record.ID && record['Couverture-bnum']) {
      records.push({
        id: record.ID,
        url: record['Couverture-bnum']
      });
    }
  }
  
  return records;
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const file = fs.createWriteStream(dest);
      
      protocol.get(url, (response) => {
        // Suivre les redirections
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          return downloadImage(response.headers.location, dest)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return reject(new Error(`Status code: ${response.statusCode}`));
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(dest)) {
          fs.unlinkSync(dest);
        }
        reject(err);
      });
      
    } catch (err) {
      reject(err);
    }
  });
}

async function downloadAll(records) {
  console.log(`🚀 Téléchargement de ${records.length} images...\n`);
  
  let success = 0;
  let errors = 0;
  let skipped = 0;
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const dest = path.join(OUTPUT_DIR, `${record.id}.webp`);
    
    // Vérifier si l'image existe déjà
    if (fs.existsSync(dest)) {
      skipped++;
      if (i % 100 === 0) {
        console.log(`⏭️  Image ${record.id}.webp existe déjà (${i + 1}/${records.length})`);
      }
      continue;
    }
    
    try {
      await downloadImage(record.url, dest);
      success++;
      
      // Afficher la progression tous les 10 téléchargements
      if (success % 10 === 0 || i === records.length - 1) {
        const percent = Math.round((i + 1) / records.length * 100);
        console.log(`✅ ${success} téléchargées | ❌ ${errors} erreurs | ⏭️  ${skipped} ignorées [${percent}%]`);
      }
      
      // Petit délai pour ne pas surcharger le serveur
      if (i < records.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
      
    } catch (err) {
      errors++;
      console.error(`❌ Erreur pour ${record.id}: ${err.message}`);
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Téléchargées: ${success}`);
  console.log(`   ⏭️  Déjà présentes: ${skipped}`);
  console.log(`   ❌ Erreurs: ${errors}`);
  console.log(`   📁 Total dans ${OUTPUT_DIR}: ${fs.readdirSync(OUTPUT_DIR).length}`);
}

// Script principal
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Usage: node scripts/download-covers.js <livres.csv>');
  console.error('   Ou utilisez le fichier livres.json si déjà converti:');
  console.error('   node scripts/download-covers.js src/_data/livres.json');
  process.exit(1);
}

const inputFile = args[0];

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Fichier non trouvé: ${inputFile}`);
  process.exit(1);
}

try {
  let records;
  
  if (inputFile.endsWith('.csv')) {
    console.log('📖 Lecture du CSV...');
    records = parseCsv(inputFile);
  } else if (inputFile.endsWith('.json')) {
    console.log('📖 Lecture du JSON...');
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    records = data
      .filter(book => book.couverture_url)
      .map(book => ({
        id: book.id,
        url: book.couverture_url
      }));
  } else {
    console.error('❌ Format non supporté. Utilisez .csv ou .json');
    process.exit(1);
  }
  
  if (records.length === 0) {
    console.error('❌ Aucune image à télécharger');
    process.exit(1);
  }
  
  downloadAll(records).catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}