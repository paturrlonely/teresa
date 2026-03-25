const axios = require("axios");

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        if (!text) return m.reply(`Gunakan perintah:\n${usedPrefix}${command} <prompt>\nBalas ke foto atau kirim link foto`);

        let quoted = m.quoted ? m.quoted : null;
        let imageUrl;

        if (quoted && (
                quoted.mtype === "imageMessage" ||
                quoted.type === "imageMessage" ||
                quoted.message?.imageMessage
            )) {
            const buffer = await quoted.download();
            if (!buffer || buffer.length < 1024) return m.reply("Foto terlalu kecil atau tidak valid 😢");

            const FormData = require("form-data");
            const form = new FormData();
            form.append("file", buffer, "image.jpg");

            const upRes = await axios.post(
                "https://tmpfiles.org/api/v1/upload",
                form, {
                    headers: {
                        ...form.getHeaders(),
                        "User-Agent": "Mozilla/5.0"
                    },
                    timeout: 20000
                }
            );

            if (!upRes.data?.data?.url) return m.reply("Gagal upload foto 😢");

            imageUrl = upRes.data.data.url.replace("http://", "https://").replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/");
        } else if (text.startsWith("http")) {
            imageUrl = text;
            text = text.split(" ").slice(1).join(" ");
            if (!text) return m.reply(`Tambahkan prompt untuk edit:\n${usedPrefix}${command} <prompt>`);
        } else {
            return m.reply(`Balas foto atau kirim link foto dengan prompt:\n${usedPrefix}${command} <prompt>`);
        }

        const prompt = text;
        await m.reply("⏳ Sedang memproses foto, mohon tunggu...");

        const apiRes = await axios.get("https://api-faa.my.id/faa/editfoto", {
            params: {
                url: imageUrl,
                prompt
            },
            responseType: "arraybuffer"
        });

        if (!apiRes.data || apiRes.data.byteLength < 1024) {
            return m.reply("Gagal memproses foto 😢");
        }

        const editedImage = Buffer.from(apiRes.data);
        await conn.sendMessage(m.chat, {
            image: editedImage,
            caption: `✨ *Edited Image*\nPrompt: ${prompt}`
        });

    } catch (e) {
        m.reply("Terjadi error saat memproses foto 😢");
    }
};

handler.help = ['editimg <prompt>'];
handler.tags = ['ai'];
handler.command = /^editimg$/i;
handler.limit = true;
handler.premium = true;

module.exports = handler;