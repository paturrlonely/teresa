const moment = require('moment-timezone')

let handler = async (m, {
    conn,
    db
}) => {
    const who = m.sender
    const user = db.get("user", who)
    if (!user) return

    if (user.tiktok?.username)
        return m.reply('Kamu sudah memiliki profil TikTok!\nCek dengan *.profiltiktok*')

    const sessionKey = `${m.chat}:${who}`
    if (global.interactiveSessions.has(sessionKey))
        return m.reply('❌ Kamu masih punya sesi yang belum selesai.')

    const defaultName = user.register ? user.name : await conn.getName(who)

    const botMsg = await conn.sendMessage(
        m.chat, {
            text: `📱 *Membuat Profil TikTok*
👤 Username: *${defaultName}*

📅 *Balas pesan ini dengan tanggal lahir*
Format: DD/MM/YYYY
Contoh: 01/01/2000

⏳ Timeout: 2 menit`
        }, {
            quoted: m
        }
    )

    const session = {
        messageId: botMsg.key.id,
        chatId: m.chat,
        timestamp: Date.now(),
        callback: async (reply) => {
            const text = reply.text.trim()

            if (!moment(text, 'DD/MM/YYYY', true).isValid()) {
                return reply.reply('❌ Format salah!\nGunakan *DD/MM/YYYY*')
            }

            user.tiktok = {
                username: defaultName,
                birthdate: text,
                konten: 0,
                follower: 0,
                money: 0,
                lastUpload: 0
            }

            await db.set("user", who, user)

            let pp
            try {
                pp = await conn.profilePictureUrl(who, 'image')
            } catch {
                pp = 'https://i.ibb.co/2kR8bVH/avatar.png'
            }

            const caption = `
╭───〔 📱 TIKTOK PROFILE 〕───
│ 👤 Username : ${user.tiktok.username}
│ 🎂 Lahir    : ${user.tiktok.birthdate}
│ 🎥 Konten   : 0
│ 👥 Followers: 0
│ 💰 Uang     : Rp 0
│ ⏱ Upload   : Belum pernah
╰────────────────────────

✅ Profil TikTok berhasil dibuat!
📌 Gunakan *.kontentiktok* untuk upload
`.trim()

            await conn.sendMessage(
                m.chat, {
                    image: {
                        url: pp
                    },
                    caption
                }, {
                    quoted: m
                }
            )
        }
    }

    global.interactiveSessions.set(sessionKey, session)

    setTimeout(() => {
        if (global.interactiveSessions.has(sessionKey)) {
            global.interactiveSessions.delete(sessionKey)
            conn.sendMessage(
                m.chat, {
                    text: '⏱️ Waktu habis!\nKetik *.createtiktok* untuk mencoba lagi.'
                }, {
                    quoted: botMsg
                }
            )
        }
    }, 120000)
}

handler.command = /^createtiktok$/i
handler.help = ['createtiktok']
handler.tags = ['rpg']
handler.register = true
handler.group = true
handler.rpg = true
module.exports = handler