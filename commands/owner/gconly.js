const handler = async (m, { text, db }) => {
    if (!text) return m.reply("Contoh: .gconly on / .gconly off");

    const value = text.toLowerCase();
    if (!["on", "off"].includes(value)) return m.reply("Gunakan on atau off!");

    const isGconly = value === 'on';
    db.list().settings.gconly = isGconly;
    await db.save();

    m.reply(`✅ Mode gconly telah *${isGconly ? "AKTIF" : "NONAKTIF"}*!`);
};

handler.command = ["gconly"];
handler.tags = "owner";
handler.description = "Mengaktifkan/menonaktifkan mode gconly (hanya grup).";
handler.owner = true;

export default handler;
