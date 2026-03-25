let handler = async (m, {
    conn,
    command,
    text
}) => {
    if (!text) return conn.reply(m.chat, 'Masukan namamu!', m)

    let percent = Math.floor(Math.random() * 101)
    let desc = ''
    let gifUrl = ''

    if (percent < 20) {
        desc = 'Cowok banget! 😎'
        gifUrl = 'https://api.deline.web.id/V6H1gIXG5T.mp4'
    } else if (percent < 40) {
        desc = 'Ada aura lembutnya dikit~ 🌸'
        gifUrl = 'https://api.deline.web.id/L7wQOqDcGW.mp4'
    } else if (percent < 60) {
        desc = 'Lumayan femboy 😘'
        gifUrl = 'https://api.deline.web.id/NfP6NDaWOJ.mp4'
    } else if (percent < 80) {
        desc = 'Femboy sejati 💅✨'
        gifUrl = 'https://api.deline.web.id/rMeNZ8RC9H.mp4'
    } else {
        desc = 'FEMBOY DEWA 🔥💖'
        gifUrl = 'https://api.deline.web.id/lb45kSwNRw.mp4'
    }

    let teks = `
╭━━━━°「 Cek Femboy 」°
┃
┊• Nama : ${text}
┃• Persentase : ${percent}%
┊• Status : ${desc}
┃
╰═┅═━––––––๑
`.trim()

    await conn.sendMessage(m.chat, {
        video: {
            url: gifUrl
        },
        caption: teks,
        gifPlayback: true // penting supaya tampil seperti GIF
    }, {
        quoted: m
    })
}

handler.help = ['cekfemboy <nama>']
handler.tags = ['fun']
handler.command = /^cekfemboy/i

module.exports = handler