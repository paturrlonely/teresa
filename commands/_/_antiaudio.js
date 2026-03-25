export async function before(m, { isAdmin, isBotAdmin, db, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.get("group", m.chat) || {}

    const isAudio = m.mtype === 'audioMessage' || m.type === 'audioMessage' || m.message?.audioMessage

    if (group.antiaudio === true && isAudio && isBotAdmin && !isAdmin) {
        try {
            await conn.sendMessage(m.chat, { delete: m.key })
            await conn.sendMessage(m.chat, {
                text: `🚫 @${m.sender.split("@")[0]} dilarang mengirim audio di grup ini!`,
                mentions: [m.sender]
            })
        } catch (e) {
            console.error("[ANTIAUDIO] Gagal menghapus audio:", e)
        }
        return false
    }

    return true
}