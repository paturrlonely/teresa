const handler = async (m, {
    db,
    usedPrefix,
    command,
    text
}) => {
    const userData = db.get("user", m.sender);

    if (!userData.life) {
        userData.life = {
            name: null,
            gender: null,
            age: null,
            verified: false,
            waifu: null,
            exp: 0,
            lastkencan: 0,
            money: 0,
            gamepas: 0,
            id: Math.floor(Math.random() * 1_000_000),
            about: null
        };
    }

    const user = userData.life;

    if (!text) {
        m.reply(`Contoh : ${usedPrefix + command} name,gender,age`);
        return;
    }

    if (user.verified === true) {
        m.reply("⚠️ Sepertinya kamu sudah melakukan set life sebelumnya.");
        return;
    }

    const [name, gender, age] = text.split(",");

    if (!name || !gender || !age) {
        m.reply(
            `Contoh :\n\n${usedPrefix + command} name,gender,age\n` +
            `${usedPrefix + command} Z7:林企业,male/female,18\n\n` +
            `Note :\nSet life hanya bisa satu kali ya, jadi kamu tidak bisa mengubahnya.`
        );
        return;
    }

    if (!["male", "female"].includes(gender)) {
        m.reply("⚠️ Gender hanya bisa (male atau female)");
        return;
    }

    if (isNaN(age)) {
        m.reply("⚠️ Age harus berupa angka.");
        return;
    }

    user.name = name.trim();
    user.gender = gender.trim();
    user.age = age.trim();
    user.verified = true;

    await m.reply(
        `*Berhasil set Life*\n\n` +
        `Name : ${user.name}\n` +
        `Gender : ${user.gender}\n` +
        `Age : ${user.age}\n\n` +
        `Selamat menikmati keseharianmu 🥰`
    );
};

handler.command = ["setlife"];
handler.tags = ["rpg"];
handler.premium = true;
handler.rpg = true
export default handler;