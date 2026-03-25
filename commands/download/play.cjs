const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const yts = require("yt-search");

const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, {
        recursive: true
    });
    console.log("[DEBUG] tmp directory dibuat:", tmpDir);
}

let bitrates = [128, 192, 256, 320];

let handler = async (m, {
    text,
    usedPrefix,
    command,
    conn
}) => {
    console.log("[DEBUG] Command dipanggil:", command);
    console.log("[DEBUG] Text:", text);

    const tmpMp3 = path.join(tmpDir, "audio.mp3");
    const tmpOpus = path.join(tmpDir, "audio.opus");

    try {
        if (!text) {
            console.log("[DEBUG] Tidak ada input text");
            return m.reply(`Contoh penggunaan:\n${usedPrefix + command} jalan kenangan`);
        }

        if (text?.startsWith("res|")) {
            let [, bitrate, url] = text.split("|");
            bitrate = parseInt(bitrate);

            console.log("[DEBUG] Mode res dipilih");
            console.log("[DEBUG] Bitrate:", bitrate);
            console.log("[DEBUG] URL:", url);

            try {
                await global.loading(m, conn);

                let apiUrl = `https://ytdlpyton.nvlgroup.my.id/download/audio?url=${encodeURIComponent(url)}&mode=url&bitrate=${bitrate}k`;
                console.log("[DEBUG] API URL:", apiUrl);

                let headers = {
                    accept: "application/json",
                    "X-API-Key": global.nauval
                };

                let data = await fetch(apiUrl, {
                    headers
                }).then(v => v.json());
                console.log("[DEBUG] API Response:", data);

                if (!data?.download_url) {
                    console.log("[DEBUG] download_url tidak ada");
                    return m.reply(data?.message || "❌ Gagal mengambil audio");
                }

                console.log("[DEBUG] Downloading MP3...");
                let mp3Buffer = await fetch(data.download_url).then(v => v.arrayBuffer());
                fs.writeFileSync(tmpMp3, Buffer.from(mp3Buffer));
                console.log("[DEBUG] MP3 tersimpan:", tmpMp3);

                console.log("[DEBUG] Convert MP3 → OPUS (ffmpeg)");
                await new Promise((resolve, reject) => {
                    ffmpeg(tmpMp3)
                        .audioCodec("libopus")
                        .audioBitrate("64k")
                        .toFormat("opus")
                        .on("start", cmd => console.log("[DEBUG] FFmpeg start:", cmd))
                        .on("end", () => {
                            console.log("[DEBUG] FFmpeg selesai");
                            resolve();
                        })
                        .on("error", err => {
                            console.error("[DEBUG] FFmpeg error:", err);
                            reject(err);
                        })
                        .save(tmpOpus);
                });

                let opusBuffer = fs.readFileSync(tmpOpus);
                console.log("[DEBUG] OPUS size:", opusBuffer.length);

                console.log("[DEBUG] Generate canvas thumbnail");
                const {
                    canvas: canvasPlay
                } = await import("../../library/canvas/canvas-play.js");
                let thumb = await canvasPlay(
                    data.thumbnail || "",
                    data.title || "YouTube Audio",
                    "YouTube"
                );

                let target = m.chat;
                console.log("[DEBUG] Target kirim:", target);

                await conn.sendMessage(target, {
                    audio: opusBuffer,
                    mimetype: "audio/ogg; codecs=opus",
                    ptt: true,
                    contextInfo: {
                        externalAdReply: {
                            title: data.title,
                            body: `${data.duration_sec || 0}s • ${data.uploader || "YouTube"}`,
                            thumbnail: thumb,
                            sourceUrl: url,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });

            } catch (e) {
                console.error("[DEBUG] ERROR di mode res:", e);
            } finally {
                await global.loading(m, conn, true);
                if (fs.existsSync(tmpMp3)) fs.unlinkSync(tmpMp3);
                if (fs.existsSync(tmpOpus)) fs.unlinkSync(tmpOpus);
            }
            return;
        }

        if (/^https?:\/\//.test(text)) {
            console.log("[DEBUG] Input berupa URL");

            let rows = bitrates.map(b => ({
                title: `${b}k`,
                description: `Convert ke PTT (${b}k)`,
                id: `${usedPrefix + command} res|${b}|${text}`
            }));

            return await conn.sendMessage(m.chat, {
                text: "🎧 Pilih bitrate audio",
                footer: "YouTube → Opus (PTT)",
                buttons: [{
                    buttonId: "yta_opus_select",
                    buttonText: {
                        displayText: "🎵 Pilih Bitrate"
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: "Pilih Bitrate Audio",
                            sections: [{
                                title: "Bitrate Tersedia",
                                rows
                            }]
                        })
                    }
                }],
                headerType: 1,
                viewOnce: true
            });
        }

        console.log("[DEBUG] Melakukan yt-search:", text);
        let search = await yts(text);

        let rawVideos = search.all.filter(v => v.type === "video");
        console.log("[DEBUG] Total video ditemukan:", rawVideos.length);

        if (!rawVideos.length) return m.reply("❌ Video tidak ditemukan");

        let videos = rawVideos.slice(0, 20).map(v => ({
            title: v.title,
            channel: v.author?.name || "Unknown",
            duration: v.timestamp || "0:00",
            cover: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            url: v.url
        }));

        console.log("[DEBUG] Generate canvas YTS");
        const {
            canvas: canvasYts
        } = await import("../../library/canvas/canvas-yts.js");
        let imageBuffer = await canvasYts(videos, text);

        let rows = videos.map(v => ({
            header: v.channel,
            title: `🎧 ${v.title.length > 40 ? v.title.slice(0, 37) + "..." : v.title}`,
            description: `⏱ ${v.duration}`,
            id: `${usedPrefix + command} ${v.url}`
        }));

        await conn.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `🎶 Hasil pencarian audio YouTube\nQuery: ${text}`,
            footer: "Klik untuk pilih audio",
            buttons: [{
                buttonId: "yts_audio_select",
                buttonText: {
                    displayText: "📥 Pilih Audio"
                },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "Daftar Audio YouTube",
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

    } catch (e) {
        console.error("[DEBUG] ERROR GLOBAL:", e);
        m.reply("❌ Terjadi error");
    }
};

handler.help = ["play <lagu>"];
handler.tags = ["downloader"];
handler.command = /^(play)$/i;
handler.limit = true;

module.exports = handler;