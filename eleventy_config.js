module.exports = function(eleventyConfig) {
  
  // Copier les images et assets
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  
  // Filtre pour formater les noms d'auteurs
  eleventyConfig.addFilter("auteurFormat", function(auteur) {
    return auteur || "Auteur inconnu";
  });
  
  // Filtre pour truncate les résumés
  eleventyConfig.addFilter("truncate", function(text, length = 150) {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  });
  
  // Filtre pour générer l'URL de couverture
  eleventyConfig.addFilter("coverUrl", function(id) {
    return `/images/covers/${id}.webp`;
  });
  
  // Filtre pour obtenir les valeurs uniques
  eleventyConfig.addFilter("unique", function(array) {
    return [...new Set(array)];
  });
  
  // Filtre pour limiter le nombre d'items
  eleventyConfig.addFilter("limit", function(array, limit) {
    return array.slice(0, limit);
  });
  
  // Collection pour tous les livres (utile pour recherche)
  eleventyConfig.addCollection("tousLesLivres", function(collectionApi) {
    return collectionApi.getFilteredByTag("livre");
  });
  
  // Collection des auteurs uniques
  eleventyConfig.addCollection("auteursUniques", function(collectionApi) {
    const livresData = require('./src/_data/livres.json');
    const auteurs = [...new Set(livresData.map(livre => livre.auteur).filter(Boolean))];
    return auteurs.sort();
  });
  
  // Optimisation du build
  eleventyConfig.setQuietMode(true);
  
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