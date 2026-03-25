let handler = async (m, {
    db
}) => {
    let userData = db.get("user", m.sender)

    if (!userData?.sticker || Object.keys(userData.sticker).length === 0)
        return m.reply('◦❒ *Kamu belum memiliki command stiker*')

    let teks = '◦❒ *LIST COMMAND STIKER KAMU*\n\n'
    let no = 1

    for (let hash in userData.sticker) {
        let v = userData.sticker[hash]
        if (!v) continue
        if (v.creator !== m.sender) continue

        teks += `◦❒ ${no}. *${v.text}*\n`
        teks += `◦❒ Locked : ${v.locked ? 'Ya' : 'Tidak'}\n`
        teks += `◦❒ Hash   : ${hash}\n\n`
        no++
    }

    if (no === 1)
        return m.reply('◦❒ *Kamu belum membuat command stiker*')

    teks += `◦❒ Total : ${no - 1}`

    m.reply(teks)
}

handler.help = ['mycmd']
handler.tags = ['main']
handler.command = /^mycmd$/i
handler.premium = true

module.exports = handler