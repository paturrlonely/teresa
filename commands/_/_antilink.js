const allLinkRegex =
  /((https?:\/\/)?(www\.)?([a-z0-9-]+\.)+[a-z]{2,})(\/\S*)?/i

const gclinkRegex = /chat\.whatsapp\.com\/(?:invite\/)?[0-9A-Za-z]{20,24}/i
const walinkRegex = /wa\.me\/\d+/i
const waChannelRegex = /whatsapp\.com\/channel\/[0-9A-Za-z]+/i

export async function before(m, { isAdmin, isBotAdmin, db, conn }) {
  if (m.isBaileys || m.fromMe) return true
  if (!m.isGroup || !m.text) return true

  const group = db.get('group', m.chat) || {}

  const isAnyLink = allLinkRegex.test(m.text)
  const isGroupLink = gclinkRegex.test(m.text)
  const isWaLink = walinkRegex.test(m.text)
  const isWaChannel = waChannelRegex.test(m.text)

  const deleteMsg = async () => {
    if (!isBotAdmin) return
    await conn.sendMessage(m.chat, { delete: m.key })
  }

  if (group.antilink && isAnyLink && !isAdmin) {
    await deleteMsg()
    return false
  }

  if (
    group.antilinkwa &&
    (isGroupLink || isWaLink || isWaChannel) &&
    !isAdmin
  ) {
    await deleteMsg()
    return false
  }

  return true
}