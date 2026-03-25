import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname } from 'node:path'

class Database {
    #data;

    constructor(filename) {
        this.databaseFile = path.join(process.cwd(), filename);
        this.#data = {};
    }

    default = () => ({
        user: {},
        group: {},
        bots: {},
        settings: {
            self: false,
            online: true,
            gconly: false,
            lastReset: new Date().toISOString().split('T')[0],
        },
        owner: [],
    });

    init = async () => {
        const data = await this.read();
        this.#data = { ...this.default(), ...data };
        if (!this.#data.settings) this.#data.settings = this.default().settings;
        if (typeof this.#data.settings.gconly === 'undefined') {
    this.#data.settings.gconly = false;
}
        if (!this.#data.owner) this.#data.owner = this.default().owner;
        if (!this.#data.bots) this.#data.bots = {};
        await this.save();
        return this.#data;
    };

    read = async () => {
        if (fs.existsSync(this.databaseFile)) {
            const data = fs.readFileSync(this.databaseFile, "utf-8");
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error("Database korup, membuat backup dan memulai ulang...", e);
                fs.copyFileSync(this.databaseFile, `${this.databaseFile}.${Date.now()}.corrupt.bak`);
                return this.default();
            }
        } else {
            return this.default();
        }
    };

    save = async () => {
        try {
            const jsonData = JSON.stringify(this.#data, null, 2);
            fs.writeFileSync(this.databaseFile, jsonData, "utf-8");
        } catch (e) {
            console.error("Gagal menyimpan database:", e);
            const backupFile = `${this.databaseFile}.${Date.now()}.bak`;
            const jsonData = JSON.stringify(this.#data, null, 2);
            fs.writeFileSync(backupFile, jsonData, "utf-8");
            console.error(`Database saat ini berhasil dibackup ke ${backupFile}`);
        }
    };

    reset = async () => {
        this.#data = this.default();
        await this.save();
    };

    add = async (type, id, newData) => {
        if (!this.#data[type]) return `- Tipe data ${type} tidak ditemukan!`;
        if (!this.#data[type][id]) {
            this.#data[type][id] = newData;
        }
        await this.save();
        return this.#data[type][id];
    };

    delete = async (type, id) => {
        if (this.#data[type] && this.#data[type][id]) {
            delete this.#data[type][id];
            await this.save();
            return `- ${type} dengan ID ${id} telah dihapus.`;
        } else {
            return `- ${type} dengan ID ${id} tidak ditemukan!`;
        }
    };

    get = (type, id) => {
        if (this.#data[type] && this.#data[type][id]) {
            return this.#data[type][id];
        } else {
            return null;
        }
    };
set = async (type, id, value) => {
    if (!this.#data[type]) {
        throw new Error(`Tipe data ${type} tidak ditemukan`);
    }

    this.#data[type][id] = value;
    await this.save();
    return this.#data[type][id];
};
    setBanchat = async (groupId, value) => {
        if (!this.#data.group[groupId]) this.#data.group[groupId] = {};
        this.#data.group[groupId].banchat = value;
        await this.save();
        return this.#data.group[groupId];
    };

    getBanchat = (groupId) => {
        const group = this.get("group", groupId) || {};
        return typeof group.banchat !== "undefined" ? group.banchat : false;
    };

    main = async (m) => {
        await this.read();

        if (m?.isGroup) {
            const groupData = this.get('group', m.from) || {};
            await this.add("group", m.from, {
                ...groupData,
                mute: groupData.mute || false,
                sewa: groupData.sewa || { status: false, expired: 0 },
                antilink: typeof groupData.antilink !== 'undefined' ? groupData.antilink : false,
                antifoto: typeof groupData.antifoto !== 'undefined' ? groupData.antifoto : false,
                autolevelup: typeof groupData.autolevelup !== 'undefined' ? groupData.autolevelup: false,
                antipolling: typeof groupData.antipolling !== 'undefined' ? groupData.antipolling : false,
                autosticker: typeof groupData.autosticker !== 'undefined' ? groupData.autosticker : false,
                antivideo: typeof groupData.antivideo !== 'undefined' ? groupData.antivideo : false,
                antimedia: typeof groupData.antimedia !== 'undefined' ? groupData.antimedia : false,
                antiaudio: typeof groupData.antiaudio !== 'undefined' ? groupData.antiaudio : false,
                autohd: typeof groupData.autohd !== 'undefined' ? groupData.autohd : false, 
                antiSticker: typeof groupData.antiSticker !== 'undefined' ? groupData.antiSticker : false,
                antiToxic: typeof groupData.antiToxic !== 'undefined'  ? groupData.antiToxic  : false,
                antidelete: typeof groupData.antidelete !== 'undefined'? groupData.antidelete : false,
                antitagsw: typeof groupData.antitagsw !== 'undefined' ? groupData.antitagsw : false,
                antilinkwa: typeof groupData.antilinkwa !== 'undefined' ? groupData.antilinkwa : false,
                premium: groupData.premium || { status: false, expired: 0 },
                welcome: typeof groupData.welcome !== 'undefined' ? groupData.welcome : false,
                detect: typeof groupData.detect !== 'undefined' ? groupData.detect : false,
                warnings: groupData.warnings || {},
                banchat: typeof groupData.banchat !== 'undefined' ? groupData.banchat : false,
                customPrefix: groupData.customPrefix || null,
                nsfw: typeof groupData.nsfw !== 'undefined'
            ? groupData.nsfw
            : false,
            sWelcome: groupData.sWelcome ?? null,
    sBye: groupData.sBye ?? null,
    sPromote: groupData.sPromote ?? null,
    sDemote: groupData.sDemote ?? null,
            warnings: groupData.warnings || {},
            });
        }

        const userData = this.get('user', m.jid) || {};
        await this.add("user", m.jid, {
            ...userData,
            name: m.name || userData.name || 'User',
            limit: typeof userData.limit !== 'undefined' ? userData.limit : 100,
            register: userData.register || false,
            owner: userData.owner || false,
            exp: userData.exp ?? 0,
level: userData.level ?? 0,
role: userData.role ?? 'User',
            premium: userData.premium || { status: false, expired: 0 },
            banned: userData.banned || { status: false, expired: 0 },
            saldo: typeof userData.saldo !== 'undefined' ? userData.saldo : 0,
            customPrefix: userData.customPrefix || null,
              tiktok: userData.tiktok || {
        username: null,
        birthdate: null,
        konten: 0,
        follower: 0,
        money: 0
    },
                life: userData.life || {  
        name: m.name || 'User',  
        gender: null,  
        age: null,  
        verified: false,  
        waifu: null,  
        exp: 0,  
        lastkencan: 0,  
        money: 0,  
        gamepas: 0,  
        id: Math.floor(Math.random() * 1_000_000),  
        about: null  
    },
    afk: typeof userData.afk !== 'undefined' ? userData.afk : -1,
            sticker: userData.sticker || {},
        
        });
        const botData = this.get('bots', 'config') || {}

await this.add('bots', 'config', {
    ...botData,

    replyText: botData.replyText || {},
    rating: botData.rating || {},
    users: botData.users || {},

    menfess: botData.menfess || {},
    anonymous: botData.anonymous || {},
    absen: botData.absen || {},
    ultah: botData.ultah || {},

    logs: botData.logs || {},

    gempaDateTime: botData.gempaDateTime || "",
    maintenance: typeof botData.maintenance !== 'undefined'
        ? botData.maintenance
        : false,
})

        return this.list();
    };

    list = () => this.#data;
}

export default Database;

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fileName = path.basename(__filename)

fs.watchFile(__filename, async () => {
  fs.unwatchFile(__filename)

  console.log(chalk.greenBright(`🔄 File "${fileName}" telah diperbarui!`))

  try {
    await import(`${pathToFileURL(__filename).href}?update=${Date.now()}`)
    console.log(
      chalk.blueBright(`✅ ${fileName} berhasil di-reload dan diterapkan!`)
    )
  } catch (err) {
    console.error(
      chalk.redBright(`❌ Gagal me-reload ${fileName}:`),
      err
    )
  }
})