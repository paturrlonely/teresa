import {
  jidDecode
} from "baileys";
import "./settings.js";
import util from "util";
import Func from "./core/function.js";
import caseHandler from "./case.js";
import { all as buttonHandler } from './commands/_/_templateResponse.js'
const decodeJid = (jid) => {
  if (!jid) return jid;
  try {
    const decode = jidDecode(jid);
    return decode?.user && decode?.server ? decode.user + "@" + decode.server : jid;
  } catch {
    return jid;
  }
};


const normalize = jid => (decodeJid(jid) || "").split("@")[0];

function escapeRegExp(string) {
  return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, "\\$&");
}

export default async (m, conn, store, db, cmd) => {

  await db.main(m);
  await buttonHandler(m,  conn, cmd)
m.chat = m.chat || m.key?.remoteJid || m.from;

m.reply = async function (teks) {
  const botJid = conn.user?.id || conn.user?.jid;

const ppUser = await conn
    .profilePictureUrl(m.sender, 'image')
    .catch(() => global.thumb);

  const ppBot = await conn
    .profilePictureUrl(botJid, 'image')
    .catch(() => global.thumb);

  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${global.botname}
TEL;type=CELL;type=VOICE;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}
END:VCARD`;

  const q = {
    key: {
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
    },
    message: {
      contactMessage: {
        displayName: global.botname,
        vcard,
      },
    },
  };

  return conn.sendMessage(
    m.chat,
    {
      text: teks,
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          title: `© ${global.botname}`,
          body: `${global.footer}`,
          thumbnailUrl: ppBot,
          sourceUrl: global.website,
          renderLargerThumbnail: false,
        },
      },
    },
    { quoted: q }
  );
};
  const user = db.get("user", m.jid) || {};
  const group = db.get("group", m.from) || {};
  const settings = db.list().settings || {};

const fixJid = (jid) => {
  if (!jid) return jid;

  if (jid.includes("@")) return jid;

  jid = jid.replace(/[^0-9]/g, "");
  return jid + "@s.whatsapp.net";
};

const sender = fixJid(decodeJid(m.sender || m.jid));

const ownerLocal = (global.owner || [])
  .map(j => {
    let jid = Array.isArray(j) ? j[0] : j;
    if (!jid) return null;
    return fixJid(decodeJid(jid));
  })
  .filter(Boolean);

const ownerDB = (db.list().owner || [])
  .map(j => {
    if (!j) return null;
    return fixJid(decodeJid(j));
  })
  .filter(Boolean);

const botJid = fixJid(decodeJid(conn.user.id));

const isOwner = [...ownerLocal, ...ownerDB, botJid].includes(sender);

  const isPremium =
  user.premium?.status ||
  group?.premium?.status ||
  isOwner;
const groupMetadata = m.isGroup && m.metadata ? m.metadata : {};

const normalizeJid = (jid) => {
  if (!jid) return null;
  try {
    return decodeJid(jid).split("@")[0];
  } catch {
    return String(jid).split("@")[0];
  }
};

const senderNorm = normalizeJid(sender);
const botNorm = normalizeJid(botJid);

const isAdmin =
  m.isGroup && Array.isArray(groupMetadata.participants)
    ? groupMetadata.participants.some(p => {
        const pid = normalizeJid(p.jid || p.id || p.lid);
        return (
          pid === senderNorm &&
          (p.admin === "admin" || p.admin === "superadmin")
        );
      })
    : false;


let isBotAdmin = false;

if (m.isGroup && Array.isArray(groupMetadata.participants)) {

  if (typeof m.isBotAdmin === "boolean") {
    isBotAdmin = m.isBotAdmin;
  }

  if (!isBotAdmin) {
    const owners = [
      groupMetadata.owner,
      groupMetadata.subjectOwner,
      groupMetadata.ownerPn
    ]
      .filter(Boolean)
      .map(normalizeJid);

    if (owners.includes(botNorm)) {
      isBotAdmin = true;
    }
  }

  if (!isBotAdmin) {
    isBotAdmin = groupMetadata.participants.some(p => {
      const pid = normalizeJid(p.jid || p.id || p.lid);
      return (
        pid === botNorm &&
        (p.admin === "admin" || p.admin === "superadmin")
      );
    });
  }
}
for (let handler of Object.values(cmd.plugins)) {
  if (typeof handler.before === 'function') {
    const allow = await handler.before(m, {
      conn,
      db,
      isAdmin,
      isBotAdmin,
      user,
      group
    })
    if (allow === false) return
  }
}

if (
  m?.mtype === 'stickerMessage' ||
  m?.type === 'stickerMessage' ||
  m?.message?.stickerMessage
) {
  const sha =
    m.fileSha256 ||
    m.fileEncSha256 ||
    m.message?.stickerMessage?.fileSha256 ||
    m.message?.stickerMessage?.fileEncSha256;

  if (!sha) return;

  const hash = Buffer.from(sha).toString('base64');
  const users = db.list()?.user || {};

  let found = false;

  for (const jid in users) {
    const sticker = users[jid]?.sticker;
    if (!sticker) continue;

    if (sticker[hash]) {
      found = true;
      const cmdData = sticker[hash];

      if (cmdData.locked && cmdData.creator !== m.sender) return;

      const prefix = users[jid]?.customPrefix || '.';
      m.text = prefix + cmdData.text;
      break;
    }
  }
}
  let customPrefix = null;
  if (user.customPrefix) {
    customPrefix = user.customPrefix;
  } else if (m.isGroup && group.customPrefix) {
    customPrefix = group.customPrefix;
  }

  const prefix = customPrefix ?
    (m.text.startsWith(customPrefix) ? customPrefix :
      (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text) ?
        m.text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)[0] :
        null)) :
    (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text) ?
      m.text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)[0] :
      null);

  const command = m.text && prefix ?
    m.text.replace(prefix, "").trim().split(/ +/).shift().toLowerCase() :
    "";

  const text = m.text && prefix ?
    m.text.replace(new RegExp("^" + escapeRegExp(prefix + command), "i"), "").trim() :
    "";

  const args = text.split(/ +/).filter(a => a);

  if (settings.self && !isOwner) return;

  if (settings.gconly && !m.isGroup && !isOwner) return;

if (m.isGroup && db.getBanchat(m.from) && !isOwner) return;
  if (settings.online) {
    conn.readMessages([m.key]);
  }

  if (m.quoted && m.sender) {
    const sessionKey = `${m.from}:${m.sender}`;
    const session = global.interactiveSessions.get(sessionKey);

    if (session && session.messageId === m.quoted.id) {
      try {
        await session.callback(m);
        global.interactiveSessions.delete(sessionKey);
      } catch (e) {
        m.reply("Terjadi kesalahan saat memproses balasan Anda.");
        console.error("Interactive Session Error:", e);
      }
      return;
    }
  }

  await caseHandler(m, {
    conn,
    isOwner,
    isPremium,
    isAdmin,
    isBotAdmin,
    prefix,
    args,
    command,
    text,
    user,
    db,
    Func,
    cmd
  });

  // Check for customPrefix commands (no prefix needed)
  for (let handler of Object.values(cmd.plugins)) {
    if (typeof handler !== 'function' && typeof handler !== 'object') continue;

    // Check if handler has customPrefix
    if (handler.customPrefix instanceof RegExp) {
      const match = m.text?.match(handler.customPrefix);
      
      if (match) {
        try {
          // Same validation as normal commands
          if (handler.owner && !isOwner) {
            m.reply("Perintah ini hanya untuk Owner Bot.");
            continue;
          }
          if (handler.premium && !isPremium) {
            m.reply("Perintah ini hanya untuk pengguna Premium.");
            continue;
          }
          if (handler.group && !m.isGroup) {
            m.reply("Perintah ini hanya untuk di grup.");
            continue;
          }
          if (handler.admin && !isAdmin) {
            m.reply("Perintah ini hanya untuk admin grup.");
            continue;
          }
          if (handler.botAdmin && !isBotAdmin) {
            m.reply("Bot harus admin untuk menjalankan perintah ini.");
            continue;
          }
          if (handler.nsfw && m.isGroup) {
            const group = db.get("group", m.chat);
            if (!group || !group.nsfw) {
              m.reply("🚫 Admin menonaktifkan fitur *Nsfw* di group ini!");
              continue;
            }
          }
          if (handler.game && m.isGroup) {
            const group = db.get("group", m.chat);
            if (!group || !group.game) {
              m.reply("🚫 Admin menonaktifkan fitur *Game* di group ini!");
              continue;
            }
          }
          if (handler.rpg && m.isGroup) {
            const group = db.get("group", m.chat);
            if (!group || !group.rpg) {
              m.reply("🚫 Admin menonaktifkan fitur *Rpg* di group ini!");
              continue;
            }
          }
          if (handler.register && !user.register) {
            m.reply("Anda harus daftar dulu.\nKetik: .daftar");
            continue;
          }
          if (handler.limit && !isOwner && !isPremium) {
            const limitAmount = typeof handler.limit === 'number' ? handler.limit : 1;
            const limit = Func.useLimit(user, limitAmount);
            if (!limit.success) {
              m.reply(`Limit Anda tidak cukup.\nSisa limit: ${limit.remaining}`);
              continue;
            }
          }

          // Execute the handler
          await handler(m, {
            conn,
            text: m.text.replace(handler.customPrefix, "").trim(),
            args: m.text.replace(handler.customPrefix, "").trim().split(/ +/).filter(a => a),
            isOwner,
            isPremium,
            isAdmin,
            isBotAdmin,
            user,
            group,
            settings,
            db,
            Func,
            store,
            cmd,
            usedPrefix: "",
            command: match[0]
          });

          return; // Stop processing after executing customPrefix command

        } catch (e) {
          console.error(`Error pada customPrefix command '${match[0]}':`, e);
          const errorMessage = `*[ ERROR REPORT ]*\n\n*Command:* ${match[0]}\n*User:* ${m.name} (${m.sender})\n*Error:* \n\`\`\`${util.format(e)}\`\`\``;
          for (let ownerJid of [...ownerLocal, ...ownerDB]) {
            conn.sendMessage(ownerJid, { text: errorMessage });
          }
          m.reply("Kesalahan terjadi. Laporan dikirim ke owner.");
        }
      }
    }
  }

  if (!command) return;

  for (let handler of Object.values(cmd.plugins)) {
    if (typeof handler !== 'function' && typeof handler !== 'object') continue;

    if (typeof handler.onMessage === 'function') {
      await handler.onMessage(m, {
        conn,
        text,
        args,
        isOwner,
        isPremium,
        isAdmin,
        isBotAdmin,
        user,
        group,
        settings,
        db,
        Func
      });
    }

    let isCmd = false;

    if (handler.command) {

      if (handler.command instanceof RegExp) {
        isCmd = handler.command.test(command);

      } else if (Array.isArray(handler.command)) {
        for (let c of handler.command) {
          if (c instanceof RegExp && c.test(command)) {
            isCmd = true;
            break;
          }
          if (typeof c === "string" && c.toLowerCase() === command.toLowerCase()) {
            isCmd = true;
            break;
          }
        }

      } else if (typeof handler.command === "string") {
        isCmd = handler.command.toLowerCase() === command.toLowerCase();
      }
    }

    if (!isCmd) continue;

    try {
      if (handler.owner && !isOwner) {
        m.reply("Perintah ini hanya untuk Owner Bot.");
        continue;
      }
      if (handler.premium && !isPremium) {
        m.reply("Perintah ini hanya untuk pengguna Premium.");
        continue;
      }
      if (handler.group && !m.isGroup) {
        m.reply("Perintah ini hanya untuk di grup.");
        continue;
      }
      if (handler.admin && !isAdmin) {
        m.reply("Perintah ini hanya untuk admin grup.");
        continue;
      }
      if (handler.botAdmin && !isBotAdmin) {
        m.reply("Bot harus admin untuk menjalankan perintah ini.");
        continue;
      }
      if (handler.nsfw && m.isGroup) {
    const group = db.get("group", m.chat)

    if (!group || !group.nsfw) {
        m.reply("🚫 Admin menonaktifkan fitur *Nsfw* di group ini!")
        continue
    }
}
if (handler.game && m.isGroup) {
    const group = db.get("group", m.chat)

    if (!group || !group.game) {
        m.reply("🚫 Admin menonaktifkan fitur *Game* di group ini!")
        continue
    }
}
if (handler.rpg && m.isGroup) {
    const group = db.get("group", m.chat)

    if (!group || !group.rpg) {
        m.reply("🚫 Admin menonaktifkan fitur *Rpg* di group ini!")
        continue
    }
}
      if (handler.register && !user.register) {
        m.reply("Anda harus daftar dulu.\nKetik: .daftar");
        continue;
      }

      if (handler.limit && !isOwner && !isPremium) {
  const limitAmount = typeof handler.limit === 'number' ? handler.limit : 1;
  const limit = Func.useLimit(user, limitAmount);

  if (!limit.success) {
    m.reply(`Limit Anda tidak cukup.\nSisa limit: ${limit.remaining}`);
    continue;
  }
}

      await handler(m, {
        conn,
        text,
        args,
        isOwner,
        isPremium,
        isAdmin,
        isBotAdmin,
        user,
        group,
        settings,
        db,
        Func,
        store,
        cmd,
        usedPrefix: prefix,
        command
      });

      break;

}  catch (e) {
      console.error(`Error pada command '${command}':`, e);

      const errorMessage = `*[ ERROR REPORT ]*\n\n*Command:* ${command}\n*User:* ${m.name} (${m.sender})\n*Error:* \n\`\`\`${util.format(e)}\`\`\``;

      for (let ownerJid of [...ownerLocal, ...ownerDB]) {
        conn.sendMessage(ownerJid, {
          text: errorMessage
        });
      }

      m.reply("Kesalahan terjadi. Laporan dikirim ke owner.");
    }
  }
};