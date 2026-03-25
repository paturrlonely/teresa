import moment from "moment-timezone";
import {
    profileCanvas
} from "../../library/canvas/profil.js";

const toJid = (v) => {
    if (!v) return v;
    if (v.includes("@")) return v;
    return v.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
};

const handler = async (m, {
    conn,
    args,
    db
}) => {
    let who =
        m.mentionedJid?.[0] ||
        m.quoted?.sender ||
        (args[0] ? toJid(args[0]) : m.sender);

    who = toJid(who);

    const user = db.get("user", who);
    if (!user) return m.reply("❌ Pengguna belum terdaftar\nGunakan *.daftar*");

    const ownerLocal = (global.owner || []).map(toJid);
    const ownerDB = (db.list().owner || []).map(toJid);
    const botJid = toJid(conn.user.id);

    const isOwner = [...ownerLocal, ...ownerDB, botJid].includes(who);

    const role = isOwner ?
        "Owner" :
        user.premium?.status ?
        "Premium" :
        "User";

    let premium = "Tidak aktif";
    if (user.premium?.status && user.premium?.expired) {
        const sisa =
            Math.max(0, user.premium.expired - Date.now()) /
            (1000 * 60 * 60 * 24);
        premium = sisa > 365 ? "Unlimited" : `${Math.ceil(sisa)} hari`;
    }

    let avatar;
    try {
        avatar = await conn.profilePictureUrl(who, "image");
    } catch {
        avatar = "https://files.catbox.moe/g7iq2y.jpg";
    }

    const buffer = await profileCanvas({
        avatar,
        name: user.name ||
            (await conn.getName(who).catch(() => null)) ||
            who.split("@")[0],
        number: "+" + who.split("@")[0],
        role,
        limit: user.limit ?? 0,
        premium,
        registered: user.regTime ?
            moment(user.regTime).tz("Asia/Jakarta").format("DD MMM YYYY") :
            "-"
    });

    await conn.sendMessage(m.chat, {
        image: buffer,
        caption: "*User Profile*",
        mentions: [who]
    });
};

handler.command = ["me"];
handler.tags = ["main"];
handler.description = "Menampilkan profil user dalam bentuk gambar";
export default handler;