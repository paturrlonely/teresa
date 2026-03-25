let handler = async (m, {
    conn
}) => {
    try {
        const groupMetadata = await conn.groupMetadata(m.chat)
        if (!groupMetadata) {
            return await conn.sendMessage(m.chat, {
                text: "⚠️ Tidak bisa mendapatkan info grup."
            }, {
                quoted: m
            })
        }

        // PP Grup
        let pp = await conn.profilePictureUrl(m.chat, "image")
            .catch(() => "https://cloudkuimages.guru/uploads/images/pg5XDGVr.jpg")

        const {
            subject
        } = groupMetadata

        let caption = `
*╭─❁ Info Grup ❁*
*│ Nama Grup: ${subject}*
*╰─❁*
`.trim()

        await conn.sendMessage(m.chat, {
            image: {
                url: pp
            },
            caption
        }, {
            quoted: m
        })

    } catch (err) {
        console.error(err)
        await conn.sendMessage(m.chat, {
            text: "⚠️ Terjadi error saat mengambil info grup."
        }, {
            quoted: m
        })
    }
}

handler.help = ["getppgc"]
handler.tags = ["group"]
handler.command = ["getppgc"]
handler.group = true
handler.admin = true

module.exports = handler