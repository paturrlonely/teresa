const fs = require('fs')
const axios = require('axios')

const handler = async (m, { conn }) => {
    try {
        await global.loading(m, conn)

        const teks = `❏ *_Harga Sewa_*
❃ _10 Hari 5k / Group_
❃ _20 Hari 10k / Group_
❃ _30 Hari 15k / Group_
❃ _40 Hari 20k / Group_

❏ *_Fitur_*
❃ _Antilink_
❃ _Welcome_
❃ _Enable_
❃ _Promote/Demote_
❃ _HideTag_
❃ _Dan Lain Lain_

Minat? Silahkan Chat Nomor Owner Dibawah
Name : ${global.ownername}
https://wa.me/${global.owner}
`.trim()

        
        const thumbBuffer = await axios
            .get(global.thumb, { responseType: 'arraybuffer' })
            .then(res => Buffer.from(res.data))

        await conn.sendMessage(
            m.chat,
            {
                text: teks,
                contextInfo: {
                    externalAdReply: {
                        title: 'S E W A - B O T',
                        body: '',
                        thumbnail: thumbBuffer, // pakai Buffer
                        sourceUrl: global.website,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: m }
        )

    } catch (e) {
        throw e
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ['sewabot']
handler.tags = ['main']
handler.command = /^sewa(bot)?$/i

module.exports = handler