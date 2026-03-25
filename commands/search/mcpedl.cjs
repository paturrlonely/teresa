const axios = require("axios")
const cheerio = require("cheerio")

class Mcpedl {
    constructor() {
        this.baseURL = "https://mcpedl.org";
        this.is = axios.create({
            baseURL: this.baseURL,
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7271.123 Mobile Safari/537.36",
            }
        });
    }

    async search(query, page = 1) {
        try {
            const {
                data
            } = await this.is.get(`/page/${page}/`, {
                params: {
                    s: query
                }
            });
            const $ = cheerio.load(data);
            const list = []
            const n = $('a.next')
            $('.entries .g-grid .g-block article section').each((i, el) => {
                if ($(el).find('a').attr('href')) {
                    list.push({
                        name: $(el).find('h2 a').text(),
                        id: $(el).find('a').attr('href').split("/").at(-2),
                        img: $(el).find('img').attr('src'),
                        rating: $(el).find('.rating-wrapper span').text().trim()
                    })
                }
            })
            return {
                list,
                hasNextPage: !!n.attr('href'),
                nextPage: !!n.attr('href') ? n.attr('href').split("/").at(-2) : null,
            }
        } catch (err) {
            return this._handleError(err);
        }
    }

    async detail(id) {
        try {
            const r = await this.is.get(`/${id}`);
            const $ = cheerio.load(r.data);

            const [list, gallery, faq, info] = [
                [],
                [],
                [], {
                    category: $('.categories .single-cat').text().trim(),
                    postDate: $('.date').attr('content') || $('.date').text().trim(),
                    author: $('.meta-author-link .author').text().trim()
                }
            ]

            $("section#download-link table tbody tr").each((_, el) => {
                list.push({
                    name: $(el).find('td:eq(1)').text(),
                    nn: $(el).find('td > form').attr('action').split('/')?.[2],
                })
            })
            $('.entry-gallery div div div').each((_, el) => {
                const ty = el.attribs?.itemtype?.includes('Video') ? 'video' : 'image'
                gallery.push({
                    type: ty,
                    img: $(el).find('img').attr('src'),
                    ...(ty == 'video' ? {
                        name: $(el).find('[itemprop="name"]').attr('content') || '',
                        postTime: $(el).find('[itemprop="uploadDate"]').attr('content') || '',
                        duration: $(el).find('[itemprop="duration"]').attr('content') || null,
                        video: $(el).find('a[itemprop="embedUrl"]').attr('onclick')?.match(/src: '(.*?)'/)?.[1] || null,
                    } : {})
                })
            })
            $('#faqs div details').each((_, el) => {
                faq.push({
                    question: $(el).find('summary h3').text(),
                    answer: $(el).find('div p').text()
                })
            })
            $('.entry-footer-column').each((_, el) => {
                const cdiv = $(el).find('.entry-footer-content')
                let label = cdiv.find('div').first().text().trim().replace(':', '')
                let value = cdiv.find('span').last().text().trim()
                if (!label) {
                    label = cdiv.contents().filter(function() {
                        return this.type === 'text'
                    }).text().trim().replace(':', '')
                }
                if (label && value) {
                    const key = label.toLowerCase().replace(/\s+/g, '_');
                    if (!['categories', 'publication_date', 'author'].includes(key)) {
                        info[key] = value
                    }
                    if (label === "Author" && info.postAuthor && value !== info.postAuthor) {
                        info['game_author'] = value
                    }
                }
            })

            return {
                title: $('.entry-title').text().trim(),
                img: $('.post-thumbnail img').attr('src'),
                rating: {
                    count: $('span[itemprop="ratingCount"]').text(),
                    value: $('span[itemprop="ratingValue"]').text(),
                },
                comment: $('span.comment-count').text(),
                content: $('section.entry-content div').text().trim(),
                info,
                gallery,
                faq,
                list: this._parseTable($)
            };
        } catch (err) {
            return this._handleError(err);
        }
    }

    async download(id) {
        try {
            const dlResponse = await this.is.get(`/dw_file.php`, {
                params: {
                    id: id
                }
            });
            const $ = cheerio.load(dlResponse.data);
            return {
                url: $("a").attr("href")
            };
        } catch (err) {
            return this._handleError(err);
        }
    }

    async mclatest(page = 1) {
        try {
            const w = await this.is.get(`/downloading/page/${page}/`);
            const $ = cheerio.load(w.data);
            const [quick, list] = [
                [],
                []
            ]

            $('.archive .dwbuttonslist div[style*="solid"]').each((i, el) => {
                if ($(el).find('a').attr('href')) {
                    quick.push({
                        name: $(el).find('span[style*="font-weight: 900"]').text(),
                        id: $(el).find('div a').attr('href')?.replace(/\//g, ''),
                        file: parseInt($(el).find('form').attr('action').split('/')?.[2])
                    })
                }
            })
            $('.entries .g-grid .g-block article section').each((i, el) => {
                if ($(el).find('a').attr('href')) {
                    list.push({
                        name: $(el).find('h2 a').text(),
                        id: $(el).find('a').attr('href').split("/").at(-2),
                        img: $(el).find('img').attr('src'),
                        rating: $(el).find('.rating-wrapper span').text().trim()
                    })
                }
            })

            return {
                quick,
                list
            };
        } catch (err) {
            return this._handleError(err);
        }
    }

    _parseTable($, rs = []) {
        $('#download-link table tbody tr').each((j, el) => {
            let [tds, nm, vr, fc, fl] = [$(el).find('td'), null, null, '', []]
            if (tds.length === 3) {
                nm = $(tds[0]).text().trim();
                vr = $(tds[1]).text().trim();
                fc = $(tds[2]);
            } else if (tds.length === 2) {
                nm = $(tds[0]).text().trim();
                vr = "N/A";
                fc = $(tds[1]);
            }
            if (fc) {
                fc.find('form').each((i, ef) => fl.push({
                    index: i + 1,
                    type: $(ef).find('button').text().replace(/\s+/g, ' ').trim(),
                    id: parseInt($(ef).attr('action').split('/')?.[2]),
                    meta_title: $(ef).find('input[name="post_title"]').val() || null
                }))
            }

            rs.push({
                index: j + 1,
                name: nm,
                version: vr,
                files: fl
            })
        })
        return rs
    }

    _handleError(err) {
        if (err?.response?.status === 404) {
            return {
                error: true,
                message: "Page Not Found"
            };
        }
        throw err;
    }
}


const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    const usage = `*MCPEDL Scraper*

*Usage:* ${usedPrefix + command} <subcommand> [query]

*Subcommands:*
  - *search <query>*: Search for mods, maps, etc.
  - *detail <id>*: Get details of an item using its ID from search.
  - *download <file_id>*: Get download link for a file using its ID from details.
  - *latest [page]*: Get the latest uploads.
  
*Example:*
  1. _Search for shaders:_
     \`${usedPrefix + command} search realistic shader\`
  2. _Get item details:_
     \`${usedPrefix + command} detail seus-pe-shader\`
  3. _Download a specific file:_
     \`${usedPrefix + command} download 123456\``;

    if (!args[0]) {
        return await conn.sendMessage(m.chat, {
            text: usage
        }, {
            quoted: m
        });
    }

    const mcpedl = new Mcpedl();
    const subcommand = args[0].toLowerCase();

    try {
        switch (subcommand) {
            case 'search': {
                let page = 1;
                let searchArgs = args.slice(1);
                const lastArg = searchArgs[searchArgs.length - 1];

                if (!isNaN(lastArg) && searchArgs.length > 1) {
                    page = parseInt(lastArg, 10);
                    searchArgs.pop();
                }
                const searchQuery = searchArgs.join(' ');

                if (!searchQuery) return await conn.sendMessage(m.chat, {
                    text: `Please provide a search query.\n*Example:* ${usedPrefix + command} search shaders`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: `🔎 Searching for "${searchQuery}" on page ${page}...`
                }, {
                    quoted: m
                });

                const results = await mcpedl.search(searchQuery, page);

                if (results.error || results.list.length === 0) {
                    return await conn.sendMessage(m.chat, {
                        text: 'No results found.'
                    }, {
                        quoted: m
                    });
                }

                let reply = results.list.map(item => `*${item.name}*\nID: \`${item.id}\`\nRating: ${item.rating}`).join('\n\n');
                if (results.hasNextPage) {
                    reply += `\n\n*➡️ Next page available.*\nUse: \`${usedPrefix + command} search ${searchQuery} ${results.nextPage}\``;
                }
                await conn.sendMessage(m.chat, {
                    text: reply
                }, {
                    quoted: m
                });
                break;
            }

            case 'detail': {
                const query = args.slice(1).join(' ');
                if (!query) return await conn.sendMessage(m.chat, {
                    text: `Please provide an ID.\n*Example:* ${usedPrefix + command} detail another-gun-addon`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: `📄 Fetching details for "${query}"...`
                }, {
                    quoted: m
                });

                const detail = await mcpedl.detail(query);
                if (detail.error) {
                    return await conn.sendMessage(m.chat, {
                        text: `Error: ${detail.message}`
                    }, {
                        quoted: m
                    });
                }

                let infoText = Object.entries(detail.info).map(([key, value]) => `  - *${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:* ${value}`).join('\n');
                let downloadText = detail.list.map(item => {
                    let files = item.files.map(file => `    - ${file.type} (ID: \`${file.id}\`)`).join('\n');
                    return `  - *${item.name}* (v${item.version})\n${files}`;
                }).join('\n');

                const reply = `*${detail.title}*\n\n` +
                    `*⭐ Rating:* ${detail.rating.value} (${detail.rating.count} votes)\n` +
                    `*💬 Comments:* ${detail.comment}\n\n` +
                    `*📝 Description:*\n${detail.content.substring(0, 250).trim()}...\n\n` +
                    `*ℹ️ Information:*\n${infoText}\n\n` +
                    `*📥 Downloads:*\n_Use \`${usedPrefix + command} download <ID>\` to get the link._\n${downloadText}`;

                try {
                    const thumbnailBuffer = (await conn.getFile(detail.img)).data;
                    await conn.sendMessage(m.chat, {
                        text: reply,
                        contextInfo: {
                            externalAdReply: {
                                title: detail.title,
                                body: `By ${detail.info.author}`,
                                thumbnail: thumbnailBuffer,
                                sourceUrl: `${mcpedl.baseURL}/${query}/`,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, {
                        quoted: m
                    });
                } catch (thumbError) {
                    console.error("MCPEDL Thumbnail download failed:", thumbError);
                    await conn.sendMessage(m.chat, {
                        text: reply
                    }, {
                        quoted: m
                    });
                }
                break;
            }

            case 'download':
            case 'dl': {
                const query = args.slice(1).join(' ');
                if (!query) return await conn.sendMessage(m.chat, {
                    text: `Please provide a file ID.\n*Example:* ${usedPrefix + command} download 12345`
                }, {
                    quoted: m
                });
                if (isNaN(query)) return await conn.sendMessage(m.chat, {
                    text: `File ID must be a number.`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: `🔗 Generating download link for ID "${query}"...`
                }, {
                    quoted: m
                });

                const result = await mcpedl.download(query);
                if (result.error) {
                    return await conn.sendMessage(m.chat, {
                        text: `Error: ${result.message}`
                    }, {
                        quoted: m
                    });
                }
                if (!result.url) {
                    return await conn.sendMessage(m.chat, {
                        text: 'Could not retrieve download link.'
                    }, {
                        quoted: m
                    });
                }
                await conn.sendMessage(m.chat, {
                    text: `✅ Download link generated:\n\n${result.url}`
                }, {
                    quoted: m
                });
                break;
            }

            case 'latest': {
                const query = args.slice(1).join(' ');
                const page = !isNaN(query) && query ? parseInt(query, 10) : 1;
                await conn.sendMessage(m.chat, {
                    text: `🆕 Fetching latest content (Page ${page})...`
                }, {
                    quoted: m
                });

                const latest = await mcpedl.mclatest(page);
                if (latest.error) {
                    return await conn.sendMessage(m.chat, {
                        text: `Error: ${latest.message}`
                    }, {
                        quoted: m
                    });
                }

                let quickText = latest.quick.map(item => `*${item.name}*\n  - Detail ID: \`${item.id}\`\n  - File ID: \`${item.file}\``).join('\n');
                let listText = latest.list.map(item => `*${item.name}*\n  - ID: \`${item.id}\`\n  - Rating: ${item.rating}`).join('\n\n');

                const reply = `*🚀 Quick Downloads (Page ${page})*\n${quickText}\n\n` +
                    `*✅ Latest Entries (Page ${page})*\n${listText}`;

                await conn.sendMessage(m.chat, {
                    text: reply
                }, {
                    quoted: m
                });
                break;
            }

            default:
                await conn.sendMessage(m.chat, {
                    text: `Invalid subcommand.\n\n${usage}`
                }, {
                    quoted: m
                });
        }
    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, {
            text: `An unexpected error occurred. Please try again later.`
        }, {
            quoted: m
        });
    }
};

handler.command = ['mcpedl'];
handler.help = ['search <query>', 'detail <id>', 'download <file_id>', 'latest [page]'];
handler.description = 'Search, get details, and download from mcpedl.org';
handler.tags = 'search';
module.exports = handler