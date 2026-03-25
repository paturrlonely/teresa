export async function before(m, { isAdmin, isBotAdmin, db, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.get("group", m.chat) || {}

    let mediaType = null

    if (m.message?.imageMessage) mediaType = 'foto'
    else if (m.message?.videoMessage) mediaType = 'video'
    else if (m.message?.audioMessage)
        mediaType = m.message.audioMessage.ptt ? 'voice note' : 'audio'
    else if (m.message?.stickerMessage) mediaType = 'stiker'
    else if (m.message?.documentMessage) mediaType = 'dokumen'
    else if (m.message?.gifMessage) mediaType = 'gif'

    const isMedia = !!mediaType

    if (group.antimedia === true && isMedia && isBotAdmin && !isAdmin) {
        try {
            await conn.sendMessage(m.chat, { delete: m.key })
            await m.reply(`🚫 @${m.sender.split("@")[0]} dilarang mengirim *${mediaType}* di grup ini!`, {
                mentions: [m.sender]
            })
        } catch (e) {
            console.error("[ANTIMEDIA] Gagal menghapus media:", e)
        }
        return false
    }

    return true
}