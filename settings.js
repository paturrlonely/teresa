import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

global.owner = ['601117633607'];
global.botname = " Apocalypse";
global.website = "https://google.com";
global.ownername = "Black Rose";
global.footer = ` Apocalypse`;
global.defaultLimit = 100;
global.idch = "120363406677094974@newsletter"
global.botnumber = "6285189989755"
global.lol = "Theresa"
global.alya = "NEMOPHILA"
global.fgsi = "Apocalypse"
global.nauval = "NEMOPHILA";
global.botcahx = "apocalypse"
global.z7 = "Apocalypse"
global.betabot = "THERESA"
global.idch2 = "120363332099263503@newsletter"
global.author = "Z8"
global.price = "18000"
global.wm = " Apocalypse"
global.versi = "1.0.0"
global.tokengh2 = "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"
global.linkgc = "https://chat.whatsapp.com/DoL1bNU64tKAZgdz4vW0qn"
global.tokengh ="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"
global.googleAiApiKey = [ "AIzaSyDx20e9iIi4LMIuGo72jqlQS2gUbpK5x3E",
"AIzaSyCYmE7oM13OJdbev40f_HNhN4Re9NZw_YY",
"AIzaSyCzl7LD1jn6wpx4D61TKqLg2oQBoIeDH30",
"AIzaSyB1Fpv_JX0a-V2xtnNxbIP0QJPt0vC6Vho" ]
global.thumb = "https://api.deline.web.id/vndF246WLB.jpg";
global.linkch = "https://whatsapp.com/channel/0029Vb7RNKSD38CRLjCYJt1I"
global.APIs = {
    lol: 'https://api.lolhuman.xyz',
    ytdlp: 'https://ytdlpyton.nvlgroup.my.id',
    botcahx: 'https://api.botcahx.eu.org',
}
global.APIKeys = {
    'https://api.lolhuman.xyz': 'Theresa',
    'https://ytdlpyton.nvlgroup.my.id': 'NEMOPHILA',
    'https://api.botcahx.eu.org': 'THERESA'
}
global.APIHeaders = {
    "https://ytdlpyton.nvlgroup.my.id": "X-API-Key"
};
global.loading = (m, conn, back = false) => {
    if (!back) {
        return conn.sendReact(m.chat, "🕒", m.key)
    } else {
        return conn.sendReact(m.chat, "", m.key)
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

fs.watchFile(__filename, async () => {
  fs.unwatchFile(__filename);
  console.log(chalk.greenBright(`🔄 File "${__filename}" telah diperbarui!`));
  try {
    await import(`${pathToFileURL(__filename).href}?update=${Date.now()}`);
    console.log(chalk.blueBright('✅ settings.js berhasil di-reload dan diterapkan ke seluruh bot!'));
  } catch (err) {
    console.error(chalk.redBright('❌ Gagal me-reload settings.js:'), err);
  }
});