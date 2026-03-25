import chalk from "chalk"

let dailyTaskInterval = null

export default function setupDailyTasks({ conn, db } = {}) {
  if (!conn || !db) {
    console.error(chalk.red("[TASK] setupDailyTasks dipanggil tanpa conn/db"))
    return
  }

  if (dailyTaskInterval) {
    console.log(chalk.yellow("[TASK] Daily task sudah berjalan, skip init."))
    return
  }

  const ONE_DAY = 24 * 60 * 60 * 1000

  dailyTaskInterval = setInterval(async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const now = Date.now()

      const data = db.list() || {}
      const settings = data.settings ||= {}
      const users = data.user ||= {}
      const groups = data.group ||= {}

      let needSave = false

      // RESET LIMIT HARIAN
      if (settings.lastReset !== today) {
        console.log(chalk.cyan("[TASK] Reset limit harian..."))

        const limit = global.defaultLimit ?? 10
        for (const jid in users) {
          users[jid].limit = limit
        }

        settings.lastReset = today
        needSave = true
        console.log(chalk.green("[TASK] Reset limit selesai"))
      }

      // USER PREMIUM EXPIRED
      for (const jid in users) {
        const user = users[jid]

        if (user?.premium?.status && user.premium.expired < now) {
          user.premium.status = false
          user.premium.expired = 0
          needSave = true

          //await conn.sendMessage(jid, {
            //text: "Masa premium Anda telah berakhir."
          //}).catch(() => {})

          console.log(chalk.yellow(`[TASK] Premium user habis: ${jid}`))
        }
      }

      // GROUP PREMIUM & SEWA
      for (const gid in groups) {
        const group = groups[gid]

        group.premium ||= { status: false, expired: 0 }
        group.sewa ||= { status: false, expired: 0, warned: false }

        // PREMIUM GROUP EXPIRED
        if (group.premium.status && group.premium.expired < now) {
          group.premium.status = false
          group.premium.expired = 0
          needSave = true

          await conn.sendMessage(gid, {
            text: "Masa premium grup ini telah berakhir."
          }).catch(() => {})

          console.log(chalk.yellow(`[TASK] Premium grup habis: ${gid}`))
        }

        // WARNING H-1 SEWA
        if (
          group.sewa.status &&
          !group.sewa.warned &&
          group.sewa.expired > now &&
          group.sewa.expired - now <= ONE_DAY
        ) {
          group.sewa.warned = true
          needSave = true

          await conn.sendMessage(gid, {
            text:
              "⚠️ *Peringatan Sewa Grup*\n\n" +
              "Sewa bot akan berakhir dalam *24 jam*.\n" +
              "Silakan perpanjang agar bot tetap aktif."
          }).catch(() => {})

          console.log(chalk.yellow(`[TASK] Warning H-1 sewa: ${gid}`))
        }

        // SEWA HABIS → AUTO KELUAR
        if (group.sewa.status && group.sewa.expired < now) {
          group.sewa.status = false
          group.sewa.expired = 0
          group.sewa.warned = false
          needSave = true

          await conn.sendMessage(gid, {
            text:
              "⏰ *Masa sewa bot telah berakhir.*\n" +
              "Bot akan keluar dari grup.\n\n" +
              "Silakan sewa kembali untuk menggunakan bot."
          }).catch(() => {})

          console.log(chalk.red(`[TASK] Sewa habis, keluar grup: ${gid}`))

          setTimeout(async () => {
            try {
              await conn.groupLeave(gid)
              console.log(chalk.red(`[TASK] Berhasil keluar grup: ${gid}`))
            } catch (e) {
              console.error(chalk.red(`[TASK] Gagal keluar grup: ${gid}`), e)
            }
          }, 5000)
        }
      }

      if (needSave) await db.save()

    } catch (err) {
      console.error(chalk.red("[TASK] Error interval:"), err)
    }
  }, 5 * 60 * 1000)

  console.log(chalk.green("[TASK] Daily task scheduler aktif."))
}