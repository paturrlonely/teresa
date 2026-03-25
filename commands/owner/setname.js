const handler = async (m, {
    text,
    db
}) => {
    if (!text) return m.reply(`Contoh: .setname ${global.botname}`);

    const newName = text.trim();
    if (newName.length < 3) return m.reply("Nama bot minimal 3 karakter!");
    if (newName.length > 30) return m.reply("Nama bot maksimal 30 karakter!");

    global.botname = newName;
    db.list().settings.botname = newName;
    await db.save();

    m.reply(`✅ Nama bot berhasil diganti menjadi *${newName}*`);
};

handler.command = ["setnamebot"];
handler.tags = "owner";
handler.description = "Mengganti nama bot (hanya owner).";
handler.owner = true;

export default handler;