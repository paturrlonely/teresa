import axios from 'axios'

let handler = async (m, { conn, text }) => {
    if (!text) throw `❌ Contoh penggunaan:\n.autobible on\n.autobible off`

    conn.AutoBible = conn.AutoBible || {}
    const mode = text.toLowerCase()

    if (mode === 'on') {
        if (!conn.AutoBible[m.sender]) {
            conn.AutoBible[m.sender] = {
                history: [],
                timeout: setTimeout(() => delete conn.AutoBible[m.sender], 300000)
            }
            await m.reply('📖 AutoBible diaktifkan. Semua pesanmu akan dijawab AI Alkitab.')
        } else {
            clearTimeout(conn.AutoBible[m.sender].timeout)
            conn.AutoBible[m.sender].timeout = setTimeout(() => delete conn.AutoBible[m.sender], 300000)
            await m.reply('📖 AutoBible sudah aktif, timeout diperbarui.')
        }
    } else if (mode === 'off') {
        if (conn.AutoBible[m.sender]) {
            clearTimeout(conn.AutoBible[m.sender].timeout)
            delete conn.AutoBible[m.sender]
        }
        await m.reply('📖 AutoBible dimatikan.')
    } else {
        await m.reply('❌ Gunakan:\n.autobible on\n.autobible off')
    }
}

handler.before = async (m, { conn }) => {
    if (!conn.AutoBible) conn.AutoBible = {}
    if (!m.text) return
    if (!conn.AutoBible[m.sender]) return
    if (m.isBaileys && m.fromMe) return
    if (['.', '#', '!', '/', '\\/'].some(p => m.text.startsWith(p))) return

    clearTimeout(conn.AutoBible[m.sender].timeout)
    conn.AutoBible[m.sender].timeout = setTimeout(() => delete conn.AutoBible[m.sender], 300000)

    try {
        await m.reply('📖 AutoBible sedang mencari jawaban...')

        const result = await bibleAPI(m.text)
        if (!result) return m.reply('❌ Gagal mendapatkan jawaban.')

        let reply = result.answer || '(tidak ada jawaban)'

        if (result.sources?.length) {
            reply += `\n\n*Sumber Ayat:*`
            reply += result.sources
                .map(s => `\n- ${s.text}`)
                .join('')
        }

        conn.AutoBible[m.sender].history.push({
            query: m.text,
            answer: result.answer
        })

        await m.reply(reply)
    } catch (e) {
        console.error(e)
        await m.reply('❌ Terjadi kesalahan.')
    }
}

handler.command = /^(autobible)$/i
handler.help = ['autobible on', 'autobible off']
handler.tags = ['ai']
handler.limit = true

export default handler

async function bibleAPI(query) {
    try {
        const url = `http://70.153.144.239:2420/ai/bible?text=${encodeURIComponent(query)}`
        const { data } = await axios.get(url, { timeout: 30000 })

        if (!data.status) return null
        return data.result
    } catch (e) {
        console.error('Bible API error:', e.message)
        return null
    }
}