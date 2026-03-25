import fs from "fs";
import os from "os";
import moment from "moment-timezone";

const handler = async (m, {
    conn,
    user,
    isOwner,
    isPremium,
    cmd,
    Func,
    text
}) => {
    const menu = {};
    const prefixMatch = m.text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/);
    const prefix = prefixMatch ? prefixMatch[0] : ".";

    // Loop plugin untuk kumpulkan command per tag
    Object.values(cmd.plugins).forEach(plugin => {
        if (!plugin.command || !plugin.tags) return;
        if (plugin.owner && !isOwner) return;
        if (plugin.admin && !m.isAdmin && !isOwner) return;
        if (plugin.premium && !isPremium && !isOwner) return;

        let tags = Array.isArray(plugin.tags) ?
            plugin.tags :
            plugin.tags.split(",").map(t => t.trim());

        if (plugin.premium && !tags.includes("premium")) tags.push("premium");

        tags.forEach(tag => {
            if (!menu[tag]) menu[tag] = [];

            let commandName = "";
            if (plugin.command instanceof RegExp) {
                commandName = plugin.command.source
                    .replace(/^\^|\$$/g, "")
                    .replace(/\(\?:|\(\?/g, "(")
                    .replace(/[()]/g, "")
                    .replace(/[+*?]/g, "")
                    .trim()
                    .split("|")[0];
            } else if (Array.isArray(plugin.command)) {
                commandName = plugin.command[0];
            } else if (typeof plugin.command === "string") {
                commandName = plugin.command;
            }

            if (commandName) {
                menu[tag].push({
                    command: commandName.toLowerCase()
                });
            }
        });
    });

    // Ambil command dari case.js
    try {
        const caseFile = fs.readFileSync("./case.js", "utf-8").split("\n");
        let currentTags = "casejs";

        for (let line of caseFile) {
            line = line.trim();

            if (line.startsWith("//")) {
                currentTags = line.replace("//", "").trim().toLowerCase();
                continue;
            }

            const match = line.match(/case ['"`](.*?)['"`]\s*:/);
            if (match) {
                if (!menu[currentTags]) menu[currentTags] = [];
                menu[currentTags].push({
                    command: match[1]
                });
            }
        }
    } catch (e) {
        console.error("Gagal membaca case.js:", e.message);
    }

    const userStatus = isOwner ?
        "Owner" :
        isPremium ?
        "Premium" :
        user.register ?
        "Free User" :
        "Not Registered";

    const uptime = Func.toTime(process.uptime() * 1000);
    const serverUptime = Func.toTime(os.uptime() * 1000);
    const groupCount = Object.keys(await conn.groupFetchAllParticipating()).length;
    const botData = db.get('bots', 'config') || {};
    const ratings = botData.rating || {};
    const ratingValues = Object.values(ratings).map(r => r.rate);
    const avgRating = ratingValues.length ?
        (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1) :
        "-";
    const makeLine = () => "*╰─❁*";

    // INFO USER
    let caption =
        `*╭─❁ ɪɴꜰᴏ ᴘᴇɴɢɢᴜɴᴀ ❁*\n` +
        `◦❒ ꜱᴛᴀᴛᴜꜱ: ${userStatus}\n` +
        `◦❒ ʟɪᴍɪᴛ: ${user.limit || 0}\n` +
        `${makeLine()}\n\n`;

    // INFO BOT
    caption +=
        `*╭─❁ ɪɴꜰᴏ ʙᴏᴛ ❁*\n` +
        `◦❒ ɢʀᴜᴘ: ${groupCount}\n` +
        `◦❒ ᴜᴘᴛɪᴍᴇ: ${uptime}\n` +
        `◦❒ ꜱᴇʀᴠᴇʀ ᴜᴘᴛɪᴍᴇ: ${serverUptime}\n` +
        `◦❒ ʀᴀᴛɪɴɢ ʙᴏᴛ: ${avgRating} ⭐ (${ratingValues.length} vote)\n` +
        `*╰─❁*\n\n`;

    const sortedTags = Object.keys(menu).sort();

    // MENU UTAMA
    if (!text) {
        caption += `*╭─❁ Daftar Kategori Menu ❁*\n`;
        sortedTags.forEach(tag => {
            caption += `◦❒ ${tag.toUpperCase()}\n`;
        });
        caption +=
            `${makeLine()}\n\n` +
            `ᴋᴇᴛɪᴋ ${prefix}menu <kategori> ᴜɴᴛᴜᴋ ᴍᴇʟɪʜᴀᴛ ᴅᴀꜰᴛᴀʀ ᴘᴇʀɪɴᴛᴀʜ.\n` +
            `ᴋᴇᴛɪᴋ ${prefix}menu all ᴜɴᴛᴜᴋ ᴍᴇʟɪʜᴀᴛ ꜱᴇᴍᴜᴀ ᴄᴏᴍᴍᴀɴᴅ.`;
    } else {
        const requestedTag = text.toLowerCase();

        // MENU ALL
        if (requestedTag === "all") {
            caption += `*╭─❁ Semua Command ❁*\n`;
            sortedTags.forEach(tag => {
                caption += `\n*${tag.toUpperCase()}*\n`;
                menu[tag]
                    .sort((a, b) => a.command.localeCompare(b.command))
                    .forEach(c => {
                        caption += `◦❒ ${prefix}${c.command}\n`;
                    });
            });
            caption += `${makeLine()}\n`;
        }

        // MENU KATEGORI
        else if (menu[requestedTag]) {
            caption += `*╭─❁ Menu ${requestedTag.toUpperCase()} ❁*\n`;
            menu[requestedTag]
                .sort((a, b) => a.command.localeCompare(b.command))
                .forEach(c => {
                    caption += `◦❒ ${prefix}${c.command}\n`;
                });
            caption += `${makeLine()}\n`;
        } else {
            caption += `⚠️ Kategori "${requestedTag}" tidak ditemukan.`;
        }
    }

    await conn.sendMessage(m.from, {
        text: Func.Styles(caption),
        contextInfo: {
            externalAdReply: {
                title: `${global.botname} | ${moment().tz("Asia/Jakarta").format("HH:mm")}`,
                body: `Uptime: ${uptime}`,
                thumbnail: await Func.fetchBuffer(global.thumb),
                sourceUrl: "https://github.com/Reyz2902",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, {
        quoted: m
    });
};

handler.command = ["menu"];
handler.tags = "main";
handler.description = "Menampilkan daftar perintah bot per kategori/tag.";
handler.register = true;

export default handler;