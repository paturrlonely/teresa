const axios = require("axios");
const cheerio = require("cheerio");

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return conn.sendMessage(m.chat, {
            text: `Please provide a character name.\n\n*Example:*\n${usedPrefix + command} Mejiro McQueen`
        }, {
            quoted: m
        });
    }

    try {
        const result = await getData(text);

        if (!result.status) {
            return conn.sendMessage(m.chat, {
                text: `Error: ${result.error}`
            }, {
                quoted: m
            });
        }

        let caption = `*${result.name}* (${result.jpName})\n\n`;
        caption += `${result.description}\n\n`;
        caption += `*Surface:* ${result.surface}\n`;
        caption += `*Best Distance:* ${result.bestDistance}\n`;
        caption += `*Strategy:* ${result.strategy}\n`;
        caption += `*Signature Stat:* ${result.signature}\n\n`;
        caption += `*Stats:*\n`;
        for (const stat in result.stats) {
            caption += `  - ${stat}: ${result.stats[stat]}\n`;
        }
        caption += `\n*Source:* ${result.url}`;

        if (result.image) {
            await conn.sendMessage(m.chat, {
                image: {
                    url: result.image
                },
                caption: caption.trim()
            }, {
                quoted: m
            });
        } else {
            await conn.sendMessage(m.chat, {
                text: caption.trim()
            }, {
                quoted: m
            });
        }

    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, {
            text: 'An unexpected error occurred while fetching the data.'
        }, {
            quoted: m
        });
    }
};

handler.command = ['umamusume', 'uma'];
handler.tags = ['anime'];
handler.help = ['umamusume'];
handler.description = 'Search for Umamusume character details from umamusumedb.com';

// --- CORE LOGIC (DO NOT MODIFY) ---

function processName(input) {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");
}

async function getData(inputName) {
    const slug = processName(inputName);

    try {
        const url = `https://umamusumedb.com/characters/${slug}_2025/`;
        const {
            data: html
        } = await axios.get(url);
        const $ = cheerio.load(html);

        let dataJson = null;
        $('script[type="application/ld+json"]').each((_, el) => {
            const txt = $(el).contents().text().trim();
            try {
                const obj = JSON.parse(txt);
                if (obj["@type"] === "VideoGameCharacter") dataJson = obj;
            } catch {}
        });

        if (!dataJson) return {
            status: false,
            error: "Data JSON not found. The character might not exist or the name is incorrect."
        };

        const name = dataJson.name || null;
        const jpName = dataJson.alternateName || null;
        const description = dataJson.description || null;

        const stats = {};
        if (Array.isArray(dataJson.characterAttribute)) {
            dataJson.characterAttribute.forEach(a => stats[a.name] = a.value);
        }

        const image = $("meta[property='og:image']").attr("content") || null;

        const pick = (label) => {
            const el = $("div.text-xs.text-gray-500").filter(function() {
                return $(this).text().trim() === label;
            }).first();
            if (!el.length) return null;
            return el.nextAll("div.font-semibold").first().text().trim().replace(/\s+/g, " ");
        };

        const surface = pick("Surface");
        const bestDistance = pick("Best Distance");
        const strategy = pick("Preferred Strategy");
        const signature = pick("Signature Stat");

        return {
            status: true,
            name,
            jpName,
            description,
            image,
            surface,
            bestDistance,
            strategy,
            signature,
            stats,
            slug,
            url
        };

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return {
                status: false,
                error: `Character "${inputName}" not found. Please check the spelling.`
            };
        }
        return {
            status: false,
            error: "Failed to load data. The website may be down or the character does not exist."
        };
    }
}

module.exports = handler;