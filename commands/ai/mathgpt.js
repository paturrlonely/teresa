/**
 *» Nama :* — [ MATH-GPT PRO AI ] —
 *» Type :* Plugin - ESM
 *» Base Url :* https://math-gpt.pro
 *» Saluran :* https://whatsapp.com/channel/0029Vb7XfVV2v1IzPVqjgq37
 *» Creator :* -Ɗαnčoᴡ々
 **/

import fetch from 'node-fetch'
import FormData from 'form-data'
import {
    fileTypeFromBuffer
} from 'file-type'

const BASE_URL = 'https://math-gpt.pro'
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36'

async function getCsrfToken() {
    const response = await fetch(BASE_URL, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    })

    const html = await response.text()
    const cookies = response.headers.raw()['set-cookie']

    const tokenMatch = html.match(/name="_token"[^>]+value="([^"]+)"/i) ||
        html.match(/csrf[_-]?token["']?\s*:\s*["']([^"']+)["']/i)

    if (!tokenMatch) throw new Error('CSRF token tidak ditemukan')

    let xsrf = '',
        session = ''

    if (cookies) {
        cookies.forEach(cookie => {
            if (cookie.includes('XSRF-TOKEN=')) xsrf = cookie.split('XSRF-TOKEN=')[1].split(';')[0]
            if (cookie.includes('laravel_session=')) session = cookie.split('laravel_session=')[1].split(';')[0]
        })
    }

    return {
        token: tokenMatch[1],
        cookie: `XSRF-TOKEN=${xsrf}; laravel_session=${session}`
    }
}

async function uploadImage(buffer, csrf) {
    const fileType = await fileTypeFromBuffer(buffer)
    const form = new FormData()

    form.append('image', buffer, {
        filename: `image.${fileType?.ext || 'jpg'}`,
        contentType: fileType?.mime || 'image/jpeg'
    })
    form.append('_token', csrf.token)

    const response = await fetch(`${BASE_URL}/upload-image`, {
        method: 'POST',
        headers: {
            'User-Agent': USER_AGENT,
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': csrf.cookie,
            ...form.getHeaders()
        },
        body: form
    })

    if (!response.ok) throw new Error(`Upload gagal: HTTP ${response.status}`)

    const result = await response.json()
    if (!result.file) throw new Error('Upload gagal: Tidak ada file')

    return result.file
}

async function chatAI(message, imageFile, csrf) {
    const body = {
        message,
        _token: csrf.token
    }
    if (imageFile) body.image = imageFile

    const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
            'X-CSRF-TOKEN': csrf.token,
            'Cookie': csrf.cookie
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) throw new Error(`Chat gagal: HTTP ${response.status}`)

    const result = await response.json()
    if (!result.reply) throw new Error('Tidak ada respon dari AI')

    return result.reply
}

async function handler(m, {
    text,
    usedPrefix,
    command
}) {
    const q = m.quoted || m
    const mime = q.mimetype || ''

    if (!text && !mime.startsWith('image/')) {
        return m.reply(`Contoh:\n${usedPrefix + command} integral x^2\n\nAtau reply gambar:\n${usedPrefix + command}\n${usedPrefix + command} jelaskan ini`)
    }

    try {
        const csrf = await getCsrfToken()
        let imageFile = null

        if (mime.startsWith('image/')) {
            const buffer = await q.download()
            imageFile = await uploadImage(buffer, csrf)
        }

        const prompt = text || 'Solve this problem'
        const reply = await chatAI(prompt, imageFile, csrf)

        await m.reply(reply.trim())
    } catch (err) {
        await m.reply(`❌ Error: ${err.message}`)
    }
}

handler.help = ['mathgpt <text/reply image>']
handler.tags = ['ai']
handler.command = /^(mathgpt|math|mathgptpro)$/i

export default handler