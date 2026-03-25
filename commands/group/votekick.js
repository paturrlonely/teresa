const handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    conn.votekick = conn.votekick || {};
    let who;

    if (!m.isGroup) return m.reply("*[ ! ] Command ini hanya bisa digunakan di group!*");

    try {
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants;

        // 1. Target dari mention atau reply
        who = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : undefined);

        // 2. Target dari nomor telepon
        if (!who && m.text) {
            const input = m.text.trim().split(/\s+/)[1];
            if (input) {
                const phone = input.replace(/[^0-9]/g, '');
                who = phone + '@s.whatsapp.net';
                if (!participants.some(p => p.jid === who)) who = undefined;
            }
        }

        if (!who) {
            return m.reply(`*• Target tidak valid atau tidak ditemukan di group.*\nContoh:\n${usedPrefix}${command} @user\natau reply pesan\natau ketik nomor telepon anggota`);
        }

        const targetParticipant = participants.find(p => p.jid === who);
        const targetName = targetParticipant?.name || who.split("@")[0];

        // Cek jika target admin atau bot
        if (targetParticipant?.admin || who === conn.user.jid) {
            return m.reply("*[ ! ] Kamu tidak bisa vote kick mereka*");
        }

        // Tambah vote
        if (!conn.votekick[who]) {
            conn.votekick[who] = {
                vote: 1
            };
        } else {
            conn.votekick[who].vote += 1;
        }

        // Threshold vote = 3
        if (conn.votekick[who].vote >= 3) {
            try {
                await conn.groupParticipantsUpdate(m.chat, [who], "remove");
                delete conn.votekick[who];
                m.reply(`*[ VOTE KICK MEMBER ${targetName} ]*\nHas been kicked from the group.`);
            } catch (error) {
                console.error("Error kicking member:", error);
                m.reply("*• Terjadi kesalahan saat menghapus member. Pastikan bot adalah admin.*");
            }
        } else {
            m.reply(`*[ VOTE KICK MEMBER ${targetName} ]*\n*(${conn.votekick[who].vote}/3)* Vote lagi dan mereka akan di-kick dari group!`);
        }

    } catch (error) {
        console.error("Error processing votekick:", error);
        m.reply("*[ ! ] Terjadi kesalahan. Coba lagi nanti.*");
    }
};

handler.help = ["votekick"].map(a => a + " [@user|reply|nomor]");
handler.tags = ["group"];
handler.command = ["votekick"];
handler.botAdmin = true;
handler.group = true;

export default handler;