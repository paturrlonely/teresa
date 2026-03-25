let handler = async (m, {
    db
}) => {
    let userData = db.get("user", m.sender)

    if (!userData?.sticker || Object.keys(userData.sticker).length === 0) {
        return m.reply('◦❒ *Tidak ada command stiker*')
    }

    let teks = '◦❒ *LIST COMMAND STIKER*\n\n'
    let no = 1

    for (let hash in userData.sticker) {
        let v = userData.sticker[hash]
        if (!v) continue

        teks += `◦❒ ${no}. *${v.text}*\n`
        teks += `◦❒ Creator : ${v.creator.replace('@s.whatsapp.net', '')}\n`
        teks += `◦❒ Locked  : ${v.locked ? 'Ya' : 'Tidak'}\n`
        teks += `◦❒ Hash    : ${hash}\n`
        teks += `◦❒ At      : ${new Date(v.at).toLocaleString()}\n\n`

        no++
    }

    teks += `◦❒ Total : ${no - 1}`

    m.reply(teks)
}

handler.help = ['listcmd']
handler.tags = ['main']
handler.command = /^listcmd$/i
handler.premium = true

module.exports = handler