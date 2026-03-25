const fs = require("fs");
const path = require("path");

const handler = async (m, {
    conn,
    isOwner
}) => {
    try {
        if (!isOwner) return m.reply("*❌ Perintah ini hanya untuk Owner!*");

        const filePath = path.resolve("./database.json");

        if (!fs.existsSync(filePath)) {
            return m.reply("*❌ File database.json tidak ditemukan*");
        }

        await conn.sendMessage(
            m.chat, {
                document: {
                    url: filePath
                },
                mimetype: "application/json",
                fileName: "database.json",
            }, {
                quoted: m
            }
        );
    } catch (error) {
        console.error(error);
        m.reply("*❌ Terjadi error: " + error + "*");
    }
};

handler.help = ["getdb"];
handler.command = ["getdb"];
handler.owner = true;
handler.limit = false;
handler.tags = ["owner"];

module.exports = handler;