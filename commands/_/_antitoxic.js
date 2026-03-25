const toxicRegex =
/anj(k|g)|ajn?(g|k)|a?njin(g|k)|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole/i

export async function before(m, { db, conn, isAdmin, isBotAdmin }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true
    if (!m.text) return true

    const group = db.get("group", m.chat) || {}
    const isToxic = toxicRegex.test(m.text)

    if (
        group.antiToxic === true &&
        isToxic &&
        !isAdmin
    ) {
        if (isBotAdmin) {
            await conn.sendMessage(m.chat, { delete: m.key })
        }

        await conn.sendMessage(
            m.chat,
            { text: '◦❒ *Jangan toxic ya di grup ini!*' },
            { quoted: m }
        )

        return false
    }

    return true
}