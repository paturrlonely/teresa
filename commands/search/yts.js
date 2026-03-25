import yts from "yt-search";
import { canvas } from "../../library/canvas/canvas-yts.js";

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`Contoh penggunaan:\n${usedPrefix + command} lady gaga`);

    try {
        await m.reply("⏳ Processing request... Please wait.");

        let res = await yts(args.join(" "));
        const rawVideos = res.all.filter(v => v.type === "video");
        if (!rawVideos.length) return m.reply("Tidak ditemukan hasil.");

        const query = args.join(" ");

        const videos = rawVideos.map(v => ({
            title: v.title,
            channel: v.author?.name || "-",
            duration: v.timestamp || "0:00",
            cover: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            url: v.url
        }));

        // Generate image canvas
        const imageBuffer = await canvas(videos, query);

        // Buat rows: 2 row per video (Video & Audio)
        const rows = videos.slice(0, 10).flatMap(v => [
            {
                header: v.channel,
                title: `📹 Video: ${v.title.length > 40 ? v.title.slice(0, 37) + "..." : v.title}`,
                description: `⏱️ ${v.duration}`,
                id: `.ytmp4 ${v.url}`
            },
            {
                header: v.channel,
                title: `🎧 Audio: ${v.title.length > 40 ? v.title.slice(0, 37) + "..." : v.title}`,
                description: `⏱️ ${v.duration}`,
                id: `.ytmp3 ${v.url}`
            }
        ]);

        await conn.sendMessage(
            m.chat,
            {
                image: imageBuffer,
                caption: `🎬 *Hasil pencarian YouTube*\nQuery: *${query}*`,
                footer: 'Klik untuk download Video/Audio',
                buttons: [
                    {
                        buttonId: 'yts_select',
                        buttonText: { displayText: '📥 Pilih Video/Audio' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Daftar Video YouTube',
                                sections: [
                                    {
                                        title: 'Hasil Pencarian',
                                        rows
                                    }
                                ]
                            })
                        }
                    }
                ],
                headerType: 1,
                viewOnce: true
            },
            { quoted: m }
        );

    } catch (e) {
        conn.logger.error(e);
        m.reply(`❌ Terjadi error: ${e.message}`);
    }
};

handler.command = /^yts(earch)?$/i;
handler.tags = ["search"];
handler.help = ["yts <query>"];

export default handler;