export async function before(m, { db, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.get("group", m.chat) || {}

    // Hanya tangani pesan yang dihapus (protocolMessage type 0)
    if (!m.message?.protocolMessage || m.message.protocolMessage.type !== 0) return true

    const key = m.key
    const user = key.participant || key.remoteJid

    console.log('[ANTIDELETE DEBUG] Mendeteksi pesan dihapus')
    console.log('[ANTIDELETE DEBUG] Group ID:', key.remoteJid)
    console.log('[ANTIDELETE DEBUG] User:', user)
    console.log('[ANTIDELETE DEBUG] Key ID:', key.id)
    console.log('[ANTIDELETE DEBUG] Antidelete aktif di group?', group.antidelete)

    if (!group.antidelete) {
        console.log('[ANTIDELETE DEBUG] Antidelete nonaktif, skip.')
        return true
    }

    let tipe = '📌 Lainnya'
    if (m.message?.protocolMessage?.key?.id) tipe = '💬 / Media Dihapus'
    console.log(`[ANTIDELETE DEBUG] Tipe pesan: ${tipe}`)

    // Kirim notifikasi penghapusan
    try {
        await conn.sendMessage(key.remoteJid, {
            text: `🗑️ *Antidelete Aktif*\n@${user.split('@')[0]} menghapus pesan (${tipe})`,
            mentions: [user]
        })
        console.log('[ANTIDELETE DEBUG] Pesan notifikasi terkirim')
    } catch (e) {
        console.log('[ANTIDELETE DEBUG] Gagal kirim notifikasi', e)
    }

    // Ambil pesan asli dari cache
    try {
        const deletedMsg = global.msgCache?.[key.remoteJid]?.get(m.message.protocolMessage.key.id)
        if (deletedMsg) {
            await conn.copyNForward(key.remoteJid, deletedMsg, true)
            console.log('[ANTIDELETE DEBUG] Pesan yang dihapus berhasil dikembalikan')
        } else {
            console.log('[ANTIDELETE DEBUG] Pesan asli tidak ditemukan di cache')
        }
    } catch (e) {
        console.log('[ANTIDELETE DEBUG] Gagal forward pesan yang dihapus', e)
    }

    return true
}