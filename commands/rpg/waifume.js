import fetch from "node-fetch";

const handler = async (m, {
    conn,
    db,
    usedPrefix
}) => {
    const who = m.sender;
    const userData = db.get("user", who);

    if (!userData.life || !userData.life.verified) {
        m.reply(
            `⚠️ Untuk menggunakan fitur ini, kamu harus teregistrasi terlebih dahulu.\n\nKetik *${usedPrefix}setlife*`
        );
        return;
    }

    const user = userData.life;

    if (!user.waifu) {
        m.reply(
            `⚠️ Kamu belum punya waifu!\nKetik *${usedPrefix}setwaifu* untuk mencari waifu.`
        );
        return;
    }

    try {
        await conn.sendMessage(m.chat, {
            react: {
                text: global.loading || "⏳",
                key: m.key
            }
        });

        const res = await fetch(
            `https://z7.tokodex.biz.id/search/pinterest?q=${encodeURIComponent(
        user.waifu + " anime icons"
      )}`
        );
        const json = await res.json();

        let image = "https://files.catbox.moe/k0sfvt.jpg";
        if (json?.status && Array.isArray(json.result) && json.result.length) {
            const pick = json.result[Math.floor(Math.random() * json.result.length)];
            image = pick.directLink || image;
        }

        const caption = `*WAIFU INFO*
💃🏻 Nama Waifu: ${user.waifu}
💘 Level Waifu: ${user.exp}

${user.name} dan ${user.waifu} adalah sepasang kekasih dengan kehidupan yang sangat bahagia. ${user.name} beruntung sekali karena memilih waifu seperti ${user.waifu}. Semoga mereka selalu hidup bahagia.

Tingkatkan level waifumu dengan melakukan kencan *${usedPrefix}kencan*

Fact: _level waifumu tidak akan ter-reset walaupun sudah mengganti waifu._`;

        await conn.reply(m.chat, caption, m, {
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: `Hi, I'm ${user.waifu}`,
                    body: "Gambar terkadang tidak muncul",
                    thumbnailUrl: image,
                    sourceUrl: image,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });

        await conn.sendMessage(m.chat, {
            react: {
                text: "✅",
                key: m.key
            }
        });

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, {
            react: {
                text: "❌",
                key: m.key
            }
        });
        m.reply("❌ Gagal mengambil gambar waifu. Coba lagi nanti.");
    }
};

handler.command = handler.help = ["waifume"];
handler.tags = ["rpg"];
handler.rpg = true
export default handler;