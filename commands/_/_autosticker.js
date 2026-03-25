import { addExif, sticker } from '../../library/sticker.js'

export async function before(m, { db, conn }) {
    try {
        if (m.isBaileys || m.fromMe) return true
        if (!m.isGroup) return true

        const group = db.get("group", m.chat) || {}
        if (!group.autosticker) return true

        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || q.mediaType || ''
        if (!mime) return true

        const buffer = await q.download?.()
        if (!buffer || buffer.length < 1024) return true

        let stiker

        if (/webp/g.test(mime)) {
            stiker = await addExif(buffer, global.wm || '', global.author || '')
        } else if (/image/g.test(mime)) {
            stiker = await sticker(buffer, null, global.wm || '', global.author || '')
        }

        if (!stiker) return true

        await conn.sendMessage(m.chat, { sticker: stiker })

    } catch (e) {
        console.error('[AUTOSTICKER ERROR]', e)
    }

    return true
}