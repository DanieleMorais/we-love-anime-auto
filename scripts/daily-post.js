// Daily robot: publishes 1 premium ANIME article (in ENGLISH) to "We Love Anime".
// 100% original content (news, reviews, guides). NO piracy, NO +18. AI anime-style images.
const CLIENT_ID = process.env.BLOGGER_CLIENT_ID;
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET;
const REFRESH = process.env.BLOGGER_REFRESH_TOKEN;
const BLOG_ID = process.env.BLOGGER_BLOG_ID;
const IMG_BASE = process.env.IMG_BASE || "";
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH || !BLOG_ID) { console.error("Missing Blogger secrets."); process.exit(1); }

const NEWS_Q = {
  Releases: "anime new season release premiere", News: "anime news trailer announcement", Reviews: "best anime recommendation to watch",
  Where: "where to watch anime streaming", Manga: "manga new chapter news", Characters: "anime character popular", Genres: "best romance action shounen anime", Culture: "otaku anime culture convention",
};
const IMG_Q = {
  Releases: "anime action vibrant neon dynamic", News: "anime colorful dramatic scene", Reviews: "anime hero portrait cinematic vibrant",
  Where: "anime cozy watching neon room", Manga: "manga panel dynamic art", Characters: "anime character portrait detailed vibrant", Genres: "anime romantic colorful sunset", Culture: "anime convention crowd colorful japan",
};
const CAT_LABEL = { Releases: "Releases", News: "News", Reviews: "Reviews", Where: "Where to Watch", Manga: "Manga", Characters: "Characters", Genres: "Genres", Culture: "Otaku Culture" };

const POOL = [
  ["the best anime of all time you must watch", "Reviews"], ["best romance anime to binge-watch", "Genres"],
  ["best action anime you absolutely need to see", "Genres"], ["the most epic shounen anime ever made", "Genres"],
  ["best comedy anime that will make you laugh", "Genres"], ["scariest horror and thriller anime to watch", "Genres"],
  ["best fantasy and magic anime to watch", "Genres"], ["best isekai anime for beginners", "Genres"],
  ["best anime available on Netflix right now", "Where"], ["where to watch anime legally and for free", "Where"],
  ["best anime on Crunchyroll to watch now", "Where"], ["how to start watching One Piece without getting lost", "Reviews"],
  ["short anime you can binge in a weekend", "Reviews"], ["best anime for beginners just getting into it", "Reviews"],
  ["anime with the best stories and writing", "Reviews"], ["best anime openings of all time", "Culture"],
  ["the strongest anime characters ever created", "Characters"], ["the most memorable anime villains of all time", "Characters"],
  ["the best female protagonists in anime", "Characters"], ["anime that surpassed their original manga", "Manga"],
  ["shounen vs seinen vs shoujo: anime genres explained", "Culture"], ["what does it mean to be an otaku", "Culture"],
  ["best sports anime that will inspire you", "Genres"], ["best mystery and detective anime to watch", "Genres"],
  ["best anime movies you have to watch", "Reviews"], ["best slice of life anime to relax", "Genres"],
  ["top anime studios and their masterpieces", "Culture"], ["anime that became a worldwide phenomenon", "Culture"],
  ["best mecha and giant robot anime", "Genres"], ["anime with endings that left fans speechless", "Reviews"],
  ["best psychological anime that mess with your mind", "Genres"], ["the best anime couples and ships", "Characters"],
  ["best anime soundtracks that are masterpieces", "Culture"], ["best manga to read if you love anime", "Manga"],
  ["most anticipated anime of 2026", "Releases"], ["anime that are trending right now worldwide", "Releases"],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
function slugify(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "anime"; }
async function getToken() { const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: REFRESH, grant_type: "refresh_token" }) }); const j = await r.json(); if (!j.access_token) throw new Error("token: " + JSON.stringify(j)); return j.access_token; }
async function titulosExistentes() { try { const r = await fetch(`https://www.blogger.com/feeds/${BLOG_ID}/posts/default?alt=json&max-results=500`, { headers: { "User-Agent": "Mozilla/5.0" } }); return (((await r.json()).feed || {}).entry || []).map(e => norm(e.title.$t)); } catch { return []; } }
async function buscarNoticias(catKey) {
  const query = NEWS_Q[catKey] || "anime news";
  try { const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:30d")}&hl=en-US&gl=US&ceid=US:en`; const xml = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(9000) })).text(); const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []; return items.slice(0, 4).map(it => { const g = re => { const m = it.match(re); return m ? m[1] : ""; }; return { titulo: (g(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || "").replace(/&amp;/g, "&"), fonte: g(/<source[^>]*>(.*?)<\/source>/) }; }).filter(n => n.titulo); } catch { return []; }
}
async function callAI(prompt) {
  const OR = process.env.OPENROUTER_API_KEY;
  if (OR) for (const model of ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct:free"]) for (let t = 0; t < 3; t++) { try { const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + OR, "Content-Type": "application/json", "HTTP-Referer": "https://weloveanimes1.blogspot.com", "X-Title": "We Love Anime" }, body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.85, max_tokens: 3500 }), signal: AbortSignal.timeout(90000) }); if (r.status === 429 || r.status >= 500) { await sleep(12000); continue; } if (!r.ok) break; const c = (await r.json()).choices?.[0]?.message?.content?.trim(); if (c && c.length > 400) return c; } catch { await sleep(5000); } }
  for (let t = 0; t < 4; t++) { try { const r = await fetch("https://text.pollinations.ai/openai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: "openai-fast", messages: [{ role: "user", content: prompt }], temperature: 0.8 }), signal: AbortSignal.timeout(90000) }); if (r.status === 429) { await sleep(20000); continue; } if (!r.ok) { await sleep(8000); continue; } const c = (await r.json()).choices?.[0]?.message?.content?.trim(); if (c && c.length > 400) return c; } catch { await sleep(6000); } }
  return null;
}
async function gerar(tema, noticias) {
  const ctx = noticias.length ? `\n\nRECENT ANIME NEWS (use as a hook if relevant, cite the source):\n${noticias.map(n => "- " + n.titulo + " (" + n.fonte + ")").join("\n")}` : "";
  const prompt = `You are a writer for a premium anime portal for English-speaking fans. Write an EXCELLENT, original and engaging article about: "${tema}".${ctx}\n\nREQUIREMENTS: 900-1400 words, passionate and informative, with real anime title examples. 5-7 <h2> with <h3>, <ul><li> and where it fits ONE <table> (e.g. a ranking). Enthusiastic fan tone, use "you". Add a <h2>Frequently Asked Questions</h2> section with 4 <h3>. IMPORTANT: do NOT provide piracy/download links; when mentioning where to watch, cite only legal platforms (Crunchyroll, Netflix, etc.). NO adult/+18 content. Do NOT invent specific dates/numbers. Do NOT identify yourself as an AI. Do NOT write html/head/body/h1 or markdown.\n\nFORMAT (exact):\nLine 1: TITULO: <title up to 65 chars>\nLine 2: RESUMO: <1-2 valuable sentences>\nThen: body in pure HTML (starting with <p>).`;
  const c = await callAI(prompt); if (!c) return null;
  const titulo = (c.match(/TITULO:\s*(.+)/i)?.[1] || tema).trim().replace(/^["#*\s]+|["*\s]+$/g, "").slice(0, 70);
  const resumo = (c.match(/RESUMO:\s*(.+)/i)?.[1] || "").trim();
  let corpo = /RESUMO:/i.test(c) ? c.replace(/^[\s\S]*?RESUMO:.*(?:\r?\n)+/i, "").trim() : c.replace(/^[\s\S]*?TITULO:.*(?:\r?\n)+/i, "").trim();
  corpo = corpo.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  return corpo.length >= 500 ? { titulo, resumo, corpo } : null;
}
function montar(art, img, tema, noticias) {
  const alt = (art.titulo || tema || "anime").replace(/"/g, "");
  const fig = `<figure style="margin:0 0 24px"><img src="${img}" alt="${alt}" title="${alt}" style="width:100%;height:auto;border-radius:14px" /></figure>`;
  const tl = art.resumo ? `<div style="background:linear-gradient(135deg,#fdeef7,#f0eefe);border-left:5px solid #db2777;padding:18px 22px;border-radius:12px;margin:0 0 26px;font-size:1.05em"><strong style="color:#be185d">✨ Quick summary:</strong> ${art.resumo}</div>` : "";
  const fontes = noticias.length ? `\n<div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:14px 18px;margin:26px 0;font-size:.9em;color:#555"><strong>Source &amp; context:</strong> based on recent anime news${noticias[0]?.fonte ? " (such as " + noticias[0].fonte + ")" : ""}.</div>` : "";
  const aviso = `\n<p style="font-size:.85em;color:#888;border-top:1px solid #eee;padding-top:14px;margin-top:26px"><em>Content for fans. Always watch through official and legal channels. 💜</em></p>`;
  return fig + tl + art.corpo + fontes + aviso;
}
const crypto = require("crypto");
function b64url(x) { return Buffer.from(x).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"); }
async function notifyGoogle(postUrl) {
  const raw = process.env.GOOGLE_SA_JSON; if (!raw || !postUrl) return;
  try { const sa = JSON.parse(raw); const now = Math.floor(Date.now() / 1000); const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })); const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/indexing", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })); const sig = b64url(crypto.sign("RSA-SHA256", Buffer.from(header + "." + claim), sa.private_key)); const tr = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: header + "." + claim + "." + sig }) }); const tk = (await tr.json()).access_token; if (!tk) return; const r = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", { method: "POST", headers: { Authorization: "Bearer " + tk, "Content-Type": "application/json" }, body: JSON.stringify({ url: postUrl, type: "URL_UPDATED" }) }); console.log("Indexing:", r.status === 200 ? "✅" : r.status); } catch (e) { console.log("Indexing err:", e.message); }
}
(async () => {
  const existentes = await titulosExistentes();
  const jaTem = tema => { const w = norm(tema).split(" ").filter(x => x.length > 3); return existentes.some(t => w.filter(x => t.includes(x)).length >= Math.max(3, Math.ceil(w.length * 0.6))); };
  const candidatos = POOL.filter(([tema]) => !jaTem(tema));
  if (!candidatos.length) { console.log("Pool empty."); return; }
  const [tema, catKey] = candidatos[Math.floor(Math.random() * candidatos.length)];
  console.log("Topic:", tema, "| cat:", catKey);
  const noticias = await buscarNoticias(catKey);
  const art = await gerar(tema, noticias);
  if (!art) { console.error("Generation failed."); process.exit(1); }
  const seed = Math.floor(Date.now() % 999999);
  const iq = IMG_Q[catKey] || "anime style vibrant colorful";
  const img = IMG_BASE ? `${IMG_BASE}/${slugify(art.titulo)}.webp?q=${encodeURIComponent(iq)}&s=${seed}` : `https://image.pollinations.ai/prompt/${encodeURIComponent(iq)}?width=1200&height=630&seed=${seed}&nologo=true`;
  const html = montar(art, img, tema, noticias);
  const label = CAT_LABEL[catKey] || "Anime";
  const token = await getToken();
  const pr = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/?isDraft=false`, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ kind: "blogger#post", title: art.titulo, content: html, labels: [label] }) });
  const pd = await pr.json();
  if (pd.url) { console.log("✅ PUBLISHED:", art.titulo, "→", pd.url); await notifyGoogle(pd.url); }
  else { console.error("FAILED:", JSON.stringify(pd.error?.message || pd).slice(0, 200)); process.exit(1); }
})().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
