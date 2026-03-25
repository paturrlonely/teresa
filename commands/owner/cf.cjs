let fetch;
async function getFetch() {
    if (!fetch) {
        fetch = (await import("node-fetch")).default;
    }
    return fetch;
}

function cleanDomain(domain) {
    return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

async function cfAdd(apikeycf, email, domain) {
    const fetch = await getFetch();
    const clean = cleanDomain(domain);

    const r = await fetch("https://api.cloudflare.com/client/v4/zones", {
        method: "POST",
        headers: {
            "X-Auth-Email": email,
            "X-Auth-Key": apikeycf,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: clean,
            jump_start: true
        })
    });

    const data = await r.json();
    if (!data.success) throw new Error(JSON.stringify(data.errors));

    return {
        domain: clean,
        nameservers: data.result?.name_servers || []
    };
}

async function cfDelete(apikeycf, email, domain) {
    const fetch = await getFetch();
    const clean = cleanDomain(domain);

    const rZone = await fetch(
        `https://api.cloudflare.com/client/v4/zones?name=${clean}`, {
            headers: {
                "X-Auth-Email": email,
                "X-Auth-Key": apikeycf,
                "Content-Type": "application/json"
            }
        }
    );

    const zoneData = await rZone.json();
    if (!zoneData.success || !zoneData.result.length) {
        throw new Error("Domain tidak ditemukan di akun Cloudflare");
    }

    const zoneId = zoneData.result[0].id;

    const rDel = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
            method: "DELETE",
            headers: {
                "X-Auth-Email": email,
                "X-Auth-Key": apikeycf,
                "Content-Type": "application/json"
            }
        }
    );

    const delData = await rDel.json();
    if (!delData.success) throw new Error(JSON.stringify(delData.errors));

    return {
        domain: clean,
        message: "Domain berhasil dihapus dari Cloudflare"
    };
}

let handler = async (m, {
    text
}) => {
    if (!text) {
        return m.reply(
            "Format:\nadd|delete apikey email domain\n\nContoh:\nadd CFKEY user@mail.com example.com"
        );
    }

    const [mode, apikeycf, email, domain] = text.split(" ");
    if (!mode || !apikeycf || !email || !domain) {
        return m.reply("❌ Parameter tidak lengkap");
    }

    try {
        if (mode === "add") {
            const res = await cfAdd(apikeycf, email, domain);
            return m.reply(
                `✅ Domain ditambahkan\n\n🌐 ${res.domain}\n\nNS:\n${res.nameservers.join("\n")}`
            );
        }

        if (mode === "delete") {
            const res = await cfDelete(apikeycf, email, domain);
            return m.reply(`🗑️ ${res.message}\n🌐 ${res.domain}`);
        }

        return m.reply("❌ Mode harus add atau delete");
    } catch (e) {
        return m.reply(`❌ Error\n${e.message}`);
    }
};

handler.command = ["cf", "cloudflare"];
handler.help = ["cf add|delete <apikey> <email> <domain>"];
handler.tags = ["owner"];
handler.owner = true;
module.exports = handler;