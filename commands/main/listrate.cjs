let handler = async (m, {
    db
}) => {
    let botConfig = db.get('bots', 'config') || {};
    let ratings = botConfig.rating || {};

    if (!Object.keys(ratings).length) {
        return m.reply("❌ Belum ada user yang memberi rating.");
    }

    let caption = `*╭─❁ Daftar Rating Bot ❁*\n`;
    let i = 1;
    for (let jid in ratings) {
        let userRate = ratings[jid];
        caption += `◦❒ ${i}. ${jid.split('@')[0]}: ${userRate.rate} ⭐\n`;
        i++;
    }
    caption += `*╰─❁*`;

    m.reply(caption);
};

handler.help = ["listrate"];
handler.tags = ["main"];
handler.command = /^(listrate|ratinglist)$/i;
module.exports = handler;