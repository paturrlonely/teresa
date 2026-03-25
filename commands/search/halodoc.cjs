const axios = require('axios');
const cheerio = require('cheerio');

async function halodocSearch(keyword) {
    try {
        const url = `https://www.halodoc.com/artikel/search/${encodeURIComponent(keyword)}`;
        const { data: html } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 9; Redmi 7)" }
        });
        const $ = cheerio.load(html);
        const articles = [];

        $("magneto-card").each((i, el) => {
            const title = $(el).find("header a").text().trim();
            const articleLink = $(el).find("header a").attr("href");
            const tag = $(el).find(".tag-container a");
            const description = $(el).find(".description").text().trim();

            if (!title) return;

            articles.push({
                title,
                articleLink: articleLink ? "https://www.halodoc.com" + articleLink : null,
                description: description || 'Tidak ada deskripsi',
                health: { title: tag.text().trim() || 'Artikel Kesehatan' }
            });
        });

        return articles;
    } catch (e) {
        console.error('Error halodocSearch:', e.message);
        return [];
    }
}

async function halodocDetail(url) {
    try {
        const { data: html } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 9; Redmi 7)" }
        });
        const $ = cheerio.load(html);
        return {
            title: $("h1.article-page__title").text().trim(),
            content: $("div.article-page__article-body").text().trim() || null,
            info: {
                time: $("span.article-page__reading-time").text().trim() || null,
                author: $("div.article-page__reviewer a").text().trim() || null
            },
            meta: {
                link: $('meta[property="og:url"]').attr("content") || url,
                image: $('meta[property="og:image"]').attr("content") || null
            }
        };
    } catch (e) {
        console.error('Error halodocDetail:', e.message);
        return null;
    }
}

function cleanArticleContent(content) {
    if (!content) return 'Tidak ada konten';
    let teks = content.replace(/DAFTAR ISI/gi, '');
    teks = teks.replace(/\n\s*\n/g, '\n');
    teks = teks
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
    return teks;
}

function renderArticleText(data) {
    const teksContent = cleanArticleContent(data.content);
    let teks = `*${(data.title || 'Artikel Halodoc').trim()}*\n\n`;
    teks += `${teksContent}\n\n`;
    if (data.info) teks += `*Author:* ${data.info.author?.trim() || '-'} | *Waktu:* ${data.info.time?.trim() || '-'}\n`;
    if (data.meta?.link) teks += `*Link:* ${data.meta.link.trim()}\n`;
    return teks;
}

let handler = async (m, { args, conn }) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ').trim();
            if (!keyword) return m.reply('Masukkan kata kunci untuk pencarian.\nContoh: .halodoc search batuk');

            m.reply('Mencari artikel di Halodoc...');
            const results = await halodocSearch(keyword);
            if (!results.length) return m.reply('Tidak ditemukan.');

            // Buat rows untuk single_select
            const rows = results.slice(0, 10).map(article => ({
                header: article.health.title,
                title: article.title,
                description: article.description,
                id: `.halodoc detail ${article.articleLink}`
            }));

            // Kirim button
            await conn.sendMessage(m.chat, {
                text: `Hasil pencarian untuk *${keyword}*`,
                footer: 'Klik untuk lihat detail',
                buttons: [
                    {
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Artikel' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Hasil Pencarian',
                                sections: [
                                    {
                                        title: 'Daftar Artikel',
                                        highlight_label: 'Populer',
                                        rows
                                    }
                                ]
                            })
                        }
                    }
                ],
                headerType: 1,
                viewOnce: true
            }, { quoted: m });
            break;
        }

        case 'detail': {
            const articleUrl = args.slice(1).join(' ').trim();
            if (!articleUrl.startsWith('http')) return m.reply('Masukkan link artikel Halodoc yang valid.');

            m.reply('Mengambil detail artikel Halodoc...');
            const data = await halodocDetail(articleUrl);
            if (!data) return m.reply('Gagal mendapatkan detail artikel.');

            const teks = renderArticleText(data);
            await conn.sendMessage(m.chat, {
                text: teks,
                image: data.meta?.image ? { url: data.meta.image } : undefined
            }, { quoted: m });
            break;
        }

        default:
            return m.reply('Command tidak dikenali, gunakan:\n.halodoc search <kata kunci>\n.halodoc detail <link artikel>');
    }
};

handler.command = /^(halodoc)$/i;
handler.help = ['halodoc search <kata kunci>', 'halodoc detail <link artikel>'];
handler.tags = ['internet'];
handler.limit = true;

module.exports = handler;