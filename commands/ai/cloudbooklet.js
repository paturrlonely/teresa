

import fetch from 'node-fetch'
import crypto from 'crypto'
import FormData from 'form-data'

const API_URL = 'https://api.cloudbooklet.com'
const ORIGIN = 'https://www.cloudbooklet.com'
const REFERER = 'https://www.cloudbooklet.com/'
const HOST = 'cloudbooklet'
const TOKEN = '373puhy7df13a6typ3bhrh'

const sessions = new Map()

function getUserSession(id) {
    if (sessions.has(id)) return sessions.get(id)

    const session = crypto.randomUUID()
    const visitorid = crypto
        .createHash('md5')
        .update(id)
        .digest('hex')

    const data = {
        session,
        visitorid
    }
    sessions.set(id, data)
    return data
}

function pickTextSSE(raw) {
    if (!raw) return ''
    return raw
        .split(/\r?\n/)
        .map(v => v.trim())
        .filter(v =>
            v &&
            !v.startsWith(':') &&
            !v.startsWith('event:') &&
            !v.startsWith('id:') &&
            !v.startsWith('retry:')
        )
        .map(v => v.startsWith('data:') ? v.slice(5).trim() : v)
        .filter(Boolean)
        .join('\n')
}

async function cloudbookletChat({
    prompt,
    session,
    visitorid
}) {
    const form = new FormData()
    form.append('prompt', prompt)
    form.append('session', session)
    form.append('visitorid', visitorid)
    form.append('system', '')
    form.append('token', TOKEN)
    form.append('host', HOST)

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            Accept: 'text/event-stream',
            Origin: ORIGIN,
            Referer: REFERER,
            'Cache-Control': 'max-age=0',
            ...form.getHeaders()
        },
        body: form
    })

    const raw = await res.text()
    const text = pickTextSSE(raw)

    if (!res.ok) throw `HTTP ${res.status}`
    if (!text) throw 'Tidak ada balasan dari server'

    return text
}

let handler = async (m, {
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(
            `Masukkan pertanyaan!`
        )
    }

    const {
        session,
        visitorid
    } = getUserSession(m.sender)

    try {
        const result = await cloudbookletChat({
            prompt: text.trim(),
            session,
            visitorid
        })
        await m.reply(result)
    } catch (e) {
        await m.reply(`Error: ${e}`)
    }
}

handler.help = ['cloudbooklet <prompt>']
handler.tags = ['ai']
handler.command = ['cloudbooklet']

export default handler