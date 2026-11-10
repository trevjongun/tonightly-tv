/* Tonightly – novità di novembre: menu a capsula, Scopri (Film · Serie TV · Uscite), scheda più snella,
   voto in stile TV Time (stelle, emozione, dove l'hai visto, con chi, commento) con storia da pubblicare,
   uscite divise tra cinema e streaming, amici consigliati, 🏴‍☠️ Guardo tutto. */
"use strict";
ICO.compass = '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>';

/* ================= Menu ================= */
NAV.splice(0, NAV.length, ["home", "home", "Home"], ["disc", "compass", "Scopri"], ["tonight", "moon", "Stasera"], ["list", "list", "La mia lista"], ["together", "users", "Insieme"], ["prof", "user", "Profilo"]);
const NSH = { list: "Lista", prof: "Tu" };
Object.assign(NM, { movie: "disc", tv: "disc", soon: "disc" }); delete NM.tonight;
renderNav = function () {
  const cur = NM[view] || view;
  $("#nav").innerHTML = `<div class="nbrand">${logoMark(30)}<b>${esc(APP)}</b></div>` + NAV.map(([k, i, l]) => `<button data-k="${k}" class="${cur === k ? "on" : ""}" onclick="${k === "disc" ? "goDisc()" : `go('${k}')`}" ${cur === k ? 'aria-current="page"' : ""} aria-label="${l}">${ic(i, 22)}<b class="ll">${l}</b><b class="sl">${NSH[k] || l}</b></button>`).join("") + navSubs();
  $("#nav").classList.add("cap");
};
function goDisc() { const v = lsGet("cm_disc", "movie"); go(["movie", "tv", "soon"].includes(v) ? v : "movie"); }
const dseg = cur => `<div class="dseg" role="tablist">${[["movie", "Film"], ["tv", "Serie TV"], ["soon", "Uscite"]].map(([v, l]) => `<button role="tab" class="${cur === v ? "on" : ""}" aria-selected="${cur === v}" onclick="go('${v}')">${l}</button>`).join("")}</div>`;
(function () { const v0 = vMT; vMT = async function () { const h = await v0.apply(this, arguments); lsSet("cm_disc", view); return fbarize(h.replace('<div class="sec pt">', '<div class="sec pt">' + dseg(view))); }; })();
/* filtri in una riga sola: Ordina · Genere · Servizi (menu a tendina dal basso) + € noleggio */
let FB = {};
function fbarize(h) {
  const box = document.createElement("div"); box.innerHTML = h; const sec = box.querySelector(".sec.pt"); if (!sec) return h;
  const rows = [...sec.querySelectorAll(":scope > .row")].filter(r => !r.classList.contains("segs"));
  const svb = rows.find(r => r.classList.contains("svb")), sortR = rows.find(r => r.querySelector('[onclick^="setSortK"]')), genR = rows.find(r => r.querySelector('[onclick^="quickGenre"]'));
  if (!sortR && !genR) return h;
  const opts = (r, sel) => r ? [...r.querySelectorAll(sel || "button.chip")].map(b => ({ l: b.textContent.trim(), f: b.getAttribute("onclick"), on: b.classList.contains("on"), img: (b.querySelector("img") || {}).src || "" })) : [];
  FB = { sort: opts(sortR, 'button.chip[onclick^="setSortK"]'), gen: opts(genR), svc: opts(svb) };
  const rent = sortR && sortR.querySelector(".rentc");
  const cur = (L, dflt) => { const o = L.find(x => x.on); return o || { l: dflt }; };
  const chev = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const dd = (k, ttl, dflt) => { const L = FB[k]; if (!L.length) return ""; const c = cur(L, dflt), first = L[0] === c; const lab = first && k !== "sort" ? ttl : c.l; return `<button class="fdd ${first && k !== "sort" ? "" : "on"}" onclick="fbOpen('${k}')" aria-label="${esc(ttl)}">${c.img && !first ? `<img src="${esc(c.img)}" alt="" width="18" height="18">` : ""}<span>${esc(lab)}</span>${chev}</button>`; };
  const bar = document.createElement("div"); bar.className = "fbar";
  bar.innerHTML = dd("sort", "Ordina", "Per te") + dd("gen", "Genere", "Tutti i generi") + dd("svc", "Servizi", "I miei abbonamenti");
  if (rent) { rent.classList.add("fdd"); rent.innerHTML = rent.innerHTML.replace("Noleggio e acquisto", "Noleggio"); bar.appendChild(rent); }
  const first = rows[0]; first.parentNode.insertBefore(bar, first); [svb, sortR, genR].forEach(r => r && r.remove());
  return box.innerHTML;
}
function fbOpen(k) { const L = FB[k] || [], t = { sort: "Ordina per", gen: "Genere", svc: "Servizi" }[k]; amenu(t, L.map(o => [o.on ? "check" : "", esc(o.l), o.f, o.on ? "on" : ""])); const r = $("#amenu .amr"); if (r && L.length > 6) r.classList.add("g2"); }

/* ================= 🏴‍☠️ Guardo tutto ================= */
const pirate = () => !!P().pirate;
async function pirTog() {
  P().pirate = !pirate(); await saveProfile(); affC = null; if (typeof RX !== "undefined") RX.out = null; try { localStorage.removeItem("cm_rx_out"); } catch (e) {}
  toast(pirate() ? "🏴‍☠️ Guardo tutto: ti consiglio qualsiasi titolo" : "Ti consiglio solo quello che c’è nei tuoi abbonamenti"); render();
}
const pirCard = () => `<button class="pirc ${pirate() ? "on" : ""}" onclick="pirTog()" aria-pressed="${pirate()}"><span class="pf" aria-hidden="true">🏴‍☠️</span><span class="pt"><b>Guardo tutto</b><small>Ti consiglio qualsiasi film e serie, anche fuori dai tuoi abbonamenti. I tuoi servizi restano in evidenza.</small></span><span class="tg" aria-hidden="true"></span></button>`;
(function () { const s0 = setServ; setServ = async function () { const h = await s0.apply(this, arguments); const i = h.indexOf("</p>"); return i < 0 ? pirCard() + h : h.slice(0, i + 4) + pirCard() + h.slice(i + 4); }; })();

/* ================= Uscite: cinema e streaming ================= */
let SOONT = lsGet("cm_soont", "cin");
function soonTab(v) { SOONT = v; lsSet("cm_soont", v); render(); }
const relRow = (it, sub, right) => { ITEMS[it.key] = ITEMS[it.key] || it; const mp = matchPct(it); return `<div class="rl" onclick="openSheet('${it.key}')">${it.poster ? `<img src="${IMG}w154${it.poster}" alt="" loading="lazy">` : `<span class="rlp"></span>`}<div class="rlt"><b>${esc(it.title)}</b><span>${sub}</span></div><div class="rlr">${right || ""}${mp ? `<small class="rlm">${mp}%</small>` : ""}</div></div>`; };
const gname = it => (it.genre_ids || []).slice(0, 1).map(g => GN[g]).filter(Boolean).join("");
const shortD = s => s ? new Date(s + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";
const wlBtn = k => { const on = !!(S.titles[k] || {}).watchlist; return `<button class="rlb ${on ? "on" : ""}" aria-label="${on ? "Togli dalla lista" : "Aggiungi alla lista"}" onclick="event.stopPropagation();relWl('${k}',this)">${ic(on ? "check" : "plus", 16)}</button>`; };
async function relWl(k, b) { const it = byKey(k), on = !(S.titles[k] || {}).watchlist; await put(it, { watchlist: on, skipped: false }); b.classList.toggle("on", on); b.innerHTML = ic(on ? "check" : "plus", 16); toast(on ? "Aggiunto alla tua lista" : "Tolto dalla lista"); vib(8); }
async function soonCin() {
  const reg = C.REGION || "IT", td = today(), have = k => { const t = S.titles[k]; return t && (t.watched || t.skipped); };
  const [np1, np2, u1, u2] = await Promise.all([tmdb("/movie/now_playing", { region: reg, page: 1 }), tmdb("/movie/now_playing", { region: reg, page: 2 }), tmdb("/movie/upcoming", { region: reg, page: 1 }), tmdb("/movie/upcoming", { region: reg, page: 2 })].map(p => p.catch(() => ({ results: [] }))));
  const uniq = L => L.filter((x, i, a) => x.poster_path && a.findIndex(y => y.id === x.id) === i);
  const now = uniq([...np1.results, ...np2.results]).filter(x => (x.release_date || "") <= td).map(x => Object.assign(norm(x, "movie"), { date: x.release_date })).filter(x => !have(x.key)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const up = uniq([...u1.results, ...u2.results]).filter(x => (x.release_date || "") > td).map(x => Object.assign(norm(x, "movie"), { date: x.release_date })).filter(x => !have(x.key) && !now.some(n => n.key === x.key)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20);
  let h = "";
  if (now.length) h += `<h3 class="dday">Ora in sala</h3>` + now.map(it => relRow(it, [gname(it), "uscito il " + shortD(it.date)].filter(Boolean).join(" · "), wlBtn(it.key))).join("");
  if (up.length) { const wk = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10); const a = up.filter(x => x.date <= wk), b = up.filter(x => x.date > wk);
    if (a.length) h += `<h3 class="dday">Questa settimana</h3>` + a.map(it => relRow(it, [gname(it), dLabel(it.date)].filter(Boolean).join(" · "), `<span class="pill2">${esc(shortD(it.date))}</span>` + wlBtn(it.key))).join("");
    if (b.length) h += `<h3 class="dday">Più avanti</h3>` + b.map(it => relRow(it, [gname(it), shortD(it.date)].filter(Boolean).join(" · "), wlBtn(it.key))).join(""); }
  return h || emptyBox("calendar", "Non trovo uscite al cinema in questo momento.", "");
}
async function soonStr() {
  const d = await soonData().catch(() => ({ tv: [], mv: [] })), td = today();
  const prov = pirate() ? [] : mineIds(), q = m => { const dk = m === "tv" ? "first_air_date" : "primary_release_date", p = { sort_by: dk + ".desc", [dk + ".lte"]: td, [dk + ".gte"]: new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10), "vote_count.gte": 5 }; if (prov.length) Object.assign(p, { watch_region: R, with_watch_monetization_types: "flatrate", with_watch_providers: prov.join("|") }); else if (!pirate()) Object.assign(p, { watch_region: R, with_watch_monetization_types: "flatrate" }); return p; };
  const [nm, nt] = await Promise.all(["movie", "tv"].map(m => tmdb("/discover/" + m, q(m)).catch(() => ({ results: [] }))));
  const have = k => { const t = S.titles[k]; return t && (t.watched || t.skipped || (t.media === "tv" && epCount(t) > 0)); };
  const fresh = [...nm.results.map(x => norm(x, "movie")), ...nt.results.map(x => norm(x, "tv"))].filter(i => i.poster && !have(i.key)).sort((a, b) => (b.year || "").localeCompare(a.year || "") || (matchPct(b) || 0) - (matchPct(a) || 0)).slice(0, 16);
  const wk = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), a = d.tv.filter(r => r.date <= wk), b = d.tv.filter(r => r.date > wk);
  const ep = r => { const it = rowItem(r.t); return relRow(it, esc(soonLine(r)) + " · " + esc(dLabel(r.date)), `<span class="pill2">${esc(shortD(r.date))}</span>`); };
  let h = icsButton(d);
  if (a.length) h += `<h3 class="dday">Le tue serie · questa settimana</h3>` + a.map(ep).join("");
  if (b.length) h += `<h3 class="dday">Le tue serie · più avanti</h3>` + b.map(ep).join("");
  if (fresh.length) h += `<h3 class="dday">Appena arrivati ${pirate() ? "in streaming" : "sui tuoi servizi"}</h3>` + fresh.map(it => relRow(it, [it.media === "tv" ? "Serie TV" : "Film", gname(it), it.year].filter(Boolean).join(" · "), wlBtn(it.key))).join("");
  return h || emptyBox("calendar", "Per ora niente in arrivo. Segna le serie che guardi e qui vedrai nuove stagioni ed episodi.", "");
}
vSoon = async function () {
  lsSet("cm_disc", "soon");
  const tabs = `<div class="seg2" role="tablist">${[["cin", "🎬 Al cinema"], ["str", "📺 In streaming"]].map(([v, l]) => `<button role="tab" aria-selected="${SOONT === v}" class="${SOONT === v ? "on" : ""}" onclick="soonTab('${v}')">${l}</button>`).join("")}</div>`;
  const body = SOONT === "str" ? await soonStr() : await soonCin();
  return `<div class="sec pt">${dseg("soon")}${tabs}<div class="rels">${body}</div></div>`;
};

/* ================= Scheda del titolo più snella ================= */
const SHX = { k: "", tab: "" };
(function () { const o = openSheet; openSheet = async function (k) { await o.apply(this, arguments); try { shSlim(k); } catch (e) { console.warn("scheda", e); } }; })();
function shSlim(k) {
  const box = $("#sheet .sheet"), pad = box && box.querySelector(".pad"); if (!pad || pad.dataset.slim) return;
  const it = byKey(k); if (!it) return; pad.dataset.slim = "1"; box.classList.add("slim");
  const t = S.titles[k] || {}, isTv = it.media === "tv", kids = [...pad.children];
  const h2 = pad.querySelector("h2.h"), meta = h2 && h2.nextElementSibling, affP = kids.find(c => c.tagName === "P" && c.querySelector(".pill"));
  const plats = pad.querySelector(".plats"), note = plats && plats.nextElementSibling && plats.nextElementSibling.matches("p.small") ? plats.nextElementSibling : null;
  const shacts = pad.querySelector(".shacts"), frx = $("#frx"), ov = frx && frx.nextElementSibling && frx.nextElementSibling.tagName === "P" ? frx.nextElementSibling : null;
  const dir = ov && ov.nextElementSibling && ov.nextElementSibling.matches("p.mu") ? ov.nextElementSibling : null;
  const h3s = [...pad.querySelectorAll(":scope > h3.h")], castH = h3s.find(h => /cast/i.test(h.textContent)), casts = pad.querySelector(".casts"), cmH = h3s.find(h => /commenti/i.test(h.textContent));
  // testata: locandina + titolo
  const head = document.createElement("div"); head.className = "sht2";
  head.innerHTML = `${it.poster ? `<img class="shpo" src="${IMG}w342${it.poster}" alt="">` : ""}<div class="shtt"></div>`;
  const tt = head.querySelector(".shtt"); [h2, meta, affP].forEach(x => x && tt.appendChild(x));
  // dove guardarlo
  const w = document.createElement("div"); w.className = "shw"; w.id = "shw"; w.innerHTML = shWatch(k, plats);
  // azioni
  const sbar = box.querySelector(".sbar"), bs = sbar ? [...sbar.querySelectorAll("button")] : [], oc = i => bs[i] ? bs[i].getAttribute("onclick") : "";
  const a4 = document.createElement("div"); a4.className = "acts4";
  a4.innerHTML = `<button class="${t.watchlist ? "on" : ""}" onclick="${oc(0)}">${ic(t.watchlist ? "check" : "plus", 22)}<span>${t.watchlist ? "In lista" : "Lista"}</span></button><button class="${t.watched ? "on g" : ""}" onclick="${oc(1)}">${ic("check", 22)}<span>${t.watched ? (t.stars ? stTxt(t.stars) : "Visto") : isTv ? "Serie vista" : "Visto"}</span></button><button class="${t.favorite ? "on r" : ""}" onclick="${oc(2)}">${ic("heart", 22)}<span>${isTv ? "Preferita" : "Preferito"}</span></button><button onclick="shMore('${k}')">${ic("dots", 22)}<span>Altro</span></button>`;
  if (sbar) sbar.remove();
  // tasti piccoli
  const ch = document.createElement("div"); ch.className = "shch";
  if (shacts) [...shacts.children].forEach(b => ch.appendChild(b)); if (frx) ch.appendChild(frx);
  if (shacts) shacts.remove();
  // schede
  const P0 = (id, els) => { const p = document.createElement("div"); p.className = "shp"; p.dataset.t = id; els.filter(Boolean).forEach(e => p.appendChild(e)); return p; };
  const sim = document.createElement("div"); sim.id = "simx"; sim.dataset.k = k;
  if (castH) castH.remove(); if (cmH) cmH.remove();
  if (note) note.remove();
  const tabs = [["info", "Info", [ov, dir, plats, $("#sagax")]], ["cast", "Cast", [casts]], ["sim", "Simili", [sim]], ["diary", "Diario", [$("#diaryx"), $("#notex")]], ["cm", "Commenti", [$("#cmx")]]];
  if (isTv) tabs.unshift(["ep", "Episodi", [$("#tvx")]]);
  const bar = document.createElement("div"); bar.className = "shtabs"; bar.setAttribute("role", "tablist");
  bar.innerHTML = tabs.filter(x => x[0] !== "cast" || casts).map(([id, l]) => `<button role="tab" data-t="${id}" onclick="shTab('${id}')">${l}</button>`).join("");
  const panes = tabs.map(([id, , els]) => P0(id, els));
  pad.innerHTML = ""; [head, w, a4, ch, bar, ...panes].forEach(x => pad.appendChild(x));
  shTab(SHX.k === k && SHX.tab ? SHX.tab : isTv ? "ep" : "info"); SHX.k = k;
  if (isTv) shNext(k);
}
function shTab(id) {
  const box = $("#sheet .sheet"); if (!box) return; SHX.tab = id;
  box.querySelectorAll(".shtabs button").forEach(b => { const on = b.dataset.t === id; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  box.querySelectorAll(".shp").forEach(p => { p.hidden = p.dataset.t !== id; });
  if (id === "sim") shSim();
}
/* colori dei servizi di streaming, per i pulsanti "Guarda su…" */
const BRANDS = [[/netflix/i, "#E50914", "#fff"], [/prime video|amazon/i, "#00A8E1", "#fff"], [/disney/i, "#113CCF", "#fff"], [/apple tv/i, "#000000", "#fff"], [/paramount/i, "#0064FF", "#fff"], [/^max|hbo/i, "#002BE7", "#fff"], [/crunchyroll/i, "#F47521", "#fff"], [/mubi/i, "#000000", "#fff"], [/raiplay|rai play/i, "#0A5FC1", "#fff"], [/discovery/i, "#2175D9", "#fff"], [/rakuten/i, "#BF0000", "#fff"], [/timvision/i, "#00338D", "#fff"], [/mediaset|infinity/i, "#1A2C6B", "#fff"], [/^now\b|now tv/i, "#111111", "#fff"], [/youtube/i, "#FF0000", "#fff"], [/chili/i, "#E3051B", "#fff"]];
const brand = name => { const b = BRANDS.find(x => x[0].test(String(name || "").trim())); return b ? { bg: b[1], fg: b[2] } : null; };
const brandStyle = name => { const b = brand(name); return b ? `style="background:${b.bg};color:${b.fg};border-color:${b.bg}"` : ""; };
var shWatch; /* definita più avanti */
var shNext; /* definita più avanti */
async function shEp(k, s, e) { await setEps(k, eps => { eps[s + "-" + e] = true; }); toast("Segnato " + sxe(s, e) + " come visto"); vib(10); const w = $("#shw"); if (w) shNext(k); }
function shMore(k) {
  const it = byKey(k), t = S.titles[k] || {};
  const rows = [["list", "Aggiungi a una mia lista", `amClose();listPick('${k}')`], ["share", "Condividi o consiglia", `amClose();${xUser() ? "shareMenu" : "shareTitle"}('${k}')`]];
  if (t.watched) rows.push(["camera", "Crea la storia da pubblicare", `amClose();storyOpen('${k}')`]);
  if (typeof rxMore === "function") rows.push(["star", "Più titoli così", `amClose();rxMore('${k}')`]);
  if (typeof rxNot === "function") rows.push(["x", "Non fa per me", `amClose();rxNot('${k}')`]);
  amenu(it ? it.title : "Altro", rows);
}
async function shSim() {
  const b = $("#simx"); if (!b || b.dataset.done) return; b.dataset.done = "1"; const it = byKey(b.dataset.k); b.innerHTML = `<p class="mu">Caricamento…</p>`;
  try { const r = await tmdb("/" + it.media + "/" + it.id + "/recommendations"), L = (r.results || []).filter(x => x.poster_path).slice(0, 18).map(x => norm(x, it.media)); L.forEach(i => { ITEMS[i.key] = ITEMS[i.key] || i; });
    b.innerHTML = L.length ? `<div class="simg">${L.map(i => card(i)).join("")}</div>` : `<p class="mu">Nessun titolo simile trovato.</p>`; if (typeof fillProv === "function") fillProv();
  } catch (e) { b.innerHTML = `<p class="mu">Non riesco a caricare i titoli simili.</p>`; }
}

/* ================= Voto in stile TV Time ================= */
const EMO = [["gas", "🤩", "Gasato"], ["div", "😂", "Divertito"], ["com", "🥹", "Commosso"], ["tes", "😱", "Teso"], ["sor", "🤯", "Sorpreso"], ["inn", "😍", "Innamorato"], ["noi", "😴", "Annoiato"], ["arr", "😡", "Arrabbiato"]];
const WITH = [["Da solo", "🛋️"], ["In coppia", "💑"], ["Amici", "🍕"], ["Famiglia", "👨‍👩‍👧"]];
const SRC = { cinema: ["🎬", "Al cinema"], pirata: ["🏴‍☠️", "Pirata"], noleggio: ["€", "Noleggio"], altro: ["📀", "Altro"] };
/* solo le opzioni possibili: cinema se il film è uscito in sala da poco, i servizi dove è in abbonamento, il noleggio se c'è, sempre "Pirata" */
async function whereOpts(it) {
  let d = {}; try { d = await full(it); } catch (e) {}
  const fl = flatOf(d), rb = rbFull(d), out = [], td = new Date();
  if (it.media === "movie") {
    let rel = d.release_date || "";
    try { const r = await tmdb("/movie/" + it.id + "/release_dates"), c = (r.results || []).find(x => x.iso_3166_1 === (C.REGION || "IT")), th = c && (c.release_dates || []).filter(x => x.type === 3 || x.type === 2).map(x => (x.release_date || "").slice(0, 10)).sort()[0]; if (th) rel = th; } catch (e) {}
    const days = rel ? (td - new Date(rel + "T12:00:00")) / 864e5 : 9999;
    if (days >= -3 && (days <= 150 || (!fl.length && days <= 400))) out.push({ v: "cinema", e: "🎬", l: "Al cinema" });
  }
  fl.slice().sort((a, b) => isMine(b.provider_id) - isMine(a.provider_id)).forEach(p => out.push({ v: "p" + p.provider_id, img: p.logo_path, l: cleanName(p.provider_name), mine: isMine(p.provider_id) }));
  if (rb) out.push({ v: "noleggio", e: "€", l: "Noleggio" });
  if (!out.length) out.push({ v: "altro", e: "📀", l: "Altro (TV, DVD…)" });
  out.push({ v: "pirata", e: "🏴‍☠️", l: "Pirata" });
  const why = out.some(o => o.v === "cinema") && !fl.length ? "Uscito da poco al cinema, non è ancora in abbonamento in Italia" : fl.length ? "È in abbonamento su " + fl.map(p => cleanName(p.provider_name)).slice(0, 3).join(", ") + " in Italia" : "";
  return { out, why };
}
const srcLabel = v => { if (!v) return null; if (SRC[v]) return { e: SRC[v][0], l: SRC[v][1] }; const id = +(v.match(/^p(\d+)$/) || [])[1], p = (PROV || []).find(x => x.provider_id === id); return p ? { img: p.logo_path, l: cleanName(p.provider_name) } : null; };
rate = function (it, onCancel) {
  const t = S.titles[it.key] || {}, dd = t.diary || {};
  RT = { it, s: t.stars || 0, d: today(), onCancel, tags: (t.why || []).slice(), was: !!t.watched, rw: false, e: dd.e || "", src: dd.s || "", w: dd.w || "", c: dd.c || "", opts: null };
  renderRate(); whereOpts(it).then(o => { if (RT && RT.it === it) { RT.opts = o; if (!RT.src) { const mine = o.out.filter(x => x.mine), cin = o.out.find(x => x.v === "cinema"); if (mine.length === 1 && !cin) RT.src = mine[0].v; else if (cin && o.out.length === 2) RT.src = "cinema"; } renderRate(); } });
};
renderRate = function () {
  const e = $("#rate"); if (!RT) { e.innerHTML = ""; return; } const again = !!e.querySelector(".sheet.rv");
  const c0 = $("#rvc"), cv = c0 ? c0.value : RT.c; RT.c = cv; const sc = $("#rate .rv") ? $("#rate .rv").scrollTop : 0;
  const lab = ["Tocca una stella", "Non mi è piaciuto", "Così così", "Bello", "Molto bello", "Capolavoro"][Math.ceil(RT.s)];
  const o = RT.opts, chip = x => `<button class="wch ${RT.src === x.v ? "on" : ""}" onclick="rvSrc('${x.v}')">${x.img ? `<img src="${IMG}w45${x.img}" alt="" width="22" height="22">` : `<span class="wce">${x.e}</span>`}${esc(x.l)}</button>`;
  e.innerHTML = `<div class="ov${again ? " still" : ""}" onclick="rateCancel()"><div class="sheet rv${again ? " still" : ""}" role="dialog" aria-label="Com’era?" onclick="event.stopPropagation()"><div class="grab"></div><button class="xcl" aria-label="Chiudi" onclick="rateCancel()">${ic("x", 18)}</button>
<h3 class="rvh">Com’era <i>${esc(RT.it.title)}</i>?</h3>
<div class="bigst">${[1, 2, 3, 4, 5].map(n => `<span class="${RT.s >= n ? "on" : RT.s >= n - .5 ? "hf" : ""}" onclick="rateSet(${n})" role="button" aria-label="${n} stelle">★</span>`).join("")}</div>
<p class="rtl">${RT.s ? String(RT.s).replace(".", ",") + " · " : ""}${lab}</p>${RT.s ? "" : `<p class="mu small rth">Tocca due volte la stessa stella per mezzo punto</p>`}
${rtTags(RT.s).length ? `<p class="rvq">${RT.s >= 3.5 ? "Cosa ti è piaciuto?" : "Cosa non ti è piaciuto?"} <small>facoltativo</small></p><div class="row rtg">${rtTags(RT.s).map(([k, l]) => `<button class="chip ${RT.tags.includes(k) ? "on" : ""}" onclick="rateTag('${k}')">${l}</button>`).join("")}</div>` : ""}
<p class="rvq">Come ti ha fatto sentire?</p><div class="emos">${EMO.map(([k, em, l]) => `<button class="emo ${RT.e === k ? "on" : ""}" onclick="rvEmo('${k}')"><i>${em}</i>${l}</button>`).join("")}</div>
<p class="rvq">Dove l’hai visto?</p><div class="wrow">${o ? o.out.map(chip).join("") : `<span class="mu small">Cerco dove era disponibile…</span>`}</div>${o && o.why ? `<p class="mu small rvw">${esc(o.why)}</p>` : ""}
<p class="rvq">Con chi? <small>facoltativo</small></p><div class="wrow">${WITH.map(([l, em]) => `<button class="chip ${RT.w === l ? "on" : ""}" onclick="rvWith('${l}')">${em} ${l}</button>`).join("")}</div>
<p class="rvq">Due righe? <small>facoltativo · solo tue e nella storia</small></p><textarea id="rvc" maxlength="280" rows="2" placeholder="Cosa ti è rimasto?">${esc(cv || "")}</textarea>
${RT.was ? `<label class="rwc"><input type="checkbox" ${RT.rw ? "checked" : ""} onchange="RT.rw=this.checked"> L’ho rivisto</label>` : ""}
<div class="row rvb"><button class="btn grow" onclick="rateSave()">${RT.was ? "Salva" : "Segna come visto"}</button><button class="btn hot grow" onclick="rateSave(1)">${ic("share", 16)} Salva e crea la storia</button></div></div></div>`;
  const nb = $("#rate .rv"); if (nb) nb.scrollTop = sc;
};
function rvEmo(k) { RT.e = RT.e === k ? "" : k; renderRate(); vib(5); }
function rvSrc(v) { RT.src = RT.src === v ? "" : v; renderRate(); vib(5); }
function rvWith(l) { RT.w = RT.w === l ? "" : l; renderRate(); }
rateSave = async function (story) {
  const c = $("#rvc"); if (c) RT.c = c.value; const r = RT; RT = null; renderRate(); const before = snapT(r.it.key);
  const t = S.titles[r.it.key] || {}; let rt = t.runtime, eps = null;
  try {
    const d = await full(r.it);
    if (r.it.media === "tv") {
      const m = tvMeta(d), ne = d.next_episode_to_air; eps = Object.assign({}, t.eps || {}, { _n: m.n, _m: m.m, _t: Date.now() });
      for (const s of seasonsOf(d)) { let last = s.episode_count; if (ne && ne.air_date && ne.air_date > today()) { if (s.season_number > ne.season_number) continue; if (s.season_number === ne.season_number) last = Math.max(0, ne.episode_number - 1); } for (let e = 1; e <= last; e++) eps[s.season_number + "-" + e] = true; }
      if (!rt) rt = m.n * m.m;
    } else if (!rt) rt = d.runtime || 0;
  } catch (e) { if (!rt) rt = 0; }
  const dy = Object.assign({}, t.diary || {}), em = EMO.find(x => x[0] === r.e);
  const setK = (k, v) => { if (v) dy[k] = v; else delete dy[k]; };
  setK("e", r.e); setK("m", em ? em[1] : (dy.e && !r.e ? "" : dy.m)); setK("s", r.src); setK("c", String(r.c || "").trim().slice(0, 280));
  if (r.w) dy.w = r.w; else if (WITH.some(x => x[0] === dy.w)) delete dy.w;
  if (r.src === "cinema") dy.p = "cinema"; else if (dy.p === "cinema") delete dy.p;
  const p = { watched: true, stars: r.s, watched_on: r.was && t.watched_on ? t.watched_on : today(), runtime: rt || 0, watchlist: false, why: r.tags.slice(), diary: Object.keys(dy).length ? dy : null }; if (eps) p.eps = eps; delete NEXT[r.it.key];
  await put(r.it, p); toast(r.was ? "Voto aggiornato" : "Segnato come visto", () => restoreT(r.it.key, before)); vib(12);
  if (typeof rxRated === "function") rxRated(r.it.key, r.s, r.rw);
  afterChange(r.it.key);
  if (story) storyOpen(r.it.key);
};
/* il diario mostra emozione, dove e commento in cima */
(function () { const d0 = dRender; dRender = async function (k) { await d0.apply(this, arguments); const box = $("#diaryx"); if (!box || box.dataset.k !== k) return; const t = S.titles[k] || {}; if (!t.watched) return; const d = t.diary || {}, em = EMO.find(x => x[0] === d.e), sl = srcLabel(d.s);
  const bits = [em ? em[1] + " " + em[2] : "", sl ? (sl.e ? sl.e + " " : "") + (d.s === "cinema" ? "Al cinema" : d.s === "pirata" ? "Pirata" : "Su " + sl.l) : ""].filter(Boolean);
  const h = `<div class="dsum">${bits.length ? `<div class="dsb">${bits.map(b => `<span class="chip">${esc(b)}</span>`).join("")}</div>` : ""}${d.c ? `<p class="dsc">“${esc(d.c)}”</p>` : ""}<div class="row"><button class="btn sm" onclick="rate(byKey('${k}'))">${ic("edit", 14)} Modifica</button><button class="btn sm hot" onclick="storyOpen('${k}')">${ic("share", 14)} Crea la storia</button></div></div>`;
  const hh = box.querySelector("h3"); if (hh) hh.insertAdjacentHTML("afterend", h); }; })();

/* ================= Storia da pubblicare (formato 9:16) ================= */
const SPAL = [["Viola", "#6366F1", "#1b0b3a", 0], ["Tramonto", "#FF7A00", "#3a0b1b", 0], ["Menta", "#10B981", "#062a26", 0], ["Chiaro", "#e9eaf2", "#ffffff", 1]];
let STY = { k: "", p: 0 };
async function storyMake(k, pi) {
  const t = S.titles[k] || {}, it = byKey(k) || rowItem(t), d = t.diary || {}, pal = SPAL[pi] || SPAL[0], light = pal[3];
  const W = 1080, H = 1920, F = '"Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', fg = light ? "#0b0c12" : "#ffffff", mu = light ? "rgba(11,12,18,.62)" : "rgba(255,255,255,.78)";
  const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  if (light) { x.fillStyle = "#f6f6fa"; x.fillRect(0, 0, W, H); } else { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[2]); g.addColorStop(1, "#07080c"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  [[pal[1], 200, 260, 760], [light ? "#c7c9ff" : "#FF2E63", 950, 1500, 700]].forEach(([col, cx, cy, r]) => { const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, col + (light ? "55" : "99")); rg.addColorStop(1, col + "00"); x.fillStyle = rg; x.fillRect(0, 0, W, H); });
  const im = it.poster ? await loadImg(IMG + "w500" + it.poster) : null, pw = 560, ph = 840, px = (W - pw) / 2, py = 250;
  x.save(); x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = 70; x.shadowOffsetY = 30; x.fillStyle = "#222"; x.beginPath(); x.roundRect ? x.roundRect(px, py, pw, ph, 36) : x.rect(px, py, pw, ph); x.fill(); x.restore();
  x.save(); x.beginPath(); x.roundRect ? x.roundRect(px, py, pw, ph, 36) : x.rect(px, py, pw, ph); x.clip(); if (im) x.drawImage(im, px, py, pw, ph); x.restore();
  // dove l'hai visto (non per "Pirata")
  const sl = d.s && d.s !== "pirata" ? srcLabel(d.s) : null;
  if (sl) { const txt = d.s === "cinema" ? "🎬  Visto al cinema" : d.s === "noleggio" ? "Visto a noleggio" : d.s === "altro" ? "Visto" : "Visto su " + sl.l; x.font = `800 38px ${F}`; const tw = x.measureText(txt).width + 56; x.fillStyle = light ? "rgba(11,12,18,.08)" : "rgba(0,0,0,.4)"; x.beginPath(); x.roundRect ? x.roundRect((W - tw) / 2, 130, tw, 72, 36) : x.rect((W - tw) / 2, 130, tw, 72); x.fill(); x.fillStyle = fg; x.textAlign = "center"; x.fillText(txt, W / 2, 180); }
  x.textAlign = "center"; x.fillStyle = fg;
  const wrap = (txt, y, font, lh, max, lines) => { x.font = font; const ws = txt.split(/\s+/); let l = "", n = 0, yy = y; for (let i = 0; i < ws.length; i++) { const tt = l ? l + " " + ws[i] : ws[i]; if (x.measureText(tt).width > max && l) { if (++n >= lines) { x.fillText(l + "…", W / 2, yy); return yy; } x.fillText(l, W / 2, yy); l = ws[i]; yy += lh; } else l = tt; } if (l) x.fillText(l, W / 2, yy); return yy; };
  let y = wrap(it.title || t.title || "", py + ph + 130, `900 84px ${F}`, 92, 900, 2);
  x.font = `500 38px ${F}`; x.fillStyle = mu; x.fillText([it.year || t.year, it.media === "tv" ? "Serie TV" : "Film"].filter(Boolean).join(" · "), W / 2, y + 62);
  if (t.stars) { x.font = `900 96px ${F}`; x.fillStyle = "#f5b301"; x.fillText("★".repeat(Math.floor(t.stars)) + (t.stars % 1 ? "½" : ""), W / 2, y + 180); y += 180; } else y += 80;
  const em = EMO.find(z => z[0] === d.e); if (em) { x.font = `800 50px ${F}`; x.fillStyle = fg; x.fillText(em[1] + "  " + em[2], W / 2, y + 90); y += 90; }
  if (d.c) { x.fillStyle = fg; y = wrap("“" + d.c + "”", y + 100, `italic 600 46px ${F}`, 60, 880, 4); }
  const nm = (P().name || "").split(" ")[0]; x.font = `800 38px ${F}`; x.fillStyle = mu; x.fillText((nm ? nm + " su " : "") + APP, W / 2, H - 90);
  const lg = x.createLinearGradient(0, 0, 60, 60); lg.addColorStop(0, "#6366F1"); lg.addColorStop(.55, "#FF2E63"); lg.addColorStop(1, "#F59E0B"); x.fillStyle = lg; x.beginPath(); x.roundRect ? x.roundRect(W / 2 - 30, H - 210, 60, 60, 16) : x.rect(W / 2 - 30, H - 210, 60, 60); x.fill();
  return c;
}
async function storyOpen(k) {
  STY = { k, p: STY.k === k ? STY.p : 0 }; const t = S.titles[k]; if (!t || !t.watched) return toast("Segna prima il titolo come visto");
  let e = $("#stv"); if (!e) { e = document.createElement("div"); e.id = "stv"; document.body.appendChild(e); }
  e.innerHTML = `<div class="ov c" onclick="storiesClose()"><div class="stw st1" onclick="event.stopPropagation()"><div class="sts1"><p class="mu">Preparo la storia…</p></div><div class="styl">${SPAL.map((p, i) => `<button aria-label="Sfondo ${p[0]}" class="${i === STY.p ? "on" : ""}" style="background:linear-gradient(135deg,${p[1]},${p[2]})" onclick="storyPal(${i})"></button>`).join("")}</div><div class="row"><button class="btn hot grow" onclick="storiesShare()">${ic("share", 16)} Condividi</button><button class="btn" onclick="storiesSave()">${ic("download", 16)} Salva</button><button class="btn" onclick="storiesClose()">Chiudi</button></div><p class="mu small">“Condividi” apre Instagram, WhatsApp e le altre app del telefono.</p></div></div>`;
  await storyDraw();
}
async function storyPal(i) { STY.p = i; document.querySelectorAll("#stv .styl button").forEach((b, j) => b.classList.toggle("on", j === i)); await storyDraw(); }
async function storyDraw() {
  const c = await storyMake(STY.k, STY.p), b = await new Promise(ok => c.toBlob(ok, "image/png")), box = $("#stv .sts1"); if (!box) return;
  const t = S.titles[STY.k] || {}; window.__stories = [new File([b], `${APP.toLowerCase()}-${String(t.title || "storia").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.png`, { type: "image/png" })];
  const old = box.querySelector("img"); if (old) URL.revokeObjectURL(old.src); box.innerHTML = `<img src="${URL.createObjectURL(b)}" alt="Anteprima della storia">`;
}

/* ================= Amici consigliati ================= */
const sgx = () => lsGet("cm_sgx", []);
async function frSuggest() {
  if (!xUser()) return [];
  try { const r = await sb.rpc("friend_suggest"); if (r.error) return []; const no = sgx(); return (r.data || []).filter(s => !no.includes(s.user_id)); } catch (e) { return []; }
}
function sgWhy(s) { const a = []; if (s.mutual) a.push(s.mutual === 1 && s.via ? "Amico di " + s.via : s.mutual + " amici in comune"); if (s.sim) a.push((a.length ? "gusti simili " : "Gusti simili: ") + s.sim + "%"); return a.join(" · ") || "Usa " + APP; }
async function frSuggestHtml() {
  const L = (await frSuggest()).slice(0, 3); if (!L.length) return "";
  return `<h3 class="h">Potresti conoscere</h3><div class="sgr">${L.map(s => `<div class="sgc" id="sg-${esc(s.user_id)}"><button class="sgx" aria-label="Nascondi" onclick="sgHide('${esc(s.user_id)}')">${ic("x", 14)}</button>${avatarHtml(s.avatar || 0, 58)}<b>${esc(s.name || s.username)}</b><small>@${esc(s.username)}</small><span>${esc(sgWhy(s))}</span><button class="btn pri sm" onclick="frReqUser('${esc(s.user_id)}',this)">${ic("plus", 14)} Aggiungi</button></div>`).join("")}</div>`;
}
function sgHide(id) { const l = sgx(); if (!l.includes(id)) l.push(id); lsSet("cm_sgx", l.slice(-100)); const e = document.getElementById("sg-" + id); if (e) e.remove(); }
(function () { const f0 = tgFriends; tgFriends = async function () { const [h, sg] = await Promise.all([f0.apply(this, arguments), frSuggestHtml().catch(() => "")]); return sg ? h.replace('<h3 class="h">Aggiungi un amico</h3>', sg + '<h3 class="h">Aggiungi un amico</h3>') : h; }; })();

/* ================= Menu come su iPhone: tieni premuto e scorri ================= */
// mentre scorri la voce sotto il dito si ingrandisce e mostra il nome; la pagina cambia solo quando alzi il dito
(function () {
  // le voci hanno posti fissi: quella sotto il dito si allarga (G volte) e mostra il nome.
  // La scelta si calcola sulle posizioni "a riposo", con un margine: a metà strada tra due voci resta quella di prima.
  const G = 2.3;
  let st = null, hov = -1, hold = 0, sup = 0;
  const nav = () => $("#nav"), mob = () => matchMedia("(max-width:899px)").matches;
  const btns = () => [...nav().querySelectorAll("button[data-k]")].filter(b => b.offsetParent);
  const pick = x => { const r = st.box, n = st.n, w = r.width / n, i = Math.max(0, Math.min(n - 1, Math.floor((x - r.left) / w)));
    if (hov < 0) return i; if (i === hov) return hov; const c = r.left + (i + .5) * w; return Math.abs(x - c) < w * .32 ? i : hov; };
  const setHov = i => { if (i === hov) return; const bs = btns(); if (bs[hov]) bs[hov].classList.remove("hov"); hov = i; if (bs[i]) { bs[i].classList.add("hov"); try { if (navigator.vibrate) navigator.vibrate(4); } catch (e) {} } };
  const start = () => { if (!st || st.on) return; const n = nav(); st.on = true; const r = n.getBoundingClientRect(), cs = getComputedStyle(n), pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
    st.box = { left: r.left + pl, width: r.width - pl - pr }; st.n = btns().length; n.classList.add("scrub"); setHov(pick(st.x)); };
  const stop = go2 => { clearTimeout(hold); const was = st && st.on, b = btns()[hov]; st = null; const n = nav(); if (n) n.classList.remove("scrub"); btns().forEach(x => x.classList.remove("hov")); hov = -1;
    if (was) { sup = Date.now(); if (go2 && b && !b.classList.contains("on")) { const k = b.dataset.k; if (k === "disc") goDisc(); else go(k); } } };
  document.addEventListener("pointerdown", e => { const n = e.target.closest && e.target.closest("#nav.cap"); if (!n || !mob() || e.pointerType === "mouse") return; st = { x: e.clientX, x0: e.clientX, id: e.pointerId, on: false }; clearTimeout(hold); hold = setTimeout(start, 220); }, { passive: true });
  document.addEventListener("pointermove", e => { if (!st || e.pointerId !== st.id) return; st.x = e.clientX; if (!st.on && Math.abs(e.clientX - st.x0) > 12) start(); if (st.on) setHov(pick(e.clientX)); }, { passive: true });
  document.addEventListener("pointerup", e => { if (st && e.pointerId === st.id) stop(true); });
  document.addEventListener("pointercancel", e => { if (st && e.pointerId === st.id) stop(false); });
  document.addEventListener("click", e => { if (Date.now() - sup < 450 && e.target.closest && e.target.closest("#nav")) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener("contextmenu", e => { if (e.target.closest && e.target.closest("#nav.cap")) e.preventDefault(); });
})();
/* niente zoom con due dita né doppio tocco */
["gesturestart", "gesturechange", "gestureend"].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
document.addEventListener("touchmove", e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });

/* il via all'app lo dà v3.js */
