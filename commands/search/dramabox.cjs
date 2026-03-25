const axios = require('axios');
const cheerio = require('cheerio');

/***
  @ Base: https://dramabox.web.id/
  @ Author: Shannz
  @ Note: Short drama, directly using dramaboxdb api server
***/

const CONFIG = {
    BASE_URL: 'https://dramabox.web.id',
    HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

const request = async (url) => {
    // The core logic is intentionally not wrapped in a try-catch
    // to allow the handler's catch block to manage errors centrally.
    const response = await axios.get(url, {
        headers: CONFIG.HEADERS
    });
    return cheerio.load(response.data);
};

const resolveUrl = (link) => {
    if (link && !link.startsWith('http')) {
        return `${CONFIG.BASE_URL}/${link.replace(/^\//, '')}`;
    }
    return link;
};

const getBookIdFromUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('bookId');
    } catch (e) {
        return null;
    }
};

const dramabox = {
    home: async () => {
        const $ = await request(CONFIG.BASE_URL);
        const latest = [];
        $('.drama-grid .drama-card').each((_, el) => {
            const link = resolveUrl($(el).find('.watch-button').attr('href'));
            latest.push({
                title: $(el).find('.drama-title').text().trim(),
                book_id: getBookIdFromUrl(link),
                image: $(el).find('.drama-image img').attr('src'),
                views: $(el).find('.drama-meta span').first().text().trim().split(' ')[1],
                episodes: $(el).find('.drama-meta span[itemprop="numberOfEpisodes"]').text().trim().split(' ')[1]
            });
        });

        const trending = [];
        $('.sidebar-widget .rank-list .rank-item').each((_, el) => {
            const link = resolveUrl($(el).attr('href'));
            trending.push({
                rank: $(el).find('.rank-number').text().trim(),
                title: $(el).find('.rank-title').text().trim(),
                book_id: getBookIdFromUrl(link),
                image: $(el).find('.rank-image img').attr('src'),
                views: $(el).find('.rank-meta span').eq(0).text().trim().split(' ')[1],
                episodes: $(el).find('.rank-meta span').eq(1).text().trim().split(' ')[1]
            });
        });

        return {
            latest,
            trending
        };
    },

    search: async (query) => {
        const targetUrl = `${CONFIG.BASE_URL}/search.php?lang=in&q=${encodeURIComponent(query)}`;
        const $ = await request(targetUrl);

        const results = [];
        $('.drama-grid .drama-card').each((_, el) => {
            const link = resolveUrl($(el).find('.watch-button').attr('href'));
            results.push({
                title: $(el).find('.drama-title').text().trim(),
                book_id: getBookIdFromUrl(link),
                views: $(el).find('.drama-meta span').first().text().trim().split(' ')[1],
                image: $(el).find('.drama-image img').attr('src')
            });
        });

        return results;
    },

    detail: async (bookId) => {
        const targetUrl = `${CONFIG.BASE_URL}/watch.php?bookId=${bookId}&lang=in`;
        const $ = await request(targetUrl);

        const fullTitle = $('.video-title').text().trim();
        const cleanTitle = fullTitle.split('- Episode')[0].trim();

        const episodes = [];
        $('.episodes-grid .episode-btn').each((_, el) => {
            episodes.push({
                episode: parseInt($(el).text().trim()),
                id: $(el).attr('data-episode')
            });
        });

        return {
            book_id: bookId,
            title: cleanTitle,
            description: $('.video-description').text().trim(),
            thumbnail: $('meta[itemprop="thumbnailUrl"]').attr('content'),
            upload_date: $('meta[itemprop="uploadDate"]').attr('content'),
            stats: {
                followers: $('.video-meta span').first().text().trim().split(' ')[1],
                total_episodes: $('span[itemprop="numberOfEpisodes"]').text().trim().split(' ')[1],
            },
            episode_list: episodes
        };
    },

    stream: async (bookId, episode) => {
        const targetUrl = `${CONFIG.BASE_URL}/watch.php?bookId=${bookId}&lang=in&episode=${episode}`;
        const $ = await request(targetUrl);

        let videoUrl = $('#mainVideo source').attr('src');
        if (!videoUrl) videoUrl = $('#mainVideo').attr('src');

        return {
            book_id: bookId,
            episode: episode,
            video_url: videoUrl
        };
    }
};

// CJS Plugin Wrapper
let handler = async (m, {
    conn,
    text,
    args,
    usedPrefix,
    command
}) => {
    try {
        const subcommand = args[0] ? args[0].toLowerCase() : null;

        switch (subcommand) {
            case null: { // Home page
                await conn.sendMessage(m.chat, {
                    text: '⏳ Fetching homepage data...'
                }, {
                    quoted: m
                });
                const homeData = await dramabox.home();
                if (!homeData || (!homeData.latest.length && !homeData.trending.length)) {
                    return await conn.sendMessage(m.chat, {
                        text: '❌ Could not fetch homepage data.'
                    }, {
                        quoted: m
                    });
                }

                let homeText = '📺 *Dramabox - Home*\n\n';
                if (homeData.latest.length) {
                    homeText += '✨ *Latest Releases*\n';
                    homeData.latest.slice(0, 5).forEach(d => {
                        homeText += `\n- *Title:* ${d.title}\n  *ID:* \`${d.book_id}\`\n  *Episodes:* ${d.episodes}\n`;
                    });
                }
                if (homeData.trending.length) {
                    homeText += '\n\n🔥 *Trending Now*\n';
                    homeData.trending.slice(0, 5).forEach(d => {
                        homeText += `\n- *#${d.rank} Title:* ${d.title}\n  *ID:* \`${d.book_id}\`\n  *Views:* ${d.views}\n`;
                    });
                }
                homeText += `\n\nℹ️ To see details, use *${usedPrefix}${command} detail <ID>*\nℹ️ To search, use *${usedPrefix}${command} <query>*`;
                await conn.sendMessage(m.chat, {
                    text: homeText
                }, {
                    quoted: m
                });
                break;
            }

            case 'detail': {
                const bookId = args[1];
                if (!bookId) return await conn.sendMessage(m.chat, {
                    text: `⚠️ Please provide a Book ID.\n*Example:* ${usedPrefix}${command} detail 260`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: `⏳ Fetching details for ID: ${bookId}...`
                }, {
                    quoted: m
                });
                const detailData = await dramabox.detail(bookId);
                if (!detailData || !detailData.title) return await conn.sendMessage(m.chat, {
                    text: `❌ Could not find details for Book ID "${bookId}".`
                }, {
                    quoted: m
                });

                let detailText = `🎬 *${detailData.title}*\n\n`;
                detailText += `📝 *Description:*\n${detailData.description}\n\n`;
                detailText += `📊 *Stats:*\n`;
                detailText += `- Followers: ${detailData.stats.followers}\n`;
                detailText += `- Total Episodes: ${detailData.stats.total_episodes}\n`;
                detailText += `- Upload Date: ${new Date(detailData.upload_date).toLocaleDateString()}\n\n`;
                detailText += `📼 *Episodes:* ${detailData.episode_list.length}\n\n`;
                detailText += `To watch, use:\n*${usedPrefix}${command} stream ${bookId} <episode_number>*`;

                await conn.sendMessage(m.chat, {
                    image: {
                        url: detailData.thumbnail
                    },
                    caption: detailText
                }, {
                    quoted: m
                });
                break;
            }

            case 'stream': {
                const bookId = args[1];
                const episode = args[2];
                if (!bookId || !episode) return await conn.sendMessage(m.chat, {
                    text: `⚠️ Please provide a Book ID and Episode number.\n*Example:* ${usedPrefix}${command} stream 260 1`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: `⏳ Fetching video for episode ${episode}...`
                }, {
                    quoted: m
                });
                const streamData = await dramabox.stream(bookId, episode);
                if (!streamData || !streamData.video_url) return await conn.sendMessage(m.chat, {
                    text: `❌ Could not find stream for Episode ${episode}.`
                }, {
                    quoted: m
                });

                const detailDataForTitle = await dramabox.detail(bookId).catch(() => ({
                    title: 'Unknown Title'
                }));
                const caption = `🎥 *Now Playing*\n\n*Title:* ${detailDataForTitle.title}\n*Episode:* ${episode}`;

                await conn.sendMessage(m.chat, {
                    video: {
                        url: streamData.video_url
                    },
                    caption: caption
                }, {
                    quoted: m
                });
                break;
            }

            default: { // Search
                await conn.sendMessage(m.chat, {
                    text: `⏳ Searching for "${text}"...`
                }, {
                    quoted: m
                });
                const searchResults = await dramabox.search(text);
                if (!searchResults || !searchResults.length) return await conn.sendMessage(m.chat, {
                    text: `❌ No results found for "${text}".`
                }, {
                    quoted: m
                });

                let searchText = `🔍 *Search Results for "${text}"*\n\n`;
                searchResults.forEach((d, i) => {
                    searchText += `${i + 1}. *${d.title}*\n   - ID: \`${d.book_id}\`\n\n`;
                });
                searchText += `ℹ️ Use *${usedPrefix}${command} detail <ID>* to get more information.`;
                await conn.sendMessage(m.chat, {
                    text: searchText
                }, {
                    quoted: m
                });
                break;
            }
        }
    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, {
            text: 'An error occurred while processing the request. The service might be temporarily unavailable.'
        }, {
            quoted: m
        });
    }
};

handler.command = ['dramabox'];
handler.help = [
    'dramabox',
    'dramabox <query>',
    'dramabox detail <bookId>',
    'dramabox stream <bookId> <episode>'
];
handler.tags = ['search'];
handler.description = 'Search, get details, and stream short dramas from Dramabox.';

module.exports = handler;