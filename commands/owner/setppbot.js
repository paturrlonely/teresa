let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    try {
        const botJid = conn.user.id

        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ""

        if (!/image\/(jpe?g|png)/i.test(mime))
            return m.reply(`Send or reply an image with caption ${usedPrefix + command}`)

        const img = await q.download()
        if (!img) return m.reply("Failed to download image.")

        await conn.updateProfilePicture(botJid, img)
        await m.reply("✅ Bot profile picture updated successfully.")

    } catch (e) {
        console.error(e)
        await m.reply(`❌ Error:\n${e.message}`)
    }
}

handler.help = ["setppbot"]
handler.tags = ["owner"]
handler.command = /^setpp(bot)?$/i
handler.owner = true

export default handler