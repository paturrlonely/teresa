const axios = require("axios");
const cheerio = require("cheerio");

/**
 * SoulScansScraper
 * A class for scraping search results, details, and chapter images from SoulScans.
 * 
 * @author synshin9
 */
class SoulScansScraper {
    /**
     * Search manga by query
     * @param {string} query - The search keyword
     * @returns {Promise<Array>} List of search results
     */
    static async search(query) {
        try {
            const url = `https://soulscans.my.id/?s=${encodeURIComponent(query)}`;
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            const results = [];

            $('.bs .bsx').each((_, el) => {
                const $el = $(el);
                const title = $el.find('.tt').text().trim();
                const url = $el.find('a').attr('href');
                const imageUrl = $el.find('img').attr('src');
                const chapter = $el.find('.epxs').text().trim();
                const rating = $el.find('.numscore').text().trim();
                const typeEl = $el.find('.type');
                let type = '';
                if (typeEl.length > 0) {
                    const classAttr = typeEl.attr('class') || '';
                    const match = classAttr.match(/type\s+(\w+)/);
                    type = match ? match[1] : '';
                }
                const isHot = $el.find('.hotx').length > 0;

                results.push({
                    title,
                    imageUrl,
                    chapter,
                    rating,
                    type,
                    isHot,
                    url
                });
            });

            return results;
        } catch (err) {
            console.error('SoulScans Search error:', err.message);
            return [];
        }
    }

    /**
     * Get manga detail by URL
     * @param {string} url - The manga page URL
     * @returns {Promise<Object>} Manga detail data
     */
    static async detail(url) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            const title = $('h1.entry-title').text().trim();
            const imageUrl = $('.thumb img').attr('src');
            const followed = $('.bmc span').text().trim();

            const type = $('.imptdt:contains("Type")').text().replace('Type', '').trim();
            const released = $('.imptdt:contains("Released")').text().replace('Released', '').trim();
            const author = $('.imptdt:contains("Author")').text().replace('Author', '').trim();
            const artist = $('.imptdt:contains("Artist")').text().replace('Artist', '').trim();
            const postedBy = $('.imptdt:contains("Posted By")').text().replace('Posted By', '').trim();
            const postedOn = $('.imptdt:contains("Posted On") time').attr('datetime');
            const updatedOn = $('.imptdt:contains("Updated On") time').attr('datetime');
            const views = $('.imptdt:contains("Views") .ts-views-count').text().trim();

            const alternativeNames = $('.alternative').text().trim();
            const tags = [];
            $('.mgen a').each((_, el) => tags.push($(el).text().trim()));

            const chapters = [];
            $('.eplister li').each((_, el) => {
                const $ch = $(el);
                const number = $ch.attr('data-num');
                const title = $ch.find('.chapternum').text().trim();
                const date = $ch.find('.chapterdate').text().trim();
                const url = $ch.find('a').attr('href');
                chapters.push({
                    number,
                    title,
                    date,
                    url
                });
            });

            return {
                title,
                imageUrl,
                followed,
                details: {
                    type,
                    released,
                    author,
                    artist,
                    postedBy,
                    postedOn,
                    updatedOn,
                    views
                },
                alternativeNames,
                tags,
                chapters
            };
        } catch (err) {
            console.error('SoulScans Detail error:', err.message);
            return null;
        }
    }

    /**
     * Get all image URLs from a chapter
     * @param {string} url - The chapter URL
     * @returns {Promise<Object>} Chapter images data
     */
    static async download(url) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            const description = $('meta[property="og:description"]').attr('content') ||
                $('meta[name="description"]').attr('content') ||
                $('.chdesc p').text().trim();

            const imageUrls = [];

            $('noscript').each((_, el) => {
                const noscriptContent = $(el).html();
                const $nos = cheerio.load(noscriptContent);
                $nos('img').each((_, img) => {
                    const src = $nos(img).attr('src');
                    if (src && !imageUrls.includes(src)) imageUrls.push(src);
                });
            });

            $('script').each((_, el) => {
                const scriptContent = $(el).html();
                if (scriptContent && scriptContent.includes('sources')) {
                    const matches = scriptContent.match(/https:\/\/[^"']+\.(webp|jpg|jpeg|png|gif)/g);
                    if (matches) {
                        matches.forEach(url => {
                            if (!imageUrls.includes(url)) imageUrls.push(url);
                        });
                    }
                }
            });

            if (imageUrls.length === 0) {
                $('#readerarea img').each((_, el) => {
                    const src = $(el).attr('src');
                    if (src) imageUrls.push(src);
                });
            }

            const cleanImageUrls = imageUrls
                .filter(url => url && !url.includes('readerarea.svg'))
                .map(url => url.trim());

            return {
                title: $('title').text().trim(),
                description,
                imageUrls: cleanImageUrls,
                totalImages: cleanImageUrls.length
            };
        } catch (err) {
            console.error('SoulScans Download error:', err.message);
            return null;
        }
    }
}


const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    const args = text.trim().split(/ +/);
    const subcommand = args.shift()?.toLowerCase();
    const queryOrUrl = args.join(' ');

    if (!subcommand) {
        return m.reply(handler.help.replace(/•/g, '  •').replace(/_/g, ''));
    }

    await m.reply('⏳ Processing your request, please wait...');

    try {
        switch (subcommand) {
            case 'search': {
                if (!queryOrUrl) return m.reply(`Please provide a search query.\n*Example:* ${usedPrefix}${command} search returner`);
                const results = await SoulScansScraper.search(queryOrUrl);
                if (!results || results.length === 0) return m.reply('❌ No results found for your query.');

                let responseText = `*🔍 Search Results for "${queryOrUrl}"*\n\n`;
                results.slice(0, 10).forEach((res, index) => { // Limit to 10 results
                    responseText += `*${index + 1}. ${res.title}*\n`;
                    responseText += `  - Chapter: ${res.chapter}\n`;
                    responseText += `  - Rating: ${res.rating}\n`;
                    responseText += `  - Type: ${res.type}\n`;
                    responseText += `  - URL: ${res.url}\n\n`;
                });
                await m.reply(responseText.trim());
                break;
            }

            case 'detail': {
                if (!queryOrUrl || !queryOrUrl.startsWith('http')) return m.reply(`Please provide a valid SoulScans URL.\n*Example:* ${usedPrefix}${command} detail https://soulscans.my.id/manga/the-returners-magic-should-be-special/`);
                const data = await SoulScansScraper.detail(queryOrUrl);
                if (!data) return m.reply('❌ Could not fetch details for the provided URL.');

                let responseText = `*✨ ${data.title} ✨*\n\n`;
                responseText += `*Followed:* ${data.followed}\n`;
                responseText += `*Alternative Names:* ${data.alternativeNames}\n`;
                responseText += `*Tags:* ${data.tags.join(', ')}\n\n`;
                responseText += `*📋 Details:*\n`;
                responseText += `  - Type: ${data.details.type}\n`;
                responseText += `  - Released: ${data.details.released}\n`;
                responseText += `  - Author: ${data.details.author}\n`;
                responseText += `  - Artist: ${data.details.artist}\n`;
                responseText += `  - Views: ${data.details.views}\n`;
                responseText += `  - Updated On: ${new Date(data.details.updatedOn).toLocaleDateString()}\n\n`;
                responseText += `*📚 Chapters (Top 10):*\n`;
                data.chapters.slice(0, 10).forEach(ch => {
                    responseText += `  - ${ch.title} (${ch.date})\n`;
                });
                if (data.chapters.length > 10) {
                    responseText += `\n...and ${data.chapters.length - 10} more chapters.`;
                }

                if (data.imageUrl) {
                    await conn.sendFile(m.chat, data.imageUrl, 'thumbnail.jpg', responseText.trim(), m);
                } else {
                    await m.reply(responseText.trim());
                }
                break;
            }

            case 'download': {
                if (!queryOrUrl || !queryOrUrl.startsWith('http')) return m.reply(`Please provide a valid SoulScans chapter URL.\n*Example:* ${usedPrefix}${command} download https://soulscans.my.id/the-returners-magic-should-be-special-chapter-245/`);
                const data = await SoulScansScraper.download(queryOrUrl);
                if (!data || !data.imageUrls || data.imageUrls.length === 0) return m.reply('❌ Could not download images from the provided URL.');

                await m.reply(`*Downloading "${data.title}"*\nTotal images: ${data.totalImages}\n\nSending images, this may take a moment...`);

                for (const [index, url] of data.imageUrls.entries()) {
                    await conn.sendFile(m.chat, url, `image_${index + 1}.jpg`, `Page ${index + 1}/${data.totalImages}`, m, false, {
                        mimetype: 'image/jpeg'
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to prevent flood
                }
                await m.reply(`✅ Finished sending all ${data.totalImages} images for "${data.title}".`);
                break;
            }

            default:
                await m.reply(handler.help.replace(/•/g, '  •').replace(/_/g, ''));
                break;
        }
    } catch (e) {
        console.error(`SoulScans Plugin Error: ${e.message}`);
        await m.reply('An unexpected error occurred. Please check the logs or try again later.');
    }
};

handler.command = ['soulscans'];
handler.help = `
*SoulScans Scraper*

_Fetches manga information and chapters from soulscans.my.id_

*Usage:*
• soulscans search <query>
  - _Searches for a manga._
• soulscans detail <url>
  - _Gets details of a specific manga._
•soulscans download <url>
  - _Downloads all images from a chapter URL._

*Examples:*
• soulscans search returner
• soulscans detail https://soulscans.my.id/manga/the-returners-magic-should-be-special/
• soulscans download https://soulscans.my.id/the-returners-magic-should-be-special-chapter-245/
`.trim();
handler.tags = ['anime'];
handler.description = 'Search, get details, and download chapters from SoulScans.';

module.exports = handler;