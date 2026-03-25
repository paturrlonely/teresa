const resolutions = [144, 240, 360, 480, 720, 1080, 1440, 2160];

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    const fetch = (await import('node-fetch')).default;

    if (text?.startsWith('res|')) {
        let [, resolution, url] = text.split('|');
        resolution = parseInt(resolution);

        try {
            await global.loading(m, conn);

            const apiUrl = `https://ytdlpyton.nvlgroup.my.id/download/?url=${encodeURIComponent(url)}&resolution=${resolution}&mode=url`;
            const headers = {
                'accept': 'application/json',
                'X-API-Key': global.nauval
            };

            const response = await fetch(apiUrl, {
                headers
            });
            const data = await response.json();

            if (!data?.download_url) {
                return m.reply(data?.message || 'Gagal download video 😢');
            }

            const caption = `🎬 *${data.title}*
👤 ${data.uploader || 'Unknown'}
⏱ ${data.duration || 0}s
📺 ${data.resolution || resolution}p`;

            await conn.sendFile(
                m.chat,
                data.download_url,
                `${data.title}.mp4`,
                caption,
                m
            );

        } catch (e) {
            m.reply('Terjadi error saat download!');
        } finally {
            await global.loading(m, conn, true);
        }
        return;
    }

    if (!text || !text.startsWith('http')) {
        return m.reply(
            `Contoh:\n${usedPrefix + command} https://youtu.be/zMMWzvtYgQY`
        );
    }

    const rows = resolutions.map(r => ({
        title: `${r}p`,
        description: `Download video ${r}p`,
        id: `${usedPrefix + command} res|${r}|${text}`
    }));

    await conn.sendMessage(
        m.chat, {
            text: '📥 *Pilih resolusi video*',
            footer: 'YouTube Downloader',
            buttons: [{
                buttonId: 'yt_res_select',
                buttonText: {
                    displayText: '🎞 Pilih Resolusi'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Pilih Resolusi',
                        sections: [{
                            title: 'Resolusi Tersedia',
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        }
    );
};

handler.help = ['ytmp4 <link>'];
handler.tags = ['downloader'];
handler.command = /^(ytv|ytmp4)$/i;
handler.limit = true;

module.exports = handler;