const handler = async (m, { db, text }) => {
  try {
    if (!text) {
      return m.reply("❌ Format salah!\nGunakan: changename <nama baru>");
    }

    let user = db.get("user", m.sender) || {
      name: m.sender,
      premium: false,
      owner: false,
      history: [],
      limit: 0
    };

    if (!user.premium && !user.owner) {
      return m.reply("❌ Fitur ini hanya untuk Premium/Owner!");
    }

    const oldName = user.name || m.sender;
    const newName = text.trim();

    user.name = newName;

    if (!Array.isArray(user.history)) user.history = [];
    user.history.push({
      from: oldName,
      to: newName,
      at: Date.now()
    });

    await db.save();

    m.reply(
      `✅ Nama berhasil diubah!\n- Nama lama: ${oldName}\n- Nama baru: ${newName}`
    );
  } catch (err) {
    console.error("ChangeName Error:", err);
    m.reply(`❌ Terjadi kesalahan:\n${err.message}`);
  }
};

handler.help = ["changename <nama baru>"];
handler.tags = ["main"];
handler.command = ["changename", "setname"];
handler.limit = false;
handler.premium = false;

module.exports = handler;