const handler = async (m, {
    conn,
    text
}) => {
    if (!m.isGroup) throw '❌ Command ini hanya bisa digunakan di grup!';

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
    const participants = groupMetadata?.participants || [];
    if (!participants.length) throw '❌ Tidak bisa mengambil daftar anggota grup.';

    const users = participants.map(p => p.id).filter(id => id !== conn.user.jid);

    if (m.quoted && m.quoted.message) {
        const q = m.quoted;
        const msgText = q.text?.trim() || q.caption?.trim() || q.message?.conversation?.trim();

        if (msgText) {
            // Reply text
            await conn.sendMessage(
                m.chat, {
                    text: msgText,
                    mentions: users
                }, {
                    quoted: m
                }
            );
        } else {
            // Reply media
            try {
                await conn.copyNForward(
                    m.chat,
                    m.quoted, {
                        contextInfo: {
                            mentionedJid: users
                        },
                        quoted: m
                    }
                );
            } catch (err) {
                console.error(err);
                return m.reply('⚠️ Tidak bisa mengirim ulang media.');
            }
        }
    } else {
        // Text biasa
        const message = text?.trim() || '';
        await conn.sendMessage(
            m.chat, {
                text: message,
                mentions: users
            }, {
                quoted: m
            }
        );
    }
};

handler.command = ['hidetag', 'ht'];
handler.description = 'Tag all group members; bisa text, reply text, atau reply media.';
handler.category = 'group';
handler.tags = ['group'];
handler.group = true;
handler.admin = true;

module.exports = handler;