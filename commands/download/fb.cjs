const axios = require('axios')

const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    if (!args[0]) {
        return conn.sendMessage(m.chat, {
            text: `Please provide a Facebook URL.\n\nExample:\n${usedPrefix}${command} https://www.facebook.com/watch/?v=xxxxx`
        }, {
            quoted: m
        })
    }

    const url = args[0]

    if (!/https?:\/\/(www\.)?(facebook\.com|fb\.watch|m\.facebook\.com|fb\.com)/i.test(url)) {
        return conn.sendMessage(m.chat, {
            text: 'Invalid Facebook URL.'
        }, {
            quoted: m
        })
    }

    await conn.sendMessage(m.chat, {
        text: '⏳ Processing Facebook media...'
    }, {
        quoted: m
    })

    try {
        const api = `https://api.apocalypse.web.id/download/fb?url=${encodeURIComponent(url)}`
        const {
            data
        } = await axios.get(api, {
            timeout: 20000
        })

        if (!data.status || data.result?.error) {
            return conn.sendMessage(m.chat, {
                text: 'Failed to fetch Facebook media.'
            }, {
                quoted: m
            })
        }

        const res = data.result

        let caption = `*Author:* ${res.author || '-'}\n`
        if (res.title) caption += `\n*Caption:*\n${res.title}`

        // Kirim thumbnail dulu sebagai preview
        if (res.thumbnail) {
            await conn.sendMessage(m.chat, {
                image: {
                    url: res.thumbnail
                },
                caption
            }, {
                quoted: m
            })
        }

        // Kirim semua video
        for (let i = 0; i < res.medias.length; i++) {
            const media = res.medias[i]
            const cap = ''
            if (media.type === 'video') {
                await conn.sendMessage(m.chat, {
                    video: {
                        url: media.url
                    },
                    caption: cap
                }, {
                    quoted: m
                })
            } else if (media.type === 'image') {
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
            text: 'An unexpected error occurred while downloading Facebook media.'
        }, {
            quoted: m
        })
    }
}

handler.command = ['fb', 'facebook', 'fbdl']
handler.help = ['fb <url>']
handler.tags = ['downloader']
handler.description = 'Download all Facebook media (video & image) with thumbnail preview'

module.exports = handler