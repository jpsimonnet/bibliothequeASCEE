module.exports = function(eleventyConfig) {
  
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/css");
  
  eleventyConfig.watchIgnores.add("src/images/**");
  
  // Créer une variable globale accessible dans tous les templates
  eleventyConfig.addGlobalData("pathPrefix", function() {
    return process.env.ELEVENTY_PATHPREFIX || '';
  });
  
  eleventyConfig.addFilter("auteurFormat", function(auteur) {
    return auteur || "Auteur inconnu";
  });
  
  eleventyConfig.addFilter("truncate", function(text, length = 150) {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  });
  
  eleventyConfig.addFilter("coverUrl", function(id) {
    return `/images/covers/${id}.webp`;
  });
  
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
