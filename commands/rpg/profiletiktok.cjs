let handler = async (m, {
    conn,
    db
}) => {
    const user = db.get("user", m.sender)

    if (!user?.tiktok?.username)
        return m.reply(
            'Kamu belum memiliki profil TikTok.\n' +
            'Gunakan *.createtiktok* terlebih dahulu.'
        )

    const tiktok = user.tiktok

    const formatNumber = (num = 0) =>
        num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    let pp
    try {
        pp = await conn.profilePictureUrl(m.sender, 'image')
    } catch {
        pp = 'https://i.ibb.co/2kR8bVH/avatar.png'
    }

    const caption = `
╭───〔 📱 TIKTOK PROFILE 〕───
│ 👤 Username : ${tiktok.username}
│ 🎂 Lahir    : ${tiktok.birthdate || '-'}
│ 🎥 Konten   : ${formatNumber(tiktok.konten)}
│ 👥 Followers: ${formatNumber(tiktok.follower)}
│ 💰 Uang     : Rp ${formatNumber(tiktok.money)}
│ ⏱ Upload   : ${
        tiktok.lastUpload
            ? new Date(tiktok.lastUpload).toLocaleString('id-ID')
            : 'Belum pernah'
    }
╰────────────────────────

📌 Buat konten dengan *.kontentiktok*
`.trim()

    await conn.sendMessage(
        m.chat, {
            image: {
                url: pp
            },
            caption
        }, {
            quoted: m
        }
    )
}

handler.command = /^profiletiktok$/i
handler.help = ['profiletiktok']
handler.tags = ['rpg']
handler.register = true
handler.group = true
handler.rpg = true

module.exports = handler