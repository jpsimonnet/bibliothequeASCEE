#!/usr/bin/env node

/**
 * Extraction des métadonnées ebooks depuis la base Calibre (metadata.db)
 * Produit src/_data/ebooks.json pour le site Eleventy
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'metadata.db');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', '_data', 'ebooks.json');
const MDRIVE_BASE = 'https://bnum.din.gouv.fr/mdrive/index.php/s/Kgpc5jtKTGKPkN8/download';

function encodePath(filePath) {
  return filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function extractYear(pubdate) {
  if (!pubdate) return '';
  const match = pubdate.match(/(\d{4})/);
  return match ? match[1] : '';
}

function buildCoverUrl(bookPath) {
  return `${MDRIVE_BASE}?path=/${encodePath(bookPath)}&files=cover.jpg`;
}

function buildDownloadUrl(bookPath, filename, format) {
  const ext = format.toLowerCase();
  return `${MDRIVE_BASE}?path=/${encodePath(bookPath)}&files=${encodeURIComponent(filename + '.' + ext)}`;
}

const db = new Database(DB_PATH, { readonly: true });

// Requête principale pour les livres
const booksQuery = `
  SELECT
    b.id, b.title, b.sort AS title_sort, b.path, b.has_cover,
    b.pubdate, b.series_index, b.author_sort,
    c.text AS comment
  FROM books b
  LEFT JOIN comments c ON b.id = c.book
  ORDER BY b.sort
`;

// Requêtes séparées pour les relations many-to-many
const authorsQuery = db.prepare(`
  SELECT ba.book, a.name FROM books_authors_link ba JOIN authors a ON ba.author = a.id
`);
const tagsQuery = db.prepare(`
  SELECT bt.book, t.name FROM books_tags_link bt JOIN tags t ON bt.tag = t.id
`);
const langsQuery = db.prepare(`
  SELECT bl.book, l.lang_code FROM books_languages_link bl JOIN languages l ON bl.lang_code = l.id
`);
const seriesQuery = db.prepare(`
  SELECT bs.book, s.name FROM books_series_link bs JOIN series s ON bs.series = s.id
`);
const formatsQuery = db.prepare(`
  SELECT book, format, name FROM data
`);

// Construire les maps de relations
function buildMap(rows, keyField, valueField) {
  const map = new Map();
  for (const row of rows) {
    const key = row[keyField];
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row[valueField]);
  }
  return map;
}

const authorsMap = buildMap(authorsQuery.all(), 'book', 'name');
const tagsMap = buildMap(tagsQuery.all(), 'book', 'name');
const langsMap = buildMap(langsQuery.all(), 'book', 'lang_code');
const seriesMap = buildMap(seriesQuery.all(), 'book', 'name');

// Formats : on garde format + nom de fichier
const formatsMap = new Map();
for (const row of formatsQuery.all()) {
  if (!formatsMap.has(row.book)) formatsMap.set(row.book, []);
  formatsMap.get(row.book).push({ format: row.format, filename: row.name });
}

const books = db.prepare(booksQuery).all();
db.close();

const ebooks = books.map(row => {
  const formats = formatsMap.get(row.id) || [];
  const epubFormat = formats.find(f => f.format === 'EPUB') || formats[0];
  const tags = tagsMap.get(row.id) || [];
  const langues = langsMap.get(row.id) || [];
  const authors = authorsMap.get(row.id) || [];
  const series = seriesMap.get(row.id) || [];
  const annee = extractYear(row.pubdate);

  // Chemin encodé pour construire les URLs dans les templates
  const encodedPath = encodePath(row.path);
  const epubFilename = epubFormat ? epubFormat.filename + '.' + epubFormat.format.toLowerCase() : '';

  const resume = stripHtml(row.comment);

  return {
    id: row.id,
    titre: row.title,
    auteur: authors.join(', ') || 'Auteur inconnu',
    auteur_sort: row.author_sort || '',
    resume: resume,
    tags,
    langues,
    serie: series[0] || '',
    serie_index: row.series_index || 0,
    annee,
    has_cover: !!row.has_cover,
    format: epubFormat ? epubFormat.format : '',
    epath: encodedPath,
    efile: epubFilename ? encodeURIComponent(epubFilename) : ''
  };
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(ebooks, null, 2), 'utf-8');
console.log(`✓ ${ebooks.length} ebooks extraits vers ${OUTPUT_PATH}`);
