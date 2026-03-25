const {
    exec
} = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    if (!args[0]) {
        return m.reply(`Provide a GitHub repository URL.\n\nExample:\n${usedPrefix}${command} https://github.com/ilmanhdyt/ShiraoriBOT-Md`);
    }

    const url = args[0];
    const regex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/)?$/i;
    const match = url.match(regex);

    if (!match) return m.reply('Invalid GitHub repository URL.');

    const [, user, repo] = match;
    const repoName = repo.replace(/\.git$/, '');

    const tmpDir = path.join(__dirname, '../../tmp', `${m.sender.split('@')[0]}-${Date.now()}`);
    const cloneDir = path.join(tmpDir, repoName);
    const zipPath = path.join(tmpDir, `${repoName}.zip`);

    try {
        await m.reply(`Cloning repository from ${url}...`);

        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, {
            recursive: true
        });

        // clone
        await execPromise(`git clone --depth 1 "${url}" "${cloneDir}"`);

        await m.reply('Zipping the repository...');

        // zip
        await execPromise(`cd "${tmpDir}" && zip -r "${zipPath}" "${repoName}"`);

        if (!fs.existsSync(zipPath)) throw new Error('Failed to create ZIP file.');

        await m.reply('Sending ZIP file...');

        // FIX ZIP JADI PDF — kirim pakai sendMessage dengan mimetype ZIP
        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(zipPath),
            mimetype: 'application/zip',
            fileName: `${repoName}.zip`
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply(`An error occurred: ${e.message}`);
    } finally {
        if (fs.existsSync(tmpDir)) {
            fs.rm(tmpDir, {
                recursive: true,
                force: true
            }, () => {});
        }
    }
};

handler.command = /^(gitclone|clonerepo)$/i;
handler.tags = ['downloader'];
handler.description = 'Clones a GitHub repository and sends it as a ZIP file.';
handler.help = ['gitclone <url>'];

module.exports = handler;