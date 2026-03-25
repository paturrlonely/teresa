import fs from 'fs';
import path from 'path';

const handler = async (m, {
    text
}) => {
    try {
        const targetPath = text || '.';
        const stats = fs.statSync(targetPath);

        if (!stats.isDirectory()) {
            return m.reply(`\`${targetPath}\` bukan sebuah direktori.`);
        }

        const files = fs.readdirSync(targetPath);
        if (files.length === 0) {
            return m.reply(`Direktori \`${targetPath}\` kosong.`);
        }

        let response = `*Isi dari direktori ${path.resolve(targetPath)}:*\n\n`;

        const fileList = files.map(file => {
            try {
                const fullPath = path.join(targetPath, file);
                const fileStat = fs.statSync(fullPath);
                return fileStat.isDirectory() ? `📁 ${file}/` : `📄 ${file}`;
            } catch (e) {
                // Skip files that can't be stat'd (e.g., due to permissions)
                return `❓ ${file} (Error)`;
            }
        });

        response += fileList.join('\n');
        await m.reply(response.trim());

    } catch (e) {
        console.error(e);
        let errorMessage = `Terjadi kesalahan saat membaca direktori.`;
        if (e.code === 'ENOENT') {
            errorMessage = `Direktori atau file \`${text}\` tidak ditemukan.`;
        } else if (e.code === 'EACCES') {
            errorMessage = `Tidak memiliki izin untuk mengakses \`${text}\`.`;
        } else {
            errorMessage += `\n\n*Error:* ${e.message}`;
        }
        await m.reply(errorMessage);
    }
};

handler.command = ['ls', 'list', 'dir'];
handler.tags = ['owner'];
handler.description = 'Menampilkan daftar file dan direktori pada path tertentu.';
handler.help = ['ls <path>'];
handler.owner = true;

export default handler;