const handler = async (m, {
    conn,
    command,
    usedPrefix
}) => {
    const q = (m.quoted && m.quoted.download) ? m.quoted : m;

    const mime = (q.msg || q)?.mimetype || "";
    if (!mime || !/^(image|video|audio)\//i.test(mime)) {
        return m.reply(`Please send or reply to an image, video, or audio.\nExample: ${usedPrefix}${command} <caption>`);
    }

    let buffer;
    try {
        buffer = await q.download();
    } catch (e) {
        return m.reply("Failed to retrieve the media.");
    }

    let type = null;
    if (mime.startsWith("image/")) type = "image";
    else if (mime.startsWith("video/")) type = "video";
    else if (mime.startsWith("audio/")) type = "audio";

    if (!type) return m.reply("Unsupported media type.");

    const rawText = m.text || "";
    const caption = rawText.replace(new RegExp(`^${usedPrefix}${command}\\s*`, "i"), "").trim();

    const mentionedJid = [...caption.matchAll(/@(\d{5,})/g)].map(v => `${v[1]}@s.whatsapp.net`);
    const contextInfo = mentionedJid.length ? {
        mentionedJid
    } : {};

    await conn.sendMessage(
        m.chat, {
            [type]: buffer,
            mimetype: mime,
            caption,
            contextInfo,
            viewOnce: true
        }, {
            quoted: m
        }
    );
};

handler.help = ["svo"];
handler.tags = ["tools"];
handler.command = /^(send(view(once)?)?|svo)$/i;

module.exports = handler;