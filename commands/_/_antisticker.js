export async function before(m, { isAdmin, isBotAdmin, db, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.get("group", m.chat) || {}

    const isSticker =
        m.mtype === 'stickerMessage' ||
        m.type === 'stickerMessage' ||
        m.message?.stickerMessage

    if (
        group.antiSticker === true &&
        isSticker &&
        isBotAdmin &&
        !isAdmin
    ) {
        await conn.sendMessage(m.chat, { delete: m.key })
        return false
    }

    return true
}