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

    let data = userData.sticker[hash]
    if (!data)
        return m.reply('◦❒ Command stiker tidak ditemukan')

    let teks =
        `◦❒ *INFO COMMAND STIKER*

◦❒ Nama    : *${data.text}*
◦❒ Creator : @${data.creator.split('@')[0]}
◦❒ Locked  : ${data.locked ? 'Ya 🔒' : 'Tidak'}
◦❒ Hash    : ${hash}
◦❒ Dibuat  : ${new Date(data.at).toLocaleString()}
`

    await m.reply(teks, {
        mentions: [data.creator]
    })
}

handler.help = ['infocmd']
handler.tags = ['main']
handler.command = /^infocmd$/i
handler.premium = true

module.exports = handler