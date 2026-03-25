const axios = require("axios");

const FGSI_API_KEY = global.fgsi || "fgsiapi-ISI_APIKEY_KAMU";

let handler = async (m, { text, usedPrefix, command }) => {
    let input = m.quoted ? m.quoted.text : text;

    if (!input) {
        return m.reply(`Masukkan atau reply URL!\n\nContoh:\n${usedPrefix + command} https://subs4unlock.id/xxxx`);
    }

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    let match = input.match(urlRegex);
    if (!match) return m.reply("❌ Tidak ditemukan URL.");

    let url = match[0];

    if (url.includes("subs4unlock.id")) {
        let currentUrl = url;
        let finalUrl = currentUrl;

        try {
            await m.reply("⏳ Sedang membypass link Sub4Unlock, mohon tunggu...");

            while (true) {
                if (!finalUrl.includes("subs4unlock.id")) break;

                let apiUrl = `https://fgsi.dpdns.org/api/tools/skip/sub4unlock?apikey=${FGSI_API_KEY}&url=${encodeURIComponent(finalUrl)}`;
                let { data } = await axios.get(apiUrl, { timeout: 30000 });

                if (!data || !data.status) break;
                if (!data?.data?.linkGo) break;

                let nextUrl = data.data.linkGo;
                if (nextUrl === finalUrl) break;

                finalUrl = nextUrl;
            }

            if (finalUrl.includes("subs4unlock.id")) {
                return m.reply("⚠️ Tidak bisa menghilangkan link Sub4Unlock sepenuhnya.");
            }

            return m.reply(
                `✅ *Link Sub4Unlock berhasil dibypass!*\n\n🔗 Asal:\n${currentUrl}\n\n🚀 Final:\n${finalUrl}`
            );

        } catch (err) {
            console.error(err);
            return m.reply("❌ Terjadi kesalahan saat memproses Sub4Unlock.");
        }
    }

    let apiUrl = `https://fgsi.dpdns.org/api/tools/skip/tutwuri?apikey=${FGSI_API_KEY}&url=${encodeURIComponent(url)}`;

    try {
        await m.reply("⏳ Sedang membypass link, mohon tunggu...");

        let { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (!data || !data.status) {
            return m.reply("❌ Gagal bypass link (API error atau link tidak didukung).");
        }

        let result = data?.data?.url;
        if (!result) return m.reply("❌ URL hasil tidak ditemukan.");

        return m.reply(
            `✅ *Link berhasil dibypass!*\n\n🔗 Asal:\n${url}\n\n🚀 Hasil:\n${result}`
        );

    } catch (err) {
        console.error(err);
        return m.reply("❌ Terjadi kesalahan saat memproses link.");
    }
};

handler.help = ['skiplink <url>'];
handler.tags = ['tools'];
handler.command = /^(skiplink)$/i;
handler.description = 'Bypass link Sub4Unlock, SFL, dan Tutwuri otomatis';
handler.register = true
handler.limit = true
module.exports = handler;