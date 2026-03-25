import axios from "axios";

const DEBUG = true;

const ZONES = {
    tokodex: {
        ZONE_ID: "0d1027f3c17e34f1945c7e3782a42482",
        API_TOKEN: "5BLWcpu6VK4NhR5QjlykA2Qhxp6vXoD6DOOOOTrG",
        BASE_DOMAIN: "tokodex.biz.id"
    },
    shopserver: {
        ZONE_ID: "80dc58e33b3e922eb52673e570d1f097",
        API_TOKEN: "TwFlPbxoca0cgqMtX45J0N_u2vM8DTPXZyXrHN35",
        BASE_DOMAIN: "shopserverr.biz.id"
    },
    vsunsee: {
        ZONE_ID: "3fc3b313d241de6619cd753482b8e7b8",
        API_TOKEN: "DRNWSx3AbMvS61fKlIJScjlpkBIqh2FiTwLw8n-3",
        BASE_DOMAIN: "vsunsee-clouds.biz.id"
    },
    apocalypse: {
        ZONE_ID: "71bc13fa4f67778dbc8592dcf6fdda56",
        API_TOKEN: "X0nljImiAovjdG2nPq97MizI7amamFvZOFnQd7uU",
        BASE_DOMAIN: "apocalypse.web.id"
    },
    theresav: {
        ZONE_ID: "bde47a0deb591659ef00e351d8419f84",
        API_TOKEN: "rLoy8JQQaIrcUV9oBvIQAQQBWALlDuH1ESPFQV0g",
        BASE_DOMAIN: "theresav.biz.id"
    }
};

function formatSubdomain(name, baseDomain) {
    return `${String(name).trim().toLowerCase()}.${baseDomain}`;
}

function debug(title, data = null) {
    if (!DEBUG) return;
    console.log(`\n🐞 [DEBUG] ${title}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

let handler = async (m, { text }) => {
    if (!text) {
        return m.reply(
            "❌ Contoh penggunaan:\n" +
            ".subdomain <zone> add <nama_subdomain> <ip>\n" +
            ".subdomain <zone> delete <nama_subdomain> <ip>\n" +
            ".subdomain <zone> list"
        );
    }

    const args = text.trim().split(/\s+/);
    const zoneName = args[0]?.toLowerCase();
    const mode = args[1]?.toLowerCase();
    const subdomain = args[2];
    const ip = args[3];

    debug("REQUEST", { zoneName, mode, subdomain, ip });

    const zone = ZONES[zoneName];
    if (!zone) return m.reply("❌ Zone tidak valid.");

    const { ZONE_ID, API_TOKEN, BASE_DOMAIN } = zone;

    const headers = {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
    };

    try {
        if (mode === "add") {
            const fqdn = formatSubdomain(subdomain, BASE_DOMAIN);
            debug("ADD FQDN", fqdn);

            const check = await axios.get(
                `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${encodeURIComponent(fqdn)}`,
                { headers }
            );

            debug("CHECK RESPONSE", check.data);

            if (check.data.result.length) {
                return m.reply("❌ Subdomain sudah ada.");
            }

            const res = await axios.post(
                `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
                {
                    type: "A",
                    name: fqdn,
                    content: ip,
                    ttl: 3600,
                    proxied: false
                },
                { headers }
            );

            debug("ADD RESULT", res.data);

            return m.reply(`✅ Subdomain berhasil dibuat:\n${fqdn}`);
        }

        if (mode === "delete") {
            const fqdn = formatSubdomain(subdomain, BASE_DOMAIN);
            debug("DELETE FQDN", fqdn);

            const list = await axios.get(
                `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${encodeURIComponent(fqdn)}`,
                { headers }
            );

            debug("SEARCH RESULT", list.data);

            const record = list.data.result.find(r => r.content === ip);
            if (!record) return m.reply("❌ Record tidak ditemukan.");

            const del = await axios.delete(
                `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${record.id}`,
                { headers }
            );

            debug("DELETE RESULT", del.data);

            return m.reply(`✅ Subdomain berhasil dihapus:\n${fqdn}`);
        }

        if (mode === "list") {
            const res = await axios.get(
                `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A&per_page=100`,
                { headers }
            );

            debug("LIST RESULT COUNT", res.data.result.length);

            const records = res.data.result.filter(r =>
                r.name.endsWith(BASE_DOMAIN)
            );

            if (!records.length) return m.reply("❌ Tidak ada subdomain.");

            let teks = `🌐 Daftar Subdomain (${zoneName})\n\n`;
            records.forEach((r, i) => {
                teks += `${i + 1}. ${r.name}\nIP : ${r.content}\n\n`;
            });

            return m.reply(teks.trim());
        }

        return m.reply("❌ Mode tidak dikenali.");
    } catch (err) {
        console.error("🔥 ERROR:", err.response?.data || err.message);
        return m.reply("❌ Terjadi kesalahan saat mengakses Cloudflare.");
    }
};

handler.command = /^(subdomain)$/i;
handler.owner = true;
handler.tags = ["tools"];

export default handler;