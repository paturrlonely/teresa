let handler = async (m, {
    conn
}) => {
    if (!m.quoted) {
        return m.reply("❗ Reply pesan *view-once* (foto / video / audio / dokumen).")
    }

    try {
        const q = m.quoted

        // Ambil isi pesan view-once (support V2 & Extension)
        const msg =
            q.message?.viewOnceMessageV2?.message ||
            q.message?.viewOnceMessageV2Extension?.message ||
            q.msg?.viewOnceMessageV2?.message ||
            q.msg?.viewOnceMessageV2Extension?.message ||
            q.message ||
            q.msg

        if (!msg) return m.reply("❌ Gagal membaca pesan view-once.")

        const media =
            msg.imageMessage ||
            msg.videoMessage ||
            msg.audioMessage ||
            msg.documentMessage

        if (!media) return m.reply("❌ Tidak ditemukan media di pesan tersebut.")

        // Download media
        const buffer = await q.download?.()
        if (!buffer) return m.reply("❌ Gagal mengunduh media.")

        const mime = media.mimetype || ""
        let type

        if (mime.startsWith("image/")) type = "image"
        else if (mime.startsWith("video/")) type = "video"
        else if (mime.startsWith("audio/")) type = "audio"
        else if (mime) type = "document"
        else return m.reply("❌ Tipe media tidak didukung.")

        const caption =
            media.caption ||
            q.text ||
            "🔓 *View-once berhasil dibuka*"

        await conn.sendMessage(
            m.chat, {
                [type]: buffer,
                mimetype: mime,
                caption
            }, {
                quoted: m
            }
        )

    } catch (e) {
        console.error("[READ VIEWONCE ERROR]", e)
        m.reply("❌ Terjadi kesalahan saat membuka view-once.")
    }
}

handler.help = ["readviewonce"]
handler.tags = ["tools"]
handler.command = /^(read(view(once)?)?|rvo)$/i
handler.limit = true
module.exports = handler