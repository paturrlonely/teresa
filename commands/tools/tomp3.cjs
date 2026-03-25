const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const {
    tmpdir
} = require('os');

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';
    if (!/video/g.test(mime)) {
        return m.reply(`Please reply to a video you want to convert to audio with the command:\n${usedPrefix + command}`);
    }

    let media;
    try {
        media = await q.download();
    } catch (e) {
        console.error(e);
        return m.reply('Failed to download the video.');
    }

    if (!media) {
        return m.reply('Failed to download the video.');
    }

    m.reply('🔄 Converting video to audio, please wait...');

    const inputPath = path.join(tmpdir(), `${m.sender.split('@')[0]}_${Date.now()}.mp4`);
    const outputPath = path.join(tmpdir(), `${m.sender.split('@')[0]}_${Date.now()}.mp3`);

    try {
        fs.writeFileSync(inputPath, media);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('mp3')
                .on('error', (err) => {
                    console.error('FFmpeg Error:', err);
                    reject(new Error(`An error occurred during conversion: ${err.message}`));
                })
                .on('end', () => {
                    resolve(true);
                })
                .save(outputPath);
        });

        if (!fs.existsSync(outputPath)) {
            throw new Error('Conversion failed, output file not found.');
        }

        await conn.sendMessage(m.chat, {
            audio: {
                url: outputPath
            },
            mimetype: 'audio/mpeg',
            fileName: 'audio.mp3'
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply(`An error occurred: ${e.message}`);
    } finally {
        if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
    }
};

handler.command = ['tomp3', 'toaudio'];
handler.tags = ['tools'];
handler.description = 'Convert video to MP3 audio.';
handler.help = ['tomp3', 'toaudio'];
handler.limit = true;

module.exports = handler;