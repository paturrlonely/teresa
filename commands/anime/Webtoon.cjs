const axios = require('axios');
const cheerio = require('cheerio');

let handler = async (m, {
    conn,
    text,
    args,
    usedPrefix,
    command
}) => {
    if (!args[0]) {
        return m.reply(`*Usage:*\n\n  *1. Search for a Webtoon:*\n  ${usedPrefix + command} search <query>\n  *Example:* ${usedPrefix + command} search solo leveling\n\n  *2. Get Webtoon Details:*\n  ${usedPrefix + command} detail <url>\n  *Example:* ${usedPrefix + command} detail https://www.webtoons.com/id/action/how-to-fight/list?title_no=1992`);
    }

    const subCommand = args[0].toLowerCase();

    try {
        switch (subCommand) {
            case 'search': {
                if (args.length < 2) {
                    return m.reply(`Please provide a search query.\n*Example:* ${usedPrefix + command} search how to fight`);
                }
                const query = args.slice(1).join(' ');
                await m.reply(`Searching for "${query}" on Webtoons...`);

                const results = await WebtoonsSearch(query);

                if (!results || (results.original.length === 0 && results.canvas.length === 0)) {
                    return m.reply(`No results found for "${query}".`);
                }

                let responseText = `*Webtoon Search Results for "${query}"*\n\n`;

                if (results.original.length > 0) {
                    responseText += '≡ *Originals*\n\n';
                    results.original.forEach((item, index) => {
                        responseText += `*${index + 1}. ${item.title}*\n`;
                        responseText += `  ◦  *Author:* ${item.author}\n`;
                        responseText += `  ◦  *Views:* ${item.viewCount}\n`;
                        responseText += `  ◦  *Link:* ${item.link}\n\n`;
                    });
                }

                if (results.canvas.length > 0) {
                    responseText += '≡ *Canvas*\n\n';
                    results.canvas.forEach((item, index) => {
                        responseText += `*${index + 1}. ${item.title}*\n`;
                        responseText += `  ◦  *Author:* ${item.author}\n`;
                        responseText += `  ◦  *Views:* ${item.viewCount}\n`;
                        responseText += `  ◦  *Link:* ${item.link}\n\n`;
                    });
                }
                await m.reply(responseText.trim());
                break;
            }

            case 'detail': {
                if (args.length < 2) {
                    return m.reply(`Please provide a Webtoon URL.\n*Example:* ${usedPrefix + command} detail https://www.webtoons.com/id/action/how-to-fight/list?title_no=1992`);
                }
                const url = args[1];
                if (!url.includes('webtoons.com')) {
                    return m.reply('Please provide a valid Webtoons URL.');
                }

                await m.reply('Fetching details for the Webtoon...');
                const detail = await WebtoonsDetail(url);

                if (!detail) {
                    return m.reply('Could not fetch details for the provided URL. It might be invalid or there was a network error.');
                }

                let detailText = `*Title:* ${detail.title}\n`;
                detailText += `*Genre:* ${detail.genre}\n`;
                detailText += `*Author(s):* ${detail.authors.join(', ')}\n`;
                detailText += `*Subscribers:* ${detail.stats.subscribers}\n`;
                detailText += `*Views:* ${detail.stats.views}\n`;
                detailText += `*Update Schedule:* ${detail.updateSchedule}\n`;
                detailText += `*Age Rating:* ${detail.ageRating}\n\n`;
                detailText += `*Synopsis:*\n${detail.description}\n\n`;

                if (detail.episodes.length > 0) {
                    detailText += `*Latest Episodes (up to 5):*\n`;
                    detail.episodes.slice(0, 5).forEach(ep => {
                        detailText += `  ◦  ${ep.episodeNumber}: ${ep.title} (${ep.date})\n`;
                    });
                }

                if (detail.thumbnail) {
                    const buffer = await getBuffer(detail.thumbnail);
                    await conn.sendFile(m.chat, buffer, 'thumbnail.jpg', detailText.trim(), m);
                } else {
                    await m.reply(detailText.trim());
                }

                break;
            }

            default:
                await m.reply(`Invalid subcommand. Use 'search' or 'detail'.\n*Example:* ${usedPrefix + command} search solo leveling`);
                break;
        }
    } catch (e) {
        console.error(e);
        await m.reply('An error occurred while processing your request. Please try again later.');
    }
};

handler.help = ['webtoon search <query>', 'webtoon detail <url>'];
handler.tags = ['anime'];
handler.command = /^(webtoon|wt)$/i;
handler.description = 'Search for Webtoons or get details about a specific one.';

module.exports = handler;

// --- Core Logic (Do not modify) ---

async function getBuffer(url) {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': 'https://www.webtoons.com/',
                'Origin': 'https://www.webtoons.com'
            }
        });
        return res.data;
    } catch (e) {
        throw `Gagal mengambil data dari URL (403)`;
    }
}

async function WebtoonsSearch(query) {
    try {
        const response = await axios.get(`https://m.webtoons.com/id/search?keyword=${encodeURIComponent(query)}`);
        const html = response.data;

        const $ = cheerio.load(html);

        const results = {
            original: [],
            canvas: []
        };

        $('.webtoon_list_wrap').first().find('.webtoon_list li').each((index, element) => {
            const $el = $(element);

            const title = $el.find('.info_text .title').text().trim();
            const author = $el.find('.info_text .author').text().trim();
            const viewCount = $el.find('.info_text .view_count').text().trim();
            const link = $el.find('a.link').attr('href');
            const image = $el.find('.image_wrap img').attr('src');
            const isNew = $el.find('.badge_new2').length > 0;

            results.original.push({
                title,
                author,
                viewCount,
                link,
                image,
                isNew
            });
        });


        $('.webtoon_list_wrap').last().find('.webtoon_list.type_small li').each((index, element) => {
            const $el = $(element);

            const title = $el.find('.info_text .title').text().trim();
            const author = $el.find('.info_text .author').text().trim();
            const viewCount = $el.find('.info_text .view_count').text().trim();
            const link = $el.find('a.link').attr('href');
            const image = $el.find('.image_wrap img').attr('src');

            results.canvas.push({
                title,
                author,
                viewCount,
                link,
                image
            });
        });

        return results;

    } catch (error) {
        console.error('Error fetching search data:', error.message);
        return null; // Return null on error
    }
}

async function WebtoonsDetail(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;

        const $ = cheerio.load(html);

        const result = {
            title: $('.detail_header .subj').text().trim(),
            genre: $('.detail_header .genre').text().trim(),
            authors: [],
            description: $('.summary').text().trim(),
            thumbnail: $('.detail_header .thmb img').attr('src'),
            backgroundImage: $('.detail_bg').attr('style')?.replace("background:url('", "").replace("') repeat-x", ""),
            stats: {
                views: $('.grade_area li:first-child .cnt').text().trim(),
                subscribers: $('.grade_area li:last-child .cnt').text().trim()
            },
            updateSchedule: $('.day_info').text().trim().replace('Baca Tiap ', ''),
            ageRating: $('.age_text').text().trim(),
            episodes: [],
            recommendations: []
        };

        const writer = $('.ly_creator_in .title').first().text().trim();
        const illustrator = $('.ly_creator_in .title').last().text().trim();
        if (writer && illustrator) {
            if (writer === illustrator) {
                result.authors = [writer];
            } else {
                result.authors = [writer, illustrator];
            }
        }

        $('#_listUl ._episodeItem').each((index, element) => {
            const $episode = $(element);

            const episodeData = {
                episodeNo: $episode.attr('id')?.replace('episode_', ''),
                title: $episode.find('.subj span').text().trim(),
                date: $episode.find('.date').text().trim(),
                likes: $episode.find('.like_area').text().trim().replace('like', ''),
                thumbnail: $episode.find('.thmb img').attr('src'),
                link: $episode.find('a').attr('href'),
                episodeNumber: $episode.find('.tx').text().trim()
            };

            result.episodes.push(episodeData);
        });

        $('.detail_other .lst_type1 li').each((index, element) => {
            const $rec = $(element);

            const recommendation = {
                title: $rec.find('.subj').text().trim(),
                author: $rec.find('.author').text().trim(),
                views: $rec.find('.grade_num').text().trim(),
                thumbnail: $rec.find('.pic_area img').attr('src'),
                link: $rec.find('a').attr('href')
            };

            result.recommendations.push(recommendation);
        });

        return result;

    } catch (error) {
        console.error('Error fetching detail data:', error.message);
        return null; // Return null on error
    }
}