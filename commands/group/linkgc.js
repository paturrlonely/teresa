import {
    proto,
    generateWAMessageFromContent,
    prepareWAMessageMedia
} from 'baileys'

let handler = async (m, {
    conn,
    db
}) => {
    await global.loading(m, conn)

    // cek user terdaftar
    const user = db.get('user', m.sender)
    if (!user) {
        await global.loading(m, conn, true)
        return m.reply(
            '❌ *Kamu belum terdaftar*\n' +
            'Silakan daftar dulu dengan perintah *.daftar*'
        )
    }

    // metadata grup
    const metadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!metadata?.participants) {
        await global.loading(m, conn, true)
        return m.reply('❌ Tidak bisa mengambil data grup.')
    }

    const memberCount = metadata.participants.length

    // ambil link grup
    let inviteCode
    try {
        inviteCode = await conn.groupInviteCode(m.chat)
    } catch {
        await global.loading(m, conn, true)
        return m.reply(
            '❌ *Gagal mengambil link grup*\n\n' +
            'Pastikan *bot sudah menjadi admin grup*.'
        )
    }

    const link = `https://chat.whatsapp.com/${inviteCode}`

    // ambil PP grup (fallback aman)
    const ppGroup = await conn
        .profilePictureUrl(m.chat, 'image')
        .catch(() => 'https://cloudkuimages.guru/uploads/images/pg5XDGVr.jpg')

    // log command
    if (!user.commands) user.commands = {}
    user.commands.linkgroup = (user.commands.linkgroup || 0) + 1
    await db.set('user', m.sender, user)

    // INTERACTIVE MESSAGE
    const msg = generateWAMessageFromContent(
        m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: `Hai kak, ini link group-nya ya >//<\n\n👥 *Jumlah Member:* ${memberCount}`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: global.wm
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            title: '👥 Link Group',
                            hasMediaAttachment: true,
                            ...await prepareWAMessageMedia({
                                image: {
                                    url: ppGroup
                                } // ✅ PP GRUP
                            }, {
                                upload: conn.waUploadToServer
                            })
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [{
                                name: 'cta_copy',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📋 Salin Link',
                                    copy_code: link
                                })
                            }]
                        })
                    })
                }
            }
        }, {
            quoted: m
        }
    )

    await conn.relayMessage(m.chat, msg.message, {})
    await global.loading(m, conn, true)
}

handler.help = ['link', 'linkgc', 'linkgroup']
handler.tags = ['group']
handler.command = /^(link(gc|gro?up)?)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler