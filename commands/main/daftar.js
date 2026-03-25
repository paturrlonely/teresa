import {
    createHash
} from "crypto";

const handler = async (m, {
    text,
    command,
    user,
    db
}) => {
    const database = db || global.db;
    if (!database) {
        return m.reply("⚠️ Database tidak ditemukan. Pastikan global.db sudah diinisialisasi.");
    }

    let userData = user || database.get("user", m.sender);
    if (!userData) {
        userData = {
            id: m.sender,
            name: "",
            age: 0,
            register: false,
            regTime: 0,
            sn: "",
            limit: 0,
            premium: {
                status: false,
                expired: 0
            }
        };
        database.add("user", userData);
    }

    // Cegah daftar ulang
    if (userData.register) {
        return m.reply("_Anda sudah terdaftar!_");
    }

    if (!text) {
        return m.reply(
            `_Format salah._\nContoh:\n*.${command} Z7|17*`
        );
    }

    const [name, ageText] = text.split("|").map(v => v?.trim());

    if (!name || !ageText) {
        return m.reply(
            `_Format salah._\nGunakan:\n*.${command} Nama|Umur*`
        );
    }

    if (name.length > 20) {
        return m.reply("_Nama terlalu panjang, maksimal 20 karakter._");
    }

    const age = parseInt(ageText);
    if (isNaN(age) || age < 10 || age > 80) {
        return m.reply("_Umur tidak valid. Masukkan umur 10–80._");
    }

    const serialNumber = createHash("md5")
        .update(m.sender)
        .digest("hex")
        .slice(0, 8)
        .toUpperCase();

    userData.name = name;
    userData.age = age;
    userData.register = true;
    userData.regTime = Date.now();
    userData.sn = serialNumber;
    userData.limit = (userData.limit || 0) + 50;

    await database.save();

    const msg = `
🎉 *Pendaftaran Berhasil!*

👤 *Nama:* ${name}
🎂 *Umur:* ${age} tahun
🧾 *Serial Number:* ${serialNumber}

🎁 Bonus *50 Limit*
Ketik *.menu* untuk melihat perintah.
`.trim();

    await m.reply(msg);
};

handler.command = ["daftar", "register", "reg"];
handler.tags = "main";
handler.description = "Mendaftarkan pengguna baru ke database.";
handler.limit = false;
export default handler;