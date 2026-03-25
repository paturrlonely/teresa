let handler = async (m, {
    conn
}) => {
    try {

        const groupMetadata = await conn.groupMetadata(m.chat);
        if (!groupMetadata)
            return await conn.sendMessage(m.chat, {
                text: "⚠️ Tidak bisa mendapatkan info grup."
            }, {
                quoted: m
            });


        let pp = await conn.profilePictureUrl(m.chat, "image").catch(() => "https://cloudkuimages.guru/uploads/images/pg5XDGVr.jpg");

        const {
            subject,
            participants
        } = groupMetadata;
        const groupAdmins = participants.filter((p) => p.admin === "admin" || p.admin === "superadmin");
        const mentionJids = groupAdmins.map((p) => p.id);


        let listAdmin = groupAdmins
            .map((v, i) => `*◦❒ ${i + 1}.* @${v.id.split("@")[0]}`)
            .join("\n");

        let caption = `
*╭─❁ Daftar Admin Grup ❁*
*◦❒ Grup: ${subject}*
*◦❒*
${listAdmin}
*╰─────────────❁*
`.trim();


        await conn.sendMessage(
            m.chat, {
                image: {
                    url: pp
                },
                caption,
                mentions: mentionJids,
            }, {
                quoted: m
            }
        );

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, {
            text: "⚠️ Terjadi error saat mengambil daftar admin."
        }, {
            quoted: m
        });
    }
};

handler.help = ["tagadmin"];
handler.tags = ["group"];
handler.command = ["tagadmin", "listadmin"];
handler.group = true;
handler.admin = true;

module.exports = handler