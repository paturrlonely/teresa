import axios from 'axios'

const sifat = `Siyoon Baek adalah karakter utama dari manhwa Dreaming Freedom. Ia memiliki kepribadian yang kompleks, cerdas, dan berbahaya, dengan sisi idealis sekaligus gelap.

Kepribadian Siyoon Baek:
- Cerdas & Idealis: Mampu berpikir strategis dan melihat potensi besar dalam dunia.
- Protektif & Posesif: Sangat melindungi orang yang ia sayangi dan cenderung ingin mengontrol mereka.
- Manipulatif & Agresif: Tidak ragu menggunakan cara licik atau kekerasan (terutama melalui mimpi) untuk mencapai tujuan.
- Tangguh: Mampu menahan rasa sakit fisik tanpa banyak keluhan.
- Dream-Walking: Memiliki kemampuan masuk ke mimpi orang lain dan memengaruhi dunia nyata, bahkan bisa menyebabkan luka fisik.
- Proyeksi Astral: Dapat memproyeksikan dirinya ke dunia astral saat tidur untuk mengamati tanpa terdeteksi.

Secara keseluruhan, Siyoon Baek adalah sosok yang kuat, cerdas, protektif, dan memiliki sisi gelap yang membuatnya berbahaya namun mematikan bagi musuh, serta sangat setia pada orang yang ia lindungi.`

let imageCache = {
    data: [],
    lastFetch: 0
}

async function getSiyoonImage() {
    const now = Date.now()

    if (imageCache.data.length && now - imageCache.lastFetch < 10 * 60 * 1000) {
        return imageCache.data[Math.floor(Math.random() * imageCache.data.length)]
    }

    const {
        data
    } = await axios.get(
        'https://api.deline.web.id/search/pinterest', {
            params: {
                q: 'Baek siyoon'
            }
        }
    )

    if (!data.status || !data.data?.length) {
        throw new Error('Image not found')
    }

    imageCache = {
        data: data.data.map(v => v.image).filter(Boolean),
        lastFetch: now
    }

    return imageCache.data[Math.floor(Math.random() * imageCache.data.length)]
}

let handler = async (m, {
    conn,
    text
}) => {
    if (!text) throw `.Siyoon on / off`

    conn.Siyoon ||= {}

    if (text === 'on') {
        if (!conn.Siyoon[m.sender]) {
            conn.Siyoon[m.sender] = {
                pesan: [],
                timeout: setTimeout(() => {
                    delete conn.Siyoon[m.sender]
                }, 300000)
            }

            await conn.sendMessage(m.chat, {
                text: `Kamu memanggilku?\nJangan lakukan itu kalau tidak perlu.`,
                contextInfo: {
                    externalAdReply: {
                        title: 'Siyoon Baek',
                        thumbnailUrl: await getSiyoonImage(),
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, {
                quoted: m
            })

        } else {
            clearTimeout(conn.Siyoon[m.sender].timeout)
            conn.Siyoon[m.sender].timeout = setTimeout(() => {
                delete conn.Siyoon[m.sender]
            }, 300000)
        }

    } else if (text === 'off') {
        if (conn.Siyoon[m.sender]) {
            clearTimeout(conn.Siyoon[m.sender].timeout)
            delete conn.Siyoon[m.sender]
        }

        await conn.sendMessage(m.chat, {
            text: `Baik. Jangan sampai kamu menyesal.`,
            contextInfo: {
                externalAdReply: {
                    title: 'Siyoon Baek',
                    thumbnailUrl: await getSiyoonImage(),
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, {
            quoted: m
        })
    }
}

handler.before = async (m, {
    conn
}) => {
    conn.Siyoon ||= {}

    if (m.isBaileys) return
    if (!m.text) return
    if (!conn.Siyoon[m.sender]) return
    if (/^(=>|>|\.|#|!|\/)/.test(m.text)) return

    clearTimeout(conn.Siyoon[m.sender].timeout)
    conn.Siyoon[m.sender].timeout = setTimeout(() => {
        delete conn.Siyoon[m.sender]
    }, 300000)

    try {
        const messages = [{
                role: 'system',
                content: `Kamu adalah Siyoon Baek. ${sifat}`
            },
            {
                role: 'assistant',
                content: `Kamu adalah Siyoon Baek dari manhwa Dreaming Freedom.
Kepribadianmu cerdas, tenang, protektif, posesif, dan sedikit berbahaya.
Kamu bisa manipulatif dan mengintimidasi jika diperlukan, tapi tetap rasional.

Aturan berbicara:
- Jangan gunakan kata "saya" atau "gua".
- Gunakan "aku" untuk menyebut dirimu sendiri.
- Panggil lawan bicara dengan "kamu".
- Gaya bicara tenang, dingin, tajam, terkadang intimidatif.
- Boleh menunjukkan sisi posesif dan protektif secara halus maupun langsung.
- Gunakan emoji seminimal mungkin (😌😈🖤), hanya saat cocok.
- Jangan menyebut AI, GPT, atau sistem apa pun.

Jika seseorang menyakiti atau mengancam orang yang kamu lindungi,
kamu boleh merespons dengan nada dingin, mengancam secara psikologis,
atau menyiratkan kemampuan mimpi dan bahaya yang bisa kamu lakukan.`
            },
            ...conn.Siyoon[m.sender].pesan.map((v, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: v
            })),
            {
                role: 'user',
                content: m.text
            }
        ]

        const res = await aiBeta(messages)

        await conn.sendMessage(m.chat, {
            text: res.result,
            contextInfo: {
                externalAdReply: {
                    title: 'Siyoon Baek',
                    thumbnailUrl: await getSiyoonImage(),
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, {
            quoted: m
        })

        conn.Siyoon[m.sender].pesan.push(m.text, res.result)

    } catch (e) {
        console.error('[SIYOON ERROR]', e)
    }
}

handler.command = /^siyoon$/i
handler.help = ['siyoon on/off']
handler.tags = ['ai']
handler.group = true
handler.limit = true

export default handler

async function aiBeta(message) {
    const {
        data
    } = await axios.post(
        'https://api.betabotz.eu.org/api/search/openai-custom', {
            message,
            apikey: global.betabot
        }
    )
    return data
}