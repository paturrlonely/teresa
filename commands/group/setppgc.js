import {
    createRequire
} from 'module'
const require = createRequire(import.meta.url)
const jimp = require('jimp')

let handler = async (m, {
    conn,
    command,
    usedPrefix
}) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    if (/image/g.test(mime) && !/webp/g.test(mime)) {
        try {
            let media = await q.download()
            let {
                img
            } = await pepe(media)

            await conn.updateProfilePicture(m.chat, img)

            m.reply(`Admin @${(m.sender || '').replace(/@s\.whatsapp\.net/g, '')} telah mengganti Icon Group!`, null, {
                mentions: [m.sender]
            })
        } catch (e) {
            console.error(e)
            m.reply(`Terjadi kesalahan saat mengubah icon grup.`)
        }
    } else {
        m.reply(`Kirim gambar dengan caption *${usedPrefix + command}* atau tag gambar yang sudah dikirim`)
    }
}

handler.help = ['setppgc', 'setppgcpanjang']
handler.tags = ['group']
handler.command = /^(setppgc|setppgcpanjang|setppgrup|setppgroup)$/i
handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler

async function pepe(media) {
    const jimpImage = await jimp.read(media)
    const min = jimpImage.getWidth()
    const max = jimpImage.getHeight()
    const cropped = jimpImage.crop(0, 0, min, max)
    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(jimp.MIME_JPEG),
        preview: await cropped.normalize().getBufferAsync(jimp.MIME_JPEG)
    }
}