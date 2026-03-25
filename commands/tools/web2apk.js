import fetch from 'node-fetch'

const handler = async (m, {
    conn,
    args,
    text,
    command,
    usedPrefix
}) => {
    if (!text) {
        throw `Contoh: ${usedPrefix + command} https://example.com|email@example.com|MyApp`
    }

    const [url, email, name] = text.split('|')
    if (!url || !email || !name) {
        throw `Format salah!\nGunakan format: ${usedPrefix + command} <url>|<email>|<nama_apk>`
    }

    await m.reply('⏳ Membuat APK... tunggu ±5 menit ya')

    try {
        const apikey = 'bagus'
        const apiUrl = `https://web2apk-cg.zone.id/tools/web2app?apikey=${apikey}&url=${encodeURIComponent(url)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
        const res = await fetch(apiUrl)
        const json = await res.json()

        if (!json.status) {
            throw '❌ Gagal membuat APK. Cek input atau coba lagi nanti.'
        }

        await conn.reply(m.chat, `✅ APK berhasil dibuat!\n\n📦 Nama: ${json.appName}\n👤 Creator: Renza\n📥 Download: ${json.download}`, m)
    } catch (e) {
        console.error(e)
        m.reply('❌ Error saat membuat APK.')
    }
}

handler.help = ['web2apk <url>|<email>|<nama_apk>']
handler.tags = ['tools']
handler.command = /^web2apk$/i
handler.premium = true
handler.register = true

export default handler