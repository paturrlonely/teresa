let handler = async (m, {
    db
}) => {
    let userData = db.get("user", m.sender)

    if (!userData?.sticker || Object.keys(userData.sticker).length === 0) {
        return m.reply('◦❒ *Tidak ada command stiker untuk direset*')
    }

    let total = Object.keys(userData.sticker).length

    userData.sticker = {} // 🔥 reset total
    await db.set("user", m.sender, userData)

    m.reply(`◦❒ *Berhasil reset command stiker*\n◦❒ Total dihapus : ${total}`)
}

handler.help = ['resetcmd']
handler.tags = ['main']
handler.command = /^resetcmd$/i
handler.premium = true

module.exports = handler