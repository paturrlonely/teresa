export async function all(m, conn, cmd) {
    if (m.isBaileys) return
    if (!m.message) return

    const msg =
        m.message.buttonsResponseMessage ||
        m.message.templateButtonReplyMessage ||
        m.message.listResponseMessage ||
        m.message.interactiveResponseMessage

    if (!msg) return

    let id, text

    // Button / List lama
    if (
        msg.selectedButtonId ||
        msg.selectedId ||
        msg.singleSelectReply
    ) {
        id =
            msg.selectedButtonId ||
            msg.selectedId ||
            msg.singleSelectReply?.selectedRowId

        text =
            msg.selectedDisplayText ||
            msg.title
    }

    // Native Flow (WA terbaru)
    if (msg.nativeFlowResponseMessage) {
        try {
            const params = JSON.parse(
                msg.nativeFlowResponseMessage.paramsJson || "{}"
            )

            id =
                params.id ||
                params.command ||
                params.buttonId ||
                params.payload

            text =
                params.text ||
                params.title ||
                params.label
        } catch (e) {
            return
        }
    }

    if (!id && !text) return

    let isCommand = false

    for (const plugin of Object.values(cmd.plugins)) {
        if (!plugin?.command) continue

        const prefix = plugin.customPrefix || conn.prefix || "."
        if (!id?.startsWith(prefix)) continue

        const command = id
            .slice(prefix.length)
            .split(" ")[0]
            .toLowerCase()

        const matched =
            plugin.command instanceof RegExp
                ? plugin.command.test(command)
                : Array.isArray(plugin.command)
                ? plugin.command.includes(command)
                : plugin.command === command

        if (matched) {
            isCommand = true
            break
        }
    }

    const finalText = isCommand ? id : text
    if (!finalText) return

    m.text = finalText
    m.body = finalText
    m.message = { conversation: finalText }
    m.mtype = "conversation"
    m.isButton = true

    return
}