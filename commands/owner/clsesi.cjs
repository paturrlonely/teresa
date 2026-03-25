const fs = require("fs");

const handler = async (m, {
    conn
}) => {
    try {
        await m.reply("🧹 *Memproses pembersihan session...*");

        const sessionDir = "./sessions";
        if (!fs.existsSync(sessionDir)) return m.reply("⚠️ Folder sessions tidak ditemukan.");

        const sessionFiles = fs.readdirSync(sessionDir).filter(f => f !== "creds.json");

        if (sessionFiles.length === 0)
            return m.reply("Tidak ada sampah session ditemukan ✅");

        // Hapus file-file sesi
        for (let file of sessionFiles) {
            fs.unlinkSync(`${sessionDir}/${file}`);
        }

        await new Promise(res => setTimeout(res, 1500));

        await m.reply(`✅ Sukses membersihkan *${sessionFiles.length}* sampah session!`);
    } catch (err) {
        console.error(err);
        await m.reply(`⚠️ Terjadi kesalahan: ${err.message}`);
    }
};

handler.help = ['clearsession'];
handler.tags = ['owner'];
handler.command = /^(clearsession|clsesi|clearsesion)$/i;
handler.owner = true;

module.exports = handler;