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
    esm: "#22c55e",
    ts: "#a855f7",
    cjs: "#3b82f6",
    case: "#f59e0b",
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

function getFiturDetail() {
    const pluginFolder = "./commands"
    let esm = 0
    let ts = 0
    let cjs = 0

    const scan = (dir) => {
        for (const item of fs.readdirSync(dir, {
                withFileTypes: true
            })) {
            const p = path.join(dir, item.name)
            if (item.isDirectory()) scan(p)
            else if (item.isFile()) {
                if (p.endsWith(".js")) esm++
                else if (p.endsWith(".ts")) ts++
                else if (p.endsWith(".cjs")) cjs++
            }
        }
    }

    if (fs.existsSync(pluginFolder)) scan(pluginFolder)

    let legacy = 0
    const caseFile = path.resolve("./case.js")
    if (fs.existsSync(caseFile)) {
        const data = fs.readFileSync(caseFile, "utf-8")
        const match = data.match(/case ['"].+?['"]\s*:/g)
        if (match) legacy = match.length
    }

    return {
        esm,
        ts,
        cjs,
        legacy
    }
}

async function renderStatusBarImage({
    esm,
    ts,
    cjs,
    legacy
}) {
    const total = esm + ts + cjs + legacy || 1
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
    ctx.fillText("Distribusi Fitur Bot", W / 2, 250)

    const barX = 140
    const barW = W - 280
    const barH = 48
    const gap = 130

    const data = [{
            label: "ESM",
            value: esm,
            color: c.esm
        },
        {
            label: "TS",
            value: ts,
            color: c.ts
        },
        {
            label: "CommonJS",
            value: cjs,
            color: c.cjs
        },
        {
            label: "Case",
            value: legacy,
            color: c.case
        },
    ]

    const frames = 30
    for (let f = 0; f <= frames; f++) {
        const t = easeOutCubic(f / frames)
        let y = 360

        for (const d of data) {
            const ratio = d.value / total
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
    ctx.fillText(`Total: ${total} fitur`, W / 2, 880)

    return cvs.toBuffer("image/png")
}

const handler = async (m, {
    conn
}) => {
    const detail = getFiturDetail()
    const image = await renderStatusBarImage(detail)

    const total = detail.esm + detail.ts + detail.cjs + detail.legacy || 1

    const caption =
        `📊 Distribusi Fitur Bot\n\n` +
        `• ESM: ${detail.esm} (${((detail.esm / total) * 100).toFixed(1)}%)\n` +
        `• TS: ${detail.ts} (${((detail.ts / total) * 100).toFixed(1)}%)\n` +
        `• CommonJS: ${detail.cjs} (${((detail.cjs / total) * 100).toFixed(1)}%)\n` +
        `• Case: ${detail.legacy} (${((detail.legacy / total) * 100).toFixed(1)}%)\n\n` +
        `✨ Total: ${total} fitur`

    await conn.sendMessage(m.chat, {
        image,
        caption
    }, {
        quoted: m
    })
}

handler.command = ["totalfitur", "features", "fitur"]
handler.tags = ["info"]
handler.description = "Distribusi fitur bot dengan status bar, persen, animasi, dan background hitam"

export default handler