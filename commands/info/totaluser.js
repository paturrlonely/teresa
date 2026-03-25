import fs from "fs"
import path from "path"
import {
    createCanvas,
    GlobalFonts
} from "@napi-rs/canvas"
import {
    join
} from "path"

GlobalFonts.registerFromPath(
    join(process.cwd(), "library", "Cobbler-SemiBold.ttf"),
    "Cobbler"
)

const c = {
    bg: "#000000",
    panel: "#111111",
    barBg: "#1f1f1f",
    reg: "#22c55e",
    unreg: "#ef4444",
    total: "#3b82f6",
    title: "#ffffff",
    sub: "#9ca3af",
}

function round(ctx, x, y, w, h, r = 16) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
}

async function renderUserStatImage({
    total,
    registered,
    unregistered
}) {
    const sum = total || 1
    const W = 1080
    const H = 1080
    const cvs = createCanvas(W, H)
    const ctx = cvs.getContext("2d")

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    ctx.fillStyle = c.bg
    ctx.fillRect(0, 0, W, H)

    round(ctx, 60, 160, W - 120, 760, 32)
    ctx.fillStyle = c.panel
    ctx.fill()

    ctx.fillStyle = c.title
    ctx.font = "bold 52px Cobbler"
    ctx.textAlign = "center"
    ctx.fillText("Statistik User Bot", W / 2, 250)

    const barX = 140
    const barW = W - 280
    const barH = 48
    const gap = 130

    const data = [{
            label: "TOTAL USER",
            value: total,
            color: c.total
        },
        {
            label: "REGISTERED",
            value: registered,
            color: c.reg
        },
        {
            label: "UNREGISTERED",
            value: unregistered,
            color: c.unreg
        },
    ]

    const frames = 30

    for (let f = 0; f <= frames; f++) {
        const t = easeOutCubic(f / frames)
        let y = 360

        for (const d of data) {
            const ratio = d.value / sum
            const w = barW * ratio * t
            const percent = ((ratio * 100) || 0).toFixed(1)

            ctx.fillStyle = c.barBg
            round(ctx, barX, y, barW, barH)
            ctx.fill()

            ctx.fillStyle = d.color
            round(ctx, barX, y, w, barH)
            ctx.fill()

            ctx.fillStyle = c.title
            ctx.font = "bold 30px Cobbler"
            ctx.textAlign = "left"
            ctx.fillText(d.label, barX, y - 16)

            ctx.textAlign = "right"
            ctx.fillText(`${d.value}  ${percent}%`, barX + barW, y - 16)

            y += gap
        }
    }

    ctx.fillStyle = c.sub
    ctx.font = "24px Cobbler"
    ctx.textAlign = "center"
    ctx.fillText(`Total: ${total} user`, W / 2, 880)

    return cvs.toBuffer("image/png")
}

const handler = async (m, {
    conn,
    db
}) => {
    const data = db.list()
    const users = data.user || {}

    const waUsers = Object.entries(users)
        .filter(([jid]) => jid.endsWith("@s.whatsapp.net"))
        .map(([, u]) => u)

    const total = waUsers.length
    const registered = waUsers.filter(u => u?.register === true).length
    const unregistered = total - registered

    const image = await renderUserStatImage({
        total,
        registered,
        unregistered,
    })

    const caption =
        `📊 *Statistik User Bot*\n\n` +
        `• Total User: *${total}*\n` +
        `• Registered: *${registered}*\n` +
        `• Unregistered: *${unregistered}*`

    await conn.sendMessage(
        m.chat, {
            image,
            caption
        }, {
            quoted: m
        }
    )
}

handler.command = ["database", "totaluser"]
handler.tags = ["info"]
handler.description = "Statistik user bot dalam bentuk grafik canvas"

export default handler