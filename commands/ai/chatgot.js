/**
 *» Nama :* — [ CHATGOT AI ] —
 *» Type :* Plugin - ESM
 *» Base Url :* https://www.chatgot.io
 *» Saluran :* https://whatsapp.com/channel/0029Vb7XfVV2v1IzPVqjgq37
 *» Creator :* -Ɗαnčoᴡ々
 **/

import axios from 'axios'
import crypto from 'crypto'

const API_BASE = 'https://api.chatgot.io/api'
const TEMPMAIL_API = 'https://api.nekolabs.web.id/tools/tempmail/v1'
const CF_BYPASS_API = 'https://api.nekolabs.web.id/tools/bypass/cf-turnstile'
const CLOUDFLARE_SITEKEY = '0x4AAAAAAAxfq-hBQkOyW7zF'

const MODELS = {
    'gpt4omini': 'openai/gpt-4o-mini',
    'gpt41mini': 'openai/gpt-4.1-mini',
    'claude3haiku': 'anthropic/claude-3-haiku',
    'llama31': 'meta-llama/llama-3.1-70b-instruct',
    'gemini25lite': 'google/gemini-2.5-flash-lite',
    'deepseek': 'deepseek/deepseek-chat'
}

let sessions = {}

const generatePassword = () => {
    return crypto.createHash('md5').update(Math.random().toString()).digest('hex')
}

const getCloudflareToken = async () => {
    const {
        data
    } = await axios.get(CF_BYPASS_API, {
        params: {
            url: 'https://www.chatgot.io/',
            siteKey: CLOUDFLARE_SITEKEY
        }
    })

    if (!data.success) throw 'Gagal bypass Cloudflare'
    return data.result
}

const createTempEmail = async () => {
    const {
        data
    } = await axios.get(`${TEMPMAIL_API}/create`)

    if (!data?.success) throw 'Gagal membuat email'
    return data.result
}

const getEmailCode = async (sessionId, retries = 10) => {
    for (let i = 0; i < retries; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000))

        const {
            data
        } = await axios.get(`${TEMPMAIL_API}/inbox`, {
            params: {
                id: sessionId
            }
        })

        if (data?.success && data.result?.emails?.length > 0) {
            const email = data.result.emails[0]
            const codeMatch = (email.text || email.html || '').match(/\b(\d{6})\b/)

            if (codeMatch) return codeMatch[1]
        }
    }

    throw 'Kode verifikasi tidak ditemukan'
}

const registerAccount = async () => {
    const {
        email,
        sessionId
    } = await createTempEmail()

    const checkRes = await axios.post(`${API_BASE}/verify/check-email`, {
        email
    })
    if (checkRes.data?.data?.registered) throw 'Email sudah terdaftar'

    const cfToken = await getCloudflareToken()

    await axios.post(`${API_BASE}/verify/send-email`, {
        email,
        type: 'register',
        cf_challenge_token: cfToken
    })

    const emailCode = await getEmailCode(sessionId)
    const password = generatePassword()

    const registerRes = await axios.post(`${API_BASE}/user/register`, {
        email,
        password,
        emailCode,
        invitationId: '',
        gtag: {
            utm_source: 'chatgot_www',
            utm_medium: 'unknow',
            utm_campaign: 'unknow',
            utm_term: 'unknow',
            utm_content: 'unknow',
            utm_id: 'unknow'
        },
        referer: 'https://www.chatgot.io/'
    })

    if (registerRes.data?.code !== 0) throw 'Gagal register'

    const loginRes = await axios.post(`${API_BASE}/user/login`, {
        email,
        password
    })

    if (loginRes.data?.code !== 0) throw 'Gagal login'

    return {
        email,
        token: loginRes.data.data.token,
        clId: null
    }
}

const getOrCreateSession = async (userId) => {
    if (!sessions[userId] || !sessions[userId].token) {
        sessions[userId] = await registerAccount()
    }
    return sessions[userId]
}

const checkQuota = async (token) => {
    try {
        const {
            data
        } = await axios.get(`${API_BASE}/quota/retrieve`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'i-version': '1.1.70',
                'i-platform': 'web_h5',
                'i-lang': 'en'
            }
        })

        const available = data?.data?.list?.[0]?.available || 0
        return available > 0
    } catch {
        return false
    }
}

const chatWithAI = async (token, clId, prompt, model) => {
    const {
        data
    } = await axios.post(
        `${API_BASE}/v2/chat/conversation`, {
            clId: clId || undefined,
            model,
            prompt,
            webAccess: 'close',
            timezone: 'Asia/Jakarta'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'i-version': '1.1.70',
                'i-platform': 'web_h5',
                'i-lang': 'en',
                'Origin': 'https://www.chatgot.io',
                'Referer': 'https://www.chatgot.io/'
            },
            responseType: 'stream'
        }
    )

    let result = ''
    let newClId = clId

    return new Promise((resolve, reject) => {
        data.on('data', chunk => {
            const lines = chunk.toString().split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(line.slice(6))

                        if (json.code === 201) {
                            newClId = json.data.clId
                        } else if (json.code === 202 && json.data.type === 'chat') {
                            result += json.data.content
                        }
                    } catch {}
                }
            }
        })

        data.on('end', () => resolve({
            text: result,
            clId: newClId
        }))
        data.on('error', reject)
    })
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Masukkan pertanyaan!\n\nContoh: *${usedPrefix + command}* Halo, siapa kamu?`)
    }

    const selectedModel = 'openai/gpt-4o-mini'

    try {
        await m.reply('_Memproses..._')

        const userId = m.sender
        let session = await getOrCreateSession(userId)

        const hasQuota = await checkQuota(session.token)

        if (!hasQuota) {
            await m.reply('_Quota habis, membuat akun baru..._')
            session = await registerAccount()
            sessions[userId] = session
        }

        const response = await chatWithAI(
            session.token,
            session.clId,
            text,
            selectedModel
        )

        sessions[userId].clId = response.clId

        await m.reply(response.text || 'Tidak ada respon')

    } catch (e) {
        await m.reply(`❌ Error: ${e}`)
    }
}

handler.help = ['chatgot *( text )*']
handler.tags = ['ai']
handler.command = /^(chatgot)$/i

export default handler