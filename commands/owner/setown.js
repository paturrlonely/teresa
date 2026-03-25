const handler = async (m, {
    text,
    db
}) => {
    if (!text) return m.reply(`Contoh: .setown ${global.ownername}`);

    const newName = text.trim();
    if (newName.length < 3) return m.reply("Nama owner minimal 3 karakter!");
    if (newName.length > 30) return m.reply("Nama owner maksimal 30 karakter!");

    global.ownername = newName;
    db.list().settings.ownername = newName;
    await db.save();

    m.reply(`✅ Nama owner berhasil diganti menjadi *${newName}*`);
};

handler.command = ["setnameowner", "setnown"];
handler.tags = "owner";
handler.description = "Mengganti nama owner (hanya owner).";
handler.owner = true;

export default handler;