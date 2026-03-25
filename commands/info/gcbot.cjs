const handler = async (m, {
    conn
}) => {

    const groupLink = global.linkgc || 'https://chat.whatsapp.com/defaultlink';
    const thumb = global.thumb;

    await conn.sendMessage(m.chat, {
        text: `👋 *Join the Official Bot Group!*\n\nGet latest updates, info, and support:\n${groupLink}`,
        contextInfo: {
            externalAdReply: {
                title: '🌐 Official Group',
                body: 'Click the link above to join the community!',
                thumbnailUrl: thumb,
                sourceUrl: groupLink,
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: true
            }
        }
    }, {
        quoted: m
    });

};

handler.help = ["gcbot"];
handler.tags = ["info"];
handler.command = ["gcbot", "groupbot", "botgc"];

module.exports = handler;