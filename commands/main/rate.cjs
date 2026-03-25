let handler = async (m, { conn, usedPrefix, command, text, db }) => {
    let user = db.get('user', m.jid) || {};
    let botConfig = db.get('bots', 'config') || {};

    if (!text) return m.reply(`❌ Masukkan angka!\nContoh: ${usedPrefix + command} 5`);
    if (!isNumber(text)) return m.reply("❌ Hanya angka!");
    let rateValue = parseInt(text);
    if (rateValue < 1 || rateValue > 5) return m.reply("❌ Pilih angka yang valid dari 1 - 5");

    botConfig.rating = botConfig.rating || {};
    if (botConfig.rating[m.jid]) {
        return m.reply("❌ Anda sudah memberi rating sebelumnya!");
    }

    botConfig.rating[m.jid] = {
        rate: rateValue,
        ulasan: ""
    };
    await db.set('bots', 'config', botConfig);

    user.rate = true;
    await db.set('user', m.jid, user);

    m.reply(`✅ Rate anda berhasil! Terima kasih atas pendapat anda.`);
};

handler.help = ["rate"];
handler.tags = ["main"];
handler.command = /^(rate|rating)$/i;
module.exports = handler;

function isNumber(value) {
    let num = parseInt(value);
    return !isNaN(num);
}