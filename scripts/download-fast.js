const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const OUTPUT_DIR = path.join(__dirname, '../src/images/covers');
const CONCURRENT = 10; // 10 téléchargements en parallèle

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      const file = fs.createWriteStream(dest);
      
      protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
        }
        
        if (response.statusCode !== 200) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          return reject(new Error(`Status: ${response.statusCode}`));
        }
        
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function downloadBatch(batch) {
  return Promise.allSettled(
    batch.map(livre => {
      const dest = path.join(OUTPUT_DIR, `${livre.id}.webp`);
      return downloadImage(livre.couverture_url, dest)
        .then(() => ({ success: true, id: livre.id }))
        .catch(err => ({ success: false, id: livre.id, error: err.message }));
    })
  );
}

async function downloadAll() {
  const livres = require('../src/_data/livres.json');
  const existing = new Set(fs.readdirSync(OUTPUT_DIR).map(f => f.replace('.webp', '')));
  const toDownload = livres.filter(l => l.couverture_url && !existing.has(l.id));
  
  console.log(`🚀 ${toDownload.length} images à télécharger (${existing.size} déjà présentes)\n`);
  
  let success = 0;
  let errors = 0;
  
  for (let i = 0; i < toDownload.length; i += CONCURRENT) {
    const batch = toDownload.slice(i, i + CONCURRENT);
    const results = await downloadBatch(batch);
    
    results.forEach(r => {
      if (r.value?.success) success++;
      else errors++;
    });
    
    const percent = Math.round((i + batch.length) / toDownload.length * 100);
    console.log(`✅ ${success} | ❌ ${errors} | ${percent}%`);
  }
  
  const total = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webp')).length;
  console.log(`\n✨ Terminé! ${total} images au total`);
}

downloadAll();
