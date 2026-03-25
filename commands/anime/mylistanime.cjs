const axios = require('axios');
const cheerio = require('cheerio');

class MAL {
    topAnime = async function() {
        try {
            const {
                data
            } = await axios.get('https://myanimelist.net/topanime.php');
            const $ = cheerio.load(data);
            const animeList = [];

            $('.ranking-list').each((_, element) => {
                const rank = $(element).find('.rank').text().trim();
                const title = $(element).find('.title h3 a').text().trim();
                const url = $(element).find('.title h3 a').attr('href');
                const score = $(element).find('.score span').text().trim();
                const cover = $(element).find('.title img').attr('data-src');
                const type = $(element).find('.information').text().split('\n')[1].trim();
                const release = $(element).find('.information').text().split('\n')[2].trim();
                const members = $(element).find('.information').text().split('\n')[3].trim();

                animeList.push({
                    rank,
                    title,
                    score,
                    type,
                    release,
                    members,
                    cover,
                    url
                });
            });

            return animeList;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    seasonalAnime = async function(season, type) {
        try {
            const valid = {
                seasons: ['fall', 'spring', 'winter', 'summer'],
                types: {
                    'tv-new': 'TV (New)',
                    'tv-continuing': 'TV (Continuing)',
                    'ona': 'ONA',
                    'ova': 'OVA',
                    'movie': 'Movie',
                    'special': 'Special'
                }
            };

            if (!valid.types[type]) throw new Error(`Available types: ${Object.keys(valid.types).join(', ')}`);
            if (!valid.seasons.includes(season)) throw new Error(`Available seasons: ${valid.seasons.join(', ')}`);

            const {
                data
            } = await axios.get(`https://myanimelist.net/anime/season/2024/${season}`);
            const $ = cheerio.load(data);
            const animeList = [];

            $('.seasonal-anime-list').each((_, list) => {
                const typeTxt = $(list).find('.anime-header').text().trim();

                $(list).find('.js-seasonal-anime').each((_, element) => {
                    const title = $(element).find('.h2_anime_title > a').text().trim();
                    const url = $(element).find('.h2_anime_title > a').attr('href');
                    const cover = $(element).find('.image > a > img').attr('src') || $(element).find('.image > a > img').attr('data-src');
                    const score = $(element).find('.js-score').text().trim();
                    const members = $(element).find('.js-members').text().trim();
                    const formattedMembers = Number(members.replace(/\D/g, '')).toLocaleString('en-US');

                    const infoDiv = $(element).find('.info');
                    const releaseDate = infoDiv.find('.item:first-child').text().trim();
                    const totalEps = infoDiv.find('.item:nth-child(2) span:first-child').text().trim();
                    const duration = infoDiv.find('.item:nth-child(2) span:nth-child(2)').text().trim();
                    const totalEpsWithDuration = `${totalEps}, ${duration}`;

                    const synopsis = $(element).find('.synopsis p').text().trim();

                    const studio = $(element).find('.property:contains("Studio") .item').text().trim();
                    const source = $(element).find('.property:contains("Source") .item').text().trim();
                    const themes = $(element).find('.property:contains("Themes") .item').map((_, theme) => $(theme).text().trim()).get().join(', ');
                    const genres = $(element).find('.genres .genre a').map((_, g) => $(g).text().trim()).get().join(', ');

                    animeList.push({
                        title,
                        type: typeTxt || 'Unknown',
                        url,
                        cover,
                        stats: {
                            score: score || 'N/A',
                            members: formattedMembers || 'N/A'
                        },
                        details: {
                            releaseDate: releaseDate || 'Unknown',
                            totalEpisodes: totalEpsWithDuration || 'Unknown',
                            studio: studio || 'Unknown',
                            source: source || 'Unknown'
                        },
                        tags: {
                            themes: themes || 'None',
                            genres: genres || 'None'
                        },
                        synopsis: synopsis
                    });
                });
            });

            return animeList.filter(obj => obj.type === valid.types[type]);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    animeSearch = async function(query) {
        try {
            if (!query) throw new Error('Query is required');

            const {
                data
            } = await axios.get(`https://myanimelist.net/anime.php?q=${encodeURIComponent(query)}&cat=anime`);
            const $ = cheerio.load(data);
            const animeList = [];

            $('table tbody tr').each((_, element) => {
                const cover = $(element).find('td:nth-child(1) img').attr('data-src') || $(element).find('td:nth-child(1) img').attr('src');
                const title = $(element).find('td:nth-child(2) strong').text().trim();
                const url = $(element).find('td:nth-child(2) a').attr('href');
                const type = $(element).find('td:nth-child(3)').text().trim();
                const episodes = $(element).find('td:nth-child(4)').text().trim();
                const score = $(element).find('td:nth-child(5)').text().trim();
                const description = $(element).find('td:nth-child(2) .pt4').text().replace('read more.', '').trim() || 'No Desc'

                if (title && url) {
                    animeList.push({
                        title,
                        description,
                        type,
                        episodes,
                        score,
                        cover,
                        url
                    });
                }
            });

            return animeList;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    mangaSearch = async function(query) {
        try {
            if (!query) throw new Error('Query is required');

            const {
                data
            } = await axios.get(`https://myanimelist.net/manga.php?q=${encodeURIComponent(query)}&cat=manga`);
            const $ = cheerio.load(data);
            const animeList = [];

            $('table tbody tr').each((_, element) => {
                const cover = $(element).find('td:nth-child(1) img').attr('data-src') || $(element).find('td:nth-child(1) img').attr('src');
                const title = $(element).find('td:nth-child(2) strong').text().trim();
                const url = $(element).find('td:nth-child(2) a').attr('href');
                const type = $(element).find('td:nth-child(3)').text().trim();
                const vol = $(element).find('td:nth-child(4)').text().trim();
                const score = $(element).find('td:nth-child(5)').text().trim();
                const description = $(element).find('td:nth-child(2) .pt4').text().replace('read more.', '').trim() || 'No Desc'

                if (title && url) {
                    animeList.push({
                        title,
                        description,
                        type,
                        vol,
                        score,
                        cover,
                        url
                    });
                }
            });

            return animeList;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    charaSearch = async function(query) {
        try {
            if (!query) throw new Error('Query is required');

            const {
                data
            } = await axios.get(`https://myanimelist.net/character.php?q=${encodeURIComponent(query)}&cat=character`);
            const $ = cheerio.load(data);
            const characterData = [];

            $('table tbody tr').each((_, element) => {
                const cover = $(element).find('td .picSurround img').attr('data-src') || $(element).find('td .picSurround img').attr('src');
                const nameElement = $(element).find('td:nth-child(2) a');
                const name = nameElement.text().trim();
                const url = nameElement.attr('href') || '';

                const animeList = [];
                const mangaList = [];

                $(element).find('td small a[href*="/anime/"]').each((_, anime) => {
                    animeList.push({
                        title: $(anime).text().trim(),
                        url: `https://myanimelist.net${$(anime).attr('href')}`
                    });
                });

                $(element).find('td small a[href*="/manga/"]').each((_, manga) => {
                    mangaList.push({
                        title: $(manga).text().trim(),
                        url: `https://myanimelist.net${$(manga).attr('href')}`
                    });
                });

                if (name && url) {
                    characterData.push({
                        name,
                        anime: animeList,
                        manga: mangaList,
                        cover,
                        url
                    });
                }
            });

            return characterData;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    animeDetail = async function(url) {
        try {
            if (!url.includes('myanimelist.net/anime')) throw new Error('Invalid MyAnimeList anime URL');

            const {
                data
            } = await axios.get(url);
            const $ = cheerio.load(data);

            const title = $("h1.title-name").text().trim();
            const cover = $(".leftside img").attr("data-src");
            const synopsis = $(".js-scrollfix-bottom-rel").find("p").first().text().trim();
            const background = $('td.pb24:contains("Background")').contents().map(function() {
                if (this.type === 'text') {
                    return $(this).text();
                } else if (this.name === 'i') {
                    return $(this).text();
                }
            }).get().join('').trim();

            const alternativeTitles = {
                synonyms: $('.spaceit_pad:contains("Synonyms")').contents().not('span').text().trim(),
                japanese: $('.spaceit_pad:contains("Japanese")').contents().not('span').text().trim(),
                english: $('.spaceit_pad:contains("English")').contents().not('span').text().trim(),
            };

            const information = {
                type: $('.spaceit_pad:contains("Type") a').text().trim(),
                episodes: $('.spaceit_pad:contains("Episodes")').contents().not('span').text().trim(),
                status: $('.spaceit_pad:contains("Status")').contents().not('span').text().trim(),
                aired: $('.spaceit_pad:contains("Aired")').contents().not('span').text().trim(),
                premiered: $('.spaceit_pad:contains("Premiered") a').text().trim(),
                broadcast: $('.spaceit_pad:contains("Broadcast")').contents().not('span').text().trim(),
                producers: $("span:contains('Producers:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'Unknown',
                licensors: $("span:contains('Licensors:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'Unknown',
                studios: $("span:contains('Studios:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'Unknown',
                source: $('.spaceit_pad:contains("Source")').contents().not('span').text().trim(),
                genres: $("span:contains('Genres:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'None',
                themes: $("span:contains('Themes:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'None',
                demographic: $("span:contains('Demographic:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'None',
                duration: $('.spaceit_pad:contains("Duration")').contents().not('span').text().trim(),
                rating: $('.spaceit_pad:contains("Rating")').contents().not('span').text().trim(),
            };

            const element = $('.spaceit_pad').filter((_, el) => {
                return $(el).find('span.dark_text').text().trim() === 'Ranked:';
            });
            const rankedText = element.contents().filter((_, el) => el.type === 'text').text().trim();

            const statistics = {
                score: $('span[itemprop="ratingValue"]').text().trim(),
                ranked: rankedText,
                popularity: $('.spaceit_pad:contains("Popularity")').contents().not('span').text().trim(),
                members: $('.spaceit_pad:contains("Members")').contents().not('span').text().trim(),
                favorites: $('.spaceit_pad:contains("Favorites")').contents().not('span').text().trim(),
            };

            const externalLinks = $(".external_urls a").map((i, el) => {
                return {
                    name: $(el).find(".caption").text().trim(),
                    url: $(el).attr("href")
                };
            }).get().filter(link => link.name && link.url);

            return {
                title,
                synopsis,
                background,
                alternativeTitles,
                information,
                statistics,
                externalLinks,
                cover,
                url: url
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    mangaDetail = async function(url) {
        try {
            if (!url.includes('myanimelist.net/manga')) throw new Error('Invalid MyAnimeList manga URL');

            const {
                data
            } = await axios.get(url);
            const $ = cheerio.load(data);

            const title = $('span.h1-title span[itemprop="name"]').text().trim();
            const cover = $(".leftside img").attr("data-src");
            const synopsis = $('span[itemprop="description"]').text().trim();
            const background = $('td.pb24:contains("Background")').contents().map(function() {
                if (this.type === 'text') {
                    return $(this).text();
                } else if (this.name === 'i') {
                    return $(this).text();
                }
            }).get().join('').trim();

            const alternativeTitles = {
                synonyms: $('.spaceit_pad:contains("Synonyms")').contents().not('span').text().trim(),
                japanese: $('.spaceit_pad:contains("Japanese")').contents().not('span').text().trim(),
                english: $('.spaceit_pad:contains("English")').contents().not('span').text().trim(),
            };

            const information = {
                type: $('.spaceit_pad:contains("Type") a').text().trim(),
                volumes: $('.spaceit_pad:contains("Volumes")').contents().not('span').text().trim(),
                chapters: $('.spaceit_pad:contains("Chapters")').contents().not('span').text().trim(),
                status: $('.spaceit_pad:contains("Status")').contents().not('span').text().trim(),
                published: $('.spaceit_pad:contains("Published")').contents().not('span').text().trim(),
                genres: $("span:contains('Genres:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'None',
                themes: $("span:contains('Themes:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'None',
                demographic: $("span:contains('Demographic:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'None',
                serialization: $("span:contains('Serialization:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'None',
                authors: $("span:contains('Authors:')").nextAll("a").map((i, el) => $(el).text().trim()).get().join(', ') || 'Unknown',
            };

            const element = $('.spaceit_pad').filter((_, el) => {
                return $(el).find('span.dark_text').text().trim() === 'Ranked:';
            });
            const rankedText = element.contents().filter((_, el) => el.type === 'text').text().trim();

            const statistics = {
                score: $('span[itemprop="ratingValue"]').text().trim(),
                ranked: rankedText,
                popularity: $('.spaceit_pad:contains("Popularity")').contents().not('span').text().trim(),
                members: $('.spaceit_pad:contains("Members")').contents().not('span').text().trim(),
                favorites: $('.spaceit_pad:contains("Favorites")').contents().not('span').text().trim(),
            };

            const externalLinks = $(".external_urls a").map((i, el) => {
                return {
                    name: $(el).find(".caption").text().trim(),
                    url: $(el).attr("href")
                };
            }).get().filter(link => link.name && link.url);

            return {
                title,
                synopsis,
                background,
                alternativeTitles,
                information,
                statistics,
                externalLinks,
                cover,
                url: url
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    charaDetail = async function(url) {
        try {
            if (!url.includes('myanimelist.net/character')) throw new Error('Invalid MyAnimeList character URL');

            const {
                data
            } = await axios.get(url);
            const $ = cheerio.load(data);

            const name = $('h2.normal_header').first().text().trim();
            const description = $('h2.normal_header').closest('td').clone().children().remove().end().text().trim();
            const cover = $('img.portrait-225x350').attr('data-src') || $('img.portrait-225x350').attr('src');

            const animeography = [];
            $('div.normal_header:contains("Animeography")').next().find('tr').each((i, el) => {
                const animeTitle = $(el).find('td:nth-child(2) a').text().trim();
                const animeLink = $(el).find('td:nth-child(2) a').attr('href');
                if (animeTitle && animeLink) {
                    animeography.push({
                        title: animeTitle,
                        url: animeLink
                    });
                }
            });

            const mangaography = [];
            $('div.normal_header:contains("Mangaography")').next().find('tr').each((i, el) => {
                const mangaTitle = $(el).find('td:nth-child(2) a').text().trim();
                const mangaLink = $(el).find('td:nth-child(2) a').attr('href');
                if (mangaTitle && mangaLink) {
                    mangaography.push({
                        title: mangaTitle,
                        url: mangaLink
                    });
                }
            });

            const voiceActors = [];
            $('div.normal_header:contains("Voice Actors")').next().find('tr').each((i, el) => {
                const vaName = $(el).find('td:nth-child(2) a').text().trim();
                const vaImage = $(el).find('td:nth-child(1) img').attr('data-src') || $(el).find('td:nth-child(1) img').attr('src');
                const vaRole = $(el).find('td:nth-child(3)').text().trim();
                if (vaName && vaImage) {
                    voiceActors.push({
                        name: vaName,
                        role: vaRole,
                        image: vaImage
                    });
                }
            });

            return {
                name,
                description,
                cover,
                animeography,
                mangaography,
                voiceActors,
                url: url
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
}


let handler = async (m, {
    args,
    usedPrefix,
    command
}) => {
    const mal = new MAL();
    const subCommand = args[0] ? args[0].toLowerCase() : '';
    const query = args.slice(1).join(' ');

    const helpMessage = `*MyAnimeList Command Menu*

Usage: ${usedPrefix + command} <subcommand> [query]

*Subcommands:*
- *topanime*: Get the top 10 anime from MAL.
- *animesearch <title>*: Search for an anime.
- *mangasearch <title>*: Search for a manga.
- *charasearch <name>*: Search for a character.
- *seasonalanime <season> <type>*: Get seasonal anime.
  - Seasons: \`fall\`, \`spring\`, \`winter\`, \`summer\`
  - Types: \`tv-new\`, \`tv-continuing\`, \`ona\`, \`ova\`, \`movie\`, \`special\`
- *animedetail <url>*: Get details for an anime from its MAL URL.
- *mangadetail <url>*: Get details for a manga from its MAL URL.
- *charadetail <url>*: Get details for a character from its MAL URL.

*Example:*
${usedPrefix + command} animesearch Naruto
${usedPrefix + command} seasonalanime fall tv-new`;

    if (!subCommand) {
        return m.reply(helpMessage);
    }

    try {
        await m.reply('Fetching data from MyAnimeList...');
        let output = '';

        switch (subCommand) {
            case 'topanime': {
                const results = await mal.topAnime();
                if (!results || results.length === 0) return m.reply('No top anime found.');
                output = results.slice(0, 10).map(anime =>
                    `*${anime.rank}. ${anime.title}*\n` +
                    `Score: ${anime.score}\n` +
                    `Info: ${anime.type} - ${anime.release}\n` +
                    `URL: ${anime.url}`
                ).join('\n\n');
                break;
            }

            case 'animesearch': {
                if (!query) return m.reply(`Please provide an anime title to search.\nExample: ${usedPrefix + command} animesearch Naruto`);
                const results = await mal.animeSearch(query);
                if (!results || results.length === 0) return m.reply(`No results found for "${query}".`);
                output = results.slice(0, 5).map(anime =>
                    `*${anime.title}*\n` +
                    `Type: ${anime.type} (${anime.episodes} eps)\n` +
                    `Score: ${anime.score}\n` +
                    `URL: ${anime.url}`
                ).join('\n\n');
                break;
            }

            case 'mangasearch': {
                if (!query) return m.reply(`Please provide a manga title to search.\nExample: ${usedPrefix + command} mangasearch One Piece`);
                const results = await mal.mangaSearch(query);
                if (!results || results.length === 0) return m.reply(`No results found for "${query}".`);
                output = results.slice(0, 5).map(manga =>
                    `*${manga.title}*\n` +
                    `Type: ${manga.type} (${manga.vol} vol)\n` +
                    `Score: ${manga.score}\n` +
                    `URL: ${manga.url}`
                ).join('\n\n');
                break;
            }

            case 'charasearch': {
                if (!query) return m.reply(`Please provide a character name to search.\nExample: ${usedPrefix + command} charasearch Lelouch`);
                const results = await mal.charaSearch(query);
                if (!results || results.length === 0) return m.reply(`No results found for "${query}".`);
                output = results.slice(0, 5).map(chara =>
                    `*${chara.name}*\n` +
                    `Anime: ${chara.anime.length > 0 ? chara.anime[0].title : 'N/A'}\n` +
                    `Manga: ${chara.manga.length > 0 ? chara.manga[0].title : 'N/A'}\n` +
                    `URL: ${chara.url}`
                ).join('\n\n');
                break;
            }

            case 'seasonalanime': {
                const season = args[1];
                const type = args[2];
                if (!season || !type) return m.reply(`Please provide both a season and a type.\nExample: ${usedPrefix + command} seasonalanime fall tv-new`);
                const results = await mal.seasonalAnime(season, type);
                if (!results || results.length === 0) return m.reply(`No ${type} anime found for ${season} 2024.`);
                output = `*Seasonal Anime - ${season.charAt(0).toUpperCase() + season.slice(1)} 2024 (${results[0].type})*\n\n` +
                    results.slice(0, 5).map(anime =>
                        `*${anime.title}*\n` +
                        `Score: ${anime.stats.score}\n` +
                        `Members: ${anime.stats.members}\n` +
                        `Studio: ${anime.details.studio}\n` +
                        `URL: ${anime.url}`
                    ).join('\n\n');
                break;
            }

            case 'animedetail': {
                if (!query) return m.reply(`Please provide a MyAnimeList anime URL.\nExample: ${usedPrefix + command} animedetail https://myanimelist.net/anime/1/Cowboy_Bebop`);
                const d = await mal.animeDetail(query);
                output = `*${d.title}*\n\n` +
                    `*Score:* ${d.statistics.score} | *Rank:* ${d.statistics.ranked}\n` +
                    `*Popularity:* ${d.statistics.popularity} | *Members:* ${d.statistics.members}\n\n` +
                    `*Type:* ${d.information.type} | *Episodes:* ${d.information.episodes}\n` +
                    `*Status:* ${d.information.status}\n` +
                    `*Aired:* ${d.information.aired}\n` +
                    `*Premiered:* ${d.information.premiered}\n` +
                    `*Studio(s):* ${d.information.studios}\n` +
                    `*Source:* ${d.information.source}\n` +
                    `*Genres:* ${d.information.genres}\n\n` +
                    `*Synopsis:*\n${d.synopsis}\n\n` +
                    `*URL:* ${d.url}`;
                break;
            }

            case 'mangadetail': {
                if (!query) return m.reply(`Please provide a MyAnimeList manga URL.\nExample: ${usedPrefix + command} mangadetail https://myanimelist.net/manga/1/Monster`);
                const d = await mal.mangaDetail(query);
                output = `*${d.title}*\n\n` +
                    `*Score:* ${d.statistics.score} | *Rank:* ${d.statistics.ranked}\n` +
                    `*Popularity:* ${d.statistics.popularity} | *Members:* ${d.statistics.members}\n\n` +
                    `*Type:* ${d.information.type} | *Volumes:* ${d.information.volumes}\n` +
                    `*Status:* ${d.information.status}\n` +
                    `*Published:* ${d.information.published}\n` +
                    `*Authors:* ${d.information.authors}\n` +
                    `*Genres:* ${d.information.genres}\n\n` +
                    `*Synopsis:*\n${d.synopsis}\n\n` +
                    `*URL:* ${d.url}`;
                break;
            }

            case 'charadetail': {
                if (!query) return m.reply(`Please provide a MyAnimeList character URL.\nExample: ${usedPrefix + command} charadetail https://myanimelist.net/character/1/Spike_Spiegel`);
                const d = await mal.charaDetail(query);
                const animeography = d.animeography.slice(0, 3).map(a => a.title).join(', ');
                const mangaography = d.mangaography.slice(0, 3).map(m => m.title).join(', ');
                const va = d.voiceActors.find(v => v.role === 'Main'); // Prioritize main role
                const vaText = va ? `${va.name} (Main)` : (d.voiceActors.length > 0 ? `${d.voiceActors[0].name} (${d.voiceActors[0].role})` : 'N/A');

                output = `*${d.name}*\n\n` +
                    `${d.description.split('.').slice(0, 2).join('.') + '.'}\n\n` +
                    `*Animeography:* ${animeography}...\n` +
                    `*Mangaography:* ${mangaography}...\n` +
                    `*Voice Actor (Japanese):* ${vaText}\n\n` +
                    `*URL:* ${d.url}`;
                break;
            }

            default:
                return m.reply(helpMessage);
        }
        await m.reply(output);
    } catch (error) {
        console.error(error);
        await m.reply(`An error occurred: ${error.message}`);
    }
};

handler.command = ['mal', 'myanimelist'];
handler.help = ['topanime', 'animesearch <query>', 'mangasearch <query>', 'charasearch <query>', 'seasonalanime <season> <type>', 'animedetail <url>', 'mangadetail <url>', 'charadetail <url>'];
handler.tags = 'anime';
handler.description = 'Fetches information from MyAnimeList based on various commands like searching, top anime, seasonal charts, and details.';

module.exports = handler;