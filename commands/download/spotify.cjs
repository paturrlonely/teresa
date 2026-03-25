const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const axios = require("axios");

const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, {
    recursive: true
});

let handler = async (m, {
    text,
    usedPrefix,
    command,
    conn
}) => {
    const tmpMp3 = path.join(tmpDir, "audio.mp3");
    const tmpOpus = path.join(tmpDir, "audio.opus");

    console.log("[SPOTIFY] Command:", command);
    console.log("[SPOTIFY] Input:", text);

    if (!text) {
        console.log("[SPOTIFY] ❌ Text kosong");
        return m.reply(`Contoh:\n${usedPrefix + command} swim\natau\n${usedPrefix + command} https://open.spotify.com/track/...`);
    }

    try {
        await global.loading(m, conn);

        // ===================== MODE LINK =====================
        if (/^https?:\/\/(open\.)?spotify\.com\//i.test(text)) {
            console.log("[SPOTIFY] Mode: LINK");

            const api = `https://api.apocalypse.web.id/download/spotify?url=${encodeURIComponent(text)}`;
            console.log("[SPOTIFY] Download API:", api);

            const {
                data
            } = await axios.get(api);
            console.log("[SPOTIFY] API Response:", data?.status);

            if (!data?.status || !data?.result?.medias?.length) {
                console.log("[SPOTIFY] ❌ Media tidak ditemukan");
                throw "DOWNLOAD_FAILED";
            }

            const media = data.result.medias[0];
            console.log("[SPOTIFY] Media URL:", media.url);

            const mp3 = await axios.get(media.url, {
                responseType: "arraybuffer"
            });
            fs.writeFileSync(tmpMp3, mp3.data);
            console.log("[SPOTIFY] MP3 tersimpan:", tmpMp3);

            await new Promise((resolve, reject) => {
                ffmpeg(tmpMp3)
                    .audioCodec("libopus")
                    .audioBitrate("64k")
                    .toFormat("opus")
                    .on("start", cmd => console.log("[SPOTIFY] FFmpeg start:", cmd))
                    .on("end", () => {
                        console.log("[SPOTIFY] FFmpeg selesai");
                        resolve();
                    })
                    .on("error", err => {
                        console.log("[SPOTIFY] FFmpeg error:", err);
                        reject(err);
                    })
                    .save(tmpOpus);
            });

            const opus = fs.readFileSync(tmpOpus);
            console.log("[SPOTIFY] OPUS size:", opus.length);

            await conn.sendMessage(m.chat, {
                audio: opus,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
                contextInfo: {
                    externalAdReply: {
                        title: data.result.title,
                        body: `${data.result.author} • ${data.result.duration}`,
                        thumbnailUrl: data.result.thumbnail,
                        sourceUrl: data.result.url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });

            console.log("[SPOTIFY] ✅ Audio terkirim");
            return;
        }

        // ===================== MODE SEARCH =====================
        console.log("[SPOTIFY] Mode: SEARCH");

        const api = `https://api.apocalypse.web.id/search/spotify?q=${encodeURIComponent(text)}`;
        console.log("[SPOTIFY] Search API:", api);

        const {
            data
        } = await axios.get(api);
        console.log("[SPOTIFY] Search result count:", data?.result?.length);

        if (!data?.status || !data?.result?.length) {
            console.log("[SPOTIFY] ❌ Lagu tidak ditemukan");
            return m.reply("❌ Lagu tidak ditemukan");
        }

        const rows = data.result.slice(0, 20).map(v => ({
            header: v.artist,
            title: `🎵 ${v.title}`,
            description: `⏱ ${v.duration}`,
            id: `${usedPrefix + command} ${v.spotify_url}`
        }));

        await conn.sendMessage(m.chat, {
            image: {
                url: data.result[0].thumbnail
            },
            caption: `🎶 Hasil pencarian Spotify\nQuery: ${text}`,
            footer: "Pilih lagu untuk dikirim sebagai PTT",
            buttons: [{
                buttonId: "spotify_select",
                buttonText: {
                    displayText: "📥 Pilih Lagu"
                },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "Daftar Lagu Spotify",
                        sections: [{
                            title: "Hasil Pencarian",
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        });

        console.log("[SPOTIFY] ✅ List dikirim");

    } catch (e) {
        console.error("[SPOTIFY ERROR]", e?.response?.data || e);
        m.reply("❌ Gagal memproses Spotify");
    } finally {
        await global.loading(m, conn, true);

        if (fs.existsSync(tmpMp3)) {
            fs.unlinkSync(tmpMp3);
            console.log("[SPOTIFY] tmpMp3 dihapus");
        }

        if (fs.existsSync(tmpOpus)) {
            fs.unlinkSync(tmpOpus);
            console.log("[SPOTIFY] tmpOpus dihapus");
        }
    }
};

handler.help = ["spotify <lagu|link>"];
handler.tags = ["downloader"];
handler.command = /^(spotify)$/i;
handler.limit = true;

module.exports = handler;