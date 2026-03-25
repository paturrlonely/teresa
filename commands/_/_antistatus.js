export async function before(m, { isAdmin, isBotAdmin, db, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.get("group", m.chat) || {}

    const isTag = m.mtype === 'groupStatusMentionMessage' || m.type === 'groupStatusMentionMessage' || m.message?.groupStatusMentionMessage

    if (group.antitagsw === true && isTag && isBotAdmin && !isAdmin) {
        try {
            await conn.sendMessage(m.chat, { delete: m.key })

            await conn.sendMessage(m.chat, {
                text: `🚫 @${m.sender.split("@")[0]} dilarang menandai member di grup ini!`,
                mentions: [m.sender]
            })
        } catch (e) {
            console.error("[ANTITAGSW] Gagal menghapus pesan tag:", e)
        }
        return false
    }

    return true
}