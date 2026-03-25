const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const os = require("os");

const fdroid = {
  search: async (query) => {
    try {
      const res = await axios.get(
        "https://search.f-droid.org/?q=" + encodeURIComponent(query) + "&lang=id"
      );
      const $ = cheerio.load(res.data);
      const apps = [];

      $("a.package-header").each((i, el) => {
        const appName = $(el).find("h4.package-name").text().trim();
        const appDesc = $(el).find("span.package-summary").text().trim();
        const appLink = $(el).attr("href");
        const appIcon = $(el).find("img.package-icon").attr("src");
        const appLicense = $(el).find("span.package-license").text().trim();

        apps.push({
          name: appName,
          description: appDesc,
          link: appLink,
          icon: appIcon,
          license: appLicense,
        });
      });

      return apps;
    } catch (err) {
      console.error("Error fdroid.search:", err.message);
      return [];
    }
  },

  detail: async (url) => {
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);
      const versionElement = $("li.package-version#latest");
      const versionText = versionElement.find(".package-version-header").text().trim();
      const versionMatch = versionText.match(/Versi\s+([\d.]+)/);

      return {
        name: $("h3.package-header__title").text().trim() || "F-Droid App",
        version: versionMatch
          ? versionMatch[1]
          : versionText.replace(/[^0-9.]/g, "").split(/\s+/)[0],
        addedOn: versionElement.find(".package-version-header").text().match(/Ditambahkan pada (.+)/)?.[1]?.trim() || "-",
        requirement: versionElement.find(".package-version-requirement").text().trim() || "-",
        sourceLink: versionElement.find(".package-version-source a").attr("href") || "-",
        permissions: versionElement.find(".package-version-permissions .no-permissions").text().trim() || "Permissions not listed",
        downloadLink: versionElement.find(".package-version-download a").attr("href") || "-",
        apkSize: versionElement
          .find(".package-version-download")
          .contents()
          .filter(function () { return this.nodeType === 3; })
          .text()
          .trim()
          .split("|")[0]
          .trim() || "-",
        icon: $("img.package-header__icon").attr("src") || null,
      };
    } catch (err) {
      console.error("Error fdroid.detail:", err.message);
      return null;
    }
  }
};

let handler = async (m, { args, conn }) => {
  const sub = (args[0] || "").toLowerCase();

  switch (sub) {
    case "search": {
      const query = args.slice(1).join(" ").trim();
      if (!query) return m.reply("Masukkan kata kunci pencarian.\nContoh: .fdroid search telegram");

      const results = await fdroid.search(query);
      if (!results.length) return m.reply("Tidak ditemukan.");

      const rows = results.slice(0, 10).map(app => ({
        header: app.license || "F-Droid App",
        title: app.name,
        description: app.description,
        id: `.fdroid detail ${app.link}`
      }));

      await conn.sendMessage(m.chat, {
        text: `Hasil pencarian untuk *${query}*`,
        footer: "Klik aplikasi untuk detail",
        buttons: [{
          buttonId: "action",
          buttonText: { displayText: "Pilih Aplikasi" },
          type: 4,
          nativeFlowInfo: {
            name: "single_select",
            paramsJson: JSON.stringify({
              title: "Daftar Aplikasi",
              sections: [{ title: "Top Apps", highlight_label: "Top", rows }]
            })
          }
        }],
        headerType: 1
      }, { quoted: m });

      break;
    }

    case "detail": {
      const url = args.slice(1).join(" ").trim();
      if (!url.startsWith("http")) return m.reply("Masukkan link F-Droid yang valid.");

      const data = await fdroid.detail(url);
      if (!data || data.downloadLink === "-") return m.reply("Gagal mengambil APK.");

      // Teks detail
      let teks = `*${data.name}*\n\n`;
      teks += `*Versi:* ${data.version}\n`;
      teks += `*Ditambahkan pada:* ${data.addedOn}\n`;
      teks += `*Requirement:* ${data.requirement}\n`;
      teks += `*Source:* ${data.sourceLink}\n`;
      teks += `*Permissions:* ${data.permissions}\n`;
      teks += `*Download Link:* ${data.downloadLink}\n`;
      teks += `*APK Size:* ${data.apkSize}\n`;

      await conn.sendMessage(m.chat, { text: teks, image: data.icon ? { url: data.icon } : undefined }, { quoted: m });

      // Download APK ke folder sementara
      const cleanName = data.name.replace(/[^a-zA-Z0-9]/g, "_");
      const apkPath = path.join(os.tmpdir(), `${cleanName}_${data.version}.apk`);
      const writer = fs.createWriteStream(apkPath);
      const response = await axios.get(data.downloadLink, { responseType: "stream" });
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Kirim APK
      await conn.sendMessage(
        m.chat,
        {
          document: fs.createReadStream(apkPath),
          mimetype: "application/vnd.android.package-archive",
          fileName: `${cleanName}_${data.version}.apk`
        },
        { quoted: m }
      );

      // Hapus file sementara
      fs.unlink(apkPath, () => {});
      break;
    }

    default:
      return m.reply("Command tidak dikenali.\n.fdroid search <kata kunci>\n.fdroid detail <link aplikasi>");
  }
};

handler.command = /^(fdroid)$/i;
handler.help = ["fdroid search <kata kunci>", "fdroid detail <link aplikasi>"];
handler.tags = ["internet"];
handler.limit = true;

module.exports = handler;