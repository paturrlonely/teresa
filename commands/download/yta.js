let bitrates = [128, 192, 256, 320]

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (text?.startsWith('res|')) {
        let [, bitrate, url] = text.split('|')
        bitrate = parseInt(bitrate)

        try {
            await global.loading(m, conn)

            const req = global.API('ytdlp', `/download/audio`, {
                url,
                mode: 'url',
                bitrate: `${bitrate}k`
            })
            const data = await fetch(req.url, {
                headers: req.headers
            }).then(v => v.json())

            if (!data?.download_url) {
                return m.reply(data?.message || 'Gagal download audio 😢')
            }

            let caption = `🎵 ${data.title}
👤 ${data.uploader || 'Unknown'}
⏱ ${data.duration_sec || 0}s
💽 ${bitrate}k`

            await conn.sendFile(
                m.chat,
                data.download_url,
                `${data.title}_${bitrate}k.mp3`,
                caption,
                m
            )

        } catch (e) {
            console.error(e)
            m.reply('Terjadi error saat download!')
        } finally {
            await global.loading(m, conn, true)
        }
        return
    }

    if (!text || !text.startsWith('http')) {
        return m.reply(`Contoh penggunaan:\n${usedPrefix + command} https://youtu.be/zMMWzvtYgQY`)
    }

    let rows = bitrates.map(b => ({
        title: `${b}k`,
        description: `Download audio ${b}k`,
        id: `${usedPrefix + command} res|${b}|${text}`
    }))

    await conn.sendMessage(
        m.chat, {
            text: '📥 Pilih bitrate audio',
            footer: 'YouTube Audio Downloader',
            buttons: [{
                buttonId: 'yta_res_select',
                buttonText: {
                    displayText: '🎵 Pilih Bitrate'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Pilih Bitrate Audio',
                        sections: [{
                            title: 'Bitrate Tersedia',
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        }
    )
}

handler.help = ['yta <link>']
handler.tags = ['downloader']
handler.command = /^(yta|ytmp3)$/i
handler.limit = true

export default handler