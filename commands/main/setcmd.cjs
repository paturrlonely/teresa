let handler = async (m, {
    text,
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

    if (!text)
        return m.reply(
            `◦❒ Penggunaan:\n${usedPrefix + command} <teks>\n\n◦❒ Contoh:\n${usedPrefix + command} menu`
        )

    text = text.trim().toLowerCase()
    if (text.length > 30)
        return m.reply('◦❒ Nama command maksimal 30 karakter')

    let userData = db.get("user", m.sender) || {}
    if (!userData.sticker) userData.sticker = {}

    const hash = Buffer.from(sha).toString('base64')

    if (userData.sticker[hash]?.locked)
        return m.reply('◦❒ Command stiker ini terkunci')

    for (let h in userData.sticker) {
        if (userData.sticker[h]?.text === text && h !== hash) {
            return m.reply(`◦❒ Command *${text}* sudah digunakan`)
        }
    }

    userData.sticker[hash] = {
        text,
        mentionedJid: m.mentionedJid || [],
        creator: m.sender,
        at: Date.now(),
        locked: false
    }

    await db.set("user", m.sender, userData)

    m.reply(`◦❒ *Command stiker berhasil disimpan*\n◦❒ Nama : *${text}*`)
}

handler.help = ['setcmd <teks>']
handler.tags = ['main']
handler.command = /^setcmd$/i
handler.premium = true

module.exports = handler