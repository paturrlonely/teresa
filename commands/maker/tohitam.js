import crypto from "crypto";
import {
    FormData,
    Blob
} from "formdata-node";
import {
    fileTypeFromBuffer
} from "file-type";

const fkontak = {
    key: {
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast",
        fromMe: false
    },
    message: {
        conversation: "AI ToHitam ✨"
    },
};

const handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = q.mimetype || q.msg?.mimetype || "";

        if (!/image/.test(mime)) {
            return conn.sendMessage(
                m.chat, {
                    text: `📸 Kirim atau balas *gambar* dengan caption *${usedPrefix + command}*`
                }, {
                    quoted: fkontak
                }
            );
        }

        await conn.sendMessage(m.chat, {
            text: "⏳ Sedang mengubah gambar menjadi hitam..."
        }, {
            quoted: fkontak
        });

        const imgBuffer = await q.download();
        if (!imgBuffer || imgBuffer.length < 1024) throw new Error("❌ Gagal mengunduh gambar.");

        const ft = (await fileTypeFromBuffer(imgBuffer)) || {
            ext: "jpg",
            mime: "image/jpeg"
        };

        const uploadedUrl = await uploadDeline(imgBuffer, ft.ext, ft.mime);

        const apiUrl = `https://api.apocalypse.web.id/image/tohitam?url=${encodeURIComponent(uploadedUrl)}`;
        const res = await fetch(apiUrl, {
            timeout: 60000
        });
        if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length < 5000) throw new Error("❌ Gagal memproses gambar dari API.");

        await conn.sendMessage(
            m.chat, {
                image: buffer,
                caption: `🖤 *Hasil ToHitam*\n🌐 API: Apocalypse.web.id\n⏰ ${new Date().toLocaleString("id-ID")}`,
            }, {
                quoted: fkontak
            }
        );

    } catch (err) {
        await conn.sendMessage(m.chat, {
            text: `❌ Terjadi kesalahan:\n${err.message}`
        }, {
            quoted: fkontak
        });
    }
};

handler.help = ["tohitam"];
handler.tags = ["maker"];
handler.command = ["tohitam"];

export default handler;

async function uploadDeline(buffer, ext = "bin", mime = "application/octet-stream") {
    const fd = new FormData();
    const name = `${crypto.randomBytes(5).toString("hex")}.${ext}`;
    fd.append("file", new Blob([buffer], {
        type: mime
    }), name);

    const res = await fetch("https://api.deline.web.id/uploader", {
        method: "POST",
        body: fd,
        headers: fd.getHeaders ? fd.getHeaders() : {},
    });

    const data = await res.json();
    const link = data?.result?.link || data?.url || data?.path;
    if (!link) throw new Error(data?.message || "Upload Deline gagal");

    return link;
}