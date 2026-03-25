const axios = require('axios');
const FormData = require('form-data');

async function wastedGenerator(inputBuffer, options = {}) {
    if (!inputBuffer) {
        throw new Error("Input gambar kosong");
    }

    const buffer = Buffer.isBuffer(inputBuffer) ?
        Buffer.from(inputBuffer) :
        Buffer.from(new Uint8Array(inputBuffer));

    const {
        bannerTopPercent = 50,
            bannerWidthPercent = 80,
            isPublic = false
    } = options;

    const form = new FormData();
    form.append("image", buffer, {
        filename: "image.jpg",
        contentType: "image/jpeg"
    });

    form.append("bannerTopPercent", String(bannerTopPercent));
    form.append("bannerWidthPercent", String(bannerWidthPercent));
    form.append("isPublic", String(isPublic));

    try {
        const res = await axios.post(
            "https://wastedgenerator.com/generate",
            form, {
                headers: {
                    ...form.getHeaders(),
                    origin: "https://wastedgenerator.com",
                    referer: "https://wastedgenerator.com/",
                    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107 Safari/537.36"
                },
                maxBodyLength: Infinity,
                timeout: 60000
            }
        );

        if (!res.data?.success) {
            throw new Error("API gagal membuat gambar");
        }

        return {
            success: true,
            url: "https://wastedgenerator.com" + res.data.filePath,
            filePath: res.data.filePath
        };
    } catch (error) {
        console.error("Error pada wastedGenerator:", error);
        throw new Error("Gagal menghubungi server pembuat gambar.");
    }
}

const handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || q.mediaType || '';

    if (!/^image/.test(mime)) {
        return m.reply(`📷 Kirim gambar dengan caption *${usedPrefix + command}* atau tag gambar yang sudah dikirim.`);
    }

    try {
        m.reply('⏳wett..');

        const imgBuffer = await q.download();

        const result = await wastedGenerator(imgBuffer, {
            bannerTopPercent: 50,
            bannerWidthPercent: 80,
            isPublic: false
        });

        if (!result.success || !result.url) {
            throw new Error("Gagal mendapatkan URL gambar hasil.");
        }

        await conn.sendMessage(m.chat, {
            image: {
                url: result.url
            },
            caption: '🔫 *Wasted!*'
        }, {
            quoted: m
        });

    } catch (e) {
        console.error('Error:', e);
        m.reply('🚨 Error: ' + (e.message || e));
    }
};

handler.help = ['wasted'];
handler.tags = ['maker'];
handler.command = ['wasted'];
handler.limit = true;
handler.register = true;

module.exports = handler;