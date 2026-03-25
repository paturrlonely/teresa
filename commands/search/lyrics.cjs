const axios = require('axios');

/**
 * Fetches lyrics from lrclib.net
 * @param {string} title The title of the song to search for.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of song objects.
 */
async function lyrics(title) {
    // The core logic is kept as provided.
    // The outer try-catch is removed as it will be handled by the plugin handler.
    if (!title) throw new Error('Title is required');

    const {
        data
    } = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(title)}`, {
        headers: {
            'referer': `https://lrclib.net/search/${encodeURIComponent(title)}`,
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
    });

    return data;
}


let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        // Send usage instructions if no text is provided.
        const usageMessage = `Please provide a song title.\n\n*Example:*\n${usedPrefix + command} Bunga Maaf`;
        await conn.sendMessage(m.chat, {
            text: usageMessage
        }, {
            quoted: m
        });
        return;
    }

    try {
        await conn.sendMessage(m.chat, {
            text: `Searching for lyrics of "${text}"...`
        }, {
            quoted: m
        });

        const results = await lyrics(text);

        if (!results || results.length === 0) {
            const notFoundMessage = `Sorry, lyrics for "${text}" could not be found.`;
            await conn.sendMessage(m.chat, {
                text: notFoundMessage
            }, {
                quoted: m
            });
            return;
        }

        const song = results[0];
        const lyricsText = song.syncedLyrics || song.plainLyrics || 'No lyrics content available for this song.';

        let response = `*Title:* ${song.trackName}\n`;
        response += `*Artist:* ${song.artistName}\n`;
        if (song.albumName) {
            response += `*Album:* ${song.albumName}\n`;
        }
        response += `\n${lyricsText.trim()}`;

        await conn.sendMessage(m.chat, {
            text: response
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        const errorMessage = `An unexpected error occurred. Please try again later.`;
        await conn.sendMessage(m.chat, {
            text: errorMessage
        }, {
            quoted: m
        });
    }
};

handler.command = /^(lyrics|lirik)$/i;
handler.tags = ['search'];
handler.help = ['lyrics <song title>'];
handler.description = 'Search for song lyrics.';

module.exports = handler;