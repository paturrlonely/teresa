import fetch from 'node-fetch'

let handler = async (m, {
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply('Masukkan pertanyaan!')
    }

    try {
        const url = `https://api.apocalypse.web.id/ai/claude?q=${encodeURIComponent(text)}`
        const res = await fetch(url)
        const json = await res.json()

        if (!json.status) {
            return m.reply('Gagal mendapatkan jawaban dari AI')
        }

        const reply = json.result || 'Jawaban tidak tersedia'
        m.reply(reply)

    } catch (e) {
        console.error(e)
        m.reply('Gagal menghubungi server')
    }
}

handler.help = ['claude']
handler.tags = ['ai']
handler.command = ['claude']

export default handler