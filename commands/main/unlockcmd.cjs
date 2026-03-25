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
    if (!userData?.sticker)
        return m.reply('◦❒ Tidak ada command stiker')

    const hash = Buffer.from(sha).toString('base64')
    let data = userData.sticker[hash]

    if (!data)
        return m.reply('◦❒ Command stiker tidak ditemukan')

    if (!data.locked)
        return m.reply('◦❒ Command stiker tidak terkunci')

    // hanya creator
    if (data.creator !== m.sender)
        return m.reply('◦❒ Kamu bukan pembuat command ini')

    data.locked = false
    await db.set("user", m.sender, userData)

    m.reply(`◦❒ *Command stiker berhasil dibuka* 🔓\n◦❒ Nama : *${data.text}*`)
}

handler.help = ['unlockcmd']
handler.tags = ['main']
handler.command = /^unlockcmd$/i
handler.premium = true

module.exports = handler