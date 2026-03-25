const handler = async (m, {
    usedPrefix,
    db
}) => {
    const user = db.get("user", m.sender);

    if (!user?.life || !user.life.verified) {
        return m.reply("⚠️ Kamu belum pernah set life sebelumnya.");
    }

    delete user.life;

    await m.reply(
        `✅ Data life kamu berhasil dihapus!\n\nGunakan *${usedPrefix}setlife* untuk mendaftarkan kehidupan baru.`
    );
};

handler.command = ["unlife"];
handler.tags = ["rpg"];
handler.premium = true;
handler.rpg = true
export default handler;