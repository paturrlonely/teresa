const handler = async (m, {
    conn,
    db
}) => {
    const groupData = db.get("group", m.chat) || {
        mute: false,
        sewa: {
            status: false,
            expired: 0
        },
        antilink: false,
        welcome: true,
        detect: true,
        warnings: {},
        banchat: false
    };

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
    const members = groupMetadata?.participants || [];

    const pp = await conn.profilePictureUrl(m.chat, "image")
        .catch(() => "https://cloudkuimages.guru/uploads/images/pg5XDGVr.jpg");

    const groupAdmins = members.filter(p => p.admin) || [];
    const listAdmin = groupAdmins.length ?
        groupAdmins.map((v, i) => `🍩 *${i + 1}.* @${v.id.split("@")[0]}`).join("\n") :
        "*Tidak ada admin~*";

    const owner = groupMetadata?.owner ||
        groupAdmins.find(p => p.admin === "superadmin")?.id ||
        m.chat.split("-")[0] + "@s.whatsapp.net";

    const text = `
🎀 *Info Grup Saat Ini* 🎀

🍡 *ID Grup:* 
*${groupMetadata?.id ?? "Tidak diketahui"}*

🍰 *Nama Grup:* 
*${groupMetadata?.subject ?? "Tidak diketahui"}*

🍬 *Deskripsi:* 
${groupMetadata?.desc?.toString() || "*Belum ada deskripsi~*"}

🍓 *Jumlah Member:* 
*${members.length} orang*

🍮 *Pemilik Grup:* 
@${owner ? owner.split("@")[0] : "Tidak diketahui"}

🧁 *Admin Grup:*
${listAdmin}

⚙️ *Pengaturan Grup:*
- Mute: ${groupData.mute ? "✅" : "❌"}
- Welcome: ${groupData.welcome ? "✅" : "❌"}
- AntiLink: ${groupData.antilink ? "✅" : "❌"}
- Detect: ${groupData.detect ? "✅" : "❌"}
- BanChat: ${groupData.banchat ? "✅" : "❌"}
- Sewa: ${groupData.sewa.status ? `✅ (Expired: ${new Date(groupData.sewa.expired).toLocaleString()})` : "❌"}
`.trim();

    await conn.sendMessage(
        m.chat, {
            image: {
                url: pp
            },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner].filter(Boolean),
        }, {
            quoted: m
        }
    );
};

handler.help = ["infogrup"];
handler.category = ["group"];
handler.command = ["infogrup", "groupinfo", "gcinfo"];
handler.group = true;
handler.admin = true;

module.exports = handler;