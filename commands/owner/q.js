import fs from "fs";
import util from "util";

const handler = async (m, {
    conn,
    isOwner
}) => {
    if (!isOwner) return m.reply("❌ Fitur ini hanya untuk *Owner Bot*!");

    const q = m.quoted;
    if (!q) return m.reply("⚠️ Balas (reply) pesan yang ingin kamu ambil JSON-nya!");

    try {
        const info = [];

        const rawType =
            q.mtype ||
            Object.keys(q.message || q.msg || {})[0] ||
            "unknown";

        const typeMap = {
            conversation: "Text",
            extendedTextMessage: "Text (Extended)",
            imageMessage: "Gambar",
            videoMessage: "Video",
            audioMessage: "Audio",
            stickerMessage: "Stiker",
            documentMessage: "Dokumen",
            viewOnceMessageV2: "View Once",
            ephemeralMessage: "Ephemeral"
        };

        const jenisPesan = typeMap[rawType] || rawType;

        info.push(`📩 *INFORMASI PESAN*`);
        info.push(`🆔 ID: ${q.id}`);
        info.push(`👤 Pengirim: ${q.sender}`);
        info.push(`💬 Jenis: ${jenisPesan}`);
        info.push(`📜 Teks: ${q.text || q.caption || "(tidak ada teks)"}`);

        if (q.msg?.mimetype)
            info.push(`🖼️ MimeType: ${q.msg.mimetype}`);

        if (q.msg?.fileLength)
            info.push(`📦 Ukuran: ${q.msg.fileLength} bytes`);

        if (q.msg?.contextInfo?.isForwarded)
            info.push(
                `🔁 Pesan ini hasil forward (${q.msg.contextInfo.forwardingScore}x)`
            );

        if (q.msg?.contextInfo?.mentionedJid?.length)
            info.push(
                `🏷️ Mention: ${q.msg.contextInfo.mentionedJid.join(", ")}`
            );

        if (m.isGroup)
            info.push(`👥 Grup: ${m.chat}`);

        await m.reply(info.join("\n"));

        const json = JSON.stringify(
            q.fakeObj?.message || q.message || q,
            null,
            2
        );

        await m.reply(
            `📦 *QUOTED MESSAGE JSON*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            "```json\n" +
            json +
            "\n```"
        );

    } catch (e) {
        console.error(e);
        await m.reply("❌ Terjadi error:\n" + util.format(e));
    }
};

handler.help = ["ambilq", "q"];
handler.tags = ["owner"];
handler.command = ["ambilq", "q"];

export default handler;