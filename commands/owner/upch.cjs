const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const {
    tmpdir
} = require("os");

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    const q = m.quoted ? m.quoted : m;
    const mmsg = q.message || {};

    // Ambil audio / voice / document
    const audioMsg = mmsg.audioMessage || mmsg.voiceMessage || mmsg.documentMessage;
    if (!audioMsg) {
        return m.reply(`❌ Reply audio yang ingin diupload ke channel dengan command:\n${usedPrefix + command}`);
    }

    const mime = audioMsg.mimetype || "audio/ogg";
    const ext = mime.split("/")[1] || "ogg";

    await m.reply("🔄 Media diterima, sedang diproses...");

    const inputPath = path.join(tmpdir(), `${m.sender.split("@")[0]}_${Date.now()}.${ext}`);
    const outputPath = path.join(tmpdir(), `${m.sender.split("@")[0]}_${Date.now()}.opus`);

    try {
        // Download media via q.download()
        const mediaBuffer = await q.download(); // <<< ini pakai .download()
        fs.writeFileSync(inputPath, mediaBuffer);

        // Convert ke Opus jika bukan .opus
        if (ext !== "opus") {
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .toFormat("opus")
                    .audioCodec("libopus")
                    .audioBitrate("64k")
                    .on("start", cmd => console.log("[DEBUG] FFmpeg command:", cmd))
                    .on("progress", progress => console.log(`[DEBUG] FFmpeg progress: ${progress.timemark}`))
                    .on("end", () => resolve())
                    .on("error", err => reject(err))
                    .save(outputPath);
            });
        } else {
            fs.copyFileSync(inputPath, outputPath);
        }

        const audioBuffer = fs.readFileSync(outputPath);
        await m.reply("⏳ Mengupload audio ke channel...");

        // Kirim ke channel
        await conn.sendMessage(global.idch, {
            audio: audioBuffer,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true
        });

        m.reply("✅ Audio berhasil diupload ke channel!");
    } catch (e) {
        console.error(e);
        m.reply(`❌ Gagal memproses audio: ${e.message || e}`);
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
};

handler.command = ["upch", "uploadch"];
handler.tags = ["owner"];
handler.description = "Upload audio / voice reply ke channel (otomatis convert ke opus).";
handler.register = true;
handler.owner = true;
handler.limit = true;

module.exports = handler;