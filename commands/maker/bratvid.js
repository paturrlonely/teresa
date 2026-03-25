import {
    sticker
} from '../../library/sticker.js';
import fetch from 'node-fetch';

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {

    if (!args[0]) {
        return m.reply(
            `Masukkan teks untuk stiker BratVid!\n\nContoh:\n${usedPrefix + command} Halo Bratvid`
        );
    }

    let text = args.join(' ');

    try {
        await conn.sendMessage(m.chat, {
            react: {
                text: global.loading,
                key: m.key
            }
        });
    } catch {}

    try {
        let apiUrl = `https://api.deline.web.id/maker/bratvid?text=${encodeURIComponent(text)}`;
        let res = await fetch(apiUrl);

        if (!res.ok) {
            return m.reply('Gagal mengambil stiker video dari API');
        }

        let buffer = await res.arrayBuffer();
        let stiker = await sticker(
            Buffer.from(buffer),
            false,
            global.wm,
            global.author
        );

        if (!stiker) {
            return m.reply('Gagal membuat stiker video.');
        }

        return conn.sendFile(
            m.chat,
            stiker,
            'BratSticker.webp',
            '',
            m
        );

    } catch (e) {
        return m.reply('Gagal membuat stiker Video, coba lagi nanti.');
    } finally {
        try {
            await conn.sendMessage(m.chat, {
                react: {
                    text: '✅',
                    key: m.key
                }
            });
        } catch {}
    }
};

handler.help = ['bratvid'];
handler.tags = ['maker'];
handler.command = /^(bratvid)$/i;
handler.limit = true;
handler.register = true;

export default handler;