/* Tonightly · funzioni in più: installazione diretta, scorciatoie, affinità con gli amici, "Il tuo anno"
   in storie, calendario degli abbonamenti, diario di visione, liste automatiche, ricerca per trama,
   suggerimento della sera. Si carica dopo extra.js. */

/* ================= Installazione con un tocco ================= */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
addEventListener("appinstalled", () => { DEF = null; lsSet("cm_inst_x", 1); toast("App installata: la trovi tra le tue app"); if (view === "set" || view === "home") render(); });
installNow = async function () {
  if (isStandalone() || await instAlready()) return toast("L’app è già installata: aprila dalla schermata Home o dall’elenco delle app");
  if (DEF) { const d = DEF; DEF = null; try { d.prompt(); const c = await d.userChoice; if (c && c.outcome === "accepted") { lsSet("cm_inst_x", 1); toast("Installazione avviata"); } } catch (e) { instHelp(); } render(); return; }
  instHelp();
};
/* già installata? (Chrome su Android/PC lo sa grazie a "related_applications" nel manifest) */
async function instAlready() { try { if (navigator.getInstalledRelatedApps) { const l = await navigator.getInstalledRelatedApps(); return l.length > 0; } } catch (e) {} return false; }
/* il browser prepara l'installazione qualche secondo dopo l'apertura: appena è pronta, il pulsante installa con un tocco */
addEventListener("beforeinstallprompt", () => { setTimeout(() => { const g = $("#instGo"); if (g) g.outerHTML = instGoBtn(); if (view === "set") render(); }, 0); });
const instGoBtn = () => `<button class="btn pri grow" id="instNow" onclick="$('#amenu').innerHTML='';installNow()">${ic("download", 18)} Installa ora</button>`;
/* quando il browser non permette l'installazione con un tocco (iPhone, Firefox…) mostro solo il gesto da fare */
function instHelp() {
  const ios = isIOS(), and = /android/i.test(navigator.userAgent), share = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  const steps = ios ? [[share, "Tocca <b>Condividi</b> in basso in Safari"], [ic("plus", 22), "Scegli <b>Aggiungi alla schermata Home</b>"]] : and ? [["⋮", "Apri il menu <b>⋮</b> di Chrome in alto a destra"], [ic("download", 22), "Tocca <b>Installa app</b>"]] : [[ic("download", 22), "Clicca l’icona di installazione nella barra dell’indirizzo"], ["⋮", "Oppure menu del browser › <b>Installa " + esc(APP) + "</b>"]];
  const can = !ios && /chrome|chromium|edg|samsungbrowser/i.test(navigator.userAgent) && !/firefox|fxios|opr\//i.test(navigator.userAgent);
  amenuHtml(`<div class="insth">${logoMark(54)}<h3 class="h">Installa ${esc(APP)}</h3>${can ? `<div class="row" id="instGo"><p class="mu small">Preparo l’installazione con un tocco… se il tasto non compare tra qualche secondo, usa i due gesti qui sotto.</p></div>` : ""}<p class="mu">${ios ? "Su iPhone e iPad Apple non permette l’installazione con un tocco: bastano due gesti." : "Il tuo browser non permette l’installazione con un tocco: bastano due gesti."}</p>${steps.map(([i, t], n) => `<div class="instst"><span class="n">${n + 1}</span><span class="i">${i}</span><span>${t}</span></div>`).join("")}${ios && !/safari/i.test(navigator.userAgent.replace(/crios|fxios/i, "x")) ? `<p class="mu small">Serve <b>Safari</b>: se sei in un altro browser, apri questa pagina in Safari.</p>` : ""}</div>`);
}
function amenuHtml(html) {
  const e = $("#amenu"); if (!e) return;
  e.innerHTML = `<div class="ov" onclick="this.parentNode.innerHTML=''"><div class="sheet am" onclick="event.stopPropagation()"><div class="grab"></div><div class="pad">${html}<div class="row"><button class="btn grow" onclick="$('#amenu').innerHTML=''">Chiudi</button></div></div></div></div>`;
}
instBanner = function () {
  if (isStandalone() || lsGet("cm_inst_x", 0)) return "";
  return `<div class="inst"><span>${ic("download", 20)}</span><div><b>Installa ${esc(APP)}</b><div class="mu small">Si apre a schermo intero, con la sua icona.</div></div><button class="btn pri sm" onclick="installNow()">Installa</button><button class="link" aria-label="Chiudi" onclick="lsSet('cm_inst_x',1);this.parentNode.remove()">${ic("x", 16)}</button></div>`;
};
installBox = function () {
  if (isStandalone()) return `<h2 class="h">App</h2><p class="mu">Stai usando ${esc(APP)} come app installata.</p>`;
  return `<h2 class="h">Installa l’app</h2><button class="btn pri" onclick="installNow()">${ic("download", 18)} Scarica ${esc(APP)}</button>`;
};
/* tasto fisso in cima alle impostazioni */
const instCard = () => isStandalone() ? `<div class="instc ok">${ic("check", 20)}<span><b>App installata</b><small>Stai usando ${esc(APP)} come app</small></span></div>`
  : `<button class="instc" onclick="installNow()">${logoMark(38)}<span><b>Scarica l’app</b><small>Gratis, si installa in un tocco</small></span><span class="go">${ic("download", 20)}</span></button>`;
(function () { const v0 = vSet2; vSet2 = async function () { const h = await v0.apply(this, arguments); return h.replace('<nav class="setm" aria-label="Impostazioni">', '<nav class="setm" aria-label="Impostazioni">' + instCard()); }; })();

/* ================= Scorciatoie (tieni premuta l'icona) e link ?go= ================= */
function xGo(g) {
  if (g === "tonight") go("tonight"); else if (g === "list") { trkTab = "watch"; go("list"); } else if (g === "search") { go("home"); setTimeout(() => { openSearch(); const q = $("#q"); if (q) q.focus(); }, 300); }
  else if (g === "friends") { TG.tab = "friends"; go("together"); } else if (g === "soon") go("soon"); else if (g === "sera") seraShow(); else if (g === "diary") go("diary");
}

/* ================= Affinità con gli amici ================= */
const XC = { t: 0, list: [] };
async function xCompat(force) {
  if (!xUser()) return []; if (!force && Date.now() - XC.t < 60000) return XC.list;
  try { const r = await sb.rpc("friend_compat"); XC.list = r.error ? [] : (r.data || []); } catch (e) { XC.list = []; } XC.t = Date.now(); return XC.list;
}
const cmpLabel = s => s >= 85 ? "Anime gemelle" : s >= 70 ? "Gusti molto simili" : s >= 55 ? "Abbastanza simili" : s >= 40 ? "Gusti diversi" : "Opposti: perfetti per scoprire cose nuove";
const cmpChip = c => c && c.score != null && c.common >= 2 ? `<button class="cmpb ${c.score >= 70 ? "hi" : ""}" onclick="event.stopPropagation();frCompat('${esc(c.user_id)}')" aria-label="Affinità ${c.score}%">${c.score}%</button>` : c ? `<button class="cmpb lo" onclick="event.stopPropagation();frCompat('${esc(c.user_id)}')">?</button>` : "";
const mItems = a => (Array.isArray(a) ? a : []).filter(x => x && KEYRE.test(x.k || "")).map(x => { const [m, id] = x.k.split(":"), it = ITEMS[x.k] || { key: x.k, media: m, id: +id, title: String(x.t || "").slice(0, 200), year: "", poster: POSTRE.test(x.p || "") ? x.p : null, genre_ids: [] }; ITEMS[x.k] = it; return Object.assign({}, it, { _a: x.a, _b: x.b }); });
async function frCompat(uid) {
  const c = (await xCompat()).find(x => x.user_id === uid); if (!c) return toast("Per vedere l’affinità il tuo amico deve condividere cosa guarda");
  const nm = esc(c.name || (c.username ? "@" + c.username : "il tuo amico")), loves = mItems(c.loves), fights = mItems(c.fights), forMe = mItems(c.for_me);
  const pc = c.score != null && c.common >= 2;
  amenuHtml(`<div class="cmph"><div class="cmpr" style="--p:${pc ? c.score : 0}"><b>${pc ? c.score + "%" : "?"}</b></div><div><h3 class="h">Tu e ${nm}</h3><p class="mu">${pc ? cmpLabel(c.score) + " · " + c.common + " titoli votati da entrambi" : "Avete ancora pochi titoli votati in comune: votatene qualcuno e l’affinità comparirà."}</p></div></div>
${loves.length ? `<h4 class="h">Amati da tutti e due</h4>${rail(loves)}` : ""}
${fights.length ? `<h4 class="h">Su questi non siete d’accordo</h4><div class="cmpf">${fights.map(f => `<div class="cost" onclick="$('#amenu').innerHTML='';openSheet('${f.key}')"><b>${esc(f.title)}</b><span class="mu small">tu ${stTxt(f._a)} · ${nm} ${stTxt(f._b)}</span></div>`).join("")}</div>` : ""}
${forMe.length ? `<h4 class="h">${nm} li ha amati, tu non li hai visti</h4>${rail(forMe)}` : ""}
<div class="row"><button class="btn pri grow" onclick="$('#amenu').innerHTML='';tgInvite('${esc(uid)}')">${ic("moon", 16)} Serata insieme</button></div>`);
  fillProv && fillProv();
}
/* la serata in due parte dai titoli che piacciono a tutti e due */
(function () {
  const ti = tgInvite; tgInvite = async function (uid, forRoom) {
    if (!forRoom) { try { const c = (await xCompat()).find(x => x.user_id === uid); if (c) RX.duoSeed = mItems(c.for_me).slice(0, 6); } catch (e) {} }
    return ti.apply(this, arguments);
  };
  const mw = myWl; myWl = function (n) { const a = mw.apply(this, arguments), s = RX.duoSeed || []; RX.duoSeed = null; if (!s.length) return a; const seen = new Set(a.map(i => i.key)); return a.slice(0, Math.ceil(n / 2)).concat(s.filter(i => !seen.has(i.key))).slice(0, n); };
})();

/* ================= "Il tuo anno" in storie da condividere ================= */
function yearData() {
  const y = String(new Date().getFullYear()), ws = Object.values(S.titles).filter(t => t.watched && (t.watched_on || "").startsWith(y));
  if (ws.length < 3) return null;
  const gc = {}; ws.forEach(t => (t.genre_ids || []).slice(0, 2).forEach(g => { gc[g] = (gc[g] || 0) + 1; }));
  const gt = Object.entries(gc).filter(([g]) => GN[g]).sort((a, b) => b[1] - a[1]).slice(0, 3), gtot = gt.reduce((a, x) => a + x[1], 0);
  const five = ws.filter(t => t.stars >= 4.5 && t.poster).sort((a, b) => b.stars - a.stars).slice(0, 4);
  let binge = null; for (const k in LX.bg) { const t = S.titles[k], v = LX.bg[k]; if (t && (!binge || v[2] > binge.n)) binge = { t: t.title, n: v[2] }; }
  if (!binge) { const tv = Object.values(S.titles).filter(t => t.media === "tv").sort((a, b) => epCount(b) - epCount(a))[0]; if (tv && epCount(tv) > 3) binge = { t: tv.title, n: epCount(tv), tot: true }; }
  const bf = (XC.list || []).filter(c => c.score != null && c.common >= 3).sort((a, b) => b.score - a.score)[0];
  return { y, n: ws.length, films: ws.filter(t => t.media === "movie").length, tv: ws.filter(t => t.media === "tv").length, h: ws.reduce((a, t) => a + minsOf(t), 0) / 60, gt: gt.map(([g, n]) => [GN[g], Math.round(n / gtot * 100)]), five, binge, bf, name: (P().name || "").split(" ")[0], partial: new Date().getMonth() < 11 };
}
const loadImg = src => new Promise(ok => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
async function storySlides(d) {
  const W = 1080, H = 1920, F = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', acc = getComputedStyle(document.documentElement).getPropertyValue("--pri").trim() || "#6366F1";
  const pal = [[acc, "#FF2E63"], ["#FF2E63", "#F59E0B"], ["#10B981", acc], ["#F59E0B", "#FF2E63"], [acc, "#10B981"], ["#FF2E63", acc]];
  const mk = (i, draw) => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#06070a"); g.addColorStop(1, "#11131c"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    [[pal[i][0], 220, 340, 640], [pal[i][1], 900, 1500, 720]].forEach(([col, cx, cy, r]) => { const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, col + "AA"); rg.addColorStop(1, col + "00"); x.fillStyle = rg; x.fillRect(0, 0, W, H); });
    x.fillStyle = "rgba(255,255,255,.75)"; x.font = `700 40px ${F}`; x.textAlign = "left"; x.fillText(APP, 80, 130); x.font = `500 34px ${F}`; x.fillStyle = "rgba(255,255,255,.5)"; x.fillText("Il mio " + d.y + (d.partial ? " finora" : ""), 80, 180);
    x.fillStyle = "#fff"; draw(x); return c; };
  const big = (x, t, y, s, col) => { x.font = `900 ${s}px ${F}`; x.fillStyle = col || "#fff"; x.fillText(t, 80, y); };
  const wrap = (x, t, y, s, w, lh) => { x.font = `800 ${s}px ${F}`; const ws = t.split(" "); let l = "", yy = y; ws.forEach(word => { const tt = l ? l + " " + word : word; if (x.measureText(tt).width > w && l) { x.fillText(l, 80, yy); l = word; yy += lh; } else l = tt; }); if (l) x.fillText(l, 80, yy); return yy; };
  const out = [];
  out.push(mk(0, x => { big(x, "Il mio", 700, 130); big(x, d.y, 950, 240, "#fff"); x.font = `600 52px ${F}`; x.fillStyle = "rgba(255,255,255,.8)"; x.fillText("Ecco cosa ho guardato", 80, 1070); x.fillText(d.partial ? "finora quest’anno" : "quest’anno", 80, 1140); }));
  out.push(mk(1, x => { big(x, String(d.n), 760, 300); x.font = `700 64px ${F}`; x.fillText("titoli visti", 80, 860); big(x, Math.round(d.h) + " ore", 1140, 170); x.font = `600 52px ${F}`; x.fillStyle = "rgba(255,255,255,.75)"; x.fillText(`${d.films} film · ${d.tv} serie`, 80, 1240); const gd = Math.round(d.h / 24); if (gd >= 1) x.fillText(`circa ${gd} ${gd === 1 ? "giorno intero" : "giorni interi"} davanti allo schermo`, 80, 1310); }));
  if (d.gt.length) out.push(mk(2, x => { x.font = `700 60px ${F}`; x.fillText("I miei generi", 80, 560); d.gt.forEach(([g, p], i) => { const y = 720 + i * 260; x.font = `800 ${i ? 70 : 96}px ${F}`; x.fillText((i + 1) + ". " + g, 80, y); x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(80, y + 40, 920, 26); x.fillStyle = i ? "rgba(255,255,255,.75)" : "#fff"; x.fillRect(80, y + 40, 920 * p / 100, 26); x.font = `600 40px ${F}`; x.fillText(p + "%", 80, y + 120); x.fillStyle = "#fff"; }); }));
  if (d.five.length) { const imgs = await Promise.all(d.five.map(t => loadImg(IMG + "w342" + t.poster))); out.push(mk(3, x => { x.font = `700 60px ${F}`; x.fillText("I miei capolavori", 80, 420); const n = d.five.length, cols = n === 1 ? 1 : 2, pw = cols === 1 ? 560 : 430, ph = pw * 1.5; d.five.forEach((t, i) => { const cx = cols === 1 ? 260 : 80 + (i % 2) * (pw + 60), cy = 500 + Math.floor(i / 2) * (ph + 90); const im = imgs[i]; x.save(); x.beginPath(); x.roundRect ? x.roundRect(cx, cy, pw, ph, 28) : x.rect(cx, cy, pw, ph); x.clip(); if (im) x.drawImage(im, cx, cy, pw, ph); else { x.fillStyle = "#222"; x.fillRect(cx, cy, pw, ph); } x.restore(); x.fillStyle = "#fff"; x.font = `700 36px ${F}`; const tt = t.title.length > 22 ? t.title.slice(0, 21) + "…" : t.title; x.fillText(tt + "  " + "★".repeat(Math.floor(t.stars)), cx, cy + ph + 52); }); })); }
  if (d.binge || d.bf) out.push(mk(4, x => { let y = 640; if (d.binge) { x.font = `700 56px ${F}`; x.fillText(d.binge.tot ? "La serie che ho seguito di più" : "La serie che ho divorato", 80, y); y = wrap(x, d.binge.t, y + 140, 100, 920, 110); x.font = `600 50px ${F}`; x.fillStyle = "rgba(255,255,255,.8)"; x.fillText(d.binge.tot ? d.binge.n + " episodi visti" : d.binge.n + " episodi in un giorno", 80, y + 90); x.fillStyle = "#fff"; y += 330; } if (d.bf) { x.font = `700 56px ${F}`; x.fillText("Il mio gemello di gusti", 80, y); big(x, (d.bf.name || "@" + d.bf.username), y + 140, 96); x.font = `600 50px ${F}`; x.fillStyle = "rgba(255,255,255,.8)"; x.fillText(d.bf.score + "% di affinità", 80, y + 230); } }));
  out.push(mk(5, x => { big(x, "E tu cosa", 820, 110); big(x, "guardi stasera?", 950, 110); x.font = `600 50px ${F}`; x.fillStyle = "rgba(255,255,255,.8)"; x.fillText(location.host || APP, 80, 1100); }));
  return out;
}
async function storiesOpen() {
  if (xUser()) await xCompat().catch(() => []);
  const d = yearData(); if (!d) return toast("Segna almeno 3 titoli visti quest’anno per creare le storie");
  toast("Preparo le tue storie…");
  const cs = await storySlides(d), blobs = await Promise.all(cs.map(c => new Promise(ok => c.toBlob(ok, "image/png"))));
  const files = blobs.map((b, i) => new File([b], `${APP.toLowerCase()}-${d.y}-${i + 1}.png`, { type: "image/png" }));
  window.__stories = files; const urls = blobs.map(b => URL.createObjectURL(b));
  const e = document.createElement("div"); e.id = "stv"; e.innerHTML = `<div class="ov c" onclick="storiesClose()"><div class="stw" onclick="event.stopPropagation()"><div class="sts">${urls.map(u => `<img src="${u}" alt="">`).join("")}</div><p class="mu small">${urls.length} immagini in formato storia · scorri per vederle</p><div class="row"><button class="btn pri grow" onclick="storiesShare()">${ic("share", 16)} Condividi</button><button class="btn" onclick="storiesSave()">${ic("download", 16)} Salva</button><button class="btn" onclick="storiesClose()">Chiudi</button></div></div></div>`;
  document.body.appendChild(e);
}
function storiesClose() { const e = $("#stv"); if (e) { e.querySelectorAll("img").forEach(i => URL.revokeObjectURL(i.src)); e.remove(); } }
async function storiesShare() {
  const f = window.__stories || []; try { if (navigator.canShare && navigator.canShare({ files: f })) { await navigator.share({ files: f, title: "Il mio anno su " + APP }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  storiesSave(); toast("Il tuo browser non condivide immagini: le ho salvate");
}
function storiesSave() { (window.__stories || []).forEach((f, i) => setTimeout(() => { const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, i * 250)); }
recapHtml = function () {
  const r = recapData(); if (!r) return "";
  return `<div class="recap"><h3 class="h">Il tuo ${r.y}${new Date().getMonth() < 11 ? " finora" : ""}</h3><div class="stats"><div class="stat"><b>${r.n}</b><span class="mu">titoli visti</span></div><div class="stat"><b>${r.h.toFixed(0)} h</b><span class="mu">davanti allo schermo</span></div><div class="stat"><b>${esc(r.g || "–")}</b><span class="mu">genere preferito</span></div></div>
${r.fav.length ? `<p class="mu">I tuoi 5 stelle: ${r.fav.map(esc).join(", ")}</p>` : ""}<div class="row"><button class="btn pri sm" onclick="storiesOpen()">${ic("share", 15)} Crea le storie da condividere</button><button class="btn sm" onclick="shareRecap()">Condividi come testo</button></div></div>`;
};

/* ================= Calendario degli abbonamenti ================= */
async function planCal() {
  const d = await soonData().catch(() => ({ tv: [] })), now = new Date(), months = [];
  for (let i = 0; i < 4; i++) { const m = new Date(now.getFullYear(), now.getMonth() + i, 1); months.push({ key: m.getFullYear() + "-" + String(m.getMonth() + 1).padStart(2, "0"), name: m.toLocaleDateString("it-IT", { month: "long" }), rel: [] }); }
  const rels = d.tv.filter(r => months.some(m => r.date.startsWith(m.key))), pv = await Promise.all(rels.map(r => lightProvs(rowItem(r.t)).catch(() => [])));
  rels.forEach((r, i) => { const m = months.find(x => r.date.startsWith(x.key)), p = pv[i][0]; if (m && p) m.rel.push({ r, p }); });
  if (!rels.length) return "";
  const pr = P().prices || {};
  const rows = months.map((m, i) => {
    const by = {}; m.rel.forEach(x => { (by[x.p.provider_id] = by[x.p.provider_id] || { p: x.p, l: [] }).l.push(x.r); });
    const best = Object.values(by).sort((a, b) => b.l.length - a.l.length)[0];
    return `<div class="calm"><div class="calh"><b>${esc(m.name[0].toUpperCase() + m.name.slice(1))}</b>${best ? `<span class="calp"><img src="${IMG}w45${best.p.logo_path}" alt="" width="22" height="22">Tieni ${esc(best.p.provider_name)}${+pr[best.p.provider_id] ? " · " + eur(+pr[best.p.provider_id]) : ""}</span>` : `<span class="mu small">Nessuna uscita delle tue serie: buon mese per smaltire la lista</span>`}</div>
${Object.values(by).map(g => `<div class="mu small">${esc(g.p.provider_name)}: ${g.l.map(r => `<b>${esc(r.t.title)}</b> (${esc(soonLine(r).replace("Nuovo episodio ", "ep. "))}, ${esc(fmtD(r.date).replace(/ \d{4}$/, ""))})`).join(", ")}</div>`).join("")}</div>`;
  }).join("");
  return `<h2 class="h">${ic("calendar", 22)} Calendario dei prossimi mesi</h2><p class="mu">Le nuove stagioni ed episodi delle serie che segui, mese per mese, con il servizio da tenere.</p><div class="cal">${rows}</div>`;
}
(function () { const vp = vPlan; vPlan = async function () { const [h, c] = await Promise.all([vp.apply(this, arguments), planCal().catch(() => "")]); return c ? h.replace(/<\/div>\s*$/, c + "</div>") : h; }; })();

/* ================= Diario di visione ================= */
const DPL = [["casa", "A casa"], ["cinema", "Al cinema"], ["amici", "Da amici"], ["viaggio", "In viaggio"], ["altro", "Altrove"]];
const DMO = ["😍", "😂", "😭", "😱", "🤯", "😴"];
const dget = k => Object.assign({}, (S.titles[k] || {}).diary || {});
async function dSet(k, patch) { const it = byKey(k); if (!it) return; const d = Object.assign(dget(k), patch); Object.keys(d).forEach(x => { if (d[x] === "" || d[x] == null) delete d[x]; }); await put(it, { diary: Object.keys(d).length ? d : null }); dRender(k); }
const SURL = new Map();
async function dPhotoUrl(d) {
  if (d.ph && /^data:image\/jpeg;base64,/.test(d.ph)) return d.ph;
  if (!d.pp || !sb) return ""; if (SURL.has(d.pp)) return SURL.get(d.pp);
  try { const r = await sb.storage.from("diary").createSignedUrl(d.pp, 3600); const u = (r.data && (r.data.signedUrl || r.data.signedURL)) || ""; SURL.set(d.pp, u); return u; } catch (e) { return ""; }
}
async function dPhoto(k, inp) {
  const f = inp.files && inp.files[0]; inp.value = ""; if (!f || !/^image\//.test(f.type)) return;
  try {
    const url = URL.createObjectURL(f), im = new Image(); await new Promise((ok, ko) => { im.onload = ok; im.onerror = ko; im.src = url; });
    const mx = 900, sc = Math.min(1, mx / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    if (xUser()) {
      const b = await new Promise(ok => c.toBlob(ok, "image/jpeg", .8)), path = user.id + "/" + k.replace(":", "-") + "-" + Date.now() + ".jpg";
      const r = await sb.storage.from("diary").upload(path, b, { contentType: "image/jpeg" }); if (r.error) throw r.error;
      const old = dget(k).pp; if (old) sb.storage.from("diary").remove([old]).catch(() => {});
      await dSet(k, { pp: path, ph: null });
    } else {
      const sm = document.createElement("canvas"), s2 = Math.min(1, 420 / Math.max(c.width, c.height)); sm.width = Math.round(c.width * s2); sm.height = Math.round(c.height * s2); sm.getContext("2d").drawImage(c, 0, 0, sm.width, sm.height);
      await dSet(k, { ph: sm.toDataURL("image/jpeg", .75) });
    }
    toast("Foto aggiunta al diario");
  } catch (e) { toast("Non riesco a salvare la foto: hai eseguito l’aggiornamento SQL?"); }
}
async function dDelPhoto(k) { const d = dget(k); if (d.pp && sb) sb.storage.from("diary").remove([d.pp]).catch(() => {}); await dSet(k, { pp: null, ph: null }); }
async function dWith(k) { const v = (prompt("Con chi l’hai visto?", dget(k).w || "") || "").trim().slice(0, 100); await dSet(k, { w: v }); }
async function dRender(k) {
  const box = $("#diaryx"); if (!box || box.dataset.k !== k) return; const t = S.titles[k] || {};
  if (!t.watched) { box.innerHTML = ""; return; }
  const d = dget(k), fr = xUser() ? (await xFriends().catch(() => [])).slice(0, 6) : [], ph = await dPhotoUrl(d);
  box.innerHTML = `<h3 class="h">${ic("edit", 18)} Diario</h3><div class="diary">
<div class="mu small">${t.watched_on ? "Visto il " + esc(fmtD(t.watched_on)) : "Visto"}${t.stars ? " · " + stTxt(t.stars) : ""}</div>
<p class="mu small">Dove</p><div class="row dch">${DPL.map(([v, l]) => `<button class="chip ${d.p === v ? "on" : ""}" onclick="dSet('${k}',{p:'${d.p === v ? "" : v}'})">${l}</button>`).join("")}</div>
<p class="mu small">Con chi</p><div class="row dch">${fr.map(f => { const n = f.name || f.username || "Amico", on = (d.w || "").split(", ").includes(n); return `<button class="chip ${on ? "on" : ""}" onclick="dWithT('${k}','${esc(n).replace(/'/g, "")}')">${esc(n)}</button>`; }).join("")}<button class="chip" onclick="dWith('${k}')">${d.w ? esc(d.w) + " ✎" : "+ Scrivi"}</button></div>
<p class="mu small">Com’è stato</p><div class="row dch">${DMO.map(m => `<button class="chip em ${d.m === m ? "on" : ""}" onclick="dSet('${k}',{m:'${d.m === m ? "" : m}'})">${m}</button>`).join("")}</div>
${ph ? `<div class="dph"><img src="${esc(ph)}" alt="Foto della serata"><button class="btn sm" onclick="dDelPhoto('${k}')">${ic("trash", 14)} Togli foto</button></div>` : `<label class="btn sm">${ic("camera", 16)} Aggiungi una foto della serata<input type="file" accept="image/*" hidden onchange="dPhoto('${k}',this)"></label>`}
</div>`;
}
function dWithT(k, n) { const l = (dget(k).w || "").split(", ").filter(Boolean), i = l.indexOf(n); i < 0 ? l.push(n) : l.splice(i, 1); dSet(k, { w: l.join(", ").slice(0, 100) }); }
(function () { const xs = xSheet; xSheet = async function (k, d, it) { const r = xs.apply(this, arguments); const n = $("#notex"); if (n && !$("#diaryx")) { n.insertAdjacentHTML("beforebegin", `<div id="diaryx" data-k="${k}"></div>`); dRender(k); } return r; }; })();
let DF = "all";
var vDiary; /* definita più avanti */

/* ================= Liste automatiche ================= */
async function autoLists() {
  const all = Object.values(S.titles), wl = all.filter(t => t.watchlist && !t.watched), out = [];
  const rt = t => t.runtime || ((FEAT.get(t.tmdb_key) || {}).r) || 0;
  const av = await Promise.all(wl.slice(0, 40).map(t => lightProvs(rowItem(t)).then(f => f.some(p => isMine(p.provider_id))).catch(() => false)));
  out.push(["Pronti per stasera", "Nella tua lista e inclusi nei tuoi abbonamenti", wl.slice(0, 40).filter((t, i) => av[i]).map(rowItem)]);
  out.push(["Sotto i 100 minuti", "Film della tua lista per una serata corta", wl.filter(t => t.media === "movie" && rt(t) && rt(t) <= 100).map(rowItem)]);
  out.push(["Iniziate e mai finite", "Serie lasciate a metà da più di un mese", all.filter(t => t.media === "tv" && !t.watched && epCount(t) > 0 && (t.eps || {})._t && Date.now() - t.eps._t > 30 * 864e5).map(rowItem)]);
  out.push(["Comincia questa serie", "Serie della tua lista mai iniziate", wl.filter(t => t.media === "tv" && !epCount(t)).map(rowItem)]);
  if (xUser()) { const c = (await xCompat().catch(() => [])).filter(x => (x.for_me || []).length).sort((a, b) => (b.score || 0) - (a.score || 0))[0]; if (c) out.push(["Da vedere con " + (c.name || "@" + c.username), "Li ha amati e tu non li hai ancora visti", mItems(c.for_me)]); }
  try {
    const A = affData(), g = Object.entries(A.avg).filter(([x, v]) => v > .15 && GN[x]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => +x[0]);
    const q = { watch_region: R, with_watch_monetization_types: "flatrate", sort_by: "vote_average.desc", "vote_count.gte": 1500, "primary_release_date.lte": "1999-12-31" }; if (provF().length) q.with_watch_providers = provF().join("|"); else if (P().pirate) { delete q.watch_region; delete q.with_watch_monetization_types; } if (g.length) q.with_genres = g.join("|");
    const r = await tmdb("/discover/movie", q); out.push(["Classici che ti mancano", "Grandi film di prima del 2000, sui tuoi servizi", (r.results || []).map(x => norm(x, "movie")).filter(i => !(S.titles[i.key] && (S.titles[i.key].watched || S.titles[i.key].skipped)))]);
  } catch (e) {}
  return out.filter(l => l[2].length);
}
async function autoFill() {
  const box = $("#autoL"); if (!box) return; const L = await autoLists(); if (!$("#autoL")) return;
  window.__auto = L;
  box.innerHTML = L.length ? `<h3 class="h">${ic("star", 18)} Liste automatiche</h3><p class="mu small">Si aggiornano da sole.</p>${L.map((l, i) => `<details class="grp al"><summary><span class="alp">${l[2].slice(0, 3).map(it => it.poster ? `<img src="${IMG}w92${it.poster}" alt="">` : "").join("")}</span><span class="alt"><b>${esc(l[0])}</b><small class="mu">${esc(l[1])} · ${l[2].length}</small></span></summary><div class="gb">${rail(l[2].slice(0, 30))}</div></details>`).join("")}` : "";
  fillProv && fillProv();
}
(function () { const lh = listsHtml; listsHtml = function () { setTimeout(autoFill, 0); return `<div id="autoL"><p class="mu small">Preparo le liste automatiche…</p></div><h3 class="h">Le tue liste</h3>` + lh.apply(this, arguments); }; })();
/* il diario e le liste nel menu "Altro" della tua lista */
trkMore = function () { amenu("Altro", [["list", "Le mie liste (anche automatiche)", "trkGo('liste')"], ["edit", "Il mio diario", "go('diary')"], ["calendar", "In arrivo", "go('soon')"], ["dice", "Scegli per me stasera", "xRoulette()"]]); };

/* ================= Ricerca per trama ("il film dove…") ================= */
const PLOT = [
  [/stesso giorno|loop temporale|rivive|ripete .*giorn|giorno che si ripete/, "time loop", "giorno che si ripete"], [/viagg\w* nel tempo|indietro nel tempo|nel passato|macchina del tempo|nel futuro/, "time travel", "viaggi nel tempo"],
  [/zombi/, "zombie", "zombie"], [/vampir/, "vampire", "vampiri"], [/licantrop|lupi mannari|lupo mannaro/, "werewolf", "lupi mannari"], [/alien|extraterrestr|ufo\b/, "alien", "alieni"],
  [/rapina|colpo in banca|colpo grosso|furto/, "heist", "rapina"], [/serial killer|assassino seriale/, "serial killer", "serial killer"], [/mafia|mafios|gangster|camorra/, "mafia", "mafia"],
  [/squal/, "shark", "squali"], [/dinosaur/, "dinosaur", "dinosauri"], [/robot|intelligenza artificiale|androide|\bia\b/, "artificial intelligence", "intelligenza artificiale"],
  [/fine del mondo|apocalis/, "post-apocalyptic future", "fine del mondo"], [/isola deserta|naufrag/, "deserted island", "isola deserta"], [/scambi\w* (di |i )?corp|corpo di un altr/, "body swap", "scambio di corpi"],
  [/amnesia|perde la memoria|non ricorda/, "amnesia", "amnesia"], [/prigion|carcere|evasione/, "prison", "prigione"], [/pugil|boxe/, "boxing", "pugilato"], [/scacchi/, "chess", "scacchi"],
  [/calcio\b|calciator/, "soccer", "calcio"], [/cucina|chef|ristorante|cuoco/, "chef", "cucina"], [/road trip|viaggio in auto|on the road/, "road trip", "viaggio on the road"],
  [/natal|babbo natale/, "christmas", "Natale"], [/halloween/, "halloween", "Halloween"], [/strega|stregh/, "witch", "streghe"], [/fantasm|infestat/, "haunted house", "case infestate"],
  [/esorcis|possession|posseduta|indemoniat/, "exorcism", "esorcismi"], [/supereroi|supereroe|superpoteri/, "superhero", "supereroi"], [/spia|spionaggio|agente segreto/, "spy", "spionaggio"],
  [/seconda guerra|nazist|olocausto/, "world war ii", "seconda guerra mondiale"], [/vietnam/, "vietnam war", "Vietnam"], [/astronaut|nello spazio|navicella|spaziale/, "space travel", "spazio"],
  [/multivers|universi paralleli|realtà parallel|mondo parallelo/, "parallel world", "mondi paralleli"], [/nei sogni|dentro i sogni|sogno nel sogno/, "dream", "sogni"],
  [/realtà virtuale|videogioc/, "video game", "videogiochi"], [/liceo|adolescen|scuola superiore|teenager/, "high school", "liceo"], [/matrimonio|nozze|sposa/, "wedding", "matrimonio"],
  [/divorzi|separazione/, "divorce", "divorzio"], [/\bcane\b|\bcani\b/, "dog", "cani"], [/\bgatt[oi]\b/, "cat", "gatti"], [/cavall/, "horse", "cavalli"],
  [/tribunale|avvocat|processo/, "courtroom", "tribunale"], [/ospedale|medic[oi]\b|chirurg/, "hospital", "ospedale"], [/detective|investigat|poliziott/, "detective", "investigazione"],
  [/droga|narcotraffic|cartello/, "drug cartel", "narcotraffico"], [/hacker/, "hacker", "hacker"], [/sopravviven/, "survival", "sopravvivenza"], [/montagna|alpinis|scalat/, "mountain climbing", "montagna"],
  [/sottomarin/, "submarine", "sottomarini"], [/musicist|cantant|band\b|rock/, "musician", "musica"], [/danza|ballerin|ballo\b/, "dance", "danza"], [/pirat/, "pirate", "pirati"],
  [/samurai/, "samurai", "samurai"], [/ninja/, "ninja", "ninja"], [/godzilla|kaiju|mostri giganti/, "kaiju", "mostri giganti"], [/vendetta|vendicar/, "revenge", "vendetta"],
  [/rapiment|rapit/, "kidnapping", "rapimento"], [/ostagg/, "hostage", "ostaggi"], [/truffa|truffator|imbroglion/, "con artist", "truffatori"], [/gemell/, "twins", "gemelli"],
  [/virus|pandemi|epidemi/, "virus", "epidemie"], [/terremot|tsunami|disastro|catastrof|uragano/, "natural disaster", "disastri"], [/storia vera|fatti reali|realmente accaduto/, "based on true story", "storia vera"],
  [/tratto da un (libro|romanzo)|romanzo/, "based on novel or book", "tratto da un romanzo"], [/fumett/, "based on comic", "tratto da un fumetto"], [/pompier|vigili del fuoco/, "firefighter", "pompieri"],
  [/re\b.*regno|regina|principess|castello|medioev|cavalier/, "medieval", "medioevo"], [/dragh/, "dragon", "draghi"], [/mago|magia|magh/, "magic", "magia"]
];
const PGN = [[/horror|paura|spaventos/, 27], [/commedi|divertent|ridere/, 35], [/thriller|tension/, 53], [/animazione|cartoni|cartone animato/, 16], [/romantic|storia d.amore|innamor/, 10749], [/fantascienz/, 878], [/fantasy/, 14], [/documentari/, 99], [/guerra\b|di guerra/, 10752], [/western|far west|cowboy/, 37], [/giallo|mistero/, 9648], [/poliziesc|crimine|criminal/, 80], [/famiglia|bambini/, 10751], [/musical/, 10402], [/storic/, 36], [/drammatic|dramma/, 18]];
const PLG = [[/corean/, "ko"], [/giappones|anime\b/, "ja"], [/frances/, "fr"], [/spagnol/, "es"], [/italian/, "it"], [/indian|bollywood/, "hi"], [/tedesc/, "de"]];
function plotParse(q) {
  const s = " " + q.toLowerCase() + " ", con = PLOT.filter(p => p[0].test(s)).slice(0, 3), gs = PGN.filter(p => p[0].test(s)).map(p => p[1]).slice(0, 2), lg = (PLG.find(p => p[0].test(s)) || [])[1] || "";
  const dm = s.match(/anni ['’]?(\d0)\b|anni (sessanta|settanta|ottanta|novanta|duemila)/), dmap = { sessanta: 1960, settanta: 1970, ottanta: 1980, novanta: 1990, duemila: 2000 };
  const dec = dm ? (dm[1] ? (+dm[1] >= 30 ? 1900 : 2000) + +dm[1] : dmap[dm[2]]) : 0;
  const media = /\bseri[ei]\b|serie tv/.test(s) ? "tv" : /\bfilm\b/.test(s) ? "movie" : "";
  const words = q.trim().split(/\s+/).length;
  return (con.length || ((gs.length || lg || dec) && words >= 3)) ? { con, gs, lg, dec, media } : null;
}
async function plotSearch(q, tok) {
  const p = plotParse(q); if (!p) return;
  const ids = (await Promise.all(p.con.map(c => tmdb("/search/keyword", { query: c[1] }).then(r => { const L = r.results || []; const ex = L.filter(x => x.name.toLowerCase() === c[1]); return (ex.length ? ex : L).slice(0, 2).map(x => x.id); }).catch(() => [])))).filter(a => a.length);
  if (p.con.length && !ids.length && !p.gs.length && !p.lg && !p.dec) return;
  const ms = p.media ? [p.media] : ["movie", "tv"], out = [];
  const run = async kwJoin => { await Promise.all(ms.map(async m => {
    const qq = { sort_by: "popularity.desc", "vote_count.gte": 30, include_adult: "false" };
    if (ids.length) qq.with_keywords = kwJoin ? ids.map(a => a.join("|")).join(",") : ids.flat().join("|");
    if (p.gs.length) { const g = m === "tv" ? tvG(p.gs) : mvG(p.gs); if (g.length) qq.with_genres = g.join(","); }
    if (p.lg) qq.with_original_language = p.lg;
    if (p.dec) { const dk = m === "tv" ? "first_air_date" : "primary_release_date"; qq[dk + ".gte"] = p.dec + "-01-01"; qq[dk + ".lte"] = (p.dec + 9) + "-12-31"; }
    try { const r = await tmdb("/discover/" + m, qq); (r.results || []).forEach(x => { if (x.poster_path) out.push(norm(x, m)); }); } catch (e) {}
  })); };
  await run(true); if (out.length < 4 && ids.length > 1) await run(false);
  if (tok !== SR.tok || !out.length) return;
  out.sort((a, b) => (matchPct(b) || 60) - (matchPct(a) || 60) + (b.vote - a.vote) * 2);
  const lab = [...p.con.map(c => c[2]), ...p.gs.map(g => GN[g]).filter(Boolean), p.lg ? ({ ko: "coreano", ja: "giapponese", fr: "francese", es: "spagnolo", it: "italiano", hi: "indiano", de: "tedesco" })[p.lg] : "", p.dec ? "anni " + String(p.dec).slice(2) : ""].filter(Boolean);
  const box = $("#sr"); if (!box) return; const old = $("#srPlot"); if (old) old.remove();
  box.insertAdjacentHTML("afterbegin", `<div id="srPlot" class="sec"><h3 class="h">${ic("info", 18)} Per trama: ${lab.map(esc).join(" · ")}</h3>${rail(out.slice(0, 20))}</div>`); fillProv && fillProv();
}
(function () { const ds = doSearch; doSearch = async function (q) { const r = await ds.apply(this, arguments), tok = SR.tok; if ((q || "").trim().length >= 4) plotSearch(q.trim(), tok).catch(() => {}); return r; }; })();

/* ================= Suggerimento della sera ================= */
const SERA_H = [19, 20, 21, 22];
const seraOn = () => !!(UI.sera && UI.sera.on);
function seraBox() {
  const perm = typeof Notification !== "undefined" ? Notification.permission : "unsupported", h = (UI.sera && UI.sera.h) || 20;
  if (perm === "unsupported") return `<p class="mu">Questo browser non supporta le notifiche.</p>`;
  if (perm === "denied") return `<p class="mu">Le notifiche sono bloccate: riattivale dalle impostazioni del sito nel browser.</p>`;
  return `<p class="mu">Ogni sera tre titoli scelti per te, sui tuoi servizi, adatti a quel momento. Un tocco e si apre la scheda.</p><div class="row">${chipB(!seraOn(), "seraSet(false)", "No")}${chipB(seraOn(), "seraSet(true)", "Sì, ogni sera")}</div>
${seraOn() ? `<p class="mu small">Ora</p><div class="row">${SERA_H.map(x => chipB(h === x, `seraHour(${x})`, x + ":30")).join("")}</div><p class="mu small">${C.VAPID_PUBLIC ? "Arriva anche ad app chiusa." : "Ad app chiusa arriva solo se l’app è installata su Android; altrimenti te li mostro quando apri l’app la sera."}</p>` : ""}`;
}
(function () { const sn = setNotif; setNotif = function () { return sn.apply(this, arguments) + sblk("Suggerimento della sera", "", seraBox()); }; })();
async function seraSet(on) {
  if (!on) { UI.sera = Object.assign({}, UI.sera, { on: false }); lsSet("cm_ui", UI); if (xUser()) sb.from("evening_picks").delete().eq("user_id", user.id).then(() => {}, () => {}); try { const r = await navigator.serviceWorker.ready; r.periodicSync && r.periodicSync.unregister("sera"); } catch (e) {} render(); return; }
  try {
    const p = await Notification.requestPermission(); if (p !== "granted") { toast("Permesso negato"); return render(); }
    UI.sera = { on: true, h: (UI.sera && UI.sera.h) || 20 }; lsSet("cm_ui", UI);
    if (C.VAPID_PUBLIC) await xSub().catch(() => {});
    try { const r = await navigator.serviceWorker.ready; if (r.periodicSync) { const st = await navigator.permissions.query({ name: "periodic-background-sync" }); if (st.state === "granted") await r.periodicSync.register("sera", { minInterval: 6 * 36e5 }); } } catch (e) {}
    await seraPrep(true); toast("Ogni sera alle " + UI.sera.h + ":30 i tuoi tre titoli"); render();
  } catch (e) { toast("Non è stato possibile attivare le notifiche"); }
}
function seraHour(h) { UI.sera = Object.assign({}, UI.sera, { h }); lsSet("cm_ui", UI); seraPrep(true); render(); }
let seraT = 0;
async function seraPrep(force) {
  if (!seraOn() || (!force && Date.now() - seraT < 36e5)) return; seraT = Date.now();
  try {
    const r = (await recItems(12)).filter(x => x.it.poster).slice(0, 3); if (!r.length) return;
    const picks = r.map(x => ({ k: x.it.key, t: String(x.it.title).slice(0, 80), p: x.it.poster, w: String(x.extra || "").slice(0, 60) })), day = today();
    lsSet("cm_sera", { day, picks });
    try { const c = await caches.open("tonightly-data"); await c.put("./__sera.json", new Response(JSON.stringify({ day, h: UI.sera.h, picks }), { headers: { "content-type": "application/json" } })); } catch (e) {}
    if (xUser()) await sb.from("evening_picks").upsert({ user_id: user.id, day, picks, at_hour: UI.sera.h, updated_at: new Date().toISOString() });
  } catch (e) {}
}
async function seraShow() {
  let s = lsGet("cm_sera", null);
  if ((!s || !Array.isArray(s.picks) || !s.picks.length) && xUser()) { try { const r = await sb.from("evening_picks").select("day,picks").eq("user_id", user.id).maybeSingle(); if (r.data && Array.isArray(r.data.picks)) s = { day: r.data.day, picks: r.data.picks.filter(x => x && KEYRE.test(x.k || "")).slice(0, 3) }; } catch (e) {} }
  if (!s || !Array.isArray(s.picks) || !s.picks.length) { go("tonight"); return; }
  const its = mItems(s.picks); lsSet("cm_sera_seen", today());
  amenuHtml(`<h3 class="h">${ic("moon", 20)} I tuoi tre per stasera</h3><p class="mu">Scelti per te, sui tuoi servizi.</p><div class="serap">${its.map((it, i) => `<button class="serai" onclick="$('#amenu').innerHTML='';openSheet('${it.key}')">${it.poster ? `<img src="${IMG}w185${it.poster}" alt="">` : ""}<b>${esc(it.title)}</b><small class="mu">${esc(s.picks[i].w || "")}</small></button>`).join("")}</div><div class="row"><button class="btn grow" onclick="$('#amenu').innerHTML='';go('tonight')">Altre idee per stasera</button></div>`);
}
/* senza notifiche ad app chiusa: la sera, aprendo l'app, ti mostro comunque i tre titoli (una volta) */
function seraInApp() {
  if (!seraOn() || C.VAPID_PUBLIC) return; const h = new Date().getHours(), s = lsGet("cm_sera", null);
  if (h >= (UI.sera.h || 20) && h < 24 && s && s.day === today() && lsGet("cm_sera_seen", "") !== today() && view === "home") setTimeout(seraShow, 1500);
}
(function () { const vh = vHome; vHome = async function () { const h = await vh.apply(this, arguments); setTimeout(() => { seraPrep(); seraInApp(); }, 2500); return h; }; })();

/* il boot attende anche questo file */
/* ===== Collega la TV: il telefono conferma l'accesso inquadrando il QR della TV ===== */
const TVQ = (() => { try { const v = new URLSearchParams(location.search).get("tv") || ""; return /^[A-Za-z0-9]{24}$/.test(v) ? v : ""; } catch (e) { return ""; } })();
function tvLinkAsk(id) {
  if (!/^[A-Za-z0-9]{24}$/.test(id || "")) return;
  if (!xUser()) { lsSet("cm_tv", id); toast("Accedi per collegare la TV"); return; }
  lsSet("cm_tv", "");
  amenuHtml(`<div class="tvl"><div class="tvi">📺</div><h3 class="h">Collegare la TV?</h3><p class="mu">La TV entrerà nel tuo account${user && user.email ? " (<b>" + esc(user.email) + "</b>)" : ""}. Fallo solo se la TV è davanti a te.</p><label class="mu small" for="tvn">Scrivi il numero di 4 cifre che vedi sulla TV</label><input id="tvn" inputmode="numeric" maxlength="4" autocomplete="off" pattern="[0-9]*" onkeydown="if(event.key==='Enter')tvLinkGo('${id}')"><div class="row"><button class="btn pri grow" id="tvgo" onclick="tvLinkGo('${id}')">Collega la TV</button></div></div>`);
  setTimeout(() => { const i = $("#tvn"); if (i) i.focus(); }, 150);
}
async function tvLinkGo(id) {
  const n = (($("#tvn") || {}).value || "").replace(/\D/g, ""); if (n.length !== 4) return toast("Scrivi le 4 cifre che vedi sulla TV");
  const b = $("#tvgo"); if (b) { b.disabled = true; b.textContent = "Collego…"; }
  try {
    const r = await sb.functions.invoke("tv-login", { body: { link: id, code: n } });
    if (r.error) { let m = ""; try { m = (await r.error.context.json()).error || ""; } catch (e) {} throw new Error(m || "L’accesso con il QR non è ancora attivo: sulla TV usa il codice via email"); }
    $("#amenu").innerHTML = ""; toast("TV collegata! Guarda lo schermo");
  } catch (e) { toast(e.message || "Collegamento non riuscito"); if (b) { b.disabled = false; b.textContent = "Collega la TV"; } }
}
(function () {
  const b0 = xBoot; xBoot = async function () { await b0.apply(this, arguments); if (TVQ) { try { history.replaceState(history.state, "", location.pathname); } catch (e) {} tvLinkAsk(TVQ); } else if (xUser() && lsGet("cm_tv", "")) tvLinkAsk(lsGet("cm_tv", "")); };
  const g0 = xUserGate; xUserGate = function () { const r = g0.apply(this, arguments); if (xUser() && lsGet("cm_tv", "")) setTimeout(() => tvLinkAsk(lsGet("cm_tv", "")), 600); return r; };
})();

/* il via all'app lo dà v2.js, che viene caricato dopo */

/* ================= Sezioni speciali di stagione (Halloween, Natale, …) ================= */
const FEST = [
  { id: "halloween", name: "Halloween", emo: "🎃", from: "10-01", to: "11-01", c1: "#FF7A00", c2: "#8B2CF5", sub: "Brividi, zucche e notti da paura sui tuoi servizi",
    rails: [["Notte di Halloween", { kw: "3335" }], ["Horror da brividi", { g: [27], sort: "vote_average.desc", vc: 400 }], ["Paura per tutta la famiglia", { kw: "3335", g: [10751, 16] }]] },
  { id: "natale", name: "Natale", emo: "🎄", from: "12-08", to: "01-06", c1: "#E63946", c2: "#2BB673", sub: "L’atmosfera delle feste, dall’Immacolata all’Epifania",
    rails: [["Film di Natale", { kw: "207317" }], ["Natale in famiglia", { kw: "207317", g: [10751, 16] }], ["Classici delle feste", { kw: "207317", sort: "vote_average.desc", vc: 150 }]] },
  { id: "sanvalentino", name: "San Valentino", emo: "💘", from: "02-07", to: "02-14", c1: "#FF4D8D", c2: "#B5179E", sub: "Storie d’amore per la serata in due",
    rails: [["Le storie d’amore più belle", { g: [10749], sort: "vote_average.desc", vc: 400 }], ["Commedie romantiche", { g: [10749, 35], and: true }]] }
];
const FEST_FORCE = (new URLSearchParams(location.search).get("fest") || "").replace(/[^a-z]/g, "");
function festNow() {
  if (FEST_FORCE) return FEST.find(f => f.id === FEST_FORCE) || null;
  const d = new Date(), md = String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  return FEST.find(f => f.from <= f.to ? md >= f.from && md <= f.to : md >= f.from || md <= f.to) || null;
}
const FKW = {};
async function festKw(q) { if (FKW[q] != null) return FKW[q]; try { const r = await tmdb("/search/keyword", { query: q }), L = r.results || [], ex = L.find(x => x.name.toLowerCase() === q) || L[0]; FKW[q] = ex ? String(ex.id) : ""; } catch (e) { FKW[q] = ""; } return FKW[q]; }
async function festRail(m, o) {
  const prov = F.svc && F.svc.length ? F.svc : provF(), q = { watch_region: R, with_watch_monetization_types: "flatrate", sort_by: o.sort || "popularity.desc", "vote_count.gte": o.vc || 20, include_adult: "false" };
  if (prov.length) q.with_watch_providers = prov.join("|"); else if (P().pirate) { delete q.watch_region; delete q.with_watch_monetization_types; }
  const kw = o.kw || (o.kwq ? await festKw(o.kwq) : ""); if (o.kwq && !kw) return [];
  if (kw) q.with_keywords = kw;
  if (o.g) { const g = m === "tv" ? tvG(o.g) : mvG(o.g); if (!g.length) return []; q.with_genres = g.join(o.and ? "," : "|"); }
  try { const r = await tmdb("/discover/" + m, q); return (r.results || []).map(x => norm(x, m)).filter(i => i.poster && okItem(i)); } catch (e) { return []; }
}
async function festHtml(m) {
  const f = festNow(); if (!f) return "";
  const rs = await Promise.all(f.rails.map(([, o]) => festRail(m, o)));
  // una sola fila, discreta: i titoli delle varie sezioni mescolati senza doppioni
  const seen = new Set(), L = []; for (let j = 0; j < 20; j++) rs.forEach(r => { const x = r[j]; if (x && !seen.has(x.key)) { seen.add(x.key); L.push(x); } });
  if (L.length < 4) return "";
  return `<section class="fest" id="fest" style="--f1:${f.c1};--f2:${f.c2}"><div class="fhead"><span class="femo" aria-hidden="true">${f.emo}</span><h3>${esc(f.name)}</h3><small>${esc(f.sub)}</small></div>${rail(L.slice(0, 20))}</section>`;
}
const festChip = toDisc => { const f = festNow(); return f ? `<button class="chip festc" style="--f1:${f.c1};--f2:${f.c2}" onclick="${toDisc ? "tvTab='disc';F.genres=[];render().then(()=>setTimeout(festGo,200))" : "festGo()"}">${f.emo} ${esc(f.name)}</button>` : ""; };
function festGo() { const e = document.getElementById("fest"); if (e) e.scrollIntoView({ behavior: "smooth", block: "start" }); }
(function () {
  const vm = vMT; vMT = async function () {
    const m = view, f = festNow(), disc = m === "movie" || tvTab === "disc";
    const [h, fx] = await Promise.all([vm.apply(this, arguments), f && disc ? festHtml(m).catch(() => "") : ""]);
    if (!f) return h;
    // in "Le mie serie" e nel calendario: solo il pulsante, che porta allo speciale in "Scopri"
    if (!disc) return h.replace(/(<div class="row segs">)/, `$1${festChip(true)}`);
    if (!fx) return h;
    const chips = h.replace(/(<button class="chip[^"]*" onclick="quickGenre\(0\)">)/, festChip() + "$1");
    const at = [chips.indexOf('<h3 class="h">'), chips.indexOf('<div class="grid"')].filter(x => x > 0).sort((a, b) => a - b)[0];
    return at ? chips.slice(0, at) + fx + chips.slice(at) : chips.replace(/<div id="more"/, fx + '<div id="more"');
  };
})();

/* l'altezza reale della barra in alto (cambia con la dimensione del testo e dello schermo): il contenuto parte sempre sotto */
(function () { const fit = () => { const h = document.querySelector("header"); if (h && h.offsetHeight) document.documentElement.style.setProperty("--top", h.offsetHeight + "px"); }; addEventListener("resize", fit); if (window.ResizeObserver) { const h = document.querySelector("header"); if (h) new ResizeObserver(fit).observe(h); } fit(); setTimeout(fit, 500); })();
