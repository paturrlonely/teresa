export async function before(m, { isAdmin, isBotAdmin, db, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.get("group", m.chat) || {}

    const isVideo = m.mtype === 'videoMessage' || m.type === 'videoMessage' || m.message?.videoMessage

    if (group.antivideo === true && isVideo && isBotAdmin && !isAdmin) {
        try {
            await conn.sendMessage(m.chat, { delete: m.key })
            await conn.sendMessage(m.chat, {
                text: `🚫 @${m.sender.split("@")[0]} dilarang mengirim video di grup ini!`,
                mentions: [m.sender]
            })
        } catch (e) {
            console.error("[ANTIVIDEO] Gagal menghapus video:", e)
        }
        return false
    }

    return true
}