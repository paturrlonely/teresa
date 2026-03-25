/**
 ╔══════════════════════
      ⧉  [charanim] — [random]
 ╚══════════════════════

  ✺ Type     : Plugin CJS
  ✺ Source   : https://whatsapp.com/channel/0029VbAXhS26WaKugBLx4E05
  ✺ Creator  : SXZnightmare
  ✺ API      : [ https://api.ootaizumi.web.id ]
*/

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        await conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        });

        let url = 'https://api.ootaizumi.web.id/random/livechart-karakter';
        let res = await fetch(url);
        if (!res.ok) throw new Error('Gagal mengambil data karakter');
        let json = await res.json();
        if (!json.status || !json.result) throw new Error('Data tidak ditemukan');

        let r = json.result;

        let caption =
            `┌─ *Karakter Random* ─┐\n\n` +

            `│ • *Nama:* ${r.name}\n` +
            `│ • *JP Name:* ${r.japaneseName || '-'}\n` +
            `│ • *Anime:* ${r.title}\n` +
            `│ • *Tags:* ${r.tags?.join(', ') || '-'}\n\n` +

            `└─ ˚୨୧⋆｡˚ ⋆`;

        await conn.sendMessage(m.chat, {
            image: {
                url: r.image
            },
            caption
        });
    } catch (e) {
        await m.reply(`*🍂 Gagal mengambil karakter anime...*\n*• Error:* ${e.message}`);
    } finally {
        await conn.sendMessage(m.chat, {
            react: {
                text: '',
                key: m.key
            }
        });
    }
};

handler.help = ['charanim'];
handler.tags = ['anime'];
handler.command = /^(charanim|char)$/i;
handler.limit = true;
handler.register = false; // true kan jika ada fitur register atau daftar di bot mu.

module.exports = handler;