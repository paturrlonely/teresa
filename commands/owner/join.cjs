const handler = async (m, {
    conn,
    text,
    args
}) => {
    const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
    const link = (args[0] || text).match(linkRegex);

    if (!link) {
        throw '⚠️ Invalid invitation link. Please provide a valid WhatsApp group link.';
    }

    const code = link[1];

    try {
        await m.reply('🟢 Joining group, please wait...');

        // Gabung grup
        const res = await conn.groupAcceptInvite(code);

        // Ambil group ID dari response
        const groupId = res?.gid || res?.id || 'Unknown';

        await m.reply(`✅ Successfully joined group!\nGroup ID: ${groupId}`);

    } catch (e) {
        console.error(e);
        throw '❌ Failed to join the group. The link might be invalid, revoked, the group might be full, or I might have been removed previously.';
    }
};

handler.command = ['join', 'joingc'];
handler.description = 'Join a WhatsApp group via an invitation link.';
handler.tags = ['owner'];
handler.help = ['join <chat.whatsapp.com link>'];
handler.args = true;
handler.owner = true;

module.exports = handler;