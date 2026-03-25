const axios = require("axios");
const cheerio = require("cheerio");

async function scSearch(query) {
    const url = `https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/50.0 (Linux; Android 13; SoundCloudBot/1.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
            Referer: "https://soundcloud.com/",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.8"
        }
    });

    const $ = cheerio.load(data);
    const results = [];

    $("ul.List_VerticalList__2uQYU > li").each((_, el) => {
        const $el = $(el);
        const link = $el.find("a.Cell_CellLink__3yLVS").attr("href");
        if (!link) return;

        const title = $el.find(".Information_CellTitle__2KitR").text().trim();
        const artist = $el.find(".Information_CellSubtitle__1mXGx").text().trim();
        const thumb = $el.find("img.Artwork_ArtworkImage__1Ws9-").attr("src") ?? "";
        const thumbnail = thumb.replace("-t240x240.jpg", "-t500x500.jpg");

        results.push({
            title,
            artist,
            thumbnail,
            url: "https://soundcloud.com" + link
        });
    });

    return results;
}

async function scDownload(url) {
    const { data: info } = await axios.post(
        "https://sc.snapfirecdn.com/soundcloud",
        { target: url, gsc: "x" },
        {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        }
    );

    const sound = info?.sound || info?.track || info?.media || info?.data || {};
    const metadata = info?.metadata || {};

    const { data: dl } = await axios.get(
        `https://sc.snapfirecdn.com/soundcloud-get-dl?target=${encodeURIComponent(
            sound.progressive_url || sound.url
        )}`
    );

    return {
        title: sound.title || metadata.title,
        artist: metadata.username,
        artwork: metadata.artwork_url,
        mp3: dl.url
    };
}

let handler = async (m, { conn, text }) => {
    if (!text) {
        await conn.sendMessage(m.chat, { react: { text: "❗", key: m.key } });
        return;
    }

    if (text.includes("soundcloud.com")) {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        try {
            const res = await scDownload(text);
            const audio = await axios.get(res.mp3, { responseType: "arraybuffer" });

            return conn.sendMessage(
                m.chat,
                {
                    audio: Buffer.from(audio.data),
                    mimetype: "audio/mpeg",
                    fileName: res.title + ".mp3",
                    contextInfo: {
                        externalAdReply: {
                            title: res.title,
                            body: res.artist,
                            thumbnailUrl: res.artwork,
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            sourceUrl: text
                        }
                    }
                },
                { quoted: m }
            );
        } catch (err) {
            return conn.sendMessage(m.chat, { text: "❌ Gagal download audio." });
        }
    }

    await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } });

    const results = await scSearch(text);
    if (!results.length) {
        return conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    }

    const first = results[0];

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

    const res = await scDownload(first.url);
    const audio = await axios.get(res.mp3, { responseType: "arraybuffer" });

    return conn.sendMessage(
        m.chat,
        {
            audio: Buffer.from(audio.data),
            mimetype: "audio/mpeg",
            fileName: res.title + ".mp3",
            contextInfo: {
                externalAdReply: {
                    title: res.title,
                    body: res.artist,
                    thumbnailUrl: res.artwork,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: first.url
                }
            }
        },
        { quoted: m }
    );
};

handler.command = ["soundcloud", "scdl"];
handler.help = ["soundcloud <query|url>"];
handler.tags = ["downloader"];
handler.limit = true
handler.register = true
module.exports = handler;