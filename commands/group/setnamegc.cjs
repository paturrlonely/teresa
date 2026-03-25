const handler = async (m, {
    conn,
    args
}) => {
    if (!args || args.length === 0)
        return m.reply('❌ Silakan tulis nama baru untuk grup. Contoh: .setnamegc Nama Baru');

    try {
        await conn.groupUpdateSubject(m.chat, args.join(" "));
        m.reply('✅ Sukses mengganti nama grup');
    } catch (err) {
        console.error(err);
        m.reply('❌ Gagal mengganti nama grup. Pastikan bot memiliki hak admin.');
    }
};

handler.help = ['setnamegc'];
handler.tags = ['group'];
handler.command = ['setnamegc'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

module.exports = handler;