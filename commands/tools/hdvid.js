import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ''

  if (!/video/.test(mime)) {
    return m.reply('Reply/kirim video yang ingin diubah ke HD 60FPS!')
  }

  let tmpIn = join(tmpdir(), `${Date.now()}.mp4`)
  let tmpOut = join(tmpdir(), `${Date.now()}_hd60.mp4`)

  try {
    await m.reply('🎬 Memproses video ke HD + 60 FPS, mohon tunggu...')

    let media = await q.download()
    await fs.writeFile(tmpIn, media)

    await new Promise((resolve, reject) => {
      ffmpeg(tmpIn)
        .outputOptions([
          // AUTO portrait / landscape + 60FPS interpolation
          "-vf",
          "scale='if(gt(a,1),1280,720)':'if(gt(a,1),720,1280)':flags=lanczos,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir,unsharp=5:5:1.0:5:5:0.0",

          '-r', '60',
          '-vsync', 'cfr',

          '-c:v', 'libx264',
          '-profile:v', 'high',
          '-level', '4.2',
          '-preset', 'slow',
          '-crf', '20',

          // WhatsApp safe
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',

          '-c:a', 'aac',
          '-b:a', '192k'
        ])
        .on('error', reject)
        .on('end', resolve)
        .save(tmpOut)
    })

    await conn.sendFile(
      m.chat,
      tmpOut,
      'video_hd_60fps.mp4',
      '🎉 Video HD + 60 FPS siap!',
      m
    )
  } catch (e) {
    console.error(e)
    m.reply('❌ Gagal memproses video.')
  } finally {
    if (await fs.stat(tmpIn).catch(() => false)) await fs.unlink(tmpIn)
    if (await fs.stat(tmpOut).catch(() => false)) await fs.unlink(tmpOut)
  }
}

handler.help = ['hdvideo']
handler.tags = ['tools']
handler.command = /^(|hdvideo|hdv)$/i
handler.description = 'Upgrade video ke HD + 60 FPS tanpa mengubah orientasi.'
handler.limit = true
handler.premium = false

export default handler