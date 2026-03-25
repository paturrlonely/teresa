const API_BASE = "https://codeku.theresav.biz.id";
const LOGIN_URL = `${API_BASE}/api/admin/login`;

const USERNAME = "admin";
const PASSWORD = "theresa26";

// Ambil token dari API
async function getToken() {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  });

  if (!res.ok) {
    return { ok: false, msg: "Gagal login ke API" };
  }

  const data = await res.json();
  if (!data.success || !data.token) {
    return { ok: false, msg: "Token tidak tersedia" };
  }

  return { ok: true, token: data.token };
}

// Hapus snippet
async function deleteSnippet(token, snippetId) {
  const res = await fetch(`${API_BASE}/api/admin/snippets/${encodeURIComponent(snippetId)}`, {
    method: "DELETE",
    headers: {
      "admintoken": token
    }
  });

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, msg: `Gagal hapus snippet: ${t || res.status}` };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, msg: "Respon server tidak valid" };
  }

  return { ok: true, data };
}

const handler = async (m, { args }) => {
  const snippetId = args.join(" ").trim() || m.quoted?.text?.trim();

  if (!snippetId) {
    return m.reply(
      "◦❒ Gunakan:\n" +
      ".delsnip <snippet_id>\n" +
      "atau reply pesan berisi ID snippet"
    );
  }

  // Ambil token
  const tokenRes = await getToken();
  if (!tokenRes.ok) {
    return m.reply("◦❒ ❌ " + tokenRes.msg);
  }

  // Hapus snippet
  const delRes = await deleteSnippet(tokenRes.token, snippetId);
  if (!delRes.ok) {
    return m.reply("◦❒ ❌ " + delRes.msg);
  }

  m.reply(
    "◦❒ ✅ Snippet berhasil dihapus\n" +
    `◦❒ ID: ${snippetId}`
  );
};

handler.help = ["delsnip <id>"];
handler.tags = ["snippet"];
handler.command = /^delsnip|removesnip$/i;
handler.owner = true;
handler.description = "◦❒ Menghapus snippet via API codeku.theresav.biz.id";

export default handler;