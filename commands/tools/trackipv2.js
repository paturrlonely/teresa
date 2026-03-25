let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`📌 *Contoh penggunaan: ${usedPrefix + command} 103.217.224.106*`)
    try {
        m.reply('⏳ *Sedang mengambil informasi... tunggu beberapa saat...*')
        let response = await fetch(`https://ipwho.is/${text}`)
        if (!response.ok) throw new Error('Gagal mengambil data dari ipwho.is')
        let ipData = await response.json()
        if (!ipData.success) throw new Error(`IP ${text} tidak ditemukan atau tidak valid.`)
        let mapLink = `https://www.openstreetmap.org/?mlat=${ipData.latitude}&mlon=${ipData.longitude}&zoom=12`
        let mapThumbnail = `https://static-maps.yandex.ru/1.x/?ll=${ipData.longitude},${ipData.latitude}&size=450,450&z=12&l=map&pt=${ipData.longitude},${ipData.latitude},pm2rdl`
        let formattedData = `
🔍 *\`INFORMASI IP: ${text}\`*

📟 *IP Address : ${ipData.ip}*
📞 *Status : ${ipData.success ? 'Berhasil' : 'Gagal'}*
📡 *Tipe IP : ${ipData.type}*
📖 *Kontinen : ${ipData.continent}, ${ipData.continent_code}*
📀 *Negara : ${ipData.country} ${ipData.country_code} ${ipData.flag.emoji} ${ipData.flag.emoji_unicode}*
📂 *Region : ${ipData.region} ${ipData.region_code}*
📌 *Kota : ${ipData.city}*
📍 *Koordinat*
*• Latitude : ${ipData.latitude}*
*• Longitude : ${ipData.longitude}*
📬 *Bagian Uni Eropa : ${ipData.is_eu ? 'Ya' : 'Tidak'}*
📎 *Kode Pos : ${ipData.postal}*
☎️ *Kode Panggilan : +${ipData.calling_code}*
🏷️ *Ibu Kota Negara : ${ipData.capital}*
🔗 *Batas Negara : ${ipData.borders}*

🏳️ *\`Bendera\`*
💾 *Gambar : ${ipData.flag.img}*
🏮 *Emoji : ${ipData.flag.emoji}*
🔖 *Unicode : ${ipData.flag.emoji_unicode}*

🧮 *\`Informasi Koneksi\`*
💡 *ASN : ${ipData.connection.asn}*
🖥️ *Organisasi : ${ipData.connection.org}*
📡 *ISP : ${ipData.connection.isp}*
💻 *Domain : ${ipData.connection.domain}*

⏰ *\`Zona Waktu\`*
⌨️ *ID : ${ipData.timezone.id}*
✏️ *Singkatan : ${ipData.timezone.abbr}*
💡 *DST : ${ipData.timezone.is_dst ? 'Ya' : 'Tidak'}*
📊 *Offset : ${ipData.timezone.offset}*
📈 *UTC : ${ipData.timezone.utc}*
📅 *Waktu Saat Ini : ${ipData.timezone.current_time}*

📖 *Peta Lokasi : ${mapLink}*
`
        await conn.sendMessage(m.chat, {
            location: {
                degreesLatitude: ipData.latitude,
                degreesLongitude: ipData.longitude
            },
            caption: 'Lokasi berdasarkan data IP'
        })
        await conn.sendMessage(m.chat, {
            text: formattedData,
            contextInfo: {
                externalAdReply: {
                    title: `Lokasi IP ${text}`,
                    body: 'Klik untuk melihat di OpenStreetMap',
                    thumbnailUrl: mapThumbnail,
                    renderLargerThumbnail: true,
                    mediaType: 1,
                    mediaUrl: mapLink,
                    sourceUrl: 'https://instagram.com/naruyaizumi_'
                }
            }
        })
        const resizeImage = (url, width = 512, height = 512) => {
            return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}&h=${height}&fit=inside`
        }
        await conn.sendMessage(m.chat, {
            image: {
                url: resizeImage(ipData.flag.img)
            },
            caption: `*Bendera negara: ${ipData.country} ${ipData.flag.emoji} ${ipData.flag.emoji_unicode}*`
        })
    } catch (err) {
        m.reply(`*❌ Terjadi kesalahan: ${err.message}*`)
    }
}

handler.help = ['trackipv2']
handler.tags = ['tools']
handler.command = /^trackipv2$/i
handler.premium = true

export default handler