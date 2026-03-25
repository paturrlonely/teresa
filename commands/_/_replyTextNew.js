const handler = {}

handler.before = async function (m, { db, conn }) {
    if (m.isBaileys) return
    if (m.fromMe) return
    if (!m.quoted || !m.quoted.fromMe) return

    const botConfig = db.get('bots', 'config')
    if (!botConfig) return

    const replyTexts = botConfig.replyText || {}

    const regexPattern = text =>
        new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

    const quotedText = m.quoted.text || ''

    const id = Object.keys(replyTexts).find(v => {
        const baseText = replyTexts[v]?.text
        if (!baseText) return false
        return regexPattern(baseText).test(quotedText)
    })

    if (!id) return

    const replyText = replyTexts[id]

    if (!replyText.input) {
        if (replyText.command) {
            replyText.input = true

            const command = replyText.command.replace('INPUT', m.text)
            conn.preSudo(command, m.sender, m).then(_ => {
                conn.ev.emit('messages.upsert', _)
            })
        } 
        else if (Array.isArray(replyText.list)) {
            const command = replyText.list.find(
                v => v[1]?.toLowerCase() === m.text.toLowerCase()
            )

            if (command) {
                conn.preSudo(command[0], m.sender, m).then(_ => {
                    conn.ev.emit('messages.upsert', _)
                })
            }
        }

        botConfig.replyText[id] = replyText
        await db.set('bots', 'config', botConfig)
    }
}

export default handler