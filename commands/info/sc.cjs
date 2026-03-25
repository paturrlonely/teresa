const fs = require('fs');

const path = require('path');

const handler = async (m, {
    conn
}) => {

    const pluginFolder = './commands';

    let esmCount = 0;

    let cjsCount = 0;

    const countPluginsRecursive = (dir) => {

        try {

            const items = fs.readdirSync(dir, {
                withFileTypes: true
            });

            for (const item of items) {

                const p = path.join(dir, item.name);

                if (item.isDirectory()) {

                    countPluginsRecursive(p);

                } else if (item.isFile()) {

                    if (p.endsWith('.cjs')) cjsCount++;

                    else if (p.endsWith('.js')) esmCount++;

                }

            }

        } catch (e) {

            console.error(`Gagal membaca sub-direktori: ${dir}`, e);

        }

    };

    if (fs.existsSync(pluginFolder)) {

        countPluginsRecursive(pluginFolder);

    }

    let totalLegacyCommands = 0;

    try {

        const caseFilePath = path.resolve('./case.js');

        if (fs.existsSync(caseFilePath)) {

            const caseFileContent = fs.readFileSync(caseFilePath, 'utf-8');

            const matches = caseFileContent.match(/case ['"](.*?)['"]\s*:/g);

            if (matches) totalLegacyCommands = matches.length;

        }

    } catch (e) {

        console.error('Gagal membaca case.js:', e.message);

    }

    const totalFeatures = esmCount + cjsCount + totalLegacyCommands;

    const ownerNumber = Array.isArray(global.owner)

        ?
        global.owner[0]

        :
        global.owner;

    const price = global.price || '-';

    const name = m.name || 'there';



    let thumbBuffer = null;

    try {

        if (Buffer.isBuffer(global.thumb)) {

            thumbBuffer = global.thumb;

        } else if (typeof global.thumb === 'string') {

            if (global.thumb.startsWith('http')) {

                thumbBuffer = (await conn.getFile(global.thumb)).data;

            } else if (fs.existsSync(global.thumb)) {

                thumbBuffer = fs.readFileSync(global.thumb);

            }

        }

    } catch (e) {

        console.error('Thumbnail error:', e.message);

        thumbBuffer = null;

    }



    const messageText = `

*BASE BOT WHATSAPP FOR SALE*
Hello, ${name}! Are you interested in the source code for this bot?
This script is built for high performance and is packed with features.

*✨ BASE DETAILS ✨*
- *Total Features:* ${totalFeatures}++
- *Base:* ${global.botname}
- *Language:* JavaScript (CJS, CASE & ESM Support)
- *Database:* LowDB (JSON)
- *Script Type:* ESM
- *Deployment:* VPS / Panel
*💎 ADVANTAGES 💎*
- Full Script & No Encryption
- Clean & well-structured code
- Installation support until online
- Bonus premium API keys
*💰 PRICE & PAYMENT 💰*
- *Price:* ${price}
- *Methods:* DANA / GOPAY
*📞 OWNER CONTACT*
wa.me/${ownerNumber.replace(/[^0-9]/g, '')}

    `.trim();

    await conn.sendMessage(

        m.chat,

        {

            text: messageText,

            contextInfo: {

                externalAdReply: {

                    title: 'Source Code for Sale',

                    body: `Total Features: ${totalFeatures}`,

                    thumbnail: thumbBuffer || undefined,

                    sourceUrl: `https://wa.me/${ownerNumber.replace(/[^0-9]/g, '')}`,

                    mediaType: 1,

                    renderLargerThumbnail: true

                }

            }

        },

        {
            quoted: m
        }

    );

};

handler.command = /^(sc|script)$/i;

handler.tags = ['info'];

handler.help = ['sc', 'script'];

handler.description = 'Displays information about selling the bot source code';

module.exports = handler;