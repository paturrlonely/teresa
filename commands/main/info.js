import fetch from 'node-fetch';
import {
    proto,
    generateWAMessageFromContent,
    prepareWAMessageMedia
} from 'baileys'

// Akses watermark dari konfigurasi global
const wm = global.wm

var handler = async (m, { conn, usedPrefix, command }) => {
    if (!command) throw 'menu';
    try {
        // Menampilkan pesan loading
        await global.loading(m, conn);

        // Menyiapkan pesan
        let msgs = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    "messageContextInfo": {
                        "deviceListMetadata": {},
                        "deviceListMetadataVersion": 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: "ʜᴀɪ ɴᴀᴍᴀ ꜱᴀʏᴀ ᴀᴅᴀʟᴀʜ *ᴀᴘᴏᴄᴀʟʏᴘsᴇ-ᴀɪ*\n\nʙᴏᴛ ɪɴɪ ᴅᴀᴘᴀᴛ ᴅɪɢᴜɴᴀᴋᴀɴ sᴇʙᴀɢᴀɪ *ᴇᴅᴜᴋᴀsɪ ᴘᴇʟᴀᴊᴀʀᴀɴ*, *ᴜɴᴅᴜʜᴀɴ ᴍᴇᴅɪᴀ*, *ɢᴀᴍᴇ*, *ᴘᴇɴᴊᴀɢᴀ ɢʀᴜᴘ*, *ᴅᴀɴ ʟᴀɪɴɴʏᴀ* ʏᴀɴɢ ᴅᴀᴘᴀᴛ ᴍᴇᴍʙᴜᴀᴛ ᴋᴀᴍᴜ ʟᴇʙɪʜ ᴍᴜᴅᴀʜ ᴜɴᴛᴜᴋ ᴍᴇɴᴊᴀʟᴀɴɪ ʜᴀʀɪ-ʜᴀʀɪ"
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: wm
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            hasMediaAttachment: false,
                            ...await prepareWAMessageMedia({ image: { url: "https://api.deline.web.id/6BgtHsr0FU.jpg" } }, { upload: conn.waUploadToServer })
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    "name": "single_select",
                                    "buttonParamsJson": JSON.stringify({
                                        title: "MENU OPTION",
                                        sections: [
                                            {
                                                title: "APOCALYPSE AI",
                                                rows: [
                                                    { header: "📓 Menujukan Rules", title: "• Agar Tidak Di Banned", description: "Highlight Label: 📑 Rules", id: ".rules" }
                                                ]
                                            },
                                            {
                                                title: "APOCALYPSE AI",
                                                rows: [
                                                    { header: "✏️ Menunjukan Tentang Apocalypse", title: "• About Apocalypse", description: "Highlight Label: ✏️ About", id: ".about" }
                                                ]
                                            },
                                            {
                                                title: "APOCALYPSE AI",
                                                rows: [
                                                    { header: "👑 Apocalypse Owner", title: "• Pemilik Bot Apocalypse AI", description: "Highlight Label: 👑 Owner", id: ".owner" }
                                                ]
                                            },
                                            {
                                                title: "APOCALYPSE AI",
                                                rows: [
                                                    { header: "🍂 Menujukan Semua Menu", title: "• Menuall Apocalypse", description: "Highlight Label: 🍂 Menuall", id: ".menu all" }
                                                ]
                                            },
                                            {
                                                title: "APOCALYPSE AI",
                                                rows: [
                                                    { header: "📜 Menunjukan Versi Apocalypse", title: "• Version", description: "Highlight Label: 📜 Version", id: ".versi" }
                                                ]
                                            },
                                            {
                                                title: "APOCALYPSE AI",
                                                rows: [
                                                    { header: "👤 Menunjukan Credit Apocalypse", title: "• Spesial Thanks", description: "Highlight Label: 👤 Credit", id: ".tqto" }
                                                ]
                                            },
                                            {
                                                title: "APOCALYPSE AI",
                                                rows: [
                                                    { header: "🕹️ Menulist Apocalypse", title: "• Menulist", description: "Highlight Label: 🕹️ Menulist", id: ".menu" }
                                                ]
                                            },
                                            {
                                                title: "APOCALYPSE AI",
                                                rows: [
                                                    { header: "🛠️ CH Bot Apocalypse", title: "• CH Bot Apocalypse", description: "Highlight Label: 🛠️ CH Bot", id: ".chbot" }
                                                ]
                                            }
                                        ]
                                    })
                                }
                            ]
                        })
                    })
                }
            }
        }, { quoted: m });

        // Mengirimkan pesan yang telah dipersiapkan
        await conn.relayMessage(m.chat, msgs.message, {});
    } catch (e) {
        console.error(e);
        conn.sendMessage(m.chat, 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.', 'conversation', { quoted: m });
    } finally {
        // Menghilangkan pesan loading
        await global.loading(m, conn, true);
    }
};

handler.help = ['info'];
handler.tags = ['main'];
handler.command = /^(info)$/i;
handler.limit = false;
handler.register = true;

export default handler;