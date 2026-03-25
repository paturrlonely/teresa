const axios = require('axios')

const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    if (!args[0]) {
        return conn.sendMessage(m.chat, {
            text: `Please provide an Instagram URL.\n\nExample:\n${usedPrefix}${command} https://www.instagram.com/p/xxxxx/`
        }, {
            quoted: m
        })
    }

    const url = args[0]

    if (!/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\//i.test(url)) {
        return conn.sendMessage(m.chat, {
            text: 'Invalid Instagram URL.'
        }, {
            quoted: m
        })
    }

    await conn.sendMessage(m.chat, {
        text: '⏳ Processing Instagram media...'
    }, {
        quoted: m
    })

    try {
        const api = `https://api.apocalypse.web.id/download/igdl?url=${encodeURIComponent(url)}`
        const {
            data
        } = await axios.get(api, {
            timeout: 20000
        })

        if (!data.status || data.result?.error) {
            return conn.sendMessage(m.chat, {
                text: 'Failed to fetch Instagram media.'
            }, {
                quoted: m
            })
        }

        const res = data.result

        let caption = `*Username:* ${res.author || '-'}\n`
        if (res.like_count) caption += `*Likes:* ${res.like_count}\n`
        if (res.view_count) caption += `*Views:* ${res.view_count}\n`
        if (res.title) caption += `\n*Caption:*\n${res.title}`

        for (let i = 0; i < res.medias.length; i++) {
            const media = res.medias[i]
            const cap = i === 0 ? caption : ''

            if (media.type === 'video') {
                await conn.sendMessage(m.chat, {
                    video: {
                        url: media.url
                    },
                    caption: cap
                }, {
                    quoted: m
                })
            } else {
                await conn.sendMessage(m.chat, {
                    image: {
                        url: media.url
                    },
                    caption: cap
                }, {
                    quoted: m
                })
            }
        }

    } catch (e) {
        console.error(e)
        conn.sendMessage(m.chat, {
            text: 'An unexpected error occurred while downloading Instagram media.'
        }, {
            quoted: m
        })
    }
}

handler.command = ['ig', 'instagram', 'igdl']
handler.help = ['ig <url>']
handler.tags = ['downloader']
handler.description = 'Download all Instagram media (image & video)'

module.exports = handler