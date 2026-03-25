const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");

const API_BASE = "https://api.neoxr.eu";
const API_KEY = "JSj9av";

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
    const tmpInput = path.join(tmpDir, `${Date.now()}.input`);
    const tmpOutput = path.join(tmpDir, `${Date.now()}.opus`);

    try {
        if (!text) {
            return m.reply(`Contoh:\n${usedPrefix + command} komang`);
        }

        await m.reply("🎵 *Mencari & memproses audio...*");

        const apiUrl = `${API_BASE}/api/play?q=${encodeURIComponent(text)}&apikey=${API_KEY}`;
        const {
            data
        } = await axios.get(apiUrl);

        if (!data?.status || !data?.data?.url) {
            return m.reply("❌ Lagu tidak ditemukan.");
        }

        const res = await axios.get(data.data.url, {
            responseType: "arraybuffer"
        });
        fs.writeFileSync(tmpInput, Buffer.from(res.data));

        await new Promise((resolve, reject) => {
            ffmpeg(tmpInput)
                .noVideo()
                .audioCodec("libopus")
                .audioBitrate("64k")
                .audioChannels(1)
                .format("opus")
                .on("end", resolve)
                .on("error", reject)
                .save(tmpOutput);
        });

        const audioBuffer = fs.readFileSync(tmpOutput);

        await conn.sendMessage(
            m.chat, {
                text: `
🎧 *PLAY MUSIC*
▢ *Judul:* ${data.title}
▢ *Channel:* ${data.channel}
▢ *Durasi:* ${data.fduration}
▢ *Quality:* ${data.data.quality}
▢ *Size:* ${data.data.size}
        `.trim()
            }, {
                quoted: m
            }
        );

        await conn.sendMessage(
            m.chat, {
                audio: audioBuffer,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true
            }, {
                quoted: m
            }
        );

    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal memproses audio.");
    } finally {
        if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
        if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
    }
};

handler.help = ["play2 <judul lagu>"];
handler.tags = ["downloader"];
handler.command = /^(play2)$/i;
handler.limit = true;
handler.register = true;

module.exports = handler;