import axios from 'axios'

const API_URL = 'https://tikwm.com/api/feed/search'

async function ttSearch(query, count = 10) {
  const { data } = await axios.post(
    API_URL,
    new URLSearchParams({
      keywords: query,
      count,
      cursor: 0,
      HD: 1
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: 'current_language=en',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/116 Mobile Safari/537.36'
      }
    }
  )

  const videos = data?.data?.videos || []
  if (!videos.length) throw new Error('Tidak ada hasil')

  return videos
}

let handler = async (m, { conn, text, usedPrefix, command }) => {

  if (text?.startsWith('http')) {
    await m.reply('📥 Mengirim video & audio...')

    try {
      await conn.sendMessage(
        m.chat,
        { video: { url: text } },
        { quoted: m }
      )

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: text },
          mimetype: 'audio/mpeg'
        },
        { quoted: m }
      )
    } catch (e) {
      console.error('[TT SEND ERROR]', e)
      m.reply('❌ Gagal mengirim video/audio')
    }
    return
  }

  if (!text) {
    return m.reply(`Contoh:\n${usedPrefix + command} kucing lucu`)
  }

  await m.reply('🔍 Mencari video TikTok...')

  try {
    const list = await ttSearch(text)

    const rows = list.slice(0, 10).map(v => ({
      header: v.author?.nickname || 'Unknown',
      title: v.title?.slice(0, 40) || 'Tanpa judul',
      description: `❤️ ${v.digg_count || 0}`,
      id: `${usedPrefix + command} ${v.play || v.video}`
    }))

    await conn.sendMessage(
      m.chat,
      {
        image: { url: list[0].cover },
        caption: `🎵 *Hasil TikTok Search*\nQuery: *${text}*`,
        footer: 'Klik untuk download',
        buttons: [
          {
            buttonId: 'tt_select',
            buttonText: { displayText: '📥 Pilih Video' },
            type: 4,
            nativeFlowInfo: {
              name: 'single_select',
              paramsJson: JSON.stringify({
                title: 'Hasil TikTok',
                sections: [
                  {
                    title: 'Daftar Video',
                    rows
                  }
                ]
              })
            }
          }
        ],
        headerType: 1,
        viewOnce: true
      },
      { quoted: m }
    )
  } catch (e) {
    console.error('[TTSEARCH ERROR]', e)
    m.reply('❌ Gagal mencari TikTok')
  }
}

handler.help = ['ttsearch <kata kunci>']
handler.tags = ['search']
handler.command = ['ttsearch', 'tiktoksearch', 'tiktoks']

export default handler