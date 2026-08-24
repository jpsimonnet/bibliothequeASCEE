const markdownIt = require('markdown-it');
const md = markdownIt({ html: false, breaks: true, linkify: true });

module.exports = function(eleventyConfig) {

  eleventyConfig.addFilter("markdown", function(content) {
    return md.render(content || '');
  });
  
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/css");
  
  eleventyConfig.watchIgnores.add("src/images/**");
  
  eleventyConfig.addFilter("auteurFormat", function(auteur) {
    return auteur || "Auteur inconnu";
  });
  
  eleventyConfig.addFilter("truncate", function(text, length = 150) {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  });
  
  // NE PAS utiliser coverUrl - on va le supprimer et utiliser url directement
  
  eleventyConfig.addFilter("unique", function(array) {
    return [...new Set(array)];
  });
  
  eleventyConfig.addFilter("limit", function(array, limit) {
    return array.slice(0, limit);
  });
  
  eleventyConfig.addFilter("map", function(array, property) {
    return array.map(item => item[property]);
  });
  
  eleventyConfig.addFilter("selectattr", function(array, attr, value) {
    return array.filter(item => item[attr] === value);
  });
  
  eleventyConfig.addFilter("withIndex", function(livresArray, allLivres) {
    return livresArray.map(livre => ({
      livre: livre,
      index: allLivres.findIndex(l => l.id === livre.id)
    }));
  });

  eleventyConfig.addCollection("tousLesLivres", function(collectionApi) {
    return collectionApi.getFilteredByTag("livre");
  });
  
  eleventyConfig.addCollection("categoriesUniques", function(collectionApi) {
    const livresPages = collectionApi.getFilteredByTag("livre");
    const categories = [...new Set(livresPages.map(p => p.data.livre && p.data.livre.type).filter(Boolean))];
    return categories.sort();
  });

  eleventyConfig.addCollection("auteursUniques", function(collectionApi) {
    const livresPages = collectionApi.getFilteredByTag("livre");
    const allAuteurs = [...new Set(livresPages.map(p => p.data.livre && p.data.livre.auteur).filter(Boolean))];
    function slugify(text) {
      return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    const seen = new Set();
    const auteurs = allAuteurs.sort().filter(a => {
      const slug = slugify(a);
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
    return auteurs;
  });

  eleventyConfig.addCollection("ebookCategoriesUniques", function(collectionApi) {
    const ebooksData = require('./src/_data/ebooks.json');
    const allTags = new Set();
    ebooksData.forEach(ebook => {
      if (ebook.tags) ebook.tags.forEach(tag => allTags.add(tag));
    });
    function slugify(text) {
      return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    const seen = new Set();
    return [...allTags].sort().filter(t => {
      const slug = slugify(t);
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
  });

  eleventyConfig.addCollection("ebookAuteursUniques", function(collectionApi) {
    const ebooksData = require('./src/_data/ebooks.json');
    const allAuteurs = [...new Set(ebooksData.map(e => e.auteur).filter(Boolean))];
    function slugify(text) {
      return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    const seen = new Set();
    const auteurs = allAuteurs.sort().filter(a => {
      const slug = slugify(a);
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
    return auteurs;
  });

  // URL de base Cloudflare R2 pour les ebooks
  const r2Base = "https://pub-ad35d75f972549028d32a8686e002705.r2.dev";

  eleventyConfig.addFilter("ebookCover", function(ebook) {
    if (!ebook || !ebook.has_cover) return '';
    return `${r2Base}/${ebook.epath}/cover.jpg`;
  });

  eleventyConfig.addFilter("ebookDownload", function(ebook) {
    if (!ebook || !ebook.efile) return '';
    return `${r2Base}/${ebook.epath}/${ebook.efile}`;
  });

  // Préfixe du plan d'étagère : "LF1-1" -> "LF1" (nom du fichier image du plan)
  eleventyConfig.addFilter("etagerePlan", function(etagere) {
    if (!etagere) return '';
    const m = String(etagere).trim().toUpperCase().match(/^[A-Z]+\d*/);
    return m ? m[0] : '';
  });

  // Tri des auteurs par nom de famille
  eleventyConfig.addFilter("sortByLastName", function(auteurs) {
    const particules = ['de', 'du', 'des', 'le', 'la', 'les', 'von', 'van', 'di', 'da', 'al'];
    function getLastName(name) {
      const parts = name.split(' ');
      // Parcourir depuis la fin pour trouver le nom (en ignorant les particules)
      for (let i = parts.length - 1; i >= 0; i--) {
        if (!particules.includes(parts[i].toLowerCase())) {
          return parts[i].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
      }
      return parts[parts.length - 1].toLowerCase();
    }
    return [...auteurs].sort((a, b) => getLastName(a).localeCompare(getLastName(b)));
  });

  // Filtres pour les avis
  eleventyConfig.addFilter("avisPourLivre", function(avisList, livreId) {
    return (avisList || []).filter(a => a.livre_id === String(livreId));
  });

  eleventyConfig.addFilter("etoiles", function(note) {
    const n = Math.max(0, Math.min(5, parseInt(note) || 0));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  });

  eleventyConfig.addFilter("noteAverage", function(avisList) {
    if (!avisList || avisList.length === 0) return 0;
    const sum = avisList.reduce((acc, a) => acc + (parseInt(a.note) || 0), 0);
    return Math.round((sum / avisList.length) * 10) / 10;
  });

  eleventyConfig.addFilter("stripHtml", function(text) {
    if (!text) return '';
    return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  });

  eleventyConfig.addFilter("encodeURI", function(text) {
    return encodeURIComponent(text || '');
  });

  eleventyConfig.addNunjucksFilter("slugify", function(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
