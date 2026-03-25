import moment from 'moment-timezone'

function wish() {
    const time = moment.tz('Asia/Jakarta').format('HH')
    if (time >= 18) return 'Selamat Malam'
    if (time >= 15) return 'Selamat Sore'
    if (time >= 11) return 'Selamat Siang'
    if (time >= 4) return 'Selamat Pagi'
    return 'Selamat Malam'
}

let handler = async (m, {
    conn,
    usedPrefix,
    command,
    args,
    db
}) => {
    let group = db.get('group', m.chat)
    if (!group) {
        group = {
    antifoto: false,
    antiaudio: false,
    antidelete: false,
    antimedia: false,
    antilink: false,
    antilinkwa: false,
    antipolling: false,
    antisticker: false,
    antitagsw: false,
    antiToxic: false,
    autodownload: false,
    autohd: false,
    autolevelup: false,
    autosticker: false,
    detect: false,
    game: false,
    mute: false,
    nsfw: false,
    rpg: false,
    welcome: false
}
await db.set('group', m.chat, group)
    }

    const isEnable = /true|enable|on|1/i.test(command)
    const type = (args[0] || '').toLowerCase()

    const options = {
    antiaudio: 'antiaudio',
    antifoto: 'antifoto',
    antidelete: 'antidelete',
    antimedia: 'antimedia',
    antilink: 'antilink',
    antilinkwa: 'antilinkwa',
    antipolling: 'antipolling',
    antisticker: 'antiSticker',
    antitagsw: 'antitagsw',
    antiToxic: 'antiToxic',
    autodownload: 'autodownload',
    autohd: 'autohd',
    autolevelup: 'autolevelup',
    autosticker: 'autosticker',
    detect: 'detect',
    game: 'game',
    mute: 'mute',
    nsfw: 'nsfw',
    rpg: 'rpg',
    welcome: 'welcome'
}

    if (!options[type]) {
        const menu = Object.keys(options)
            .sort()
            .map(k => `◦❒ ${k} ${group[options[k]] ? '(🟢 ON)' : '(🔴 OFF)'}`)
            .join('\n')

        return m.reply(`
◦❒ SETTINGS GRUP
◦❒ ${wish()}

${menu}

◦❒ Contoh penggunaan:
◦❒ ${usedPrefix}enable mute
◦❒ ${usedPrefix}disable antisticker
`.trim())
    }

    group[options[type]] = isEnable
    await db.set('group', m.chat, group)

    m.reply(
        `◦❒ ${type.toUpperCase()} berhasil diubah\n` +
        `◦❒ Status : ${isEnable ? 'ON 🟢' : 'OFF 🔴'}`
    )
}

handler.help = ['enable', 'disable']
handler.tags = ['tools']
handler.command = /^((en|dis)able|setting|settings|(tru|fals)e|(turn)?o(n|ff)|[01])$/i

handler.group = true
handler.admin = true

export default handler