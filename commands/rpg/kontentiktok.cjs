const fs = require('fs')
const {
    tmpdir
} = require('os')
const path = require('path')

let handler = async (m, {
    conn,
    db
}) => {
    const user = db.get("user", m.sender)

    if (!user || !user.tiktok)
        return m.reply('Kamu belum memiliki profil TikTok.\nGunakan *.createtiktok* terlebih dahulu.')

    const cooldown = 30 * 60 * 1000
    const now = Date.now()
    const last = user.tiktok.lastUpload || 0
    const remaining = cooldown - (now - last)

    if (remaining > 0)
        return m.reply(`⏳ Tunggu *${clockString(remaining)}* sebelum upload konten lagi.`)

    await m.reply('📤 Sedang mengupload konten TikTok...')

    const keywordList = ['jj 3d anime', 'lirik anime sad', 'amv anime']
    const keyword = keywordList[Math.floor(Math.random() * keywordList.length)]

    const api = await fetch(
        `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(keyword)}&count=20`
    )
    const {
        data
    } = await api.json()

    if (!data?.videos?.length)
        return m.reply('❌ Gagal mendapatkan konten TikTok.')

    const selected = data.videos[Math.floor(Math.random() * data.videos.length)]
    const videoUrl = selected.play
    const views = selected.play_count || 0

    const res = await conn.getFile(videoUrl)
    const filePath = path.join(tmpdir(), `${m.sender}_tiktok.mp4`)
    fs.writeFileSync(filePath, res.data)

    const followerGain = Math.floor(Math.random() * 25) + 1
    const moneyGain = followerGain * 1500

    user.tiktok.konten += 1
    user.tiktok.follower += followerGain
    user.tiktok.money += moneyGain
    user.tiktok.lastUpload = now

    await db.set("user", m.sender, user)

    await conn.sendFile(
        m.chat,
        filePath,
        'tiktok.mp4',
        `📊 *HASIL UPLOAD TIKTOK*

👁️ Views: ${Convert(views)}
➕ Followers: ${followerGain}
➕ Uang: Rp ${toRupiah(moneyGain)}

📦 Total Konten: ${user.tiktok.konten}
👥 Total Followers: ${user.tiktok.follower}
💰 Total Uang: Rp ${toRupiah(user.tiktok.money)}

Cek profil: *.profiltiktok*`,
        m
    )

    fs.unlinkSync(filePath)
}

handler.command = /^kontentiktok$/i
handler.help = ['kontentiktok']
handler.tags = ['rpg']
handler.register = true
handler.group = true
handler.limit = true
handler.rpg = true
module.exports = handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

function toRupiah(n) {
    return parseInt(n).toLocaleString('id-ID').replace(/,/g, '.')
}

function Convert(count) {
    return (count / 1000).toLocaleString('id-ID', {
        maximumFractionDigits: 2
    }) + 'K'
}