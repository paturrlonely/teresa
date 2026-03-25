const moment = require('moment-timezone');

const handler = async (m, { db, conn }) => {
    try {
        const allGroups = db.list().group || {};
        const participatingGroups = Object.values(await conn.groupFetchAllParticipating());

        if (!participatingGroups || participatingGroups.length === 0) {
            return m.reply("*⚠️ Bot tidak berada di dalam grup manapun saat ini.*");
        }

        const activeGroups = participatingGroups
            .map(group => {
                const gData = allGroups[group.id];
                if (!gData || !gData.sewa?.status || gData.sewa.expired <= Date.now()) return null;

                const remainingMs = gData.sewa.expired - Date.now();
                const days = Math.floor(remainingMs / 86400000);
                const hours = Math.floor((remainingMs % 86400000) / 3600000);
                const minutes = Math.floor((remainingMs % 3600000) / 60000);

                return {
                    id: group.id,
                    name: group.subject,
                    members: group.participants.length,
                    days,
                    hours,
                    minutes,
                    expired: gData.sewa.expired
                };
            })
            .filter(Boolean);

        if (!activeGroups.length) {
            return m.reply("⚠️ Tidak ada grup sewa aktif saat ini.");
        }

        let txt = `*📋 LIST GRUP SEWA AKTIF*\nBot tergabung dalam *${activeGroups.length}* grup sewa aktif.\n\n`;

        activeGroups.forEach((grp, i) => {
            txt += `◦❒ *${i + 1}*\n`;
            txt += `   ◦ Nama Grup: ${grp.name}\n`;
            txt += `   ◦ Group ID: ${grp.id}\n`;
            txt += `   ◦ Anggota: ${grp.members}\n`;
            txt += `   ◦ Sisa Durasi: ${grp.days}d ${grp.hours}h ${grp.minutes}m\n`;
            txt += `   ◦ Expired: ${moment(grp.expired).tz("Asia/Jakarta").format("DD MMMM YYYY, HH:mm:ss")} WIB\n\n`;
        });

        m.reply(txt.trim());
    } catch (e) {
        console.error(e);
        m.reply("*⚠️ Gagal mengambil daftar grup. Silakan coba lagi nanti.*");
    }
};

handler.help = ['listsewa'];
handler.tags = ['owner'];
handler.command = /^listsewa$/i;
handler.owner = true;

module.exports = handler;