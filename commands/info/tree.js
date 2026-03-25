import fs from "fs";

import path from "node:path";

let handler = async (m, {
    conn,
    command,
    usedPrefix,
    text
}) => {

    let dir = process.cwd();

    let kecuali = ["node_modules", "sessions", ".npm", ".cache", ".git"];

    let tree = "";

    let totalFile = 0;

    let totalFolder = 0;

    // Simpan jumlah file per folder

    const folderFilesCount = new Map();

    const traverse = (dir, prefix = "") => {

        let files = fs.readdirSync(dir);

        let fileCountCurrentFolder = 0;

        files.forEach((file, index) => {

            let full = path.join(dir, file);

            if (kecuali.some(k => full.includes(k))) return;

            let last = index === files.length - 1;

            tree += prefix + (last ? "└── " : "├── ") + file;

            if (fs.statSync(full).isDirectory()) {

                totalFolder++;

                tree += "\n";

                const countBefore = totalFile; // simpan total file sebelum masuk folder

                traverse(full, prefix + (last ? "    " : "│   "));

                // file yang ada di folder ini

                const filesInThisFolder = totalFile - countBefore;

                folderFilesCount.set(full, filesInThisFolder);

            } else {

                totalFile++;

                fileCountCurrentFolder++;

                tree += "\n";

            }

        });

        return fileCountCurrentFolder;

    };

    traverse(dir);

    // Tambahkan persentase file per folder

    tree += `\n📁 Total folder: ${totalFolder}\n📄 Total file: ${totalFile}\n\n`;

    tree += "📊 Persentase file per folder:\n";

    folderFilesCount.forEach((count, folder) => {

        let perc = totalFile ? ((count / totalFile) * 100).toFixed(2) : 0;

        tree += `- ${path.relative(process.cwd(), folder) || "."}: ${count} file (${perc}%)\n`;

    });

    m.reply(tree);

};

handler.help = ['tree'];

handler.command = ['tree']

handler.tags = ["info"];

handler.owner = true;

export default handler;