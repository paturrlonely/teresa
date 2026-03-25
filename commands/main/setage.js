const handler = async (m, {
    db,
    text
}) => {
    try {
        if (!text) return m.reply("❌ Format: .changeage <umur>");

        const age = parseInt(text);
        if (isNaN(age)) return m.reply("❌ Umur harus berupa angka.");

        const jid = m.sender;

        let user =
            (typeof db.get === "function" ?
                db.get("user", jid) :
                db.data?.users?.[jid]) || {};

        if (!user.historyAge) user.historyAge = [];

        const oldAge = user.age ?? "belum diatur";

        user.age = age;

        user.historyAge.push({
            from: oldAge,
            to: age,
            at: Date.now(),
        });

        if (typeof db.set === "function") {
            await db.set("user", jid, user);
        } else {
            if (!db.data) db.data = {};
            if (!db.data.users) db.data.users = {};
            db.data.users[jid] = user;
            if (typeof db.save === "function") await db.save();
        }

        m.reply(`✅ Umur berhasil diubah: ${oldAge} → ${age}`);
    } catch (err) {
        console.error("ChangeAge Error:", err);
        m.reply(`❌ Terjadi kesalahan:\n${err.message}`);
    }
};

handler.help = ["changeage <umur>"];
handler.tags = ["main"];
handler.command = ["changeage", "setage"];
handler.limit = false;
handler.premium = false;

export default handler;