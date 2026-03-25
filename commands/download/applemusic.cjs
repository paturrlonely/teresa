const axios = require("axios");
const cheerio = require("cheerio");

const cookieString =
  "_ga=GA1.1.206983766.1756790346; PHPSESSID=jomn6brkleb5969a3opposidru; quality=m4a; dcount=2; _ga_382FSD5=GS2.1.s1756858170$o3$g1$t1756858172$j58$l0$h0";

const axiosInstance = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Cookie: cookieString,
  },
});

async function applemusicSearch(query) {
  try {
    const url = `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`;
    const { data } = await axiosInstance.get(url, { timeout: 15000 });
    const $ = cheerio.load(data);
    const results = [];
    $(".top-search-lockup").each((_, el) => {
      const title = $(el).find(".top-search-lockup__primary__title").text().trim();
      const artist = $(el).find(".top-search-lockup__secondary").text().trim();
      const link = $(el).find(".click-action").attr("href");
      const image = $(el).find("picture source").attr("srcset")?.split(" ")[0];
      if (title && artist && link) {
        results.push({
          title,
          artist,
          link: link.startsWith("http") ? link : `https://music.apple.com${link}`,
          image: image || null,
        });
      }
    });
    return { status: true, songs: results };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

function encodeDownloadUrl(url) {
  return url ? url.replace(/ /g, "%20") : url;
}

function detectUrlType(url) {
  if (!url) return null;
  if (url.includes("/song/")) return "song";
  if (url.includes("/album/") && url.includes("?i=")) return "song";
  if (url.includes("/album/") && !url.includes("?i=")) return "album";
  return "song";
}

async function downloadSong(url) {
  try {
    await axiosInstance.get("https://aaplmusicdownloader.com/ifCaptcha.php");
    const endpoint = url.includes("/song/")
      ? "https://aaplmusicdownloader.com/api/song_url.php"
      : "https://aaplmusicdownloader.com/api/applesearch.php";

    const searchResponse = await axiosInstance.get(`${endpoint}?url=${encodeURIComponent(url)}`, {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://aaplmusicdownloader.com/",
      },
    });

    const searchData = searchResponse.data || {};
    if (!searchData.name) return { status: false, error: "Data lagu tidak ditemukan." };

    const formData = `song_name=${encodeURIComponent(searchData.name)}&artist_name=${encodeURIComponent(searchData.artist || "Unknown Artist")}&url=${encodeURIComponent(url)}&token=none&zip_download=false&quality=m4a`;

    const downloadResponse = await axiosInstance.post(
      "https://aaplmusicdownloader.com/api/composer/swd.php",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://aaplmusicdownloader.com/song.php",
        },
      }
    );

    const downloadData = downloadResponse.data || {};

    return {
      status: true,
      result: {
        title: searchData.name,
        artist: searchData.artist || null,
        album: searchData.albumname || null,
        cover: searchData.thumb || null,
        duration: searchData.duration || null,
        download_url: encodeDownloadUrl(downloadData.dlink || downloadData.wmcode),
      },
    };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

async function fetchAppleMusic(url) {
  const type = detectUrlType(url);
  if (!type) return { status: false, error: "URL tidak valid atau tidak dikenali." };
  return type === "album" ? { status: false, error: "Album download belum didukung" } : downloadSong(url);
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text) {
      return m.reply(`❌ Format salah!\n📌 Gunakan: ${usedPrefix}${command} <query|url>`);
    }

    if (text.includes("music.apple.com")) {
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const down = await fetchAppleMusic(text);
      if (!down.status) return await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });

      const res = down.result;
      const audioData = await axios.get(res.download_url, { responseType: "arraybuffer" });

      return conn.sendMessage(
        m.chat,
        {
          audio: Buffer.from(audioData.data),
          mimetype: "audio/mpeg",
          fileName: res.title + ".mp3",
          contextInfo: {
            externalAdReply: {
              title: res.title,
              body: res.artist,
              thumbnailUrl: res.cover,
              mediaType: 1,
              renderLargerThumbnail: true,
              sourceUrl: text,
            },
          },
        },
        { quoted: m }
      );
    }

    await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } });
    const search = await applemusicSearch(text);
    if (!search.status || !search.songs?.length) return await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });

    const first = search.songs[0];
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
    const down = await downloadSong(first.link);
    if (!down.status) return await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });

    const res = down.result;
    const audioData = await axios.get(res.download_url, { responseType: "arraybuffer" });

    return conn.sendMessage(
      m.chat,
      {
        audio: Buffer.from(audioData.data),
        mimetype: "audio/mpeg",
        fileName: res.title + ".mp3",
        contextInfo: {
          externalAdReply: {
            title: res.title,
            body: res.artist,
            thumbnailUrl: res.cover,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: first.link,
          },
        },
      },
      { quoted: m }
    );
  } finally {
    await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
  }
};

handler.command = ["applemusic", "amusic"];
handler.help = ["applemusic <query|url>"];
handler.tags = ["downloader"];
handler.limit = true;
handler.register = true;

module.exports = handler;