import {
    exec
} from "child_process";
import util from "util";
import {
    createRequire
} from "module";

const require = createRequire(import.meta.url);
const execPromise = util.promisify(exec);

const handler = {};

handler.onMessage = async (m, {
    conn,
    text,
    isOwner,
    db,
    Func,
    store,
    cmd
}) => {
    if (!isOwner) return;
    if (!m.text) return;

    if (m.text.startsWith(">") || m.text.startsWith("=>")) {
        let code = m.text.slice(m.text.startsWith("=>") ? 2 : 1).trim();

        // 🔍 DEBUG: auto return kalau 1 baris tanpa return
        if (
            !code.includes("return") &&
            !code.includes(";") &&
            !code.startsWith("{")
        ) {
            code = `return (${code})`;
        }

        try {
            const result = await eval(`
        (async ({ conn, m, db, Func, store, cmd, require, exec, execPromise, global }) => {
          ${code}
        })({
          conn, m, db, Func, store, cmd,
          require, exec, execPromise,
          global
        })
      `);

            if (result === undefined) {
                await m.reply(
                    "⚠️ RESULT: undefined\n\n" +
                    "🔎 Debug kemungkinan:\n" +
                    "- Tidak ada return\n" +
                    "- Hanya ekspresi (contoh: global)\n\n" +
                    "💡 Coba:\n" +
                    "=> return global\n" +
                    "=> Object.keys(global)"
                );
                return;
            }

            await m.reply(
                typeof result === "string" ?
                result :
                util.inspect(result, {
                    depth: 4
                })
            );
        } catch (e) {
            await m.reply("❌ ERROR:\n" + util.format(e));
        }
    }
};

handler.category = "owner";
handler.owner = true;

export default handler;