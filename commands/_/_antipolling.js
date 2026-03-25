export async function before(m, { isAdmin, isBotAdmin, db, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.get("group", m.chat) || {}

    
    const isPollCreateV2 = !!m.message?.pollCreationMessageV2
    const isPollCreateV3 = !!m.message?.pollCreationMessageV3

    const isPolling = isPollCreateV2 || isPollCreateV3

    if (group.antipolling === true && isPolling && isBotAdmin && !isAdmin) {
        try {
            
            await conn.sendMessage(m.chat, { delete: m.key })

            await m.reply(
                `🚫 @${m.sender.split("@")[0]} dilarang *membuat polling* di grup ini!`,
                { mentions: [m.sender] }
            )
        } catch (e) {
            console.error("[ANTIPOLLING] Gagal menghapus polling:", e)
        }
        return false
    }

    return true
}