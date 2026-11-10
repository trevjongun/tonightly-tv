/* Tonightly TV – versione per televisore, da usare solo con frecce, OK e Indietro del telecomando.
   Usa gli stessi dati dell'app (Supabase e TMDB): lista, voti e abbonamenti sono quelli del telefono. */
"use strict";
const C = window.CONFIG || {}, IMG = "https://image.tmdb.org/t/p/", R = C.REGION || "IT", APP = C.APP_NAME || "Tonightly";
const sb = C.SUPABASE_URL && window.supabase ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
const $ = s => document.querySelector(s), esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KEYRE = /^(movie|tv):\d{1,9}$/, POSTRE = /^\/[A-Za-z0-9_.-]{1,60}$/;
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ls = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const IC = { moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.2 2.6 3.6 5.5"/>', heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>', ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>', dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>', redo: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/>', play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>', plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12l5 5 9-10"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', back: '<path d="M15 5l-7 7 7 7"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>' };
const ic = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;
/* avatar: gli stessi dell'app sul telefono */
const AV = [["🦊", "#ff9a3c", "#e8590c"], ["🐼", "#868e96", "#212529"], ["🐙", "#b197fc", "#7048e8"], ["🦉", "#a9856a", "#5c4033"], ["🐯", "#ffd43b", "#f08c00"], ["🐧", "#74c0fc", "#1c7ed6"], ["🦄", "#faa2c1", "#be4bdb"], ["🐸", "#8ce99a", "#2f9e44"], ["🐱", "#ffa8a8", "#e03131"], ["🐻", "#c9a27e", "#7f5539"], ['<svg viewBox="0 0 64 64" width="64%" height="64%" aria-hidden="true"><g fill="#fff" stroke="#dfe6f3" stroke-width="1"><path d="M31 30C27 17 16 8 8 10c-6 2-4 14 4 19 5 3 12 4 19 1z"/><path d="M33 30c4-13 15-22 23-20 6 2 4 14-4 19-5 3-12 4-19 1z"/><path d="M31 33c-8-1-17 3-18 11-1 6 6 9 11 5 4-3 6-9 7-16z"/><path d="M33 33c8-1 17 3 18 11 1 6-6 9-11 5-4-3-6-9-7-16z"/></g><g fill="#c9d3e6"><circle cx="15" cy="17" r="2.4"/><circle cx="49" cy="17" r="2.4"/></g><rect x="30.6" y="19" width="2.8" height="28" rx="1.4" fill="#4a4f63"/><path d="M31 20c-2-5-5-8-8-9M33 20c2-5 5-8 8-9" stroke="#4a4f63" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>', "#8fa6c9", "#2b3a5c"], ['<svg viewBox="0 0 64 64" width="94%" height="94%" aria-hidden="true"><defs><linearGradient id="szH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#43464f"/><stop offset="1" stop-color="#15161b"/></linearGradient><linearGradient id="szB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4e58"/><stop offset="1" stop-color="#17181d"/></linearGradient><linearGradient id="szE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f3f7"/><stop offset="1" stop-color="#9ba2ae"/></linearGradient><radialGradient id="szI" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3b2a20"/><stop offset="1" stop-color="#050506"/></radialGradient></defs><path d="M17 18C13 11 17 6 26 8l-1 13c-4 0-7-1-8-3z" fill="#0e0f13"/><path d="M47 18c4-7 0-12-9-10l1 13c4 0 7-1 8-3z" fill="#0e0f13"/><path d="M19.5 15Q32 8 44.5 15Q49.5 23 48 34H16Q14.5 23 19.5 15z" fill="url(#szH)"/><ellipse cx="25" cy="27.2" rx="4.4" ry="4.6" fill="#2d3038"/><ellipse cx="39" cy="27.2" rx="4.4" ry="4.6" fill="#2d3038"/><ellipse cx="25" cy="27.6" rx="3.4" ry="3.7" fill="url(#szI)"/><ellipse cx="39" cy="27.6" rx="3.4" ry="3.7" fill="url(#szI)"/><circle cx="26.3" cy="26.2" r="1.25" fill="#fff"/><circle cx="40.3" cy="26.2" r="1.25" fill="#fff"/><path d="M17.5 24.5Q18.5 16.5 25 16.5Q30.5 16.5 31.5 22Q28.5 20.2 25 21Q20.5 21.5 17.5 24.5z" fill="url(#szE)"/><path d="M46.5 24.5Q45.5 16.5 39 16.5Q33.5 16.5 32.5 22Q35.5 20.2 39 21Q43.5 21.5 46.5 24.5z" fill="url(#szE)"/><path d="M14.5 32Q32 25.5 49.5 32Q52 45 47 51Q46 55 42.5 54Q41 58 37 56.5Q35 59.5 32 58Q29 59.5 27 56.5Q23 58 21.5 54Q18 55 17 51Q12 45 14.5 32z" fill="url(#szB)"/><path d="M32 34Q23.5 32.5 18 39Q25 37 32 40.5zM32 34Q40.5 32.5 46 39Q39 37 32 40.5z" fill="#6f7581"/><path d="M23 46q-1 3-2.5 4.5M28 48q0 3.5-1.2 5.5M36 48q0 3.5 1.2 5.5M41 46q1 3 2.5 4.5" stroke="#5f6470" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M30.3 42.5Q32 47.5 33.7 42.5z" fill="#ff8fa3"/><path d="M27.2 32.6Q32 30.3 36.8 32.6Q36.3 36.8 32 37.8Q27.7 36.8 27.2 32.6z" fill="#050506"/><ellipse cx="30.4" cy="32.7" rx="1.7" ry=".85" fill="#80858f"/></svg>', "#ffe8cc", "#ff922b"]];
let toastT = 0; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600); }

/* ---------- TMDB ---------- */
const memo = new Map();
function tmdb(path, params) {
  const u = new URL("https://api.themoviedb.org/3" + path); u.searchParams.set("api_key", C.TMDB_KEY); u.searchParams.set("language", "it-IT");
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== "") u.searchParams.set(k, v); });
  const k = u.toString(); if (!memo.has(k)) memo.set(k, fetch(k).then(r => { if (!r.ok) throw new Error("TMDB " + r.status); return r.json(); }).catch(e => { memo.delete(k); throw e; }));
  return memo.get(k);
}
const norm = (x, m) => ({ key: m + ":" + x.id, media: m, id: x.id, title: x.title || x.name || "", year: (x.release_date || x.first_air_date || "").slice(0, 4), poster: x.poster_path || null, backdrop: x.backdrop_path || null, overview: x.overview || "", genre_ids: x.genre_ids || [], vote: x.vote_average || 0 });
const ITEMS = {}; const keep = it => { if (it && it.key) ITEMS[it.key] = Object.assign(ITEMS[it.key] || {}, it); return ITEMS[it.key]; };
const full = it => tmdb("/" + it.media + "/" + it.id, { append_to_response: "videos,watch/providers", include_video_language: "it,en" });

/* ---------- servizi ---------- */
let PROV = [], ALIAS = {};
const canon = n => (n || "").toLowerCase().replace(/amazon channel|apple tv channel|roku premium channel|with ads|\bbasic\b|\bstandard\b|\bplus\b|\+|\bamazon\b|\bhbo\b|[^a-z0-9]/g, "");
const cleanName = n => String(n || "").replace(/\s+(Amazon|Apple TV|Roku Premium) Channel/i, "").replace(/\s+(Basic |Standard )?with Ads/i, "").trim().replace(/^Amazon (Prime )?Video$/i, "Prime Video");
async function loadProv() {
  if (PROV.length) return PROV;
  const r = await tmdb("/watch/providers/movie", { watch_region: R }), seen = {}, ord = C.PROV_ORDER || [];
  const rk = p => { const i = ord.indexOf(p.provider_id); return i < 0 ? 1000 + (((p.display_priorities || {})[R]) != null ? p.display_priorities[R] : 999) : i; };
  (r.results || []).slice().sort((a, b) => rk(a) - rk(b)).forEach(p => { const c = canon(p.provider_name); if (!c) return; if (seen[c]) { (ALIAS[seen[c].provider_id] = ALIAS[seen[c].provider_id] || []).push(p.provider_id); return; } const o = Object.assign({}, p, { provider_name: cleanName(p.provider_name) }); seen[c] = o; PROV.push(o); });
  return PROV;
}
const mine = () => { const s = new Set(); (S.subs || []).forEach(id => { s.add(id); (ALIAS[id] || []).forEach(a => s.add(a)); }); return s; };
const isPrimeStore = p => /amazon video|prime video/i.test((p && p.provider_name) || "");
async function provsOf(it) {
  try { const r = await tmdb("/" + it.media + "/" + it.id + "/watch/providers"), a = (r.results || {})[R] || {}, m = mine(), seen = new Set(), fl = [];
    (a.flatrate || []).forEach(p => { const c = canon(p.provider_name); if (seen.has(c)) return; seen.add(c); fl.push(Object.assign({}, p, { provider_name: cleanName(p.provider_name), mine: m.has(p.provider_id) })); });
    const rb = (a.rent || []).concat(a.buy || []).find(isPrimeStore);
    return { fl, mine: fl.filter(p => p.mine), rb: !!rb };
  } catch (e) { return { fl: [], mine: [], rb: false }; }
}

/* ---------- i tuoi dati ---------- */
let user = null, S = { subs: [], titles: {}, name: "" }, LOCAL = false;
const okPhoto = s => typeof s === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(s) && s.length < 90000;
const avHtml = (p, sz) => { if (p && okPhoto(p.photo)) return `<span class="av" style="width:${sz}rem;height:${sz}rem"><img src="${p.photo}" alt=""></span>`; const a = AV[(p && p.avatar) || 0] || AV[0]; return `<span class="av" style="width:${sz}rem;height:${sz}rem;font-size:${(sz * .55).toFixed(2)}rem;background:linear-gradient(135deg,${a[1]},${a[2]})">${a[0]}</span>`; };
const SITE = new URL("./", location.href).href;
async function loadData() {
  if (sb && user) {
    const [a, b] = await Promise.all([sb.from("settings").select("subs,name,avatar,prefs,username").eq("user_id", user.id).maybeSingle(), sb.from("titles").select("*").eq("user_id", user.id)]);
    const d = a.data || {}, ph = (d.prefs || {}).photo;
    S = { subs: (Array.isArray(d.subs) ? d.subs : []).filter(Number.isInteger), titles: {}, name: d.name || (user.email || "").split("@")[0], avatar: Number.isInteger(d.avatar) ? d.avatar : 0, photo: okPhoto(ph) ? ph : "", pirate: !!(d.prefs || {}).pirate };
    (b.data || []).forEach(r => { if (KEYRE.test(r.tmdb_key || "")) { delete r.user_id; S.titles[r.tmdb_key] = r; } });
  } else { const l = ls("tv_local", {}); S = { subs: Array.isArray(l.subs) ? l.subs : [], titles: l.titles || {}, name: "" }; }
}
const blank = it => ({ tmdb_key: it.key, media: it.media, tmdb_id: it.id, title: String(it.title || "").slice(0, 200), year: /^\d{4}$/.test(it.year || "") ? it.year : "", poster: POSTRE.test(it.poster || "") ? it.poster : null, genre_ids: (it.genre_ids || []).slice(0, 12), runtime: 0, favorite: false, watched: false, stars: 0, watched_on: null, watchlist: false, hype: false, skipped: false, eps: {} });
async function put(it, p) {
  const k = it.key, t = Object.assign(blank(it), S.titles[k] || {}, p); S.titles[k] = t;
  if (sb && user) { const r = await sb.from("titles").upsert(Object.assign({}, t, { user_id: user.id })); if (r.error) { const t2 = Object.assign({}, t, { user_id: user.id, stars: Math.round(t.stars || 0) }); delete t2.why; delete t2.diary; const r2 = await sb.from("titles").upsert(t2); if (r2.error) toast("Salvataggio non riuscito"); } }
  else lsSet("tv_local", { subs: S.subs, titles: S.titles });
}
const epCount = t => Object.keys(t.eps || {}).filter(x => x[0] !== "_").length;
const rowIt = t => keep({ key: t.tmdb_key, media: t.media, id: t.tmdb_id, title: t.title, year: t.year, poster: t.poster, genre_ids: t.genre_ids || [] });

/* ---------- cosa mostrare ---------- */
const FEST = [
  { name: "Halloween", emo: "🎃", from: "10-01", to: "11-01", c1: "#FF7A00", c2: "#8B2CF5", q: { with_keywords: "3335" } },
  { name: "Natale", emo: "🎄", from: "12-08", to: "01-06", c1: "#E63946", c2: "#2BB673", q: { with_keywords: "207317" } },
  { name: "San Valentino", emo: "💘", from: "02-07", to: "02-14", c1: "#FF4D8D", c2: "#B5179E", q: { with_genres: "10749", sort_by: "vote_average.desc", "vote_count.gte": 400 } }
];
function festNow() { const d = new Date(), md = String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); return FEST.find(f => f.from <= f.to ? md >= f.from && md <= f.to : md >= f.from || md <= f.to) || null; }
const baseQ = () => { if (S.pirate) return {}; const m = [...mine()], q = { watch_region: R, with_watch_monetization_types: "flatrate" }; if (m.length) q.with_watch_providers = m.join("|"); return q; };
const seenOrSkip = k => { const t = S.titles[k]; return t && (t.watched || t.skipped || t.watchlist || (t.media === "tv" && epCount(t) > 0)); };
async function disc(m, q) { try { const r = await tmdb("/discover/" + m, Object.assign(baseQ(), q || {})); return (r.results || []).map(x => keep(norm(x, m))).filter(i => i.poster && !seenOrSkip(i.key)); } catch (e) { return []; } }
/* "Per te": chi ha amato i tuoi titoli preferiti ha amato anche…, solo sui tuoi abbonamenti */
async function forYou() {
  const T = Object.values(S.titles), seeds = T.filter(t => (t.watched && t.stars >= 4) || t.favorite).sort((a, b) => (b.stars || 0) - (a.stars || 0) || String(b.watched_on || "").localeCompare(String(a.watched_on || ""))).slice(0, 10);
  const sc = new Map(), why = new Map();
  await Promise.all(seeds.map(t => tmdb("/" + t.media + "/" + t.tmdb_id + "/recommendations").then(r => (r.results || []).slice(0, 20).forEach((x, j) => {
    const it = keep(norm(x, x.media_type || t.media)); if (!it.poster || seenOrSkip(it.key)) return;
    const v = ((t.stars || 4) - 2.5) * (1 - j / 24); sc.set(it.key, (sc.get(it.key) || 0) + v); if (!why.has(it.key) || why.get(it.key)[0] < v) why.set(it.key, [v, t.title]);
  })).catch(() => {})));
  let cand = [...sc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k]) => ITEMS[k]);
  if (S.subs.length && !S.pirate) { const av = await Promise.all(cand.map(it => provsOf(it))); cand = cand.filter((it, i) => av[i].mine.length); }
  cand.forEach(it => { it.why = "Perché ti è piaciuto " + why.get(it.key)[1]; });
  if (cand.length < 12) { const [a, b] = await Promise.all([disc("movie", { sort_by: "vote_average.desc", "vote_count.gte": 2000 }), disc("tv", { sort_by: "vote_average.desc", "vote_count.gte": 800 })]); [...a, ...b].forEach(it => { if (!cand.some(c => c.key === it.key)) { it.why = it.why || "Tra i più amati sui tuoi servizi"; cand.push(it); } }); }
  return cand.slice(0, 20);
}
async function picksOfTonight() {
  if (!(sb && user)) return [];
  try { const r = await sb.from("evening_picks").select("day,picks").eq("user_id", user.id).maybeSingle(); if (!r.data || r.data.day !== today()) return []; return (r.data.picks || []).filter(p => KEYRE.test(p.k || "")).map(p => { const [m, id] = p.k.split(":"); return Object.assign(keep({ key: p.k, media: m, id: +id, title: p.t, poster: POSTRE.test(p.p || "") ? p.p : null }), { why: p.w || "Scelto per te stasera" }); }); } catch (e) { return []; }
}

/* ---------- navigazione col telecomando ---------- */
let FOC = null;
const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
function scope() { const l = $("#layer"); return l.lastElementChild || $("#app"); }
function focusEl(el, quiet, noKb) {
  if (!el) return; if (FOC && FOC !== el) FOC.classList.remove("on"); FOC = el; el.classList.add("on");
  if (el.tagName === "INPUT") { if (!noKb) el.focus({ preventScroll: true }); else if (document.activeElement && document.activeElement !== el) document.activeElement.blur(); } else if (document.activeElement && document.activeElement.tagName === "INPUT") document.activeElement.blur();
  const rail = el.closest(".rail"); if (rail) { const r = el.getBoundingClientRect(), rr = rail.getBoundingClientRect(), pad = rr.width * .05; if (r.left < rr.left + pad) rail.scrollLeft -= (rr.left + pad - r.left); else if (r.right > rr.right - pad) rail.scrollLeft += (r.right - (rr.right - pad)); }
  const sc = el.closest(".scroll") || (el.closest(".hero") && $(".scroll")); if (sc) { const row = el.closest(".rw"); sc.style.transform = row ? `translateY(${-row.offsetTop}px)` : "translateY(0)"; }
  if (!quiet && el.onfocusin) el.onfocusin();
}
function move(dir) {
  const all = [...scope().querySelectorAll(".fz")].filter(vis); if (!all.length) return;
  if (!FOC || !scope().contains(FOC)) return focusEl(all[0]);
  const a = FOC.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, rowA = FOC.closest(".rail");
  let best = null, bs = 1e12;
  all.forEach(el => {
    if (el === FOC) return; const b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, dx = bx - ax, dy = by - ay;
    const ok = dir === "left" ? dx < -5 && Math.abs(dy) < a.height * .6 : dir === "right" ? dx > 5 && Math.abs(dy) < a.height * .6 : dir === "up" ? dy < -5 : dy > 5; if (!ok) return;
    // in su/giù: prima la riga più vicina, poi la colonna più vicina
    let s = dir === "left" || dir === "right" ? Math.abs(dx) + Math.abs(dy) * 3 : Math.abs(dy) * 1000 + Math.abs(dx);
    if ((dir === "up" || dir === "down") && rowA && el.closest(".rail") === rowA) return;
    if (s < bs) { bs = s; best = el; }
  });
  if (best && (dir === "up" || dir === "down")) { const bb = best.getBoundingClientRect(), rowY = bb.top; const same = all.filter(el => Math.abs(el.getBoundingClientRect().top - rowY) < 4 && el.closest(".rail") === best.closest(".rail")); const rail = best.closest(".rail"); if (rail && rail.dataset.last != null && same[+rail.dataset.last]) best = same[+rail.dataset.last]; else best = same.sort((x, y) => Math.abs(x.getBoundingClientRect().left - ax) - Math.abs(y.getBoundingClientRect().left - ax))[0] || best; }
  if (best) { if (rowA) rowA.dataset.last = [...rowA.querySelectorAll(".fz")].indexOf(FOC); focusEl(best); }
}
function ok() { if (FOC && document.body.contains(FOC)) { if (FOC.tagName === "INPUT") { if (document.activeElement !== FOC) FOC.focus({ preventScroll: true }); return; } FOC.click(); } }
/* elementi che si regolano con ← → (stelle, stagione, episodio) */
const adjOf = () => FOC && document.body.contains(FOC) && FOC.dataset.adj && window[FOC.dataset.adj];
/* Indietro: chiude ciò che è aperto; dalla Home torna in alto; altrimenti esce (restituisce false) */
window.tvBack = function () {
  const l = $("#layer"); if (l.lastElementChild) { l.lastElementChild.remove(); const r = RET.pop(); if (r && document.body.contains(r)) focusEl(r, true); else move("down"); return true; }
  if (VIEW === "stasera" && ST.step > 0) { showStasera(ST.step - 1); return true; }
  if (VIEW === "login") { if (PROFS.length && sb) { showWho(); return true; } if (user || LOCAL) { showHome(); return true; } return false; }
  if (VIEW === "who") { if (user) { showHome(); return true; } return false; }
  if (VIEW === "svc" && !S.subs.length) return false;
  if (VIEW !== "home") { showHome(); return true; }
  if (FOC && FOC.closest(".rows")) { const b = $(".hero .btn"); if (b) { focusEl(b); return true; } }
  return false;
};
const RET = [];
function openLayer(html, first) { RET.push(FOC); const d = document.createElement("div"); d.innerHTML = html; $("#layer").appendChild(d.firstElementChild || d); const f = first ? $("#layer").lastElementChild.querySelector(first) : $("#layer").lastElementChild.querySelector(".fz"); if (f) focusEl(f); }
const closeLayer = () => window.tvBack();
document.addEventListener("keydown", e => {
  const k = e.key, c = e.keyCode, inInput = document.activeElement && document.activeElement.tagName === "INPUT";
  if ((k === "ArrowLeft" || c === 37 || k === "ArrowRight" || c === 39) && !inInput && adjOf()) { e.preventDefault(); adjOf()(k === "ArrowLeft" || c === 37 ? -1 : 1); return; }
  if (k === "ArrowLeft" || c === 37) { if (inInput && document.activeElement.value && document.activeElement.selectionStart > 0) return; e.preventDefault(); move("left"); }
  else if (k === "ArrowRight" || c === 39) { if (inInput && document.activeElement.selectionStart < document.activeElement.value.length) return; e.preventDefault(); move("right"); }
  else if (k === "ArrowUp" || c === 38) { e.preventDefault(); move("up"); }
  else if (k === "ArrowDown" || c === 40) { e.preventDefault(); move("down"); }
  else if (k === "Enter" || c === 13 || c === 23) { if (inInput) { const f = FOC && FOC.dataset.enter; if (f && window[f]) { e.preventDefault(); window[f](); } return; } e.preventDefault(); ok(); }
  else if (k === "Escape" || k === "GoBack" || k === "BrowserBack" || c === 461 || c === 10009 || (k === "Backspace" && !inInput)) { e.preventDefault(); window.tvBack(); }
});
document.addEventListener("click", e => { const f = e.target.closest && e.target.closest(".fz"); if (f) focusEl(f, true); }, true);

/* ---------- Home: copertina + righe ---------- */
let VIEW = "home", HERO = null, heroT = 0;
const card = (it, x) => `<button class="card fz ${it.poster ? "" : "np"}" data-k="${esc(it.key)}" style="${it.poster ? `background-image:url(${IMG}w342${it.poster})` : ""}" aria-label="${esc(it.title)}">${it.poster ? "" : `<span class="nt">${esc(it.title)}</span>`}${x || ""}</button>`;
const rowHtml = (t, sub, items, cls, style, x) => items.length ? `<section class="rw ${cls || ""}" style="${style || ""}"><h2>${t}${sub ? ` <small>${esc(sub)}</small>` : ""}</h2><div class="rail">${items.map(it => card(it, x ? x(it) : "")).join("")}</div></section>` : "";
function setBg(it) { const b = $("#bgi"); if (it && it.backdrop) { const u = `url(${IMG}w1280${it.backdrop})`; if (b.style.backgroundImage !== u) { b.classList.remove("on"); setTimeout(() => { b.style.backgroundImage = u; b.classList.add("on"); }, 120); } } else b.classList.remove("on"); }
async function heroFill(it) {
  if (!it) return; HERO = it; const h = $(".hero"); if (!h) return;
  if (!it.backdrop || !it.overview) { try { const d = await full(it); Object.assign(it, { backdrop: it.backdrop || d.backdrop_path, overview: it.overview || d.overview || "", year: it.year || (d.release_date || d.first_air_date || "").slice(0, 4), vote: it.vote || d.vote_average || 0, gen: (d.genres || []).slice(0, 2).map(g => g.name).join(", "), rt: it.media === "movie" ? d.runtime : null }); } catch (e) {} }
  if (HERO !== it) return; const pv = await provsOf(it); if (HERO !== it) return; it.pv = pv;
  const t = S.titles[it.key] || {}, svc = pv.mine[0] || (pv.rb ? { provider_name: "Prime Video", rb: 1 } : null);
  h.querySelector(".why").textContent = it.why || "Scelto per te"; h.querySelector("h1").textContent = it.title;
  h.querySelector(".meta").textContent = [it.year, it.media === "tv" ? "Serie TV" : (it.rt ? Math.floor(it.rt / 60) + "h " + (it.rt % 60) + "m" : "Film"), it.gen, it.vote ? "★ " + it.vote.toFixed(1) : "", svc ? (svc.rb ? "€ su Prime Video" : "su " + svc.provider_name) : ""].filter(Boolean).join(" · ");
  h.querySelector(".ov").textContent = it.overview || "";
  h.querySelector(".acts").innerHTML = `<button class="btn fz" ${svc ? brandStyle(svc.provider_name) : ""} onclick="openApp(HERO)">${ic("play")} ${svc ? "Apri " + esc(svc.provider_name) : "Dove vederlo"}</button><button class="btn fz" onclick="togList(HERO)">${t.watchlist ? ic("check") + " In lista" : ic("plus") + " Lista"}</button><button class="btn fz" onclick="openDet(HERO)">${ic("info")} Dettagli</button>`;
  setBg(it);
}
async function showHome() {
  VIEW = "home"; const app = $("#app"); app.innerHTML = `<div class="load">Preparo la tua serata…</div>`;
  await loadProv().catch(() => {});
  const T = Object.values(S.titles), f = festNow();
  const cont = T.filter(t => t.media === "tv" && !t.watched && epCount(t) > 0).sort((a, b) => ((b.eps || {})._t || 0) - ((a.eps || {})._t || 0)).slice(0, 12).map(t => Object.assign(rowIt(t), { why: "Continua a guardare", prog: (t.eps || {})._n ? epCount(t) / t.eps._n : 0 }));
  const list = T.filter(t => t.watchlist && !t.watched).slice(0, 30).map(t => Object.assign(rowIt(t), { why: "Nella tua lista" }));
  const [picks, rec, pm, pt, fe] = await Promise.all([picksOfTonight(), forYou(), disc("movie", {}), disc("tv", {}), f ? Promise.all([disc("movie", f.q), disc("tv", f.q)]).then(([a, b]) => [...a, ...b]) : []]);
  const pop = []; for (let i = 0; i < 12; i++) { if (pm[i]) pop.push(pm[i]); if (pt[i]) pop.push(pt[i]); } pop.forEach(it => { it.why = it.why || "Popolare sui tuoi servizi"; });
  const forYouL = [...picks, ...rec.filter(r => !picks.some(p => p.key === r.key))];
  if (fe) fe.forEach(it => { it.why = f.emo + " Speciale " + f.name; });
  const first = forYouL[0] || cont[0] || pop[0];
  if (VIEW !== "home") return;
  app.innerHTML = `<div class="scr"><div class="top"><div class="logo"><span class="lm"></span>${esc(APP)}</div><button class="pill fz hot" onclick="showStasera(0)">${ic("moon")} Stasera</button><button class="pill fz" onclick="showTogether()">${ic("users")} Insieme</button><button class="pill fz" onclick="showSearch()">${ic("search")} Cerca</button><button class="pill fz me" onclick="showProfile()">${user ? avHtml(S, 2.2) : ic("user")} ${esc(S.name || "Profilo")}</button></div>
<div class="hero"><span class="why"></span><h1></h1><div class="meta"></div><p class="ov"></p><div class="acts"></div></div>
<div class="rwrap"><div class="scroll"><div class="rows">${rowHtml("Continua a guardare", "", cont, "", "", it => it.prog ? `<span class="bar"><i style="width:${Math.round(it.prog * 100)}%"></i></span>` : "")}${rowHtml("Per te", picks.length ? "i primi tre sono quelli scelti per stasera" : "in base ai tuoi voti", forYouL)}${rowHtml("La mia lista", "", list)}${f && fe.length >= 4 ? rowHtml(f.emo + " " + f.name, "speciale di stagione", fe.slice(0, 20), "fest", `--f1:${f.c1};--f2:${f.c2}`) : ""}${rowHtml("I più visti sui tuoi servizi", "", pop)}</div></div></div></div>`;
  app.querySelectorAll(".card").forEach(c => { c.onfocusin = () => { clearTimeout(heroT); heroT = setTimeout(() => heroFill(ITEMS[c.dataset.k]), 220); }; c.onclick = () => openDet(ITEMS[c.dataset.k]); });
  if (!first) { app.querySelector(".hero").innerHTML = `<h1>Benvenuto</h1><p class="ov">Scegli i tuoi abbonamenti dal profilo o dall’app sul telefono: qui compariranno i consigli per te.</p><div class="acts"><button class="btn fz" onclick="showProfile()">${ic("user")} Profilo</button></div>`; focusEl(app.querySelector(".hero .btn")); return; }
  await heroFill(first); if (VIEW !== "home") return; focusEl(app.querySelector(".hero .btn"));
  setTimeout(() => window.tvResume(), 300);
}

/* ---------- scheda ---------- */
const seasonsOf = d => (d.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0).sort((a, b) => a.season_number - b.season_number);
const tvMeta = d => ({ n: d.number_of_episodes || 1, m: (d.episode_run_time && d.episode_run_time[0]) || (d.last_episode_to_air && d.last_episode_to_air.runtime) || 45 });
const sxe = (s, e) => "S" + s + "E" + e;
function nextOf(d, eps) { for (const s of seasonsOf(d)) for (let e = 1; e <= s.episode_count; e++) if (!(eps || {})[s.season_number + "-" + e]) return { s: s.season_number, e }; return null; }
async function epName(it, nx) { try { const r = await tmdb("/tv/" + it.id + "/season/" + nx.s), ep = (r.episodes || []).find(x => x.episode_number === nx.e) || {}; nx.name = ep.name || ""; nx.air = ep.air_date || ""; } catch (e) {} return nx; }
async function openDet(it, focusSel) {
  if (!it) return; let d = {}; try { d = await full(it); } catch (e) {}
  Object.assign(it, { backdrop: it.backdrop || d.backdrop_path, overview: it.overview || d.overview || "" });
  const pv = await provsOf(it), t = S.titles[it.key] || {}, vid = ((d.videos || {}).results || []).find(v => v.site === "YouTube" && v.type === "Trailer") || ((d.videos || {}).results || []).find(v => v.site === "YouTube");
  it.pv = pv;
  const svc = pv.mine[0], gen = (d.genres || []).slice(0, 3).map(g => g.name).join(", "), isTv = it.media === "tv";
  const meta = [it.year || (d.release_date || d.first_air_date || "").slice(0, 4), isTv ? (d.number_of_seasons ? d.number_of_seasons + (d.number_of_seasons > 1 ? " stagioni" : " stagione") : "Serie TV") : (d.runtime ? Math.floor(d.runtime / 60) + "h " + (d.runtime % 60) + "m" : "Film"), gen, d.vote_average ? "★ " + d.vote_average.toFixed(1) : ""].filter(Boolean).join(" · ");
  // serie: prossimo episodio da vedere
  let nx = null, epLine = "";
  if (isTv && seasonsOf(d).length) {
    nx = nextOf(d, t.eps); it.nx = nx; it.det = d;
    if (nx) { await epName(it, nx); const fut = nx.air && nx.air > today(); epLine = `<div class="nxe">${epCount(t) ? "Prossimo episodio" : "Si comincia da"}: <b>${sxe(nx.s, nx.e)}</b>${nx.name ? " · " + esc(nx.name) : ""}${fut ? ` <small>esce il ${esc(nx.air.split("-").reverse().join("/"))}</small>` : ""}</div>`; }
    else epLine = `<div class="nxe">${ic("check")} Hai visto tutti gli episodi usciti</div>`;
  }
  window.__det = it; window.__vid = vid ? vid.key : "";
  const stars = t.watched && t.stars ? " " + starTxt(t.stars) : "";
  const epBtns = isTv && nx ? `<button class="btn fz" data-f="epnext" onclick="epNext(__det)">${ic("check")} Visto ${sxe(nx.s, nx.e)}</button><button class="btn fz" data-f="eppick" onclick="epPick(__det)">Sono arrivato a…</button>` : "";
  const rateBtn = isTv && nx ? "" : `<button class="btn fz" data-f="rate" onclick="rateOpen(__det)">${ic("check")} ${t.watched ? "Cambia voto" : isTv ? "L’ho finita" : "L’ho visto"}</button>`;
  openLayer(`<div class="det"><div class="bd" style="${it.backdrop ? `background-image:url(${IMG}w1280${it.backdrop})` : ""}"></div><div class="in">${it.why ? `<span class="chipw">${esc(it.why)}</span>` : ""}<h1>${esc(it.title)}</h1><div class="meta">${esc(meta)}${t.watched ? " · ✓ Visto" + stars : ""}</div>${epLine}<p>${esc(it.overview || "Trama non disponibile.")}</p>
<div class="on-s">${pv.fl.length ? "Disponibile su " + pv.fl.map(p => `<b>${esc(p.provider_name)}${p.mine ? " ✓" : ""}</b>`).join("") : "Non incluso negli abbonamenti in Italia"}${pv.rb ? ` <span class="eur">€</span> noleggio o acquisto su Prime Video` : ""}</div>
<div class="acts"><button class="btn fz" data-f="open" ${svc ? brandStyle(svc.provider_name) : pv.rb ? brandStyle("Prime Video") : ""} onclick="openApp(__det)">${ic("play")} ${svc ? "Apri " + esc(svc.provider_name) : pv.rb ? "Apri Prime Video" : "Dove vederlo"}</button>${epBtns}<button class="btn fz" data-f="list" onclick="togList(__det,1)">${t.watchlist ? ic("check") + " In lista" : ic("plus") + " Aggiungi alla lista"}</button>${rateBtn}${vid ? `<button class="btn fz" data-f="trl" onclick="trailer()">${ic("film")} Trailer</button>` : ""}<button class="btn fz" onclick="closeLayer()">${ic("back")} Indietro</button></div></div></div>`, focusSel);
}
/* riapre la scheda aggiornata, sullo stesso tasto */
function detRefresh(it, f) { const l = $("#layer"); if (l.lastElementChild && l.lastElementChild.classList.contains("det")) { l.lastElementChild.remove(); RET.pop(); } return openDet(it, f ? `[data-f="${f}"]` : null); }
/* apre l'app del servizio sulla TV (nell'app Android); nel browser lo spiega */
/* link diretto alla scheda su Netflix: TMDB → Wikidata (proprietà P1874 "Netflix ID"); se non c'è, l'app apre la ricerca */
/* colori dei servizi di streaming, per i pulsanti "Guarda su…" */
const BRANDS = [[/netflix/i, "#E50914", "#fff"], [/prime video|amazon/i, "#00A8E1", "#fff"], [/disney/i, "#113CCF", "#fff"], [/apple tv/i, "#000000", "#fff"], [/paramount/i, "#0064FF", "#fff"], [/^max|hbo/i, "#002BE7", "#fff"], [/crunchyroll/i, "#F47521", "#fff"], [/mubi/i, "#000000", "#fff"], [/raiplay|rai play/i, "#0A5FC1", "#fff"], [/discovery/i, "#2175D9", "#fff"], [/rakuten/i, "#BF0000", "#fff"], [/timvision/i, "#00338D", "#fff"], [/mediaset|infinity/i, "#1A2C6B", "#fff"], [/^now\b|now tv/i, "#111111", "#fff"], [/youtube/i, "#FF0000", "#fff"], [/chili/i, "#E3051B", "#fff"]];
const brand = name => { const b = BRANDS.find(x => x[0].test(String(name || "").trim())); return b ? { bg: b[1], fg: b[2] } : null; };
const brandStyle = name => { const b = brand(name); return b ? `style="background:${b.bg};color:${b.fg}"` : ""; };
async function directLink(it, svcName) {
  if (!/netflix/i.test(svcName || "")) return "";
  const ck = ls("tv_nfid", {}); if (ck[it.key] != null) return ck[it.key] ? "https://www.netflix.com/title/" + ck[it.key] : "";
  let id = "";
  try {
    const x = await tmdb("/" + it.media + "/" + it.id + "/external_ids"), q = x && x.wikidata_id;
    if (/^Q\d+$/.test(q || "")) {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 3500);
      const r = await fetch("https://www.wikidata.org/wiki/Special:EntityData/" + q + ".json", { signal: ctl.signal }); clearTimeout(t);
      const j = await r.json(), e = ((j.entities || {})[q] || {}).claims || {}, c = (e.P1874 || [])[0];
      const v = c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value; if (/^\d{5,12}$/.test(String(v || ""))) id = String(v);
    }
  } catch (e) {}
  ck[it.key] = id; const ks = Object.keys(ck); if (ks.length > 300) delete ck[ks[0]]; lsSet("tv_nfid", ck);
  return id ? "https://www.netflix.com/title/" + id : "";
}
async function openApp(it) {
  const pv = it && it.pv, svc = (pv && (pv.mine[0] || (pv.rb && { provider_name: "Prime Video" }) || pv.fl[0])) || null;
  if (!svc) return toast("Non è disponibile in abbonamento sui servizi in Italia");
  const B = window.TonightlyTV;
  if (B && (B.openTitle || B.openApp)) {
    let ok = false;
    if (B.openTitle) { toast("Apro " + svc.provider_name + "…"); const d = await directLink(it, svc.provider_name); ok = B.openTitle(svc.provider_name, it.title, d || ""); }
    else ok = B.openApp(svc.provider_name, it.title);
    if (!ok) toast(`Non trovo l’app ${svc.provider_name} sulla TV: installala dal Play Store`); else markOut(it); return;
  }
  toast(`Apri ${svc.provider_name} dal telecomando e cerca “${it.title}”`);
}
async function togList(it, inDet) {
  const on = !(S.titles[it.key] || {}).watchlist; await put(it, { watchlist: on, skipped: false }); toast(on ? "Aggiunto alla tua lista" : "Tolto dalla lista");
  if (inDet) { const b = FOC; if (b) b.innerHTML = on ? ic("check") + " In lista" : ic("plus") + " Aggiungi alla lista"; } else heroFill(it);
}

/* ---------- serie: episodi visti ---------- */
async function setEps(it, mut) {
  let d = it.det; if (!d) { try { d = await full(it); } catch (e) { return toast("Non riesco a caricare gli episodi"); } it.det = d; }
  const t = S.titles[it.key] || {}, m = tvMeta(d), eps = Object.assign({}, t.eps || {}, { _n: m.n, _m: m.m, _t: Date.now() });
  mut(eps, d); await put(it, { eps, runtime: m.n * m.m, watchlist: false });
  const nx = nextOf(d, eps), t2 = S.titles[it.key] || {};
  if (!nx && !t2.watched) { closeAll(); rateOpen(it, { done: 1 }); return "done"; }
  if (nx && t2.watched) await put(it, { watched: false });
  return nx;
}
async function epNext(it) {
  const nx = it.nx; if (!nx) return;
  const r = await setEps(it, eps => { eps[nx.s + "-" + nx.e] = true; }); if (r === "done" || r === undefined) return;
  toast("Segnato " + sxe(nx.s, nx.e) + " come visto"); detRefresh(it, "epnext");
}
const upTo = (d, s, e) => eps => { for (const x of seasonsOf(d)) { if (x.season_number > s) break; const last = x.season_number === s ? e : x.episode_count; for (let i = 1; i <= last; i++) eps[x.season_number + "-" + i] = true; } };
let PK = null;
async function epPick(it) {
  let d = it.det; if (!d) { try { d = await full(it); it.det = d; } catch (e) { return; } }
  const ss = seasonsOf(d); if (!ss.length) return;
  const nx = it.nx || { s: ss[ss.length - 1].season_number, e: ss[ss.length - 1].episode_count };
  PK = { it, ss, si: Math.max(0, ss.findIndex(x => x.season_number === nx.s)), e: nx.e };
  openLayer(`<div class="ovl"><div class="box pick"><h2>${esc(it.title)}</h2><p>Fino a quale episodio sei arrivato? Usa ← → per cambiare.</p><button class="adj fz" data-adj="pkS" id="pkS"></button><button class="adj fz" data-adj="pkE" id="pkE"></button><div class="acts col"><button class="btn fz" onclick="pkSave()">${ic("check")} Segna fino a qui</button><button class="btn fz" onclick="pkAll()">Ho finito tutta la serie</button><button class="btn fz" onclick="closeLayer()">Annulla</button></div></div></div>`, "#pkE");
  pkDraw();
}
function pkDraw() { const s = PK.ss[PK.si]; PK.e = Math.min(Math.max(1, PK.e), s.episode_count); $("#pkS").innerHTML = `<i>‹</i> Stagione <b>${s.season_number}</b> <i>›</i>`; $("#pkE").innerHTML = `<i>‹</i> Episodio <b>${PK.e}</b> di ${s.episode_count} <i>›</i>`; }
window.pkS = d => { PK.si = Math.min(PK.ss.length - 1, Math.max(0, PK.si + d)); PK.e = d > 0 ? 1 : PK.ss[PK.si].episode_count; pkDraw(); };
window.pkE = d => { const s = PK.ss[PK.si]; if (PK.e + d < 1 && PK.si > 0) { PK.si--; PK.e = PK.ss[PK.si].episode_count; } else if (PK.e + d > s.episode_count && PK.si < PK.ss.length - 1) { PK.si++; PK.e = 1; } else PK.e += d; pkDraw(); };
async function pkSave() { const s = PK.ss[PK.si].season_number, e = PK.e, it = PK.it; const r = await setEps(it, (eps, d) => upTo(d, s, e)(eps)); if (r === "done" || r === undefined) return; closeLayer(); toast("Segnato fino a " + sxe(s, e)); detRefresh(it, "epnext"); }
async function pkAll() { const it = PK.it, r = await setEps(it, (eps, d) => { seasonsOf(d).forEach(x => { for (let i = 1; i <= x.episode_count; i++) eps[x.season_number + "-" + i] = true; }); }); if (r === "done" || r === undefined) return; closeLayer(); toast("Serie segnata come vista"); detRefresh(it, "open"); }

/* ---------- voto (anche mezze stelle) ---------- */
const LAB = ["", "Non mi è piaciuto", "Così così", "Bello", "Molto bello", "Capolavoro"];
const starTxt = v => "★".repeat(Math.floor(v)) + (v % 1 ? "½" : "");
let RS = 4, RMODE = {};
function rateOpen(it, mode) {
  RMODE = mode || {}; const t = S.titles[it.key] || {}; RS = t.stars || 4; window.__rate = it;
  const h = RMODE.ask ? `Com’era <i>${esc(it.title)}</i>?` : RMODE.done ? `Hai finito <i>${esc(it.title)}</i>! Com’era?` : esc(it.title);
  const extra = RMODE.ask ? `<button class="btn fz" onclick="askLater()">Non l’ho finito</button><button class="btn fz" onclick="closeLayer()">Non l’ho visto</button>` : `<button class="btn fz" onclick="rateSave(0)">Visto, senza voto</button><button class="btn fz" onclick="closeLayer()">Annulla</button>`;
  openLayer(`<div class="ovl"><div class="box rate">${RMODE.ask || RMODE.done ? "" : ""}<h2>${h}</h2><p>← → per scegliere (anche mezze stelle), OK per salvare</p><button class="stars fz" data-adj="rateAdj" onclick="rateSave()" aria-label="Voto"></button><div class="lbl"></div><div class="acts">${extra}</div></div></div>`, ".stars");
  rateDraw();
}
function rateDraw() { const b = $("#layer .stars"); if (!b) return; b.innerHTML = [1, 2, 3, 4, 5].map(n => `<span class="st ${RS >= n ? "y" : RS >= n - .5 ? "h" : ""}">★</span>`).join(""); b.setAttribute("aria-valuenow", RS); $("#layer .lbl").textContent = (RS % 1 ? RS.toString().replace(".", ",") + " · " : "") + LAB[Math.ceil(RS)]; }
window.rateAdj = d => { RS = Math.min(5, Math.max(.5, RS + d * .5)); rateDraw(); };
function closeAll() { const l = $("#layer"); while (l.lastElementChild) { l.lastElementChild.remove(); RET.pop(); } }
async function rateSave(v) {
  const n = v === 0 ? 0 : RS, it = window.__rate, t = S.titles[it.key] || {};
  await put(it, { watched: true, stars: n, watched_on: t.watched_on || today(), watchlist: false });
  closeAll(); toast(n ? "Segnato come visto · " + starTxt(n) : "Segnato come visto"); if (VIEW === "home") showHome();
}
function askLater() { const o = window.__askO; if (o) lsSet("tv_out", Object.assign(o, { at: Date.now() })); closeLayer(); }
/* "Com'era?": quando torni nell'app dopo aver aperto un film o un episodio */
function markOut(it) { const nx = it.media === "tv" ? it.nx : null; lsSet("tv_out", { k: it.key, m: it.media, id: it.id, t: it.title, p: it.poster || "", y: it.year || "", at: Date.now(), u: user ? user.id : "", s: nx ? nx.s : 0, e: nx ? nx.e : 0 }); }
window.tvResume = function () {
  const o = ls("tv_out", null); if (!o || !KEYRE.test(o.k || "")) return;
  const away = Date.now() - o.at; if (away > 12 * 3600e3) return lsSet("tv_out", null);
  if (away < (o.m === "tv" ? 12 : 35) * 60e3 || (user ? user.id : "") !== (o.u || "") || VIEW !== "home" || $("#layer").lastElementChild) return;
  lsSet("tv_out", null); window.__askO = o;
  const it = keep({ key: o.k, media: o.m, id: o.id, title: o.t, poster: o.p || null, year: o.y });
  if (o.m === "tv" && o.s) {
    const t = S.titles[o.k] || {}; if ((t.eps || {})[o.s + "-" + o.e]) return;
    it.nx = { s: o.s, e: o.e };
    openLayer(`<div class="ovl"><div class="box"><h2>Hai visto ${sxe(o.s, o.e)} di <i>${esc(o.t)}</i>?</h2><p>Lo segno come visto, così “Continua a guardare” resta aggiornato.</p><div class="acts"><button class="btn fz" onclick="askEp(1)">${ic("check")} Sì, segnalo</button><button class="btn fz" onclick="askEp(2)">Ho visto di più</button><button class="btn fz" onclick="askEp(0)">No</button></div></div></div>`);
    window.__askIt = it; return;
  }
  const t = S.titles[o.k] || {}; if (t.watched) return;
  rateOpen(it, { ask: 1 });
};
async function askEp(v) {
  const it = window.__askIt; closeLayer(); if (!v) return;
  if (v === 2) return epPick(it);
  const nx = it.nx, r = await setEps(it, eps => { eps[nx.s + "-" + nx.e] = true; }); if (r !== "done" && r !== undefined) { toast("Segnato " + sxe(nx.s, nx.e) + " come visto"); if (VIEW === "home") showHome(); }
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(() => window.tvResume(), 400); });
function trailer() {
  if (!window.__vid) return; openLayer(`<div class="trl"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(window.__vid)}?autoplay=1&rel=0&modestbranding=1&playsinline=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Trailer"></iframe><span class="hint">Premi Indietro per chiudere</span><button class="fz" style="position:absolute;opacity:0" aria-label="Chiudi"></button></div>`);
  setTimeout(() => { const h = $(".trl .hint"); if (h) h.style.opacity = 0; }, 3000);
}

/* ---------- ricerca ---------- */
let srT = 0;
function showSearch() {
  VIEW = "search"; setBg(null);
  $("#app").innerHTML = `<div class="scr"><div class="top"><div class="logo"><span class="lm"></span>${esc(APP)}</div><button class="pill fz" onclick="showHome()">${ic("back")} Home</button></div><div class="srch"><input class="fld fz" id="q" placeholder="Scrivi un titolo e premi OK" data-enter="srGo" autocomplete="off" oninput="srIn()"><div id="sres" class="grid"></div></div></div>`;
  focusEl($("#q"));
}
function srIn() { clearTimeout(srT); srT = setTimeout(srGo, 450); }
async function srGo() {
  const q = ($("#q") || {}).value || ""; const box = $("#sres"); if (!box) return; if (q.trim().length < 2) { box.innerHTML = ""; return; }
  try { const r = await tmdb("/search/multi", { query: q.trim(), include_adult: "false" }); if (($("#q") || {}).value !== q) return;
    const L = (r.results || []).filter(x => (x.media_type === "movie" || x.media_type === "tv") && x.poster_path).slice(0, 24).map(x => keep(norm(x, x.media_type)));
    box.innerHTML = L.length ? L.map(it => card(it)).join("") : `<div class="empty">Nessun risultato per “${esc(q)}”.</div>`;
    box.querySelectorAll(".card").forEach(c => { c.onclick = () => openDet(ITEMS[c.dataset.k]); });
  } catch (e) { box.innerHTML = `<div class="empty">Ricerca non disponibile.</div>`; }
}

/* ---------- profili: "Chi guarda?" ---------- */
let PROFS = ls("tv_profiles", []).filter(p => p && typeof p.id === "string" && typeof p.rt === "string");
const saveProfs = () => lsSet("tv_profiles", PROFS);
const pName = p => (p && (p.name || (p.email || "").split("@")[0])) || "Profilo";
function profUpsert(s, extra) {
  if (!s || !s.user) return; let p = PROFS.find(x => x.id === s.user.id); if (!p) { p = { id: s.user.id }; PROFS.push(p); }
  Object.assign(p, { at: s.access_token, rt: s.refresh_token, email: s.user.email || p.email || "" }, extra || {}); saveProfs();
}
const profMe = () => ({ name: S.name || "", avatar: S.avatar || 0, photo: S.photo || "" });
function showWho() {
  VIEW = "who"; setBg(null);
  $("#app").innerHTML = `<div class="login who"><div><div class="lm"></div><h1>Chi guarda?</h1><div class="whos">${PROFS.map((p, i) => `<button class="whob fz" data-i="${i}" onclick="useProfile(${i})">${avHtml(p, 10)}<b>${esc(pName(p))}</b></button>`).join("")}${PROFS.length < 6 ? `<button class="whob fz" onclick="addPerson()"><span class="av add" style="width:10rem;height:10rem">+</span><b>Aggiungi</b></button>` : ""}</div></div></div>`;
  focusEl($(`.whob[data-i="${Math.max(0, PROFS.findIndex(p => user && p.id === user.id))}"]`) || $(".whob"));
}
async function useProfile(i) {
  const p = PROFS[i]; if (!p) return; $("#app").innerHTML = `<div class="load">Un attimo…</div>`;
  let s = null; try { s = (await sb.auth.getSession()).data.session; } catch (e) {}
  if (s) profUpsert(s);
  if (!s || s.user.id !== p.id) {
    let r = null; try { r = await sb.auth.setSession({ access_token: p.at, refresh_token: p.rt }); } catch (e) {}
    if (!r || r.error || !r.data || !r.data.session) { PROFS.splice(i, 1); saveProfs(); toast("Per " + pName(p) + " serve un nuovo accesso"); LOG = { email: p.email || "", step: 1 }; return showLogin(); }
    s = r.data.session; profUpsert(s);
  }
  return loggedIn(s, true);
}
async function loggedIn(s, quiet) {
  user = s.user; LOCAL = false; lsSet("tv_mode", ""); await loadData(); profUpsert(s, profMe());
  if (!quiet) toast("Ciao " + (S.name || "") + "!"); enterApp();
}
/* appena entri si va alla Home */
let STARTED = false;
function enterApp() { STARTED = true; showHome(); }
async function addPerson() {
  try { const s = (await sb.auth.getSession()).data.session; if (s) profUpsert(s); } catch (e) {}
  LOG = { email: "", step: 1, add: true }; showLogin();
}

/* ---------- profilo ---------- */
function showProfile() {
  const on = sb && user;
  openLayer(`<div class="ovl"><div class="box prof">${on ? avHtml(S, 7) : ""}<h2>${esc(S.name || "Profilo")}</h2><p>${on ? esc(user.email || "") : "Senza account: i dati restano su questa TV"}</p><div class="acts" style="flex-direction:column;align-items:center">${on ? `<button class="btn fz" onclick="closeLayer();${PROFS.length > 1 ? "showWho()" : "addPerson()"}">${ic("users")} ${PROFS.length > 1 ? "Cambia persona" : "Aggiungi una persona"}</button>` : `<button class="btn fz" onclick="closeLayer();showServices()">I miei abbonamenti</button>`}<button class="btn fz" onclick="closeLayer();refresh()">Aggiorna i consigli</button>${hasUpd() ? `<button class="btn fz" onclick="closeLayer();updCheck()">Aggiornamenti app${appVer() ? " · v" + esc(appVer()) : ""}</button>` : ""}${on ? `<button class="btn fz" onclick="logout()">Esci da questo profilo</button>` : sb ? `<button class="btn fz" onclick="closeLayer();showLogin()">Accedi al tuo account</button>` : ""}<button class="btn fz" onclick="closeLayer()">Chiudi</button></div></div></div>`);
}
async function refresh() { memo.clear(); await loadData(); showHome(); }
async function logout() {
  const id = user && user.id; closeAll();
  try { await sb.auth.signOut({ scope: "local" }); } catch (e) {}
  PROFS = PROFS.filter(p => p.id !== id); saveProfs(); user = null;
  if (PROFS.length) return showWho(); LOG = { email: "", step: 1 }; showLogin();
}

/* ---------- accesso: QR col telefono oppure codice via email ---------- */
let LOG = { email: "", step: 1 }, QRL = null, qrT = 0;
const rid = n => { const a = new Uint8Array(n), c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; crypto.getRandomValues(a); return Array.from(a, x => c[x % c.length]).join(""); };
function showLogin(msg) {
  VIEW = "login"; setBg(null); clearTimeout(qrT);
  const back = PROFS.length ? `<button class="btn fz" onclick="showWho()">${ic("back")} Indietro</button>` : "";
  const email = LOG.step === 1
    ? `<p>Scrivi l’email che usi sul telefono: ti mando un codice di 6 cifre.</p><input class="fld fz" id="em" type="email" inputmode="email" placeholder="la-tua@email.it" value="${esc(LOG.email)}" data-enter="sendCode" autocomplete="email"><div class="err">${esc(msg || "")}</div><div class="acts"><button class="btn fz" onclick="sendCode()">Invia il codice</button>${LOG.add || PROFS.length ? back : `<button class="btn fz" onclick="noAccount()">Continua senza account</button>`}</div>`
    : `<p>Ho inviato un codice a <b>${esc(LOG.email)}</b>. Scrivilo qui sotto.</p><input class="fld fz code" id="cd" inputmode="numeric" maxlength="8" placeholder="••••••" data-enter="checkCode" autocomplete="one-time-code"><div class="err">${esc(msg || "")}</div><div class="acts"><button class="btn fz" onclick="checkCode()">Entra</button><button class="btn fz" onclick="LOG.step=1;showLogin()">Cambia email</button><button class="btn fz" onclick="sendCode(1)">Rimanda il codice</button></div><p class="small">Non trovi l’email? Guarda nella posta indesiderata.</p>`;
  const qr = LOG.step === 1 && sb && window.tvQR;
  $("#app").innerHTML = `<div class="login"><div class="box ${qr ? "two" : ""}"><div class="lm"></div><h2>${LOG.add ? "Aggiungi una persona" : "Accedi a " + esc(APP)}</h2><div class="cols">${qr ? `<div class="col qrc" id="qrb"><div class="qrw"><div class="load sm">Preparo il QR…</div></div></div><div class="or">oppure</div>` : ""}<div class="col">${email}</div></div></div></div>`;
  focusEl($(LOG.step === 1 ? "#em" : "#cd"), false, !!qr);
  if (qr) qrStart();
}
async function qrStart() {
  clearTimeout(qrT); if (VIEW !== "login" || !$("#qrb")) return;
  const id = rid(24), sec = rid(32); let r = null;
  try { r = await sb.rpc("tv_link_new", { p_id: id, p_secret: sec }); } catch (e) {}
  const box = $("#qrb"); if (!box || VIEW !== "login") return;
  if (!r || r.error || !/^\d{4}$/.test(String(r.data || ""))) { box.remove(); const o = $(".login .or"); if (o) o.remove(); $(".login .box").classList.remove("two"); QRL = null; return; }
  QRL = { id, sec, t: Date.now() };
  box.innerHTML = `<h3>Con il telefono</h3><div class="qrw">${tvQR(SITE + "?tv=" + id)}</div><p>Inquadra il QR con la fotocamera del telefono e scrivi questo numero:</p><div class="qn">${esc(r.data)}</div>`;
  qrT = setTimeout(qrPoll, 2500);
}
async function qrPoll() {
  clearTimeout(qrT); if (!QRL || VIEW !== "login" || !$("#qrb")) return;
  if (Date.now() - QRL.t > 9 * 60e3) return qrStart();
  try {
    const r = await sb.rpc("tv_link_poll", { p_id: QRL.id, p_secret: QRL.sec });
    if (!r.error && r.data === "gone") return qrStart();
    if (!r.error && r.data && r.data !== "wait") {
      QRL = null; let v = await sb.auth.verifyOtp({ token_hash: r.data, type: "magiclink" });
      if (v.error || !v.data || !v.data.session) v = await sb.auth.verifyOtp({ token_hash: r.data, type: "email" });
      if (v.error || !v.data || !v.data.session) { toast("Collegamento non riuscito, riprova"); return qrStart(); }
      return loggedIn(v.data.session);
    }
  } catch (e) {}
  qrT = setTimeout(qrPoll, 2500);
}
async function sendCode(again) {
  const e = again ? LOG.email : (($("#em") || {}).value || "").trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return showLogin("Controlla l’email");
  LOG.email = e; const r = await sb.auth.signInWithOtp({ email: e, options: { shouldCreateUser: false } });
  if (r.error) return showLogin(/not found|signups not allowed|user/i.test(r.error.message) ? "Non trovo un account con questa email: registrati prima dal telefono" : /rate|seconds/i.test(r.error.message) ? "Aspetta un minuto prima di chiedere un altro codice" : "Invio non riuscito, riprova");
  LOG.step = 2; showLogin(again ? "Nuovo codice inviato" : "");
}
async function checkCode() {
  const c = (($("#cd") || {}).value || "").replace(/\D/g, ""); if (c.length < 6) return showLogin("Il codice ha 6 cifre");
  const r = await sb.auth.verifyOtp({ email: LOG.email, token: c, type: "email" });
  if (r.error || !r.data || !r.data.session) return showLogin("Codice non valido o scaduto");
  LOG = { email: "", step: 1 }; loggedIn(r.data.session);
}
function noAccount() { LOCAL = true; lsSet("tv_mode", "local"); loadData().then(() => S.subs.length ? enterApp() : showServices()); }
async function showServices() {
  VIEW = "svc"; await loadProv().catch(() => {}); const P = PROV.slice(0, 20);
  $("#app").innerHTML = `<div class="login"><div class="box" style="min-width:90rem"><h2>A quali servizi sei abbonato?</h2><p>Seleziona con OK, poi scegli “Fatto”.</p><div class="svcg">${P.map(p => `<button class="svc fz ${S.subs.includes(p.provider_id) ? "sel" : ""}" data-id="${p.provider_id}" onclick="svcTog(this)"><img src="${IMG}w92${p.logo_path}" alt="">${esc(p.provider_name)}</button>`).join("")}</div><div class="acts" style="justify-content:center"><button class="btn fz" onclick="svcDone()">Fatto</button></div></div></div>`;
  focusEl($(".svc"));
}
function svcTog(b) { const id = +b.dataset.id, i = S.subs.indexOf(id); i < 0 ? S.subs.push(id) : S.subs.splice(i, 1); b.classList.toggle("sel", i < 0); lsSet("tv_local", { subs: S.subs, titles: S.titles }); }
function svcDone() { if (!S.subs.length) return toast("Scegli almeno un servizio"); memo.clear(); if (STARTED) showHome(); else enterApp(); }

/* ---------- Stasera in tre domande ---------- */
const QS = [
  { k: "who", q: "Con chi guardi?", o: [["solo", "🛋️", "Da solo"], ["coppia", "💑", "In coppia"], ["amici", "🍕", "Con amici"], ["bimbi", "🧸", "Con i bambini"]] },
  { k: "time", q: "Quanto tempo hai?", o: [["ep", "⚡", "Un episodio", "meno di 45 minuti"], ["corto", "⏱️", "Un film breve", "meno di 1h 45m"], ["film", "🎬", "Un film", "fino a 2h 30m"], ["sera", "🌙", "Tutta la sera", "anche una serie"]] },
  { k: "mood", q: "Che voglia hai?", o: [["ridere", "😂", "Ridere"], ["emo", "🥹", "Emozionarmi"], ["tens", "😱", "Tensione"], ["relax", "☕", "Rilassarmi"], ["eva", "🚀", "Evadere"], ["azione", "💥", "Azione"], ["sorp", "🎲", "Sorprendimi"]] }
];
const MG = { ridere: [[35], [35]], emo: [[18, 10749], [18]], tens: [[53, 27, 9648], [9648, 80]], relax: [[35, 10751, 16, 10402], [35, 10751, 16, 99]], eva: [[12, 878, 14], [10765, 10759]], azione: [[28, 80], [10759, 80]], sorp: [[], []] };
const ST = { step: 0, who: "", time: "", mood: "", res: [], page: 0 };
function showStasera(step, start) {
  VIEW = "stasera"; setBg(null); ST.step = step; if (!step) Object.assign(ST, { who: "", time: "", mood: "" }); if (start != null) ST.start = !!start;
  const Q = QS[step];
  const hi = ST.start && !step ? `<p class="hi">${user && S.name ? "Ciao " + esc(S.name) + "! " : ""}Tre domande e ti propongo cosa guardare.</p>` : "";
  $("#app").innerHTML = `<div class="scr stq"><div class="top"><div class="logo"><span class="lm"></span>${esc(APP)}</div><button class="pill fz" onclick="showHome()">${ST.start ? "Salta, vai alla Home " + ic("play") : ic("back") + " Home"}</button></div>
<div class="stw">${hi}<div class="dots">${QS.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div><span class="stn">Stasera · ${step + 1} di 3</span><h1>${Q.q}</h1><div class="opts n${Q.o.length}">${Q.o.map(o => `<button class="opt fz ${ST[Q.k] === o[0] ? "sel" : ""}" onclick="stPick('${o[0]}')"><span class="em">${o[1]}</span><b>${o[2]}</b>${o[3] ? `<small>${o[3]}</small>` : ""}</button>`).join("")}</div></div></div>`;
  focusEl($(".opt.sel") || $(".opt"));
}
function stPick(v) { ST[QS[ST.step].k] = v; if (ST.step < 2) return showStasera(ST.step + 1); stCompute(); }
function genAff() { const a = {}, n = {}; Object.values(S.titles).forEach(t => { if (!t.watched || !t.stars) return; (t.genre_ids || []).forEach(g => { a[g] = (a[g] || 0) + (t.stars - 3); n[g] = (n[g] || 0) + 1; }); }); Object.keys(a).forEach(g => { a[g] = a[g] / (n[g] + 2); }); return a; }
async function stCompute() {
  VIEW = "stasera"; ST.step = 3; $("#app").innerHTML = `<div class="load">Cerco le tre migliori per stasera…</div>`;
  const media = ST.time === "ep" ? ["tv"] : ST.time === "sera" ? ["movie", "tv"] : ["movie"], kids = ST.who === "bimbi", mg = MG[ST.mood] || MG.sorp;
  const gOf = m => mg[m === "movie" ? 0 : 1];
  const q = m => {
    const o = { sort_by: "popularity.desc", "vote_count.gte": m === "tv" ? 80 : 200 }, g = gOf(m);
    if (kids) { o.with_genres = m === "movie" ? "10751" : "10762|10751"; o.without_genres = "27,53,80,10749"; }
    else if (g.length) o.with_genres = g.join("|");
    if (!kids && (ST.mood === "relax" || ST.mood === "ridere")) o.without_genres = "27,53";
    if (m === "movie") { o["with_runtime.gte"] = 70; if (ST.time === "corto") o["with_runtime.lte"] = 105; else if (ST.time === "film") o["with_runtime.lte"] = 150; }
    if (m === "tv" && ST.time === "ep") o["with_runtime.lte"] = 45;
    return o;
  };
  const reqs = []; media.forEach(m => [1, 2].forEach(p => reqs.push(disc(m, Object.assign(q(m), { page: p })))));
  const [lists, fy] = await Promise.all([Promise.all(reqs), forYou().catch(() => [])]);
  const aff = genAff(), pool = new Map(), add = (it, bonus, why) => { if (!it || !it.poster || !media.includes(it.media)) return; const c = pool.get(it.key) || { it, b: 0, why: "" }; c.b = Math.max(c.b, bonus); if (why && (!c.why || bonus >= c.b)) c.why = why; pool.set(it.key, c); };
  const fits = it => { const g = gOf(it.media), ids = it.genre_ids || []; if (kids) return ids.some(x => [10751, 16, 10762].includes(x)); return !g.length || ids.some(x => g.includes(x)); };
  lists.flat().forEach((it, i) => add(it, 0, it.vote >= 7.5 ? "Molto amato" : "Popolare sui tuoi servizi"));
  fy.filter(fits).forEach(it => add(it, 1.5, it.why));
  Object.values(S.titles).forEach(t => {
    if (t.watched || t.skipped || !t.poster) return; const it = rowIt(t);
    if (t.media === "tv" && epCount(t) > 0 && ST.time !== "corto" && ST.time !== "film" && (fits(it) || ST.mood === "sorp")) add(it, 3, "La stai guardando");
    else if (t.watchlist && fits(it)) add(it, 2.2, "Dalla tua lista");
  });
  const boostWho = { amici: [35, 28, 27, 53, 10759], coppia: [10749, 18, 35] }[ST.who] || [];
  const sc = c => { const ids = c.it.genre_ids || [], g = gOf(c.it.media); return (c.it.vote || 6.5) * .5 + c.b + (g.length ? ids.filter(x => g.includes(x)).length * .4 : 0) + (ids.length ? ids.reduce((a, x) => a + (aff[x] || 0), 0) / ids.length * .8 : 0) + (ids.some(x => boostWho.includes(x)) ? .4 : 0) + Math.random() * .3; };
  let L = [...pool.values()].map(c => (c.s = sc(c), c)).sort((a, b) => b.s - a.s).slice(0, 24);
  // controlla durata e servizi sui primi
  const ok = await Promise.all(L.map(async c => {
    const it = c.it; let d = {}; try { d = await full(it); } catch (e) {}
    Object.assign(it, { backdrop: it.backdrop || d.backdrop_path, overview: it.overview || d.overview || "", year: it.year || (d.release_date || d.first_air_date || "").slice(0, 4), rt: it.media === "movie" ? d.runtime : tvMeta(d).m, vote: it.vote || d.vote_average || 0 });
    if (it.media === "movie" && it.rt) { if (ST.time === "corto" && it.rt > 110) return false; if (ST.time === "film" && it.rt > 155) return false; }
    if (it.media === "tv" && ST.time === "ep" && it.rt > 55) return false;
    const pv = await provsOf(it); it.pv = pv; return !S.subs.length || S.pirate || pv.mine.length > 0;
  }));
  L = L.filter((c, i) => ok[i]);
  // terzetti vari: niente due titoli dello stesso genere principale nello stesso gruppo
  const out = [], rest = L.slice();
  while (rest.length) { const grp = []; for (let i = 0; i < rest.length && grp.length < 3;) { const g0 = (rest[i].it.genre_ids || [])[0]; if (grp.length < 2 && grp.some(x => (x.it.genre_ids || [])[0] === g0) && rest.length - i > 3 - grp.length) { i++; continue; } grp.push(rest.splice(i, 1)[0]); } out.push(...grp); }
  ST.res = out.map(c => Object.assign(c.it, { why: c.why || "Scelto per te" })); ST.page = 0; stShow();
}
function stShow() {
  VIEW = "stasera"; ST.step = 3; const R3 = ST.res.slice(ST.page * 3, ST.page * 3 + 3), grp = ST.who === "coppia" || ST.who === "amici";
  const lab = (QS[0].o.find(o => o[0] === ST.who) || [])[2] + " · " + (QS[1].o.find(o => o[0] === ST.time) || [])[2] + " · " + (QS[2].o.find(o => o[0] === ST.mood) || [])[2];
  const meta = it => [it.year, it.media === "tv" ? "Serie TV" + (it.rt ? " · " + it.rt + "m a episodio" : "") : it.rt ? Math.floor(it.rt / 60) + "h " + (it.rt % 60) + "m" : "Film", it.vote ? "★ " + it.vote.toFixed(1) : "", it.pv && it.pv.mine[0] ? "su " + it.pv.mine[0].provider_name : ""].filter(Boolean).join(" · ");
  $("#app").innerHTML = `<div class="scr stq"><div class="top"><div class="logo"><span class="lm"></span>${esc(APP)}</div><button class="pill fz" onclick="showHome()">${ic("back")} Home</button></div>
<div class="stw res"><span class="stn">${esc(lab)}</span><h1>${R3.length ? "Le tre per stasera" : "Non ho trovato niente di adatto"}</h1>
${R3.length ? `<div class="st3">${R3.map(it => `<button class="sti fz" data-k="${esc(it.key)}" style="${it.backdrop ? `background-image:url(${IMG}w780${it.backdrop})` : it.poster ? `background-image:url(${IMG}w500${it.poster})` : ""}"><span class="shd"></span><span class="chipw">${esc(it.why)}</span><b>${esc(it.title)}</b><small>${esc(meta(it))}</small></button>`).join("")}</div>` : `<p class="ov">Prova a cambiare una risposta, oppure scegli “Sorprendimi”.</p>`}
<div class="acts">${ST.res.length > 3 ? `<button class="btn fz" onclick="stMore()">${ic("redo")} Altre tre</button>` : ""}<button class="btn fz" onclick="showStasera(0)">Ricomincia</button>${grp && sb && user && ST.res.length ? `<button class="btn fz" onclick="showTogether(ST.res.slice(0,24))">${ic("users")} Scegliete insieme col telefono</button>` : ""}</div></div></div>`;
  $("#app").querySelectorAll(".sti").forEach(c => { c.onclick = () => openDet(ITEMS[c.dataset.k]); });
  focusEl($(".sti") || $(".stw .btn"));
}
function stMore() { const n = Math.ceil(ST.res.length / 3); ST.page = (ST.page + 1) % n; stShow(); }

/* ---------- Guardiamo insieme: QR sulla TV, ognuno vota dal telefono ---------- */
const TV_ROOM = "Serata in TV"; /* nome vecchio: le serate nuove si chiamano come quelle del telefono */
const tvRoomName = () => "Serata del " + new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long" });
let RM = { id: null }, rmT = 0;
const miniOf = i => ({ k: i.key, t: String(i.title || "").slice(0, 200), y: /^\d{4}$/.test(i.year || "") ? i.year : "", p: POSTRE.test(i.poster || "") ? i.poster : "", m: i.media });
async function roomDeck(pool) {
  let L = pool && pool.length ? pool.slice() : [];
  if (!L.length) {
    const wl = Object.values(S.titles).filter(t => t.watchlist && !t.watched && t.poster).slice(0, 8).map(rowIt), fy = await forYou().catch(() => []);
    L = wl.concat(fy.filter(i => !wl.some(w => w.key === i.key)));
  }
  return L.filter(i => i && KEYRE.test(i.key || "") && i.poster).slice(0, 24).map(miniOf);
}
async function showTogether(pool) {
  if (!(sb && user)) return toast("Per scegliere insieme serve l’accesso con il tuo account");
  VIEW = "room"; setBg(null); clearInterval(rmT); $("#app").innerHTML = `<div class="load">Preparo la serata…</div>`;
  try {
    let room = null;
    const rid = ls("tv_room", "");
    if (!pool && rid) { const r = await sb.from("rooms").select("*").eq("id", rid).maybeSingle(); const x = r.data; if (x && Date.now() - new Date(x.created_at).getTime() < 6 * 3600e3 && (x.items || []).length) room = x; }
    if (!room) {
      await sb.from("rooms").delete().eq("owner", user.id).eq("name", TV_ROOM); if (rid) await sb.from("rooms").delete().eq("id", rid).eq("owner", user.id);
      const items = await roomDeck(pool); if (items.length < 4) { toast("Aggiungi qualche titolo alla lista per iniziare"); return showHome(); }
      const r = await sb.rpc("create_room", { p_kind: "duo", p_name: tvRoomName(), p_items: items, p_uname: S.name || "TV", p_avatar: S.avatar || 0 }); if (r.error) throw r.error; room = r.data; lsSet("tv_room", room.id);
    }
    if (VIEW !== "room") return;
    RM = { id: room.id, code: room.code, sig: "", seen: null, auto: !!ls("tv_room_auto", {})[room.id] };
    await roomRender();
    rmT = setInterval(() => { if (VIEW !== "room") return clearInterval(rmT); roomRender(true); }, 4000);
  } catch (e) { toast(/troppe stanze/i.test((e && e.message) || "") ? "Hai troppe serate aperte: eliminane qualcuna dall’app" : "Non riesco a preparare la serata"); showHome(); }
}
async function roomLoad() {
  const [r, m] = await Promise.all([sb.from("rooms").select("*").eq("id", RM.id).maybeSingle(), sb.from("room_members").select("user_id,name,avatar,votes").eq("room_id", RM.id)]);
  if (r.error || !r.data) return null; return { room: r.data, members: m.data || [] };
}
async function roomRender(poll) {
  const x = await roomLoad(); if (VIEW !== "room") return; if (!x) { if (!poll) { toast("La serata non c’è più"); showHome(); } return; }
  const { room, members } = x, items = room.items || [], me = members.find(m => m.user_id === user.id) || { votes: {} };
  const phones = members.filter(m => m.user_id !== user.id), am = ls("tv_room_auto", {});
  // appena qualcuno entra col QR, decidono i telefoni (se non l'hai cambiato tu)
  if (phones.length && am[RM.id] == null) { am[RM.id] = true; lsSet("tv_room_auto", am); RM.auto = true; if (Object.keys(me.votes || {}).some(k => k[0] !== "_")) { const votes = { _tv: 1 }; await sb.from("room_members").update({ votes }).eq("room_id", RM.id).eq("user_id", user.id); me.votes = votes; } }
  // la TV resta nella serata ma non vota: segno _tv, e i telefoni contano solo chi vota davvero
  const isTv = !!(me.votes || {})._tv;
  // (se con lo stesso account qualcuno ha già votato dal telefono, quei voti restano e contano)
  const realVotes = Object.keys(me.votes || {}).some(k => k[0] !== "_");
  if (RM.auto && !isTv && !realVotes) { const votes = { _tv: 1 }; await sb.from("room_members").update({ votes }).eq("room_id", RM.id).eq("user_id", user.id); me.votes = votes; }
  if (!RM.auto && isTv) { const votes = Object.assign({}, me.votes); delete votes._tv; await sb.from("room_members").update({ votes }).eq("room_id", RM.id).eq("user_id", user.id); me.votes = votes; }
  const sig = JSON.stringify(members.map(m => [m.user_id, m.votes])) + items.length + RM.auto; if (poll && sig === RM.sig) return; RM.sig = sig;
  const voters = members.filter(m => !(m.votes || {})._tv), nv = m => Object.keys(m.votes || {}).filter(k => k[0] !== "_" && items.some(i => i.k === k)).length;
  const pos = v => v === 1 || v === 2, vOf = i => voters.map(m => (m.votes || {})[i.k]);
  const all = voters.length > 1 ? items.filter(i => voters.every(m => pos((m.votes || {})[i.k]))) : [];
  const grp = voters.length > 2, need = Math.ceil(voters.length / 2), yes = i => vOf(i).filter(pos).length, sup = i => vOf(i).filter(v => v === 2).length, veto = i => vOf(i).some(v => v === -1);
  const rank = grp ? items.filter(i => !veto(i) && yes(i) >= need && !all.includes(i)).sort((a, b) => (yes(b) + sup(b)) - (yes(a) + sup(a))).slice(0, 6) : [];
  const toIt = i => keep({ key: i.k, media: i.m || i.k.split(":")[0], id: +i.k.split(":")[1], title: i.t, year: i.y || "", poster: i.p || null });
  const qr = window.tvQR ? tvQR(SITE + "?room=" + room.code) : "";
  window.__rmAll = all.map(i => i.k);
  if (RM.auto && phones.length) {
    // lobby: solo informazioni, QR e chi c'è
    const ppl = voters.map(m => { const n = nv(m), p = items.length ? Math.round(n / items.length * 100) : 0; return `<div class="lbp">${avHtml(m, 5)}<div class="lbn"><b>${esc(m.name || "Ospite")}</b><span class="lbb"><i style="width:${p}%"></i></span><small>${n >= items.length ? "Ha finito di votare ✓" : n ? n + " di " + items.length + " votati" : "È appena entrato"}</small></div></div>`; }).join("");
    const res = all.length ? `<h2>Piacciono a tutti <small>${all.length}</small></h2><div class="lbr">${all.slice(0, 7).map(i => `<div class="lbt" style="${i.p ? `background-image:url(${IMG}w342${i.p})` : ""}"><span>${esc(i.t)}</span></div>`).join("")}</div>`
      : rank.length ? `<h2>In testa <small>almeno ${need} sì su ${voters.length}</small></h2><div class="lbr">${rank.slice(0, 7).map(i => `<div class="lbt" style="${i.p ? `background-image:url(${IMG}w342${i.p})` : ""}"><em>${yes(i)}/${voters.length}</em><span>${esc(i.t)}</span></div>`).join("")}</div>`
      : `<p class="lbw">${voters.length < 2 ? "Serve almeno un’altra persona: inquadrate il QR." : "Ancora nessun titolo piace a tutti. Continuate a votare!"}</p>`;
    $("#app").innerHTML = `<div class="scr lobby"><div class="lbq"><div class="qrw big">${qr}</div><p>Inquadra per entrare</p><p class="small">o codice <b>${esc(room.code)}</b> in Insieme › Serata in due</p></div>
<div class="lbi"><span class="lbk">${ic("users")} Guardiamo insieme</span><h1>Scegliete dal telefono</h1>
<ol class="lbh"><li><b>1</b>Inquadra il QR con il telefono</li><li><b>2</b>Vota “Mi piace” o “Passo”: hai un super-voto e un veto</li><li><b>3</b>Quando un titolo piace a tutti, compare qui</li></ol>
<h2>Nella lobby <small>${voters.length} ${voters.length === 1 ? "persona" : "persone"} · ${items.length} titoli</small></h2><div class="lbl">${ppl}</div>${res}</div>
<span class="lbx">Indietro per tornare alla Home</span><button class="fz lbf" aria-label="Guardiamo insieme"></button></div>`;
    if (!$("#layer").lastElementChild) focusEl($("#app .lbf"), true);
  } else {
    const next = RM.auto ? null : items.find(i => (me.votes || {})[i.k] == null), left = items.filter(i => (me.votes || {})[i.k] == null).length;
    const used = v => Object.values(me.votes || {}).includes(v);
    const fk = FOC && document.body.contains(FOC) ? (FOC.dataset.f || FOC.dataset.k || "") : "";
    $("#app").innerHTML = `<div class="scr room"><div class="top"><div class="logo"><span class="lm"></span>${esc(APP)}</div><button class="pill fz" data-f="home" onclick="showHome()">${ic("back")} Home</button></div>
<div class="rgrid"><div class="rqr"><h1>Guardiamo insieme</h1><div class="qrw">${qr}</div><p>Inquadrate il QR col telefono: ognuno vota dal suo. Quando un titolo piace a tutti, compare qui.</p><p class="small">Oppure nell’app: Insieme › Serata in due, codice <b>${esc(room.code)}</b></p>
<div class="ppl">${members.map(m => `<div class="pp">${avHtml(m, 4)}<b>${esc(m.user_id === user.id ? (m.name || "TV") + " (TV)" : m.name || "Ospite")}</b><small>${nv(m)}/${items.length}</small></div>`).join("")}</div></div>
<div class="rvote">${all.length ? `<h2>Piacciono a tutti <small>${all.length}</small></h2><div class="rail rr">${all.map(i => card(toIt(i))).join("")}</div><div class="acts"><button class="btn fz" data-f="pick" onclick="roomPick()">${ic("dice")} Scegli per noi</button></div>` : ""}
${rank.length ? `<h2>In testa nel gruppo <small>almeno ${need} sì su ${voters.length}</small></h2><div class="rail rr">${rank.map(i => card(toIt(i), `<span class="vt">${yes(i)}/${voters.length}</span>`)).join("")}</div>` : ""}
${next ? `<h2>Tocca alla TV <small>${left} da votare</small></h2><div class="vcard"><div class="vpo" style="${next.p ? `background-image:url(${IMG}w342${next.p})` : ""}"></div><div class="vin"><b>${esc(next.t)}</b><span>${esc(next.y || "")}${next.m === "tv" ? " · Serie TV" : ""}</span><div class="acts"><button class="btn fz" data-f="v0" onclick="roomVote('${esc(next.k)}',0)">${ic("x")} Passo</button><button class="btn fz hot" data-f="v1" onclick="roomVote('${esc(next.k)}',1)">${ic("heart")} Mi piace</button></div><div class="acts"><button class="btn sm fz" data-f="v2" ${used(2) ? "disabled" : ""} onclick="roomVote('${esc(next.k)}',2)">${ic("star")} Super-voto${used(2) ? " (usato)" : ""}</button><button class="btn sm fz" data-f="v-1" ${used(-1) ? "disabled" : ""} onclick="roomVote('${esc(next.k)}',-1)">${ic("ban")} Veto${used(-1) ? " (usato)" : ""}</button></div></div></div>`
    : `<p class="ov">${RM.auto ? "Decidono i telefoni: la TV mostra solo i risultati." : "La TV ha votato tutto."} ${phones.length ? "" : "Aspetto che qualcuno inquadri il QR…"}</p>`}
<div class="acts">${RM.auto ? `<button class="btn sm fz" data-f="auto" onclick="roomAuto(0)">Vota anche dalla TV</button>` : `<button class="btn sm fz" data-f="auto" onclick="roomAuto(1)">Decidono i telefoni</button>`}<button class="btn sm fz" data-f="new" onclick="roomNew()">${ic("redo")} Nuova serata</button></div></div></div></div>`;
    $("#app").querySelectorAll(".card").forEach(c => { c.onclick = () => openDet(ITEMS[c.dataset.k]); });
    const back = fk && ($(`#app [data-f="${fk}"]:not([disabled])`) || $(`#app [data-k="${fk}"]`));
    if (!$("#layer").lastElementChild) focusEl(back || $("#app [data-f='v1']") || $("#app .rvote .fz") || $("#app .fz"), true);
  }
  if (RM.seen != null && all.length > RM.seen) roomMatch(all[all.length - 1], voters);
  RM.seen = all.length;
}
async function roomVote(k, v) {
  const x = await roomLoad(); if (!x) return; const me = x.members.find(m => m.user_id === user.id); if (!me) return;
  if ((v === 2 || v === -1) && Object.values(me.votes || {}).includes(v)) return toast(v === 2 ? "Hai già usato il super-voto" : "Hai già usato il veto");
  const votes = Object.assign({}, me.votes, { [k]: v }); delete votes._tv; const r = await sb.from("room_members").update({ votes }).eq("room_id", RM.id).eq("user_id", user.id);
  if (r.error) return toast("Voto non salvato"); RM.sig = ""; roomRender(true);
}
async function roomAuto(on) { const a = ls("tv_room_auto", {}); a[RM.id] = !!on; lsSet("tv_room_auto", a); RM.auto = !!on; if (on) { try { await sb.from("room_members").update({ votes: { _tv: 1 } }).eq("room_id", RM.id).eq("user_id", user.id); } catch (e) {} } RM.sig = ""; roomRender(true); }
async function roomNew() { clearInterval(rmT); try { const rid = ls("tv_room", ""); if (rid) await sb.from("rooms").delete().eq("id", rid).eq("owner", user.id); lsSet("tv_room", ""); } catch (e) {} showTogether(); }
function roomPick() { const a = window.__rmAll || []; if (a.length) openDet(ITEMS[a[Math.floor(Math.random() * a.length)]]); }
async function roomMatch(i, members) {
  const it = ITEMS[i.k]; if (!it) return; if ($("#layer").lastElementChild) return;
  const pv = await provsOf(it); it.pv = pv; const svc = pv.mine[0] || (pv.rb ? { provider_name: "Prime Video" } : null);
  openLayer(`<div class="ovl"><div class="box match"><span class="mk">${ic("star")} Intesa perfetta</span><h2>È UN MATCH!</h2><div class="mav">${members.slice(0, 6).map(m => avHtml(m, 4.4)).join("")}</div><div class="mi">${i.p ? `<img src="${IMG}w342${esc(i.p)}" alt="">` : ""}<div><b>${esc(i.t)}</b><span>${esc(i.y || "")}${i.m === "tv" ? " · Serie TV" : " · Film"}</span></div></div><div class="acts"><button class="btn fz hot" ${svc ? brandStyle(svc.provider_name) : ""} onclick="window.__det=ITEMS['${esc(i.k)}'];closeLayer();openApp(__det)">${ic("play")} ${svc ? "Apri " + esc(svc.provider_name) : "Dove vederlo"}</button><button class="btn fz" onclick="closeLayer();openDet(ITEMS['${esc(i.k)}'])">${ic("info")} Dettagli</button><button class="btn fz" onclick="closeLayer()">Continua a votare</button></div></div></div>`);
}

/* ---------- aggiornamenti dell'app (solo nell'app Android) ---------- */
const hasUpd = () => !!(window.TonightlyTV && TonightlyTV.checkUpdate);
const appVer = () => { try { return window.TonightlyTV && TonightlyTV.version ? TonightlyTV.version() : ""; } catch (e) { return ""; } };
window.tvUpdate = function (u) {
  if (!u) return;
  if (u.none) { if (window.__updManual) toast(u.err ? "Non riesco a controllare gli aggiornamenti adesso" : "Hai già l’ultima versione"); window.__updManual = 0; return; }
  const sk = ls("tv_upd_skip", null); if (!u.manual && sk && sk.v === u.v && Date.now() - sk.t < 864e5) return;
  if ($("#layer .upd")) return; window.__updManual = 0;
  openLayer(`<div class="ovl"><div class="box upd"><div class="lm"></div><h2>Aggiornamento disponibile</h2><p>È pronta una nuova versione di ${esc(APP)} TV (1.${u.v}, ora hai la 1.${u.cur || "?"}). Si installa in un minuto e i tuoi dati restano.</p><div class="updb"><i id="updp"></i></div><p class="small" id="updm"></p><div class="acts"><button class="btn fz hot" onclick="updGo()">${ic("check")} Aggiorna ora</button><button class="btn fz" onclick="lsSet('tv_upd_skip',{v:${+u.v},t:Date.now()});closeLayer()">Più tardi</button></div></div></div>`);
};
function updGo() { try { TonightlyTV.installUpdate(); const m = $("#updm"); if (m) m.textContent = "Scarico l’aggiornamento…"; } catch (e) { toast("Non riesco ad aggiornare da qui"); } }
window.tvUpdProg = function (p) {
  const b = $("#updp"), m = $("#updm"); if (!m) return;
  if (p >= 0) { if (b) b.style.width = p + "%"; m.textContent = p < 100 ? "Scarico… " + p + "%" : "Apro l’installazione: premi “Installa”"; }
  else if (p === -2) m.textContent = "Solo la prima volta: attiva “Consenti da questa fonte” per Tonightly, poi premi Indietro. L’installazione riparte da sola.";
  else m.textContent = "Non è andata: controlla la connessione e premi di nuovo “Aggiorna ora”.";
};
function updCheck() { if (!hasUpd()) return toast("Gli aggiornamenti si controllano dall’app Tonightly sulla TV"); window.__updManual = 1; toast("Controllo gli aggiornamenti…"); try { TonightlyTV.checkUpdate(); } catch (e) {} }

/* ---------- avvio ---------- */
(async () => {
  if (!C.TMDB_KEY) { $("#app").innerHTML = `<div class="load">Manca la chiave TMDB in config.js</div>`; return; }
  if (sb) {
    try { const { data } = await sb.auth.getSession(); user = data.session ? data.session.user : null; if (data.session && !PROFS.some(p => p.id === data.session.user.id)) profUpsert(data.session); } catch (e) {}
    try { sb.auth.onAuthStateChange((ev, s) => { if (s && s.user && PROFS.some(p => p.id === s.user.id)) profUpsert(s); }); } catch (e) {}
  }
  if (sb && PROFS.length > 1) return showWho();
  if (sb && !user && PROFS.length === 1) return useProfile(0);
  if (sb && !user && ls("tv_mode", "") !== "local") return showLogin();
  LOCAL = !user; await loadData();
  if (user) profUpsert((await sb.auth.getSession()).data.session, profMe());
  if (LOCAL && !S.subs.length) return showServices();
  enterApp();
})();
