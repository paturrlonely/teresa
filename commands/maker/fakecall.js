import {
    createCanvas,
    loadImage
} from 'canvas'

let handler = async (m, {
    args,
    usedPrefix,
    command,
    conn
}) => {
    let [nama, durasi] = (args.join(' ') || '').split('|')
    if (!nama || !durasi) {
        return m.reply(`❌ Format salah!\nContoh:\n${usedPrefix}fakecall Z7|00:08`)
    }

    try {
        // ambil pp user
        let ppUrl
        try {
            ppUrl = await conn.profilePictureUrl(m.sender, 'image')
        } catch {
            // fallback kalau user ga punya PP
            ppUrl = 'https://files.catbox.moe/pmhptv.jpg'
        }

        const avatar = await loadImage(ppUrl)
        const bg = await loadImage('https://files.catbox.moe/pmhptv.jpg')

        const canvas = createCanvas(720, 1280)
        const ctx = canvas.getContext('2d')

        // background
        ctx.drawImage(bg, 0, 0, 720, 1280)

        // nama
        ctx.font = 'bold 40px sans-serif'
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.fillText(nama.trim(), 360, 150)

        // durasi
        ctx.font = '30px sans-serif'
        ctx.fillStyle = '#d1d1d1'
        ctx.fillText(durasi.trim(), 360, 200)

        // avatar bulat
        ctx.save()
        ctx.beginPath()
        ctx.arc(360, 635, 160, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(avatar, 200, 475, 320, 320)
        ctx.restore()

        const buffer = canvas.toBuffer()
        await conn.sendFile(m.chat, buffer, 'fakecall.jpg', 'awokawok halu 😹', m)

    } catch (e) {
        m.reply(`❌ Error\nLogs error : ${e.message}`)
    }
}

handler.command = ['fakecall']
handler.help = ['fakecall nama|durasi']
handler.tags = ['maker']

export default handler