const axios = require('axios');
const cheerio = require('cheerio');

let handler = async (m, {
    text
}) => {
    if (!text) {
        return m.reply(`Please provide a recipe name to search for.\n\n*Example:*\n.cookpad ayam kecap`);
    }

    try {
        const cookpad = new Cookpad();
        const results = await cookpad.search(text);

        if (!results || results.length === 0) {
            return m.reply(`No recipes found for "${text}". Please try a different search term.`);
        }

        let replyText = `🍳 *Cookpad Search Results for "${text}"*\n\n`;
        // Limit results to prevent spam
        results.slice(0, 5).forEach((recipe, index) => {
            replyText += `*${index + 1}. ${recipe.title}*\n`;
            replyText += `   - *By:* ${recipe.author}\n`;
            if (recipe.prepTime) replyText += `   - *Time:* ${recipe.prepTime}\n`;
            if (recipe.servings) replyText += `   - *Servings:* ${recipe.servings}\n`;
            replyText += `   - *URL:* ${recipe.url}\n\n`;
        });

        m.reply(replyText.trim());

    } catch (e) {
        console.error(e);
        m.reply('An error occurred while searching for recipes. Please try again later.');
    }
};

handler.command = ['cookpad', 'resep'];
handler.help = ['cookpad <query>'];
handler.category = 'search';
handler.description = 'Searches for recipes on Cookpad.';

module.exports = handler;

/*
 * Core logic provided, do not modify.
 */
class Cookpad {
    search = async function(query) {
        try {
            if (!query) throw new Error('Query is required');

            const {
                data
            } = await axios.get(`https://cookpad.com/id/cari/${encodeURIComponent(query)}`);
            const $ = cheerio.load(data);
            const recipes = [];

            $('li[id^="recipe_"]').each((index, element) => {
                const recipeId = $(element).attr('id').replace('recipe_', '');
                const title = $(element).find('a.block-link__main').text().trim();
                const imageUrl = $(element).find('picture img[fetchpriority="auto"]').attr('src');
                const author = $(element).find('.flex.items-center.mt-auto span.text-cookpad-gray-600').text().trim();
                const prepTime = $(element).find('.mise-icon-time + .mise-icon-text').text().trim() || null;
                const servings = $(element).find('.mise-icon-user + .mise-icon-text').text().trim() || null;
                const ingredients = $(element).find('[data-ingredients-highlighter-target="ingredients"]').text().split(',').map(item => item.replace(/\s+/g, ' ').trim()).filter(item => item.length > 0);
                const url = `https://cookpad.com/id/resep/${recipeId}`;

                recipes.push({
                    id: recipeId,
                    title: title,
                    imageUrl: imageUrl,
                    author: author,
                    prepTime: prepTime,
                    servings: servings,
                    ingredients: ingredients,
                    url
                });
            });

            return recipes;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    detail = async function(url) {
        try {
            if (!url.includes('cookpad.com')) throw new Error('Invalid url');

            const {
                data
            } = await axios.get(url);
            const $ = cheerio.load(data);
            let recipeData = {};

            const ldJsonScript = $('script[type="application/ld+json"]').toArray().map(element => {
                try {
                    return JSON.parse($(element).text());
                } catch (e) {
                    return null;
                }
            }).filter(json => json && json['@type'] === 'Recipe');
            if (ldJsonScript.length < 0) throw new Error('Recipe not found');

            const recipeLd = ldJsonScript[0];

            recipeData.id = recipeLd.url ? recipeLd.url.split('/').pop() : null;
            recipeData.title = recipeLd.name || $('h1.break-words').text().trim();

            if (recipeLd.author && recipeLd.author['@type'] === 'Person') {
                recipeData.author = {
                    name: recipeLd.author.name,
                    username: $('a[href*="/pengguna/"] span[dir="ltr"]').first().text().trim() || null,
                    url: recipeLd.author.url
                };
            }

            recipeData.imageUrl = recipeLd.image || $('meta[property="og:image"]').attr('content');
            recipeData.description = recipeLd.description || $('meta[name="description"]').attr('content');
            recipeData.servings = recipeLd.recipeYield || null;
            recipeData.prepTime = $('div[id*="cooking_time_recipe_"] span.mise-icon-text').first().text().trim() || null;
            recipeData.ingredients = recipeLd.recipeIngredient || [];
            recipeData.steps = (recipeLd.recipeInstructions || []).map(step => ({
                text: step.text,
                images: step.image || []
            }));
            recipeData.datePublished = recipeLd.datePublished;
            recipeData.dateModified = recipeLd.dateModified;

            return recipeData;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}