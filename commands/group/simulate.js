let handler = async (m, {
    conn,
    usedPrefix,
    command,
    args,
    text
}) => {
    const event = (args[0] || "").toLowerCase()

    if (!event) {
        return m.reply(`
Contoh penggunaan:
${usedPrefix + command} welcome @user
${usedPrefix + command} bye @user
${usedPrefix + command} promote @user
${usedPrefix + command} demote @user
`.trim())
    }

    // ambil mention, fallback ke sender
    const mentioned = conn.parseMention(text)
    const participants = mentioned.length ? mentioned : [m.sender]

    let action
    switch (event) {
        case "add":
        case "invite":
        case "welcome":
            action = "add"
            break

        case "bye":
        case "kick":
        case "leave":
        case "remove":
            action = "remove"
            break

        case "promote":
            action = "promote"
            break

        case "demote":
            action = "demote"
            break

        default:
            return m.reply("❌ Event tidak dikenal.")
    }

    await m.reply(`*❃ Simulating ${action}...*`)

    // trigger participant handler asli
    await conn.ev.emit("group-participants.update", {
        id: m.chat,
        participants,
        action,
        actor: m.sender
    })
}

handler.help = ["simulate"]
handler.tags = ["group"]
handler.command = /^(simulate|simulation|simulasi)$/i

handler.group = true
handler.admin = true

export default handler