import fetch from "node-fetch";

const handler = async (m, {
    conn,
    db
}) => {
    try {
        const cooldown = 3600300;
        const userData = db.get("user", m.sender);

        if (!userData?.life || !userData.life.verified)
            return m.reply("⚠️ Kamu harus set life terlebih dahulu dengan *.setlife*");

        const user = userData.life;

        if (!user.waifu)
            return m.reply("❌ Kamu belum mempunyai waifu! Ketik *.waifu* dan pilih waifumu");

        const now = Date.now();
        if (now - user.lastkencan < cooldown) {
            return m.reply(
                `Kamu sudah berkencan sebelumnya! Tunggu selama *${maToTime(
          user.lastkencan + cooldown - now
        )}* untuk berkencan lagi!`
            );
        }

        const query = `${user.waifu} anime icons`;
        const images = [];
        for (let i = 0; i < 6; i++) {
            images.push(await getRandomPinterestImage(query));
        }

        const tempat = pick([
            "pantai",
            "taman kota",
            "kebun binatang",
            "taman bermain",
            "kolam renang",
            "teater",
            "pusat seni dan budaya",
            "museum seni",
            "pusat sains",
            "perpustakaan",
            "kafe",
            "restoran",
            "kebun bunga",
            "taman anggur",
            "lapangan golf",
            "lapangan tenis",
            "pusat perbelanjaan",
            "pasar seni",
            "galeri seni",
            "pertunjukan musik",
            "lapangan bola basket",
            "lapangan baseball",
            "lapangan sepak bola",
            "pusat yoga",
            "karaoke",
            "kebun buah",
            "pertunjukan seni",
            "arena balap",
            "pusat bowling"
        ]);

        const alesan = pick([
            "belajar bersama tentang cinta",
            "merayakan momen-momen penting bersama",
            "berbagi hobi dan minat bersama",
            "menguatkan hubungan",
            "bersenang-senang bersama",
            "mempererat komunikasi",
            "merayakan hubungan",
            "membangun kenangan"
        ]);

        const tempat2 = pick([
            "rumah mertua",
            "pusat seni kuliner",
            "studio musik",
            "pesta seni pertunjukan",
            "pesta seni kreatif",
            "studio perhiasan",
            "pusat seni keramik",
            "pusat seni berkebun",
            "arena konser",
            "studio lukisan",
            "pusat seni film",
            "pusat hiking indoor",
            "pemandian air panas",
            "memancing",
            "kebun apel",
            "pusat mainan",
            "taman bermain air"
        ]);

        const alesan2 = pick([
            "saling mengenal lebih baik",
            "membangun ikatan emosional yang lebih dalam",
            "bersenang-senang bersama",
            "mempererat komunikasi",
            "merayakan hubungan",
            "membangun kenangan"
        ]);

        const perasaan = pick([
            "senang",
            "semakin cinta denganmu",
            "sangat cinta denganmu",
            "biasa saja",
            "sangat senang",
            "bahagia",
            "sangat bahagia",
            "cukup senang"
        ]);

        const gaun = pick([
            "blazer & celana pendek yang bergaya",
            "blouse & rok yang anggun",
            "jeans & blus yang kasual",
            "kimono yang indah",
            "yukata yang sangat cantik",
            "gaun pendek yang elegan",
            "gaun panjang yang anggun",
            "kemeja & celana panjang yang rapih",
            "crop top & rok mini"
        ]);

        const gift = pick([
            "seikat bunga matahari kuning cerah",
            "sebuah coklat",
            "sebuah kartu ucapan"
        ]);

        const tempat3 = pick([
            "taman bermain. Mereka tertawa dan bersenang-senang seperti anak-anak, naik roller coaster, dan bermain permainan karnaval",
            "restoran. Mereka menikmati hidangan yang begitu lezat dan mereka saling menyuap-nyuapi dengan sangat romantis",
            "sebuah kafe yang nyaman. Mereka duduk di sudut yang tenang, berbagi coklat panas dan kue"
        ]);

        /* ===== SEND MESSAGE ===== */
        const send = async (title, text, img) => {
            await conn.reply(m.chat, text, m, {
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: true,
                        title,
                        thumbnailUrl: img,
                        sourceUrl: img,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });
        };
        await send(
            "Kencan...",
            `*Jam 07:00 Pagi*\nPagi yang cerah menyapa ${user.waifu} dan ${user.name}. Mereka berdua telah merencanakan kencan spesial ini dengan penuh antusiasme. ${user.waifu} bangun lebih awal untuk bersiap-siap. Dia memakai ${gaun} dan tersenyum senang.`,
            images[0]
        );

        setTimeout(() => {
            send(
                "Kencan...",
                `*Jam 07:15 Pagi*\n\nSementara itu, ${user.name} sudah bersiap di luar rumah ${user.waifu}. Dia membawa ${gift} untuk ${user.waifu}. Saat ${user.waifu} melihat ${user.name}, senyum mereka bertemu dan mata mereka bersinar.`,
                images[1]
            );
        }, 15000);

        setTimeout(() => {
            send(
                "Kencan...",
                `*Jam 07:30 Pagi*\n\nKeduanya memutuskan untuk pergi ke ${tempat} untuk ${alesan}. Mereka berjalan berdua, berbicara tentang segala hal, dari hobi mereka hingga impian masa depan. Setiap jalanan dipenuhi dengan bunga-bunga yang berwarna-warni, seperti perasaan mereka satu sama lain.`,
                images[2]
            );
        }, 30000);

        setTimeout(() => {
            send(
                "Kencan...",
                `*Jam 08:00 Pagi - 15:00 Siang*\n\nSetelah menikmati ${tempat}, ${user.waifu} dan ${user.name} pergi ke ${tempat2} untuk ${alesan2}. Mereka saling memandang dengan penuh kasih sayang, merasakan ikatan mereka semakin kuat.`,
                images[3]
            );
        }, 45000);

        setTimeout(() => {
            send(
                "Kencan...",
                `*Jam 15:00 Siang - 22:00 Malam*\n\nKencan mereka berlanjut ke ${tempat3}. Malam datang begitu cepat, dan mereka merencanakan untuk menonton bintang-bintang bersama.`,
                images[4]
            );
        }, 60000);

        setTimeout(() => {
            send(
                "Kencan Selesai",
                `*Jam 22:00 Malam*\n\nDi malam yang tenang, mereka berdua duduk di bawah langit yang penuh dengan bintang. ${user.name} merangkul ${user.waifu} dengan lembut, dan mereka saling berbagi cerita dan impian mereka. Waktu berlalu begitu cepat, dan kencan pun telah selesai. Kamu mengantar ${user.waifu} pulang ke rumah dan ${user.waifu} merasa ${perasaan} dari kencan tadi.\n\n[ ! ] Waifumu telah naik level!\n+1 💘 Level Waifu\n+2 ✤ W Money`,
                images[5]
            );
        }, 75000);

        user.exp += 1;
        user.money += 2;
        user.lastkencan = now;

    } catch (e) {
        console.error(e);
        m.reply("Maaf, terjadi kesalahan saat memproses permintaanmu.");
    }
};

handler.command = ["kencan"];
handler.tags = ["rpg"];
handler.premium = true;
handler.rpg = true
export default handler;

async function getRandomPinterestImage(q) {
    try {
        const r = await fetch(
            `https://z7.tokodex.biz.id/search/pinterest?q=${encodeURIComponent(q)}`
        );
        const j = await r.json();
        if (j?.status && j.result?.length)
            return j.result[Math.floor(Math.random() * j.result.length)].directLink;
    } catch {}
    return "https://files.catbox.moe/k0sfvt.jpg";
}

const pick = (a) => a[Math.floor(Math.random() * a.length)];

function maToTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const d = s % 60;
    return `${h}j ${m}m ${d}d`;
}