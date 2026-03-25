import {
    GoogleGenerativeAI
} from "@google/generative-ai";

const keyCooldown = new Map();
const COOLDOWN_TIME = 10 * 60 * 1000; // 10 menit

function getApiKeys() {
    return Array.isArray(global.googleAiApiKey) ?
        global.googleAiApiKey.filter(Boolean) :
        [global.googleAiApiKey].filter(Boolean);
}

async function tryGenerateContent(prompt) {
    const keys = getApiKeys();
    if (!keys.length) throw new Error("Tidak ada API key Google AI yang tersedia.");

    let lastError;

    for (const key of keys) {
        const now = Date.now();
        if (keyCooldown.has(key) && now - keyCooldown.get(key) < COOLDOWN_TIME) continue;

        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash"
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            if (!text) throw new Error("Respon kosong dari AI.");

            return text;
        } catch (err) {
            keyCooldown.set(key, Date.now());
            lastError = err;
        }
    }

    throw new Error(`Semua API key gagal digunakan: ${lastError?.message}`);
}

function detectPluginType(code) {
    if (/export\s+default\s+handler/.test(code)) return "esm";
    if (/module\.exports\s*=\s*handler/.test(code)) return "cjs";
    if (/case\s+['"`]/.test(code)) return "case";
    return "scrape";
}

function buildToFiturPrompt(sourceCode, targetType) {
    const inputType = detectPluginType(sourceCode);
    const targetFormat = targetType.toUpperCase();
    let taskInstruction = "";

    // === MODE SCRAPE ===
    if (inputType === "scrape") {
        if (targetFormat === "CASE") {
            taskInstruction = `
You are an expert WhatsApp bot developer. Wrap the code into a CASE handler with the following required structure:

case "<command>":
  // code here
break

Rules:
- Generate a valid command name.
- Do NOT modify the core logic.
- Use conn.sendMessage or m.reply for output.
`;
        } else if (targetFormat === "TS") {
            taskInstruction = `
You are an expert TypeScript WhatsApp bot developer. Convert this code into a full TypeScript plugin:

- Add handler.command, handler.help, handler.tags, handler.description
- Add TypeScript type annotations (e.g., m: WAMessage, conn: any)
- Keep all logic identical
- Export using "export default handler"
- Do NOT change behavior
- Ensure the final result is valid TypeScript
`;
        } else {
            taskInstruction = `
You are an expert WhatsApp bot developer. Wrap the provided code into a full ${targetFormat} plugin:
- Add handler.command, handler.help, handler.tags, handler.description
- Do not modify the core logic
- Ensure plugin is ready for production
`;
        }
    }

    // === MODE KONVERSI ANTAR FORMAT ===
    else {
        if (targetFormat === "TS") {
            taskInstruction = `
You are an expert TypeScript converter for WhatsApp bots.
Convert the provided code into TypeScript:

- Add proper TypeScript types where appropriate
- Do not modify logic
- Convert import/export according to TS standards
- Final result must be valid .ts plugin
`;
        } else if (targetFormat === "CASE") {
            taskInstruction = `
Convert the provided feature into CASE format:

case "<command>":
  // code
break

Rules:
- Generate command name automatically
- Keep logic unchanged
- Replace all handler.* structure with case format
`;
        } else {
            taskInstruction = `
You are an expert code converter for WhatsApp bots. Convert the code into ${targetFormat} format:
- Only modify import/export & handler structure
- Do NOT change logic or variables
- Output should match bot plugin format
`;
        }
    }

    // Extra rules
    taskInstruction += `
Additional Rules:
- DO NOT use conn.reply anywhere
- DO NOT use throw anywhere
`;

    return `
${taskInstruction}

RULES:
1. ONLY return raw code. No markdown, no commentary.
2. If failed, return JSON: { "success": false, "message": "explanation" }

SOURCE CODE:
${sourceCode}

RETURN NOW.
`;
}

const handler = async (m, {
    conn,
    args
}) => {
    const keys = getApiKeys();
    if (!keys.length) return m.reply("⚠️ API Key Google AI belum diatur.");

    const targetType = (args[0] || "").toLowerCase();
    const validFormats = ["esm", "cjs", "case", "ts"];

    if (!validFormats.includes(targetType)) {
        return m.reply(
            `⚡ Gunakan: .tofitur <format> <kode>\n\nFormat tersedia:\n- esm\n- cjs\n- case\n- ts`
        );
    }

    const sourceCode = args.slice(1).join(" ") || (m.quoted && m.quoted.text);
    if (!sourceCode) return m.reply("💡 Sertakan kode atau reply pesan berisi kode.");

    await m.reply(`🔄 Mengonversi kode ke format *${targetType.toUpperCase()}*...`);

    try {
        const prompt = buildToFiturPrompt(sourceCode, targetType);
        let codeResult = await tryGenerateContent(prompt);

        if (codeResult.startsWith("{")) {
            try {
                const errJson = JSON.parse(codeResult);
                if (errJson.success === false)
                    return m.reply(`❌ Konversi gagal: ${errJson.message}`);
            } catch {}
        }

        codeResult = codeResult.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();

        await conn.sendMessage(m.chat, {
            text: codeResult
        }, {
            quoted: m
        });
    } catch (err) {
        await conn.sendMessage(
            m.chat, {
                text: `❌ Semua API Key gagal: ${err.message}`
            }, {
                quoted: m
            }
        );
    }
};

handler.help = ["tofitur <format> <kode/reply>"];
handler.tags = ["ai"];
handler.command = /^tofitur$/i;
handler.premium = true;

export default handler;