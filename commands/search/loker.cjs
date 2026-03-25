const axios = require("axios");
const dayjs = require("dayjs");

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    const pekerjaan = args[0];
    const kota = args[1];
    const jumlah = args[2] ? parseInt(args[2]) : 5;

    if (!pekerjaan || !kota) {
        return m.reply(
            `Parameter 'pekerjaan' dan 'kota' wajib diisi.\n\nContoh:\n${usedPrefix}${command} barista Bandung 5`
        );
    }

    const headers = {
        "user-agent": "Mozilla/5.0 (Linux; Android 10)",
        "accept-language": "id,en;q=0.9",
    };

    try {
        await m.reply(`Mencari lowongan '${pekerjaan}' di '${kota}'...`);

        const params = {
            keywords: pekerjaan,
            where: kota,
            sitekey: "ID",
            sourcesystem: "houston",
            pageSize: jumlah,
            page: 1,
            locale: "id-ID",
        };

        const {
            data
        } = await axios.get("https://jobsearch-api.cloud.seek.com.au/v5/search", {
            params,
            headers,
            timeout: 10000,
        });

        const jobs = data.data || [];
        if (!jobs.length) return m.reply("Tidak ada lowongan ditemukan.");

        const results = jobs.map((job) => ({
            title: job.title || "-",
            company: job.companyName || "-",
            location: job.locations?.[0]?.label || "-",
            date: job.listingDate ? dayjs(job.listingDate).format("DD MMM YYYY") : "-",
            salary: job.salaryLabel || "Tidak dicantumkan",
            description: job.teaser || "-",
            logo: job.branding?.serpLogoUrl || "",
            link: `https://id.jobstreet.com/job/${job.id}`,
        }));

        // Kirim hasil ke chat
        let replyText = `*Hasil pencarian '${pekerjaan}' di '${kota}' (${results.length} lowongan)*\n\n`;
        results.forEach((job, idx) => {
            replyText += `*${idx + 1}. ${job.title}*\n`;
            replyText += `Perusahaan: ${job.company}\n`;
            replyText += `Lokasi: ${job.location}\n`;
            replyText += `Tanggal: ${job.date}\n`;
            replyText += `Gaji: ${job.salary}\n`;
            replyText += `Link: ${job.link}\n\n`;
        });

        m.reply(replyText);

    } catch (err) {
        console.error(err);
        m.reply(`Terjadi kesalahan: ${err.message}`);
    }
};

handler.command = /^(loker|jobsearch)$/i;
handler.tags = ["search"];
handler.description = "Mencari lowongan kerja dari JobStreet Indonesia.";
handler.help = ["loker <pekerjaan> <kota> <jumlah>"];

module.exports = handler;