import fs from "fs";
import path from "path"
import FormData from "form-data"
import axios from "axios"
import WebSocket from 'ws';
import * as cheerio from "cheerio"
import {
  fileURLToPath
} from 'url';
import CaseManager from "./core/case.js";
import util from "util";
import "./settings.js";
import {
  addExif,
  sticker
} from './library/sticker.js';
import {
  Buffer
} from "buffer";
import {
  exec,
  spawn,
  execSync
} from 'child_process'
import fetch from "node-fetch";
import {
  generateWAMessageFromContent,
  proto
} from 'baileys'
const Case = new CaseManager("./case.js");

const file = fileURLToPath(import.meta.url);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Pembaruan terdeteksi di ${file}`);

});

export default async (m, {
  conn,
  isOwner,
  prefix,
  command,
  text,
  user,
  db,
  Func,
  cmd,
  isPremium,
  isAdmin,
  isBotAdmin,
}) => {
  if (!prefix) return;

  try {
    const q = text?.trim() || "";
    const args = q.split(" ");
    switch (command) {
      

      //ai
      case "lumiart": {
        try {
          if (!isPremium) {
            return m.reply("⭐ *Fitur ini khusus pengguna Premium.*");
          }

          let q = m.quoted ? m.quoted : m;
          let mime = (q.msg || q).mimetype || "";

          if (!mime.startsWith("image/")) {
            return m.reply("🍂 *Reply gambar yang ingin Lumiart.*");
          }

          await conn.sendMessage(m.chat, {
            react: {
              text: "⏳",
              key: m.key
            }
          });

          let buffer = await q.download();
          if (!buffer) {
            return m.reply("🍂 *Gagal membaca gambar.*");
          }

          let imageBase64 = Buffer.from(buffer).toString("base64");

          const DEFAULT_PROMPT = `
Create a vertical frame – size equivalent to 1920x1080 pixels (high quality) – divided into three equally sized horizontal images seamlessly placed together. The main character is based on the reference face, hairstyle, and body: a person with a gentle and nostalgic expression, and deep, reflective eyes. They are dressed in a loose-fitting, dark-toned outfit that feels light, comfortable, and understated, evoking a sense of calm and quiet melancholy. The overall scene is set at night during a sky lantern festival, illuminated by the warm glow of golden and amber-orange tones that create a dreamy and ethereal atmosphere. Against the dark night sky, millions of glowing lanterns drift upward, lighting the air with soft, flickering light. The character’s shimmering eyes capture a mix of hope, longing, and sorrow, as they release their lantern — a symbolic act of letting go of dreams, memories, and silent wishes. Image 1 (wide shot): A low-angle shot taken from the ground, looking upward into the night sky filled with millions of glowing sky lanterns floating into the darkness. Image 2 (close-up portrait): 3/4 angled close-up capturing the character’s face from chin to forehead, focusing on the eyes. Image 3 (portrait): The character stands at the center of the frame, looking upward toward the sky, surrounded by hundreds of floating lanterns drifting into the night.
`.trim();

          let payload = {
            image: imageBase64,
            prompt: DEFAULT_PROMPT
          };

          let res = await fetch("https://ai-studio.anisaofc.my.id/api/edit-image", {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "*/*",
              "Content-Type": "application/json",
              "Origin": "https://ai-studio.anisaofc.my.id",
              "Referer": "https://ai-studio.anisaofc.my.id/"
            },
            body: JSON.stringify(payload)
          });

          let result = await res.json();
          if (!result?.imageUrl) {
            return m.reply(
              "🍂 *Gagal mengedit gambar.*\nServer tidak mengembalikan hasil edit."
            );
          }

          await conn.sendMessage(
            m.chat, {
              image: {
                url: result.imageUrl
              }
            }, {
              quoted: m
            }
          );

        } catch (e) {
          console.error(e);
          m.reply("🍂 *Terjadi kesalahan saat memproses gambar.*");
        } finally {
          await conn.sendMessage(m.chat, {
            react: {
              text: "",
              key: m.key
            }
          });
        }
      }
      break;
      case "feloai":
        const feloai = {
          scrape: async function(query) {
            if (!query?.trim()) return null;

            const headers = {
              Accept: "*/*",
              "User-Agent": "Postify/1.0.0",
              "Content-Encoding": "gzip, deflate, br, zstd",
              "Content-Type": "application/json",
            };

            const payload = {
              query,
              search_uuid: Date.now().toString(),
              search_options: {
                langcode: "id-MM"
              },
              search_video: true,
            };

            function parseResult(badi) {
              const result = {
                answer: "",
                source: []
              };
              badi.split("\n").forEach((line) => {
                if (line.startsWith("data:")) {
                  try {
                    const data = JSON.parse(line.slice(5).trim());
                    if (data.data) {
                      if (data.data.text) result.answer = data.data.text.replace(/\d+/g, "");
                      if (data.data.sources) result.source = data.data.sources.map(s => ({
                        title: s.title || s.link || "-",
                        link: s.link || "-"
                      }));
                    }
                  } catch (e) {
                    console.error("Parse error:", e.message);
                  }
                }
              });
              return result;
            }

            try {
              const response = await axios.post(
                "https://api.felo.ai/search/threads",
                payload, {
                  headers,
                  timeout: 30000,
                  responseType: "text"
                }
              );
              return parseResult(response.data);
            } catch (error) {
              return null;
            }
          }
        };

        (async () => {
          if (!q) return m.reply("❌ Mohon masukkan query.\nContoh: .feloai siapa presiden Indonesia");

          await m.reply("🧠 Mengambil jawaban dari FeloAI...");

          const result = await feloai.scrape(q.trim());

          if (!result) return m.reply("❌ Gagal mendapatkan jawaban dari API FeloAI");

          let replyText = `📖 Jawaban untuk query: "${q}"\n\n${result.answer || "(tidak ada jawaban)"}\n\n`;
          if (result.source?.length > 0) {
            replyText += "Sumber:\n" + result.source.map(s => `- ${s.title}: ${s.link}`).join("\n");
          } else {
            replyText += "Sumber: Tidak ada sumber";
          }

          await m.reply(replyText);
        })();
        break;

      case "edit": {
        try {
          if (!isPremium) {
            return m.reply("⭐ *Fitur ini khusus pengguna Premium.*");
          }

          if (!text) {
            return m.reply(
              "✏️ *Masukkan prompt edit gambar!*\n\n" +
              "Contoh:\n" +
              ".edit ubah kostum jadi Qin Shi Huang Record of Ragnarok, pose dominan, cinematic lighting"
            );
          }

          let q = m.quoted ? m.quoted : m;
          let mime = (q.msg || q).mimetype || "";

          if (!mime.startsWith("image/")) {
            return m.reply("🍂 *Reply gambar yang ingin diedit.*");
          }

          await conn.sendMessage(m.chat, {
            react: {
              text: "⏳",
              key: m.key
            }
          });

          let buffer = await q.download();
          if (!buffer) {
            return m.reply("🍂 *Gagal membaca gambar.*");
          }

          let imageBase64 = Buffer.from(buffer).toString("base64");

          let userPrompt = text.trim().slice(0, 1000);

          let payload = {
            image: imageBase64,
            prompt: userPrompt
          };

          let res = await fetch("https://ai-studio.anisaofc.my.id/api/edit-image", {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "*/*",
              "Content-Type": "application/json",
              "Origin": "https://ai-studio.anisaofc.my.id",
              "Referer": "https://ai-studio.anisaofc.my.id/"
            },
            body: JSON.stringify(payload)
          });

          let result = await res.json();
          if (!result?.imageUrl) {
            return m.reply(
              "🍂 *Gagal mengedit gambar.*\nServer tidak mengembalikan hasil edit."
            );
          }

          await conn.sendMessage(
            m.chat, {
              image: {
                url: result.imageUrl
              },
              caption: "✨ *Edit selesai*"
            }, {
              quoted: m
            }
          );

        } catch (e) {
          console.error(e);
          m.reply("🍂 *Terjadi kesalahan saat memproses gambar.*");
        } finally {
          await conn.sendMessage(m.chat, {
            react: {
              text: "",
              key: m.key
            }
          });
        }
      }
      break;
      case "venice": {
        if (!q) {
          m.reply("Please provide a question to ask Venice AI.\n\n*Example:*\n.venice What is the capital of France?");
          break;
        }

        const venicechat = async (question) => {
          const {
            data
          } = await axios.request({
            method: 'POST',
            url: 'https://outerface.venice.ai/api/inference/chat',
            headers: {
              accept: '*/*',
              'content-type': 'application/json',
              origin: 'https://venice.ai',
              referer: 'https://venice.ai/',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'user-agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
              'x-venice-version': 'interface@20250523.214528+393d253'
            },
            data: {
              requestId: 'nekorinn',
              modelId: 'dolphin-3.0-mistral-24b',
              prompt: [{
                content: question,
                role: 'user'
              }],
              systemPrompt: '',
              conversationType: 'text',
              temperature: 0.8,
              webEnabled: true,
              topP: 0.9,
              isCharacter: false,
              clientProcessingTime: 15
            }
          });
          const chunks = data
            .split('\n')
            .filter(Boolean)
            .map(chunk => {
              try {
                return JSON.parse(chunk);
              } catch {
                return null;
              }
            })
            .filter(Boolean);

          const result = chunks
            .map(chunk => chunk?.content ?? '')
            .join('');

          return result;
        };

        try {
          await m.reply("🧠 Thinking...");
          const response = await venicechat(q);
          if (response) {
            conn.sendMessage(m.chat, {
              text: response
            }, {
              quoted: m
            });
          } else {
            m.reply("I received an empty response. Please try again.");
          }
        } catch (err) {
          const errorMessage = err.message || 'An unknown error occurred';
          m.reply(`Sorry, I couldn't process your request.\n*Error:* ${errorMessage}`);
        }
      }
      break;
      case "webpilot": {
        async function webpilot(query) {
          try {
            if (!query) throw new Error('Query is required');

            const {
              data
            } = await axios.post('https://api.webpilotai.com/rupee/v1/search', {
              q: query,
              threadId: ''
            }, {
              headers: {
                authority: 'api.webpilotai.com',
                accept: 'application/json, text/plain, */*, text/event-stream',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                authorization: 'Bearer null',
                'cache-control': 'no-cache',
                'content-type': 'application/json;charset=UTF-8',
                origin: 'https://www.webpilot.ai',
                pragma: 'no-cache',
                referer: 'https://www.webpilot.ai/',
                'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
              }
            });

            let chat = '';
            const source = [];

            data.split('\n').forEach(line => {
              if (line.startsWith('data:')) {
                try {
                  const json = JSON.parse(line.slice(5));
                  if (json.type === 'data' && json.data?.section_id === void 0 && json.data?.content) chat += json.data.content;
                  if (json.action === 'using_internet' && json.data) source.push(json.data);
                } catch {}
              }
            });

            return {
              chat: chat,
              source: source
            };
          } catch (error) {
            throw new Error(error.message);
          }
        }

        try {
          const query = args.join(" ");
          if (!query) {
            m.reply("Please provide a query to search.\nExample: .webpilot latest news in Indonesia");
            break;
          }

          await m.reply("⏳ Searching the web, please wait...");

          const resp = await webpilot(query);

          let responseText = resp.chat.trim();
          if (resp.source && resp.source.length > 0) {
            let sourcesText = "\n\n*Sources:*";
            resp.source.forEach((s, index) => {
              sourcesText += `\n${index + 1}. ${s.title}\n   - _${s.url}_`;
            });
            responseText += sourcesText;
          }

          if (responseText) {
            m.reply(responseText);
          } else {
            m.reply("Sorry, I couldn't find any information for that query.");
          }

        } catch (error) {
          m.reply(`An error occurred: ${error.message}`);
        }
      }
      break;
      case "toqin": {
        try {
          if (!isPremium) {
            return m.reply("⭐ *Fitur ini khusus pengguna Premium.*");
          }

          let q = m.quoted ? m.quoted : m;
          let mime = (q.msg || q).mimetype || "";

          if (!mime.startsWith("image/")) {
            return m.reply("🍂 *Reply gambar yang ingin diedit.*");
          }

          await conn.sendMessage(m.chat, {
            react: {
              text: "⏳",
              key: m.key
            }
          });

          let buffer = await q.download();
          if (!buffer) {
            return m.reply("🍂 *Gagal membaca gambar.*");
          }

          let imageBase64 = Buffer.from(buffer).toString("base64");

          const DEFAULT_PROMPT = `
Buat saya memakai kostum Qin Shi Huang dari anime Record of Ragnarok, termasuk desain penutup mata dan pakaian yang dikenakan Qin Shi Huang di dalam anime Record of Ragnarok. Buatkan pose khasnya.

Characterized by stark cinematic lighting and intense contrast. Captured with a slightly low, upward-facing angle that dramatizes the subject's jawline and neck. The background is a deep, saturated crimson red.

Lighting is tightly directional, casting warm golden highlights on one side of the face while plunging the other into velvety shadow.

Make the face and hairstyle as similar as possible to the one in the photo. Pertahankan gaya rambut dan warna yang sama. Buat kostumnya sangat detail dan realistis. Gunakan warna dan tekstur yang mirip anime.
`.trim();

          let payload = {
            image: imageBase64,
            prompt: DEFAULT_PROMPT
          };

          let res = await fetch("https://ai-studio.anisaofc.my.id/api/edit-image", {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "*/*",
              "Content-Type": "application/json",
              "Origin": "https://ai-studio.anisaofc.my.id",
              "Referer": "https://ai-studio.anisaofc.my.id/"
            },
            body: JSON.stringify(payload)
          });

          let result = await res.json();
          if (!result?.imageUrl) {
            return m.reply(
              "🍂 *Gagal mengedit gambar.*\nServer tidak mengembalikan hasil edit."
            );
          }

          await conn.sendMessage(
            m.chat, {
              image: {
                url: result.imageUrl
              }
            }, {
              quoted: m
            }
          );

        } catch (e) {
          console.error(e);
          m.reply("🍂 *Terjadi kesalahan saat memproses gambar.*");
        } finally {
          await conn.sendMessage(m.chat, {
            react: {
              text: "",
              key: m.key
            }
          });
        }
      }
      break;
      case "tosimo": {
        try {
          if (!isPremium) {
            return m.reply("⭐ *Fitur ini khusus pengguna Premium.*");
          }

          let q = m.quoted ? m.quoted : m;
          let mime = (q.msg || q).mimetype || "";

          if (!mime.startsWith("image/")) {
            return m.reply("🍂 *Reply gambar yang ingin diedit.*");
          }

          await conn.sendMessage(m.chat, {
            react: {
              text: "⏳",
              key: m.key
            }
          });

          let buffer = await q.download();
          if (!buffer) {
            return m.reply("🍂 *Gagal membaca gambar.*");
          }

          let imageBase64 = Buffer.from(buffer).toString("base64");

          const DEFAULT_PROMPT = `
 Buat saya memakai kostum simo hayha dari anime record of ragnarok, termasuk desain masker yg mirip banget dan pakaian yang di kenakan simo hayha di dalam anime record of ragnarok. Buatkan pose khas nya hormat
characterized by stark cinematic lighting and intense contrast. Captured with a slightly low, upward-facing angle that dramatizes the subject's jawline and neck, the composition evokes quiet dominance and sculptural elegance. The background is a deep, saturated crimson red, creating a bold visual clash with the model's luminous skin and dark wardrobe. Lighting is tightly directional, casting warm golden highlights on one side of the face while plunging the other into velvety shadow, emphasizing bone structure with almost architectural precision.
The subject's expression is unreadable and cool-toned-eyes half-lidded, lips relaxed- suggesting detachment or quiet defiance. The model wears a heavy wool or felt overcoat, its texture richly defined against the skin's smooth, dewy glow. Minimal retouching preserves skin texture and slight imperfections, adding realism. Editorial tension is created through close cropping, tonal control, and the almost oppressive intimacy of the camera's proximity.
There are no props or accessories; the visual impact is created purely through light, shadow, color saturation, and posture - evoking high fashion, contemporary isolation, and hyper-modern masculinity.
Make the face and hairstyle as similar as possible to the one in the photo. Buat kostumnya sangat detail dan realistis. Pertahankan gaya rambut dan warna yang sama, Gunakan warna dan tekstur yang mirip anime harus mirip dong yg bagus
`.trim();

          let payload = {
            image: imageBase64,
            prompt: DEFAULT_PROMPT
          };

          let res = await fetch("https://ai-studio.anisaofc.my.id/api/edit-image", {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "*/*",
              "Content-Type": "application/json",
              "Origin": "https://ai-studio.anisaofc.my.id",
              "Referer": "https://ai-studio.anisaofc.my.id/"
            },
            body: JSON.stringify(payload)
          });

          let result = await res.json();
          if (!result?.imageUrl) {
            return m.reply(
              "🍂 *Gagal mengedit gambar.*\nServer tidak mengembalikan hasil edit."
            );
          }

          await conn.sendMessage(
            m.chat, {
              image: {
                url: result.imageUrl
              }
            }, {
              quoted: m
            }
          );

        } catch (e) {
          console.error(e);
          m.reply("🍂 *Terjadi kesalahan saat memproses gambar.*");
        } finally {
          await conn.sendMessage(m.chat, {
            react: {
              text: "",
              key: m.key
            }
          });
        }
      }
      break;
      case "tohades": {
        try {
          if (!isPremium) {
            return m.reply("⭐ *Fitur ini khusus pengguna Premium.*");
          }

          let q = m.quoted ? m.quoted : m;
          let mime = (q.msg || q).mimetype || "";

          if (!mime.startsWith("image/")) {
            return m.reply("🍂 *Reply gambar yang ingin hades.*");
          }

          await conn.sendMessage(m.chat, {
            react: {
              text: "⏳",
              key: m.key
            }
          });

          let buffer = await q.download();
          if (!buffer) {
            return m.reply("🍂 *Gagal membaca gambar.*");
          }

          let imageBase64 = Buffer.from(buffer).toString("base64");

          const DEFAULT_PROMPT = `
Buat saya memakai kostum Hades dari anime record of ragnarok, termasuk desain penutup mata dan pakaian yang di kenakan hades di dalam anime record of ragnarok. Buatkan pose khas nya
characterized by stark cinematic lighting and intense contrast. Captured with a slightly low, upward-facing angle that dramatizes the subject's jawline and neck, the composition evokes quiet dominance and sculptural elegance. The background is a deep, saturated crimson red, creating a bold visual clash with the model's luminous skin and dark wardrobe. Lighting is tightly directional, casting warm golden highlights on one side of the face while plunging the other into velvety shadow, emphasizing bone structure with almost architectural precision.
The subject's expression is unreadable and cool-toned-eyes half-lidded, lips relaxed- suggesting detachment or quiet defiance. The model wears a heavy wool or felt overcoat, its texture richly defined against the skin's smooth, dewy glow. Minimal retouching preserves skin texture and slight imperfections, adding realism. Editorial tension is created through close cropping, tonal control, and the almost oppressive intimacy of the camera's proximity.
There are no props or accessories; the visual impact is created purely through light, shadow, color saturation, and posture - evoking high fashion, contemporary isolation, and hyper-modern masculinity.
Make the face and hairstyle as similar as possible to the one in the photo. Buat kostumnya sangat detail dan realistis. Pertahankan gaya rambut dan warna yang sama, Gunakan warna dan tekstur yang mirip anime.
`.trim();

          let payload = {
            image: imageBase64,
            prompt: DEFAULT_PROMPT
          };

          let res = await fetch("https://ai-studio.anisaofc.my.id/api/edit-image", {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "*/*",
              "Content-Type": "application/json",
              "Origin": "https://ai-studio.anisaofc.my.id",
              "Referer": "https://ai-studio.anisaofc.my.id/"
            },
            body: JSON.stringify(payload)
          });

          let result = await res.json();
          if (!result?.imageUrl) {
            return m.reply(
              "🍂 *Gagal mengedit gambar.*\nServer tidak mengembalikan hasil edit."
            );
          }

          await conn.sendMessage(
            m.chat, {
              image: {
                url: result.imageUrl
              }
            }, {
              quoted: m
            }
          );

        } catch (e) {
          console.error(e);
          m.reply("🍂 *Terjadi kesalahan saat memproses gambar.*");
        } finally {
          await conn.sendMessage(m.chat, {
            react: {
              text: "",
              key: m.key
            }
          });
        }
      }
      break;
      case "copilot": {
        if (!q) {
          m.reply('Please provide a query. \nExample: .copilot what is the latest news in Indonesia?');
          break;
        }

        try {
          const headers = {
            origin: 'https://copilot.microsoft.com',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
          };

          const models = {
            default: 'chat',
            'think-deeper': 'reasoning',
            'gpt-5': 'smart'
          };

          const {
            data
          } = await axios.post('https://copilot.microsoft.com/c/api/conversations', null, {
            headers
          });
          const conversationId = data.id;

          const chatPromise = new Promise((resolve, reject) => {
            const ws = new WebSocket(
              `wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1`, {
                headers
              }
            );

            const response = {
              text: '',
              citations: []
            };

            ws.on('open', () => {

              ws.send(JSON.stringify({
                event: 'setOptions',
                supportedFeatures: ['partial-generated-images'],
                supportedCards: ['weather', 'local', 'image', 'sports', 'video', 'ads', 'safetyHelpline', 'quiz', 'finance', 'recipe'],
                ads: {
                  supportedTypes: ['text', 'product', 'multimedia', 'tourActivity', 'propertyPromotion']
                }
              }));

              const modelValues = Object.values(models);
              const randomModel = modelValues[Math.floor(Math.random() * modelValues.length)];

              ws.send(JSON.stringify({
                event: 'send',
                mode: randomModel,
                conversationId,
                content: [{
                  type: 'text',
                  text: q
                }],
                context: {}
              }));
            });


            ws.on('message', (chunk) => {
              try {
                const parsed = JSON.parse(chunk.toString());


                if (parsed.event === 'appendText') {
                  if (parsed.text) response.text += parsed.text;
                  return;
                }


                if (parsed.event === 'citation') {
                  response.citations.push({
                    title: parsed.title || 'No title',
                    icon: parsed.iconUrl || null,
                    url: parsed.url || ''
                  });
                  return;
                }


                if (parsed.event === 'done') {
                  ws.close();
                  resolve(response);
                  return;
                }


                if (parsed.event === 'error') {
                  ws.close();
                  reject(new Error(parsed.message || 'Unknown WebSocket error'));
                  return;
                }

              } catch (error) {
                reject(error);
              }
            });

            ws.on('error', reject);
          });

          const result = await chatPromise;

          let replyText = result.text;
          if (result.citations.length > 0) {
            const citationText = result.citations
              .map((cite, i) => `${i + 1}. ${cite.title}\n   ${cite.url}`)
              .join('\n');
            replyText += `\n\nCitations:\n${citationText}`;
          }

          m.reply(replyText.trim());

        } catch (e) {
          m.reply(`An error occurred: ${e.message}`);
        }
      }
      break;
      case "ishchat":

        async function ishchat(question) {
          try {
            const models = ['grok-4-fast-reasoning', 'grok-4-fast-non-reasoning', 'gpt-oss-120b', 'grok-3-mini'];

            if (!question) {
              return 'Error: Question is required.';
            }

            const model = models[Math.floor(Math.random() * models.length)];

            const {
              data
            } = await axios.post('https://openai.junioralive.workers.dev/v1/chat/completions', {
              model: model,
              messages: [{
                role: 'user',
                content: question
              }],
              stream: false
            }, {
              headers: {
                origin: 'https://ish.chat',
                referer: 'https://ish.chat/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
                'x-proxy-key': 'ish-7f9e2c1b-5c8a-4b0f-9a7d-1e5c3b2a9f74'
              }
            });

            const result = data?.choices?.[0]?.message?.content;
            if (!result) {
              return 'Error: No result found.';
            }

            return result;
          } catch (error) {
            return `An error occurred: ${error.message}`;
          }
        }

        (async () => {
          const question = q;
          if (!question) {
            return m.reply('Please provide a question.\n\nExample: .ishchat Hello');
          }

          try {
            await m.reply('🧠 Thinking...');
            const result = await ishchat(question);
            await m.reply(result);
          } catch (e) {
            await m.reply('An unexpected error occurred while processing your request.');
          }
        })();

        break;
      case "grammar": {

        if (!q) {
          m.reply('Please provide the text you want to check.\n\nExample: .grammar he dont know how to swim');
          break;
        }

        async function grammarcheck(text) {
          try {
            const {
              data: a
            } = await axios.post(
              'https://app.essaypro.com/api/ai-tools/v1_0/grammar-checker/report/', {
                text: text,
                file: null
              }, {
                headers: {
                  origin: 'https://paperwriter.com',
                  referer: 'https://paperwriter.com/grammar-checker',
                  'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
                }
              }
            );

            if (!a?.id) return {
              error: true,
              message: 'Failed to initialize grammar check.'
            };

            let attempts = 0;
            while (attempts < 20) {
              const {
                data
              } = await axios.get(
                `https://app.essaypro.com/api/ai-tools/v1_0/grammar-checker/report/${a.id}`, {
                  headers: {
                    origin: 'https://paperwriter.com',
                    referer: 'https://paperwriter.com/grammar-checker',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
                  }
                }
              );

              if (data?.status === 'completed') return data;
              await new Promise(res => setTimeout(res, 1000));
              attempts++;
            }

            return {
              error: true,
              message: 'Request timed out.'
            };

          } catch (error) {
            console.error(error);
            return {
              error: true,
              message: error.message
            };
          }
        }

        try {
          await m.reply('🔍 Checking grammar and spelling... Please wait.');
          const result = await grammarcheck(q);

          if (result.error) {
            m.reply(`An error occurred: ${result.message}`);
            break;
          }

          const correctedText = result.report?.text || q;
          const errors = result.report?.errors || [];

          if (errors.length === 0) {
            let response = `✅ *No grammar errors found!*\n\n`;
            response += `*Text:*\n${correctedText}`;
            await conn.sendMessage(m.chat, {
              text: response
            }, {
              quoted: m
            });
          } else {
            let response = `📝 *Grammar Check Results*\n\n`;
            response += `*Corrected Text:*\n${correctedText}\n\n`;
            response += `*Issues Found (${errors.length}):*\n\n`;

            errors.forEach((err, index) => {
              response += `*${index + 1}. ${err.title}*\n`;
              response += `> Incorrect: "${err.text}"\n`;
              response += `> Suggestion: "${err.replacements.join(' / ')}"\n`;
              response += `> _${err.explanation}_\n\n`;
            });

            await conn.sendMessage(m.chat, {
              text: response.trim()
            }, {
              quoted: m
            });
          }

        } catch (e) {
          console.error(e);
          m.reply('An unexpected error occurred while processing the grammar check.');
        }
      }
      break;
      case "gemini":
        const gemini = {
          memory: new Map(),

          getNewCookie: async function() {
            const r = await fetch("https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c", {
              headers: {
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
              },
              body: "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
              method: "POST"
            });

            console.log('get new cookie');

            const cookies = r.headers.raw ? r.headers.raw()['set-cookie'] : r.headers.get('set-cookie')?.split(',');
            if (!cookies || cookies.length === 0) throw new Error("No Set-Cookie header received");

            return cookies[0].split(";")[0];
          },

          ask: async function(prompt, previousId = null) {
            if (!prompt?.trim()) throw Error(`Please provide a prompt.`);

            let resumeArray = null;
            let cookie = null;

            if (previousId && this.memory.has(previousId)) {
              const data = this.memory.get(previousId);
              resumeArray = data.newResumeArray;
              cookie = data.cookie;
            }

            const headers = {
              "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
              "x-goog-ext-525001261-jspb": "[1,null,null,null,\"9ec249fc9ad08861\",null,null,null,[4]]",
              cookie: cookie || await this.getNewCookie()
            };

            const b = [
              [prompt],
              ["en-US"], resumeArray
            ];
            const a = [null, JSON.stringify(b)];
            const obj = {
              "f.req": JSON.stringify(a)
            };
            const body = new URLSearchParams(obj);

            const response = await fetch(`https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c`, {
              headers,
              body,
              method: 'POST'
            });

            if (!response.ok) throw Error(`${response.status} ${response.statusText} ${await response.text() || `(body empty)`}`);

            const data = await response.text();


            const match = data.matchAll(/^\d+\n(.+?)\n/gm);
            const array = Array.from(match).reverse();
            if (array.length < 4 || !array[3]?.[1]) {
              throw new Error("Failed to parse Gemini response. Response format may have changed.");
            }

            const selectedArray = array[3][1];

            let parse1;
            try {
              const realArray = JSON.parse(selectedArray);
              parse1 = JSON.parse(realArray[0][2]);
            } catch (err) {
              throw new Error("Failed to parse Gemini JSON response.");
            }

            const newResumeArray = [...parse1[1], parse1[4][0][0]];
            const text = parse1[4][0][1][0]?.replace(/\*\*(.+?)\*\*/g, `*$1*`) || "(No text found)";

            const shortId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
            this.memory.set(shortId, {
              newResumeArray,
              cookie: headers.cookie
            });

            return {
              text,
              id: shortId
            };
          }
        };

        (async () => {
          try {
            if (!q) return m.reply("Please provide a prompt for Gemini.\n\nExample: .askgemini What is a black hole?");

            let conversationId = null;
            if (m.quoted && m.quoted.text) {
              const idMatch = m.quoted.text.match(/\[ID: (\d+)\]/);
              if (idMatch && idMatch[1]) conversationId = idMatch[1];
            }

            await m.reply("🧠 Thinking...");

            const result = await gemini.ask(q, conversationId);
            const replyText = `${result.text}\n\n_Reply to this message to continue._\n[ID: ${result.id}]`;

            await m.reply(replyText);
          } catch (e) {
            const errorMessage = e?.message || "An unknown error occurred.";
            await m.reply(`*An error occurred with Gemini:*\n${errorMessage}`);
          }
        })();
        break;
      case "muslimai":
        const muslimai = {
          scrape: async function(query) {
            if (!query?.trim()) return m.reply("❌ Query wajib diisi.");

            try {
              const responseSearch = await axios.post(
                "https://www.muslimai.io/api/search", {
                  query
                }, {
                  headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
                    Referer: "https://www.muslimai.io/",
                  },
                  timeout: 30000,
                }
              );

              const ayatData = responseSearch.data;
              const content = ayatData?.[0]?.content;
              if (!content) return m.reply("❌ Tidak ditemukan data untuk query ini.");

              const prompt = `Gunakan teks berikut untuk menjawab pertanyaan dalam bahasa Indonesia dengan jelas: ${query}\n\n${content}`;
              const responseAnswer = await axios.post(
                "https://www.muslimai.io/api/answer", {
                  prompt
                }, {
                  headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
                    Referer: "https://www.muslimai.io/",
                  },
                  timeout: 30000,
                }
              );

              const jawaban = responseAnswer.data;
              if (!jawaban) return m.reply("❌ Gagal mendapatkan jawaban.");

              return jawaban;
            } catch (err) {
              return m.reply(`*Terjadi kesalahan:* ${err?.message || "Unknown error"}`);
            }
          }
        };

        (async () => {
          try {
            if (!q) return m.reply("❌ Mohon masukkan query.\nContoh: .muslimai shalat witir");

            await m.reply("🧠 Mengambil jawaban...");

            const result = await muslimai.scrape(q.trim());

            if (result) {
              const replyText = `📖 Hasil jawaban untuk query: "${q}"\n\n${result}`;
              await m.reply(replyText);
            }
          } catch (e) {
            await m.reply(`*Terjadi kesalahan:* ${e?.message || "Unknown error"}`);
          }
        })();
        break;
      case "ask": {

        async function perplexed(question) {
          try {
            if (!question) {

              throw new Error('Question is required.');
            }

            const {
              data
            } = await axios.post('https://d21l5c617zttgr.cloudfront.net/stream_search', {
              user_prompt: question
            }, {
              headers: {
                origin: 'https://d21l5c617zttgr.cloudfront.net',
                referer: 'https://d21l5c617zttgr.cloudfront.net/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
              }
            });

            if (!data || typeof data !== 'string') {
              throw new Error('No result found.');
            }

            const allSteps = data.split('[/PERPLEXED-SEPARATOR]').filter(text => text.trim() !== '').map(part => {
              try {
                return JSON.parse(part);
              } catch (err) {}
            }).filter(item => item !== null);

            const result = allSteps.length > 0 ? allSteps[allSteps.length - 1] : null;
            if (!result) {
              throw new Error('No result found.');
            }

            return {
              answer: result.answer,
              sources: result.websearch_docs || []
            };
          } catch (error) {

            throw new Error(error.message);
          }
        }

        if (!q) {
          m.reply('Please provide a question.\n\n*Example:* .ask what is a large language model?');
          break;
        }

        try {
          await m.reply('🤔 Searching for an answer, please wait...');
          const result = await perplexed(q);

          let responseText = `${result.answer}`;

          if (result.sources && result.sources.length > 0) {
            responseText += '\n\n*Sources:*';
            result.sources.slice(0, 5).forEach((source, index) => {
              responseText += `\n${index + 1}. ${source.title}\n   - ${source.url}`;
            });
          }

          m.reply(responseText);

        } catch (e) {
          console.error(e);
          m.reply(`An error occurred while fetching the answer: ${e.message}`);
        }
      }
      break;
      case "publicai": {
        const question = args.join(" ");

        if (!question) {
          m.reply('Please provide a question to ask Public AI.\n\n*Example:* .publicai what is the meaning of life?');
          break;
        }

        try {
          const generateId = (length = 16) => Array.from({
            length
          }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' [Math.floor(Math.random() * 62)]).join('');

          const {
            data
          } = await axios.post('https://publicai.co/api/chat', {
            tools: {},
            id: generateId(),
            messages: [{
              id: generateId(),
              role: 'user',
              parts: [{
                type: 'text',
                text: question
              }]
            }],
            trigger: 'submit-message'
          }, {
            headers: {
              origin: 'https://publicai.co',
              referer: 'https://publicai.co/chat',
              'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
          });

          const result = data.split('\n\n')
            .filter(line => line && !line.includes('[DONE]'))
            .map(line => JSON.parse(line.substring(6)))
            .filter(line => line.type === 'text-delta')
            .map(line => line.delta)
            .join('');

          if (!result) {
            m.reply('No valid response received from the API.');
          } else {
            m.reply(result);
          }

        } catch (error) {
          console.error("PublicAI Error:", error);
          m.reply("Sorry, an error occurred while trying to get a response from Public AI.");
        }
      }
      break;
      case "turboseek": {
        if (!text) {
          m.reply("Please provide a question to search for.\n\n*Example:*\n.turboseek what is a large language model?");
          break;
        }

        await m.reply("Searching for an answer with TurboSeek AI... Please wait.");

        async function getTurboSeekResult(question) {
          try {
            const inst = axios.create({
              baseURL: 'https://www.turboseek.io/api',
              headers: {
                origin: 'https://www.turboseek.io',
                referer: 'https://www.turboseek.io/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
              }
            });

            const {
              data: sources
            } = await inst.post('/getSources', {
              question: question
            });

            const {
              data: similarQuestions
            } = await inst.post('/getSimilarQuestions', {
              question: question,
              sources: sources
            });

            const {
              data: answer
            } = await inst.post('/getAnswer', {
              question: question,
              sources: sources
            });

            const cleanAnswer = answer.match(/<p>(.*?)<\/p>/gs)?.map(match => {
              return match.replace(/<\/?p>/g, '').replace(/<\/?strong>/g, '').replace(/<\/?em>/g, '').replace(/<\/?b>/g, '').replace(/<\/?i>/g, '').replace(/<\/?u>/g, '').replace(/<\/?[^>]+(>|$)/g, '').trim();
            }).join('\n\n') || answer.replace(/<\/?[^>]+(>|$)/g, '').trim();

            return {
              success: true,
              answer: cleanAnswer,
              sources: sources.map(s => s.url),
              similarQuestions
            };
          } catch (error) {
            console.error("TurboSeek Error:", error);
            return {
              success: false,
              message: error.message
            };
          }
        }

        const result = await getTurboSeekResult(text);

        if (!result.success) {
          m.reply(`*Error:* Could not get an answer from TurboSeek. \n*Reason:* ${result.message}`);
          break;
        }

        let response = `*Answer for:* "${text}"\n\n${result.answer}`;

        if (result.sources && result.sources.length > 0) {
          response += `\n\n*Sources:*\n${result.sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        }

        if (result.similarQuestions && result.similarQuestions.length > 0) {
          response += `\n\n*Similar Questions:*\n- ${result.similarQuestions.join('\n- ')}`;
        }

        await conn.sendMessage(m.chat, {
          text: response.trim()
        }, {
          quoted: m
        });
      }
      break;
      //group
      case "kick": {
        if (!m.isGroup) return m.reply("❌ Perintah ini hanya bisa digunakan di grup.")

        const metadata = m.metadata
        if (!metadata)
          return m.rreply("⚠️ Metadata grup tidak ditemukan. Pastikan handler utama mengisi m.metadata.")

        if (!isAdmin)
          return m.reply("❌ Perintah ini hanya bisa digunakan oleh *admin grup*.")

        if (!isBotAdmin)
          return m.reply("❌ Bot harus menjadi admin untuk mengeluarkan anggota.")

        const decodeJid = (jid) => {
          if (!jid) return jid
          try {
            const decoded = jidDecode(jid)
            return decoded?.user && decoded?.server ?
              `${decoded.user}@${decoded.server}` :
              jid
          } catch {
            return jid
          }
        }

        let who
        if (m.mentionedJid?.length) who = m.mentionedJid[0]
        else if (m.quoted) who = m.quoted.sender || m.quoted.key?.participant
        else if (m.text) {
          const number = m.text.replace(/[^0-9]/g, "")
          if (number) who = number + "@s.whatsapp.net"
        }

        if (!who) return m.reply("⚠️ Tag, balas pesan, atau tulis nomor target.")
        if (who === "@s.whatsapp.net") return reply("⚠️ Target tidak valid.")

        const ownerGroup =
          metadata.owner || m.chat.split("-")[0] + "@s.whatsapp.net"

        const botJid = decodeJid(conn.user?.id)

        if (who === ownerGroup)
          return m.reply("❌ Tidak bisa mengeluarkan *Owner Grup*.")

        if (decodeJid(who) === botJid)
          return m.reply("❌ Tidak bisa mengeluarkan *Bot itu sendiri*.")

        try {
          await conn.groupParticipantsUpdate(m.chat, [who], "remove")
          m.reply(`✔ Berhasil mengeluarkan @${who.split("@")[0]}`, [who])
        } catch (e) {
          console.error("Kick Error:", e)
          m.reply("⚠️ Gagal mengeluarkan pengguna.")
        }
      }
      break

      //image
      case "papayang": {
        try {
          let res = await fetch('https://raw.githubusercontent.com/mamixx15/papayang/refs/heads/main/pap-ayang.json');
          if (!res.ok) throw new Error('Failed to fetch data');
          let json = await res.json();
          let url = json[Math.floor(Math.random() * json.length)];
          conn.sendMessage(m.chat, {
            image: {
              url: url
            },
            caption: 'Random pap ayang'
          }, {
            quoted: m
          });
        } catch (e) {
          console.error(e);
          m.reply('Maaf, terjadi kesalahan saat mengambil gambar.');
        }
      }
      break;
      case "neko": {
        try {
          let response = await fetch("https://api.waifu.pics/sfw/neko");
          if (!response.ok) throw new Error("Failed to fetch waifu URL");
          let data = await response.json();
          let imageUrl = data.url;

          conn.sendMessage(
            m.chat, {
              image: {
                url: imageUrl
              },
              caption: "Random Neko"
            }, {
              quoted: m
            }
          );
        } catch (e) {
          console.error(e);
          m.reply("Maaf, terjadi kesalahan saat mengambil gambar.");
        }
      }
      break;
      case "jiso": {
        try {
          let res = await fetch('https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image/jiso.json');
          if (!res.ok) throw new Error('Failed to fetch data');
          let json = await res.json();
          let url = json[Math.floor(Math.random() * json.length)];
          conn.sendMessage(m.chat, {
            image: {
              url: url
            },
            caption: 'Random Jiso'
          }, {
            quoted: m
          });
        } catch (e) {
          console.error(e);
          m.reply('Maaf, terjadi kesalahan saat mengambil gambar.');
        }
      }
      break;
      case "justinaxie": {
        try {
          let res = await fetch('https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image/justina.json');
          if (!res.ok) throw new Error('Failed to fetch data');
          let json = await res.json();
          let url = json[Math.floor(Math.random() * json.length)];
          conn.sendMessage(m.chat, {
            image: {
              url: url
            },
            caption: 'Random justinaxie'
          }, {
            quoted: m
          });
        } catch (e) {
          console.error(e);
          m.reply('Maaf, terjadi kesalahan saat mengambil gambar.');
        }
      }
      break;
      case "lisa": {
        try {
          let res = await fetch('https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image/lisa.json');
          if (!res.ok) throw new Error('Failed to fetch data');
          let json = await res.json();
          let url = json[Math.floor(Math.random() * json.length)];
          conn.sendMessage(m.chat, {
            image: {
              url: url
            },
            caption: 'Random Lisa'
          }, {
            quoted: m
          });
        } catch (e) {
          console.error(e);
          m.reply('Maaf, terjadi kesalahan saat mengambil gambar.');
        }
      }
      break;
      case "yulibocil": {
        try {
          let res = await fetch('https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image/yulibocil.json');
          if (!res.ok) throw new Error('Failed to fetch data');
          let json = await res.json();
          let url = json[Math.floor(Math.random() * json.length)];
          conn.sendMessage(m.chat, {
            image: {
              url: url
            },
            caption: 'Random yulibocil'
          }, {
            quoted: m
          });
        } catch (e) {
          console.error(e);
          m.reply('Maaf, terjadi kesalahan saat mengambil gambar.');
        }
      }
      break;
      case "cosplayloli": {
        try {
          let res = await fetch('https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image/cosplayloli.json');
          if (!res.ok) throw new Error('Failed to fetch data');
          let json = await res.json();
          let url = json[Math.floor(Math.random() * json.length)];
          conn.sendMessage(m.chat, {
            image: {
              url: url
            },
            caption: 'Random cosplayloli'
          }, {
            quoted: m
          });
        } catch (e) {
          console.error(e);
          m.reply('Maaf, terjadi kesalahan saat mengambil gambar.');
        }
      }
      break;
      case "cosplaysagiri": {
        try {
          let res = await fetch('https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image/cosplaysagiri.json');
          if (!res.ok) throw new Error('Failed to fetch data');
          let json = await res.json();
          let url = json[Math.floor(Math.random() * json.length)];
          conn.sendMessage(m.chat, {
            image: {
              url: url
            },
            caption: 'Random cosplaysagiri'
          }, {
            quoted: m
          });
        } catch (e) {
          console.error(e);
          m.reply('Maaf, terjadi kesalahan saat mengambil gambar.');
        }
      }
      break;
      case "cosplay": {
        try {
          let res = await fetch('https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image/cosplay.json');
          if (!res.ok) throw new Error('Failed to fetch data');
          let json = await res.json();
          let url = json[Math.floor(Math.random() * json.length)];
          conn.sendMessage(m.chat, {
            image: {
              url: url
            },
            caption: 'Random cosplay'
          }, {
            quoted: m
          });
        } catch (e) {
          console.error(e);
          m.reply('Maaf, terjadi kesalahan saat mengambil gambar.');
        }
      }
      break;
      //internet
      case "bible": {
        if (!text) {
          m.reply(`uhm.. teksnya mana?\n\ncontoh:\n${prefix}bible kejadian`);
          break;
        }

        try {

          const res = await axios.get(`https://alkitab.me/search?q=${encodeURIComponent(text)}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36"
            }
          });

          const $ = cheerio.load(res.data);
          const result = [];
          $('div.vw').each(function(a, b) {
            const teks = $(b).find('p').text().trim();
            const link = $(b).find('a').attr('href');
            const title = $(b).find('a').text().trim();
            if (teks && title) {
              result.push({
                teks,
                link,
                title
              });
            }
          });

          if (result.length === 0) {
            m.reply(`Pencarian "${text}" tidak ditemukan dalam Alkitab.`);
            break;
          }

          const caption = result.map(v => `📖 *${v.title}*\n${v.teks}`).join('\n\n────────\n\n');
          m.reply(caption);

        } catch (e) {
          console.error(e);
          m.reply('Terjadi kesalahan saat mengambil data. Silakan coba lagi nanti.');
        }
      }
      break;
      //Islam
      case "doaharian":
        try {
          let query = args.join(" ").trim();

          await conn.sendMessage(m.chat, {
            text: 'Scraping daily prayers from Kajian.net, please wait...'
          }, {
            quoted: m
          });

          const base = "https://kajian.net"
          const target = "https://kajian.net/kajian-audio/Doa/Sa%27ad%20Al%20Ghomidi/Doa%20Hisnul%20Muslim"

          const fixUrl = (u) => {
            try {
              const o = new URL(u, base)
              o.searchParams.delete("l")
              o.searchParams.delete("m")
              return o.toString()
            } catch {
              return u
            }
          }

          const resolveStream = async (url) => {
            if (url.endsWith(".m3u")) {
              const {
                data
              } = await ax.get(url)
              const line = data.split("\n").find(l => l.trim().endsWith(".mp3"))
              return line ? fixUrl(line.trim()) : fixUrl(url)
            }
            return fixUrl(url)
          }

          const scrapeDoa = async () => {
            const {
              data
            } = await axios.get(target)
            const $ = cheerio.load(data)
            const list = []

            $("a[href$='.mp3'],a[href*='.mp3?']").each((_, el) => {
              const href = $(el).attr("href")
              const title = $(el).text().trim()
              if (!href || !title) return

              let link = href.startsWith("/") ? base + href :
                href.startsWith("http") ? href :
                base + "/" + href

              list.push({
                title,
                url: fixUrl(link)
              })
            })

            const final = []
            for (let item of list) {
              final.push({
                title: item.title,
                url: await resolveStream(item.url)
              })
            }

            return final
          }

          const results = await scrapeDoa()

          if (query) {
            let found = null

            if (/^\d+$/.test(query)) {
              const idx = parseInt(query) - 1
              if (results[idx]) found = results[idx]
            }

            if (!found) {
              found = results.find(v =>
                v.title.toLowerCase().includes(query.toLowerCase())
              )
            }

            if (!found) {
              await conn.sendMessage(m.chat, {
                text: "❌ Doa tidak ditemukan."
              }, {
                quoted: m
              });
              break;
            }

            await conn.sendMessage(
              m.chat, {
                audio: {
                  url: found.url
                },
                mimetype: "audio/mpeg",
                caption: `🎧 *${found.title}*`
              }, {
                quoted: m
              }
            );
            break;
          }

          let text = '🎧 *Doa Harian (Hisnul Muslim) - Kajian.net* 🎧\n\n'

          results.forEach((v, i) => {
            text += `*${i + 1}.* ${v.title}\n`
          })

          text += `\n*Total:* ${results.length} Doa\n`
          text += `Gunakan:\n.doaharian 10\n.doaharian doa talbiyah`

          await conn.sendMessage(m.chat, {
            text
          }, {
            quoted: m
          })

        } catch (e) {
          console.log(e)
          await conn.sendMessage(m.chat, {
            text: "❌ Terjadi error"
          }, {
            quoted: m
          })
        }
        break
        //maker
      case "smeme": {
        try {
          if (!m.quoted) {
            await m.reply(
              "Reply gambar / sticker.\n\n*Contoh:*\nReply + .smeme teks atas | teks bawah"
            );
            break;
          }

          const mime = (m.quoted.msg || m.quoted).mimetype || "";
          const [topRaw, bottomRaw] = (q || "").split("|");
          const top = (topRaw || "").trim();
          const bottom = (bottomRaw || "").trim();

          if (!top && !/webp/g.test(mime)) {
            await m.reply("Teks atas wajib diisi.");
            break;
          }

          let stiker;

          if (/webp/g.test(mime)) {
            let img = await m.quoted.download?.();
            stiker = await addExif(img, global.wm || '', global.author || '');
            await conn.sendMessage(m.chat, {
              sticker: stiker
            }, {
              quoted: m
            });
            break;
          }

          if (!/image/g.test(mime)) {
            await m.reply("Reply harus berupa gambar atau sticker.");
            break;
          }

          await m.reply("🖌️ Membuat sticker meme...");

          const imgBuffer = await m.quoted.download();
          if (!imgBuffer) throw new Error("Gagal mengambil media");

          console.log("[DEBUG] MIME:", mime);
          console.log("[DEBUG] Buffer size:", imgBuffer.length);

          const form = new FormData();
          form.append("reqtype", "fileupload");
          form.append("fileToUpload", imgBuffer, "image.png");

          const uploadRes = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: form
          });

          const bgUrl = (await uploadRes.text()).trim();
          if (!bgUrl.startsWith("https://")) throw new Error("Gagal upload bg ke Catbox.moe");

          console.log("[DEBUG] BG URL:", bgUrl);

          const apiUrl =
            `https://apocalypse.web.id/maker/smemev1` +
            `?top=${encodeURIComponent(top)}` +
            `&bottom=${encodeURIComponent(bottom)}` +
            `&bg=${encodeURIComponent(bgUrl)}`;

          console.log("[DEBUG] API URL:", apiUrl);

          const res = await fetch(apiUrl);
          console.log("[DEBUG] API Status:", res.status);

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const memeBuffer = Buffer.from(await res.arrayBuffer());

          stiker = await sticker(memeBuffer, {
            packname: global.wm || '',
            author: global.author || ''
          });

          await conn.sendMessage(m.chat, {
            sticker: stiker
          }, {
            quoted: m
          });

        } catch (e) {
          console.error("[ERROR] smeme:", e);
          await m.reply(`❌ Error\n${e.message}`);
        }
      }
      break;
      case "goldplay": {
        try {
          if (!text) {
            return m.reply(
              "✏️ *Masukkan teks!*\n\nContoh:\n.goldplay Apocalypse"
            );
          }

          let apikey = global.lol;
          if (!apikey) {
            return m.reply("❌ *API Key belum diset di global.lol*");
          }

          let url = `https://api.lolhuman.xyz/api/ephoto1/goldplaybutton?apikey=${apikey}&text=${encodeURIComponent(text)}`;

          await conn.sendMessage(m.chat, {
            react: {
              text: "⏳",
              key: m.key
            }
          });

          let res = await fetch(url);
          if (!res.ok) throw new Error();

          let buffer = Buffer.from(await res.arrayBuffer());

          await conn.sendMessage(
            m.chat, {
              image: buffer,
              caption: "🏆 Gold Play Button"
            }, {
              quoted: m
            }
          );

        } catch (e) {
          m.reply("❌ *Gagal membuat Gold Play Button.*");
        } finally {
          await conn.sendMessage(m.chat, {
            react: {
              text: "",
              key: m.key
            }
          });
        }
      }
      break;
      case "silverplay": {
        try {
          if (!text) {
            return m.reply(
              "✏️ *Masukkan teks!*\n\nContoh:\n.silverplay Apocalypse"
            );
          }

          let apikey = global.lol;
          if (!apikey) {
            return m.reply("❌ *API Key belum diset di global.lol*");
          }

          let url = `https://api.lolhuman.xyz/api/ephoto1/silverplaybutton?apikey=${apikey}&text=${encodeURIComponent(text)}`;

          await conn.sendMessage(m.chat, {
            react: {
              text: "⏳",
              key: m.key
            }
          });

          let res = await fetch(url);
          if (!res.ok) throw new Error();

          let buffer = Buffer.from(await res.arrayBuffer());

          await conn.sendMessage(
            m.chat, {
              image: buffer,
              caption: "🥈 Silver Play Button"
            }, {
              quoted: m
            }
          );

        } catch (e) {
          m.reply("❌ *Gagal membuat Silver Play Button.*");
        } finally {
          await conn.sendMessage(m.chat, {
            react: {
              text: "",
              key: m.key
            }
          });
        }
      }
      break;
      case "wm": {

        async function wmSticker(m, conn, text) {
          try {
            let q = m.quoted ? m.quoted : m
            let mime = (q.msg || q).mimetype || q.mediaType || ''

            if (!/webp/.test(mime)) {
              return m.reply(
                'Reply atau kirim sticker dengan perintah wm\n\nContoh:\n.wm Pack|Author'
              )
            }

            let [packname, ...author] = (text || '').split('|')
            author = author.join('|')

            await global.loading(m, conn)

            let img = await q.download()
            if (!img) {
              return m.reply('Gagal mengambil sticker')
            }

            let sticker = await addExif(
              img,
              packname?.trim() || '',
              author?.trim() || ''
            )

            await conn.sendFile(
              m.chat,
              sticker,
              'wm.webp',
              '',
              m,
              false, {
                asSticker: true
              }
            )

          } catch (error) {
            console.error(error)
            m.reply('Terjadi kesalahan saat memberi watermark sticker')
          } finally {
            await global.loading(m, conn, true)
          }
        }

        (async () => {
          await wmSticker(m, conn, text)
        })()
      }
      break
      case 'iqc': {
        try {
          if (!text) throw 'Masukan Text Nya!'

          console.log('[DEBUG] text:', text)

          await global.loading(m, conn)

          let url = API('botcahx', '/api/maker/iqc', {
            text
          }, 'apikey')
          console.log('[DEBUG] API URL:', url)

          let res = await fetch(url)
          let json = await res.json()
          console.log('[DEBUG] API response:', json)

          if (!json.status || !json.result)
            throw '❌ Gagal mengambil gambar dari API'

          await conn.sendMessage(
            m.chat, {
              image: {
                url: json.result
              },
              caption: 'Ini Dia Kak'
            }, {
              quoted: m
            }
          )

        } catch (e) {
          console.error('[ERROR]', e)
          m.reply(e.message || e)
        } finally {
          await global.loading(m, conn, true)
          console.log('[DEBUG] Loading selesai')
        }
      }
      break
      //owner
      case "resetdb": {
        if (!isOwner) return m.reply("⚠️ Hanya owner yang bisa reset database!");

        await m.react('⏳');

        try {
          await db.reset();

          await m.react('✅');
          return m.reply("Database berhasil di-reset!");
        } catch (err) {
          console.error(err);
          return m.reply(`Terjadi kesalahan saat reset DB: ${err.message}`);
        }
      }
      break;
      case "leavegc": {
        if (!isOwner) return m.reply("⚠️ Hanya owner yang bisa menggunakan perintah ini!");

        const groupId = args[0] || m.chat;

        if (!groupId.endsWith('@g.us')) {
          await m.react('❌');
          return m.reply("❌ Invalid group ID.\nGunakan di dalam grup atau sertakan ID grup.");
        }

        try {
          await m.reply("🚪 Bot sedang keluar dari grup...");
          await conn.groupLeave(groupId);

          await m.react('✅');
          return m.reply("✅ Berhasil keluar dari grup!");
        } catch (err) {
          console.error(err);
          await m.react('❌');
          return m.reply(`❌ Gagal keluar dari grup:\n${err.message}`);
        }
      }
      break;
      case "cases": {
        if (!isOwner) return m.reply("Perintah ini khusus Owner.");
        if (!text) {
          return m.reply(`*Manajemen Case*\n\nGunakan format: \`${prefix + command} [opsi] [nama_case/kode]\`\n\n*Opsi:*\n \`--add\` : Tambah case baru (reply kode)\n \`--get\` : Ambil kode case\n \`--delete\` : Hapus case\n\n*– Daftar Case Tersedia:*\n${Case.list().map((a, i) => ` ◦ ${a}`).join("\n")}`);
        }

        if (text.includes("--add")) {
          let input = m.quoted ? m.quoted.text : text.replace("--add", "").trim();
          if (!input) return m.reply("Reply kode untuk ditambahkan ke case.");
          if (Case.add(input)) {
            m.reply("Berhasil menambahkan case. Mohon restart bot untuk menerapkan perubahan.");
          } else {
            m.reply("Gagal menambahkan case.");
          }
        } else if (text.includes("--get")) {
          let input = text.replace("--get", "").trim();
          if (!input) return m.reply("Masukkan nama case yang ingin diambil.");
          let content = await Case.get(input.toLowerCase());
          if (content) {
            m.reply(util.format(content));
          } else {
            m.reply(`Case '${input}' tidak ditemukan.`);
          }
        } else if (text.includes("--delete")) {
          let input = text.replace("--delete", "").trim();
          if (!input) return m.reply("Masukkan nama case yang ingin dihapus.");
          if (Case.delete(input.toLowerCase())) {
            m.reply("Berhasil menghapus case. Mohon restart bot untuk menerapkan perubahan.");
          } else {
            m.reply(`Case '${input}' tidak ditemukan.`);
          }
        }
      }
      break;
      //search
      case "happymod": {
        if (!q) {
          m.reply(
            "Masukkan nama aplikasi yang ingin dicari.\n\n*Contoh:*\n.happymod minecraft"
          );
          break;
        }

        const happymod = async (query) => {
          const res = await axios.get(
            "https://happymod.to/search.html?q=" + encodeURIComponent(query), {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36"
              }
            }
          );

          const $ = cheerio.load(res.data);
          const data = [];

          $(".pdt-app-box").each((_, el) => {
            const box = $(el);

            const name = box.find(".pdt-app-h3 a").text().trim();
            const relUrl =
              box.find("a.pdt-app-img").attr("href") ||
              box.find(".pdt-app-h3 a").attr("href");

            const url = relUrl ? "https://happymod.to" + relUrl : null;

            const image =
              box.find("a.pdt-app-img img").attr("data-original") ||
              box.find("a.pdt-app-img img").attr("src") ||
              null;

            const ratingText = box.find(".a-search-num").text().trim();
            const rating = ratingText ? parseFloat(ratingText) : null;

            if (name && url) {
              data.push({
                name,
                url,
                image,
                rating
              });
            }
          });

          return data;
        };

        const formatHappyMod = (apps, query) => {
          if (!apps.length) {
            return `❌ Aplikasi *${query}* tidak ditemukan di HappyMod.`;
          }

          let text = `📦 *HappyMod Search*\nQuery: *${query}*\n\n`;

          apps.slice(0, 5).forEach((app, i) => {
            text += `*${i + 1}. ${app.name}*\n`;
            if (app.rating) text += `⭐ Rating: ${app.rating}\n`;
            text += `🔗 ${app.url}\n\n`;
          });

          if (apps.length > 5) {
            text += `(+ ${apps.length - 5} aplikasi lainnya)`;
          }

          return text.trim();
        };

        try {
          await m.reply("🔍 Mencari aplikasi di HappyMod...");
          const results = await happymod(q);
          const output = formatHappyMod(results, q);

          conn.sendMessage(
            m.chat, {
              text: output
            }, {
              quoted: m
            }
          );
        } catch (err) {
          m.reply(`❌ Gagal mengambil data\n*Error:* ${err.message}`);
        }
      }
      break;
      case "kbbi": {
        if (!q) {
          m.reply(
            "Masukkan kata yang ingin dicari di KBBI.\n\n*Contoh:*\n.kbbi rumah"
          );
          break;
        }

        class KBBI {
          async login() {
            const r1 = await axios.get("https://kbbi.kemdikbud.go.id/Account/Login");
            const $ = cheerio.load(r1.data);

            const form = new FormData();
            form.append(
              "__RequestVerificationToken",
              $("input[name='__RequestVerificationToken']").attr("value")
            );
            form.append("Posel", "anakbaru8232@gmail.com");
            form.append("KataSandi", "VannRyuichi771");
            form.append("IngatSaya", "true");

            const cookies = (r1.headers["set-cookie"] || []).join("; ");

            const r2 = await axios.post(
              "https://kbbi.kemdikbud.go.id/Account/Login",
              form, {
                headers: {
                  cookie: cookies,
                  ...form.getHeaders(),
                },
                maxRedirects: 0,
                validateStatus: (s) => s >= 200 && s < 400,
              }
            );

            return (r2.headers["set-cookie"] || []).join("; ") || cookies;
          }

          async search(word) {
            const cookies = await this.login();
            const {
              data
            } = await axios.get(
              `https://kbbi.kemdikbud.go.id/entri/${encodeURIComponent(word)}`, {
                headers: {
                  cookie: cookies
                }
              }
            );

            const $ = cheerio.load(data);
            const allHomographs = [];

            $("h2[style*='margin-bottom:3px']").each((_, el) => {
              const h2 = $(el);
              const cloned = h2.clone();

              let kataTidakBaku = null;
              const nonStd = cloned.find("small:contains('bentuk tidak baku:')");
              if (nonStd.length) {
                kataTidakBaku = nonStd.find("b").text().trim();
                nonStd.remove();
              }

              const wordKey = cloned
                .text()
                .trim()
                .replace(/(\d+)/g, "^$1");

              const entry = {
                makna: [],
                kata_tidak_baku: kataTidakBaku,
                kata_turunan: [],
                gabungan_kata: [],
              };

              const list = h2
                .nextAll("ul.adjusted-par, ol.last-list-child")
                .first();

              list.find("li").each((_, li) => {
                const $li = $(li);
                if ($li.find("a.entrisButton").length) return;

                const kelas = $li.find("span[title]").attr("title");
                const clonedLi = $li.clone();
                clonedLi.find("span.entrisButton").remove();

                const text = cheerio
                  .load(clonedLi.html())
                  .text()
                  .replace(/\s+/g, " ")
                  .trim();

                if (kelas && text) {
                  entry.makna.push({
                    kelas_kata: kelas,
                    deskripsi: text,
                  });
                }
              });

              let next = list.next();
              while (
                next.length &&
                !next.is("h2") &&
                !next.is("h4:contains('Peribahasa')") &&
                !next.is("h4:contains('Idiom')")
              ) {
                if (next.is("h4")) {
                  const title = next.text();
                  const ul = next.next("ul.adjusted-par");
                  const items = ul
                    .find("li a")
                    .map((_, a) => $(a).text().trim())
                    .get();

                  if (title.includes("Kata Turunan")) entry.kata_turunan = items;
                  if (title.includes("Gabungan Kata")) entry.gabungan_kata = items;

                  next = ul.next();
                } else {
                  next = next.next();
                }
              }

              allHomographs.push({
                [wordKey]: entry
              });
            });

            return {
              kata: allHomographs
            };
          }
        }

        const formatKBBI = (data, query) => {
          let text = `📖 *KBBI — ${query}*\n\n`;

          for (const obj of data.kata) {
            const key = Object.keys(obj)[0];
            const val = obj[key];

            text += `➤ *${key.replace(/\^/g, "")}*\n`;

            if (val.makna.length) {
              const kelas = val.makna[0].kelas_kata
                .replace("Nomina:", "Nomina")
                .replace("kata benda", "(kata benda)");
              text += `${kelas}\n\n`;

              val.makna.forEach((m, i) => {
                text += `${i + 1}. ${m.deskripsi}\n`;
              });
            }

            if (val.kata_turunan.length) {
              text += `\n────────────────────\n📌 *Kata turunan:*\n`;
              text += val.kata_turunan.join(", ") + "\n";
            }

            if (val.gabungan_kata.length) {
              text += `\n────────────────────\n🔗 *Gabungan kata:*\n`;
              text += val.gabungan_kata.join(", ") + "\n";
            }

            text += `\n`;
          }

          return text.trim();
        };

        try {
          await m.reply("📚 Mencari di KBBI...");
          const kbbi = new KBBI();
          const result = await kbbi.search(q);
          const output = formatKBBI(result, q);

          await conn.sendMessage(
            m.chat, {
              text: output
            }, {
              quoted: m
            }
          );
        } catch (err) {
          m.reply(`❌ Gagal mengambil data KBBI\n*Error:* ${err.message}`);
        }
      }
      break;
      //tools
      case 'cloudku':
      case 'shortcloud': {
        if (!text) return m.reply(`Masukkan URL!\nContoh: ${prefix + command} https://example.com [custom]`);

        const [link, customCode] = text.trim().split(' ');

        const timestamp = Math.floor(Date.now() / 1000);
        const custom = customCode || Math.floor(100000 + Math.random() * 900000).toString();

        const payload = {
          url: link,
          custom,
          timestamp
        };

        const headers = {
          'Content-Type': 'application/json',
          'Origin': 'https://cloudku.click',
          'Referer': 'https://cloudku.click/',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest'
        };

        try {
          const res = await fetch('https://cloudku.click/api/link.php', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });

          const json = await res.json();
          if (!json.success || !json.data?.shortUrl) return m.reply("❌ Gagal membuat short URL.");

          const {
            shortUrl,
            originalUrl,
            created,
            key
          } = json.data;

          const caption = `
🔗 *Short URL Created!*
━━━━━━━━━━━━━━━
🌐 *Original:* ${originalUrl}
📎 *Shortened:* ${shortUrl}
🗝️ *Custom:* ${key}
🕒 *Created:* ${created}
`.trim();

          const interactive = await generateWAMessageFromContent(
            m.chat, {
              viewOnceMessage: {
                message: {
                  interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: {
                      text: caption
                    },
                    footer: {
                      text: "📎 cloudku.click link shortener"
                    },
                    nativeFlowMessage: {
                      buttons: [{
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                          display_text: "📋 Salin Link",
                          copy_code: shortUrl
                        })
                      }]
                    }
                  })
                }
              }
            }, {
              quoted: m
            }
          );

          await conn.relayMessage(m.chat, interactive.message, {
            messageId: interactive.key.id
          });

        } catch (err) {
          console.error('[SHORT ERROR]', err);
          m.reply("❌ Gagal memendekkan link.");
        }
      }
      break;
      case "ptvch": {
        if (!isOwner) {
          m.reply("⚠️ Fitur ini hanya untuk Owner!");
          break;
        }

        let q = m.quoted || m;
        let msgContent = q.msg || q;
        let mime = msgContent.mimetype || "";

        if (!/webp|image|video|gif|viewOnce/g.test(mime)) {
          m.reply(`*• Example :* ${prefix + command} *[reply/send media]*`);
          break;
        }

        let media = await q.download?.() || q.download?.media || null;
        if (!media) {
          m.reply("Media tidak bisa diunduh.");
          break;
        }

        let idChannel;
        if (global.idch2) {
          idChannel = global.idch2;
        } else {
          idChannel = "120363405995978474@newsletter";
        }

        await conn.sendMessage(
          idChannel, {
            video: media,
            ptv: true
          }, {}
        );

        m.react('✅');
      }
      break;
      case "ptv": {
        let q = m.quoted || m;
        let msgContent = q.msg || q;
        let mime = msgContent.mimetype || "";

        if (!/video|gif|viewOnce/g.test(mime)) {
          m.reply(`*• Example :* ${prefix + command} *[reply/send media]*`);
          break;
        }

        let media = await q.download?.() || q.download?.media || null;
        if (!media) {
          m.reply("Media tidak bisa diunduh.");
          break;
        }

        await conn.sendMessage(
          m.chat, {
            video: media,
            ptv: true
          }
        );

        m.react('✅');
      }
      break;
      case "jadwalbola": {
        async function jadwalSepakbola() {
          try {
            const res = await axios.get('https://www.jadwaltv.net/jadwal-sepakbola');
            const $ = cheerio.load(res.data);

            const result = [];

            $('table.table.table-bordered > tbody > tr.jklIv').each((_, el) => {
              const cleaned = $(el)
                .html()
                .replace(/<td>/g, '')
                .replace(/<\/td>/g, ' - ')
                .trim();

              const finalText = cleaned.substring(0, cleaned.length - 3);

              if (finalText) result.push(finalText);
            });

            if (!result.length) {
              return {
                code: 404,
                timestamp: Date.now(),
                message: 'Tidak ada hasil ditemukan'
              };
            }

            return {
              code: 200,
              timestamp: Date.now(),
              data: result
            };
          } catch (e) {
            return {
              code: 500,
              timestamp: Date.now(),
              message: e.message
            };
          }
        }

        const result = await jadwalSepakbola();

        if (result.code === 200 && result.data) {
          let replyText = '⚽ *Jadwal Pertandingan Sepakbola* ⚽\n\n';
          replyText += result.data.join('\n');
          m.reply(replyText);
        } else {
          m.reply(`Gagal mengambil data.\n\n*Alasan:* ${result.message}`);
        }
      }
      break;
      case "removebg": {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || '';

        if (!/image|sticker|webp/i.test(mime)) {
          return m.reply(`Reply to an image, sticker, or webp with *${prefix + command}* to remove its background.`);
        }

        await m.react('⏳');

        try {
          let media = await q.download();
          if (!media) throw new Error('Failed to download media.');


          const tmpDir = path.join(process.cwd(), 'tmp');
          fs.mkdirSync(tmpDir, {
            recursive: true
          });

          const timestamp = Date.now();
          const tempFile = path.join(tmpDir, `upload_${timestamp}.jpg`);
          fs.writeFileSync(tempFile, media);

          const form = new FormData();
          form.append('image', fs.createReadStream(tempFile));
          form.append('format', 'png');

          const res = await axios.post('https://api2.pixelcut.app/image/matte/v1', form, {
            headers: {
              ...form.getHeaders(),
              'x-client-version': 'web'
            },
            responseType: 'arraybuffer',
            timeout: 60000,
          });

          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

          return conn.sendFile(m.chat, res.data, 'removebg.png', '✅ Background removed successfully!', m);
        } catch (e) {
          console.error(e);
          return m.reply(`An error occurred: ${e.message}`);
        }
      }
      break;
      case 'idgc': {
        const args = (text || '').trim().split(/ +/);

        if (!args[0]) {
          return m.reply(`Please provide a group link.\nExample: ${prefix + command} https://chat.whatsapp.com/xxxxx`);
        }

        let link = args[0];
        let regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{22})/;
        let match = link.match(regex);

        if (!match) return m.reply('Invalid WhatsApp group link format.');

        let code = match[1];

        try {
          let groupInfo = await conn.groupGetInviteInfo(code);
          let groupId = groupInfo.id;

          m.reply(`Group ID: ${groupId}`);
        } catch (e) {
          console.error(e);
          m.reply('Failed to get group info. The link might be invalid, expired, or I might be blocked from accessing it.');
        }
      }
      break;

      case "reverse": {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || '';

        if (!mime.startsWith('audio')) {
          await m.react('❌');
          return m.reply("Kutip audionya!");
        }

        await m.react('⏳');

        try {
          const media = await q.download();
          if (!media) throw new Error('Failed to download audio.');

          const tmpDir = path.join(process.cwd(), 'tmp');
          fs.mkdirSync(tmpDir, {
            recursive: true
          });

          const timestamp = Date.now();
          const inputFile = path.join(tmpDir, `audio_${timestamp}.mp3`);
          const outputFile = path.join(tmpDir, `reversed_${timestamp}.mp3`);
          fs.writeFileSync(inputFile, media);

          exec(`ffmpeg -i ${inputFile} -filter_complex "areverse" ${outputFile}`, (err) => {
            fs.unlinkSync(inputFile);
            if (err) return m.reply(err.toString());

            const buff = fs.readFileSync(outputFile);
            conn.sendMessage(m.chat, {
              audio: buff,
              mimetype: "audio/mpeg"
            }, {
              quoted: m
            });

            fs.unlinkSync(outputFile);
          });
        } catch (err) {
          console.error(err);
          return m.reply(`An error occurred: ${err.message}`);
        }
      }
      break;
      case "ssweb": {
        const url = args[0];

        if (!url) {
          m.reply('Please provide a URL to take a screenshot of.\n\nExample: .ssweb https://example.com');
          break;
        }

        const targetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

        try {

          new URL(targetUrl);
        } catch (_) {
          m.reply('Invalid URL format. Please provide a valid URL.');
          break;
        }

        try {
          await m.reply(`Capturing screenshot for: ${targetUrl}...`);

          const ssweb = async (url, {
            width = 1280,
            height = 720,
            full_page = false,
            device_scale = 1
          } = {}) => {
            const {
              data
            } = await axios.post('https://gcp.imagy.app/screenshot/createscreenshot', {
              url: url,
              browserWidth: parseInt(width),
              browserHeight: parseInt(height),
              fullPage: full_page,
              deviceScaleFactor: parseInt(device_scale),
              format: 'png'
            }, {
              headers: {
                'content-type': 'application/json',
                referer: 'https://imagy.app/full-page-screenshot-taker/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
              }
            });
            return data.fileUrl;
          };

          const imageUrl = await ssweb(targetUrl);

          if (imageUrl) {
            await conn.sendMessage(m.chat, {
              image: {
                url: imageUrl
              },
              caption: `Screenshot of: ${targetUrl}`
            }, {
              quoted: m
            });
          } else {
            m.reply('Failed to retrieve screenshot. API did not return a valid URL.');
          }

        } catch (e) {
          console.log(e);
          m.reply('An error occurred while taking the screenshot. The website might be inaccessible or protected.');
        }
      }
      break;
      case 'calc': {
        if (!text) return m.reply(`Gunakan format .calc <query>\nContoh: .calc 10+10`);
        let val = text
          .replace(/[^0-9\-\+\*\/\(\)\.%]/g, '')
          .replace(/%/g, '/100')
          .replace(/x/gi, '*')
          .replace(/÷/gi, '/');

        if (!val) return m.reply(`Hanya mendukung angka 0-9 dan simbol -, +, *, /, (), ., %`);

        let result = '';
        try {
          result = new Function('return ' + val)();
        } catch (e) {
          if (e instanceof SyntaxError) {
            return m.reply(`Format/perhitungan salah!\n\nHanya mendukung angka 0-9 dan simbol -, +, *, /, (), ., %`);
          }
        }

        conn.sendMessage(m.chat, {
          text: `${text} = ${result}`
        }, {
          quoted: m
        });
      }
      break;
    }
  } catch (e) {
    console.error("Case Handler Error:", e);
    m.reply(`Terjadi error di case handler: ${e.message}`);
  }
};