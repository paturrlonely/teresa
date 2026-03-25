import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { join } from "path";

GlobalFonts.registerFromPath(
  join(process.cwd(), "library", "Cobbler-SemiBold.ttf"),
  "Cobbler"
);

const c = {
  bgTop: "#020617",
  bgBottom: "#0B1020",
  panel: "#0F172A",
  card: "#1E293B",
  border: "rgba(255,255,255,0.08)",
  title: "#F8FAFC",
  sub: "#CBD5E1",
  text: "#E5E7EB",
  muted: "#94A3B8",
  accent: "#38BDF8"
};

function round(ctx, x, y, w, h, r = 24) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}

export async function profileCanvas(data = {}) {
  const W = 900;
  const H = 520;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, c.bgTop);
  bg.addColorStop(1, c.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  round(ctx, 28, 24, W - 56, H - 48, 32);
  ctx.fillStyle = c.panel;
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = c.title;
  ctx.font = "bold 42px Cobbler";
  ctx.fillText("USER PROFILE", 90, 104);

  ctx.fillStyle = c.sub;
  ctx.font = "18px Cobbler";
  ctx.fillText("WhatsApp Account Overview", 90, 136);

  const leftAreaCenter = 180;
  const avatarR = 56;
  const avatarX = leftAreaCenter - avatarR;
  const avatarY = 190;

  try {
    const img = await loadImage(data.avatar);
    ctx.save();
    circle(ctx, leftAreaCenter, avatarY + avatarR, avatarR);
    ctx.clip();
    ctx.drawImage(img, avatarX, avatarY, avatarR * 2, avatarR * 2);
    ctx.restore();

    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 4;
    circle(ctx, leftAreaCenter, avatarY + avatarR, avatarR);
    ctx.stroke();
  } catch {}

  const badgeW = 140;
  const badgeH = 34;
  const badgeX = leftAreaCenter - badgeW / 2;
  const badgeY = avatarY + avatarR * 2 + 14;

  round(ctx, badgeX, badgeY, badgeW, badgeH, 10);
  ctx.fillStyle = c.accent;
  ctx.fill();

  ctx.fillStyle = "#020617";
  ctx.font = "bold 17px Cobbler";
  ctx.textAlign = "center";
  ctx.fillText(
    data.role || "User",
    leftAreaCenter,
    badgeY + 24
  );
  ctx.textAlign = "left";

  const cardX = 260;
  const cardY = 190;
  const cardW = W - cardX - 120;
  const cardH = 260;

  round(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fillStyle = c.card;
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.stroke();

  const lineY = cardY + 56;
  const gap = 42;

  ctx.fillStyle = c.muted;
  ctx.font = "17px Cobbler";

  ctx.fillText("Name", cardX + 32, lineY);
  ctx.fillText("Number", cardX + 32, lineY + gap);
  ctx.fillText("Limit", cardX + 32, lineY + gap * 2);
  ctx.fillText("Premium", cardX + 32, lineY + gap * 3);
  ctx.fillText("Registered", cardX + 32, lineY + gap * 4);

  ctx.fillStyle = c.text;
  ctx.font = "bold 20px Cobbler";
  ctx.textAlign = "right";

  ctx.fillText(data.name || "-", cardX + cardW - 32, lineY);
  ctx.fillText(data.number || "-", cardX + cardW - 32, lineY + gap);
  ctx.fillText(data.limit ?? "0", cardX + cardW - 32, lineY + gap * 2);
  ctx.fillText(data.premium || "-", cardX + cardW - 32, lineY + gap * 3);
  ctx.fillText(data.registered || "-", cardX + cardW - 32, lineY + gap * 4);

  ctx.textAlign = "center";
  ctx.fillStyle = c.muted;
  ctx.font = "14px Cobbler";
  ctx.fillText(`Powered by ${global.botname || "Bot"}`, W / 2, H - 36);

  return canvas.toBuffer("image/png");
}