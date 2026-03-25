let handler = async (m, {
    conn
}) => {
    let loadd = [
        '⋘ Tunggu Menampilkan Data... ⋙',
        '▒▒▒▒▒▒▒▒▒▒ 0%',
        '█▒▒▒▒▒▒▒▒▒ 10%',
        '███▒▒▒▒▒▒▒ 30%',
        '█████▒▒▒▒▒ 50%',
        '███████▒▒▒ 70%',
        '█████████▒ 90%',
        '██████████ 100%',
        'Ｓｕｃｃｅｓｓ...'
    ]

    let {
        key
    } = await conn.sendMessage(m.chat, {
        text: '_Loading_'
    })

    for (let i = 0; i < loadd.length; i++) {
        await conn.sendMessage(m.chat, {
            text: loadd[i],
            edit: key
        })
    }

    await conn.sendMessage(m.chat, {
        video: {
            url: 'https://files.catbox.moe/eborld.mp4'
        },
        gifPlayback: true,
        caption: `${global.botname} adalah bot WhatsApp yang cerdas dan sangat berguna untuk membantu Anda dalam menjawab pertanyaan dan memberikan solusi dengan cepat.

Dikembangkan oleh ${global.ownername}dan menggunakan base ${global.botname} yang terus diperbarui.

Dengan kemampuan luas seperti pencarian informasi, manajemen aktivitas, dan respon cepat, ${global.botname} siap membantu kebutuhan Anda.

Gunakan ${global.botname} sekarang dan nikmati pengalaman bot WhatsApp yang modern dan cerdas.`,
        contextInfo: {
            externalAdReply: {
                title: `© About ${global.botname}`,
                body: global.author,
                thumbnailUrl: global.thumb,
                sourceUrl: global.website,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, {
        quoted: m
    })
}

handler.help = ['about']
handler.tags = ['info']
handler.command = /^(about)$/i

export default handler