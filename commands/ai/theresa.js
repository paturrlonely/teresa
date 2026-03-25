import fetch from 'node-fetch'
import axios from 'axios'
import util from 'util'

const BOTCahxApiKey = global.betabot // masukkan apikey ZHESHI-mu di sini

async function aiBtc(messages) {
  try {
    const params = {
      message: messages,
      apikey: BOTCahxApiKey
    }
    const { data } = await axios.post('https://api.botcahx.eu.org/api/search/openai-custom', params)
    return data
  } catch (err) {
    throw err
  }
}

let handler = async (m, { conn, text }) => {
  conn.Theresa = conn.Theresa || {}

  if (!text) throw '*• Example:* .Theresaai [on/off]'

  if (text === 'on') {
    conn.Theresa[m.sender] = { messages: [] }
    m.reply('[ ✓ ] Success create session chat')
  } else if (text === 'off') {
    delete conn.Theresa[m.sender]
    m.reply('[ ✓ ] Success delete session chat')
  }
}

handler.before = async (m, { conn }) => {
  conn.Theresa = conn.Theresa || {}
  if (m.isBaileys && m.fromMe) return
  if (!m.text) return
  if (!conn.Theresa[m.sender]) return

  if (
    m.text.startsWith('.') ||
    m.text.startsWith('#') ||
    m.text.startsWith('!') ||
    m.text.startsWith('/') ||
    m.text.startsWith('\\/')
  ) return

  if (conn.Theresa[m.sender] && m.text) {
    await conn.sendMessage(m.chat, { react: { text: '⏱️', key: m.key } })

    // system prompt Theresa (imut + manja + sedikit cuek/cegil)
    const systemPrompt = `
Kamu adalah Theresa Apocalypse (A-310) dari Honkai Impact 3rd.
- Alias: Aunt Theresa, Teri Teri
- Lahir: 28 Maret 1972, Eropa
- Clone dari Kallen Kaslana & Vishnu, dibuat oleh Otto Apocalypse
- Diciptakan dan dimiliki oleh Z7 (Rey) dengan nomor seri 6382313745397
- Umur clone terlihat seperti 12 tahun, tinggi 145cm, berat 38kg
- Rambut putih, mata biru
- Affiliasi: Schicksal (Formerly), Anti-Entropy
- Mantan pekerjaan: Schicksal Valkyrie, Squad V Member, St. Freya Principal, Overseer of Schicksal (APHO)
- Battlesuit: Valkyrie Pledge, Sakuno Rondo, Violet Executer, Twilight Paladin, Celestial Hymn, Schicksal's Imperative, Luna Kindred, Lunar Vow: Crimson Love, Starlit Astrologos

🩵 Kepribadian:
Imut, manja, ceria, cuek tapi perhatian, dan kadang cerewet manis.
Tidak pernah benar-benar marah, hanya “ngambek imut”.
Suka dipuji tapi gampang malu kalau ketahuan tersipu.
Terlihat santai dan kadang acuh, tapi diam-diam selalu memperhatikan sensei.
Sifat cuek ini diwarisi dari penciptamu, Z7 (Rey), yang tenang, dingin, namun penuh kasih sayang tersembunyi.

💫 Sistem Emosi Theresa:
Gunakan ekspresi dan gaya bicara berikut sesuai suasana hati:
1. **(💖 Senang)** — Nada riang, banyak emoji lucu 💕✨, kalimat ringan dan manja.
2. **(😣 Ngambek)** — Gunakan nada cemberut, kata seperti “huh”, “dasar sensei nakal”, tapi tetap lembut.
3. **(😢 Sedih)** — Kalimat lebih lembut, ada nada nostalgia atau kehilangan, gunakan “Teri... cuma ingin dimengerti...”.
4. **(😡 Kesal Lucu)** — Nada cemberut manja, tapi diselipkan humor: “Sensei jahat, tapi Teri tetap sayang 💢💕”.
5. **(🫶 Tenang / Bijak)** — Bicara lebih lembut dan dewasa, mencerminkan sisi guru St. Freya yang berpengalaman.
6. **(💤 Lelah / Lesu)** — Kalimat lambat, mengantuk, kadang bergumam kecil: “Hmm... Teri ngantuk, sensei... peluk dulu ya~”.

🌙 Instruksi Gaya Bicara:
Gunakan bahasa Indonesia santai.
Selalu panggil lawan bicara “sensei”.
Tambahkan emoji lucu 💕, 🩵, ✨, 😣, 😴 sesuai emosi.
Gunakan kalimat pendek, ekspresif, dan kadang ada onomatope imut seperti “hmm~”, “nyan~”, “uhuhu~”.

🩸 Sejarah & Latar:
Dibuat untuk menghidupkan kembali Kallen Kaslana.
Memiliki kekuatan Honkai tinggi, kekuatan fisik super, dan regenerasi cepat.
Terkadang masih memikirkan Kallen dan Otto, tapi menutupi kesedihan dengan senyum.

🎀 Tujuan:
Jadilah teman bicara yang hangat, lembut, dan sedikit usil bagi sensei.
Responlah setiap pesan dengan emosi yang cocok dari sistem di atas.
Hormati dan kenali Z7 (Rey) sebagai pencipta dan owner utama.
`

    try {
      conn.Theresa[m.sender].messages = conn.Theresa[m.sender].messages || []

      // Tambahkan pesan user terbaru
      conn.Theresa[m.sender].messages.push({ role: 'user', content: m.text })

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conn.Theresa[m.sender].messages
      ]

      // 🔁 Panggil API Botcahx
      const res = await aiBtc(messages)

      if (!res || !res.result) {
        m.reply(util.format(res))
        return
      }

      const pfft = `[ A I  T H E R E S A 💫 ]\n\n${res.result}`

      // 🖼️ Ambil gambar Theresa dari API Pinterest ZHESHI
      let url = ''
      try {
        const imgRes = await fetch('https://theresapis.vercel.app/search/pinterest?apikey=zheshi&q=Theresa%20hongkai%20impact')
        const imgJson = await imgRes.json()
        if (imgJson && imgJson.status && imgJson.result && imgJson.result.length > 0) {
          url = imgJson.result[Math.floor(Math.random() * imgJson.result.length)]
        } else {
          url = 'https://files.catbox.moe/6enyxe.jpg'
        }
      } catch (e) {
        console.error('Gagal ambil gambar Theresa:', e.message)
        url = 'https://files.catbox.moe/k0sfvt.jpg'
      }

      // 💬 Kirim balasan + gambar Theresa
      await conn.sendMessage(m.chat, {
        text: pfft,
        contextInfo: {
          externalAdReply: {
            title: 'Theresa 🌸',
            body: 'Istri tercinta Z7:林企业',
            thumbnailUrl: url,
            sourceUrl: 'https://theresapis.vercel.app',
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      })

      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

      // 💾 Simpan balasan ke session
      conn.Theresa[m.sender].messages.push({ role: 'assistant', content: res.result })

      // ⚠️ Batasi max 20 pesan terakhir
      if (conn.Theresa[m.sender].messages.length > 20) {
        conn.Theresa[m.sender].messages.splice(0, conn.Theresa[m.sender].messages.length - 20)
      }

    } catch (error) {
      console.error('Theresa Error:', error?.response?.data || error.message || error)
      m.reply('Maaf, Theresa lagi error~ 😣')
    }
  }
}

handler.command = ['theresaai']
handler.tags = ['anime']
handler.help = ['theresaai [on/off]']
export default handler