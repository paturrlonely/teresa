const axios = require('axios')
const cheerio = require('cheerio')
const util = require('util')

/**
 * Samehadaku Scraper Class
 * Do not modify the core logic of this class.
 */
class Samehadaku {
    constructor() {
        this.d = 'v1.samehadaku.how'
        this.ins = axios.create({
            baseURL: 'https://' + this.d,
            headers: {
                'Accept-Encoding': 'gzip, deflate, br',
                'Host': this.d,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 16; V2405A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.123 Mobile Safari/537.36',
            }
        })
    }

    async search(query, page = 1) {
        try {
            const r = await this.ins.get(`/page/${page}/`, {
                    params: {
                        s: query
                    }
                }),
                [$, sr, genres] = [
                    cheerio.load(r.data), [],
                    []
                ]

            $('main#main article.animpost').each((idx, el) => {
                const m = $(el),
                    [title, img, score, type, status, synopsis, url] = [
                        m.find('.data .title h2').text().trim(),
                        m.find('.content-thumb img.anmsa').attr('src'),
                        m.find('.content-thumb .score').text().trim(),
                        m.find('.content-thumb .type').text().trim(),
                        m.find('.data .type').text().trim(),
                        m.find('.stooltip .ttls').text().trim(),
                        m.find('.animposx > a').attr('href')
                    ]

                m.find('.stooltip .genres .mta a').each((_, ex) => {
                    genres.push($(ex).text().trim())
                });

                if (title) {
                    sr.push({
                        index: idx,
                        title,
                        url,
                        img,
                        score,
                        type,
                        status,
                        synopsis,
                        genres: [...genres] // Create a copy
                    });
                    genres.length = 0; // Clear for next iteration
                }
            });

            const res = {
                status: true,
                data: sr,
            }

            const hh = $('.pagination')
            const gg = hh.find('span').first().text()
            if (gg) {
                const xn = gg.match(/Page (.*?) of (.*?)$/)
                res.totalPage = Number(xn[2])
                res.hasNext = Number(xn[1]) !== Number(xn[2])
            } else {
                res.totalPage = sr.length
                res.hasNext = !1
            }

            return res
        } catch (e) {
            console.error(e);
            return {
                status: false,
                message: `An error occurred, msg: ${e.message}`
            };
        }
    }

    async detail(lnk) {
        try {
            const r = await this.ins.get(lnk),
                [$, synopsis, genres, detail, episode, batch, fn] = [
                    cheerio.load(r.data), ...Array.from({
                        length: 5
                    }).map(_ => ([])),
                    (x, z) => $(x).each((_, l) => z(l))
                ]

            fn('.infox .entry-content p', l => synopsis.push($(l).text().trim()));
            fn('.infox .genre-info a', l => genres.push($(l).text().trim()));
            fn('.infox .spe span', l => {
                const s = $(l),
                    k = s.find('b').text().trim().toLowerCase().replace(/\s/g, '_').replace(/:/, '')
                s.find('b').remove()
                if (k) {
                    detail[k] = s.text().trim();
                }
            });

            fn('.lstepsiode.listeps ul li', l => {
                const z = $(l),
                    [number, title, date, url] = [
                        z.find('.epsright .eps a').text().trim(), z.find('.epsleft .lchx a').text().trim(),
                        z.find('.epsleft .date').text().trim(), z.find('.epsleft .lchx a').attr('href')
                    ]
                episode.push({
                    number,
                    title,
                    date,
                    url
                });
            });

            fn('.listbatch a', l => {
                batch.push($(l).attr('href'))
            })

            return {
                status: true,
                title: $('header.info_episode h1.entry-title').text().trim(),
                score: $('.rating-area span[itemprop="ratingValue"]').text().trim(),
                img: $('.infoanime .thumb img').attr('src'),
                published: $('time[itemprop="datePublished"]').attr('datetime'),
                synopsis: synopsis.join('\n'),
                genres,
                detail: Object.assign({}, ...Object.entries(detail).map(([k, v]) => ({
                    [k]: v
                }))),
                batch,
                episode: episode.reverse()
            }
        } catch (e) {
            console.error(e);
            return {
                status: false,
                message: `An error occurred, msg: ${e.message}`
            };
        }
    }

    async episode(lnk) {
        try {
            const r = await this.ins.get(lnk),
                [$, mdt, stream, download, episode, fn, ] = [
                    cheerio.load(r.data), {}, ...Array.from({
                        length: 3
                    }).map(_ => ([])),
                    (x, z) => $(x).each((_, l) => z(l))
                ],
                [nextUrl] = [$('.naveps .nvs.rght a').attr('href')]

            if (nextUrl && !nextUrl.includes('#')) {
                mdt.nextEpisodeUrl = nextUrl;
                mdt.nextEpisode = !0
            } else mdt.nextEpisode = !1;

            fn('#server ul li .east_player_option', l => {
                const n = $(l),
                    [id, name, nume, type] = [
                        n.attr('data-post'), n.find('span').text().trim(),
                        n.attr('data-nume'), n.attr('data-type')
                    ]
                stream.push({
                    id,
                    name,
                    nume,
                    type,
                    data: Buffer.from(`post=${id}&nume=${nume}`).toString('base64')
                });
            });

            fn('.download-eps', l => {
                const g = $(l),
                    [formats, title] = [
                        [], g.find('p > b').text().trim()
                    ]
                g.find('ul > li').each((_, j) => {
                    const x = $(j),
                        [links, quality] = [
                            [], x.find('strong').text().trim()
                        ]
                    x.find('span a').each((k, a) => {
                        links.push({
                            host: $(a).text().trim(),
                            url: $(a).attr('href')
                        });
                    });
                    if (quality) {
                        formats.push({
                            quality,
                            links
                        });
                    }
                });
                if (title) {
                    download.push({
                        title,
                        formats
                    });
                }
            });

            fn('.episode-lainnya .lstepsiode ul li', l => {
                const x = $(l),
                    [title, date, img, url] = [
                        x.find('.epsleft .lchx a').text().trim(), x.find('.epsleft .date').text().trim(),
                        x.find('.epsright img').attr('src'), x.find('.epsleft .lchx a').attr('href')
                    ]
                episode.push({
                    title,
                    date,
                    img,
                    url
                });
            });

            return {
                status: true,
                title: $('header.info_episode h1.entry-title').text().trim(),
                series: $('.naveps .nvsc a').attr('href'),
                stream,
                download,
                episode,
                ...mdt
            }
        } catch (e) {
            console.error(e);
            return {
                status: false,
                message: `An error occurred, msg: ${e.message}`
            };
        }
    }

    async batch(lnk) {
        try {
            const r = await this.ins.get(lnk),
                [$, detail, download, fn] = [
                    cheerio.load(r.data), {},
                    [],
                    (x, z) => $(x).each((_, l) => z(l))
                ]

            fn('.infox .spe span', l => {
                const s = $(l),
                    k = s.find('b').text().trim().toLowerCase().replace(/\s/g, '_').replace(/:/, '')
                s.find('b').remove()
                if (k) {
                    detail[k] = s.text().trim();
                }
            });

            fn('.download-eps', l => {
                const g = $(l),
                    [formats, title] = [
                        [], g.find('p > b').text().trim()
                    ]
                g.find('ul > li').each((_, j) => {
                    const x = $(j),
                        [links, quality] = [
                            [], x.find('strong').text().trim()
                        ]
                    x.find('span a').each((k, a) => {
                        links.push({
                            host: $(a).text().trim(),
                            url: $(a).attr('href')
                        });
                    });
                    if (quality) {
                        formats.push({
                            quality,
                            links
                        });
                    }
                });
                if (title) {
                    download.push({
                        title,
                        formats
                    });
                }
            });

            return {
                title: $('h1.entry-title').text(),
                img: $('img.anmsa').attr('src'),
                published: $('time[itemprop="datePublished"]').attr('datetime'),
                detail: Object.assign({}, ...Object.entries(detail).map(([k, v]) => ({
                    [k]: v
                }))),
                download
            }
        } catch (e) {
            console.error(e);
            return {
                status: false,
                message: `An error occurred, msg: ${e.message}`
            };
        }
    }

    async stream(dt) {
        try {
            const id = Buffer.from(dt, 'base64').toString()
            const r = await this.ins.post('/wp-admin/admin-ajax.php', `action=player_ajax&${id}&type=schtml`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            })
            const n = r.data.match(/iframe\ssrc="(.*?)"\s/)?.[1]
            if (n) {
                return {
                    status: true,
                    url: n
                }
            } else {
                return {
                    status: false,
                    msg: 'url not found from iframe'
                }
            }
        } catch (e) {
            console.error(e);
            return {
                status: false,
                message: `An error occurred, msg: ${e.message}`
            };
        }
    }

    async schedule(day = 'monday') {
        try {
            const r = await this.ins.get('/wp-json/custom/v1/all-schedule', {
                params: {
                    perpage: '50',
                    day,
                    type: 'schtml'
                }
            })

            return r.data.map(p => ({
                title: p.title,
                score: p.east_score,
                date: p.date,
                type: p.east_type,
                genre: p.genre,
                img: p.featured_img_src,
                url: p.url
            }))
        } catch (e) {
            console.error(e);
            return {
                status: false,
                message: `An error occurred, msg: ${e.message}`
            };
        }
    }

    async latest(page = 1) {
        try {
            const r = await this.ins.get(`/anime-terbaru/page/${page}/`),
                [$, dt, fn] = [
                    cheerio.load(r.data), [],
                    (x, z) => $(x).each((_, l) => z(l))
                ]

            fn('.post-show ul li', l => {
                const n = $(l),
                    [title, episode, released, img, url] = [
                        n.find('h2 a').text(), n.find('span > author').first().text(),
                        n.find('span:contains("Released on")').text()?.split(':')?.[1].trim(),
                        n.find('a img').attr('src'), n.find('a[itemprop]').attr('href')
                    ]
                dt.push({
                    title,
                    episode,
                    released,
                    img,
                    url
                });
            });

            return dt
        } catch (e) {
            console.error(e);
            return {
                status: false,
                message: `An error occurred, msg: ${e.message}`
            };
        }
    }
}


/**
 * Plugin Handler
 */
let handler = async (m, {
    conn,
    text,
    args,
    usedPrefix,
    command
}) => {
    const samehadaku = new Samehadaku();
    const subCommand = args[0] ? args[0].toLowerCase() : '';
    const query = args.slice(1).join(' ');

    try {
        switch (subCommand) {
            case 'search': {
                if (!query) return m.reply(`*Usage:* ${usedPrefix + command} search <query>`);
                m.reply('Searching, please wait...');
                const result = await samehadaku.search(query);
                if (!result || !result.status || result.data.length === 0) {
                    return m.reply('No results found.');
                }
                let replyText = `*Search Results for "${query}"*\n\n`;
                result.data.forEach((item, index) => {
                    replyText += `*${index + 1}. ${item.title}*\n`;
                    replyText += `*Status:* ${item.status}\n`;
                    replyText += `*Score:* ${item.score}\n`;
                    replyText += `*URL:* ${item.url}\n\n`;
                });
                replyText += `Page 1 of ${result.totalPage}`;
                m.reply(replyText);
                break;
            }

            case 'latest': {
                const page = query ? parseInt(query) : 1;
                if (isNaN(page)) return m.reply(`Invalid page number. *Usage:* ${usedPrefix + command} latest [page]`);
                m.reply(`Fetching latest anime on page ${page}...`);
                const result = await samehadaku.latest(page);
                if (!result || result.length === 0) {
                    return m.reply('No latest anime found on this page.');
                }
                let replyText = `*Latest Anime Updates (Page ${page})*\n\n`;
                result.forEach((item, index) => {
                    replyText += `*${index + 1}. ${item.title}*\n`;
                    replyText += `*Episode:* ${item.episode}\n`;
                    replyText += `*Released:* ${item.released}\n`;
                    replyText += `*URL:* ${item.url}\n\n`;
                });
                m.reply(replyText);
                break;
            }

            case 'detail': {
                if (!query || !query.startsWith('http')) return m.reply(`*Usage:* ${usedPrefix + command} detail <samehadaku_url>`);
                m.reply('Fetching details...');
                const result = await samehadaku.detail(query);
                if (!result || !result.status) {
                    return m.reply('Could not fetch details for the given URL.');
                }
                let detailText = Object.entries(result.detail).map(([key, value]) => `*${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:* ${value}`).join('\n');

                let replyText = `*Title:* ${result.title}\n`;
                replyText += `*Score:* ${result.score}\n`;
                replyText += `*Published:* ${result.published}\n\n`;
                replyText += `*Synopsis:*\n${result.synopsis}\n\n`;
                replyText += `*Genres:*\n${result.genres.join(', ')}\n\n`;
                replyText += `*Details:*\n${detailText}\n\n`;
                replyText += `*Batch URL:* ${result.batch[0] || 'Not Available'}`;

                if (result.img) {
                    await conn.sendMessage(m.chat, {
                        image: {
                            url: result.img
                        },
                        caption: replyText
                    }, {
                        quoted: m
                    });
                } else {
                    m.reply(replyText);
                }
                break;
            }

            case 'episode': {
                if (!query || !query.startsWith('http')) return m.reply(`*Usage:* ${usedPrefix + command} episode <episode_url>`);
                m.reply('Fetching episode data...');
                const result = await samehadaku.episode(query);
                if (!result || !result.status) {
                    return m.reply('Could not fetch episode data for the given URL.');
                }
                let replyText = `*Title:* ${result.title}\n`;
                replyText += `*Series URL:* ${result.series}\n`;
                replyText += `*Next Episode Available:* ${result.nextEpisode ? 'Yes' : 'No'}\n`;
                if (result.nextEpisodeUrl) {
                    replyText += `*Next Episode URL:* ${result.nextEpisodeUrl}\n`;
                }
                replyText += `\n*Stream Options:*\n`;
                result.stream.forEach(s => {
                    replyText += `- ${s.name}\n  (Use \`${usedPrefix + command} stream ${s.data}\` to get link)\n`;
                });
                replyText += `\n*Download Links:*\nTo keep the message clean, download links are omitted. Please visit the episode URL to see them.`;

                m.reply(replyText);
                break;
            }

            case 'stream': {
                if (!query) return m.reply(`*Usage:* ${usedPrefix + command} stream <data_from_episode_command>`);
                m.reply('Generating stream link...');
                const result = await samehadaku.stream(query);
                if (!result || !result.status) {
                    return m.reply(result.msg || 'Could not generate stream link.');
                }
                m.reply(`*Stream URL:*\n${result.url}`);
                break;
            }

            case 'batch': {
    if (!query || !query.startsWith('http')) 
        return m.reply(`*Usage:* ${usedPrefix + command} batch <batch_url>`);

    m.reply('⏳ Fetching batch download links...');

    try {
        const result = await samehadaku.batch(query);

        // ==== DEBUG GLOBAL RESULT ====
        console.log("\n[DEBUG] RAW RESULT:");
        console.log(JSON.stringify(result, null, 2));

        if (!result || !result.title) {
            console.log("[DEBUG] No title found inside result");
            return m.reply('❌ Could not fetch batch details for the given URL.');
        }

        // ==== DEBUG DETAIL STRUCTURE ====
        console.log("\n[DEBUG] DETAIL OBJECT:");
        console.log(result.detail);

        let detailText = Object.entries(result.detail || {})
            .map(([key, value]) => `*${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:* ${value}`)
            .join('\n');

        // ==== DEBUG DOWNLOAD ROOT ====
        console.log("\n[DEBUG] DOWNLOAD ROOT:");
        console.log(result.download);

        let downloadText = '';
        if (Array.isArray(result.download)) {
            result.download.forEach((batch, i) => {
                console.log(`\n[DEBUG] BATCH #${i + 1}:`, batch);

                downloadText += `\n *${batch.title || 'Untitled'}*\n`;

                if (Array.isArray(batch.formats)) {
                    batch.formats.forEach((format, j) => {
                        console.log(`  [DEBUG] FORMAT #${j + 1}:`, format);

                        let label =
                            format.quality ||
                            format.label ||
                            format.resolution ||
                            'Unknown';

                        // ✅ FIX: ambil link dari format.links[]
                        if (Array.isArray(format.links) && format.links.length > 0) {
                            format.links.forEach((l, k) => {
                                console.log(`    [DEBUG] LINK #${k + 1}:`, l);
                                downloadText += `- ${label} (${l.host}): ${l.url}\n`;
                            });
                        } else {
                            console.log("    [DEBUG] No links found in this format");
                            downloadText += `- ${label}: No link\n`;
                        }
                    });
                } else {
                    console.log("  [DEBUG] No formats found in this batch");
                    downloadText += '- No formats available\n';
                }
            });
        } else {
            console.log("[DEBUG] result.download is not an array");
            downloadText = 'No download links available';
        }

        let replyText = `🎬 *Title:* ${result.title}\n`;
        replyText += `📅 *Published:* ${result.published || 'Unknown'}\n\n`;
        replyText += `📖 *Details:*\n${detailText}\n\n`;
        replyText += `⬇️ *Download Links:*\n${downloadText}`;

        if (result.img) {
            await conn.sendMessage(m.chat, {
                image: { url: result.img },
                caption: replyText
            }, { quoted: m });
        } else {
            m.reply(replyText);
        }

    } catch (err) {
        console.error("\n[DEBUG ERROR]", err);
        m.reply('❌ An error occurred while fetching batch details.');
    }

    break;
}

            case 'schedule': {
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const day = query ? query.toLowerCase() : new Date().toLocaleString('en-US', {
                    weekday: 'long'
                }).toLowerCase();
                if (!days.includes(day)) return m.reply(`Invalid day. Available days: ${days.join(', ')}`);
                m.reply(`Fetching schedule for ${day}...`);
                const result = await samehadaku.schedule(day);
                if (!result || result.length === 0) {
                    return m.reply(`No schedule found for ${day}.`);
                }
                let replyText = `*Anime Schedule for ${day.charAt(0).toUpperCase() + day.slice(1)}*\n\n`;
                result.forEach((item, index) => {
                    replyText += `*${index + 1}. ${item.title}*\n`;
                    replyText += `*Score:* ${item.score}\n`;
                    replyText += `*URL:* ${item.url}\n\n`;
                });
                m.reply(replyText);
                break;
            }

            default:
                m.reply(handler.help.replace(/samehadaku/g, `${usedPrefix + command}`));
                break;
        }
    } catch (e) {
        console.error(e);
        m.reply('An unexpected error occurred. Please check the logs.');
    }
};

handler.help = `
*Samehadaku Anime Scraper*

Provides tools to search and retrieve information from samehadaku.

*Sub-commands:*
- \`search <query>\`
  _Search for an anime._
- \`latest [page]\`
  _Get the latest updated anime._
- \`detail <url>\`
  _Get details of a specific anime from its URL._
- \`episode <url>\`
  _Get download & stream links for an episode._
- \`batch <url>\`
  _Get batch download links for an anime._
- \`stream <data>\`
  _Get direct stream URL from episode data._
- \`schedule [day]\`
  _Get anime release schedule (default: today)._

*Example:*
- \`samehadaku search solo leveling\`
- \`samehadaku latest 2\`
- \`samehadaku schedule friday\`
`.trim();
handler.command = ['samehadaku'];
handler.tags = ['anime'];
handler.description = 'Scrape anime information from Samehadaku.';

module.exports = handler;