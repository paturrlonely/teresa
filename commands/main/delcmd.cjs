let handler = async (m, {
    usedPrefix,
    command,
    db
}) => {
    let q = m.quoted || m

    const isSticker =
        q?.mtype === 'stickerMessage' ||
        q?.type === 'stickerMessage' ||
        q?.message?.stickerMessage

    if (!isSticker)
        return m.reply(`◦❒ Balas stiker dengan perintah *${usedPrefix + command}*`)

    const sha =
        q.fileSha256 ||
        q.fileEncSha256 ||
        q.message?.stickerMessage?.fileSha256 ||
        q.message?.stickerMessage?.fileEncSha256

    if (!sha)
        return m.reply('◦❒ *SHA256 hash tidak ditemukan*')

    let userData = db.get("user", m.sender)
    if (!userData?.sticker || Object.keys(userData.sticker).length === 0)
        return m.reply('◦❒ Tidak ada command stiker')

    const hash = Buffer.from(sha).toString('base64')

    if (!userData.sticker[hash])
        return m.reply('◦❒ Command stiker tidak ditemukan')

    if (userData.sticker[hash].locked)
        return m.reply('◦❒ Command stiker ini terkunci')

    let nama = userData.sticker[hash].text

    delete userData.sticker[hash]
    await db.set("user", m.sender, userData)

    m.reply(`◦❒ Command stiker *${nama}* berhasil dihapus`)
}

handler.help = ['delcmd']
handler.tags = ['main']
handler.command = /^delcmd$/i
handler.premium = true

module.exports = handler