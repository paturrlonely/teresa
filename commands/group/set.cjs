let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    args,
    db
}) => {
    const chatId = global.decodeChat ?
        global.decodeChat(m, conn) :
        (conn?.decodeJid ? conn.decodeJid(m.chat) : m.chat)

    let groupData = db.get('group', chatId)
    if (!groupData) {
        groupData = {}
        await db.set('group', chatId, groupData)
    }

    const type = (args[0] || '').toLowerCase()
    const value = text.replace(args[0], '').trim()

    if (!['welcome', 'bye', 'promote', 'demote'].includes(type)) {
        return m.reply(
            `Gunakan:\n\n` +
            `${usedPrefix + command} welcome teks\n` +
            `${usedPrefix + command} bye teks\n` +
            `${usedPrefix + command} promote teks\n` +
            `${usedPrefix + command} demote teks\n\n` +
            `Tag yang tersedia:\n@user @actor @group @count`
        )
    }

    if (!value) {
        return m.reply(
            `Teksnya mana?\n\nContoh:\n${usedPrefix + command} ${type} Hai @user`
        )
    }

    if (type === 'welcome') groupData.sWelcome = value
    if (type === 'bye') groupData.sBye = value
    if (type === 'promote') groupData.sPromote = value
    if (type === 'demote') groupData.sDemote = value

    await db.set('group', chatId, groupData)

    m.reply(`Berhasil mengatur ${type}`)
}

handler.help = ['set welcome|bye|promote|demote']
handler.tags = ['group']
handler.command = /^(set|settext)$/i
handler.group = true
handler.admin = true

module.exports = handler