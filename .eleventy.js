module.exports = function(eleventyConfig) {
  
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
    const livresData = require('./src/_data/livres.json');
    const categories = [...new Set(livresData.map(livre => livre.type).filter(Boolean))];
    return categories.sort();
  });

  eleventyConfig.addCollection("auteursUniques", function(collectionApi) {
    const livresData = require('./src/_data/livres.json');
    const allAuteurs = [...new Set(livresData.map(livre => livre.auteur).filter(Boolean))];
    // Dédupliquer par slug pour éviter les conflits de permalink
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

  // URL de base mDrive pour les ebooks
  eleventyConfig.addGlobalData("mdriveBase", "https://bnum.din.gouv.fr/mdrive/index.php/s/Kgpc5jtKTGKPkN8/download");

  eleventyConfig.addFilter("ebookCover", function(ebook) {
    if (!ebook || !ebook.has_cover) return '';
    return `https://bnum.din.gouv.fr/mdrive/index.php/s/Kgpc5jtKTGKPkN8/download?path=/${ebook.epath}&files=cover.jpg`;
  });

  eleventyConfig.addFilter("ebookDownload", function(ebook) {
    if (!ebook || !ebook.efile) return '';
    return `https://bnum.din.gouv.fr/mdrive/index.php/s/Kgpc5jtKTGKPkN8/download?path=/${ebook.epath}&files=${ebook.efile}`;
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
