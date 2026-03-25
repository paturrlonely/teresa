export async function before(m, { isAdmin, isBotAdmin, db, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.get("group", m.chat) || {}

    const isPhoto = m.mtype === 'imageMessage' || m.type === 'imageMessage' || m.message?.imageMessage

    if (group.antifoto === true && isPhoto && isBotAdmin && !isAdmin) {
        try {
            await conn.sendMessage(m.chat, { delete: m.key })
            await conn.sendMessage(m.chat, {
                text: `🚫 @${m.sender.split("@")[0]} dilarang mengirim foto di grup ini!`,
                mentions: [m.sender]
            })
        } catch (e) {
            console.error("[ANTIFOTO] Gagal menghapus foto:", e)
        }
        return false
    }

    return true
}