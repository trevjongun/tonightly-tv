"use strict";
/* App: tracker + swipe per film e serie TV */
const C = window.CONFIG || {}, IMG = "https://image.tmdb.org/t/p/";
const $ = s => document.querySelector(s);
const jsq = s => String(s == null ? "" : s).replace(/[^\w:.\/-]/g, "");
const KEYRE = /^(movie|tv):\d{1,9}$/, POSTRE = /^\/[A-Za-z0-9_.-]{1,60}$/, DATERE = /^\d{4}-\d{2}-\d{2}$/, PHOTORE = /^[0-9a-f-]{36}\/\d{10,16}\.jpg$/;
function cleanRow(r) {
  if (!r || typeof r !== "object" || !KEYRE.test(String(r.tmdb_key || ""))) return null;
  const o = Object.assign({}, r), [m, id] = o.tmdb_key.split(":"), eps = {};
  o.media = m; o.tmdb_id = +id; o.title = String(r.title || "").slice(0, 200); o.year = /^\d{4}$/.test(String(r.year || "")) ? String(r.year) : "";
  o.poster = POSTRE.test(String(r.poster || "")) ? r.poster : null; o.genre_ids = Array.isArray(r.genre_ids) ? r.genre_ids.filter(Number.isInteger).slice(0, 12) : [];
  o.runtime = Math.max(0, Math.min(100000, Math.round(+r.runtime || 0))); o.stars = Math.max(0, Math.min(5, Math.round((+r.stars || 0) * 2) / 2));
  ["favorite", "watched", "watchlist", "hype", "skipped"].forEach(f => { o[f] = !!r[f]; }); o.watched_on = DATERE.test(String(r.watched_on || "")) ? r.watched_on : null;
  if (r.eps && typeof r.eps === "object") Object.keys(r.eps).slice(0, 5000).forEach(k => { if (/^\d{1,3}-\d{1,4}$/.test(k) && r.eps[k]) eps[k] = true; else if (/^_[nmt]$/.test(k) && Number.isFinite(+r.eps[k])) eps[k] = +r.eps[k]; });
  o.eps = eps; if (r.note) o.note = String(r.note).slice(0, 500); else delete o.note;
  o.tags = Array.isArray(r.tags) ? r.tags.map(x => String(x).slice(0, 24)).filter(Boolean).slice(0, 12) : []; if (!o.tags.length && !("tags" in r)) delete o.tags;
  if (!r.feat || typeof r.feat !== "object" || Array.isArray(r.feat)) o.feat = null;
  if (r.diary && typeof r.diary === "object" && !Array.isArray(r.diary)) { const d = r.diary, o2 = {}; if (typeof d.w === "string") o2.w = d.w.slice(0, 100); if (["casa", "cinema", "amici", "viaggio", "altro"].includes(d.p)) o2.p = d.p; if (typeof d.m === "string" && d.m.length <= 4) o2.m = d.m; if (/^[a-z]{3}$/.test(d.e || "")) o2.e = d.e; if (/^(cinema|pirata|noleggio|altro|p\d{1,7})$/.test(d.s || "")) o2.s = d.s; if (typeof d.c === "string" && d.c.trim()) o2.c = d.c.slice(0, 280); if (/^[0-9a-f-]{36}\/[a-z0-9-]{3,40}\.jpg$/.test(d.pp || "")) o2.pp = d.pp; if (!sb && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(d.ph || "") && d.ph.length < 120000) o2.ph = d.ph; o.diary = Object.keys(o2).length ? o2 : null; } else o.diary = null;
  o.why = Array.isArray(r.why) ? r.why.filter(x => typeof x === "string" && /^[a-z]{2,10}$/.test(x)).slice(0, 8) : []; if (!o.why.length) delete o.why;
  return o;
}
const cleanTitles = obj => { const out = {}; Object.values(obj || {}).forEach(r => { const c = cleanRow(r); if (c) out[c.tmdb_key] = c; }); return out; };
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const vib = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
const APP = C.APP_NAME || "Tonightly";
const ICO = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  tv: '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M8 2l4 4 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M5 12l5 5L20 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  dots: '<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 20a6 6 0 0 0-3-5"/>',
  cards: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  reply: '<path d="M10 8L4 13l6 5M4 13h10a6 6 0 0 1 6 6"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
  euro: '<path d="M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" stroke-width="3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>'
};
const ic = (n, s) => `<svg class="i" viewBox="0 0 24 24" width="${s || 20}" height="${s || 20}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n] || ""}</svg>`;
let LMN = 0;
const logoMark = n => { const id = "lmg" + (++LMN); return `<svg viewBox="0 0 64 64" width="${n}" height="${n}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4F46E5"/><stop offset=".55" stop-color="#F43F5E"/><stop offset="1" stop-color="#F59E0B"/></linearGradient><mask id="${id}m"><rect width="64" height="64" fill="#fff"/><circle cx="39" cy="27" r="17" fill="#000"/></mask></defs><rect width="64" height="64" rx="16" fill="url(#${id})"/><circle cx="29" cy="33" r="19" fill="#fff" mask="url(#${id}m)"/><path d="M38 21v14l11-7z" fill="#fff"/></svg>`; };
const UI = Object.assign({ theme: "dark", acc: "#6366F1", fs: 1 }, lsGet("cm_ui", {}));
const ACCS = [["#6366F1", "Indaco"], ["#FF2E63", "Rosa"], ["#7C5CFF", "Viola"], ["#1EA7FD", "Azzurro"], ["#06D6A0", "Verde"], ["#FF8A3D", "Arancio"], ["#F5C400", "Oro"]];
function applyUI() {
  const r = document.documentElement; let th = UI.theme;
  if (th === "auto") th = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  r.dataset.theme = th; r.style.setProperty("--pri", UI.acc); r.style.setProperty("--fs", UI.fs);
  const n = parseInt(UI.acc.slice(1), 16), y = ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  r.style.setProperty("--onpri", y > 150 ? "#14110a" : "#fff");
  const m = document.querySelector("meta[name=theme-color]"); if (m) m.content = th === "light" ? "#f4f5f8" : "#06070a";
}
applyUI();
document.title = APP; { const lg = document.querySelector(".logo"); if (lg) lg.innerHTML = logoMark(28) + "<span class=\"lgt\"><b>" + esc(APP) + "</b><small>Catalogo unico</small></span>"; }
const sb = (C.SUPABASE_URL && window.supabase) ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
let R = lsGet("cm_region", C.REGION || "IT");
let user = null, S = { subs: [], titles: {}, profile: { name: "", avatar: 0 } };
let othSel = 0, view = "home", setTab = "prof", trkTab = "watch", wlNow = false, tok = 0, dragging = false;
let GN = {}, GL = { movie: [], tv: [] }, PROV = null, ITEMS = {}, imsg = "", imsgMiss = [], svcSel = 0, affC = null;
const memo = new Map();
const NAV = [["home", "home", "Home"], ["movie", "film", "Film"], ["tv", "tv", "Serie TV"], ["list", "list", "La mia lista"], ["prof", "user", "Profilo"]];
/* ---------- Cronologia (tasto indietro) ---------- */
let PERSON = 0; const OVS = [];
try { history.scrollRestoration = "manual"; } catch (e) {}
const NAVS = () => ({ v: view, t: tvTab, s: setTab, p: PERSON });
function navPush() {
  try {
    const cur = history.state, n = NAVS();
    if (cur && !cur.ov && cur.v === n.v && cur.t === n.t && cur.s === n.s && cur.p === n.p) { history.replaceState(Object.assign(n, { y: 0 }), ""); return; }
    history.replaceState(Object.assign({}, cur || n, { y: window.scrollY }), ""); history.pushState(Object.assign(n, { y: 0 }), "");
  } catch (e) {}
}
function ovOpen(k, fn) { const o = OVS.find(x => x.k === k); if (o) { o.fn = fn; return; } OVS.push({ k, fn }); try { history.pushState(Object.assign({}, history.state || NAVS(), { ov: 1 }), ""); } catch (e) {} }
function ovBack(k) { const i = OVS.findIndex(x => x.k === k); if (i < 0) return false; if (i === OVS.length - 1) { try { history.back(); return true; } catch (e) {} } const o = OVS.splice(i, 1)[0]; o.fn(); return true; }
function closeAllOv() { OVS.splice(0).reverse().forEach(o => o.fn()); }
addEventListener("popstate", async e => {
  if (OVS.length) { OVS.pop().fn(); return; }
  const st = e.state; if (!st) return; if (st.ov) { history.back(); return; }
  view = st.v; tvTab = st.t; setTab = st.s; PERSON = st.p || 0;
  if (view === "swipe") { D.cards = []; D.pages = {}; D.hist = []; }
  await render(); window.scrollTo(0, st.y || 0);
});
try { history.replaceState({ v: view, t: null, s: "prof", p: 0, y: 0 }, ""); } catch (e) {}
const NM = { together: "home", person: "home", soon: "list", swipe: "home", time: "home", other: "home", tonight: "home", plan: "home", diary: "list", onb: "home", set: "prof", friends: "prof", stats: "prof" };
const PR = () => P();
const savePrefs = () => saveProfile();
const P = () => S.profile || (S.profile = { name: "", avatar: 0 });
const AV = [["🦊", "#ff9a3c", "#e8590c"], ["🐼", "#868e96", "#212529"], ["🐙", "#b197fc", "#7048e8"], ["🦉", "#a9856a", "#5c4033"], ["🐯", "#ffd43b", "#f08c00"], ["🐧", "#74c0fc", "#1c7ed6"], ["🦄", "#faa2c1", "#be4bdb"], ["🐸", "#8ce99a", "#2f9e44"], ["🐱", "#ffa8a8", "#e03131"], ["🐻", "#c9a27e", "#7f5539"], ['<svg viewBox="0 0 64 64" width="64%" height="64%" aria-hidden="true"><g fill="#fff" stroke="#dfe6f3" stroke-width="1"><path d="M31 30C27 17 16 8 8 10c-6 2-4 14 4 19 5 3 12 4 19 1z"/><path d="M33 30c4-13 15-22 23-20 6 2 4 14-4 19-5 3-12 4-19 1z"/><path d="M31 33c-8-1-17 3-18 11-1 6 6 9 11 5 4-3 6-9 7-16z"/><path d="M33 33c8-1 17 3 18 11 1 6-6 9-11 5-4-3-6-9-7-16z"/></g><g fill="#c9d3e6"><circle cx="15" cy="17" r="2.4"/><circle cx="49" cy="17" r="2.4"/></g><rect x="30.6" y="19" width="2.8" height="28" rx="1.4" fill="#4a4f63"/><path d="M31 20c-2-5-5-8-8-9M33 20c2-5 5-8 8-9" stroke="#4a4f63" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>', "#8fa6c9", "#2b3a5c"], ['<svg viewBox="0 0 64 64" width="94%" height="94%" aria-hidden="true"><defs><linearGradient id="szH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#43464f"/><stop offset="1" stop-color="#15161b"/></linearGradient><linearGradient id="szB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4e58"/><stop offset="1" stop-color="#17181d"/></linearGradient><linearGradient id="szE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f3f7"/><stop offset="1" stop-color="#9ba2ae"/></linearGradient><radialGradient id="szI" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3b2a20"/><stop offset="1" stop-color="#050506"/></radialGradient></defs><path d="M17 18C13 11 17 6 26 8l-1 13c-4 0-7-1-8-3z" fill="#0e0f13"/><path d="M47 18c4-7 0-12-9-10l1 13c4 0 7-1 8-3z" fill="#0e0f13"/><path d="M19.5 15Q32 8 44.5 15Q49.5 23 48 34H16Q14.5 23 19.5 15z" fill="url(#szH)"/><ellipse cx="25" cy="27.2" rx="4.4" ry="4.6" fill="#2d3038"/><ellipse cx="39" cy="27.2" rx="4.4" ry="4.6" fill="#2d3038"/><ellipse cx="25" cy="27.6" rx="3.4" ry="3.7" fill="url(#szI)"/><ellipse cx="39" cy="27.6" rx="3.4" ry="3.7" fill="url(#szI)"/><circle cx="26.3" cy="26.2" r="1.25" fill="#fff"/><circle cx="40.3" cy="26.2" r="1.25" fill="#fff"/><path d="M17.5 24.5Q18.5 16.5 25 16.5Q30.5 16.5 31.5 22Q28.5 20.2 25 21Q20.5 21.5 17.5 24.5z" fill="url(#szE)"/><path d="M46.5 24.5Q45.5 16.5 39 16.5Q33.5 16.5 32.5 22Q35.5 20.2 39 21Q43.5 21.5 46.5 24.5z" fill="url(#szE)"/><path d="M14.5 32Q32 25.5 49.5 32Q52 45 47 51Q46 55 42.5 54Q41 58 37 56.5Q35 59.5 32 58Q29 59.5 27 56.5Q23 58 21.5 54Q18 55 17 51Q12 45 14.5 32z" fill="url(#szB)"/><path d="M32 34Q23.5 32.5 18 39Q25 37 32 40.5zM32 34Q40.5 32.5 46 39Q39 37 32 40.5z" fill="#6f7581"/><path d="M23 46q-1 3-2.5 4.5M28 48q0 3.5-1.2 5.5M36 48q0 3.5 1.2 5.5M41 46q1 3 2.5 4.5" stroke="#5f6470" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M30.3 42.5Q32 47.5 33.7 42.5z" fill="#ff8fa3"/><path d="M27.2 32.6Q32 30.3 36.8 32.6Q36.3 36.8 32 37.8Q27.7 36.8 27.2 32.6z" fill="#050506"/><ellipse cx="30.4" cy="32.7" rx="1.7" ry=".85" fill="#80858f"/></svg>', "#ffe8cc", "#ff922b"]];
const avatarHtml = (i, sz) => { const a = AV[i] || AV[0]; return `<span class="av" style="width:${sz}px;height:${sz}px;font-size:${Math.round(sz * .55)}px;background:linear-gradient(135deg,${a[1]},${a[2]})">${a[0]}</span>`; };

// foto personale (solo per te: negli spazi condivisi resta l'avatar)
const okPhoto = s => typeof s === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(s) && s.length < 90000;
const avatarMe = sz => { const ph = P().photo; return okPhoto(ph) ? `<span class="av" style="width:${sz}px;height:${sz}px"><img src="${ph}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover"></span>` : avatarHtml(P().avatar, sz); };
async function setPhoto(inp) {
  const f = inp.files && inp.files[0]; inp.value = ""; if (!f) return;
  if (!/^image\//.test(f.type)) return toast("Scegli un file immagine");
  try {
    const url = URL.createObjectURL(f), im = new Image(); await new Promise((ok, ko) => { im.onload = ok; im.onerror = ko; im.src = url; });
    const n = 256, c = document.createElement("canvas"); c.width = c.height = n; const s = Math.min(im.width, im.height), cx = c.getContext("2d");
    cx.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, n, n); URL.revokeObjectURL(url);
    const d = c.toDataURL("image/jpeg", .82); if (!okPhoto(d)) throw 0;
    P().photo = d; await saveProfile(); toast("Foto aggiornata"); render(); whoUpdate();
  } catch (e) { toast("Non riesco a leggere questa foto"); }
}
function delPhoto() { delete P().photo; saveProfile(); render(); }
/* ---------- TMDB ---------- */
function tmdb(path, params) {
  if (!C.TMDB_KEY || C.TMDB_KEY.startsWith("INCOLLA")) return Promise.reject(new Error("Chiave TMDB mancante: compila config.js"));
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", C.TMDB_KEY); u.searchParams.set("language", "it-IT");
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== "") u.searchParams.set(k, v); });
  const key = u.toString();
  if (!memo.has(key)) memo.set(key, fetch(key).then(r => { if (!r.ok) throw new Error("TMDB " + r.status); return r.json(); }).catch(e => { memo.delete(key); throw e; }));
  return memo.get(key);
}
const norm = (x, m) => ({ key: m + ":" + x.id, media: m, id: x.id, title: x.title || x.name || "", year: (x.release_date || x.first_air_date || "").slice(0, 4), poster: x.poster_path, backdrop: x.backdrop_path, overview: x.overview || "", genre_ids: x.genre_ids || [], lang: x.original_language || "", vote: x.vote_average || 0, vc: x.vote_count || 0 });
const rowItem = t => ({ key: t.tmdb_key, media: t.media, id: t.tmdb_id, title: t.title, year: t.year, poster: t.poster, genre_ids: t.genre_ids || [] });
const byKey = k => ITEMS[k] || (S.titles[k] ? rowItem(S.titles[k]) : null);
const full = it => tmdb("/" + it.media + "/" + it.id, { append_to_response: "credits,videos,keywords,watch/providers", include_video_language: "it,en" });
async function genres() {
  if (Object.keys(GN).length) return;
  const [a, b] = await Promise.all([tmdb("/genre/movie/list"), tmdb("/genre/tv/list")]);
  [...a.genres, ...b.genres].forEach(g => { GN[g.id] = GN[g.id] || g.name; });
  Object.assign(GN, { 10759: "Azione e avventura", 10765: "Fantascienza e fantasy", 10768: "Guerra e politica", 10762: "Bambini", 878: "Fantascienza", 14: "Fantasy", 10770: "Film TV" });
  const BAD = new Set([10770, 10763, 10767, 10764, 10766]);
  GL.movie = a.genres.map(g => g.id).filter(i => !BAD.has(i)); GL.tv = b.genres.map(g => g.id).filter(i => !BAD.has(i));
}
const SVC_URL = Object.assign({
  8: "https://www.netflix.com/search?q={q}", 119: "https://www.primevideo.com/search?phrase={q}", 337: "https://www.disneyplus.com/search/{q}",
  350: "https://tv.apple.com/it/search?term={q}", 531: "https://www.paramountplus.com/it/search/?q={q}", 1899: "https://www.max.com/it/it/search?q={q}",
  359: "https://www.mediasetinfinity.mediaset.it/ricerca?q={q}", 222: "https://www.raiplay.it/ricerca.html?q={q}", 283: "https://www.crunchyroll.com/search?q={q}"
}, C.SVC_SEARCH || {});
let ALIAS = {}, _ms = null, _mk = "";
const canon = n => (n || "").toLowerCase().replace(/amazon channel|apple tv channel|roku premium channel|with ads|\bbasic\b|\bstandard\b|\bplus\b|\+|\bamazon\b|\bhbo\b|[^a-z0-9]/g, "");
const cleanName = n => n.replace(/\s+(Amazon|Apple TV|Roku Premium) Channel/i, "").replace(/\s+(Basic |Standard )?with Ads/i, "").trim().replace(/^Amazon (Prime )?Video$/i, "Prime Video");
// la stessa piattaforma in più versioni (es. Prime Video e Prime Video con pubblicità) diventa una sola voce
const provDedupe = l => { const seen = new Set(), out = []; (l || []).forEach(p => { const c = canon(p.provider_name); if (!c || seen.has(c)) return; seen.add(c); out.push(Object.assign({}, p, { provider_name: cleanName(p.provider_name) })); }); return out; };
const isPrimeStore = p => /amazon video|prime video/i.test((p && p.provider_name) || "");
const rbOf = a => { const r = (a.rent || []).find(isPrimeStore), b = (a.buy || []).find(isPrimeStore); return r || b ? { rent: !!r, buy: !!b, logo: (r || b).logo_path, id: (r || b).provider_id } : null; };
const primeSub = () => (PROV || []).some(p => S.subs.includes(p.provider_id) && canon(p.provider_name) === "primevideo");
const rentOn = () => F.rent !== false && primeSub() && (view === "movie" || view === "tv");
const mineSet = () => { const k = S.subs.join(",") + "|" + Object.keys(ALIAS).length; if (_ms && k === _mk) return _ms; const o = new Set(); S.subs.forEach(id => { o.add(id); (ALIAS[id] || []).forEach(a => o.add(a)); }); _mk = k; return (_ms = o); };
const isMine = id => mineSet().has(id);
const mineIds = () => [...mineSet()];
/* filtro dei servizi per i consigli: con "🏴‍☠️ Guardo tutto" nessun filtro */
const provF = () => (S.profile && S.profile.pirate) ? [] : mineIds();
async function loadProv() {
  if (PROV) return PROV;
  const r = await tmdb("/watch/providers/movie", { watch_region: R });
  const pr = p => { const v = (p.display_priorities || {})[R] != null ? p.display_priorities[R] : p.display_priority; return v == null ? 999 : v; };
  const ord = C.PROV_ORDER || [], rk = p => { const i = ord.indexOf(p.provider_id); return i < 0 ? 1000 + pr(p) : i; };
  const seen = {}, out = []; ALIAS = {};
  r.results.slice().sort((a, b) => rk(a) - rk(b)).forEach(p => {
    const c = canon(p.provider_name); if (!c) return;
    if (seen[c]) { (ALIAS[seen[c].provider_id] = ALIAS[seen[c].provider_id] || []).push(p.provider_id); return; }
    const o = Object.assign({}, p, { provider_name: cleanName(p.provider_name), main: ord.includes(p.provider_id) }); seen[c] = o; out.push(o);
  });
  return (PROV = out.slice(0, 60));
}
const flatOf = d => provDedupe(((((d || {})["watch/providers"] || {}).results || {})[R] || {}).flatrate || []);
const rbFull = d => rbOf((((d || {})["watch/providers"] || {}).results || {})[R] || {});
const mineOf = d => flatOf(d).filter(p => isMine(p.provider_id));
const tvMeta = d => ({ n: d.number_of_episodes || 1, m: (d.episode_run_time && d.episode_run_time[0]) || (d.last_episode_to_air && d.last_episode_to_air.runtime) || 45 });
const runtimeOf = (d, m) => m === "tv" ? tvMeta(d).m : (d.runtime || 0);
const fmtMin = m => m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m";
const metaOf = (d, m) => m === "tv" ? (d.number_of_seasons ? d.number_of_seasons + (d.number_of_seasons > 1 ? " stagioni" : " stagione") : "Serie") + " · " + tvMeta(d).m + "m a episodio" : (d.runtime ? fmtMin(d.runtime) : "");
function pickVideo(d) { const vs = ((d.videos || {}).results || []).filter(v => v.site === "YouTube"); return vs.find(x => x.type === "Trailer" && x.official) || vs.find(x => x.type === "Trailer") || vs.find(x => x.type === "Teaser") || vs[0]; }
async function lightProvs(it) { try { const r = await tmdb("/" + it.media + "/" + it.id + "/watch/providers"), a = (r.results || {})[R] || {}, f = provDedupe(a.flatrate || []); f.link = a.link; f.rb = rbOf(a); return f; } catch (e) { const f = []; return f; } }
async function fillProv() {
  await Promise.all([...document.querySelectorAll(".prov[data-k]")].map(async el => {
    const it = byKey(el.dataset.k); if (!it) return;
    const f = await lightProvs(it), o = el.dataset.o === "1";
    if (el.classList.contains("sv")) { const mm = f.filter(p => isMine(p.provider_id)); el.innerHTML = mm.length ? mm.slice(0, 3).map(p => `<img src="${IMG}w45${p.logo_path}" alt="" width="20" height="20">`).join("") + `<span class="ok">Guarda su ${esc(mm.map(p => p.provider_name).join(", "))}</span>` : f.length ? `<span>Su ${esc(f[0].provider_name)}${f.length > 1 ? " e altri" : ""} · non nei tuoi abbonamenti</span>` : `<span>Non incluso in abbonamento</span>`; return; }
    if (el.classList.contains("pv")) { const m = f.filter(p => o ? !isMine(p.provider_id) : isMine(p.provider_id)); if (!m.length && !o && f.rb && primeSub()) { el.innerHTML = `<span class="eur" title="${f.rb.rent ? "A noleggio" : "In vendita"} su Prime Video">€</span>`; return; } el.innerHTML = m.slice(0, 2).map(p => `<img src="${IMG}w45${p.logo_path}" alt="${esc(p.provider_name)}" title="${esc(p.provider_name)}" width="20" height="20">`).join("") + (m.length > 2 ? `<b>+${m.length - 2}</b>` : ""); return; }
    el.innerHTML = f.filter(p => o ? !isMine(p.provider_id) : isMine(p.provider_id)).map(p => `<a href="${esc(provHref(p, it, f.link))}" data-pkg="${PKG[p.provider_id] || ""}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Guarda su ${esc(p.provider_name)}"><img src="${IMG}w45${p.logo_path}" alt="${esc(p.provider_name)}" width="22" height="22"></a>`).join("");
  }));
}

/* ---------- Dati: locale oppure Supabase ---------- */
const LS = "streamunico_v2";
const localSave = () => lsSet(LS, S);
async function loadAll() {
  affC = null;
  if (!sb) { const l = lsGet(LS, {}); S = Object.assign({ subs: [], titles: {} }, l); S.titles = cleanTitles(S.titles); S.subs = (Array.isArray(S.subs) ? S.subs : []).filter(Number.isInteger); P(); return; }
  const [a, b] = await Promise.all([
    sb.from("settings").select("*").eq("user_id", user.id).maybeSingle(),
    sb.from("titles").select("*").eq("user_id", user.id)
  ]);
  const lp = lsGet(LS + "_p" + user.id, {}), d = a.data || {};
  S = { subs: (Array.isArray(d.subs) ? d.subs : []).filter(Number.isInteger), titles: {}, profile: Object.assign({}, lp, d.prefs || {}, { name: d.name || lp.name || "", avatar: d.avatar != null ? d.avatar : (lp.avatar || 0) }) };
  (b.data || []).forEach(r => { delete r.user_id; const c = cleanRow(r); if (c) S.titles[c.tmdb_key] = c; });
  // username: chi non l'ha ancora scelto (o è appena arrivato) lo sceglie alla prima apertura
  S.uname = typeof d.username === "string" ? d.username : ""; S.freq = ["all", "code", "none"].includes(d.friend_req) ? d.friend_req : "all"; S.disc = d.discoverable !== false; S.sug = d.suggest !== false; S.needU = a.data ? ("username" in a.data && !a.data.username) : !a.error;
}
async function saveSubs() { if (!sb) return localSave(); const r = await sb.from("settings").upsert({ user_id: user.id, subs: S.subs }); if (r.error) throw r.error; }
async function saveProfile() {
  lsSet(LS + "_p" + (user ? user.id : ""), P());
  if (!sb) return localSave();
  const r = await sb.from("settings").upsert({ user_id: user.id, name: P().name, avatar: P().avatar, prefs: { photo: okPhoto(P().photo) ? P().photo : "", goal: P().goal || 0, done: !!P().done, genres: P().genres || [], fmt: P().fmt || "all", lists: P().lists || [], prices: P().prices || {}, plans: P().plans || {}, tgk: P().tgk || undefined, alerts: P().alerts || [], lx: P().lx || undefined, nocommunity: !!P().nocommunity, pirate: !!P().pirate } });
  if (r.error) toast("Profilo salvato solo su questo dispositivo: esegui l’aggiornamento SQL");
}
let SQLW = 0;
async function saveTitles(keys) {
  if (!sb) return localSave();
  const up = [], del = [];
  keys.forEach(k => { const t = S.titles[k]; t ? up.push(Object.assign({}, t, { user_id: user.id })) : del.push(k); });
  if (up.length) {
    let r = await sb.from("titles").upsert(up);
    if (r.error) { // database non ancora aggiornato: salvo comunque, senza mezze stelle e motivi del voto
      const r2 = await sb.from("titles").upsert(up.map(o => { const c = Object.assign({}, o); delete c.why; delete c.diary; c.stars = Math.round(c.stars || 0); return c; }));
      if (!r2.error) { if (!SQLW) { SQLW = 1; toast("Per salvare mezze stelle, motivi del voto e diario esegui l’aggiornamento SQL"); } r = r2; }
    }
    if (r.error) throw r.error;
  }
  if (del.length) { const r = await sb.from("titles").delete().eq("user_id", user.id).in("tmdb_key", del); if (r.error) throw r.error; }
}
const blank = it => ({ feat: null, tmdb_key: it.key, media: it.media, tmdb_id: it.id, title: it.title, year: it.year || "", poster: it.poster || null, genre_ids: it.genre_ids || [], runtime: 0, favorite: false, watched: false, stars: 0, watched_on: null, watchlist: false, hype: false, skipped: false, eps: {} });
const epCount = t => Object.keys(t.eps || {}).filter(x => x[0] !== "_").length;
const minsOf = t => t.watched ? (t.runtime || 0) : (t.media === "tv" ? epCount(t) * ((t.eps || {})._m || 45) : 0);
async function put(it, p) {
  const k = it.key, t = Object.assign(blank(it), S.titles[k], p); affC = null;
  const keep = t.favorite || t.watched || t.watchlist || t.hype || t.skipped || epCount(t) > 0 || t.note || (t.tags || []).length; if (t.why && !t.why.length) delete t.why;
  if (!keep) delete S.titles[k]; else S.titles[k] = t;
  try { await saveTitles([k]); } catch (e) { toast("Salvataggio non riuscito: hai eseguito l’aggiornamento SQL?"); }
  if (S.titles[k] && !S.titles[k].feat) enrich(it);
  return t;
}

/* ---------- Motore di raccomandazione ---------- */
const FEAT = new Map();
const decOf = y => { y = +y; return y ? "y" + Math.floor(y / 10) * 10 : ""; };
const rtB = m => !m ? "" : m <= 40 ? "r1" : m <= 100 ? "r2" : m <= 140 ? "r3" : "r4";
const IMP = { g: 1, gp: .7, l: .35, y: .3, m: .4, d: .9, c: .45, k: .55, r: .2 };
var featOf; /* definita più avanti */
var featKeys; /* definita più avanti */
const titleFeat = t => Object.assign({ g: t.genre_ids || [], y: t.year, m: t.media }, t.feat || {}, { m: t.media });
const itFeat = it => Object.assign({ g: it.genre_ids || [], l: it.lang, y: it.year }, FEAT.get(it.key) || {}, { m: it.media });
var signal; /* definita più avanti */
var decay; /* definita più avanti */
var affData; /* definita più avanti */
var scoreOf; /* definita più avanti */
const scoreIt = it => scoreOf(it, itFeat(it));
var matchPct; /* definita più avanti */
var featFor; /* definita più avanti */
async function enrich(it) {
  const t = S.titles[it.key]; if (!t || t.feat) return;
  const f = await featFor(it); const t2 = S.titles[it.key]; if (!f || !t2) return;
  t2.feat = f; affC = null; saveTitles([it.key]).catch(() => {});
}
const seedTitles = () => Object.values(S.titles).filter(t => t.watched && t.stars >= 4).sort((a, b) => (b.stars - a.stars) || (b.watched_on || "").localeCompare(a.watched_on || "")).slice(0, 3);
const availMine = async it => (await lightProvs(it)).some(p => isMine(p.provider_id));
var recItems; /* definita più avanti */

/* ---------- Filtri ---------- */
const F0 = { media: "all", genres: [], yf: "", yt: "", minR: 0, maxRt: 0, svc: [], lang: "", sort: "aff", hide: true, rent: true };
let F = Object.assign({}, F0, lsGet("cm_filters", {})), FT = null;
const fCount = () => (F.media !== "all") + (F.genres.length > 0) + (!!(F.yf || F.yt)) + (F.minR > 0) + (F.maxRt > 0) + (F.svc.length > 0) + (!!F.lang) + (F.sort !== "aff") + (!F.hide);
const TVMAP = { 28: 10759, 12: 10759, 878: 10765, 14: 10765, 10752: 10768 };
const tvG = ids => { const o = new Set(); ids.forEach(g => { const t = TVMAP[g] || g; if (GL.tv.includes(t)) o.add(t); }); return [...o]; };
const mvG = ids => ids.filter(g => GL.movie.includes(g));
function dq(m, o) {
  o = o || {};
  const p = { watch_region: R, with_watch_monetization_types: "flatrate" };
  let prov;
  if (o.other) { prov = o.svc ? [o.svc] : (PROV || []).map(x => x.provider_id).filter(id => !isMine(id)); if (!prov.length) return null; }
  else prov = F.svc.length ? F.svc : provF();
  const pir = !o.other && !F.svc.length && !!P().pirate; if (pir) { delete p.watch_region; delete p.with_watch_monetization_types; }
  if (!o.other && !pir && rentOn() && (!F.svc.length || F.svc.some(id => canon(((PROV || []).find(x => x.provider_id === id) || {}).provider_name) === "primevideo"))) { prov = prov.concat(10); p.with_watch_monetization_types = "flatrate|rent|buy"; }
  if (prov.length) p.with_watch_providers = prov.join("|");
  const dk = m === "tv" ? "first_air_date" : "primary_release_date", gs = o.gs || (o.g ? [o.g] : F.genres);
  if (gs.length) { const g = m === "tv" ? tvG(gs) : mvG(gs); if (!g.length) return null; p.with_genres = g.join("|"); }
  if (F.yf) p[dk + ".gte"] = F.yf + "-01-01";
  if (F.yt) p[dk + ".lte"] = F.yt + "-12-31";
  if (F.minR) { p["vote_average.gte"] = F.minR; p["vote_count.gte"] = 100; }
  if (F.maxRt) p["with_runtime.lte"] = F.maxRt;
  if (o.rt) { p["with_runtime.gte"] = o.rt[0]; p["with_runtime.lte"] = o.rt[1]; }
  if (F.lang) p.with_original_language = F.lang;
  if (F.sort === "new") { p.sort_by = dk + ".desc"; if (!F.yt) p[dk + ".lte"] = today(); p["vote_count.gte"] = Math.max(p["vote_count.gte"] || 0, 20); }
  else if (F.sort === "top") { p.sort_by = "vote_average.desc"; p["vote_count.gte"] = Math.max(p["vote_count.gte"] || 0, 300); }
  else p.sort_by = "popularity.desc";
  if (o.page) p.page = o.page;
  return p;
}

/* ---------- Mazzo di card (Scopri) ---------- */
const D = { cards: [], seen: new Set(), pages: {}, loading: false, hist: [], err: "" };
function deckOk(it) {
  if (D.seen.has(it.key)) return false;
  const t = S.titles[it.key];
  if (t && t.watchlist) return false;
  if (t && F.hide && (t.watched || t.skipped)) return false;
  return !!it.poster;
}
async function fillDeck() {
  if (D.loading) return; D.loading = true; D.err = "";
  try {
    const ms = F.media === "all" ? ["movie", "tv"] : [F.media];
    for (let g = 0; g < 4 && D.cards.length < 10; g++) {
      const parts = await Promise.all(ms.map(async m => {
        const q = dq(m); if (!q) return [];
        const p = D.pages[m] != null ? D.pages[m] : (D.pages[m] = 1 + Math.floor(Math.random() * 3));
        if (p > 500) return []; D.pages[m] = p + 1; q.page = p;
        try { const r = await tmdb("/discover/" + m, q); return r.results.map(x => norm(x, m)); } catch (e) { D.err = e.message; return []; }
      }));
      let batch = []; const n = Math.max(0, ...parts.map(x => x.length));
      for (let i = 0; i < n; i++) parts.forEach(a => { if (a[i]) batch.push(a[i]); });
      batch = batch.filter(deckOk).filter(it => !D.cards.some(c => c.key === it.key));
      if (F.sort === "aff") batch.sort((a, b) => ((matchPct(b) || 70) - (matchPct(a) || 70)) + (Math.random() - .5) * 12);
      D.cards.push(...batch);
      if (!parts.some(a => a.length)) break;
    }
  } finally { D.loading = false; }
}
const domMemo = new Map();
function domColor(url) {
  if (domMemo.has(url)) return domMemo.get(url);
  const pr = new Promise(res => {
    const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = c.height = 12;
        const x = c.getContext("2d"); x.drawImage(im, 0, 0, 12, 12);
        const d = x.getImageData(0, 0, 12, 12).data; let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]), s = (mx - mn) / (mx || 1), wt = .15 + s * s * 3 + (mx > 60 ? .2 : 0);
          r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt;
        }
        res([Math.round(r / w), Math.round(g / w), Math.round(b / w)]);
      } catch (e) { res(null); }
    };
    im.onerror = () => res(null); im.src = url;
  });
  domMemo.set(url, pr); return pr;
}
async function glowFor(it) {
  const gl = $("#glow"); if (!gl) return;
  if (!it) { gl.style.opacity = 0; return; }
  const c = await domColor(IMG + "w92" + it.poster);
  gl.style.background = `radial-gradient(60% 45% at 50% 38%, rgba(${c ? c.join(",") : "255,42,95"},.5), transparent 72%)`;
  gl.style.opacity = 1;
}
function cardHtml(it, z, off) {
  ITEMS[it.key] = it;
  const g = (it.genre_ids || []).slice(0, 2).map(x => GN[x]).filter(Boolean), mp = matchPct(it);
  return `<div class="sw" data-k="${it.key}" style="z-index:${z};transform:translateY(${off * 14}px) scale(${1 - off * .05})">
<div class="pic" style="background-image:url(${IMG}w780${it.poster})"></div><div class="shade"></div>
<div class="bdg br">WATCHLIST</div><div class="bdg bl">NON MI INTERESSA</div><div class="bdg bu">VISTO</div>
<div class="info"><h3 class="h">${esc(it.title)}</h3><div class="meta">${esc(it.year)}<span class="dur"></span></div>
<div class="pills">${g.map(x => `<span class="pill">${esc(x)}</span>`).join("")}${mp ? `<span class="pill mt">${mp}% per te</span>` : ""}</div>
<div class="plat"></div></div></div>`;
}
function renderStack() {
  const st = $("#stack"); if (!st) return;
  const top = D.cards.slice(0, 3);
  if (!top.length) {
    st.innerHTML = `<div class="empty">${D.loading ? "Cerco nuovi titoli…" : D.err ? esc(D.err) : "Hai finito i titoli per questi filtri. Cambia i filtri per continuare."}</div>`;
    glowFor(null); sideFor(null);
    if (!D.loading && !D.err) fillDeck().then(() => { if (D.cards.length && $("#stack") && !dragging) renderStack(); });
    return;
  }
  st.innerHTML = top.map((it, i) => cardHtml(it, 3 - i, i)).join("");
  bindTop(st.children[0]);
  top.forEach((it, i) => hydrate(it, st.children[i]));
  glowFor(top[0]); sideFor(top[0]);
  if (D.cards.length < 7) fillDeck().then(() => { if (!dragging && $("#stack") && D.cards.length > top.length && top.length < 3) renderStack(); });
}
async function hydrate(it, el) {
  try {
    const d = await full(it); if (!el || !el.isConnected) return;
    const m = metaOf(d, it.media); el.querySelector(".dur").textContent = m ? " · " + m : "";
    el.querySelector(".plat").innerHTML = mineOf(d).map(p => `<img src="${IMG}w45${p.logo_path}" alt="${esc(p.provider_name)}" title="${esc(p.provider_name)}">`).join("");
  } catch (e) {}
}
async function sideFor(it) {
  const s = $("#side"); if (!s) return;
  if (!it) { s.innerHTML = ""; return; }
  s.innerHTML = `<h3 class="h">${esc(it.title)}</h3><p class="mu">Caricamento…</p>`;
  try {
    const d = await full(it); if (!$("#side") || D.cards[0] !== it) return;
    const dir = it.media === "movie" ? ((d.credits || {}).crew || []).filter(c => c.job === "Director").map(c => c.name).join(", ") : (d.created_by || []).map(c => c.name).join(", ");
    const cast = ((d.credits || {}).cast || []).slice(0, 6), mp = matchPct(it), gl = (d.genres || []).map(x => x.name).join(", ");
    s.innerHTML = `<h3 class="h">${esc(it.title)}</h3><div class="mu">${esc(it.year)}${metaOf(d, it.media) ? " · " + esc(metaOf(d, it.media)) : ""}${d.vote_average ? " · TMDB " + d.vote_average.toFixed(1) : ""}</div>
${gl ? `<div class="mu">${esc(gl)}</div>` : ""}${mp ? `<p><span class="pill mt">${mp}% per te</span></p>` : ""}
<p>${esc((d.overview || it.overview || "Trama non disponibile.").slice(0, 420))}${(d.overview || "").length > 420 ? "…" : ""}</p>
${dir ? `<p class="mu">${it.media === "movie" ? "Regia" : "Ideata da"}: <b>${esc(dir)}</b></p>` : ""}
${cast.length ? `<div class="casts">${cast.map(c => `<div class="cast" role="link" tabindex="0" onclick="event.stopPropagation();openPerson(${c.id})" onkeydown="if(event.key==='Enter')openPerson(${c.id})">${c.profile_path ? `<img src="${IMG}w185${c.profile_path}" alt="" loading="lazy">` : `<span class="ph">${esc((c.name || "?")[0])}</span>`}<b>${esc(c.name)}</b></div>`).join("")}</div>` : ""}
<div class="keys"><span><kbd>←</kbd> Non mi interessa</span><span><kbd>↑</kbd> Visto</span><span><kbd>→</kbd> Watchlist</span></div>
<button class="btn sm" onclick="openSheet('${it.key}')">Tutti i dettagli</button>`;
  } catch (e) { if ($("#side")) $("#side").innerHTML = ""; }
}
const TH = 100;
const dirOf = (dx, dy) => Math.abs(dx) >= Math.abs(dy) ? (Math.abs(dx) > TH ? (dx > 0 ? "r" : "l") : null) : (dy < -TH ? "u" : null);
function badgeShow(el, dx, dy) {
  const o = { r: 0, l: 0, u: 0 };
  if (Math.abs(dx) >= Math.abs(dy)) { if (dx > 0) o.r = Math.min(1, dx / TH); else o.l = Math.min(1, -dx / TH); } else if (dy < 0) o.u = Math.min(1, -dy / TH);
  ["r", "l", "u"].forEach(k => { const b = el.querySelector(".b" + k); if (b) b.style.opacity = o[k]; });
}
function bindTop(el) {
  if (!el) return;
  let sx = 0, sy = 0, dx = 0, dy = 0, t0 = 0, moved = false, on = false, last = null;
  el.addEventListener("pointerdown", e => {
    if (e.button > 0) return;
    on = true; dragging = true; sx = e.clientX; sy = e.clientY; dx = dy = 0; t0 = Date.now(); moved = false; last = null;
    try { el.setPointerCapture(e.pointerId); } catch (x) {}
    el.style.transition = "none";
  });
  el.addEventListener("pointermove", e => {
    if (!on) return; dx = e.clientX - sx; dy = e.clientY - sy;
    if (!moved && Math.hypot(dx, dy) > 8) moved = true;
    if (!moved) return;
    el.style.transform = `translate(${dx}px,${dy > 0 ? dy * .25 : dy}px) rotate(${dx / 18}deg)`;
    badgeShow(el, dx, dy);
    const d = dirOf(dx, dy); if (d !== last) { if (d) vib(6); last = d; }
  });
  const end = () => {
    if (!on) return; on = false; dragging = false;
    const d = moved ? dirOf(dx, dy) : null;
    if (d) { act(d); return; }
    el.style.transition = "transform .25s ease"; el.style.transform = ""; badgeShow(el, 0, 0);
    if (!moved && Date.now() - t0 < 450) openSheet(el.dataset.k);
  };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
}
function act(d) {
  const it = D.cards[0], el = $("#stack .sw"); if (!it || !el || el.dataset.busy) return;
  el.dataset.busy = "1";
  const W = innerWidth, H = innerHeight, tr = { r: [W * 1.3, 0, 25], l: [-W * 1.3, 0, -25], u: [0, -H, 0] }[d];
  el.style.transition = "transform .3s ease-in, opacity .3s"; el.style.transform = `translate(${tr[0]}px,${tr[1]}px) rotate(${tr[2]}deg)`; el.style.opacity = 0;
  vib({ r: 18, l: 8, u: [14, 30, 14] }[d]);
  const prev = S.titles[it.key] ? JSON.parse(JSON.stringify(S.titles[it.key])) : null;
  D.seen.add(it.key); D.hist.push({ it, prev, d }); if (D.hist.length > 30) D.hist.shift();
  setTimeout(() => { D.cards.shift(); renderStack(); }, 260);
  if (d === "r") put(it, { watchlist: true, skipped: false }); else if (d === "l") put(it, { skipped: true, watchlist: false }); else rate(it, () => undo());
  if (view === "onb") onbTick();
}
function undo() {
  const h = D.hist.pop(); if (!h) { toast("Niente da annullare"); return; }
  const k = h.it.key; D.seen.delete(k); affC = null;
  if (h.prev) S.titles[k] = h.prev; else delete S.titles[k];
  saveTitles([k]).catch(() => {});
  if (view === "onb" && ONB.n > 0) { ONB.n--; const e = $("#onbn"); if (e) e.textContent = ONB.n; }
  D.cards.unshift(h.it); renderStack(); vib(8);
}
addEventListener("keydown", e => {
  if (!(view === "swipe" || (view === "onb" && ONB.step === 3)) || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || "") || $("#sheet .sheet") || $("#rate .dlg") || $("#fsheet .sheet")) return;
  const m = { ArrowRight: "r", ArrowLeft: "l", ArrowUp: "u" }[e.key]; if (m) { e.preventDefault(); act(m); }
});


/* ---------- Home in stile streaming ---------- */
const CUR = { movie: [28, 35, 18, 878, 27, 53, 16, 10749], tv: [10759, 35, 18, 10765, 9648, 16, 80, 10751] };
const HERO = { items: [], i: 0, t: 0, pause: 0 }, HERO_MS = 7000, HERO_VID = 22000;
let Q = [], busyR = 0;
const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) moreRows(); }, { rootMargin: "700px" });
const okItem = it => { const t = S.titles[it.key]; return !(t && F.hide && (t.watched || t.skipped)); };
const disc = (m, o) => { const q = dq(m, o); return q ? tmdb("/discover/" + m, q) : Promise.resolve({ results: [], total_pages: 0 }); };
const PKG = { 8: "com.netflix.mediaclient", 119: "com.amazon.avod.thirdpartyclient", 337: "com.disney.disneyplus", 1899: "com.wbd.stream", 531: "com.cbs.app", 3: "com.google.android.youtube" };
function provHref(p, it) { const q = encodeURIComponent(it.title), t = SVC_URL[p.provider_id]; if (t) return t.replace("{q}", q); const r = R.toLowerCase(); return `https://www.justwatch.com/${r}/${r === "it" ? "cerca" : "search"}?q=${q}`; }
var card; /* definita più avanti */
async function wlTog(k) {
  const before = snapT(k), on = !(S.titles[k] || {}).watchlist;
  await put(byKey(k), { watchlist: on, skipped: false }); vib(10); syncCards(k);
  toast(on ? "Aggiunto alla lista" : "Rimosso dalla lista", () => restoreT(k, before));
  if (view === "list") render();
}
async function skipIt(k) {
  const before = snapT(k);
  await put(byKey(k), { skipped: true, watchlist: false });
  document.querySelectorAll('.nc[data-k="' + k + '"]').forEach(x => x.remove()); heroCheck();
  toast("Non ti verrà più proposto", () => restoreT(k, before));
}
function afterChange(k) {
  if (view === "list" || view === "prof") { render(); return; }
  if ((S.titles[k] || {}).watched) document.querySelectorAll('.nc[data-k="' + k + '"]').forEach(x => x.remove());
  heroCheck();
}
function sc(b, d) { const r = b.parentElement.querySelector(".rail"); r.scrollBy({ left: d * r.clientWidth * 0.85, behavior: "smooth" }); }
const rail = (items, meta) => `<div class="rw"><button class="arr l" aria-label="Indietro" onclick="sc(this,-1)">‹</button><div class="rail"${meta ? ` data-m="${meta.m}" data-g="${meta.g || 0}" data-p="2"${meta.o ? ' data-o="1"' : ""}${meta.rt ? ` data-rt="${meta.rt.join(",")}"` : ""}` : ""}>${items.map(x => card(x.it || x, x.extra, meta && meta.o)).join("")}</div><button class="arr r" aria-label="Avanti" onclick="sc(this,1)">›</button></div>`;
const rt = (m, g) => (view === "home" || view === "other" ? (m === "tv" ? "Serie TV · " : "Film · ") : "") + (GN[g] || g);
async function moreRail(el) {
  if (el.dataset.busy || el.dataset.end || !el.dataset.m) return;
  el.dataset.busy = "1";
  try {
    const o = el.dataset.o === "1", p = +el.dataset.p;
    const q = dq(el.dataset.m, { g: +el.dataset.g || 0, other: o, svc: o ? othSel : 0, rt: el.dataset.rt ? el.dataset.rt.split(",").map(Number) : null });
    if (!q) { el.dataset.end = "1"; } else {
      q.page = p; const r = await tmdb("/discover/" + el.dataset.m, q);
      const have = new Set([...el.querySelectorAll(".nc")].map(x => x.dataset.k));
      el.insertAdjacentHTML("beforeend", r.results.map(x => norm(x, el.dataset.m)).filter(i => okItem(i) && !have.has(i.key)).map(i => card(i, "", o)).join(""));
      el.dataset.p = p + 1; if (p + 1 > Math.min(r.total_pages, 500)) el.dataset.end = "1";
      fillProv();
    }
  } catch (e) { el.dataset.end = "1"; }
  delete el.dataset.busy;
  if (!el.dataset.end && el.scrollWidth <= el.clientWidth + 400) moreRail(el);
}
function fillRails() { document.querySelectorAll(".rail[data-m]").forEach(el => { if (el.scrollWidth <= el.clientWidth + 400) moreRail(el); }); }
document.addEventListener("scroll", e => { const el = e.target; if (el && el.classList && el.classList.contains("rail") && el.scrollLeft + el.clientWidth > el.scrollWidth - 400) moreRail(el); }, true);
async function moreRows() {
  if (busyR) return; const mo = $("#more"); if (!mo) return; busyR = 1;
  try {
    const gi = $("#gridi");
    if (gi) {
      const p = +gi.dataset.p, q = dq(gi.dataset.m);
      if (!q) mo.remove(); else {
        q.page = p; const r = await tmdb("/discover/" + gi.dataset.m, q);
        const have = new Set([...gi.querySelectorAll(".nc")].map(x => x.dataset.k));
        gi.insertAdjacentHTML("beforeend", r.results.map(x => norm(x, gi.dataset.m)).filter(i => okItem(i) && !have.has(i.key)).map(i => card(i)).join(""));
        gi.dataset.p = p + 1; if (p + 1 > Math.min(r.total_pages, 500)) mo.remove();
      }
    } else if (Q.length) {
      const specs = Q.splice(0, 2), rs = await Promise.all(specs.map(x => disc(x.m, { g: x.g, other: !!x.o, svc: x.o ? othSel : 0 })));
      let h = ""; specs.forEach((x, i) => { const its = rs[i].results.map(y => norm(y, x.m)).filter(okItem); if (its.length) h += `<h3 class="h">${esc(rt(x.m, x.g))}</h3>` + rail(its, { m: x.m, g: x.g, o: x.o }); });
      mo.insertAdjacentHTML("beforebegin", h); if (!Q.length) mo.remove();
    } else mo.remove();
    fillProv(); fillRails();
  } catch (e) { mo.remove(); }
  busyR = 0;
  const m2 = $("#more"); if (m2) { io.unobserve(m2); io.observe(m2); }
}
/* copertina a rotazione */
function heroHtml(items) { HERO.items = items; HERO.i = 0; items.forEach(i => { ITEMS[i.key] = i; }); return `<section class="hero" id="hero" onmouseenter="HERO.pause=1" onmouseleave="HERO.pause=0"><div class="hbg" id="hbg"></div><div class="hc" id="hc"></div><button class="harr l" aria-label="Titolo precedente" onclick="showHero(HERO.i-1)"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><button class="harr r" aria-label="Titolo successivo" onclick="showHero(HERO.i+1)"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button><div class="hdots" id="hdots"></div></section>`; }
function paint(it) {
  const o = it.overview || "";
  $("#hbg").style.backgroundImage = heroBg(it);
  $("#hc").innerHTML = `${it.poster ? `<img class="hpo" src="${IMG}w185${it.poster}" alt="">` : ""}<div class="htx"><div class="hch">${it.vote ? `<span class="hchp gold">★ ${it.vote.toFixed(1)}</span>` : ""}${it.year ? `<span class="hchp">${esc(it.year)}</span>` : ""}<span class="hchp">${it.media === "tv" ? "Serie TV" : "Film"}</span></div><h2 class="h${it.title.length > 38 ? " xl" : it.title.length > 22 ? " lg" : ""}" title="${esc(it.title)}"><span>${esc(it.title)}</span></h2><div class="mu hrs">${esc(it.reason || "")}</div><p class="hov">${esc(o.slice(0, 220))}${o.length > 220 ? "…" : ""}</p><div class="row"><button class="btn pri big wlb" data-k="${it.key}" onclick="wlTog('${it.key}')">${(S.titles[it.key] || {}).watchlist ? ic("minus", 18) + " Rimuovi dalla lista" : ic("plus", 18) + " Aggiungi alla lista"}</button><button class="btn big" onclick="rate(byKey('${it.key}'))">${ic("check", 18)} Visto</button><button class="btn big" onclick="openSheet('${it.key}')">${ic("info", 18)} Info</button><button class="btn big ico" aria-label="Più così" title="Più così" onclick="rxMore('${it.key}')">${ic("up", 18)}</button><button class="btn big ico" aria-label="Non per me" title="Non per me" onclick="rxNot('${it.key}')">${ic("down", 18)}</button></div></div>`;
  HERO.msg = 0; clearTimeout(HERO.vt); clearTimeout(HERO.pt); const ov = $("#hv"); if (ov) ov.remove(); const hr = $("#hero"); if (hr) hr.classList.remove("playing", "vplay", "vload");
  if (UI.vid !== false && !(navigator.connection && navigator.connection.saveData) && !matchMedia("(prefers-reduced-motion: reduce)").matches) HERO.vt = setTimeout(async () => {
    if (!$("#hbg") || HERO.items[HERO.i] !== it) return;
    try { const d = await full(it), v = pickVideo(d); if (!v || !$("#hbg") || HERO.items[HERO.i] !== it) return; const f = document.createElement("iframe"); f.id = "hv"; f.className = "hv"; f.style.opacity = 0; f.tabIndex = -1; f.title = "Anteprima"; f.setAttribute("allow", "autoplay; encrypted-media"); f.src = "https://www.youtube-nocookie.com/embed/" + v.key + "?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1&origin=" + encodeURIComponent(location.origin); f.onload = () => { try { f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*"); } catch (e) {} }; $("#hero").insertBefore(f, $("#hc")); $("#hero").classList.add("vload"); HERO.at = Date.now(); HERO.pt = setTimeout(() => { const h = $("#hero"); if (h && $("#hv") && !HERO.msg) { h.classList.add("playing"); $("#hv").style.opacity = 1; } }, 4500); } catch (e) {}
  }, 900);
  $("#hdots").innerHTML = HERO.items.map((_, j) => `<button class="${j === HERO.i ? "on" : ""}" aria-label="Titolo ${j + 1}" onclick="showHero(${j})"></button>`).join("");
}
/* copertine: le precarico e, se l'immagine grande non arriva, ripiego su una più piccola o sulla locandina */
const HIMG = new Map();
const heroUrls = it => [it.backdrop && IMG + (innerWidth < 700 ? "w780" : "w1280") + it.backdrop, it.backdrop && IMG + "w780" + it.backdrop, it.backdrop && IMG + "original" + it.backdrop, it.poster && IMG + "w780" + it.poster].filter(Boolean);
function heroLoad(it) {
  if (!it) return Promise.resolve(); if (HIMG.has(it.key)) return HIMG.get(it.key).p;
  const urls = heroUrls(it), o = { u: urls[0] || "" };
  o.p = new Promise(res => { let i = 0; const nx = () => { if (i >= urls.length) { o.u = ""; return res(); } const u = urls[i++], im = new Image(); im.onload = () => { o.u = u; res(); }; im.onerror = () => setTimeout(nx, 150); im.src = u; }; nx(); });
  HIMG.set(it.key, o); return o.p;
}
const heroBg = it => { const o = HIMG.get(it.key), u = o ? o.u : (heroUrls(it)[0] || ""); return u ? `url(${u})` : "none"; };
function showHero(i) {
  const n = HERO.items.length; if (!n || !$("#hbg")) return; HERO.i = ((i % n) + n) % n;
  HERO.at = Date.now(); const it = HERO.items[HERO.i], layers = [$("#hbg"), $("#hc")]; layers.forEach(x => { x.style.opacity = 0; });
  const ready = heroLoad(it), t0 = Date.now();
  Promise.race([ready, new Promise(r => setTimeout(r, 2500))]).then(() => setTimeout(() => { if (!$("#hbg") || HERO.items[HERO.i] !== it) return; paint(it); layers.forEach(x => { x.style.opacity = 1; }); heroLoad(HERO.items[(HERO.i + 1) % HERO.items.length]); }, Math.max(0, 300 - (Date.now() - t0))));
}
function startHero() {
  clearInterval(HERO.t); if (!$("#hbg") || !HERO.items.length) return;
  HERO.i = 0; heroLoad(HERO.items[0]).then(() => { if (HERO.i === 0 && $("#hbg")) $("#hbg").style.backgroundImage = heroBg(HERO.items[0]); }); paint(HERO.items[0]); if (HERO.items[1]) heroLoad(HERO.items[1]);
  HERO.at = Date.now();
  if (HERO.items.length > 1) HERO.t = setInterval(() => {
    if (HERO.pause || document.hidden || RT || $("#sheet .sheet")) { HERO.at = Date.now(); return; }
    const h = $("#hero"), vid = h && (h.classList.contains("vplay") || h.classList.contains("playing") || h.classList.contains("vload")); // con il video in riproduzione la copertina resta più a lungo
    if (Date.now() - HERO.at >= (vid ? HERO_VID : HERO_MS)) showHero(HERO.i + 1);
  }, 1000);
}
function heroCheck() {
  if (!HERO.items.length || !$("#hbg")) return;
  const cur = HERO.items[HERO.i], oi = HERO.i; HERO.items = HERO.items.filter(okItem);
  if (!HERO.items.length) { clearInterval(HERO.t); const h = $("#hero"); if (h) h.remove(); return; }
  if (cur && !okItem(cur)) showHero(Math.min(oi, HERO.items.length - 1)); else { HERO.i = Math.max(0, HERO.items.indexOf(cur)); paint(HERO.items[HERO.i]); }
}
const fromRows = ts => ts.map(rowItem);

/* ---------- Home a tessere + In arrivo ---------- */
const BENTO = { cont: null };
const SOONC = { t: 0, d: null };
const dLabel = d => { const n = Math.ceil((new Date(d + "T23:59:59") - Date.now()) / 864e5); return n <= 0 ? "Oggi" : n === 1 ? "Domani" : n < 8 ? "Tra " + n + " giorni" : fmtD(d); };
async function soonData() {
  if (SOONC.d && Date.now() - SOONC.t < 6e5) return SOONC.d;
  const tr = Object.values(S.titles).filter(t => t.media === "tv" && !t.skipped && (epCount(t) > 0 || t.watched)).slice(0, 40);
  const [ds, up1, up2] = await Promise.all([Promise.all(tr.map(t => full(rowItem(t)).catch(() => null))),
    tmdb("/movie/upcoming", { region: C.REGION || "IT", page: 1 }).catch(() => ({ results: [] })), tmdb("/movie/upcoming", { region: C.REGION || "IT", page: 2 }).catch(() => ({ results: [] }))]);
  const tv = [], td = today();
  ds.forEach((d, i) => {
    if (!d) return; const t = tr[i], ne = d.next_episode_to_air, seen = epCount(t) > 0 || t.watched;
    if (ne && ne.air_date && ne.air_date >= td) {
      const ns = ne.episode_number === 1 && ne.season_number > 1;
      tv.push({ t, date: ne.air_date, kind: ns ? "season" : "ep", s: ne.season_number, e: ne.episode_number, name: ne.name || "", still: ne.still_path || "", seen });
    } else {
      const fs = (d.seasons || []).find(s => s.season_number > 0 && s.air_date && s.air_date >= td);
      if (fs) tv.push({ t, date: fs.air_date, kind: "season", s: fs.season_number, e: 1, name: "", still: "", seen });
    }
  });
  tv.sort((a, b) => (b.seen - a.seen) * 0 || a.date.localeCompare(b.date));
  const have = new Set(Object.keys(S.titles).filter(k => S.titles[k].skipped || S.titles[k].watched));
  const mv = [...up1.results, ...up2.results].filter((x, i, a) => x.release_date && x.release_date >= td && x.poster_path && a.findIndex(y => y.id === x.id) === i).map(x => Object.assign(norm(x, "movie"), { date: x.release_date })).filter(x => !have.has(x.key)).filter(x => { const t = S.titles[x.key], m = matchPct(x); return (t && (t.watchlist || t.hype)) || (m == null ? true : m >= 65); });
  mv.sort((a, b) => (matchPct(b) || 60) - (matchPct(a) || 60)); const top = mv.slice(0, 14).sort((a, b) => a.date.localeCompare(b.date));
  return (SOONC.d = { tv, mv: top }, SOONC.t = Date.now(), SOONC.d);
}
const soonLine = r => r.kind === "season" ? "Nuova stagione " + r.s : "Nuovo episodio " + sxe(r.s, r.e);
function contTile(r) {
  const t = r.t, k = t.tmdb_key, c = epCount(t), n = (t.eps || {})._n || 0, nx = r.nx;
  return `<div class="bt lime w2" onclick="openEp('${k}')"><div class="bpo">${t.poster ? `<img src="${IMG}w185${t.poster}" alt="">` : ""}</div><div class="bm"><small>Continua a guardare</small><b>${esc(t.title)}</b><span>${sxe(nx.s, nx.e)}${nx.name ? " · " + spN(nx.name) : ""}</span>${n ? `<div class="prg"><i style="width:${Math.min(100, Math.round(c / n * 100))}%"></i></div>` : ""}</div><button class="bchk" aria-label="Segna episodio visto" onclick="event.stopPropagation();epNext('${k}')">${ic("check", 22)}</button></div>`;
}
function bentoHtml(cont, soon) {
  const nm = (P().name || "").trim().split(" ")[0];
  return `<div class="bgreet"><h2>${nm ? "Ciao " + esc(nm) : "Ciao"}</h2></div><div class="bento"><!--cont--></div>`;
}
function quickRow() {
  const n = typeof xUser === "function" && xUser() ? xUnseen() : 0;
  return `<div class="qk"><button class="qkb" onclick="go('tonight')">${ic("moon", 24)}<b>Stasera</b><small>Cosa guardiamo?</small></button><button class="qkb" onclick="TG.tab=xTabFor();TG.room=null;go('together')">${ic("users", 24)}${n ? `<span class="nb">${n}</span>` : ""}<b>Insieme</b><small>Amici e serata in due</small></button><button class="qkb" onclick="go('plan')">${ic("euro", 24)}<b>Abbonamenti</b><small>Quale ti basta?</small></button></div>`;
}
async function vSoon() {
  const d = await soonData().catch(() => ({ tv: [], mv: [] })), by = {};
  d.tv.forEach(r => (by[r.date] = by[r.date] || []).push(r));
  const seen = d.tv.filter(r => r.seen && r.kind === "season");
  let h = `<div class="sec pt"><h2 class="h">${ic("calendar", 22)} In arrivo</h2><p class="mu">Nuove stagioni e prossimi episodi delle serie che segui, più i film in uscita che potrebbero piacerti.</p>${icsButton(d)}`;
  if (seen.length) h += `<h3 class="h">Nuove stagioni di serie che hai già visto</h3><div class="tvg">${seen.map(soonCard).join("")}</div>`;
  const rest = d.tv.filter(r => !seen.includes(r));
  if (rest.length) h += `<h3 class="h">Prossimi episodi</h3>` + Object.keys(by).filter(k => rest.some(r => r.date === k)).map(k => `<h4 class="dh">${esc(dLabel(k))} <span class="mu">${esc(fmtD(k))}</span></h4><div class="tvg">${rest.filter(r => r.date === k).map(soonCard).join("")}</div>`).join("");
  if (d.mv.length) h += `<h3 class="h">Film in uscita</h3><div class="mvs">${d.mv.map(m => `<div class="mvd"><span class="bd">${esc(dLabel(m.date))}</span>${card(m)}</div>`).join("")}</div>`;
  if (!d.tv.length && !d.mv.length) h += emptyBox("calendar", "Per ora non ci sono uscite in arrivo. Segna le serie che guardi e qui vedrai nuove stagioni ed episodi.", "");
  return h + `</div>`;
}
function soonCard(r) {
  const t = r.t, img = r.still ? IMG + "w300" + r.still : (t.poster ? IMG + "w342" + t.poster : "");
  return `<div class="tvc" onclick="openSheet('${t.tmdb_key}')">${img ? `<img ${r.still && UI.spoil ? 'class="spo" ' : ""}src="${img}" alt="" loading="lazy">` : `<div class="po no">${esc(t.title)}</div>`}<div class="tvb"><b>${esc(t.title)}</b><div class="mu small">${soonLine(r)}${r.name && r.kind === "ep" ? " · " + spN(r.name) : ""}</div><div class="mu small">Esce ${esc(inDays(r.date))}</div></div></div>`;
}
const shelf = (t, s, x) => `<h3 class="h shl"><span class="shb"></span><span class="sht">${esc(t)}${x ? " " + x : ""}${s ? `<small>${esc(s)}</small>` : ""}</span></h3>`;
const top10 = items => `<div class="rw"><button class="arr l" aria-label="Indietro" onclick="sc(this,-1)">‹</button><div class="rail t10">${items.map((it, i) => `<div class="tn"><span class="rk" aria-hidden="true">${i + 1}</span>${card(it)}</div>`).join("")}</div><button class="arr r" aria-label="Avanti" onclick="sc(this,1)">›</button></div>`;
async function vHome() {
  await loadProv().catch(() => {});
  const [mv, tv, rec, oth] = await Promise.all([disc("movie"), disc("tv"), recItems(), disc("movie", { other: true }).catch(() => ({ results: [] }))]);
  const mi = mv.results.map(x => norm(x, "movie")).filter(okItem), ti = tv.results.map(x => norm(x, "tv")).filter(okItem), oi = oth.results.map(x => norm(x, "movie")).filter(okItem);
  let hs = (() => { const b = rec.filter(r => r.it.backdrop), u = new Set(), o = []; b.forEach(r => { if (o.length < 6 && !u.has(r.extra)) { u.add(r.extra); o.push(r); } }); b.forEach(r => { if (o.length < 6 && !o.includes(r)) o.push(r); }); return o; })().map(r => Object.assign({}, r.it, { reason: r.extra ? "Scelto per te · " + r.extra : "Scelto per te" }));
  const pop = []; for (let i = 0; i < 20; i++) { if (mi[i]) pop.push(mi[i]); if (ti[i]) pop.push(ti[i]); }
  for (const p of pop) { if (hs.length >= 6) break; if (p.backdrop && !hs.some(x => x.key === p.key)) hs.push(Object.assign({}, p, { reason: "Popolare sui tuoi servizi" })); }
  const all = Object.values(S.titles), cont = all.filter(t => t.media === "tv" && epCount(t) > 0 && !t.watched), wl = all.filter(t => t.watchlist && !t.watched);
  HERO.items = [];
  const soon = await soonData().catch(() => ({ tv: [], mv: [] }));
  let h = `<div class="sec bh">` + bentoHtml(cont, soon) + (hs.length ? heroHtml(hs) : "") + quickRow();
  if (cont.length) {
    const cs = cont.sort((a, b) => ((b.eps || {})._t || 0) - ((a.eps || {})._t || 0)).slice(0, 8), nxs = await Promise.all(cs.map(t => nextEpFor(t.tmdb_key)));
    const cc = cs.map((t, i) => ({ t, nx: nxs[i] })).filter(r => r.nx && !r.nx.fut);
    BENTO.cont = cc[0] || null;
    if (cc.length) h = h.replace('<!--cont-->', () => contTile(cc[0]));
    if (cc.length > 1) h += `<h3 class="h">Continua a guardare <a class="more-l" href="#" onclick="tvTab='mine';go('tv');return false">Le mie serie</a></h3><div class="erail">${cc.slice(1).map(r => tvCard(r.t, r.nx, "go")).join("")}</div>`;
  }
  h = h.replace('<!--cont-->', () => "");
  if (wl.length) h += shelf("La mia lista", "Da guardare quando vuoi") + rail(fromRows(wl));
  h += await xFriendRail();
  if (rec.length) h += shelf("Scelti per te", "In base ai tuoi gusti e ai tuoi voti") + rail(rec);
  if (pop.length >= 5) h += shelf("Top 10 sui tuoi servizi", "I più popolari ora, già inclusi nei tuoi abbonamenti") + top10(pop.slice(0, 10));
  Q = [];
  return h + `</div>`;
}
const rentChip = () => primeSub() ? `<button class="chip rentc ${F.rent !== false ? "on" : ""}" onclick="F.rent=F.rent===false;lsSet('cm_filters',F);D.cards=[];D.pages={};render()" title="Mostra anche i titoli a noleggio o in vendita su Prime Video"><span class="eur">€</span> Noleggio e acquisto</button>` : "";
const svcBarHtml = () => S.subs.length ? `<div class="row svb"><button class="chip ${!F.svc.length ? "on" : ""}" onclick="svcPick(0)">${ic("check", 14)} I miei abbonamenti</button>${S.subs.map(id => { const p = (PROV || []).find(x => x.provider_id === id); return p ? `<button class="chip svp ${F.svc.length === 1 && F.svc[0] === id ? "on" : ""}" onclick="svcPick(${id})"><img src="${IMG}w45${p.logo_path}" alt="" width="18" height="18">${esc(p.provider_name)}</button>` : ""; }).join("")}</div>` : "";
var trkMore; /* definita più avanti */
function svcPick(id) { F.svc = id ? [id] : []; D.cards = []; D.pages = {}; lsSet("cm_filters", F); render(); }
function quickGenre(g) { F.genres = g ? [g] : []; lsSet("cm_filters", F); render(); }
function setSortK(k) { F.sort = k; lsSet("cm_filters", F); render(); }
async function vMT() {
  const m = view, all = GL[m].length ? GL[m] : CUR[m];
  let tabs = "";
  if (m === "tv") {
    const tr = tvTracked(); if (!tvTab) tvTab = tr.length ? "mine" : "disc";
    tabs = `<div class="row segs"><button class="chip ${tvTab === "mine" ? "on" : ""}" onclick="tvGo('mine')">Le mie serie <i>${tr.length}</i></button><button class="chip ${tvTab === "cal" ? "on" : ""}" onclick="tvGo('cal')">${ic("calendar", 15)} Calendario</button><button class="chip ${tvTab === "disc" ? "on" : ""}" onclick="tvGo('disc')">Scopri</button></div>`;
    if (tvTab === "cal") return `<div class="sec pt">${tabs}${await vCal(tr)}</div>`;
    if (tvTab === "mine") return `<div class="sec pt">${tabs}${await vMine(tr)}</div>`;
  }
  const svcBar = svcBarHtml();
  let h = `<div class="sec pt">${tabs}${svcBar}<div class="row">${[["aff", "Per te"], ["pop", "Popolari"], ["new", "Novità"], ["top", "Più votati"]].map(([k, l]) => `<button class="chip ${F.sort === k ? "on" : ""}" onclick="setSortK('${k}')">${l}</button>`).join("")}${rentChip()}</div>
<div class="row"><button class="chip ${!F.genres.length ? "on" : ""}" onclick="quickGenre(0)">Tutti i generi</button>${all.map(g => `<button class="chip ${F.genres.length === 1 && F.genres[0] === g ? "on" : ""}" onclick="quickGenre(${g})">${esc(GN[g] || g)}</button>`).join("")}</div>`;
  if (F.genres.length) {
    const r = await disc(m, { page: 1 }); Q = [];
    return h + `<div class="grid" id="gridi" data-m="${m}" data-p="2">${r.results.map(x => norm(x, m)).filter(okItem).map(i => card(i)).join("")}</div><div id="more" class="more"></div></div>`;
  }
  const ids = CUR[m], rows = await Promise.all(ids.map(g => disc(m, { g })));
  ids.forEach((g, i) => { const x = rows[i].results.map(r => norm(r, m)).filter(okItem); if (x.length) h += `<h3 class="h">${esc(rt(m, g))}</h3>` + rail(x, { m, g }); });
  Q = all.filter(g => !ids.includes(g)).map(g => ({ m, g }));
  return h + `<div id="more" class="more"></div></div>`;
}
let timeSel = lsGet("cm_time", 90);
function setTime(v) { timeSel = Math.max(20, Math.min(400, Math.round(+v) || 90)); lsSet("cm_time", timeSel); render(); }
const fmtT = m => m >= 60 ? Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : "") : m + " min";
async function vTime() {
  const x = timeSel, mr = [Math.max(40, x - 35), x], tr = x <= 60 ? [Math.max(10, x - 25), x] : [35, 60];
  const pre = [30, 60, 90, 120, 150, 180, 240];
  let h = `<div class="sec"><h2 class="h">Quanto tempo hai?</h2><p class="mu">Scegli il tempo a disposizione: ti mostro film che ci stanno e serie con episodi della durata giusta. Vale per i tuoi servizi e rispetta i filtri attivi.</p>
<div class="row">${pre.map(v => `<button class="chip lg ${x === v ? "on" : ""}" onclick="setTime(${v})">${fmtT(v)}</button>`).join("")}</div>
<div class="row"><span class="mu">Altro tempo (minuti):</span><input type="number" inputmode="numeric" min="20" max="400" value="${x}" style="width:100px" onchange="setTime(this.value)"></div>`;
  const [mv, tv] = await Promise.all([disc("movie", { rt: mr }), disc("tv", { rt: tr })]);
  const byAff = (a, b) => (matchPct(b) || 70) - (matchPct(a) || 70);
  const mi = mv.results.map(y => norm(y, "movie")).filter(okItem).sort(byAff), ti = tv.results.map(y => norm(y, "tv")).filter(okItem).sort(byAff);
  h += `<h3 class="h">Film da ${mr[0]} a ${mr[1]} minuti</h3>` + (mi.length ? rail(mi, { m: "movie", g: 0, rt: mr }) : `<p class="mu">Nessun film trovato per questa durata sui tuoi servizi.</p>`);
  h += `<h3 class="h">${x <= 60 ? `Serie con episodi da circa ${x} minuti` : "Serie da maratona (episodi da 35 a 60 minuti)"}</h3>` + (ti.length ? rail(ti, { m: "tv", g: 0, rt: tr }) : `<p class="mu">Nessuna serie trovata per questa durata.</p>`);
  return h + `<div id="more" class="more"></div></div>`;
}
const setOth = id => { othSel = id; render(); };
async function vOther() {
  const pv = await loadProv(), oth = pv.filter(p => !isMine(p.provider_id)), o = { other: true, svc: othSel };
  let h = `<div class="sec pt"><h2 class="h">Su altri servizi</h2><p class="mu">Titoli inclusi in abbonamento su servizi a cui non sei abbonato. Tocca un titolo per vedere dove guardarlo.</p>
<div class="row"><button class="chip ${!othSel ? "on" : ""}" onclick="setOth(0)">Tutti</button>${oth.map(p => `<button class="chip svcc ${othSel === p.provider_id ? "on" : ""}" onclick="setOth(${p.provider_id})"><img src="${IMG}w45${p.logo_path}" alt="" width="20" height="20">${esc(p.provider_name)}</button>`).join("")}</div>`;
  const [mv, tv] = await Promise.all([disc("movie", o), disc("tv", o)]);
  const mi = mv.results.map(x => norm(x, "movie")).filter(okItem), ti = tv.results.map(x => norm(x, "tv")).filter(okItem);
  h += `<h3 class="h">Film popolari</h3>` + (mi.length ? rail(mi, { m: "movie", g: 0, o: 1 }) : `<p class="mu">Nessun titolo trovato.</p>`) + `<h3 class="h">Serie TV popolari</h3>` + (ti.length ? rail(ti, { m: "tv", g: 0, o: 1 }) : `<p class="mu">Nessun titolo trovato.</p>`);
  const gs = CUR.movie.slice(0, 4), rows = await Promise.all(gs.map(g => disc("movie", Object.assign({ g }, o))));
  gs.forEach((g, i) => { const x = rows[i].results.map(r => norm(r, "movie")).filter(okItem); if (x.length) h += `<h3 class="h">${esc(rt("movie", g))}</h3>` + rail(x, { m: "movie", g, o: 1 }); });
  Q = [...GL.movie.filter(g => !gs.includes(g)).map(g => ({ m: "movie", g, o: 1 })), ...GL.tv.map(g => ({ m: "tv", g, o: 1 }))];
  return h + `<div id="more" class="more"></div></div>`;
}

/* ---------- Domande iniziali ---------- */
let ONB = { step: 0, genres: [], fmt: "all", n: 0, total: 12, init: false };
const needOnb = () => !PR().done && Object.keys(S.titles).length < 3;
function onbGo(s) { ONB.step = s; render(); window.scrollTo(0, 0); }
function onbGenre(g) { const i = ONB.genres.indexOf(g); i < 0 ? ONB.genres.push(g) : ONB.genres.splice(i, 1); render(); }
function onbFmt(f) {
  ONB.fmt = f; ONB.n = 0; ONB.step = 3;
  F = Object.assign({}, F0, { genres: ONB.genres.slice(), media: f }); D.cards = []; D.pages = {}; D.hist = []; D.seen = new Set(); D.err = "";
  render();
}
function onbTick() { ONB.n++; const e = $("#onbn"); if (e) e.textContent = Math.min(ONB.n, ONB.total); if (ONB.n >= ONB.total) setTimeout(finishOnb, 500); }
async function finishOnb() {
  if (view !== "onb") return;
  const p = PR(); p.done = true; p.genres = ONB.genres.slice(); p.fmt = ONB.fmt; affC = null;
  F = Object.assign({}, F0, lsGet("cm_filters", {})); D.cards = []; D.pages = {}; D.hist = []; D.seen = new Set();
  ONB = { step: 0, genres: [], fmt: "all", n: 0, total: 12, init: false };
  await savePrefs(); toast("Perfetto! Ho preparato la tua Home"); view = "home"; render(); if (typeof xTour === "function" && !lsGet("cm_tour", 0)) setTimeout(xTour, 600);
}
async function onbSkip() { ONB.genres = ONB.genres.length ? ONB.genres : PR().genres || []; ONB.fmt = ONB.fmt || "all"; await finishOnb(); }
function deckHtml() {
  return `<div class="deck"><div class="stagecol"><div class="stage"><div class="stack" id="stack"><div class="empty">Cerco i titoli per te…</div></div></div>
<div class="acts"><button class="ab pass" onclick="act('l')" aria-label="Non mi interessa">✕<small>Non mi interessa</small></button><button class="ab seen" onclick="act('u')" aria-label="Visto">✓<small>Visto</small></button><button class="ab like" onclick="act('r')" aria-label="Aggiungi alla watchlist">＋<small>Watchlist</small></button></div>
<button class="link" onclick="undo()">↶ Annulla l’ultima scelta</button><p class="mu hintk">← Non mi interessa · ↑ Visto · → Watchlist</p></div><aside id="side" class="side"></aside></div>`;
}
function onbName(skip) {
  if (!skip) { const v = ($("#onn").value || "").trim().slice(0, 24); if (!v) { toast("Scrivi il tuo nome"); return; } P().name = v; saveProfile(); }
  ONB.nameDone = true; render();
}
async function vOnb() {
  await genres().catch(() => {});
  if (!P().name && !ONB.nameDone) {
    const g = (user && user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name) || "").trim().split(" ")[0].slice(0, 24);
    return `<div class="onb"><h1 class="h big">Come ti chiami?</h1><p class="mu">Lo usiamo per salutarti e per firmare i tuoi commenti. Puoi cambiarlo quando vuoi dal profilo.</p>
<p><input id="onn" type="text" maxlength="24" value="${esc(g)}" placeholder="Il tuo nome" autocomplete="given-name" onkeydown="if(event.key==='Enter')onbName()" style="width:100%;max-width:340px;min-height:48px;font-size:17px;border-radius:14px"></p>
<p><button class="btn pri big" onclick="onbName()">Continua</button></p><p><button class="link" onclick="onbName(1)">Salta per ora</button></p></div>`;
  }
  if (!ONB.init) { ONB.init = true; if (S.subs.length) ONB.step = 1; }
  const head = (t, sub) => `<div class="dots2">${[0, 1, 2, 3].map(i => `<i class="${i <= ONB.step ? "on" : ""}"></i>`).join("")}</div><h1 class="h big">${t}</h1><p class="mu">${sub}</p>`;
  const skip = `<p><button class="link" onclick="onbSkip()">Salta per ora</button></p>`;
  if (ONB.step === 0) {
    const pv = await loadProv();
    return `<div class="onb">${head("Benvenuto in " + APP, "Per cominciare: quali abbonamenti di streaming hai?")}${svList(pv)}
<p><button class="btn pri big" ${S.subs.length ? "" : "disabled"} onclick="onbGo(1)">Avanti</button></p>${skip}</div>`;
  }
  if (ONB.step === 1) {
    return `<div class="onb">${head("Quali sono i tuoi generi preferiti?", "Scegline almeno 3: ti servono per capire cosa mostrarti.")}<div class="row center">${GL.movie.map(g => `<button class="chip lg ${ONB.genres.includes(g) ? "on" : ""}" onclick="onbGenre(${g})">${esc(GN[g] || g)}</button>`).join("")}</div>
<p><button class="btn pri big" ${ONB.genres.length >= 3 ? "" : "disabled"} onclick="onbGo(2)">Avanti</button></p>${skip}</div>`;
  }
  if (ONB.step === 2) {
    return `<div class="onb">${head("Cosa preferisci guardare?", "Puoi cambiare idea in qualsiasi momento.")}<div class="opts"><button class="opt" onclick="onbFmt('movie')"><span>🎬</span><b>Film</b></button><button class="opt" onclick="onbFmt('tv')"><span>📺</span><b>Serie TV</b></button><button class="opt" onclick="onbFmt('all')"><span>🍿</span><b>Entrambi</b></button></div>${skip}</div>`;
  }
  return `<div class="onb">${head("Ultimo passo: dimmi cosa ti piace", `Scegli per <b id="onbn">${ONB.n}</b> di ${ONB.total} titoli: Visto, Non mi interessa o Watchlist.`)}</div>` + deckHtml() + `<p style="text-align:center">${skip.replace("<p>", "").replace("</p>", "")}</p>`;
}

/* ---------- Valutazione ---------- */
let RT = null;
const RTAG_P = [["storia", "Storia"], ["attori", "Attori"], ["regia", "Regia"], ["atmo", "Atmosfera"], ["ritmo", "Ritmo"], ["visual", "Immagini"], ["musica", "Musica"], ["finale", "Finale"]];
const RTAG_N = [["nstoria", "Storia debole"], ["nattori", "Recitazione"], ["lento", "Troppo lento"], ["lungo", "Troppo lungo"], ["genere", "Non il mio genere"], ["nfinale", "Finale deludente"]];
const rtTags = s => s >= 3.5 ? RTAG_P : s && s <= 2.5 ? RTAG_N : [];
var rate; /* definita più avanti */
var renderRate; /* definita più avanti */
function rateSet(n) { RT.s = RT.s === n ? n - .5 : n; const ok = rtTags(RT.s).map(x => x[0]); RT.tags = RT.tags.filter(x => ok.includes(x)); renderRate(); vib(6); }
function rateTag(k) { const i = RT.tags.indexOf(k); i < 0 ? RT.tags.push(k) : RT.tags.splice(i, 1); renderRate(); }
function rateCancel() { const cb = RT && RT.onCancel; RT = null; renderRate(); if (cb) cb(); }
var rateSave; /* definita più avanti */

/* ---------- Scheda dettaglio (bottom sheet) ---------- */
function closeSheet() { if (!ovBack("sheet")) closeSheetRaw(); }
function closeSheetRaw() { const e = $("#sheet"); if (e) e.innerHTML = ""; document.body.classList.remove("noscroll"); if (DIRTY) { DIRTY = false; render(); } }
async function openSheet(k) {
  const it = byKey(k); if (!it) return; ovOpen("sheet", closeSheetRaw);
  const e = $("#sheet"); document.body.classList.add("noscroll");
  e.innerHTML = `<div class="ov" onclick="closeSheet()"><div class="sheet" onclick="event.stopPropagation()"><div class="grab"></div><p class="mu pad">Caricamento…</p></div></div>`;
  let d = {}; try { d = await full(it); } catch (x) {}
  const box = $("#sheet .sheet"); if (!box) return;
  const t = S.titles[k] || {}, mp = matchPct(it), gl = (d.genres || []).map(x => x.name).join(", ");
  const dir = it.media === "movie" ? ((d.credits || {}).crew || []).filter(c => c.job === "Director").map(c => c.name).join(", ") : (d.created_by || []).map(c => c.name).join(", ");
  const cast = ((d.credits || {}).cast || []).slice(0, 14), fl = flatOf(d), vid = pickVideo(d), lnk = ((((d["watch/providers"] || {}).results || {})[R]) || {}).link;
  box.innerHTML = `<div class="grab"></div><button class="xcl" aria-label="Chiudi" onclick="closeSheet()">${ic("x", 18)}</button><div id="shv" class="shv">${d.backdrop_path ? `<img class="bk" src="${IMG}w780${d.backdrop_path}" alt="">` : ""}</div>
<div class="pad"><h2 class="h">${esc(it.title)}</h2>
<div class="mu">${esc(it.year)}${metaOf(d, it.media) ? " · " + esc(metaOf(d, it.media)) : ""}${gl ? " · " + esc(gl) : ""}${d.vote_average ? " · TMDB " + d.vote_average.toFixed(1) : ""}</div>
${mp ? `<p><span class="pill mt">${mp}% Affine a te</span></p>` : ""}
<div class="plats">${fl.length ? fl.map(p => `<a class="pl ${isMine(p.provider_id) ? "mine" : ""}" ${typeof brandStyle === "function" ? brandStyle(p.provider_name) : ""} href="${esc(provHref(p, it, lnk))}" data-pkg="${PKG[p.provider_id] || ""}" target="_blank" rel="noopener"><img src="${IMG}w45${p.logo_path}" alt="" width="22" height="22">${isMine(p.provider_id) ? "Guarda su " : "Disponibile su "}${esc(p.provider_name)} ↗</a>`).join("") : `<span class="mu">Non incluso in abbonamento in ${esc(R)}</span>`}${rbHtml(d, it, lnk)}</div>
${fl.length ? `<p class="mu small">Il link apre la ricerca del titolo sul servizio (o su JustWatch se il servizio non ha una ricerca diretta).</p>` : ""}
${vid ? `<div class="shacts"><button class="btn" onclick="shTrailer('${vid.key}')">${ic("play", 16)} Trailer (YouTube)</button></div>` : ""}
<div id="frx"></div><p>${esc(d.overview || it.overview || "Trama non disponibile.")}</p>
${dir ? `<p class="mu">${it.media === "movie" ? "Regia" : "Ideata da"}: <b>${esc(dir)}</b></p>` : ""}
${cast.length ? `<h3 class="h">Cast</h3><div class="casts">${cast.map(c => `<div class="cast" role="link" tabindex="0" onclick="event.stopPropagation();openPerson(${c.id})" onkeydown="if(event.key==='Enter')openPerson(${c.id})">${c.profile_path ? `<img src="${IMG}w185${c.profile_path}" alt="" loading="lazy">` : `<span class="ph">${esc((c.name || "?")[0])}</span>`}<b>${esc(c.name)}</b><span>${esc(c.character || "")}</span></div>`).join("")}</div>` : ""}
<div id="sagax"></div><div id="notex"></div><h3 class="h">Commenti della community</h3><div id="cmx"><p class="mu">Caricamento…</p></div>
${it.media === "tv" ? `<div id="tvx" data-k="${k}"><p class="mu">Caricamento episodi…</p></div>` : ""}
</div>
<div class="sbar"><button class="btn grow wlb ${t.watchlist ? "on" : "pri"}" data-k="${k}" onclick="shTog('${k}','watchlist')">${t.watchlist ? ic("minus", 18) + " Rimuovi dalla lista" : ic("plus", 18) + " Aggiungi alla lista"}</button><button class="btn ${t.watched ? "mint on" : ""}" onclick="rate(byKey('${k}'))">${ic("check", 18)} ${t.watched && t.stars ? t.stars + "★" : "Visto"}</button><button class="btn ${t.favorite ? "pri on" : ""}" aria-label="Preferito" aria-pressed="${!!t.favorite}" onclick="shTog('${k}','favorite')">${ic("heart", 18)}</button><button class="btn" aria-label="Aggiungi a una mia lista" onclick="listPick('${k}')">${ic("list", 18)}</button></div>`;
  loadComments(k); if (it.media === "tv") tvPanel(k);
  if (typeof xSheet === "function") xSheet(k, d, it);
}
function rbHtml(d, it, lnk) {
  const rb = rbFull(d); if (!rb) return "";
  const lab = rb.rent && rb.buy ? "Noleggia o acquista" : rb.rent ? "Noleggia" : "Acquista";
  return `<a class="pl rb" href="${esc(provHref({ provider_id: 119, provider_name: "Prime Video" }, it, lnk))}" target="_blank" rel="noopener" title="Si paga a parte, anche senza abbonamento"><span class="eur">€</span>${rb.logo ? `<img src="${IMG}w45${rb.logo}" alt="" width="22" height="22">` : ""}${lab} su Prime Video ↗</a>`;
}
async function shTog(k, what) {
  const it = byKey(k), t = S.titles[k] || {}, on = !t[what], p = { [what]: on };
  if (what === "hype" && on) p.watchlist = true;
  if (what === "watchlist" && !on) p.hype = false;
  await put(it, p); vib(10); const y = $("#sheet .sheet") ? $("#sheet .sheet").scrollTop : 0;
  await openSheet(k); if ($("#sheet .sheet")) $("#sheet .sheet").scrollTop = y;
  if (view === "list") render();
}
async function shTrailer(key) { const b = $("#shv"); if (b) { b.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${key}?autoplay=1&playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Trailer"></iframe>`; b.classList.add("play"); } }
/* ---------- Serie TV in stile TV Time ---------- */
const NEXT = {}; let SEXP = {}, DIRTY = false, tvTab = null;
const seasonsOf = d => (d.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0).sort((a, b) => a.season_number - b.season_number);
// tutte le stagioni, anche l'ultima annunciata (episode_count a 0 su TMDB): servono per mostrarla e aprirla
const seasonsAll = d => (d.seasons || []).filter(s => s.season_number > 0 && (s.episode_count > 0 || s.air_date || s.season_number === (d.number_of_seasons || 0))).sort((a, b) => a.season_number - b.season_number);
const fmtD = s => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }); };
const inDays = s => { const n = Math.ceil((new Date(s + "T23:59:59") - Date.now()) / 864e5); return n <= 0 ? "oggi" : n === 1 ? "domani" : "tra " + n + " giorni"; };
const spN = n => !n ? "" : UI.spoil ? `<span class="spo" onclick="event.stopPropagation();this.classList.remove('spo')">${esc(n)}</span>` : esc(n);
const sxe = (s, e) => "S" + s + "E" + e;
async function nextEpFor(k, fresh) {
  if (!fresh && k in NEXT) return NEXT[k];
  const it = byKey(k); if (!it) return undefined;
  try {
    const d = await full(it), eps = (S.titles[k] || {}).eps || {};
    for (const s of seasonsOf(d)) for (let e = 1; e <= s.episode_count; e++) if (!eps[s.season_number + "-" + e]) {
      const r = await tmdb("/tv/" + it.id + "/season/" + s.season_number).catch(() => ({ episodes: [] })), ep = (r.episodes || []).find(x => x.episode_number === e) || {};
      return (NEXT[k] = { s: s.season_number, e, name: ep.name || "", still: ep.still_path || "", air: ep.air_date || "", ov: ep.overview || "", rt: ep.runtime || 0, fut: !!(ep.air_date && ep.air_date > today()) });
    }
    return (NEXT[k] = null);
  } catch (x) { return undefined; }
}
async function setEps(k, mut) {
  const it = byKey(k), t = S.titles[k] || {}, d = await full(it), meta = tvMeta(d), eps = Object.assign({}, t.eps || {}, { _n: meta.n, _m: meta.m, _t: Date.now() });
  mut(eps);
  await put(it, { eps, runtime: meta.n * meta.m, watchlist: false });
  delete NEXT[k]; const nx = await nextEpFor(k, true), t2 = S.titles[k] || {};
  if (nx === null && !t2.watched) { confetti(); rate(it); }
  else if (nx && t2.watched) await put(it, { watched: false });
  afterEp(k);
}
async function afterEp(k) {
  const x = $("#tvx"), sh = $("#sheet .sheet");
  if (x && x.dataset.k === k) { const y = sh ? sh.scrollTop : 0; DIRTY = true; await tvPanel(k); if (sh) sh.scrollTop = y; return; }
  if (["tv", "home", "list"].includes(view)) { const y = window.scrollY; await render(); window.scrollTo(0, y); }
}
const epTog = (k, s, e, on) => setEps(k, eps => { if (on) eps[s + "-" + e] = true; else delete eps[s + "-" + e]; });
// "Continua a guardare": apre la scheda già sull'episodio da vedere (stagione aperta, episodio in evidenza)
async function openEp(k) {
  const it = byKey(k); if (!it) return;
  const nx = await nextEpFor(k).catch(() => null);
  if (nx) { SEXP[k] = SEXP[k] || {}; SEXP[k][nx.s] = true; }
  await openSheet(k);
  const go = async () => {
    const box = $("#tvx"); if (!box) return false;
    const n = box.querySelector(".nxb"); (n || box).scrollIntoView({ block: "center", behavior: "smooth" });
    if (n) { n.classList.add("hi"); setTimeout(() => n.classList.remove("hi"), 2200); }
    return true;
  };
  for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 250)); if ($("#tvx .nxb") && await go()) break; }
}
async function epNext(k) {
  const nx = await nextEpFor(k, true); if (!nx) return;
  await setEps(k, eps => { eps[nx.s + "-" + nx.e] = true; });
  const n2 = NEXT[k]; toast("Visto " + sxe(nx.s, nx.e) + (n2 ? " · Prossimo: " + sxe(n2.s, n2.e) + (n2.name && !UI.spoil ? " " + n2.name : "") : " · Serie completata!")); vib(12);
}
async function epUpTo(k, sn, en) {
  const d = await full(byKey(k));
  await setEps(k, eps => { for (const s of seasonsOf(d)) { if (s.season_number > sn) break; const last = s.season_number === sn ? en : s.episode_count; for (let e = 1; e <= last; e++) eps[s.season_number + "-" + e] = true; } });
}
async function seasonAll(k, sn, on) {
  const d = await full(byKey(k)), s = seasonsAll(d).find(x => x.season_number === sn); if (!s) return;
  const ck = k + "|" + sn; let n = s.episode_count; if (!n) { try { n = ((SEAC[ck] || (SEAC[ck] = await tmdb("/tv/" + byKey(k).id + "/season/" + sn))).episodes || []).filter(x => !x.air_date || x.air_date <= today()).length; } catch (e) { n = 0; } }
  if (!n) return toast("Episodi non ancora disponibili");
  await setEps(k, eps => { for (let e = 1; e <= n; e++) { if (on) eps[sn + "-" + e] = true; else delete eps[sn + "-" + e]; } });
}
async function seasonOpen(k, sn) { SEXP[k] = SEXP[k] || {}; SEXP[k][sn] = !SEXP[k][sn]; await tvPanel(k); }
const SEAC = {};
async function seasonRows(k, sn) {
  const box = $("#sn" + sn); if (!box) return; const ck = k + "|" + sn; if (!SEAC[ck] && !box.firstChild) box.innerHTML = `<p class="mu">Caricamento…</p>`;
  try {
    const it = byKey(k), r = SEAC[ck] || (SEAC[ck] = await tmdb("/tv/" + it.id + "/season/" + sn)), eps = (S.titles[k] || {}).eps || {};
    if (!(r.episodes || []).length) { box.innerHTML = `<p class="mu">Gli episodi di questa stagione non sono ancora stati pubblicati.</p>`; return; }
    box.innerHTML = `<div class="row"><button class="btn mint sm" onclick="seasonAll('${k}',${sn},true)">Segna stagione vista</button><button class="btn sm" onclick="seasonAll('${k}',${sn},false)">Azzera stagione</button></div>` +
      r.episodes.map(ep => { const fut = ep.air_date && ep.air_date > today(); return `<div class="ep"><label><input type="checkbox" ${eps[sn + "-" + ep.episode_number] ? "checked" : ""} onchange="epTog('${k}',${sn},${ep.episode_number},this.checked)"><span><b>${ep.episode_number}.</b> ${UI.spoil && !eps[sn + "-" + ep.episode_number] ? `<span class="spo" onclick="this.classList.remove('spo')">${esc(ep.name || "")}</span>` : esc(ep.name || "")}<br><small class="mu">${fut ? "Esce " + fmtD(ep.air_date) : fmtD(ep.air_date)}${ep.runtime ? " · " + ep.runtime + " min" : ""}</small></span></label><button class="btn sm" title="Segna tutto fino a qui" onclick="epUpTo('${k}',${sn},${ep.episode_number})">↧ fino a qui</button></div>`; }).join("");
  } catch (e) { box.innerHTML = `<p class="mu">Episodi non disponibili.</p>`; }
}
function nextBlock(k, nx, c) {
  const st = nx.still ? `<img class="nst ${UI.spoil ? "spo" : ""}" src="${IMG}w300${nx.still}" alt="" onclick="this.classList.remove('spo')">` : "";
  return `<div class="nxb">${st}<div><div class="mu">${c ? "Prossimo episodio" : "Inizia da qui"}</div><b>${sxe(nx.s, nx.e)}${nx.name ? " · " + spN(nx.name) : ""}</b><div class="mu small">${nx.air ? (nx.fut ? "Esce " + inDays(nx.air) + " (" + fmtD(nx.air) + ")" : fmtD(nx.air)) : ""}${nx.rt ? " · " + nx.rt + " min" : ""}</div>
${nx.fut ? "" : `<button class="btn mint sm" onclick="epNext('${k}')">${c ? "✓ Segna come visto" : "▶ Inizia: segna " + sxe(nx.s, nx.e)}</button>`}</div></div>`;
}
var tvPanel; /* definita più avanti */
const tvTracked = () => Object.values(S.titles).filter(t => t.media === "tv" && !t.skipped && (epCount(t) > 0 || t.watchlist || t.watched));
function tvGo(x) { tvTab = x; render(); }
function tvCard(t, nx, mode) {
  const k = t.tmdb_key, c = epCount(t), n = (t.eps || {})._n || 0, img = nx && nx.still ? IMG + "w300" + nx.still : (t.poster ? IMG + "w342" + t.poster : "");
  const line = mode === "end" ? esc("Completata" + (t.stars ? " · " + t.stars + "★" : "")) : !nx ? "" : mode === "wait" ? `${sxe(nx.s, nx.e)}${nx.name ? " · " + spN(nx.name) : ""} — esce ${nx.air ? inDays(nx.air) : "presto"}` : `${mode === "new" ? "Inizia" : "Prossimo"}: ${sxe(nx.s, nx.e)}${nx.name ? " · " + spN(nx.name) : ""}`;
  const btn = mode === "go" ? `<button class="btn mint sm" onclick="event.stopPropagation();epNext('${k}')" aria-label="Segna episodio visto">${ic("check", 18)}</button>` : mode === "new" ? `<button class="btn mint sm" onclick="event.stopPropagation();epNext('${k}')" aria-label="Inizia la serie">${ic("play", 16)}</button>` : "";
  return `<div class="tvc" onclick="openEp('${k}')">${img ? `<img ${nx && nx.still && UI.spoil ? 'class="spo" ' : ""}src="${img}" alt="" loading="lazy">` : `<div class="po no">${esc(t.title)}</div>`}<div class="tvb"><b>${esc(t.title)}</b><div class="mu small">${line}</div>${mode === "go" && n ? `<div class="prg"><i style="width:${Math.min(100, Math.round(c / n * 100))}%"></i></div><div class="mu small">${c}/${n} episodi</div>` : ""}${mode === "new" ? `<button class="link small" onclick="event.stopPropagation();unlist('${k}')">Rimuovi dalla lista</button>` : ""}</div>${btn}</div>`;
}
async function vMine(tr) {
  const res = await Promise.all(tr.map(async t => ({ t, nx: t.watched ? null : await nextEpFor(t.tmdb_key) })));
  const go = [], wait = [], nw = [], end = [];
  res.forEach(r => { if (r.t.watched || r.nx === null) end.push(r); else if (epCount(r.t) === 0) nw.push(r); else if (r.nx && r.nx.fut) wait.push(r); else go.push(r); });
  go.sort((a, b) => ((b.t.eps || {})._t || 0) - ((a.t.eps || {})._t || 0)); wait.sort((a, b) => (a.nx.air || "").localeCompare(b.nx.air || "")); end.sort((a, b) => (b.t.watched_on || "").localeCompare(a.t.watched_on || ""));
  const sec = (title, arr, mode) => arr.length ? `<h3 class="h">${title} <span class="mu">${arr.length}</span></h3><div class="tvg">${arr.map(r => tvCard(r.t, r.nx, mode)).join("")}</div>` : "";
  const body = sec("Da guardare", go, "go") + sec("Prossimamente", wait, "wait") + sec("Non ancora iniziate", nw, "new") + sec("Completate", end, "end");
  return body || `<p class="mu">Non segui ancora nessuna serie. Passa a “Scopri”, aggiungi una serie alla lista o inizia a segnare gli episodi.</p>`;
}

/* ---------- Commenti della community ---------- */
const CMB = "comment-photos";
let BL = null;
const photoUrl = p => sb.storage.from(CMB).getPublicUrl(p).data.publicUrl;
async function loadBlocks() { if (BL) return BL; BL = new Set(); if (!sb || !user) return BL; const r = await sb.from("user_blocks").select("blocked_id").eq("user_id", user.id); (r.data || []).forEach(x => BL.add(x.blocked_id)); return BL; }
function shrink(f) {
  return new Promise((ok, ko) => {
    if (!/^image\//.test(f.type) || f.size > 20e6) return ko(new Error("Scegli un’immagine (JPG, PNG, WebP) sotto i 20 MB"));
    const u = URL.createObjectURL(f), im = new Image();
    im.onload = () => { const s = Math.min(1, 1280 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => b ? ok(b) : ko(new Error("Immagine non valida")), "image/jpeg", .82); };
    im.onerror = () => { URL.revokeObjectURL(u); ko(new Error("Formato immagine non supportato")); };
    im.src = u;
  });
}
function cmPrev() { const f = $("#cmf").files[0], p = $("#cmp"); p.textContent = f ? f.name : ""; }
function cmOne(c, likes, reply) {
  const mine = c.user_id === user.id, lk = likes[c.id] || { n: 0, me: false };
  return `<div class="cmt ${reply ? "rp" : ""}" id="c-${jsq(c.id)}"><div class="cmh">${avatarHtml(c.avatar || 0, 28)}<b>${esc(c.name || "Cinefilo")}</b><span class="mu small">${esc(fmtD((c.created_at || "").slice(0, 10)))}</span></div>
${c.body ? `<p>${esc(c.body).replace(/\n/g, "<br>")}</p>` : ""}${PHOTORE.test(c.photo || "") ? `<a href="${esc(photoUrl(c.photo))}" target="_blank" rel="noopener"><img class="cph" loading="lazy" src="${esc(photoUrl(c.photo))}" alt="Foto allegata al commento"></a>` : ""}
<div class="cma"><button class="link ${lk.me ? "liked" : ""}" onclick="likeComment('${jsq(c.id)}','${jsq(c.tmdb_key)}')" aria-label="Mi piace">${ic("heart", 15)} ${lk.n || ""}</button>${reply ? "" : `<button class="link" onclick="replyOpen('${jsq(c.id)}','${jsq(c.tmdb_key)}')">${ic("reply", 15)} Rispondi</button>`}
${mine ? `<button class="link" onclick="delComment('${jsq(c.id)}','${jsq(c.photo)}','${jsq(c.tmdb_key)}')">${ic("trash", 15)} Elimina</button>` : `<button class="link" onclick="repComment('${jsq(c.id)}')">${ic("flag", 15)} Segnala</button><button class="link" onclick="blockUser('${jsq(c.user_id)}','${jsq(c.tmdb_key)}')">${ic("ban", 15)} Blocca</button>`}</div>
<div id="rp-${jsq(c.id)}"></div></div>`;
}
async function loadComments(k) {
  const box = $("#cmx"); if (!box) return;
  if (!sb || !user) { box.innerHTML = `<p class="mu">I commenti della community sono disponibili con un account: accedi o registrati per leggerli e scriverne.</p>`; return; }
  const bl = await loadBlocks(), r = await sb.from("comments").select("*").eq("tmdb_key", k).order("created_at", { ascending: false }).limit(150);
  if (r.error) { box.innerHTML = `<p class="mu">Commenti non disponibili: hai eseguito l’aggiornamento SQL?</p>`; return; }
  const rows = r.data.filter(c => !bl.has(c.user_id)), likes = {};
  if (rows.length) { const l = await sb.from("comment_likes").select("comment_id,user_id").in("comment_id", rows.map(c => c.id)); (l.data || []).forEach(x => { const o = likes[x.comment_id] || (likes[x.comment_id] = { n: 0, me: false }); o.n++; if (x.user_id === user.id) o.me = true; }); }
  const tops = rows.filter(c => !c.parent_id), reps = {}; rows.filter(c => c.parent_id).sort((a, b) => (a.created_at || "").localeCompare(b.created_at || "")).forEach(c => (reps[c.parent_id] = reps[c.parent_id] || []).push(c));
  const list = tops.map(c => cmOne(c, likes) + (reps[c.id] || []).map(x => cmOne(x, likes, true)).join("")).join("");
  box.innerHTML = `<div class="cmf"><textarea id="cmt" maxlength="500" rows="2" placeholder="Scrivi un commento su questo titolo…" aria-label="Il tuo commento"></textarea><div class="row"><label class="btn sm">${ic("camera", 16)} Aggiungi foto<input id="cmf" type="file" accept="image/*" hidden onchange="cmPrev()"></label><span id="cmp" class="mu small"></span><button class="btn pri sm" id="cmb" onclick="postComment('${k}')">Pubblica</button></div><p class="mu small">Sii rispettoso. I commenti sono visibili agli altri utenti registrati; puoi eliminare i tuoi, segnalare o bloccare chi scrive cose inappropriate.</p></div>` + (list || emptyBox("heart", "Ancora nessun commento: scrivi il primo!", ""));
}
async function postComment(k, parent) {
  const ta = parent ? $("#rpt-" + parent) : $("#cmt"), body = (ta.value || "").trim(), f = parent ? null : $("#cmf").files[0], b = parent ? $("#rpb-" + parent) : $("#cmb");
  if (!body && !f) { toast("Scrivi qualcosa" + (parent ? "" : " o aggiungi una foto")); return; }
  b.disabled = true; let path = null;
  try {
    if (f) { const blob = await shrink(f); path = user.id + "/" + Date.now() + ".jpg"; const u = await sb.storage.from(CMB).upload(path, blob, { contentType: "image/jpeg" }); if (u.error) throw u.error; }
    const row = { tmdb_key: k, user_id: user.id, name: P().name || "Cinefilo", avatar: P().avatar || 0, body, photo: path }; if (parent) row.parent_id = parent;
    const r = await sb.from("comments").insert(row);
    if (r.error) { if (path) sb.storage.from(CMB).remove([path]); throw r.error; }
    toast("Commento pubblicato"); await loadComments(k);
  } catch (e) { b.disabled = false; toast(e.message || "Pubblicazione non riuscita"); }
}
function replyOpen(id, k) { const e = $("#rp-" + id); if (!e) return; e.innerHTML = e.innerHTML ? "" : `<div class="cmr"><textarea id="rpt-${id}" maxlength="500" rows="2" placeholder="Scrivi una risposta…" aria-label="Risposta"></textarea><button class="btn pri sm" id="rpb-${id}" onclick="postComment('${k}','${id}')">Invia</button></div>`; if (e.innerHTML) $("#rpt-" + id).focus(); }
async function likeComment(id, k) {
  const me = !!document.querySelector("#c-" + id + " .cma .liked");
  const r = me ? await sb.from("comment_likes").delete().eq("comment_id", id).eq("user_id", user.id) : await sb.from("comment_likes").insert({ comment_id: id, user_id: user.id });
  if (r.error) { toast("Non riuscito"); return; } loadComments(k);
}
async function delComment(id, photo, k) {
  if (!confirm("Eliminare questo commento?")) return;
  const r = await sb.from("comments").delete().eq("id", id).eq("user_id", user.id);
  if (r.error) { toast("Eliminazione non riuscita"); return; }
  if (photo) sb.storage.from(CMB).remove([photo]); loadComments(k);
}
async function repComment(id) {
  if (!confirm("Segnalare questo commento come inappropriato?")) return;
  const r = await sb.from("comment_reports").insert({ comment_id: id, user_id: user.id });
  toast(r.error && r.error.code !== "23505" ? "Segnalazione non riuscita" : "Grazie, segnalazione inviata");
}
async function blockUser(uid, k) {
  if (!confirm("Bloccare questo utente? Non vedrai più i suoi commenti.")) return;
  const r = await sb.from("user_blocks").insert({ user_id: user.id, blocked_id: uid });
  if (r.error && r.error.code !== "23505") { toast("Blocco non riuscito"); return; }
  (await loadBlocks()).add(uid); toast("Utente bloccato"); loadComments(k);
}
async function unblockAll() { if (!sb || !user) return; await sb.from("user_blocks").delete().eq("user_id", user.id); BL = new Set(); toast("Utenti sbloccati"); render(); }
async function blockedBox() { if (!sb || !user) return ""; const n = (await loadBlocks()).size; return n ? `<h2 class="h">Utenti bloccati</h2><p class="mu">Hai bloccato ${n} ${n === 1 ? "utente" : "utenti"}.</p><button class="btn" onclick="unblockAll()">Sblocca tutti</button>` : ""; }

/* ---------- Filtri (pannello) ---------- */
async function openFilters() {
  try { await genres(); await loadProv(); } catch (e) {}
  FT = JSON.parse(JSON.stringify(F)); ovOpen("filters", closeFiltersRaw); document.body.classList.add("noscroll"); renderFilters();
}
function closeFilters() { if (!ovBack("filters")) closeFiltersRaw(); }
function closeFiltersRaw() { FT = null; const e = $("#fsheet"); if (e) e.innerHTML = ""; document.body.classList.remove("noscroll"); }
const yNow = () => new Date().getFullYear();
const PER = () => [["Sempre", "", ""], ["Ultimi 3 anni", String(yNow() - 3), ""], ["Dal 2010", "2010", ""], ["Classici", "", "1999"]];
const DUR = [[0, "Qualsiasi"], [90, "Breve (fino a 90 min)"], [120, "Fino a 2 ore"], [180, "Fino a 3 ore"]];
function ftPer(i) { const p = PER()[i]; FT.yf = p[1]; FT.yt = p[2]; renderFilters(); }
function renderFilters() {
  const e = $("#fsheet"); if (!FT) { e.innerHTML = ""; return; }
  const chip = (on, fn, l) => `<button class="chip ${on ? "on" : ""}" onclick="${fn}">${l}</button>`;
  const mine = (PROV || []).filter(p => isMine(p.provider_id)), per = PER();
  const n = (FT.media !== "all") + FT.genres.length + !!(FT.yf || FT.yt) + !!FT.minR + !!FT.maxRt + FT.svc.length + !!FT.lang + (FT.sort !== "aff") + !FT.hide;
  e.innerHTML = `<div class="ov" onclick="closeFilters()"><div class="sheet" role="dialog" aria-label="Filtri" onclick="event.stopPropagation()"><div class="grab"></div><div class="pad"><h2 class="h">Filtri</h2><p class="mu">Scegli cosa vuoi vedere: i risultati si adattano ai tuoi abbonamenti.</p>
<h3 class="h">Cosa cerchi</h3><div class="row">${[["all", "Tutto"], ["movie", "Film"], ["tv", "Serie TV"]].map(([v, l]) => chip(FT.media === v, `ftSet('media','${v}')`, l)).join("")}</div>
<h3 class="h">Genere</h3><div class="row">${GL.movie.map(g => chip(FT.genres.includes(g), `ftGenre(${g})`, esc(GN[g] || g))).join("")}</div>
<h3 class="h">Periodo</h3><div class="row">${per.map((p, i) => chip((FT.yf || "") === p[1] && (FT.yt || "") === p[2], `ftPer(${i})`, p[0])).join("")}</div>
<h3 class="h">Voto minimo</h3><div class="row">${[[0, "Tutti"], [6, "6+"], [7, "7+"], [8, "8+"]].map(([v, l]) => chip(FT.minR === v, `ftSet('minR',${v})`, l)).join("")}</div>
<h3 class="h">Durata</h3><div class="row">${DUR.map(([v, l]) => chip(FT.maxRt === v, `ftSet('maxRt',${v})`, l)).join("")}</div>
<h3 class="h">Ordina per</h3><div class="row">${[["aff", "Adatti a te"], ["pop", "Popolari"], ["new", "Novità"], ["top", "Più votati"]].map(([v, l]) => chip(FT.sort === v, `ftSet('sort','${v}')`, l)).join("")}</div>
<details class="mt" ${FT.lang || FT.svc.length || !FT.hide ? "open" : ""}><summary>Altre opzioni</summary>
${mine.length > 1 ? `<h3 class="h">Solo su un servizio</h3><div class="row">${mine.map(p => chip(FT.svc.includes(p.provider_id), `ftSvc(${p.provider_id})`, esc(p.provider_name))).join("")}</div>` : ""}
<h3 class="h">Lingua originale</h3><div class="row"><select onchange="ftSet('lang',this.value)" aria-label="Lingua originale">${[["", "Qualsiasi"], ["it", "Italiano"], ["en", "Inglese"], ["fr", "Francese"], ["es", "Spagnolo"], ["de", "Tedesco"], ["ja", "Giapponese"], ["ko", "Coreano"]].map(([v, l]) => `<option value="${v}" ${FT.lang === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
<div class="row">${chip(FT.hide, `ftSet('hide',${!FT.hide})`, (FT.hide ? "✓ " : "") + "Nascondi già visti e scartati")}</div></details></div>
<div class="sbar"><button class="btn" onclick="ftReset()">Azzera${n ? " (" + n + ")" : ""}</button><button class="btn pri grow" onclick="ftApply()">Mostra risultati</button></div></div></div>`;
}
function ftSet(k, v) { if (k === "minR" || k === "maxRt") v = Number(v) || 0; else if (k === "yf" || k === "yt") v = String(v).replace(/\D/g, "").slice(0, 4); else if (k === "hide") v = (v === true || v === "true"); FT[k] = v; renderFilters(); }
function ftGenre(g) { const i = FT.genres.indexOf(g); i < 0 ? FT.genres.push(g) : FT.genres.splice(i, 1); renderFilters(); }
function ftSvc(id) { const i = FT.svc.indexOf(id); i < 0 ? FT.svc.push(id) : FT.svc.splice(i, 1); renderFilters(); }
function ftReset() { FT = Object.assign({}, F0, { genres: [], svc: [] }); renderFilters(); }
function ftApply() { F = FT; lsSet("cm_filters", F); closeFilters(); D.seen = new Set(); D.cards = []; D.pages = {}; D.hist = []; $("#fc").textContent = fCount() || ""; if ($("#srch").classList.contains("on")) doSearch($("#q").value); else render(); }

/* ---------- Ricerca ---------- */
let SR = { q: "", only: false, type: "all", tok: 0, t: 0, res: [] };
const recents = () => lsGet("cm_recent", []);
function srSave(q) { q = (q || "").trim(); if (q.length < 2) return; lsSet("cm_recent", [q, ...recents().filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 8)); }
function srClearRecent() { lsSet("cm_recent", []); doSearch($("#q").value); }
function srPickI(i) { const q = recents()[i]; if (!q) return; $("#q").value = q; doSearch(q); }
function openSearch() { ovOpen("search", closeSearchRaw); $("#srch").classList.add("on"); document.body.classList.add("searching"); if (!$("#sr").innerHTML.trim()) doSearch($("#q").value); }
function closeSearch() { if (!ovBack("search")) closeSearchRaw(); }
function closeSearchRaw() { $("#srch").classList.remove("on"); document.body.classList.remove("searching"); $("#q").value = ""; $("#q").blur(); $("#sr").innerHTML = ""; SR.q = ""; }
function qInput(v) { openSearch(); clearTimeout(SR.t); SR.t = setTimeout(() => doSearch(v), 300); }
function srKey(e) { if (e.key === "Enter") { srSave(e.target.value); e.target.blur(); } }
function srOnly() { SR.only = !SR.only; srRender(); }
function srType(t) { SR.type = t; srRender(); }
function srOpen(k) { srSave(SR.q); cardClick(k); }

/* ---------- Pagina attore ---------- */
const DEPT = { Acting: "Attore/Attrice", Directing: "Regista", Writing: "Sceneggiatore", Production: "Produttore", Sound: "Musicista", Creator: "Creatore" };
let PP = { f: "all", s: "pop" };
function openPerson(id) { PERSON = id; PP = { f: "all", s: "pop" }; go("person"); }
function ppSet(k, v) { PP[k] = v; render(); }
async function vPerson() {
  let d; try { d = await tmdb("/person/" + PERSON, { append_to_response: "combined_credits" }); } catch (e) { return `<div class="sec pt"><div class="row"><button class="back" onclick="backNav()">‹ Indietro</button></div><p class="mu">Non riesco a caricare questa pagina.</p></div>`; }
  const cr = d.combined_credits || {}, dir = d.known_for_department === "Directing", mp = new Map();
  const src = [...(cr.cast || []).filter(x => !/self|himself|herself|archive/i.test(x.character || "") || (x.vote_count || 0) > 300), ...(dir ? (cr.crew || []).filter(x => x.job === "Director") : [])];
  src.forEach(x => {
    if ((x.media_type !== "movie" && x.media_type !== "tv") || !x.poster_path || (x.genre_ids || []).some(g => g === 10767 || g === 10763)) return;
    const it = Object.assign(norm(x, x.media_type), { _pop: x.popularity || 0, _d: x.release_date || x.first_air_date || "" });
    if (!mp.has(it.key) || mp.get(it.key)._pop < it._pop) { ITEMS[it.key] = it; mp.set(it.key, it); }
  });
  let all = [...mp.values()]; const nf = all.filter(i => i.media === "movie").length, nt = all.length - nf;
  let res = all.filter(i => PP.f === "all" || i.media === PP.f);
  res.sort((a, b) => PP.s === "pop" ? b._pop - a._pop : (b._d || "0").localeCompare(a._d || "0"));
  await loadProv().catch(() => {}); await genres().catch(() => {});
  const ch = (on, f, l) => `<button class="chip ${on ? "on" : ""}" onclick="${f}">${l}</button>`;
  const bd = d.birthday ? fmtD(d.birthday) : "", info = [DEPT[d.known_for_department] || "", bd ? "nato il " + bd : "", d.place_of_birth || ""].filter(Boolean).join(" · ");
  const bio = (d.biography || "").trim();
  return `<div class="sec pt"><div class="row"><button class="back" onclick="backNav()">‹ Indietro</button></div>
<div class="pers">${d.profile_path ? `<img src="${IMG}w342${d.profile_path}" alt="${esc(d.name)}">` : `<div class="ph">${esc((d.name || "?")[0])}</div>`}<div><h2 class="h">${esc(d.name)}</h2><div class="mu">${esc(info)}</div>${bio ? `<p class="bio" onclick="this.classList.toggle('open')">${esc(bio)}</p><button class="link small" onclick="this.previousElementSibling.classList.toggle('open')">Leggi tutto</button>` : ""}</div></div>
<div class="row">${ch(PP.f === "all", "ppSet('f','all')", "Tutti " + all.length)}${ch(PP.f === "movie", "ppSet('f','movie')", "Film " + nf)}${ch(PP.f === "tv", "ppSet('f','tv')", "Serie TV " + nt)}<span class="sp"></span>${ch(PP.s === "pop", "ppSet('s','pop')", "Più popolari")}${ch(PP.s === "new", "ppSet('s','new')", "Più recenti")}</div>
${res.length ? `<div class="grid">${res.map(i => card(i)).join("")}</div>` : `<p class="mu">Nessun titolo trovato.</p>`}</div>`;
}
const srPerson = id => { srSave(SR.q); openPerson(id); };
function pRow(p) {
  const kf = (p.known_for || []).map(x => x.title || x.name).filter(Boolean).slice(0, 3).join(", ");
  return `<div class="srow" onclick="srPerson(${p.id})">${p.profile_path ? `<img class="pimg" src="${IMG}w185${p.profile_path}" alt="" loading="lazy">` : `<div class="po no pimg">${esc((p.name || "?")[0])}</div>`}<div class="srb"><b>${esc(p.name)}</b><div class="mu small">${esc(DEPT[p.known_for_department] || "Persona")}${kf ? " · " + esc(kf) : ""}</div></div><span class="mu" aria-hidden="true">›</span></div>`;
}
function srRow(it) {
  ITEMS[it.key] = it; const t = S.titles[it.key] || {}, g = (it.genre_ids || []).slice(0, 2).map(x => GN[x]).filter(Boolean).join(", "), tag = t.watched ? "Visto" : t.watchlist ? "Nella tua lista" : "";
  return `<div class="srow" data-k="${it.key}" onclick="srOpen('${it.key}')">${it.poster ? `<img src="${IMG}w154${it.poster}" alt="" loading="lazy">` : `<div class="po no">${esc(it.title)}</div>`}
<div class="srb"><b>${esc(it.title)}</b><div class="mu small">${it.media === "tv" ? "Serie TV" : "Film"}${it.year ? " · " + esc(it.year) : ""}${g ? " · " + esc(g) : ""}${tag ? " · " + tag : ""}</div><div class="prov sv" data-k="${it.key}"></div></div>
<button class="btn sm" aria-label="Azioni per ${esc(it.title)}" onclick="event.stopPropagation();qMenu('${it.key}')">${ic("dots", 18)}</button></div>`;
}
const srSkel = () => `<div class="srsk">${"<div class=\"srow\"><i class=\"sk\" style=\"width:56px;height:84px\"></i><div class=\"srb\"><div class=\"sk\" style=\"height:14px;width:60%;margin:6px 0\"></div><div class=\"sk\" style=\"height:11px;width:40%\"></div></div></div>".repeat(5)}</div>`;
async function srHome(my) {
  const r = recents();
  let h = r.length ? `<div class="srh"><h3 class="h">Ricerche recenti</h3><button class="link" onclick="srClearRecent()">Cancella</button></div><div class="row">${r.map((x, i) => `<button class="chip" onclick="srPickI(${i})">${ic("clock", 14)} ${esc(x)}</button>`).join("")}</div>` : `<p class="mu">Cerca un film o una serie per titolo. Vedrai subito se è disponibile nei tuoi abbonamenti.</p>`;
  h += `<h3 class="h">Di tendenza questa settimana</h3>`;
  try { const t = await tmdb("/trending/all/week"); if (my !== SR.tok) return null; h += t.results.filter(x => x.media_type === "movie" || x.media_type === "tv").slice(0, 8).map(x => srRow(norm(x, x.media_type))).join(""); } catch (e) { h += `<p class="mu">Non riesco a caricare le tendenze.</p>`; }
  return h;
}
function srRender() {
  const box = $("#sr"), all = SR.res, cnt = t => all.filter(i => t === "all" || i.media === t).length;
  let res = all.filter(i => (SR.type === "all" || i.media === SR.type) && (!SR.only || i._m));
  const ch = (on, f, l) => `<button class="chip ${on ? "on" : ""}" onclick="${f}">${l}</button>`;
  const pp = SR.ppl || []; if (SR.type === "person" && !pp.length) SR.type = "all";
  const bar = `<div class="row srbar">${ch(SR.type === "all", "srType('all')", "Tutto " + cnt("all"))}${pp.length ? ch(SR.type === "person", "srType('person')", "Persone " + pp.length) : ""}${ch(SR.type === "movie", "srType('movie')", "Film " + cnt("movie"))}${ch(SR.type === "tv", "srType('tv')", "Serie TV " + cnt("tv"))}${ch(SR.only, "srOnly()", (SR.only ? ic("check", 14) + " " : "") + "Nei miei abbonamenti")}</div>`;
  if (SR.type === "person") { box.innerHTML = bar + pp.map(pRow).join("") + `<p class="mu small">Dati di TMDB.</p>`; return; }
  box.innerHTML = bar + (SR.type === "all" && pp.length ? `<h3 class="h">Persone</h3>` + pp.slice(0, 3).map(pRow).join("") + `<h3 class="h">Film e serie</h3>` : "") + (res.length ? res.map(srRow).join("") : emptyBox("sliders", SR.only ? "Nessun risultato disponibile nei tuoi abbonamenti. Togli “Nei miei abbonamenti” per vedere tutto." : "Nessun risultato per “" + esc(SR.q) + "”. Controlla l’ortografia o prova con meno parole.", "")) + `<p class="mu small">Dati di TMDB e JustWatch.</p>`;
  fillProv();
}
async function doSearch(q) {
  q = (q || "").trim(); SR.q = q; SR.ppl = []; const my = ++SR.tok, box = $("#sr");
  if (q.length < 2) { box.innerHTML = srSkel(); await genres().catch(() => {}); const h = await srHome(my); if (h != null && my === SR.tok) { box.innerHTML = h; fillProv(); } return; }
  box.innerHTML = srSkel();
  try {
    await genres(); await loadProv().catch(() => {});
    const pages = await Promise.all([1, 2].map(p => tmdb("/search/multi", { query: q, page: p, include_adult: "false" })));
    let res = pages.flatMap(r => r.results).filter(x => x.media_type === "movie" || x.media_type === "tv").map(x => norm(x, x.media_type));
    const seen = new Set(); res = res.filter(i => !seen.has(i.key) && seen.add(i.key)).slice(0, 30);
    const av = await Promise.all(res.map(i => lightProvs(i)));
    res.forEach((i, x) => { i._m = av[x].some(p => isMine(p.provider_id)); });
    res = res.map((i, x) => [i, x]).sort((a, b) => (b[0]._m - a[0]._m) || (a[1] - b[1])).map(p => p[0]);
    if (my !== SR.tok) return;
    SR.res = res; SR.ppl = pages.flatMap(r => r.results).filter(x => x.media_type === "person").slice(0, 6); srRender();
  } catch (e) { if (my === SR.tok) box.innerHTML = `<p class="mu">Errore: ${esc(e.message)}</p>`; }
}
function searchOk(it) {
  if (F.media !== "all" && it.media !== F.media) return false;
  if (F.genres.length) { const gi = it.genre_ids || []; if (!F.genres.some(g => gi.includes(g) || gi.includes(TVMAP[g]))) return false; }
  const y = Number(it.year) || 0;
  if (F.yf && y < Number(F.yf)) return false; if (F.yt && y > Number(F.yt)) return false;
  if (F.minR && it.vote < F.minR) return false;
  if (F.lang && it.lang !== F.lang) return false;
  return true;
}
var tile; /* definita più avanti */
/* ---------- Tracker ---------- */
const unlist = async k => { const b = snapT(k); await put(byKey(k), { watchlist: false, hype: false }); toast("Rimosso dalla lista", () => restoreT(k, b)); render(); };
const favTog = async k => { await put(byKey(k), { favorite: !(S.titles[k] || {}).favorite }); render(); };
function trkGo(s) { trkTab = s; render(); }
async function vTrack() {
  const all = Object.values(S.titles), seg = {
    watch: all.filter(t => t.watchlist && !t.watched).sort((a, b) => (b.hype ? 1 : 0) - (a.hype ? 1 : 0)),
    visti: all.filter(t => t.watched).sort((a, b) => (b.watched_on || "").localeCompare(a.watched_on || "")),
    pref: all.filter(t => t.favorite), liste: myLists()
  };
  let list = seg[trkTab];
  if (trkTab === "watch" && wlNow) { const ok = await Promise.all(list.map(async t => (await lightProvs(rowItem(t))).some(p => isMine(p.provider_id)))); list = list.filter((t, i) => ok[i]); }
  const tabs = [["watch", "La mia lista"], ["visti", "Visti"], ["pref", "Preferiti"]];
  const empty = { watch: wlNow ? "Nessun titolo della tua lista è disponibile ora sui tuoi abbonamenti." : "La tua lista è vuota. Aggiungi i titoli che vuoi guardare con il tasto “Aggiungi alla lista”.", visti: "Non hai ancora segnato nulla come visto.", pref: "Nessun preferito: tocca il cuore dentro la scheda di un titolo." }[trkTab], eb = `<button class="btn pri" onclick="go('movie')">Scopri i film</button> <button class="btn" onclick="go('tonight')">Cosa guardo stasera?</button>`;
  return `<div class="row segs">${tabs.map(([k, l]) => `<button class="chip ${trkTab === k ? "on" : ""}" onclick="trkGo('${k}')">${l} <i>${seg[k].length}</i></button>`).join("")}<button class="chip ${trkTab === "liste" ? "on" : ""}" onclick="trkMore()">${ic("dots", 14)} Altro</button></div>
${trkTab === "watch" ? `<div class="row"><button class="chip ${wlNow ? "on" : ""}" onclick="wlNow=!wlNow;render()">Disponibili ora sui miei servizi</button></div>` : ""}
${trkTab === "liste" ? listsHtml() : list.length ? `<div class="grid">${list.map(t => tile(rowItem(t), trkTab)).join("")}</div>` : emptyBox(trkTab === "pref" ? "heart" : "list", empty, eb)}`;
}

/* ---------- Profilo: statistiche, DNA e badge ---------- */
function rxProfHtml() {
  const r = rxReport(), parts = [r.n ? r.n + " voti" : "", r.why ? r.why + " con il motivo" : "", r.sig ? r.sig + " altri segnali (schede aperte, “più così”, serate)" : ""].filter(Boolean);
  return `<h3 class="h">Come ti conosce l’algoritmo</h3><p class="mu">Ha imparato da ${parts.length ? parts.join(", ") : "ancora pochi dati: vota qualche titolo"}.${r.best.length ? " I consigli che apri e guardi di più arrivano da: <b>" + r.best.map(esc).join("</b> e <b>") + "</b>." : ""}${r.worst ? " Ti propone meno " + esc(r.worst) + ", che apri di rado." : ""}</p><div class="row"><button class="btn sm" onclick="rxForget()">Azzera ciò che ha imparato</button></div>`;
}
function badges() {
  const all = Object.values(S.titles), w = all.filter(t => t.watched), mins = all.reduce((a, t) => a + minsOf(t), 0);
  const eps = all.reduce((a, t) => a + (t.media === "tv" ? (t.watched ? ((t.eps || {})._n || 0) : epCount(t)) : 0), 0);
  const gs = new Set(); w.forEach(t => (t.genre_ids || []).forEach(g => gs.add(g)));
  return [["🎬", "Primo ciak", "Segna il primo titolo come visto", w.length, 1], ["🍿", "Cinefilo", "25 film visti", w.filter(t => t.media === "movie").length, 25], ["⏱️", "Maratoneta", "50 ore di visione", Math.floor(mins / 60), 50], ["📺", "Serie-dipendente", "100 episodi visti", eps, 100], ["⭐", "Critico", "20 titoli votati", w.filter(t => t.stars).length, 20], ["🧭", "Esploratore", "10 generi diversi", gs.size, 10], ["🚀", "Super Fan", "5 Super Watch", all.filter(t => t.hype).length, 5], ["📚", "Collezionista", "20 titoli in lista o visti", all.filter(t => t.watchlist || t.watched).length, 20]];
}
async function vProf2() {
  await genres().catch(() => {});
  const all = Object.values(S.titles), w = all.filter(t => t.watched), mins = all.reduce((a, t) => a + minsOf(t), 0), rs = w.filter(t => t.stars), avg = rs.length ? rs.reduce((a, t) => a + t.stars, 0) / rs.length : 0;
  const bg = {}, bm = {}; all.forEach(t => { const m = minsOf(t); if (!m) return; const g = GN[(t.genre_ids || [])[0]] || "Altro"; bg[g] = (bg[g] || 0) + m; const mo = (t.watched_on || today()).slice(0, 7); bm[mo] = (bm[mo] || 0) + m; });
  const bars = (o, cmp, cls) => { const e = Object.entries(o).sort(cmp).slice(0, 8), mx = Math.max(1, ...e.map(x => x[1])); return e.map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><i class="${cls || ""}" style="width:${Math.round(v / mx * 60)}%"></i><span class="mu">${(v / 60).toFixed(1)} h</span></div>`).join(""); };
  const a = affData(), dna = Object.entries(a.avg).filter(([g]) => GN[g] && a.n[g] >= 1).sort((x, y) => y[1] - x[1]).slice(0, 5);
  const p = P(), nm = p.name || (user ? user.email.split("@")[0] : "Cinefilo");
  return `<div class="prof">${avatarMe(84)}<div><h2 class="h">${esc(nm)}</h2><p class="mu">${sb && user ? (S.uname ? "@" + esc(S.uname) + " · " : "") + esc(user.email) : "Modalità locale"}</p><button class="btn sm" onclick="setTab='menu';go('set')">${ic("sliders", 16)} Impostazioni</button></div></div>
<div class="stats"><div class="stat"><b>${(mins / 60).toFixed(1)} h</b><span class="mu">tempo di visione</span></div><div class="stat"><b>${w.length}</b><span class="mu">titoli visti</span></div><div class="stat"><b>${avg ? avg.toFixed(1) + " ★" : "–"}</b><span class="mu">voto medio</span></div></div>
<details class="grp mt pf"><summary><b>Gusti, statistiche e badge</b><span class="mu">DNA dei gusti, ore, il tuo anno, badge</span></summary><div class="gb"><h3 class="h">DNA dei tuoi gusti</h3>${dna.length ? dna.map(([g, v]) => `<div class="bar"><span>${esc(GN[g])}</span><i class="pri" style="width:${Math.max(6, Math.round((v + 2) / 4 * 60))}%"></i><span class="mu">${v > 0.3 ? "💘" : v < -0.3 ? "👎" : "•"}</span></div>`).join("") : `<p class="mu">Fai qualche swipe e vota i titoli visti: qui comparirà il tuo profilo di gusto.</p>`}
${Object.keys(bg).length ? `<h3 class="h">Ore per genere</h3>${bars(bg, (x, y) => y[1] - x[1])}<h3 class="h">Ore per mese</h3>${bars(bm, (x, y) => y[0].localeCompare(x[0]), "gold")}` : ""}
${recapHtml()}${xProf()}${typeof rxReport === "function" ? rxProfHtml() : ""}<h3 class="h">Badge</h3><div class="badges">${badges().map(([ic, n, d, cur, tg]) => `<div class="badge ${cur >= tg ? "on" : ""}"><span>${ic}</span><b>${n}</b><small>${cur >= tg ? "Sbloccato" : Math.min(cur, tg) + "/" + tg} · ${d}</small></div>`).join("")}</div></div></details>
${LEG}<p class="mu small">Per le serie le ore si calcolano dagli episodi segnati. Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB. Disponibilità dei titoli fornita da JustWatch.</p>`;
}

/* ---------- Impostazioni ---------- */
function setGo(t) { setTab = t; imsg = ""; imsgMiss = []; render(); }
function setAv(i) { P().avatar = i; saveProfile(); render(); }
function saveName() { P().name = ($("#un").value || "").trim().slice(0, 24); saveProfile(); toast("Nome salvato"); render(); }
async function tsub(id) {
  const k = S.subs.indexOf(id); k < 0 ? S.subs.push(id) : S.subs.splice(k, 1);
  F.svc = F.svc.filter(x => isMine(x)); lsSet("cm_filters", F);
  try { await saveSubs(); } catch (e) { toast("Salvataggio non riuscito"); }
  D.cards = []; D.pages = {}; render();
}
var setProfile; /* definita più avanti */
var svList; /* definita più avanti */
async function setServ() {
  const pv = await loadProv();
  return `<h2 class="h">I tuoi abbonamenti</h2><p class="mu">Seleziona i servizi di streaming a cui sei abbonato: ti mostro solo quello che puoi guardare davvero.</p>${svList(pv)}
${await costBox()}
${await xPlan()}
${S.subs.length ? `<p><button class="btn pri" onclick="go('home')">Vai alla Home</button></p>` : `<p class="mu">Seleziona almeno un abbonamento per cominciare.</p>`}`;
}
function setData() {
  return `<h2 class="h">Azzera i dati</h2><p class="mu">Queste azioni non si possono annullare.</p>
<div class="row"><button class="btn" onclick="resetData('hist')">Azzera visti, voti e liste</button><button class="btn" onclick="resetData('all')">Azzera tutto</button></div>
<p class="mu">“Azzera visti, voti e liste” cancella titoli visti, stelle, watchlist, preferiti e swipe: i consigli ripartono da zero. “Azzera tutto” cancella anche i servizi scelti e il profilo.</p>`;
}
async function resetData(kind) {
  if (!confirm(kind === "all" ? "Cancellare tutto: titoli, voti, liste, servizi e profilo?" : "Cancellare titoli visti, voti, liste e swipe?")) return;
  try {
    if (sb) {
      let r = await sb.from("titles").delete().eq("user_id", user.id); if (r.error) throw r.error;
      if (kind === "all") { r = await sb.from("settings").delete().eq("user_id", user.id); if (r.error) throw r.error; }
    }
    S.titles = {}; affC = null;
    if (kind === "all") { S.subs = []; S.profile = { name: "", avatar: 0 }; try { localStorage.removeItem(LS + "_p" + (user ? user.id : "")); } catch (e) {} }
    if (!sb) localSave();
    D.seen = new Set(); D.cards = []; D.pages = {}; D.hist = []; toast("Dati azzerati");
  } catch (e) { toast("Operazione non riuscita"); }
  render();
}
async function setOther() {
  return aspectBox() + xOther() + installBox() + `<h2 class="h">Paese</h2><p class="mu">Cambia la disponibilità dei titoli sui servizi.</p>
<select onchange="setRegion(this.value)">${[["IT", "Italia"], ["CH", "Svizzera"], ["FR", "Francia"], ["DE", "Germania"], ["ES", "Spagna"], ["GB", "Regno Unito"], ["US", "Stati Uniti"]].map(([v, l]) => `<option value="${v}" ${R === v ? "selected" : ""}>${l}</option>`).join("")}</select>
<h2 class="h">Backup</h2><p class="mu">Scarica tutti i tuoi dati in un file, o ripristinali da un backup.</p>
<div class="row"><button class="btn" onclick="exportData()">Scarica backup</button><label class="btn">Ripristina da file<input type="file" accept=".json" hidden onchange="importBackup(this)"></label></div>
${sb && user ? `<h2 class="h">Elimina account</h2><p class="mu">Cancella per sempre l’account e tutti i dati collegati.</p><button class="btn danger" onclick="deleteAccount()">Elimina il mio account</button>` : ""}` + await blockedBox();
}
function setRegion(v) { R = v; lsSet("cm_region", v); PROV = null; memo.clear(); D.cards = []; D.pages = {}; toast("Paese aggiornato"); render(); }
function exportData() {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ v: 2, S }, null, 1)], { type: "application/json" }));
  a.download = "backup-" + APP.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + today() + ".json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
async function importBackup(inp) {
  const f = inp.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text()), src = j.S || j, keys = [];
    Object.entries(src.titles || {}).slice(0, 20000).forEach(([k, t]) => { const c = cleanRow(Object.assign({}, t, { tmdb_key: k })); if (c) { S.titles[k] = Object.assign(blank({ key: k, media: c.media, id: c.tmdb_id, title: c.title, year: c.year, poster: c.poster, genre_ids: c.genre_ids }), c); keys.push(k); } });
    if (Array.isArray(src.subs) && !S.subs.length) { S.subs = src.subs.filter(Number.isInteger); await saveSubs(); }
    affC = null; await saveTitles(keys); toast(keys.length + " titoli ripristinati");
  } catch (e) { toast("File di backup non valido"); }
  render();
}
async function deleteAccount() {
  if (!sb || !confirm("Eliminare definitivamente l’account e tutti i dati? Non si può annullare.")) return;
  try { const l = await sb.storage.from(CMB).list(user.id, { limit: 1000 }); if (l.data && l.data.length) await sb.storage.from(CMB).remove(l.data.map(x => user.id + "/" + x.name)); } catch (e) {}
  const r = await sb.rpc("delete_my_account");
  if (r.error) { toast("Non riuscito: esegui l’aggiornamento SQL"); return; }
  await sb.auth.signOut();
}

/* ---------- Importazione CSV con mini-tutorial ---------- */
function parseCSV(t) {
  const rows = []; let r = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { r.push(f); f = ""; }
    else if (c === "\n") { r.push(f); rows.push(r); r = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}
const dateOf = v => { v = v || ""; let m = v.match(/\d{4}-\d{2}-\d{2}/); if (m) return m[0]; m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : today(); };
const baseName = raw => /stagione|season|episodio|episode|capitolo|chapter|serie limitata|limited series|miniserie|volume/i.test(raw) ? raw.split(":")[0].trim() : raw.trim();
async function impText(inp) {
  const files = [...(inp.files || [])]; if (!files.length) return;
  const say = t => { const e = $("#imsg"); if (e) e.textContent = t; };
  const names = new Map();
  for (const f of files) {
    const rows = parseCSV((await f.text()).replace(/^\uFEFF/, "")); if (!rows.length) continue;
    const h = rows[0].map(x => x.trim().toLowerCase());
    let ti = h.findIndex(x => ["title", "titolo", "name", "nome"].includes(x)), di = h.findIndex(x => /start|date|data/.test(x)), body = rows.slice(1);
    const si = h.findIndex(x => x.startsWith("supplemental")), du = h.indexOf("duration");
    if (ti < 0) { ti = 0; di = -1; body = rows; }
    body.forEach(r => {
      const raw = (r[ti] || "").trim(); if (!raw) return;
      if (si >= 0 && (r[si] || "").trim()) return;
      if (du >= 0 && /^0:00:/.test((r[du] || "").trim())) return;
      const nm = baseName(raw); if (!names.has(nm)) names.set(nm, dateOf(di >= 0 ? r[di] : ""));
    });
  }
  if (!names.size) { imsg = "Non ho trovato titoli nel file: controlla che sia il file giusto."; imsgMiss = []; render(); return; }
  const list = [...names].slice(0, 400), keys = [], miss = []; let idx = 0, ok = 0, dup = 0;
  const work = async () => {
    while (idx < list.length) {
      const [nm, d] = list[idx++]; say(`Importazione ${idx} di ${list.length}…`);
      try {
        const r = await tmdb("/search/multi", { query: nm });
        const x = r.results.find(y => y.media_type === "movie" || y.media_type === "tv"); if (!x) { miss.push(nm); continue; }
        const it = norm(x, x.media_type), t = S.titles[it.key]; if (t && t.watched) { dup++; continue; }
        let rt = 0, eps = null; try { const f = await full(it); if (it.media === "tv") { const m = tvMeta(f); rt = m.n * m.m; eps = Object.assign({}, t && t.eps, { _n: m.n, _m: m.m }); } else rt = f.runtime || 0; } catch (e) {}
        S.titles[it.key] = Object.assign(blank(it), t, { runtime: rt, watched: true, watched_on: d, watchlist: false }, eps ? { eps } : {}); keys.push(it.key); ok++;
      } catch (e) { miss.push(nm); }
    }
  };
  await Promise.all([work(), work(), work(), work()]);
  affC = null; try { await saveTitles(keys); } catch (e) { toast("Salvataggio non riuscito"); }
  imsg = `${ok} titoli importati` + (dup ? `, ${dup} erano già tra i visti` : "") + (names.size > 400 ? ` (letti i primi 400 di ${names.size})` : "") + ". Li trovi nel Tracker, da valutare con le stelle.";
  imsgMiss = miss.slice(0, 15); render();
}
const noExp = (name, extra) => [name, "Nessun pulsante di esportazione", [
  `${name} non permette di scaricare la cronologia di visione con un clic.`,
  extra || `Puoi chiedere una copia dei tuoi dati personali dalle impostazioni privacy dell’account o con il modulo privacy del servizio (diritto di accesso previsto dal GDPR). Di solito la risposta arriva entro circa 30 giorni e il formato non è garantito.`,
  `Soluzione rapida: apri la cronologia o la lista “Continua a guardare” su ${name} e scrivi i titoli in un file di testo (.txt, va bene il Blocco note), uno per riga.`,
  `Carica il file qui sotto.`], ""];
const SVC = [
  ["Netflix", "Esportazione diretta in CSV", [
    `Apri netflix.com dal browser del computer (non dall’app) ed entra con il tuo account.`,
    `Vai alla pagina della cronologia: <a href="https://www.netflix.com/viewingactivity" target="_blank" rel="noopener">netflix.com/viewingactivity</a> (oppure Profilo → Account → scegli il profilo → Cronologia visualizzazioni).`,
    `In fondo alla pagina premi “Scarica tutto”: ottieni un file CSV.`, `Caricalo qui sotto.`], "L’esportazione riguarda un profilo alla volta: ripeti per gli altri profili. Trailer e anteprime vengono ignorati."],
  ["Prime Video", "Tramite richiesta dati ad Amazon", [
    `Nel tuo account Amazon cerca “Richiedi i tuoi dati” (Request My Data), nelle impostazioni dell’account o nel Centro Privacy.`,
    `Scegli la categoria Prime Video e conferma la richiesta dall’email che ricevi.`,
    `Amazon prepara l’archivio: può servire da qualche ora a diversi giorni. Riceverai un’email con il link.`,
    `Scarica lo ZIP ed estrailo sul computer: cerca il file CSV della cronologia di visione (nel nome compare “viewing history”) e caricalo qui sotto.`], "I nomi esatti dei file possono cambiare. Puoi caricare più file insieme."],
  noExp("Disney+"), noExp("Max"),
  noExp("Apple TV+", `Puoi richiedere una copia dei tuoi dati su <a href="https://privacy.apple.com" target="_blank" rel="noopener">privacy.apple.com</a>, scegliendo le informazioni sui servizi multimediali. Non è detto che includa la cronologia dettagliata di Apple TV+.`),
  noExp("Paramount+"), noExp("NOW"), noExp("RaiPlay"),
  ["Altro (Letterboxd, liste a mano)", "Qualsiasi file con i titoli", [
    `Su Letterboxd: Impostazioni → Dati → Esporta i tuoi dati. Dallo ZIP estratto carica il file dei film visti (watched.csv).`,
    `Per qualsiasi altra fonte: un file .txt o .csv con un titolo per riga. Se c’è una colonna con intestazione “Title”, “Titolo” o “Name” viene letta; se c’è una colonna “Date” o “Data” viene usata come data di visione.`], ""]
];
function setSvc(i) { svcSel = i; render(); }
var setImp; /* definita più avanti */
async function vSet2() {
  const tabs = [["prof", "Profilo"], ["serv", "Abbonamenti"], ["imp", "Importa CSV"], ["dati", "Dati"], ["altro", "Altro"]];
  const body = setTab === "serv" ? await setServ() : setTab === "imp" ? setImp() : setTab === "dati" ? setData() : setTab === "altro" ? await setOther() : setProfile();
  return `<div class="row"><button class="back" onclick="go('prof')">‹ Profilo</button></div><div class="row">${tabs.map(([k, l]) => `<button class="chip ${setTab === k ? "on" : ""}" onclick="setGo('${k}')">${l}</button>`).join("")}</div>${body}`;
}

/* ---------- Accesso ---------- */
const LEG = `<p class="mu small leg"><a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a> · <a href="termini.html" target="_blank" rel="noopener">Termini di servizio</a> · <a href="cookie.html" target="_blank" rel="noopener">Cookie</a> · <a href="crediti.html" target="_blank" rel="noopener">Crediti</a></p>`;
const loginHtml = () => `<div class="lg"><div class="lgh"><div class="lgk">${logoMark(76)}</div><div class="lgw">${esc(APP)}</div><p>Un solo posto per tutto quello che guardi, sempre sincronizzato tra PC e telefono.</p></div>
<div class="lgc"><button class="gsi-material-button" onclick="google()" aria-label="Continua con Google"><div class="gsi-material-button-state"></div><div class="gsi-material-button-content-wrapper"><div class="gsi-material-button-icon"><img src="google-logo.svg" alt="" width="20" height="20" onerror="this.style.visibility='hidden'"></div><span class="gsi-material-button-contents">Continua con Google</span></div></button>
<div class="or"><span>oppure con la tua email</span></div>
<label class="fl">Email<input id="em" type="email" placeholder="nome@esempio.it" autocomplete="email"></label>
<label class="fl">Password<input id="pw" type="password" placeholder="Almeno 8 caratteri per registrarti" autocomplete="current-password" maxlength="72"></label>
<button class="link fgt" onclick="forgot()">Password dimenticata?</button>
<button class="btn pri big" onclick="auth('in')">Accedi</button>
<div class="lgn"><label class="ck"><input type="checkbox" id="ok"> <span>Per creare l’account: ho almeno 14 anni e accetto i <a href="termini.html" target="_blank" rel="noopener">Termini</a> e la <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a></span></label>
<button class="btn big" onclick="auth('up')">Crea un account</button></div>
<p id="am" class="mu"></p></div>${LEG}</div>`;
let RSD = { email: "", msg: "", t: 0 };
function resendUi() {
  const o = $("#am"); if (!o || !RSD.msg) return;
  const w = Math.max(0, 60 - Math.floor((Date.now() - RSD.t) / 1000));
  o.innerHTML = esc(RSD.msg) + `<br><button class="btn sm" ${w ? "disabled" : ""} onclick="resendMail()">${w ? "Invia di nuovo la mail (" + w + " s)" : "Invia di nuovo la mail"}</button>`;
  if (w) setTimeout(resendUi, 1000);
}
async function resendMail() {
  try { const r = await sb.auth.resend({ type: "signup", email: RSD.email, options: { emailRedirectTo: location.origin + location.pathname } }); RSD.msg = r.error ? r.error.message : "Mail inviata di nuovo a " + RSD.email + ". Controlla anche lo spam."; }
  catch (x) { RSD.msg = "Errore di rete: " + x.message; }
  RSD.t = Date.now(); resendUi();
}
async function auth(m) {
  const out = $("#am"), e = ($("#em").value || "").trim(), p = $("#pw").value || "";
  if (!e || !p) { out.textContent = "Campi vuoti: email " + e.length + " caratteri, password " + p.length + " caratteri. Scrivili a mano e riprova."; return; }
  if (m === "up" && p.length < 8) { out.textContent = "Scegli una password di almeno 8 caratteri."; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254) { out.textContent = "Controlla l’indirizzo email."; return; }
  if (m === "up" && !$("#ok").checked) { out.textContent = "Per registrarti spunta la casella su età, Termini e Privacy Policy."; return; }
  out.textContent = "Attendere…";
  try {
    const r = m === "in" ? await sb.auth.signInWithPassword({ email: e, password: p }) : await sb.auth.signUp({ email: e, password: p, options: { emailRedirectTo: location.origin + location.pathname } });
    if (r.error) { out.textContent = r.error.message; return; }
    if (m === "up" && !r.data.session) { RSD = { email: e, msg: "Controlla la tua email per confermare l’account, poi accedi.", t: Date.now() }; resendUi(); } else out.textContent = "";
  } catch (x) { out.textContent = "Errore di rete: " + x.message; }
}
let FGT = 0;
async function forgot() {
  const out = $("#am"), e = ($("#em").value || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254) { out.textContent = "Scrivi prima la tua email qui sopra, poi tocca “Password dimenticata?”."; return; }
  const w = 60 - Math.floor((Date.now() - FGT) / 1000); if (FGT && w > 0) { out.textContent = "Hai già chiesto la mail: aspetta " + w + " secondi prima di riprovare."; return; }
  out.textContent = "Attendere…"; FGT = Date.now();
  try {
    const r = await sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin + location.pathname });
    out.textContent = r.error && /rate|seconds|many/i.test(r.error.message) ? "Troppe richieste: riprova tra qualche minuto." : "Se l’indirizzo è registrato, ti abbiamo inviato una mail con il link per scegliere una nuova password. Controlla anche lo spam.";
  } catch (x) { out.textContent = "Errore di rete: " + x.message; }
}
let RECOV = false;
const recoveryHtml = () => `<div class="lg"><div class="lgh"><div class="lgk">${logoMark(76)}</div><div class="lgw">${esc(APP)}</div><p>Scegli la tua nuova password.</p></div>
<div class="lgc"><label class="fl">Nuova password<input id="np1" type="password" placeholder="Almeno 8 caratteri" autocomplete="new-password" maxlength="72"></label>
<label class="fl">Ripeti la password<input id="np2" type="password" placeholder="Ripeti la password" autocomplete="new-password" maxlength="72" onkeydown="if(event.key==='Enter')newPass()"></label>
<button class="btn pri big" onclick="newPass()">Salva la password</button><p id="am" class="mu"></p></div></div>`;
async function newPass() {
  const out = $("#am"), a = $("#np1").value || "", b = $("#np2").value || "";
  if (a.length < 8) { out.textContent = "Scegli una password di almeno 8 caratteri."; return; }
  if (a !== b) { out.textContent = "Le due password non coincidono."; return; }
  out.textContent = "Attendere…";
  try { const r = await sb.auth.updateUser({ password: a }); if (r.error) { out.textContent = r.error.message; return; } RECOV = false; history.replaceState(history.state, "", location.pathname); toast("Password aggiornata"); render(); }
  catch (x) { out.textContent = "Errore di rete: " + x.message; }
}
async function google() {
  const r = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
  if (r.error) { const o = $("#am"); if (o) o.textContent = r.error.message; }
}
async function logout() { await sb.auth.signOut(); try { if (window.caches) await caches.delete("tonightly-data"); } catch (e) {} }

/* ---------- Schermate principali e avvio ---------- */
function whoUpdate() {
  const w = $("#who"), p = P(), nm = p.name || (user && user.email ? user.email.split("@")[0] : "");
  w.innerHTML = avatarMe(34) + `<span class="wn">${esc(nm)}</span>`;
}
function vSwipe() {
  return `<div class="sec"><div class="row"><button class="back" onclick="go('home')">‹ Home</button></div><h2 class="h">Scegli al volo</h2><p class="mu">Per ogni titolo: Visto, Non mi interessa o Aggiungi alla watchlist. Aiuta anche a capire i tuoi gusti.</p></div>` + deckHtml();
}
async function startDeck() {
  try { await genres(); } catch (e) { D.err = e.message; }
  if (!(view === "swipe" || view === "onb")) return;
  if (!D.cards.length) { await fillDeck(); }
  if (view === "swipe" || view === "onb") renderStack();
}
/* ---------- Annulla, menu azioni, scelta rapida ---------- */
let UNDO = null;
function toast(t, undo) {
  const e = $("#toast"); e.innerHTML = esc(t) + (undo ? ` <button class="tu" onclick="toastUndo()">Annulla</button>` : "");
  UNDO = undo || null; e.classList.add("on"); e.classList.toggle("act", !!undo); clearTimeout(e._t);
  e._t = setTimeout(() => { e.classList.remove("on"); UNDO = null; }, undo ? 6000 : 2600);
}
function toastUndo() { const f = UNDO; UNDO = null; $("#toast").classList.remove("on"); if (f) f(); }
const snapT = k => S.titles[k] ? JSON.parse(JSON.stringify(S.titles[k])) : null;
async function restoreT(k, s) {
  if (s) S.titles[k] = s; else delete S.titles[k]; affC = null;
  try { await saveTitles([k]); } catch (e) {}
  if (["home", "movie", "tv", "list", "other", "tonight", "prof"].includes(view)) { const y = window.scrollY; await render(); window.scrollTo(0, y); }
}
function syncCards(k) {
  const on = !!(S.titles[k] || {}).watchlist;
  document.querySelectorAll('.nc[data-k="' + k + '"]').forEach(el => {
    const q = el.querySelector(".qa"); if (q) { q.classList.toggle("on", on); q.innerHTML = ic(on ? "check" : "plus", 16); q.setAttribute("aria-label", on ? "Togli dalla lista" : "Aggiungi alla lista"); }
    const b = el.querySelector(".rb.wl"); if (b) { b.classList.toggle("on", on); b.innerHTML = ic(on ? "minus" : "plus", 16); b.title = on ? "Rimuovi dalla lista" : "Aggiungi alla lista"; }
  });
  document.querySelectorAll('.wlb[data-k="' + k + '"]').forEach(b => { b.innerHTML = ic(on ? "minus" : "plus", 18) + (on ? " Rimuovi dalla lista" : " Aggiungi alla lista"); });
}
function amenu(title, rows) {
  $("#amenu").innerHTML = `<div class="ov" onclick="amClose()"><div class="sheet am" role="dialog" onclick="event.stopPropagation()"><div class="grab"></div><h3 class="h pad">${esc(title)}</h3><div class="pad amr">${rows.map(([i, l, f, c]) => `<button class="amb ${c || ""}" onclick="amClose();${f}">${ic(i, 20)}<span>${l}</span></button>`).join("")}</div><div class="pad"><button class="btn" style="width:100%" onclick="amClose()">Chiudi</button></div></div></div>`;
  document.body.classList.add("noscroll");
}
function amClose() { $("#amenu").innerHTML = ""; if (!$("#sheet .sheet")) document.body.classList.remove("noscroll"); }
function qMenu(k) {
  const it = byKey(k); if (!it) return; const t = S.titles[k] || {};
  amenu(it.title, [[t.watchlist ? "minus" : "plus", t.watchlist ? "Rimuovi dalla lista" : "Aggiungi alla lista", `wlTog('${k}')`], ["check", t.watched ? "Modifica voto" : "Segna come visto", `rate(byKey('${k}'))`], ["list", "Aggiungi a una mia lista…", `listPick('${k}')`], ...(t.watched ? [] : [["up", "Più così", `rxMore('${k}')`], ["down", "Non per me…", `rxNot('${k}')`]]), ["info", "Dettagli", `openSheet('${k}')`]]);
}
let LP = 0;
function cardClick(k) { if (Date.now() - LP < 700) return; openSheet(k); }
(function () {
  let tm = 0, sx = 0, sy = 0;
  document.addEventListener("pointerdown", e => { const c = e.target.closest && e.target.closest(".nc[data-k],.tile[data-k]"); if (!c || e.pointerType === "mouse" || e.target.closest("button,a")) return; sx = e.clientX; sy = e.clientY; clearTimeout(tm); tm = setTimeout(() => { LP = Date.now(); vib(15); qMenu(c.dataset.k); }, 520); });
  ["pointerup", "pointercancel"].forEach(ev => document.addEventListener(ev, () => clearTimeout(tm)));
  document.addEventListener("pointermove", e => { if (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8) clearTimeout(tm); });
  document.addEventListener("contextmenu", e => { const c = e.target.closest && e.target.closest(".nc[data-k]"); if (c) { e.preventDefault(); LP = Date.now(); qMenu(c.dataset.k); } });
})();

/* ---------- Liste personalizzate ---------- */
const myLists = () => P().lists || (P().lists = []);
const miniOf = it => ({ tmdb_key: it.key, media: it.media, tmdb_id: it.id, title: it.title, year: it.year || "", poster: it.poster || null, genre_ids: it.genre_ids || [] });
function listPick(k) {
  const it = byKey(k); if (!it) return; const L = myLists();
  amenu("Aggiungi a una lista", [...L.map(l => [l.items.some(x => x.tmdb_key === k) ? "check" : "plus", esc(l.name) + (l.items.some(x => x.tmdb_key === k) ? " (tocca per togliere)" : ""), `listToggle('${l.id}','${k}')`]), ["plus", "Nuova lista…", `listNew('${k}')`], ["users", "Lista condivisa…", `sharedPick('${k}')`]]);
}
async function listToggle(id, k) {
  const l = myLists().find(x => x.id === id), it = byKey(k); if (!l || !it) return;
  const i = l.items.findIndex(x => x.tmdb_key === k); if (i < 0) l.items.push(miniOf(it)); else l.items.splice(i, 1);
  await saveProfile(); toast(i < 0 ? "Aggiunto a “" + l.name + "”" : "Tolto da “" + l.name + "”"); if (view === "list") render();
}
async function listNew(k) {
  const n = (prompt("Nome della lista (es. “Da guardare con Marta”)") || "").trim().slice(0, 30); if (!n) return;
  const l = { id: "l" + Date.now(), name: n, items: [] }; myLists().push(l); if (k) { const it = byKey(k); if (it) l.items.push(miniOf(it)); }
  await saveProfile(); toast("Lista creata"); if (view === "list") render();
}
async function listDel(id) { if (!confirm("Eliminare questa lista? I titoli non vengono cancellati.")) return; P().lists = myLists().filter(x => x.id !== id); await saveProfile(); render(); }
async function listRen(id) { const l = myLists().find(x => x.id === id); if (!l) return; const n = (prompt("Nuovo nome", l.name) || "").trim().slice(0, 30); if (!n) return; l.name = n; await saveProfile(); render(); }
async function listRem(id, k) { const l = myLists().find(x => x.id === id); if (!l) return; l.items = l.items.filter(x => x.tmdb_key !== k); await saveProfile(); render(); }
async function listShare(id) {
  const l = myLists().find(x => x.id === id); if (!l) return;
  const text = l.name + " (" + APP + ")\n" + l.items.map(x => "• " + x.title + (x.year ? " (" + x.year + ")" : "")).join("\n");
  try { if (navigator.share) { await navigator.share({ title: l.name, text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("Lista copiata negli appunti"); } catch (e) { prompt("Copia la lista:", text); }
}
function listsHtml() {
  const L = myLists();
  const head = `<div class="row"><button class="btn pri sm" onclick="listNew()">${ic("plus", 16)} Nuova lista</button></div>`;
  if (!L.length) return head + emptyBox("list", "Crea liste tutte tue: “Da guardare con Marta”, “Horror di Halloween”… Si aggiungono dal menu ⋯ di ogni titolo.", "");
  return head + L.map(l => `<div class="lst"><div class="lh"><h3 class="h">${esc(l.name)} <span class="mu">${l.items.length}</span></h3><div class="row"><button class="btn sm" onclick="listShare('${l.id}')">${ic("share", 15)} Condividi</button><button class="btn sm" onclick="listRen('${l.id}')">${ic("edit", 15)}</button><button class="btn sm danger" onclick="listDel('${l.id}')">${ic("trash", 15)}</button></div></div>
${l.items.length ? `<div class="grid">${l.items.map(x => { const it = rowItem(x); ITEMS[it.key] = it; return `<div class="tile" data-k="${it.key}" onclick="cardClick('${it.key}')">${it.poster ? `<img class="po" loading="lazy" src="${IMG}w342${it.poster}" alt="">` : `<div class="po no">${esc(it.title)}</div>`}<b class="tt">${esc(it.title)}</b><div class="mu">${esc(it.year)}</div><div class="tacts"><button class="btn sm" onclick="event.stopPropagation();listRem('${l.id}','${it.key}')">${ic("minus", 14)} Togli</button></div></div>`; }).join("")}</div>` : `<p class="mu">Lista vuota.</p>`}</div>`).join("");
}
const emptyBox = (icon, text, btn) => `<div class="emptyb">${ic(icon, 34)}<p>${text}</p>${btn || ""}</div>`;

/* ---------- Stasera: umore e “in due” ---------- */
const MOODS = [["Risate", [35]], ["Emozioni", [18, 10749]], ["Suspense", [53, 27, 9648]], ["Relax", [35, 10751, 16]], ["Evasione", [12, 878, 14]], ["Azione", [28, 80]]];
const PGEN = [28, 35, 18, 878, 27, 53, 16, 10749, 12, 14, 9648, 80, 10751, 99];
let TN = { mood: [], two: false, pg: [], res: null };
const tgl = (a, v) => { const i = a.indexOf(v); i < 0 ? a.push(v) : a.splice(i, 1); };
function tnMood(i) { tgl(TN.mood, i); TN.res = null; render(); }
function tnTwo() { TN.two = !TN.two; TN.res = null; render(); }
function tnPg(g) { tgl(TN.pg, g); TN.res = null; render(); }
function goMood(i) { TN = { mood: i == null ? [] : [i], two: false, pg: [], res: null }; go("tonight"); }
async function tnCompute() {
  const mg = [...new Set(TN.mood.flatMap(i => MOODS[i][1]))], pg = TN.two ? TN.pg : [];
  if (!mg.length && !pg.length) return (await recItems(24)).map(r => ({ it: r.it, extra: r.extra }));
  const q = gs => ["movie", "tv"].map(m => disc(m, { gs, page: 1 }).then(r => r.results.map(x => norm(x, m))).catch(() => []));
  const pools = [...(mg.length ? q(mg) : []), ...(pg.length ? q(pg) : [])], seen = new Set(), c = [];
  (await Promise.all(pools)).flat().forEach(it => { const t = S.titles[it.key]; if (seen.has(it.key) || !it.poster || (t && (t.watched || t.skipped))) return; seen.add(it.key); c.push(it); });
  c.forEach(it => {
    const g = it.genre_ids || [], ov = pg.length ? g.filter(x => pg.includes(x)).length / Math.min(pg.length, Math.max(1, g.length)) : 0, mo = mg.length && g.some(x => mg.includes(x)) ? 1 : 0, s0 = scoreIt(it), t = S.titles[it.key];
    it._s = s0 + ov * 1.3 + mo * .8 + (t && t.watchlist ? .5 : 0); it._x = pg.length && ov > 0 && s0 > -.1 ? "Piace a entrambi" : (t && t.watchlist ? "Nella tua lista" : "");
  });
  c.sort((a, b) => b._s - a._s);
  return c.slice(0, 24).map(it => ({ it, extra: it._x }));
}
var tnSurprise; /* definita più avanti */
async function vTonight() {
  if (!TN.res) TN.res = await tnCompute();
  const chip = (on, f, l) => `<button class="chip ${on ? "on" : ""}" onclick="${f}">${l}</button>`;
  return `<div class="sec pt"><div class="row"><button class="back" onclick="go('home')">‹ Home</button></div>
<h2 class="h">${ic("moon", 24)} Cosa guardiamo stasera?</h2><p class="mu">Scegli l’umore: ti propongo qualcosa che puoi guardare davvero con i tuoi abbonamenti. Se siete in due, aggiungi anche i gusti dell’altra persona.</p>
<div class="row">${MOODS.map((m, i) => chip(TN.mood.includes(i), `tnMood(${i})`, m[0])).join("")}</div>
<div class="tno"><button onclick="tnSurprise()"><span class="ti">${ic("dice", 22)}</span><b>Sorprendimi</b><small>Scelgo io per te</small></button><button onclick="TG.tab='duo';TG.room=null;go('together')"><span class="ti">${ic("users", 22)}</span><b>Insieme</b><small>Votate dal telefono</small></button><button onclick="xRoulette()"><span class="ti">${ic("list", 22)}</span><b>Dalla lista</b><small>Pesca dai tuoi salvati</small></button></div>
<details class="grp mt"><summary>Altri modi per scegliere</summary><div class="gb"><div class="row"><button class="chip" onclick="go('time')">${ic("clock", 15)} Quanto tempo hai?</button><button class="chip" onclick="go('swipe')">${ic("cards", 15)} Swipe</button><button class="chip" onclick="go('other')">${ic("unlock", 15)} Servizi che non hai</button></div></div></details>
${TN.res.length ? `<div class="grid">${TN.res.map(r => card(r.it, r.extra)).join("")}</div>` : emptyBox("moon", "Nessun risultato con queste scelte sui tuoi abbonamenti. Prova con meno generi.", "")}</div>`;
}

/* ---------- Calendario uscite (serie) ---------- */
async function vCal() {
  const d = await soonData().catch(() => ({ tv: [], mv: [] })), by = {};
  d.tv.forEach(r => (by[r.date] = by[r.date] || { tv: [], mv: [] }).tv.push(r));
  d.mv.forEach(m => (by[m.date] = by[m.date] || { tv: [], mv: [] }).mv.push(m));
  const ds = Object.keys(by).sort();
  if (!ds.length) return emptyBox("calendar", "Nessuna uscita in arrivo. Segna le serie che guardi e qui vedrai nuove stagioni ed episodi con la data.", "");
  return `<p class="mu">Nuove stagioni e prossimi episodi delle serie che segui, più i film in uscita che potrebbero piacerti.</p>${icsButton(d)}` + ds.map(k => `<h3 class="h">${esc(fmtD(k))} <span class="mu">${esc(inDays(k))}</span></h3>${by[k].tv.length ? `<div class="tvg">${by[k].tv.map(soonCard).join("")}</div>` : ""}${by[k].mv.length ? `<div class="mvs">${by[k].mv.map(m => card(m)).join("")}</div>` : ""}`).join("");
}

/* ---------- Costo degli abbonamenti ---------- */
const eur = v => v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
function setPrice(id, v) { const pr = P().prices || (P().prices = {}); const n = parseFloat(String(v).replace(",", ".")); if (n > 0) pr[id] = Math.round(n * 100) / 100; else delete pr[id]; saveProfile(); render(); }
async function costBox() {
  const pv = await loadProv(), subs = S.subs.filter(id => pv.some(p => p.provider_id === id)); if (!subs.length) return "";
  const pr = P().prices || {}, wl = Object.values(S.titles).filter(t => t.watchlist && !t.watched).slice(0, 40);
  const av = await Promise.all(wl.map(t => lightProvs(rowItem(t)))), cnt = {};
  av.forEach(f => { const seen = new Set(); f.forEach(p => subs.forEach(id => { if (id === p.provider_id || (ALIAS[id] || []).includes(p.provider_id)) seen.add(id); })); seen.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; }); });
  const tot = subs.reduce((a, id) => a + (+pr[id] || 0), 0);
  return `<h2 class="h">${ic("euro", 22)} Quanto spendi</h2><p class="mu">Inserisci il prezzo mensile di ogni abbonamento (facoltativo). Il prezzo resta nel tuo profilo e non viene condiviso.</p>
${subs.map(id => { const p = pv.find(x => x.provider_id === id), n = cnt[id] || 0; return `<div class="cost"><img src="${IMG}w45${p.logo_path}" alt="" width="28" height="28"><b>${esc(p.provider_name)}</b><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="€ / mese" value="${pr[id] || ""}" onchange="setPrice(${id},this.value)" aria-label="Prezzo mensile ${esc(p.provider_name)}"><span class="mu small">${wl.length ? n + " nella tua lista" : ""}</span>${wl.length >= 3 && !n && pr[id] ? `<span class="warn small">Nessun titolo della tua lista è qui: valuta se ti serve</span>` : ""}</div>`; }).join("")}
${tot ? `<p class="sum"><b>${eur(tot)}</b> al mese · <b>${eur(tot * 12)}</b> all’anno</p>` : ""}`;
}

/* ---------- Riepilogo dell’anno ---------- */
function recapData() {
  const y = String(new Date().getFullYear()), ws = Object.values(S.titles).filter(t => t.watched && (t.watched_on || "").startsWith(y)); if (ws.length < 3) return null;
  const gc = {}; ws.forEach(t => { const g = (t.genre_ids || [])[0]; if (g) gc[g] = (gc[g] || 0) + 1; });
  const tg = Object.entries(gc).sort((a, b) => b[1] - a[1])[0], fav = ws.filter(t => t.stars === 5).slice(0, 3).map(t => t.title);
  return { y, n: ws.length, films: ws.filter(t => t.media === "movie").length, tv: ws.filter(t => t.media === "tv").length, h: ws.reduce((a, t) => a + minsOf(t), 0) / 60, g: tg && GN[tg[0]] ? GN[tg[0]] : "", fav };
}
var recapHtml; /* definita più avanti */
async function shareRecap() {
  const r = recapData(); if (!r) return;
  const text = `Il mio ${r.y} su ${APP}: ${r.n} titoli visti (${r.films} film, ${r.tv} serie), circa ${r.h.toFixed(0)} ore${r.g ? ", genere preferito: " + r.g : ""}.` + (r.fav.length ? " I miei 5 stelle: " + r.fav.join(", ") + "." : "");
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("Testo copiato negli appunti"); } catch (e) { prompt("Copia il testo:", text); }
}

/* ---------- Installazione, aspetto ---------- */
let DEF = null; addEventListener("beforeinstallprompt", e => { e.preventDefault(); DEF = e; });
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) { const hadSW = !!navigator.serviceWorker.controller; let swReload = false; navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadSW && !swReload) { swReload = true; location.reload(); } }); navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(r => { r.update().catch(() => {}); document.addEventListener("visibilitychange", () => { if (!document.hidden) r.update().catch(() => {}); }); }).catch(() => {}); }
const isStandalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
var installNow; /* definita più avanti */
var instBanner; /* definita più avanti */
var installBox; /* definita più avanti */
function setUI(k, v) { UI[k] = v; lsSet("cm_ui", UI); applyUI(); if (view === "set") render(); }
function aspectBox() {
  const ch = (on, f, l) => `<button class="chip ${on ? "on" : ""}" onclick="${f}">${l}</button>`;
  return `<h2 class="h">Aspetto</h2><p class="mu">Tema</p><div class="row">${[["dark", "Scuro"], ["light", "Chiaro"], ["auto", "Automatico"]].map(([v, l]) => ch(UI.theme === v, `setUI('theme','${v}')`, l)).join("")}</div>
<p class="mu">Colore principale</p><div class="row">${ACCS.map(([c, n]) => `<button class="sw-c ${UI.acc === c ? "on" : ""}" style="background:${c}" aria-label="${n}" onclick="setUI('acc','${c}')"></button>`).join("")}</div>
<p class="mu">Anteprime video nella copertina della Home. Quando sono attive, la pagina carica i video da YouTube (sul telefono non partono se hai attivato il risparmio dati).</p><div class="row">${ch(UI.vid === false, "setUI('vid',false)", "Disattivate")}${ch(UI.vid !== false, "setUI('vid',true)", "Attive")}</div>
<p class="mu">Dimensione del testo</p><div class="row">${[[1, "Normale"], [1.12, "Grande"], [1.25, "Molto grande"]].map(([v, l]) => ch(UI.fs === v, `setUI('fs',${v})`, l)).join("")}</div>`;
}

/* ---------- Scorciatoie da tastiera (PC) ---------- */
addEventListener("keydown", e => {
  const tag = (e.target || {}).tagName || "";
  if (e.key === "Escape") { if ($("#amenu .sheet")) amClose(); else if ($("#sheet .sheet")) closeSheet(); else if ($("#fsheet .sheet")) closeFilters(); else if ($("#srch").classList.contains("on")) closeSearch(); return; }
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag)) { e.preventDefault(); $("#q").focus(); }
});
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"); c.className = "cf"; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const x = c.getContext("2d"), cols = [UI.acc, "#FFD166", "#06D6A0", "#74c0fc", "#fff"], P0 = Array.from({ length: 90 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .4, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6 }));
  let f = 0; (function step() { x.clearRect(0, 0, c.width, c.height); P0.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .15; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); if (++f < 150) requestAnimationFrame(step); else c.remove(); })();
}

function navSubs() {
  if (!S.subs.length || !PROV) return "";
  const lg = S.subs.map(id => (PROV || []).find(x => x.provider_id === id)).filter(Boolean);
  const pr = P().prices || {}, tot = S.subs.reduce((s, id) => s + (+pr[id] || 0), 0);
  return `<div class="nsub"><div class="nsh"><span>I miei abbonamenti</span><a href="#" onclick="setTab='serv';go('set');return false">Modifica</a></div><div class="nsl">${lg.map(p => `<img src="${IMG}w45${p.logo_path}" alt="${esc(p.provider_name)}" title="${esc(p.provider_name)}" width="28" height="28">`).join("")}</div>${tot ? `<div class="nst">${eur(tot)} al mese</div>` : ""}</div>`;
}
var renderNav; /* definita più avanti */
function goRaw(v) { view = v; if (v === "swipe") { D.cards = []; D.pages = {}; D.hist = []; } closeAllOv(); if ($("#srch").classList.contains("on")) closeSearchRaw(); render(); window.scrollTo(0, 0); }
function go(v) { goRaw(v); navPush(); }
function backNav() { if (history.length > 1) history.back(); else go("home"); }
function hdr() { $("header").classList.remove("clear"); }
addEventListener("scroll", hdr, { passive: true });
const skel = v => { const row = `<div class="sk skt"></div><div class="skr">${"<i class=\"sk\"></i>".repeat(6)}</div>`; return v === "home" ? `<div class="sec bh"><div class="sk skt"></div><div class="sk skb"></div>${row}</div>` : `<div class="sec pt">${row}${row}${row}</div>`; };
async function render() {
  const my = ++tok, m = $("#main");
  clearInterval(HERO.t);
  if (!(sb && !user)) { if (needOnb() && view !== "onb") view = "onb"; else if (!needOnb() && !S.subs.length && !P().pirate && view !== "set") { view = "set"; setTab = "serv"; } }
  renderNav(); whoUpdate(); $("#fc").textContent = fCount() || ""; document.body.dataset.view = view; m.className = view === "home" ? "home" : ""; hdr();
  if (sb && RECOV) { m.innerHTML = recoveryHtml(); glowFor(null); document.body.dataset.view = "login"; return; }
  if (sb && !user) { m.innerHTML = loginHtml(); glowFor(null); document.body.dataset.view = "login"; return; }
  if (m.dataset.v !== view) { m.innerHTML = skel(view); m.dataset.v = view; }
  const fn = { home: vHome, movie: vMT, tv: vMT, tonight: vTonight, plan: vPlan, diary: typeof vDiary === "function" ? vDiary : vTrack, time: vTime, soon: vSoon, person: vPerson, together: vTogether, other: vOther, swipe: vSwipe, onb: vOnb, list: vTrack, prof: vProf2, set: vSet2, friends: () => vFriends(), stats: () => vStats() }[view];
  let h; try { await genres().catch(() => {}); await loadProv().catch(() => {}); h = await fn(); } catch (e) { h = `<div class="note"><b>Qualcosa non ha funzionato.</b><br>${esc(e.message)}<br><span class="mu">Controlla config.js e la connessione, poi ricarica la pagina.</span></div>`; }
  if (my !== tok) return;
  m.innerHTML = h; fillProv(); if (PROV && !$("#nav .nsub") && S.subs.length) renderNav();
  io.disconnect(); const mo = $("#more"); if (mo) io.observe(mo);
  if (view === "swipe" || (view === "onb" && ONB.step === 3)) startDeck(); else glowFor(null);
  if (view === "home") startHero();
  fillRails();
}
(async () => {
  if (!window.XREADY) await new Promise(r => { window.__xr = r; });
  if (!window.MREADY) await new Promise(r => { window.__mr = r; });
  if (sb) {
    const { data } = await sb.auth.getSession(); user = data.session ? data.session.user : null;
    sb.auth.onAuthStateChange((ev, s) => {
      if (ev === "PASSWORD_RECOVERY") { RECOV = true; setTimeout(async () => { user = s ? s.user : user; try { await loadAll(); } catch (e) {} render(); }, 0); return; }
      if (ev !== "SIGNED_IN" && ev !== "SIGNED_OUT") return;
      setTimeout(async () => {
        const nu = s ? s.user : null; if (nu && user && nu.id === user.id) return;
        user = nu; if (user) await loadAll(); else S = { subs: [], titles: {}, profile: { name: "", avatar: 0 } };
        render(); if (user && typeof xUserGate === "function") xUserGate();
      }, 0);
    });
  }
  if (!sb || user) { try { await loadAll(); } catch (e) {} }
  render();
  if (typeof xBoot === "function") xBoot();

})();

/* Anteprima video della copertina: la locandina passa in piccolo quando parte, e si chiude a fine video */
window.addEventListener("message", ev => {
  if (!/youtube(-nocookie)?\.com$/.test((ev.origin || "").replace(/^https?:\/\//, ""))) return;
  let d; try { d = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data; } catch (e) { return; }
  const st = d && (d.event === "onStateChange" ? d.info : d.event === "infoDelivery" && d.info ? d.info.playerState : undefined);
  const h = $("#hero"), f = $("#hv"); if (!h || !f || ev.source !== f.contentWindow) return;
  if (st === undefined) return; HERO.msg = 1;
  if (st === 1) { clearTimeout(HERO.pt); h.classList.add("playing"); f.style.opacity = 1; }
  else if (st === 2) { f.style.opacity = 0; h.classList.remove("playing", "vplay", "vload"); setTimeout(() => f.remove(), 600); }
  else if (st === 0) { f.style.opacity = 0; h.classList.remove("playing", "vplay", "vload"); setTimeout(() => f.remove(), 600); }
  else if (st === 2 || st === 3 || st === -1) { f.style.opacity = 0; h.classList.remove("playing"); }
});
