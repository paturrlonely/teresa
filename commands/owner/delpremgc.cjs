const handler = async (m, {
    text,
    usedPrefix,
    command,
    db
}) => {
    if (!text && !m.isGroup) {
        return m.reply(
            `Gunakan format:\n` +
            `${usedPrefix + command} (di grup)\n` +
            `${usedPrefix + command} <group_id>\n\n` +
            `Contoh:\n` +
            `${usedPrefix + command}\n` +
            `${usedPrefix + command} 120363422829135355@g.us`
        );
    }

    let groupId;

    const idMatch = text?.match(/(\d+@g\.us)/i);
    if (idMatch) {
        groupId = idMatch[1];
    }

    if (!groupId && m.isGroup) {
        groupId = m.chat;
    }

    if (!groupId) {
        return m.reply("ID grup tidak ditemukan.");
    }

    const group = db.get("group", groupId);
    if (!group || !group.premium?.status) {
        return m.reply("Grup ini tidak memiliki premium aktif.");
    }

    group.premium.status = false;
    group.premium.expired = 0;

    await db.save();

    m.reply(
        `✅ *PREMIUM GRUP DINONAKTIFKAN*\n\n` +
        `👥 Group ID: ${groupId}`
    );
};

handler.command = ["delpremgc", "delpremiumgc"];
handler.tags = ["owner"];
handler.description = "Menghapus status premium dari grup";
handler.owner = true;

module.exports = handler;