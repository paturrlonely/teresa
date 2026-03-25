import fetch from 'node-fetch'
import j2download from '../../scraper/aio.js'

import {
    canvas as canvasSearch
} from '../../library/canvas/canvas-spsearch.js'
import {
    canvas as canvasDownload
} from '../../library/canvas/canvas-spotify.js'

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (text?.startsWith('http')) {
        if (!text.includes('spotify.com')) {
            return m.reply('❌ Link Spotify tidak valid.')
        }

        m.reply('⏳ Mengunduh lagu Spotify...')

        try {
            const data = await j2download(text)
            if (!data || data.error) return m.reply('❌ Gagal mengambil data Spotify.')

            const audio = data.medias?.find(v => v.type === 'audio')
            if (!audio?.url) return m.reply('❌ Audio tidak ditemukan.')

            const img = await canvasDownload({
                title: data.title || '-',
                author: data.author || '-',
                thumbnail: data.thumbnail,
                duration: data.duration || '-',
                source: data.source || 'Spotify'
            })

            await conn.sendMessage(m.chat, {
                image: img,
                caption: `🎵 *${data.title}*\n👤 ${data.author}\n⏱ ${data.duration}`
            }, {
                quoted: m
            })

            await conn.sendMessage(m.chat, {
                audio: {
                    url: audio.url
                },
                mimetype: 'audio/mpeg',
                fileName: `${data.title}.mp3`
            }, {
                quoted: m
            })

        } catch (e) {
            console.error('[SPOTIFY DOWNLOAD ERROR]')
            console.error(e)
            m.reply('❌ Terjadi kesalahan saat download.')
        }
        return
    }

    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} swim`)

    m.reply('🔍 Mencari lagu Spotify...')

    try {
        const res = await fetch(
            `https://api.mifinfinity.my.id/api/search/spotify-search?query=${encodeURIComponent(text)}`
        )

        console.log('[SPOTIFY SEARCH STATUS]', res.status)

        const json = await res.json()
        console.log('[SPOTIFY SEARCH JSON]', json)

        if (!json.success || !Array.isArray(json.result) || !json.result.length) {
            return m.reply('❌ Lagu tidak ditemukan.')
        }

        const list = json.result.slice(0, 10)
        console.log('[SPOTIFY SEARCH LIST COUNT]', list.length)

        console.log('[SPOTIFY CANVAS INPUT]', {
            query: text,
            result: list[0]
        })

        const img = await canvasSearch({
            query: text,
            result: list
        })

        console.log('[SPOTIFY CANVAS SUCCESS]', img?.length)

        await conn.sendMessage(m.chat, {
            image: img,
            caption: `🎧 *Hasil Spotify Search*\nQuery: *${text}*`,
            footer: 'Klik untuk download lagu',
            buttons: [{
                buttonId: 'spotify_select',
                buttonText: {
                    displayText: '🎵 Pilih Lagu'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Hasil Spotify',
                        sections: [{
                            title: 'Daftar Lagu',
                            highlight_label: 'Popular',
                            rows: list.map(song => ({
                                header: song.artist,
                                title: song.title,
                                description: `⭐ ${song.popularity}`,
                                id: `${usedPrefix + command} ${song.link}`
                            }))
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        })

    } catch (e) {
        console.error('[SPOTIFY SEARCH ERROR]')
        console.error(e)
        m.reply('❌ Terjadi kesalahan saat search.')
    }
}

handler.command = /^spotify$/i
handler.help = ['spotify <judul | link>']
handler.tags = ['download']

export default handler