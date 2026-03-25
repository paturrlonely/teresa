import {
    GoogleGenerativeAI
} from "@google/generative-ai";
import js_beautify from "js-beautify";

const keyCooldown = new Map(); // hapus <string, number>
const COOLDOWN_TIME = 10 * 60 * 1000;

function getApiKeys() {
    const keys = Array.isArray(global.googleAiApiKey) ?
        global.googleAiApiKey.filter(Boolean) :
        [global.googleAiApiKey].filter(Boolean);
    return keys;
}

async function tryGenerateContent(prompt) {
    const keys = getApiKeys();
    if (!keys.length) throw new Error("Tidak ada API key Google AI yang tersedia.");

    let lastError = null;

    for (const key of keys) {
        const now = Date.now();

        if (keyCooldown.has(key) && now - keyCooldown.get(key) < COOLDOWN_TIME) {
            console.log(`⏳ Key ${key.slice(0, 10)}... masih cooldown, dilewati.`);
            continue;
        }

        try {
            console.log(`⚙️ Mencoba generate dengan key: ${key.slice(0, 10)}...`);

            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-pro"
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            if (!text) throw new Error("Respon kosong dari AI.");

            console.log(`✅ Berhasil pakai key ${key.slice(0, 10)}...`);
            return text;
        } catch (err) {
            console.warn(`⚠️ Key ${key.slice(0, 10)} gagal => ${err.message}`);
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

function buildFiturPrompt(sourceCode, targetType) {
    const inputType = detectPluginType(sourceCode);
    const targetFormat = targetType.toUpperCase();

    let taskInstruction = "";

    if (inputType === "scrape") {
        if (targetFormat === "CASE") {
            taskInstruction = `
You are an expert WhatsApp bot developer.
Wrap the given code into a CASE handler:
- Create a valid case block: case "<command>": { ...; break }
- Auto-generate a suitable command name
- Use conn.sendMessage or m.reply
- Keep all original logic
- Output ready CASE format
`;
        } else if (targetFormat === "TS") {
            taskInstruction = `
You are an expert WhatsApp bot developer.
Convert the given code/description into a fully typed TypeScript ESM plugin:
- Add handler.command, handler.tags, handler.description
- Use proper TypeScript types for parameters and variables
- Keep all logic intact
- Must be valid WhatsApp TypeScript plugin
`;
        } else {
            taskInstruction = `
You are an expert WhatsApp bot developer.
Wrap the code into a full ${targetFormat} plugin:
- Add handler.command, handler.tags, handler.description
- Auto-generate values if needed
- Keep the core logic intact
- Output must be valid WhatsApp bot plugin
`;
        }
    } else {
        taskInstruction = `
You are an expert converter for WhatsApp bot plugins.
Convert the provided bot code into ${targetFormat} format:
- Preserve ALL logic, variable names, and functions
- Adjust imports/exports to match target format
- Must be valid WhatsApp plugin
`;
    }

    return `
${taskInstruction}

Rules:
1. ONLY return raw code, no explanation, no markdown.
2. If cannot generate valid code, respond JSON: { "success": false, "message": "Explanation." }

Source Code / Description:
${sourceCode}

Return the converted plugin or CASE code.
`;
}

const handler = async (m, {
    conn,
    args
}) => {
    const keys = getApiKeys();
    if (!keys.length)
        return m.reply("⚠️ API Key Google AI belum diatur. Tambahkan di settings.js");

    const targetType = (args[0] || "").toLowerCase();
    const validFormats = ["esm", "cjs", "case", "ts"];

    if (!validFormats.includes(targetType)) {
        return m.reply(
            `⚡ Gunakan: .createfitur <format> <kode / deskripsi>

📌 Format yang tersedia:
- esm → Plugin ESM
- cjs → Plugin CommonJS
- case → Case Handler
- ts → Plugin TypeScript

📌 Contoh:
.createfitur esm Kirim 'Halo'
.createfitur cjs const axios = require("axios");
.createfitur case m.reply("Halo semua");
.createfitur ts m.reply("Halo semua");`
        );
    }

    const sourceCode = args.slice(1).join(" ") || m.quoted?.text;
    if (!sourceCode)
        return m.reply("⚠️ Sertakan kode / deskripsi atau reply pesan berisi kode.");

    await m.reply(`🔄 Membuat fitur format *${targetType.toUpperCase()}*...`);

    try {
        const prompt = buildFiturPrompt(sourceCode, targetType);
        let codeResult = await tryGenerateContent(prompt);

        if (codeResult.startsWith("{")) {
            try {
                const errJson = JSON.parse(codeResult);
                if (errJson.success === false)
                    return m.reply(`❌ Gagal membuat fitur: ${errJson.message}`);
            } catch {}
        }

        codeResult = codeResult.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();

        codeResult = js_beautify(codeResult, {
            indent_size: 2,
            space_in_empty_paren: true,
        });

        await conn.sendMessage(m.chat, {
            text: codeResult
        }, {
            quoted: m
        });
    } catch (err) {
        console.error("Create Fitur AI Error:", err);
        await conn.sendMessage(
            m.chat, {
                text: `❌ Gagal membuat fitur: ${err.message}`
            }, {
                quoted: m
            }
        );
    }
};

handler.help = ["createfitur <format> <kode/deskripsi>"];
handler.tags = ["ai"];
handler.command = /^createfitur|cfitur$/i;
handler.owner = true;
handler.description =
    "Buat plugin WhatsApp bot otomatis (ESM / CJS / CASE / TS) dari deskripsi atau kode.";

export default handler;