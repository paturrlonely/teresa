const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const fetch = async (...args) => (await import("node-fetch")).default(...args);

const handler = async (m, { conn, text }) => {
    if (!text) return m.reply("❌ Masukkan URL TikTok!");

    await m.reply("⏳ Sedang mengunduh video TikTok...");

    let j2download;
    try {
        j2download = require("../../scraper/aio.js");
        if (j2download.default) j2download = j2download.default;
    } catch (e) {
        return m.reply("❌ Gagal memuat module downloader.");
    }

    let res;
    try {
        res = await j2download(text);
    } catch (e) {
        return m.reply("❌ Gagal mengambil data media.");
    }

    if (!res?.medias?.length) return m.reply("❌ Media tidak ditemukan.");

    const video = res.medias.find(v => v.quality === "hd_no_watermark") || res.medias.find(v => v.type === "video");
    const audio = res.medias.find(v => v.type === "audio");

    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpInput = path.join(tmpDir, "input.mp3");
    const tmpOutput = path.join(tmpDir, "output.opus");

    try {
        let sentVideo;

        if (video) {
            sentVideo = await conn.sendMessage(
                m.chat,
                {
                    video: { url: video.url },
                    mimetype: "video/mp4",
                    caption: "✅ Video TikTok berhasil diunduh"
                },
                { quoted: m }
            );
        }

        if (audio) {
            const resAudio = await fetch(audio.url);
            const buffer = Buffer.from(await resAudio.arrayBuffer());
            fs.writeFileSync(tmpInput, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(tmpInput)
                    .toFormat("opus")
                    .audioCodec("libopus")
                    .audioBitrate("64k")
                    .on("end", resolve)
                    .on("error", reject)
                    .save(tmpOutput);
            });

            const audioBuffer = fs.readFileSync(tmpOutput);

            await conn.sendMessage(
                m.chat,
                {
                    audio: audioBuffer,
                    mimetype: "audio/ogg; codecs=opus",
                    ptt: true
                },
                { quoted: sentVideo || m }
            );
        }

        if (!video && !audio) return m.reply("❌ Media tidak didukung.");

    } catch (e) {
        console.error(e);
        return m.reply("❌ Gagal mengirim media (403 / diblokir).");
    } finally {
        if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
        if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
    }
};

handler.command = /^(tt|tiktok)$/i;
handler.help = ["tt <url>", "tiktok <url>"];
handler.tags = ["downloader"];
handler.register = true;
handler.limit = true;

module.exports = handler;