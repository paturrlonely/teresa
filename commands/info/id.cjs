const crypto = require('crypto');

const handler = async (m) => {
    try {
        const target = m.quoted ? m.quoted.sender : m.sender;

        // Default fallback
        let phoneNumber = target.split('@')[0];

        // Cek jika pesan dari grup
        if (m.isGroup && m.metadata) {
            const participant = m.metadata.participants.find(p => p.id === target);
            if (participant && participant.phoneNumber) {
                phoneNumber = participant.phoneNumber.split('@')[0]; // nomor asli
            }
        }

        const lid = crypto.createHash('md5').update(target).digest('hex').slice(0, 8).toUpperCase();

        const text = `🆔 *ID WhatsApp*:\n\n` +
            `• JID: \`${target}\`\n` +
            `• Phone Number: \`${phoneNumber}\`\n` +
            `• LID: \`${lid}\``;

        m.reply(text);

    } catch (err) {
        console.error("cekid Error:", err);
        m.reply("❌ Gagal mengambil ID.");
    }
};

handler.command = ['cekid', 'id'];
handler.tags = 'info';
handler.description = 'Cek ID WhatsApp kamu atau user lain via reply beserta LID.';
handler.owner = false;

module.exports = handler;