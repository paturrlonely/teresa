const {
    areJidsSameUser
} = require('baileys');

const decodeJid = (jid) => jid ? jid.replace(/:.*$/, '') : jid;

const handler = async (m, {
    conn,
    text
}) => {
    let who = m.quoted ? m.quoted.sender :
        m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] :
        text ? (text.replace(/\D/g, '') + '@s.whatsapp.net') :
        '';

    if (!who || who === m.sender) return m.reply('❌ Reply / tag yang ingin di demote');

    const metadata = m.metadata;
    if (!metadata) return m.reply("⚠️ Metadata grup tidak ditemukan.");

    const botJid = decodeJid(conn.user?.id);
    const ownerGroup = metadata.owner || m.chat.split("-")[0] + "@s.whatsapp.net";

    if (areJidsSameUser(who, ownerGroup)) return m.reply("❌ Tidak bisa mendemote Owner Grup");
    if (areJidsSameUser(who, botJid)) return m.reply("❌ Tidak bisa mendemote Bot sendiri");

    try {
        await conn.groupParticipantsUpdate(m.chat, [who], 'demote');
        m.reply(`✔ Berhasil mendemote @${who.split("@")[0]}`, {
            mentions: [who]
        });
    } catch (e) {
        console.error("Demote Error:", e);
        m.reply("⚠️ Gagal mendemote pengguna. Pastikan bot admin dan target masih ada di grup.");
    }
};

handler.help = ['demote @tag'];
handler.tags = ['group'];
handler.command = ['demote', 'dm'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

module.exports = handler;