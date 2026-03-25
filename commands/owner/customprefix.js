const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command,
    db,
    isOwner
}) => {
    if (!isOwner) {
        return m.reply("Perintah ini hanya untuk owner.");
    }

    const action = args[0];
    const prefixValue = args[1];

    if (!action) {
        return m.reply(`*Custom Prefix*\n\nGunakan perintah:\n${usedPrefix + command} set [prefix] - Atur custom prefix\n${usedPrefix + command} reset - Reset custom prefix ke default\n${usedPrefix + command} get - Lihat custom prefix saat ini`);
    }

    const userData = db.get("user", m.sender) || {};

    switch (action.toLowerCase()) {
        case 'set':
            if (!prefixValue) {
                return m.reply(`Gunakan: ${usedPrefix + command} set [prefix]\nContoh: ${usedPrefix + command} set #`);
            }

            if (prefixValue.length > 5) {
                return m.reply("Prefix kepanjagan. gunakan maksimal 5 karakter.");
            }

            userData.customPrefix = prefixValue;
            await db.add("user", m.sender, userData);
            
            m.reply(`Custom prefix berhasil diatur ke: ${prefixValue}`);
            break;

        case 'reset':
            userData.customPrefix = null;
            await db.add("user", m.sender, userData);
            
            m.reply("Custom prefix berhasil direset ke default.");
            break;

        case 'get':
            const currentPrefix = userData.customPrefix || "Default (^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^])";
            m.reply(`Custom prefix Anda saat ini: ${currentPrefix}`);
            break;

        default:
            m.reply(`Perintah tidak dikenal. Gunakan:\n${usedPrefix + command} set [prefix] - Atur custom prefix\n${usedPrefix + command} reset - Reset custom prefix\n${usedPrefix + command} get - Lihat custom prefix`);
    }
};

handler.command = ['customprefix', 'setprefix', 'myprefix'];
handler.tags = 'main';
handler.description = 'Atur custom prefix untuk penggunaan bot';
handler.owner = true; 
export default handler;