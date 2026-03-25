const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command,
    db
}) => {
    const action = args[0];
    const prefixValue = args[1];

    if (!action) {
        return m.reply(`*Custom Prefix Pribadi*\n\nGunakan perintah:\n${usedPrefix + command} set [prefix] - Atur custom prefix pribadi\n${usedPrefix + command} reset - Reset custom prefix ke default\n${usedPrefix + command} get - Lihat custom prefix saat ini`);
    }

    const userData = db.get("user", m.sender) || {};

    switch (action.toLowerCase()) {
        case 'set':
            if (!prefixValue) {
                return m.reply(`Gunakan: ${usedPrefix + command} set [prefix]\nContoh: ${usedPrefix + command} set #`);
            }

            if (prefixValue.length > 5) {
                return m.reply("Prefix terlalu panjang. Gunakan maksimal 5 karakter.");
            }

            userData.customPrefix = prefixValue;
            await db.add("user", m.sender, userData);
            
            m.reply(`Custom prefix pribadi berhasil diatur ke: ${prefixValue}`);
            break;

        case 'reset':
            userData.customPrefix = null;
            await db.add("user", m.sender, userData);
            
            m.reply("Custom prefix pribadi berhasil direset ke default.");
            break;

        case 'get':
            const currentPrefix = userData.customPrefix || "Default (^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^])";
            m.reply(`Custom prefix pribadi kamu saat ini: ${currentPrefix}`);
            break;

        default:
            m.reply(`Perintah tidak dikenal. Gunakan:\n${usedPrefix + command} set [prefix] - Atur custom prefix pribadi\n${usedPrefix + command} reset - Reset custom prefix\n${usedPrefix + command} get - Lihat custom prefix`);
    }
};

handler.command = ['myprefix', 'setmyprefix'];
handler.tags = 'main';
handler.description = 'Atur custom prefix pribadi untuk penggunaan bot';
handler.register = true; 
export default handler;