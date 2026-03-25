import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    let ppUrl
    try {
      ppUrl = await conn.profilePictureUrl(m.sender, 'image')
    } catch {
      ppUrl = 'https://i.ibb.co/2n1vD2M/default-pp.jpg'
    }

    let text = args.join(' ')
    if (!text) return m.reply(`❌ Error\nFormat salah!\n\nGunakan:\n${usedPrefix + command} nama|bio|nomor`)
    let [nama, bio, nomor] = text.split('|')
    if (!nama || !bio || !nomor) 
      return m.reply(`❌ Error\nPastikan semua data terisi.\nContoh:\n${usedPrefix + command} Elaina|Just Wandering|628xxx`)

    if (!nomor.startsWith('+')) nomor = '+' + nomor

    const templateUrl = 'https://uploader.zenzxz.dpdns.org/uploads/1757090672815.jpeg'
    const template = await loadImage(templateUrl)

    if (!GlobalFonts.has('Roboto')) {
      const fontUrl = 'https://github.com/Reyz2902/font2/raw/main/Roboto-Regular.ttf'
      const res = await fetch(fontUrl)
      if (!res.ok) throw new Error(`Gagal ambil font, status: ${res.status}`)
      const arrayBuffer = await res.arrayBuffer()
      const fontBuffer = Buffer.from(arrayBuffer)
      if (!fontBuffer || fontBuffer.length === 0) throw new Error('Buffer font kosong')
      GlobalFonts.register(fontBuffer, 'Roboto')
    }

    const canvas = createCanvas(template.width, template.height)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(template, 0, 0)

    const pp = await loadImage(ppUrl)
    const ppSize = 162
    const ppX = 219
    const ppY = 91
    ctx.save()
    ctx.beginPath()
    ctx.arc(ppX + ppSize/2, ppY + ppSize/2, ppSize/2, 0, Math.PI*2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(pp, ppX, ppY, ppSize, ppSize)
    ctx.restore()

    const safeFillText = (ctx, text, x, y) => {
      const str = String(text || '').trim()
      if (str) ctx.fillText(str, x, y)
    }

    ctx.fillStyle = '#aaa'
    ctx.font = '16px "Roboto"'
    safeFillText(ctx, nama, 75, 370)
    safeFillText(ctx, bio, 75, 445)
    safeFillText(ctx, nomor, 75, 530)

    const buffer = canvas.toBuffer('image/png')
    await conn.sendMessage(
      m.chat,
      { image: buffer, caption: '✅ Fake WA berhasil dibuat!', mimetype: 'image/png' },
      { quoted: m }
    )

  } catch (e) {
    m.reply(`❌ Error\nLogs error : ${e.message}`)
  }
}

handler.help = ['fwa', 'fakewa']
handler.tags = ['maker']
handler.command = ['fakewa', 'fwa', 'fakewhatsapp']
handler.register = true
handler.limit = true

export default handler