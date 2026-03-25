let handler = async (m, {
    db
}) => {
    let userData = db.get("user", m.sender)

    if (!userData?.sticker || Object.keys(userData.sticker).length === 0)
        return m.reply('◦❒ *Kamu belum memiliki command stiker*')

    let total = Object.keys(userData.sticker).length

    m.reply(`◦❒ *Total command stiker kamu : ${total}*`)
}

handler.help = ['totalcmd']
handler.tags = ['main']
handler.command = /^(totalcmd|titalcmd)$/i
handler.premium = true

module.exports = handler