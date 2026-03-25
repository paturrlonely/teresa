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
        return m.reply(`◦❒ Balas stiker dengan perintah *${usedPrefix + command} <nama baru>*`)

    const sha =
        q.fileSha256 ||
        q.fileEncSha256 ||
        q.message?.stickerMessage?.fileSha256 ||
        q.message?.stickerMessage?.fileEncSha256

    if (!sha)
        return m.reply('◦❒ *SHA256 hash tidak ditemukan*')

    if (!text)
        return m.reply(
            `◦❒ Penggunaan:\n${usedPrefix + command} <nama baru>\n\n◦❒ Contoh:\n${usedPrefix + command} menu`
        )

    text = text.trim().toLowerCase()
    if (text.length > 30)
        return m.reply('◦❒ Nama command maksimal 30 karakter')

    let userData = db.get("user", m.sender)
    if (!userData?.sticker)
        return m.reply('◦❒ Tidak ada command stiker')

    const hash = Buffer.from(sha).toString('base64')
    let data = userData.sticker[hash]

    if (!data)
        return m.reply('◦❒ Command stiker tidak ditemukan')

    // 🔒 cek lock
    if (data.locked)
        return m.reply('◦❒ Command stiker terkunci')

    // 👤 hanya creator
    if (data.creator !== m.sender)
        return m.reply('◦❒ Kamu bukan pembuat command ini')

    // ❌ cegah duplikat nama
    for (let h in userData.sticker) {
        if (userData.sticker[h]?.text === text && h !== hash)
            return m.reply(`◦❒ Command *${text}* sudah digunakan`)
    }

    let oldName = data.text
    data.text = text
    data.at = Date.now()

    await db.set("user", m.sender, userData)

    m.reply(
        `◦❒ *Command stiker berhasil diubah*\n` +
        `◦❒ Dari : *${oldName}*\n` +
        `◦❒ Ke   : *${text}*`
    )
}

handler.help = ['editcmd <nama baru>']
handler.tags = ['main']
handler.command = /^editcmd$/i
handler.premium = true

module.exports = handler