import axios from "axios"
import FormData from "form-data"

export async function before(m, { db, conn }) {
    try {
        if (m.isBaileys || m.fromMe) return true
        if (!m.isGroup) return true

        const group = db.get("group", m.chat) || {}
        if (!group.autohd) return true

        const isPhoto =
            m.mtype === "imageMessage" ||
            m.type === "imageMessage" ||
            m.message?.imageMessage
        if (!isPhoto) return true

        const buffer = await m.download()
        if (!buffer || buffer.length < 1024) return true

        const form = new FormData()
        form.append("file", buffer, "image.jpg")

        const upRes = await axios.post(
            "https://tmpfiles.org/api/v1/upload",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "User-Agent": "Mozilla/5.0"
                },
                timeout: 20000
            }
        )

        if (!upRes.data?.data?.url) return true

        let tmpUrl = upRes.data.data.url
            .replace("http://", "https://")
            .replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/")

        const faaRes = await axios.get(
            "https://api-faa.my.id/faa/hdv3",
            {
                params: { image: tmpUrl },
                responseType: "arraybuffer",
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "image/*"
                },
                timeout: 60000
            }
        )

        if (!faaRes.data || faaRes.data.byteLength < 1024) return true

        const hdImage = Buffer.from(faaRes.data)

        await conn.sendMessage(m.chat, {
            image: hdImage,
            caption: "✨ *Auto HD Foto*"
        })

    } catch (e) {
        if (e.response) {
            console.error("[AUTOHD ERROR]", {
                status: e.response.status,
                data: e.response.data?.toString?.()
            })
        } else {
            console.error("[AUTOHD ERROR]", e.message)
        }
    }

    return true
}