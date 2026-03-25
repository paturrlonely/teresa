const moment = require("moment-timezone");

const handler = async (m, {
    text,
    usedPrefix,
    command,
    db,
    conn
}) => {
    if (!text && !m.isGroup) {
        return m.reply(
            `Gunakan format:\n` +
            `${usedPrefix + command} <durasi> (di grup)\n` +
            `${usedPrefix + command} <group_id> <durasi>\n` +
            `${usedPrefix + command} <linkgrup> <durasi>\n\n` +
            `Contoh:\n` +
            `${usedPrefix + command} 30d\n` +
            `${usedPrefix + command} 120363422829135355@g.us 7d\n` +
            `${usedPrefix + command} https://chat.whatsapp.com/xxxx 7d\n\n` +
            `Durasi:\nd = hari | h = jam | m = menit`
        );
    }

    let groupId;

    const idMatch = text.match(/(\d+@g\.us)/i);
    if (idMatch) {
        groupId = idMatch[1];
    }

    if (!groupId && m.isGroup && !text.includes("chat.whatsapp.com")) {
        groupId = m.chat;
    }

    if (!groupId && text.includes("chat.whatsapp.com")) {
        const code = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/i)?.[1];
        if (!code) return m.reply("Link grup tidak valid.");

        try {
            groupId = await conn.groupAcceptInvite(code);
        } catch {
            return m.reply("Gagal mengambil ID grup dari link.");
        }
    }

    if (!groupId) {
        return m.reply("ID grup tidak ditemukan.");
    }

    const durationMatch = text.match(/(\d+)([dhm])/i);
    if (!durationMatch) {
        return m.reply("Format durasi salah.\nContoh: 30d | 12h | 45m");
    }

    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();

    const durationMs =
        value * {
            d: 86400000,
            h: 3600000,
            m: 60000,
        } [unit];

    let group = db.get("group", groupId);
    if (!group) {
        group = {
            id: groupId
        };
        db.set("group", groupId, group);
    }

    group.premium ??= {
        status: false,
        expired: 0,
    };

    const expired = Date.now() + durationMs;
    group.premium.status = true;
    group.premium.expired = expired;

    await db.save();

    m.reply(
        `✅ *PREMIUM GRUP AKTIF*\n\n` +
        `👥 Group ID: ${groupId}\n` +
        `⏳ Durasi: ${value}${unit}\n` +
        `📆 Expired: ${moment(expired)
        .tz("Asia/Jakarta")
        .format("DD MMMM YYYY, HH:mm:ss")} WIB`
    );
};

handler.command = ["addpremgc", "addpremiumgc"];
handler.tags = ["owner"];
handler.description = "Menambahkan premium ke grup";
handler.owner = true;

module.exports = handler;