const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command,
    db,
    isAdmin,
    isBotAdmin
}) => {
    // Cek apakah dalam grup
    if (!m.isGroup) {
        return m.reply("Perintah ini hanya bisa digunakan dalam grup.");
    }

    // Cek apakah pengguna adalah admin
    if (!isAdmin) {
        return m.reply("Perintah ini hanya untuk admin grup.");
    }

    // Cek apakah bot adalah admin
    if (!isBotAdmin) {
        return m.reply("Bot harus menjadi admin untuk mengelola custom prefix grup.");
    }

    // Ambil argumen
    const action = args[0];
    const prefixValue = args[1];

    // Jika tidak ada argumen, tampilkan bantuan
    if (!action) {
        return m.reply(`*Custom Prefix Grup*\n\nGunakan perintah:\n${usedPrefix + command} set [prefix] - Atur custom prefix grup\n${usedPrefix + command} reset - Reset custom prefix grup ke default\n${usedPrefix + command} get - Lihat custom prefix grup saat ini`);
    }

    // Ambil data grup dari database
    const groupData = db.get("group", m.from) || {};

    switch (action.toLowerCase()) {
        case 'set':
            if (!prefixValue) {
                return m.reply(`Gunakan: ${usedPrefix + command} set [prefix]\nContoh: ${usedPrefix + command} set !`);
            }

            // Validasi prefix - hanya karakter tunggal atau string pendek
            if (prefixValue.length > 5) {
                return m.reply("Prefix terlalu panjang. Gunakan maksimal 5 karakter.");
            }

            // Update custom prefix grup
            groupData.customPrefix = prefixValue;
            await db.add("group", m.from, groupData);
            
            m.reply(`Custom prefix grup berhasil diatur ke: ${prefixValue}`);
            break;

        case 'reset':
            // Reset custom prefix grup
            groupData.customPrefix = null;
            await db.add("group", m.from, groupData);
            
            m.reply("Custom prefix grup berhasil direset ke default.");
            break;

        case 'get':
            const currentPrefix = groupData.customPrefix || "Default (^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^])";
            m.reply(`Custom prefix grup saat ini: ${currentPrefix}`);
            break;

        default:
            m.reply(`Perintah tidak dikenal. Gunakan:\n${usedPrefix + command} set [prefix] - Atur custom prefix grup\n${usedPrefix + command} reset - Reset custom prefix grup\n${usedPrefix + command} get - Lihat custom prefix grup`);
    }
};

handler.command = ['groupprefix', 'setgroupprefix', 'prefixgrup'];
handler.tags = 'group';
handler.description = 'Atur custom prefix untuk grup';
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
export default handler;