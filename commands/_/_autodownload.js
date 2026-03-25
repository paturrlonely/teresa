import j2download from "../../scraper/aio.js"

const urlRegex =
    /(https?:\/\/(?:www\.|(?!www))[^\s]+\.[^\s]{2,})/gi

global.autodownload = global.autodownload || new Map()

export async function before(m, { db, conn }) {
    try {
        if (m.isBaileys || m.fromMe) return true
        if (!m.isGroup) return true
        if (!m.text) return true
        if (/^(=>|>|\.|#|!|\/)/.test(m.text)) return true

        const group = db.get("group", m.chat) || {}
        if (group.autodownload !== true) return true

        const match = m.text.match(urlRegex)
        if (!match) return true
        const link = match[0]

        if (global.autodownload.has(m.sender)) return true
        global.autodownload.set(m.sender, true)

        await conn.readMessages([m.key]).catch(() => {})

        const res = await j2download(link)
        const medias = res?.medias || res?.data?.medias
        if (!Array.isArray(medias) || !medias.length) return true

        const images = medias.filter(v => v.type === 'image' && v.url)
        if (images.length) {
            const albumItems = images.map(img => ({
                image: { url: img.url },
                caption: link
            }))

            await conn.sendAlbumMessage(
                m.chat,
                albumItems,
                {
                    quoted: m,
                    delay: 700
                }
            )
        }

        const videos = medias.filter(v => v.type === 'video' && v.url)
        if (videos.length) {
            const picked =
                videos.find(v => v.quality === 'hd_no_watermark') ||
                videos.find(v => v.quality === 'no_watermark') ||
                videos[0]

            await conn.sendAlbumMessage(
                m.chat,
                [
                    {
                        video: { url: picked.url },
                        caption: link
                    }
                ],
                { quoted: m }
            )
        }

        const audio = medias.find(v => v.type === 'audio' && v.url)
        if (audio?.url) {
            await conn.sendMessage(
                m.chat,
                {
                    audio: { url: audio.url },
                    mimetype: 'audio/mpeg'
                },
                { quoted: m }
            )
        }

    } catch (e) {
        console.error('[AUTODL ERROR]', e)
    } finally {
        global.autodownload.delete(m.sender)
    }

    return true
}