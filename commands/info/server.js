import {
    createCanvas
} from "@napi-rs/canvas";
import axios from "axios";
import os from "os";

const WIDTH = 1200;
const HEIGHT = 700;
const PADDING = 42;

const COLORS = {
    bgDark: "#010409",
    bgMid: "#0b1117",
    bgLight: "#0d1117",
    panelSurface: "rgba(22, 27, 34, 0.92)",
    panelBorder: "rgba(48, 54, 61, 0.85)",
    accentCyan: "#58a6ff",
    accentPurple: "#bc8cff",
    accentRed: "#ff7b72",
    textMain: "#c9d1d9",
    textDim: "#8b949e"
};

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawDeepBackground(ctx, w, h) {
    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, COLORS.bgLight);
    base.addColorStop(1, COLORS.bgDark);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = "rgba(88,166,255,0.04)";
    const cx = w / 2;
    const cy = h / 2;
    for (let i = -w; i <= w * 2; i += 90) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(cx, cy);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPerspectivePanel(ctx, x, y, w, h, side) {
    ctx.save();
    const d = 36;
    const t = 10;

    const pts = side === "left" ?
        [{
                x,
                y
            },
            {
                x: x + w - d,
                y: y + d
            },
            {
                x: x + w - d,
                y: y + h - d
            },
            {
                x,
                y: y + h
            }
        ] :
        [{
                x: x + d,
                y: y + d
            },
            {
                x: x + w,
                y
            },
            {
                x: x + w,
                y: y + h
            },
            {
                x: x + d,
                y: y + h - d
            }
        ];

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y + t);
    pts.forEach(p => ctx.lineTo(p.x, p.y + t));
    ctx.closePath();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = COLORS.panelSurface;
    ctx.fill();

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function drawQuantumCore(ctx, x, y, r, pct, label, subVal) {
    ctx.save();

    const glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.2);
    glow.addColorStop(0, "rgba(88,166,255,0.18)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 14;
    ctx.stroke();

    const start = -Math.PI / 2;
    const end = start + Math.PI * 2 * pct;
    const col = pct > 0.9 ? COLORS.accentRed : COLORS.accentCyan;

    ctx.beginPath();
    ctx.arc(x, y, r - 10, start, end);
    ctx.strokeStyle = col;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.shadowColor = col;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.textMain;
    ctx.font = "700 60px Sans";
    ctx.fillText(`${Math.round(pct * 100)}%`, x, y + 8);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = "12px Sans";
    ctx.fillText(label.toUpperCase(), x, y - 46);

    const dockY = y + r + 38;
    const dockW = 210;
    const dockH = 42;

    roundRect(ctx, x - dockW / 2, dockY - 21, dockW, dockH, 12);
    ctx.fillStyle = "rgba(88,166,255,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(88,166,255,0.35)";
    ctx.stroke();

    ctx.fillStyle = COLORS.accentCyan;
    ctx.font = "700 16px Monospace";
    ctx.fillText(subVal, x, dockY);
    ctx.restore();
}

function drawInfoRow(ctx, x, y, title, val, icon) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.textMain;
    ctx.font = "22px Sans";
    ctx.fillText(icon, x, y + 24);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = "11px Sans";
    ctx.fillText(title.toUpperCase(), x + 40, y + 10);

    ctx.fillStyle = COLORS.textMain;
    ctx.font = "700 18px Sans";
    ctx.fillText(val.length > 26 ? val.slice(0, 26) + "…" : val, x + 40, y + 36);
    ctx.restore();
}

let handler = async (m, {
    conn
}) => {
    try {
        await global.loading(m, conn);

        const res = await axios.get("http://ip-api.com/json/", {
                timeout: 3500
            })
            .catch(() => ({
                data: {
                    city: "-",
                    countryCode: "-",
                    isp: "-"
                }
            }));

        const srv = res.data;
        const totalM = os.totalmem();
        const freeM = os.freemem();
        const usedM = totalM - freeM;
        const pctM = usedM / totalM;

        const cpu = os.cpus()[0].model
            .replace(/CPU|@|Intel|AMD|Core|\(TM\)|\(R\)/gi, "")
            .trim()
            .split(" ")
            .slice(0, 2)
            .join(" ");

        const canvas = createCanvas(WIDTH, HEIGHT);
        const ctx = canvas.getContext("2d");

        drawDeepBackground(ctx, WIDTH, HEIGHT);

        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.textMain;
        ctx.font = "700 40px Sans";
        ctx.fillText(global.botname || "SERVER CORE", WIDTH / 2, 68);

        ctx.fillStyle = COLORS.accentCyan;
        ctx.font = "13px Monospace";
        ctx.fillText("SYSTEM OPERATIONAL · DIAGNOSTIC DATA v2.1", WIDTH / 2, 98);

        const centerY = HEIGHT / 2 + 32;
        const pW = 350;
        const pH = 350;
        const pY = centerY - pH / 2;

        drawPerspectivePanel(ctx, PADDING, pY, pW, pH, "left");
        let rY = pY + 58;
        drawInfoRow(ctx, PADDING + 32, rY, "OS Platform", os.platform().toUpperCase(), "💻");
        drawInfoRow(ctx, PADDING + 32, rY + 100, "Processor", cpu, "⚙️");
        drawInfoRow(ctx, PADDING + 32, rY + 200, "Architecture", os.arch().toUpperCase(), "🏗️");

        const rX = WIDTH - PADDING - pW;
        drawPerspectivePanel(ctx, rX, pY, pW, pH, "right");
        drawInfoRow(ctx, rX + 64, rY, "Location", `${srv.city}, ${srv.countryCode}`, "📍");
        drawInfoRow(ctx, rX + 64, rY + 100, "Provider", srv.isp, "🌐");
        drawInfoRow(ctx, rX + 64, rY + 200, "Uptime", formatTime(os.uptime()), "⏳");

        drawQuantumCore(
            ctx,
            WIDTH / 2,
            centerY,
            132,
            pctM,
            "Memory Load",
            `${(usedM / 1024 ** 3).toFixed(1)}GB / ${(totalM / 1024 ** 3).toFixed(1)}GB`
        );

        const buffer = await canvas.toBuffer("image/png");
        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: "📊 *System Dashboard Updated*"
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply("Error rendering.");
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["server"];
handler.tags = ["info"];
handler.command = /^(server|statserver)$/i;

export default handler;

function formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h}h ${m}m ${sec}s`;
}