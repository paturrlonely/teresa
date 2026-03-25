import axios from 'axios'

let handler = async (m, {
    conn,
    text
}) => {
    if (!text) throw `❌ Contoh penggunaan:\n.autofelo on\n.autofelo off`

    conn.FeloAI = conn.FeloAI || {}
    const mode = text.toLowerCase()

    if (mode === 'on') {
        if (!conn.FeloAI[m.sender]) {
            conn.FeloAI[m.sender] = {
                history: [],
                timeout: setTimeout(() => delete conn.FeloAI[m.sender], 300000)
            }
            await m.reply('✅ Autofelo diaktifkan. Semua pesanmu akan dijawab FeloAI.')
        } else {
            clearTimeout(conn.FeloAI[m.sender].timeout)
            conn.FeloAI[m.sender].timeout = setTimeout(() => delete conn.FeloAI[m.sender], 300000)
            await m.reply('✅ Autofelo sudah aktif, timeout diperbarui.')
        }
    } else if (mode === 'off') {
        if (conn.FeloAI[m.sender]) {
            clearTimeout(conn.FeloAI[m.sender].timeout)
            delete conn.FeloAI[m.sender]
        }
        await m.reply('✅ Autofelo dimatikan.')
    } else {
        await m.reply('❌ Gunakan:\n.autofelo on\n.autofelo off')
    }
}

handler.before = async (m, {
    conn
}) => {
    if (!conn.FeloAI) conn.FeloAI = {}
    if (!m.text) return
    if (!conn.FeloAI[m.sender]) return
    if (m.isBaileys && m.fromMe) return
    if (['.', '#', '!', '/', '\\/'].some(p => m.text.startsWith(p))) return

    clearTimeout(conn.FeloAI[m.sender].timeout)
    conn.FeloAI[m.sender].timeout = setTimeout(() => delete conn.FeloAI[m.sender], 300000)

    try {
        await m.reply('🧠 FeloAI sedang berpikir...')
        const result = await feloaiAPI(m.text)

        if (!result) return m.reply('❌ Gagal mendapatkan jawaban FeloAI')

        let reply = result.answer || '(tidak ada jawaban)'

        if (result.source?.length) {
            reply += `\n\n*Sumber:*`
            reply += result.source.map(s => `\n- ${s.title}: ${s.link}`).join('')
        }

        conn.FeloAI[m.sender].history.push({
            query: m.text,
            answer: result.answer
        })

        await m.reply(reply)
    } catch (e) {
        console.error(e)
        await m.reply('❌ Terjadi kesalahan.')
    }
}

handler.command = /^(autofelo)$/i
handler.help = ['autofelo on', 'autofelo off']
handler.tags = ['ai']
handler.limit = true

export default handler

async function feloaiAPI(query) {
    try {
        const url = `http://70.153.144.239:2420/ai/feloai?query=${encodeURIComponent(query)}`
        const {
            data
        } = await axios.get(url, {
            timeout: 30000
        })

        if (!data.status) return null
        return data.result
    } catch (e) {
        console.error('FeloAI API error:', e.message)
        return null
    }
}