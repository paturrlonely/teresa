import axios from "axios"

async function getUpdatedMetadata(conn, id) {
  console.log("[DEBUG] getUpdatedMetadata() called")
  await new Promise(r => setTimeout(r, 250))
  return conn.groupMetadata(id)
}

const WELCOME_GIF = "https://api.deline.web.id/o1SqkpSFLT.mp4"
const LEAVE_GIF   = "https://api.deline.web.id/vnvKHK1EQB.mp4"

export default async function handleGroupParticipants(data, conn, db) {
  console.log("\n===== [GROUP EVENT DEBUG] =====")
  console.log("[DEBUG] Raw Data:", data)

  const { id, participants, action, actor } = data
  console.log("[DEBUG] Group ID:", id)
  console.log("[DEBUG] Action:", action)
  console.log("[DEBUG] Participants:", participants)
  console.log("[DEBUG] Actor:", actor)

  if (!id?.endsWith("@g.us")) {
    console.log("[DEBUG] Not a group, skipped")
    return
  }

  const group = db.get("group", id) || {}
  const isWelcome = group.welcome === true
  const isDetect = group.detect === true

  console.log("[DEBUG] Group Config:", group)
  console.log("[DEBUG] Welcome:", isWelcome, "| Detect:", isDetect)

  if (!isWelcome && !isDetect) {
    console.log("[DEBUG] Welcome & Detect disabled, exit")
    return
  }

  let metadata
  try {
    console.log("[DEBUG] Fetching group metadata...")
    metadata = await conn.groupMetadata(id)

    if (action === "add" || action === "remove") {
      console.log("[DEBUG] Refetch metadata after add/remove")
      metadata = await getUpdatedMetadata(conn, id)
    }
  } catch (e) {
    console.error("[GROUP METADATA ERROR]", e.message)
    return
  }

  const memberCount = metadata.participants.length
  const groupName = metadata.subject || "Grup Ini"
  const groupDesc = metadata.desc || "Tidak ada deskripsi"

  console.log("[DEBUG] Group Name:", groupName)
  console.log("[DEBUG] Member Count:", memberCount)

  const parseText = (text, jid) =>
    text
      .replace(/@user/g, "@" + jid.split("@")[0])
      .replace(/@actor/g, actor ? "@" + actor.split("@")[0] : "")
      .replace(/@group/g, groupName)
      .replace(/@desc/g, groupDesc)
      .replace(/@count/g, memberCount)

  for (const u of participants) {
    const jid = typeof u === "string" ? u : u?.jid || u?.id
    if (!jid) {
      console.log("[DEBUG] Invalid participant:", u)
      continue
    }

    console.log("\n[DEBUG] Processing user:", jid)

    const tag = "@" + jid.split("@")[0]
    let caption = null
    let gifUrl = null

    switch (action) {
      case "add":
        if (isWelcome) {
          caption = group.sWelcome?.trim()
            ? parseText(group.sWelcome, jid)
            : `Selamat datang ${tag}!`
          gifUrl = WELCOME_GIF
        }
        break

      case "remove":
        if (isWelcome) {
          caption = group.sBye?.trim()
            ? parseText(group.sBye, jid)
            : actor === jid
              ? `Selamat tinggal ${tag}!`
              : `${tag} telah keluar dari grup.`
          gifUrl = LEAVE_GIF
        }
        break

      case "promote":
        if (isDetect) {
          caption = group.sPromote?.trim()
            ? parseText(group.sPromote, jid)
            : `${tag} sekarang menjadi admin!`
        }
        break

      case "demote":
        if (isDetect) {
          caption = group.sDemote?.trim()
            ? parseText(group.sDemote, jid)
            : `${tag} tidak lagi menjadi admin.`
        }
        break
    }

    console.log("[DEBUG] Caption:", caption)
    console.log("[DEBUG] GIF URL:", gifUrl)

    if (!caption) {
      console.log("[DEBUG] No caption generated, skipped")
      continue
    }

    try {
      if (gifUrl) {
        console.log("[DEBUG] Sending GIF message...")
        await conn.sendMessage(id, {
          video: { url: gifUrl },
          caption,
          mentions: [jid, actor].filter(Boolean),
          gifPlayback: true
        })
        console.log("[DEBUG] GIF sent successfully")
      } else {
        console.log("[DEBUG] Sending text message...")
        await conn.sendMessage(id, {
          text: caption,
          mentions: [jid, actor].filter(Boolean)
        })
        console.log("[DEBUG] Text sent successfully")
      }
    } catch (err) {
      console.error("[WELCOME GIF ERROR]", err.message)
      await conn.sendMessage(id, {
        text: caption,
        mentions: [jid]
      })
    }
  }

  console.log("===== [GROUP EVENT END] =====\n")
}