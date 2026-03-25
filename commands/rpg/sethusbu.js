import jikanjs from "@mateoaranda/jikanjs";
import fetch from "node-fetch";

const handler = async (m, {
    conn,
    text,
    args,
    usedPrefix,
    isPrems,
    command,
    db
}) => {
    const userData = db.get("user", m.sender);
    const user = userData?.life;

    if (!text) {
        return m.reply(
            `Gunakan format:\n*${usedPrefix + command} [nama husbu]*\natau\n*${usedPrefix + command} set [id]*`
        );
    }

    if (!user || !user.verified) {
        return m.reply(
            `⚠️ Kamu harus set life terlebih dahulu.\n\nKetik *${usedPrefix}setlife*`
        );
    }

    const age = Number(user.age);
    if (age <= 16) {
        return m.reply(
            "⚠️ Kamu belum cukup umur untuk memilih husbu.\nMinimal umur *17 tahun*."
        );
    }

    if (user.gender !== "female") {
        return m.reply(
            "⚠️ Fitur husbu hanya bisa digunakan oleh user dengan gender *female*."
        );
    }

    if (user.husbu && !isPrems && user.gamepas < 1) {
        return m.reply(
            "❗ Husbu hanya bisa dipilih satu kali.\n💳 Gunakan *gamepass* untuk mengganti husbu."
        );
    }

    if (args[0] === "set" && !isNaN(args[1])) {
        try {
            const {
                data
            } = await jikanjs.loadCharacter(args[1], "full");

            const image = await getRandomPinterestImage(
                `${data.name} anime icons`
            );

            user.husbu = data.name;
            user.id = data.mal_id;
            user.about = data.about || null;

            if (!isPrems && user.gamepas >= 1) {
                user.gamepas -= 1;
                await m.reply("-1 💳 gamepass");
            }

            await conn.reply(
                m.chat,
                `✅ Kamu telah memilih *${data.name}* sebagai husbumu\n\nKetik *${usedPrefix}husbume* untuk melihat detail husbu.`,
                m, {
                    contextInfo: {
                        externalAdReply: {
                            showAdAttribution: true,
                            title: `Husbu: ${data.name}`,
                            body: "Pinterest",
                            thumbnailUrl: image,
                            sourceUrl: image,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }
            );
        } catch (e) {
            console.error(e);
            m.reply("❌ Gagal mengambil data husbu.");
        }
        return;
    }

    try {
        const {
            data
        } = await jikanjs.raw(["characters"], {
            page: 1,
            q: text
        });

        if (!data?.length) {
            return m.reply("❌ Husbu tidak ditemukan.");
        }

        const listText = data
            .slice(0, 10)
            .map(
                (x, i) =>
                `${i + 1}. *${x.name}* (${x.name_kanji || "-"})\nID: *${x.mal_id}*\nFavorite: *${x.favorites}*`
            )
            .join("\n\n");

        await m.reply(
            `🔍 Hasil pencarian husbu:\n\n${listText}\n\nGunakan:\n*${usedPrefix + command} set ID*`
        );
    } catch (e) {
        console.error(e);
        m.reply("❌ Terjadi kesalahan saat mencari husbu.");
    }
};

handler.command = handler.help = ["sethusbu"];
handler.tags = ["rpg"];
handler.premium = true;
handler.rpg = true
export default handler;

async function getRandomPinterestImage(query) {
    try {
        const res = await fetch(
            `https://z7.tokodex.biz.id/search/pinterest?q=${encodeURIComponent(query)}`
        );
        const json = await res.json();

        if (json?.status && json.result?.length) {
            const pick = json.result[Math.floor(Math.random() * json.result.length)];
            return pick.directLink;
        }
    } catch (e) {
        console.error(e);
    }

    return "https://files.catbox.moe/k0sfvt.jpg";
}