/* Tonightly – funzioni extra: importazioni (TV Time, Trakt, Letterboxd), calendario .ics, piano abbonamenti,
   saghe, note e tag, serata in due, liste condivise, amici, promemoria, obiettivo annuale, "da rivedere". */
"use strict";

const XSAY = t => { const e = $("#imsg"); if (e) e.innerHTML = "<b>" + esc(t) + "</b>"; };
const stTxt = s => "★".repeat(Math.floor(+s || 0)) + ((+s || 0) % 1 ? "½" : "");
const xUser = () => !!(typeof sb !== "undefined" && sb && user);
const xDay = d => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + 1); return x.toISOString().slice(0, 10); };

/* ================= Calendario .ics ================= */
function icsButton(d) {
  window.__ics = d;
  const n = d && ((d.tv || []).length + (d.mv || []).length); if (!n) return "";
  const on = !!UI.remind && typeof Notification !== "undefined" && Notification.permission === "granted";
  return `<div class="gcard"><div><b>Non perderti le uscite</b><span class="mu">Ricevi un avviso quando esce una puntata o una stagione che segui, oppure aggiungile al calendario del telefono.</span></div>
<div class="row"><button class="btn ${on ? "on" : "pri"}" onclick="setRemind(${!on})">${ic("bell", 16)} ${on ? "Avvisi attivi (tocca per spegnere)" : "Avvisami"}</button><button class="btn" onclick="icsDl()">${ic("calendar", 16)} Calendario</button></div></div>`;
}
function icsDl() {
  const d = window.__ics; if (!d) return;
  const q = s => String(s || "").replace(/[\\;,]/g, m => "\\" + m).replace(/\r?\n/g, " "), dt = s => s.replace(/-/g, "");
  const ev = [];
  (d.tv || []).forEach(r => ev.push([`tv-${r.t.tmdb_key}-${r.date}-${r.s}-${r.e}`, r.date, r.t.title + " – " + soonLine(r)]));
  (d.mv || []).forEach(m => ev.push([`mv-${m.key}-${m.date}`, m.date, m.title + " (film in uscita)"]));
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//" + (C.APP_NAME || "Tonightly") + "//IT", "CALSCALE:GREGORIAN", "X-WR-CALNAME:" + q((C.APP_NAME || "Tonightly") + " – In arrivo")];
  ev.forEach(([id, day, title]) => L.push("BEGIN:VEVENT", "UID:" + id.replace(/[^A-Za-z0-9:_-]/g, "") + "@tonightly", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + dt(day), "DTEND;VALUE=DATE:" + dt(xDay(day)), "SUMMARY:" + q(title), "TRANSP:TRANSPARENT", "END:VEVENT"));
  L.push("END:VCALENDAR");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([L.join("\r\n")], { type: "text/calendar" }));
  a.download = "uscite-tonightly.ics"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast("Calendario scaricato: aprilo per aggiungere le uscite");
}

/* ================= Piano abbonamenti ================= */
async function xPlan() {
  try {
    const wl = Object.values(S.titles).filter(t => t.watchlist && !t.watched).slice(0, 40);
    if (wl.length < 3) return "";
    const av = await Promise.all(wl.map(t => lightProvs(rowItem(t)).catch(() => [])));
    const prov = {}, cover = new Map();
    av.forEach((f, i) => f.forEach(p => { (prov[p.provider_id] = prov[p.provider_id] || { p, set: new Set() }).set.add(i); }));
    const left = new Set(wl.map((_, i) => i)), pick = [];
    while (left.size && pick.length < 4) {
      let best = null, bn = 0;
      for (const id in prov) { if (pick.includes(+id)) continue; let n = 0; prov[id].set.forEach(i => { if (left.has(i)) n++; }); if (n > bn) { bn = n; best = +id; } }
      if (!best) break; pick.push(best); prov[best].set.forEach(i => left.delete(i));
    }
    if (!pick.length) return "";
    const covered = wl.length - left.size, pr = P().prices || {};
    const mineCov = new Set(); S.subs.forEach(id => prov[id] && prov[id].set.forEach(i => mineCov.add(i)));
    const adds = Object.values(prov).filter(x => !isMine(x.p.provider_id)).map(x => ({ p: x.p, n: [...x.set].filter(i => !mineCov.has(i)).length })).filter(x => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2);
    const addHtml = adds.length ? `<p class="mu">Per guardare di più della tua lista: ${adds.map(x => `con <b>${esc(x.p.provider_name)}</b> sbloccheresti altri <b>${x.n}</b> titoli`).join(", ")}.</p>` : "";
    const mine = S.subs.filter(id => pick.every(x => x !== id));
    const pausable = mine.filter(id => !prov[id] || ![...prov[id].set].some(i => !av[i].some(p => pick.includes(p.provider_id))));
    const save = pausable.reduce((a, id) => a + (+pr[id] || 0), 0), names = id => (prov[id] ? prov[id].p.provider_name : "Servizio " + id);
    return `<h2 class="h">${ic("euro", 22)} Piano abbonamenti</h2>
<p class="mu">In base ai ${wl.length} titoli della tua lista, questi servizi bastano per coprire <b>${covered}</b> titoli${left.size ? " (gli altri " + left.size + " non sono in streaming in abbonamento)" : ""}:</p>
<div class="plan">${pick.map(id => `<span class="pl ${isMine(id) ? "mine" : ""}"><img src="${IMG}w45${prov[id].p.logo_path}" alt="" width="22" height="22">${esc(names(id))} <small>${[...prov[id].set].length} titoli</small></span>`).join("")}</div>
${pausable.length ? `<p class="mu">Per ora non ti servono: <b>${pausable.map(id => esc(names(id) === "Servizio " + id ? "un tuo abbonamento" : names(id))).join(", ")}</b>. Potresti metterli in pausa${save ? " e risparmiare circa <b>" + eur(save) + "</b> al mese" : ""}.</p>` : `<p class="mu">Gli abbonamenti che hai sono tutti utili per la tua lista.</p>`}
${addHtml}<p><button class="btn pri" onclick="go('plan')">Quale abbonamento ti basta questo mese?</button></p><p class="mu small">È una stima basata sulla disponibilità attuale: i cataloghi cambiano spesso. Un trucco: abbonati a un servizio per un mese, guarda i titoli in lista e poi disdici.</p>`;
  } catch (e) { return ""; }
}

/* ================= È un match! ================= */
function matchModal(i, members) {
  if (!i) return; let e = document.getElementById("mm"); if (e) e.remove();
  e = document.createElement("div"); e.id = "mm"; document.body.appendChild(e);
  const av = (members || []).slice(0, 4).map(m => `<span class="mmav">${avatarHtml(m.avatar || 0, 52)}</span>`).join("");
  e.innerHTML = `<div class="ov c" style="z-index:80" role="dialog" aria-modal="true" aria-label="Match"><div class="dlg mmc"><span class="mmk">${ic("star", 14)} Intesa perfetta</span><h2 class="mmt">È UN MATCH!</h2><p class="mu">Avete scelto lo stesso titolo per stasera.</p>
<div class="mmavs">${av}</div>
<div class="mmi">${i.p ? `<img src="${IMG}w185${esc(i.p)}" alt="" width="56" height="84">` : ""}<div><b>${esc(i.t || "")}</b><small>${esc(i.y || "")}${i.m ? " · " + (i.m === "tv" ? "Serie TV" : "Film") : ""}</small></div></div>
<div class="col"><button class="btn pri big" onclick="mmGo('${esc(i.k)}')">${ic("play", 16)} Vedi dove guardarlo</button><button class="btn" onclick="mmClose()">Continua</button></div></div></div>`;
  try { confetti(); } catch (x) {}
}
function mmClose() { const e = document.getElementById("mm"); if (e) e.remove(); }
function mmGo(k) { mmClose(); openSheet(k); }

/* ================= Guida iniziale (3 slide) ================= */
const TOUR = [
  ["moon", "Scegli cosa guardare", "Dalla Home tocca <b>Stasera</b> e scegli l’umore, oppure <b>Sorprendimi</b> se non sai cosa vuoi. Con <b>Quanto tempo hai?</b> e <b>Swipe</b> trovi qualcosa al volo. Ti mostro solo ciò che puoi guardare con i tuoi abbonamenti."],
  ["list", "Tieni tutto in ordine", "Sulla locandina usa il tasto in basso a destra per aggiungere un titolo alla <b>tua lista</b>. Segna cosa hai visto e dai le stelle: i consigli migliorano. Con <b>Quale abbonamento ti basta?</b> scopri quale servizio pagare questo mese."],
  ["users", "Fallo insieme agli amici", "In <b>Insieme</b> aggiungi gli amici, consigliatevi i film e scegliete la serata in due. Dalla scheda di un titolo puoi anche <b>inviarlo a un altro dispositivo</b>. Hai già una cronologia? Importala da TV Time, Trakt o Letterboxd in Impostazioni."]
];
let tourI = 0;
function xTour() {
  tourI = 0; let e = document.getElementById("tour");
  if (!e) { e = document.createElement("div"); e.id = "tour"; document.body.appendChild(e); }
  tourDraw();
}
function tourDraw() {
  const e = document.getElementById("tour"); if (!e) return; const [i, t, d] = TOUR[tourI], last = tourI === TOUR.length - 1;
  e.innerHTML = `<div class="ov c" style="z-index:70" role="dialog" aria-modal="true" aria-label="Guida"><div class="dlg" style="max-width:380px;padding:28px 24px"><div style="display:flex;justify-content:center;margin-bottom:12px;color:var(--pri)">${ic(i, 44)}</div>
<h2 class="h" style="margin:0 0 8px">${t}</h2><p class="mu" style="margin:0 0 18px;line-height:1.5">${d}</p>
<div class="row" style="justify-content:center;gap:8px;margin-bottom:16px">${TOUR.map((_, k) => `<span style="width:${k === tourI ? 22 : 8}px;height:8px;border-radius:99px;background:${k === tourI ? "var(--pri)" : "rgba(255,255,255,.25)"};transition:width .2s"></span>`).join("")}</div>
<div class="row" style="justify-content:center"><button class="btn pri" onclick="tourNext()">${last ? "Inizia" : "Avanti"}</button>${last ? "" : `<button class="btn" onclick="tourEnd()">Salta</button>`}</div></div></div>`;
}
function tourNext() { if (tourI >= TOUR.length - 1) tourEnd(); else { tourI++; tourDraw(); } }
function tourEnd() { const e = document.getElementById("tour"); if (e) e.remove(); lsSet("cm_tour", 1); }

/* ================= Roulette della lista: "Scegli per me stasera" ================= */
const RL = { t: 0, m: -1 };
function xRoulette() { RL.t = 0; RL.m = -1; let e = document.getElementById("rl"); if (!e) { e = document.createElement("div"); e.id = "rl"; document.body.appendChild(e); } rlDraw(); }
function rlPick() {
  let pool = Object.values(S.titles).filter(t => t.watchlist && !t.watched && t.poster);
  if (RL.t) pool = pool.filter(t => !t.runtime || t.runtime <= RL.t);
  if (RL.m >= 0) pool = pool.filter(t => (t.genre_ids || []).some(g => MOODS[RL.m][1].includes(g)));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, 3);
}
function rlSet(k, v) { RL[k] = v; rlDraw(); }
function rlDraw() {
  const e = document.getElementById("rl"); if (!e) return;
  const all = Object.values(S.titles).filter(t => t.watchlist && !t.watched).length, pk = all ? rlPick() : [];
  pk.forEach(t => { ITEMS[t.tmdb_key] = rowItem(t); });
  const ch = (on, f, l) => `<button class="chip ${on ? "on" : ""}" onclick="${f}">${l}</button>`;
  e.innerHTML = `<div class="ov c" style="z-index:70" role="dialog" aria-modal="true" aria-label="Scegli per me"><div class="dlg" style="max-width:440px"><h2 class="h" style="margin:0 0 4px">${ic("dice", 22)} Scegli per me stasera</h2>
<p class="mu" style="margin:0 0 12px">${all ? "Tre titoli dalla tua lista, in base al tempo e all’umore." : "La tua lista è vuota: aggiungi qualche titolo e ti proporrò cosa guardare."}</p>
${all ? `<div class="row center">${[[0, "Qualsiasi durata"], [90, "Fino a 90 min"], [130, "Fino a 2 ore"]].map(([v, l]) => ch(RL.t === v, `rlSet('t',${v})`, l)).join("")}</div>
<div class="row center">${ch(RL.m < 0, "rlSet('m',-1)", "Ogni umore")}${MOODS.map((m, i) => ch(RL.m === i, `rlSet('m',${i})`, m[0])).join("")}</div>
${pk.length ? `<div class="rlr">${pk.map(t => `<button class="rlc" onclick="rlOpen('${esc(t.tmdb_key)}')"><img src="${IMG}w185${esc(t.poster)}" alt="" width="104" height="156"><b>${esc(t.title)}</b><small>${esc(String(t.year || ""))}</small></button>`).join("")}</div>` : `<p class="mu">Niente nella tua lista con queste scelte: prova un altro umore o più tempo.</p>`}
<div class="row center"><button class="btn pri" onclick="rlDraw()">${ic("dice", 16)} Rilancia</button><button class="btn" onclick="rlClose()">Chiudi</button></div>` : `<div class="row center"><button class="btn pri" onclick="rlClose();go('movie')">Cerca titoli</button><button class="btn" onclick="rlClose()">Chiudi</button></div>`}</div></div>`;
}
function rlClose() { const e = document.getElementById("rl"); if (e) e.remove(); }
function rlOpen(k) { rlClose(); openSheet(k); }

/* ================= Avvisami quando arriva nei miei abbonamenti ================= */
const XD = {};
const xAlerts = () => (P().alerts = Array.isArray(P().alerts) ? P().alerts : []);
async function arrTog(k) {
  const a = xAlerts(), i = a.indexOf(k);
  if (i >= 0) { a.splice(i, 1); toast("Avviso annullato"); } else {
    if (a.length >= 30) return toast("Puoi seguire al massimo 30 arrivi");
    a.push(k); toast("Ti avviso appena arriva nei tuoi abbonamenti (controllo ogni volta che apri l’app)");
    try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch (e) {}
  }
  await saveProfile(); xShareBlock(k);
}
function arrBtn(k, d) {
  d = d && d["watch/providers"] ? d : XD[k]; if (!d) return "";
  XD[k] = d;
  if (mineOf(d).length) return "";
  const on = xAlerts().includes(k);
  return `<button class="btn ${on ? "on mint" : ""}" onclick="arrTog('${esc(k)}')">${ic("bell", 16)} ${on ? "Ti avviso quando arriva" : "Avvisami quando arriva"}</button>`;
}
async function arrCheck() {
  const a = xAlerts().slice(); if (!a.length || !S.subs.length) return;
  if (Date.now() - lsGet("cm_arr", 0) < 3 * 3600e3) return; lsSet("cm_arr", Date.now());
  const done = [];
  for (const k of a) {
    try {
      const [m, id] = k.split(":"), r = await tmdb("/" + m + "/" + id + "/watch/providers"), fl = (((r.results || {})[R]) || {}).flatrate || [], mine = fl.filter(p => isMine(p.provider_id));
      if (mine.length) done.push([k, mine[0].provider_name]);
    } catch (e) {}
  }
  if (!done.length) return;
  const al = xAlerts(); done.forEach(([k]) => { const i = al.indexOf(k); if (i >= 0) al.splice(i, 1); }); await saveProfile();
  const names = done.map(([k, n]) => { const t = S.titles[k]; return (t ? t.title : (byKey(k) || {}).title || "Un titolo") + " su " + n; });
  toast("Ora disponibile: " + names.slice(0, 2).join(", ") + (names.length > 2 ? "…" : ""));
  try { if ("Notification" in window && Notification.permission === "granted" && navigator.serviceWorker) { const reg = await navigator.serviceWorker.ready; reg.showNotification("Ora nei tuoi abbonamenti", { body: names.join(" · "), icon: "icon-192.png", tag: "arrivi", data: { url: "./" } }); } } catch (e) {}
}

/* ================= Piano del mese: quale abbonamento ti basta ================= */
async function vPlan() {
  const back = `<div class="row"><button class="back" onclick="go('home')">‹ Home</button></div>`;
  const wl = Object.values(S.titles).filter(t => t.watchlist && !t.watched).slice(0, 60);
  if (wl.length < 2) return `<div class="sec pt">${back}<h2 class="h">${ic("euro", 24)} Quale abbonamento ti basta?</h2>${emptyBox("euro", "Aggiungi almeno 2 titoli alla tua lista con il tasto “Aggiungi”: ti dirò quale abbonamento ti serve questo mese e quali puoi mettere in pausa.", `<button class="btn pri" onclick="go('movie')">Cerca titoli</button>`)}</div>`;
  const av = await Promise.all(wl.map(t => lightProvs(rowItem(t)).catch(() => [])));
  const prov = {};
  av.forEach((f, i) => f.forEach(p => { (prov[p.provider_id] = prov[p.provider_id] || { p, set: new Set() }).set.add(i); }));
  const pr = P().prices || {}, left = new Set(wl.map((_, i) => i)), months = [];
  while (left.size && months.length < 4) {
    let best = null, bs = 0;
    for (const id in prov) { if (months.some(m => m.id === +id)) continue; let n = 0; prov[id].set.forEach(i => { if (left.has(i)) n++; }); const sc = n + (isMine(+id) ? 0.5 : 0); if (n && sc > bs) { bs = sc; best = +id; } }
    if (!best) break;
    const items = [...prov[best].set].filter(i => left.has(i)); items.forEach(i => left.delete(i));
    months.push({ id: best, p: prov[best].p, items });
  }
  if (!months.length) return `<div class="sec pt">${back}<h2 class="h">${ic("euro", 24)} Quale abbonamento ti basta?</h2>${emptyBox("euro", "I titoli della tua lista non sono in streaming in abbonamento al momento. Riprova più avanti: i cataloghi cambiano spesso.", "")}</div>`;
  const m1 = months[0], nm = m1.p.provider_name, price = +pr[m1.id] || 0;
  const rest = wl.length - left.size - m1.items.length;
  const owned = S.subs.filter(id => id !== m1.id), pause = owned;
  const save = pause.reduce((a, id) => a + (+pr[id] || 0), 0);
  const nameOf = id => prov[id] ? prov[id].p.provider_name : "un altro servizio";
  const logo = p => `<img src="${IMG}w92${p.logo_path}" alt="" width="52" height="52" style="border-radius:12px">`;
  const hero = `<div style="display:flex;flex-direction:row;gap:14px;align-items:center;padding:16px;border-radius:18px;background:var(--card,rgba(255,255,255,.06));border:1px solid var(--line,rgba(255,255,255,.12));margin:12px 0">${logo(m1.p)}<div style="min-width:0"><div class="mu" style="font-size:13px">Questo mese ti basta</div><div style="font-size:24px;font-weight:700;line-height:1.2">${esc(nm)}</div><div class="mu" style="font-size:14px">Guardi <b>${m1.items.length}</b> dei ${wl.length} titoli in lista${price ? " · " + eur(price) + " al mese" : ""}${isMine(m1.id) ? " · ce l’hai già" : ""}</div></div></div>`;
  const saveHtml = S.subs.length ? (pause.length && save ? `<p class="mu">Gli altri tuoi abbonamenti (<b>${pause.map(id => esc(nameOf(id))).join(", ")}</b>) per ora puoi metterli in pausa: risparmi circa <b>${eur(save)}</b> al mese.</p>` : isMine(m1.id) && S.subs.length === 1 ? `<p class="mu">È l’unico abbonamento che hai: va benissimo così.</p>` : "") : "";
  const next = months.slice(1).map((m, k) => `<div class="sec"><h2 class="h">Mese ${k + 2}: ${esc(m.p.provider_name)}</h2><p class="mu">Disdici ${esc(months[k].p.provider_name)} e passa a ${esc(m.p.provider_name)}: sblocchi altri <b>${m.items.length}</b> titoli${+pr[m.id] ? " (" + eur(+pr[m.id]) + ")" : ""}.</p>${rail(m.items.map(i => rowItem(wl[i])))}</div>`).join("");
  const tot = months.reduce((a, m) => a + (+pr[m.id] || 0), 0);
  const unav = left.size ? `<p class="mu small">${left.size} ${left.size === 1 ? "titolo non è" : "titoli non sono"} in streaming in abbonamento (forse solo a noleggio o non disponibili in Italia).</p>` : "";
  return `<div class="sec pt">${back}<h2 class="h">${ic("euro", 24)} Quale abbonamento ti basta?</h2>
<p class="mu">Guardo i ${wl.length} titoli della tua lista e ti dico il servizio che ne copre di più, così non paghi per niente.</p>
${hero}${saveHtml}
<h2 class="h">Cosa guardi con ${esc(nm)}</h2>${rail(m1.items.map(i => rowItem(wl[i])))}
${months.length > 1 ? `<h2 class="h">E dopo?</h2><p class="mu">Per vedere anche il resto, cambia servizio ogni mese${tot ? `: in ${months.length} mesi spendi circa <b>${eur(tot)}</b> in totale` : ""}.</p>` : ""}${next}
${unav}<p class="mu small">È una stima basata sulla disponibilità attuale: i cataloghi cambiano spesso. Imposta i prezzi dei tuoi abbonamenti in Impostazioni › Abbonamenti per vedere i risparmi.</p></div>`;
}

/* ================= Obiettivo annuale, "da rivedere", ring ================= */
const xProf = () => "";
async function xRewatch() {
  const lim = new Date(); lim.setFullYear(lim.getFullYear() - 1); const l = lim.toISOString().slice(0, 10);
  const a = Object.values(S.titles).filter(t => t.watched && t.stars === 5 && t.poster && (t.watched_on || "9") < l).sort((x, y) => (x.watched_on || "").localeCompare(y.watched_on || "")).slice(0, 14);
  if (a.length < 2) return "";
  return `<div class="sec"><h2 class="h">Da rivedere</h2><p class="mu">Titoli che hai amato (5 stelle) e che non guardi da più di un anno.</p>${rail(a.map(rowItem))}</div>`;
}
function xTiles() {
  const n = xUser() ? xUnseen() : 0;
  return `<button class="bt lil w2" onclick="TG.tab='${n ? "new" : "duo"}';go('together')">${ic("users", 26)}${n ? `<span class="nb">${n}</span>` : ""}<div><b>Insieme</b><small>${n ? n + (n === 1 ? " novità dagli amici" : " novità dagli amici") : "Serata in due, consigli e amici"}</small></div></button>`;
}

/* ================= Impostazioni extra: spoiler, promemoria ================= */
const chipB = (on, f, l) => `<button class="chip ${on ? "on" : ""}" onclick="${f}">${l}</button>`;
function xSpoil() {
  return `<p class="mu">Sfoca titoli e nomi degli episodi che non hai ancora visto. Tocca per svelarli.</p><div class="row">${chipB(!UI.spoil, "setUI('spoil',false)", "Mostra tutto")}${chipB(UI.spoil, "setUI('spoil',true)", "Sfoca gli spoiler")}</div>`;
}
var xRemind; /* definita più avanti */
const xOther = () => "";
async function setRemind(on) {
  if (!on) { UI.remind = false; lsSet("cm_ui", UI); try { await xUnsub(); } catch (e) {} render(); return; }
  try {
    const p = await Notification.requestPermission(); if (p !== "granted") { toast("Permesso negato"); render(); return; }
    UI.remind = true; lsSet("cm_ui", UI); await xSub(); toast("Promemoria attivati"); xRemindNow(); render();
  } catch (e) { toast("Non è stato possibile attivare le notifiche"); }
}
const b64u = s => { const p = "=".repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, c => c.charCodeAt(0)); };
async function xSub() {
  if (!C.VAPID_PUBLIC || !xUser() || !("PushManager" in window)) return;
  const reg = await navigator.serviceWorker.ready; let s = await reg.pushManager.getSubscription();
  if (!s) s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(C.VAPID_PUBLIC) });
  const j = s.toJSON(); await sb.from("push_subs").upsert({ endpoint: j.endpoint, user_id: user.id, p256dh: j.keys.p256dh, auth: j.keys.auth });
}
async function xUnsub() {
  if (!("serviceWorker" in navigator)) return; const reg = await navigator.serviceWorker.ready, s = reg.pushManager && await reg.pushManager.getSubscription();
  if (s) { if (xUser()) await sb.from("push_subs").delete().eq("endpoint", s.endpoint); await s.unsubscribe(); }
}
async function xRemindNow() {
  try {
    if (!UI.remind || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const d = await soonData(), td = today(), tm = xDay(td), done = lsGet("cm_notified", {}), reg = await navigator.serviceWorker.ready; let n = 0;
    for (const r of d.tv.filter(r => r.seen && (r.date === td || r.date === tm))) {
      const id = r.t.tmdb_key + r.date + r.s + r.e; if (done[id] || n >= 3) continue; done[id] = 1; n++;
      reg.showNotification(r.t.title, { body: (r.date === td ? "Oggi: " : "Domani: ") + soonLine(r), icon: "icon-192.png", badge: "icon-192.png", tag: id, data: { url: "./?go=soon" } });
    }
    lsSet("cm_notified", Object.fromEntries(Object.entries(done).slice(-200)));
  } catch (e) {}
}

/* ================= Scheda titolo: saga, note e tag, colore ================= */
async function xSheet(k, d, it) {
  xTint(d); xShareBlock(k, d);
  const sx = $("#sagax"); const c = d && d.belongs_to_collection;
  if (sx && c && it.media === "movie") {
    try {
      const r = await tmdb("/collection/" + c.id), ps = (r.parts || []).filter(x => x.poster_path && x.release_date).sort((a, b) => a.release_date.localeCompare(b.release_date));
      if (ps.length > 1 && $("#sagax")) {
        const items = ps.map(x => norm(x, "movie")); items.forEach(i => { ITEMS[i.key] = i; });
        const seen = items.filter(i => S.titles[i.key] && S.titles[i.key].watched).length;
        $("#sagax").innerHTML = `<h3 class="h">${esc(r.name || c.name)}</h3><p class="mu">Hai visto ${seen} film su ${items.length} di questa saga.</p>${rail(items)}`;
      }
    } catch (e) {}
  }
  const nx = $("#notex"); if (!nx) return;
  const t = S.titles[k] || {}, tags = (t.tags || []).slice();
  nx.innerHTML = `<details class="grp" ${t.note || tags.length ? "open" : ""}><summary>${ic("edit", 18)}<b>Note e tag</b><span class="mu">solo tue</span></summary><div class="gb"><textarea id="noteIn" rows="2" maxlength="500" placeholder="Un appunto privato (dove sei arrivato, cosa ti è piaciuto…)" aria-label="Note">${esc(t.note || "")}</textarea>
<div class="row" id="tagRow">${tags.map(g => `<span class="tag">${esc(g)}<button aria-label="Togli ${esc(g)}" onclick="tagDel('${k}','${esc(g).replace(/'/g, "")}')">×</button></span>`).join("")}<input id="tagIn" maxlength="24" placeholder="+ tag" aria-label="Nuovo tag" onkeydown="if(event.key==='Enter'){tagAdd('${k}',this.value)}"></div></div></details>`;
  $("#noteIn").addEventListener("change", e => put(it, { note: e.target.value.slice(0, 500) }).then(() => toast("Nota salvata")));
}
async function tagAdd(k, v) {
  const it = byKey(k); v = (v || "").trim().slice(0, 24).replace(/[<>"'`]/g, ""); if (!it || !v) return; const t = S.titles[k] || {}, tags = (t.tags || []).slice();
  if (tags.includes(v) || tags.length >= 12) return; tags.push(v); await put(it, { tags }); xSheet(k, {}, it);
}
async function tagDel(k, v) { const it = byKey(k), t = S.titles[k]; if (!it || !t) return; await put(it, { tags: (t.tags || []).filter(x => x.replace(/[<>"'`]/g, "") !== v && x !== v) }); xSheet(k, {}, it); }
function xTint(d) {
  if (!d || !d.poster_path) return;
  const im = new Image(); im.crossOrigin = "anonymous";
  im.onload = () => {
    try {
      const cv = document.createElement("canvas"); cv.width = cv.height = 12; const g = cv.getContext("2d"); g.drawImage(im, 0, 0, 12, 12);
      const px = g.getImageData(0, 0, 12, 12).data; let r = 0, gg = 0, b = 0, w = 0;
      for (let i = 0; i < px.length; i += 4) { const mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2]), s = (mx - mn) + 8; r += px[i] * s; gg += px[i + 1] * s; b += px[i + 2] * s; w += s; }
      const sh = $("#sheet .sheet"); if (sh && w) sh.style.setProperty("--tint", `rgba(${Math.round(r / w)},${Math.round(gg / w)},${Math.round(b / w)},.32)`);
    } catch (e) {}
  };
  im.src = IMG + "w92" + d.poster_path;
}

/* ================= Importazioni ================= */
async function unzip(file) {
  const buf = await file.arrayBuffer(), dv = new DataView(buf), u8 = new Uint8Array(buf), out = [];
  let e = -1; for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error("zip");
  let n = dv.getUint16(e + 10, true), p = dv.getUint32(e + 16, true);
  while (n-- > 0 && dv.getUint32(p, true) === 0x02014b50) {
    const m = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 20, true), us = dv.getUint32(p + 24, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + el + cl;
    if (!/\.(csv|json|txt)$/i.test(name) || us > 40e6 || /^__MACOSX/.test(name)) continue;
    const ds = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), data = u8.subarray(ds, ds + cs); let txt;
    if (m === 0) txt = new TextDecoder().decode(data);
    else if (m === 8 && typeof DecompressionStream !== "undefined") { const s = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")); txt = await new Response(s).text(); }
    else continue;
    out.push({ name: name.split("/").pop(), text: txt });
  }
  return out;
}
const rowsObj = txt => { const r = parseCSV(txt.replace(/^﻿/, "")); if (r.length < 2) return []; const h = r[0].map(x => x.trim().toLowerCase()); return r.slice(1).map(c => { const o = {}; h.forEach((k, i) => { o[k] = (c[i] || "").trim(); }); return o; }); };
const pick = (o, ...ks) => { for (const k of ks) if (o[k] != null && o[k] !== "") return o[k]; return ""; };
const nInt = v => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : NaN; };
const yearOf = v => (String(v || "").match(/(18|19|20)\d{2}/) || [""])[0];
const isDate = v => /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{4}/.test(v || "");

function xAdd(M, e) {
  const nm = (e.name || "").trim(); if (!nm && !e.ids) return;
  const id = e.ids || {}, key = e.media + "|" + (id.tmdb ? "#" + id.tmdb : id.imdb ? "@" + id.imdb : id.tvdb ? "~" + id.tvdb : nm.toLowerCase() + "|" + (e.year || ""));
  let x = M.get(key); if (!x) { x = { media: e.media, name: nm, year: e.year || "", ids: {}, eps: new Set(), watched: false, date: "", stars: 0, watchlist: false, follow: false }; M.set(key, x); }
  Object.assign(x.ids, Object.fromEntries(Object.entries(id).filter(([, v]) => v)));
  if (!x.name) x.name = nm; if (!x.year) x.year = e.year || "";
  (e.eps || []).forEach(k => x.eps.add(k));
  if (e.watched) x.watched = true; if (e.watchlist) x.watchlist = true; if (e.follow) x.follow = true;
  if (e.stars) x.stars = e.stars;
  if (e.date && (!x.date || e.date > x.date)) x.date = e.date;
}
const idsOf = o => { o = o || {}; return { tmdb: o.tmdb, imdb: o.imdb, tvdb: o.tvdb }; };

function parseTrakt(M, name, js) {
  if (!Array.isArray(js)) return 0; let n = 0;
  js.forEach(r => {
    const m = r.movie, s = r.show, o = m || s; if (!o || !o.title) return; const media = m ? "movie" : "tv", ids = idsOf(o.ids);
    const date = dateOf((r.last_watched_at || r.watched_at || r.rated_at || r.listed_at || "").slice(0, 10) || ""), eps = [];
    (r.seasons || []).forEach(se => (se.episodes || []).forEach(ep => { if (se.number > 0) eps.push(se.number + "-" + ep.number); }));
    const isWL = /watchlist/i.test(name), isRt = r.rating != null;
    xAdd(M, { media, name: o.title, year: o.year ? String(o.year) : "", ids, eps, date: r.last_watched_at || r.rated_at ? date : "", watched: !isWL && (media === "movie" ? (r.plays > 0 || isRt || /watched/i.test(name)) : false), watchlist: isWL, stars: isRt ? Math.max(1, Math.min(5, Math.round(r.rating / 2))) : 0 }); n++;
  });
  return n;
}
function parseLetterboxd(M, name, rows) {
  const wl = /watchlist/i.test(name); let n = 0;
  rows.forEach(r => {
    const nm = r.name; if (!nm) return; const rt = parseFloat(r.rating);
    xAdd(M, { media: "movie", name: nm, year: yearOf(r.year), date: isDate(r["watched date"]) ? dateOf(r["watched date"]) : (!wl && isDate(r.date) ? dateOf(r.date) : ""), watched: !wl, watchlist: wl, stars: rt > 0 ? Math.max(.5, Math.min(5, Math.round(rt * 2) / 2)) : 0 }); n++;
  });
  return n;
}
function parseTvTimeJson(M, name, js) {
  const arr = Array.isArray(js) ? js : (js.shows || js.series || js.movies || js.data || []); if (!Array.isArray(arr)) return 0; let n = 0;
  const idOf = o => { const i = o.id, x = (i && typeof i === "object") ? i : {}; return { tvdb: x.tvdb || (typeof i === "number" || /^\d+$/.test(String(i || "")) ? String(i) : "") || o.tvdb_id, imdb: x.imdb || o.imdb_id || o.imdb, tmdb: x.tmdb || o.tmdb_id }; };
  arr.forEach(o => {
    const nm = o.name || o.title || o.show_name || o.series_name; if (!nm) return;
    const isTv = !!(o.seasons || /series|show/i.test(name)) && !/movie/i.test(name);
    if (isTv && o.seasons) {
      const eps = [], ss = Array.isArray(o.seasons) ? o.seasons : Object.values(o.seasons);
      ss.forEach(se => { const sn = nInt(se.number != null ? se.number : se.season_number), es = Array.isArray(se.episodes) ? se.episodes : Object.values(se.episodes || {}); es.forEach(ep => { const en = nInt(ep.number != null ? ep.number : ep.episode_number); if (sn > 0 && en > 0 && (ep.is_watched || ep.watched || ep.watched_at)) eps.push(sn + "-" + en); }); });
      xAdd(M, { media: "tv", name: nm, year: yearOf(o.first_air_date || o.year), ids: idOf(o), eps, follow: true, date: o.watched_at ? dateOf(String(o.watched_at).slice(0, 10)) : "" }); n++;
    } else {
      const w = o.is_watched != null ? !!o.is_watched : (o.watched != null ? !!o.watched : true);
      xAdd(M, { media: "movie", name: nm, year: yearOf(o.release_date || o.year), ids: idOf(o), watched: w, watchlist: !w, date: (o.watched_at || o.created_at) ? dateOf(String(o.watched_at || o.created_at).slice(0, 10)) : "" }); n++;
    }
  });
  return n;
}
function parseTvTimeCsv(M, name, rows) {
  if (!rows.length) return 0; let n = 0; const lname = name.toLowerCase();
  rows.forEach(r => {
    const et = (pick(r, "entity_type", "type") || "").toLowerCase(), show = pick(r, "series_name", "tv_show_name", "show_name", "show", "series"), mv = pick(r, "movie_name", "movie_title");
    const sv = pick(r, "season_number", "s_no", "episode_season_number", "season"), ev = pick(r, "episode_number", "ep_no", "episode"), dv = pick(r, "watched_at", "watch_date", "seen_at", "created_at", "updated_at", "date");
    const date = isDate(dv) ? dateOf(dv) : "", wv = pick(r, "is_watched", "watched");
    if (wv && /^(false|0|no)$/i.test(wv)) return;
    const ids = { imdb: pick(r, "imdb_id", "imdb"), tvdb: pick(r, "tvdb_id", "series_id", "tv_show_id", "show_id") };
    if (/movie/.test(lname) || et === "movie" || mv) {
      const nm = mv || pick(r, "title", "name"); if (!nm) return;
      xAdd(M, { media: "movie", name: nm, year: yearOf(pick(r, "release_date", "year")), ids: { imdb: ids.imdb }, watched: true, date }); n++; return;
    }
    if (!show) return;
    const s = nInt(sv), e = nInt(ev);
    if (/follow/.test(lname) || (!(s > 0) && !(e > 0))) { xAdd(M, { media: "tv", name: show, ids, follow: true }); n++; return; }
    if (s > 0 && e > 0) { xAdd(M, { media: "tv", name: show, ids, eps: [s + "-" + e], follow: true, date }); n++; }
  });
  return n;
}
function classify(M, f) {
  const nm = f.name.toLowerCase(), r = { n: 0, src: "" };
  if (/\.json$/.test(nm)) {
    let js; try { js = JSON.parse(f.text); } catch (e) { return r; }
    const first = Array.isArray(js) ? js[0] : null;
    if (first && (first.movie || first.show) && !(/tvtime/.test(nm))) { r.n = parseTrakt(M, nm, js); r.src = "Trakt"; }
    else { r.n = parseTvTimeJson(M, nm, js); r.src = "TV Time"; }
    return r;
  }
  const first = (f.text.replace(/^﻿/, "").split(/\r?\n/)[0] || "").toLowerCase();
  if (first.includes("letterboxd uri") || (first.startsWith("date,name,year"))) { r.n = parseLetterboxd(M, nm, rowsObj(f.text)); r.src = "Letterboxd"; }
  else if (/tracking-prod|followed_tv|seen_episode|tvtime|tv_show|series_name|entity_type|movie_name/.test(nm + " " + first)) { r.n = parseTvTimeCsv(M, nm, rowsObj(f.text)); r.src = "TV Time"; }
  return r;
}
async function resolveEntry(e) {
  const m = e.media, tr = m === "tv"; let x = null, det = false;
  try {
    if (e.ids.tmdb) { x = await tmdb("/" + m + "/" + e.ids.tmdb).catch(() => null); det = !!x; }
    if (!x && e.ids.imdb && /^tt\d+$/.test(e.ids.imdb)) { const r = await tmdb("/find/" + e.ids.imdb, { external_source: "imdb_id" }).catch(() => null); x = r && (r[tr ? "tv_results" : "movie_results"] || [])[0]; }
    if (!x && tr && e.ids.tvdb && /^\d+$/.test(String(e.ids.tvdb))) { const r = await tmdb("/find/" + e.ids.tvdb, { external_source: "tvdb_id" }).catch(() => null); x = r && (r.tv_results || [])[0]; }
    if (!x && e.name) {
      const q = { query: e.name }; if (e.year) q[tr ? "first_air_date_year" : "year"] = e.year;
      let r = await tmdb("/search/" + m, q); x = r.results[0];
      if (!x && e.year) { r = await tmdb("/search/" + m, { query: e.name }); x = r.results[0]; }
    }
    if (!x) return null;
    const d = det ? x : await tmdb("/" + m + "/" + x.id).catch(() => x), it = norm(d, m);
    if (!it.genre_ids.length && d.genres) it.genre_ids = d.genres.map(g => g.id);
    it._d = d; return it;
  } catch (er) { return null; }
}
function applyEntry(e, it) {
  const old = S.titles[it.key] || {}, d = it._d || {}; delete it._d; let p;
  if (it.media === "tv") {
    const mt = tvMeta(d), eps = Object.assign({}, old.eps); e.eps.forEach(k => { eps[k] = true; }); eps._n = mt.n; eps._m = mt.m;
    const cnt = Object.keys(eps).filter(x => x[0] !== "_").length, done = e.watched || (mt.n > 0 && cnt >= mt.n);
    p = { eps, watched: old.watched || done, watched_on: old.watched_on || (done ? (e.date || today()) : null), runtime: done ? mt.n * mt.m : old.runtime || 0, watchlist: (old.watched || done) ? false : !!(old.watchlist || (e.follow && cnt === 0) || e.watchlist) };
  } else {
    p = e.watched ? { watched: true, watched_on: old.watched_on || e.date || today(), runtime: d.runtime || old.runtime || 0, watchlist: false } : { watchlist: !old.watched && (old.watchlist || e.watchlist) };
  }
  if (e.stars && !old.stars) p.stars = e.stars;
  S.titles[it.key] = Object.assign(blank(it), old, p);
  return it.key;
}
async function imp(inp) {
  const files = [...(inp.files || [])]; if (!files.length) return;
  XSAY("Leggo i file…"); const M = new Map(), plain = [], srcs = new Set(), docs = [];
  try {
    for (const f of files) {
      if (/\.zip$/i.test(f.name)) { try { (await unzip(f)).forEach(x => docs.push(x)); } catch (e) { imsg = "Non riesco ad aprire lo ZIP: prova a estrarlo e caricare i singoli file."; imsgMiss = []; render(); return; } }
      else docs.push({ name: f.name, text: await f.text(), file: f });
    }
    for (const f of docs) { const r = classify(M, f); if (r.n) srcs.add(r.src); else if (/\.(csv|txt)$/i.test(f.name)) plain.push(f.file || new File([f.text], f.name)); }
  } catch (e) { imsg = "Non riesco a leggere questi file."; imsgMiss = []; render(); return; }
  if (!M.size) { if (plain.length) return impText({ files: plain }); imsg = "Non ho trovato titoli riconoscibili: controlla di aver caricato i file giusti."; imsgMiss = []; render(); return; }
  const list = [...M.values()].slice(0, 1500), keys = new Set(), miss = []; let idx = 0, ok = 0;
  const work = async () => {
    while (idx < list.length) {
      const e = list[idx++]; XSAY(`Importazione ${idx} di ${list.length}…`);
      const it = await resolveEntry(e); if (!it) { miss.push(e.name); continue; }
      keys.add(applyEntry(e, it)); ok++;
    }
  };
  await Promise.all([work(), work(), work(), work(), work()]);
  affC = null; const ks = [...keys];
  try { for (let i = 0; i < ks.length; i += 150) await saveTitles(ks.slice(i, i + 150)); } catch (er) { toast("Salvataggio non riuscito: hai eseguito l’aggiornamento SQL?"); }
  const rest = plain.length ? " I file di testo semplice vengono importati a parte." : "";
  imsg = `${ok} titoli importati da ${[...srcs].join(", ")}` + (M.size > 1500 ? ` (letti i primi 1500 di ${M.size}: ripeti per i restanti)` : "") + "." + rest;
  imsgMiss = miss.slice(0, 15); render();
  if (plain.length) impText({ files: plain });
}
(function () {
  const net = SVC[0], prime = SVC[1]; SVC.length = 0;
  SVC.push(net, prime,
    ["TV Time", "Solo con un file esportato in passato", [
      `<b>Attenzione:</b> TV Time ha chiuso il 15 luglio 2026 e non è più possibile esportare i dati.`,
      `Se in passato hai scaricato l’esportazione (di solito uno ZIP con dentro tracking-prod-records-v2.csv, seen_episode.csv, followed_tv_show.csv oppure tvtime-series.json), caricala qui così com’è, anche senza estrarre lo ZIP.`,
      `Riconosco serie, episodi visti, film e serie seguite.`], "Se non hai più il file non si può recuperare la cronologia: puoi segnare le serie a mano dal Tracker."],
    ["Trakt", "Esportazione JSON", [
      `Su trakt.tv dal computer: profilo → Settings → Data → “Export Data”.`,
      `Carica lo ZIP qui sotto: leggo film e serie visti, voti e watchlist.`], "I voti vengono convertiti da 10 a 5 stelle."],
    ["Letterboxd", "Esportazione dal sito", [
      `Su letterboxd.com: Settings → Data → “Export your data”.`,
      `Carica lo ZIP qui sotto (o solo watched.csv, ratings.csv, watchlist.csv).`], ""],
    ["Altri servizi", "Disney+, Max, Apple TV+, Paramount+, NOW, RaiPlay", [
      `Questi servizi non hanno un pulsante di esportazione della cronologia.`,
      `Puoi chiedere una copia dei tuoi dati dalle impostazioni privacy dell’account (diritto di accesso GDPR): la risposta arriva in circa 30 giorni e il formato non è garantito.`,
      `Soluzione rapida: apri “Continua a guardare” o la cronologia sul servizio e scrivi i titoli in un file .txt (uno per riga). Poi caricalo qui.`], "Esempio di file: una riga per titolo, per esempio Inception, Parasite, Breaking Bad."]);
})();
AV.push(...[["🦁","#ffd43b","#e8590c"],["🐨","#adb5bd","#495057"],["🐰","#ffc9c9","#f06595"],["🐺","#868e96","#343a40"],["🦝","#9775fa","#364fc7"],["🐵","#d9a066","#8d5524"],["🐮","#e9ecef","#868e96"],["🐷","#ffa8c5","#e64980"],["🐔","#ffe066","#f59f00"],["🦆","#69db7c","#1971c2"],["🦅","#a5d8ff","#364fc7"],["🦋","#74c0fc","#9c36b5"],["🐝","#ffe066","#212529"],["🐢","#8ce99a","#087f5b"],["🐬","#66d9e8","#1971c2"],["🐳","#4dabf7","#1864ab"],["🦈","#91a7ff","#364fc7"],["🦖","#69db7c","#2b8a3e"],["🐲","#38d9a9","#5f3dc4"],["🦩","#ffa8a8","#d6336c"],["🦜","#ff6b6b","#2f9e44"],["👾","#845ef7","#212529"],["🤖","#adb5bd","#1971c2"],["👻","#e5dbff","#7048e8"],["🎃","#ff922b","#862e9c"],["🚀","#4263eb","#e64980"],["🌙","#364fc7","#845ef7"],["⭐","#ffd43b","#ff8787"],["🔥","#ff8787","#e8590c"],["🍿","#ffe066","#e03131"],["🎬","#495057","#212529"],["🍕","#ffa94d","#e03131"]]);
Object.assign(ICO, {
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', back: '<path d="M15 6l-6 6 6 6"/>'
});

/* ================= Impostazioni raggruppate ================= */
const grp = (t, i, body, open) => `<details class="grp" ${open ? "open" : ""}><summary>${ic(i, 20)}<b>${t}</b></summary><div class="gb">${body}</div></details>`;
const SETM = [
  ["Il tuo spazio", [["prof", "user", "#7048e8", "Profilo", () => P().name || "Foto e nome"], ["serv", "euro", "#06b6a0", "Abbonamenti", () => S.subs.length ? S.subs.length + (S.subs.length === 1 ? " servizio" : " servizi") : "Scegli i tuoi servizi"], ["imp", "download", "#e8590c", "Importa cronologia", () => "Netflix, TV Time, Trakt, Letterboxd"], ["amici", "users", "#d6336c", "Amici e richieste", () => !xUser() ? "Serve un account" : S.uname ? "@" + S.uname : "Scegli il tuo username"], ["skip", "ban", "#868e96", "Non mi interessa", () => { const n = Object.values(S.titles).filter(t => t.skipped).length; return n ? n + (n === 1 ? " titolo nascosto" : " titoli nascosti") : "Titoli che hai scartato"; }]]],
  ["App", [["look", "sliders", "#1c7ed6", "Aspetto", () => ({ dark: "Tema scuro", light: "Tema chiaro", auto: "Tema automatico" }[UI.theme] || "")], ["notif", "bell", "#f08c00", "Avvisi e spoiler", () => UI.remind ? "Promemoria attivi" : "Promemoria spenti"], ["paese", "globe", "#2f9e44", "Paese e installazione", () => ({ IT: "Italia", CH: "Svizzera", FR: "Francia", DE: "Germania", ES: "Spagna", GB: "Regno Unito", US: "Stati Uniti" }[R] || R)]]],
  ["Dati", [["dati", "shield", "#e03131", "Dati e privacy", () => "Backup, azzera, elimina account"]]]
];
const SETT = Object.fromEntries(SETM.flatMap(g => g[1]).map(r => [r[0], r[3]]));
const sblk = (t, d, body) => `<section class="blk">${t ? `<h3>${t}</h3>` : ""}${d ? `<p class="mu">${d}</p>` : ""}${body}</section>`;
const noH2 = h => h.replace(/<h2 class="h">[^<]*<\/h2>/g, "");
async function vSet2() {
  if (setTab === "altro") setTab = "look"; if (!SETT[setTab] && setTab !== "menu") setTab = "menu";
  const wide = innerWidth >= 900, page = setTab === "menu" && wide ? "prof" : setTab;
  const menu = `<nav class="setm" aria-label="Impostazioni">${SETM.map(([g, rows]) => `<h4>${g}</h4><div class="sl">${rows.map(([k, i, c, t, sub]) => `<button class="sr2 ${page === k ? "on" : ""}" onclick="setGo('${k}')"><span class="si" style="background:${c}">${ic(i, 18)}</span><span class="st"><b>${t}</b><small>${esc(sub())}</small></span><span class="sc">›</span></button>`).join("")}</div>`).join("")}${LEG}</nav>`;
  let body = "";
  if (page !== "menu") {
    const inner = page === "serv" ? await setServ() : page === "imp" ? setImp() : page === "look" ? setLook() : page === "notif" ? setNotif() : page === "paese" ? setPaese() : page === "dati" ? await setDati() : page === "skip" ? setSkip() : page === "amici" ? setAmici() : setProfile();
    body = `<section class="setp"><div class="seth"><button class="back" onclick="setGo('menu')">‹ Impostazioni</button><h2>${SETT[page]}</h2></div>${inner}</section>`;
  }
  return `<div class="sec pt"><div class="setw ${page === "menu" ? "menu" : "page"}">${menu}${body}</div></div>`;
}
function setSkip() {
  const l = Object.values(S.titles).filter(t => t.skipped).sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  if (!l.length) return sblk("", "", emptyBox("ban", "Non hai nascosto nulla. I titoli che scarti con “Non mi interessa” compariranno qui, e potrai ripensarci.", ""));
  return sblk("", "Questi titoli non ti vengono più proposti. Se hai cambiato idea, rimettili tra i consigli.", `<div class="skl">${l.map(t => `<div class="sk2">${t.poster ? `<img src="${IMG}w92${esc(t.poster)}" alt="" width="40" height="60">` : `<span class="nop"></span>`}<span class="st"><b>${esc(t.title)}</b><small>${esc(t.year || "")} · ${t.media === "tv" ? "Serie" : "Film"}</small></span><button class="btn" onclick="unskip('${esc(t.tmdb_key)}')">Ripensaci</button></div>`).join("")}</div><div class="row"><button class="btn" onclick="unskipAll()">Rimetti tutti</button></div>`);
}
async function unskip(k) { const it = byKey(k); if (!it) return; await put(it, { skipped: false }); toast("Di nuovo tra i consigli"); render(); }
async function unskipAll() {
  const ks = Object.keys(S.titles).filter(k => S.titles[k].skipped); if (!ks.length || !confirm("Rimettere tra i consigli tutti i " + ks.length + " titoli nascosti?")) return;
  ks.forEach(k => { const t = S.titles[k]; t.skipped = false; if (!(t.favorite || t.watched || t.watchlist || t.hype || epCount(t) > 0 || t.note || (t.tags || []).length)) delete S.titles[k]; }); affC = null;
  try { await saveTitles(ks); } catch (e) { toast("Salvataggio non riuscito"); } toast("Fatto"); render();
}
const setLook = () => sblk("", "", noH2(aspectBox()));
function setNotif() { return sblk("Promemoria uscite", "", xRemind()) + sblk("Senza spoiler", "", xSpoil()); }
const setPaese = () => sblk("Paese", "", `<p class="mu">Cambia la disponibilità dei titoli sui servizi.</p><select onchange="setRegion(this.value)">${[["IT", "Italia"], ["CH", "Svizzera"], ["FR", "Francia"], ["DE", "Germania"], ["ES", "Spagna"], ["GB", "Regno Unito"], ["US", "Stati Uniti"]].map(([v, l]) => `<option value="${v}" ${R === v ? "selected" : ""}>${l}</option>`).join("")}</select>`) + sblk("Installazione", "", noH2(installBox()));
async function setDati() {
  return (sb && user ? sblk("Consigli dalla community", "Se attivo, i tuoi voti alti (4-5 stelle) aiutano, in forma anonima, a consigliare titoli ad altre persone con gusti simili, e tu ricevi i loro. Nessuno vede chi sei o cosa hai votato: un titolo compare solo se è piaciuto ad almeno 3 persone.", `<div class="row"><button class="chip ${!P().nocommunity ? "on" : ""}" onclick="setCom(false)">Attivo</button><button class="chip ${P().nocommunity ? "on" : ""}" onclick="setCom(true)">Disattivato</button></div>`) : "") + sblk("Backup", "", `<p class="mu">Scarica tutti i tuoi dati in un file, o ripristinali da un backup.</p><div class="row"><button class="btn" onclick="exportData()">Scarica backup</button><label class="btn">Ripristina da file<input type="file" accept=".json" hidden onchange="importBackup(this)"></label></div>`)
    + sblk("Azzera", "", noH2(setData())) + (sb && user ? sblk("Elimina account", "Cancella per sempre l’account e tutti i dati collegati.", `<button class="btn danger" onclick="deleteAccount()">Elimina il mio account</button>`) : "") + noH2(await blockedBox());
}
function setProfile() {
  const p = P();
  return sblk("", "", `<div class="avbig">${avatarMe(96)}<div><b>${esc(p.name || "Il tuo nome")}</b><span class="mu">${sb && user ? (S.uname ? "@" + esc(S.uname) + " · " : "") + esc(user.email) : "Modalità locale"}</span>${sb && user ? `<button class="link small" onclick="setGo('amici')">${S.uname ? "Cambia username" : "Scegli il tuo username"}</button>` : ""}</div></div>`)
    + sblk("La tua foto", "Resta tua: gli altri vedono solo l’avatar qui sotto.", `<div class="row phr"><label class="btn pri">${ic("camera", 16)} Carica una foto<input type="file" accept="image/*" hidden onchange="setPhoto(this)"></label>${okPhoto(p.photo) ? `<button class="btn" onclick="delPhoto()">Rimuovi foto</button>` : ""}</div>`)
    + sblk("Oppure scegli un avatar", "Lo vedono gli amici e chi commenta con te.", `<div class="avs">${AV.map((a, i) => `<button class="avb ${p.avatar === i ? "on" : ""}" aria-label="Avatar ${i + 1}" onclick="setAv(${i})">${avatarHtml(i, 56)}</button>`).join("")}</div>`)
    + sblk("Nome", "Lo vedono anche gli amici e chi condivide una serata con te.", `<div class="row"><input id="un" type="text" maxlength="24" value="${esc(p.name)}" placeholder="Il tuo nome"><button class="btn pri" onclick="saveName()">Salva</button></div>`)
    + sblk("Account", sb && user ? "Accesso come " + esc(user.email) : "Modalità locale: i dati restano in questo browser. Configura Supabase per sincronizzarli.", sb && user ? `<button class="btn" onclick="logout()">Esci</button>` : "");
}
function setImp() {
  const s = SVC[svcSel] || SVC[0], done = /importat/.test(imsg);
  return `<h2 class="h">Porta qui la tua cronologia</h2><p class="mu">Segna in un colpo solo tutto ciò che hai già visto, così i consigli partono subito bene. Da dove arrivi?</p>
<div class="src">${SVC.map((x, i) => `<button class="srcb ${svcSel === i ? "on" : ""}" onclick="setSvc(${i})"><span>${esc(x[0][0])}</span>${esc(x[0])}</button>`).join("")}</div>
<div class="tut"><h3 class="h">1 · Scarica il file da ${esc(s[0])}</h3><p class="mu">${esc(s[1])}</p><ol>${s[2].map(x => `<li>${x}</li>`).join("")}</ol>${s[3] ? `<p class="mu">${s[3]}</p>` : ""}</div>
<h3 class="h">2 · Caricalo qui</h3>
<label class="drop" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();imp({files:event.dataTransfer.files})">
<input type="file" accept=".csv,.txt,.json,.zip,text/csv,text/plain,application/json,application/zip" multiple hidden onchange="imp(this)"><b>Scegli o trascina i file</b><span class="mu">CSV, TXT, JSON o ZIP, anche più di uno insieme</span></label>
<p id="imsg"><b>${esc(imsg)}</b></p>
${done ? `<div class="row"><button class="btn pri" onclick="trkTab='watch';go('list')">Vedi i titoli importati</button></div>` : ""}
${imsgMiss.length ? `<div class="note"><b>Non riconosciuti</b> (tocca per cercarli a mano)<div class="row">${imsgMiss.map((n, i) => `<button class="chip" onclick="missSearch(${i})">${esc(n)}</button>`).join("")}</div></div>` : ""}
<p class="mu small">Il file resta sul tuo dispositivo: a TMDB vengono inviati solo i titoli per riconoscerli. I servizi non offrono la sincronizzazione automatica, per questo serve questo passaggio.</p>`;
}
function missSearch(i) { const n = imsgMiss[i]; if (!n) return; openSearch(); $("#q").value = n; if (typeof qInput === "function") qInput(n); }
// "In arrivo" e "Insieme" nella barra laterale del PC
NAV.splice(4, 0, ["together", "users", "Insieme"]); delete NM.together;

/* ================= Insieme: novità, serata in due, liste condivise, amici ================= */
const TG = { tab: "new", room: null, busy: false, timer: 0, sig: "", prev: null, prevRoom: "" };
const XN = { inbox: [], t: 0 };
const tgErr = e => toast((e && e.message ? e.message : "Qualcosa non ha funzionato").replace(/^.*?:\s*/, ""));
const mini = i => ({ k: i.key, t: i.title.slice(0, 200), y: String(i.year || "").slice(0, 4), p: /^\/[A-Za-z0-9_.-]{1,60}$/.test(i.poster || "") ? i.poster : "", m: i.media });
const toIt = x => { const i = { key: x.k, media: x.m || x.k.split(":")[0], id: +x.k.split(":")[1], title: x.t, year: x.y || "", poster: x.p || null, genre_ids: [] }; if (!ITEMS[i.key]) ITEMS[i.key] = i; return ITEMS[i.key]; };
const tgShare = c => location.origin + location.pathname + "?room=" + c;
async function xInbox(force) {
  if (!xUser()) return []; if (!force && Date.now() - XN.t < 8000) return XN.inbox;
  try { const [r, f] = await Promise.all([sb.rpc("friend_inbox"), sb.rpc("friend_list")]); XN.inbox = r.error ? [] : (r.data || []); XN.req = f.error ? 0 : (f.data || []).filter(x => x.status === "pending" && x.incoming).length; } catch (e) { XN.inbox = []; } XN.t = Date.now(); return XN.inbox;
}
const xUnseen = () => XN.inbox.filter(m => !m.seen).length + (XN.req || 0);
const xTabFor = () => XN.inbox.some(m => !m.seen) ? "new" : XN.req ? "friends" : "duo";
async function xFriends() { const r = await sb.rpc("friend_list"); return ((r.data) || []).filter(x => x.status === "ok"); }

async function vTogether() {
  if (!xUser()) return `<div class="sec pt"><h2 class="h">${ic("users", 22)} Insieme</h2>${emptyBox("users", "Per scegliere in due, consigliarvi film e vedere cosa guardano gli amici serve un account: accedi o registrati.", "")}</div>`;
  clearInterval(TG.timer); await xInbox(true);
  const nm = XN.inbox.filter(m => !m.seen).length, tabs = [["new", "Novità" + (nm ? " (" + nm + ")" : "")], ["duo", "Serata in due"], ["lists", "Liste condivise"], ["friends", "Amici" + (XN.req ? " (" + XN.req + ")" : "")]];
  const intro = { new: "Consigli dei tuoi amici e quello che stanno guardando.", duo: "Scegliete insieme cosa guardare: ognuno vota dal proprio telefono.", lists: "Liste che si aggiornano per tutti, come “Da guardare con Marta”.", friends: "Aggiungi amici per scambiarvi consigli e serate. Vedono solo ciò che decidi di condividere." }[TG.tab];
  let body = ""; try { body = TG.tab === "new" ? await tgNew() : TG.tab === "duo" ? await tgDuo() : TG.tab === "lists" ? await tgLists() : await tgFriends(); } catch (e) { body = `<p class="mu">Non riesco a caricare: hai eseguito l’aggiornamento SQL in Supabase?</p>`; }
  return `<div class="sec pt"><h2 class="h">${ic("users", 22)} Insieme</h2><p class="mu">${intro}</p><div class="row">${tabs.map(([v, l]) => `<button class="chip ${TG.tab === v ? "on" : ""}" onclick="tgTab('${v}')">${l}</button>`).join("")}</div>${body}</div>`;
}
function tgTab(v) { TG.tab = v; TG.room = null; render(); }

/* --- Novità: consigli e inviti --- */
const msgHtml = m => {
  const nm = esc(m.name || "Un amico"), note = m.note ? `<p class="mu">“${esc(m.note)}”</p>` : "", id = esc(m.id);
  if (m.kind === "title" && m.item) {
    const i = toIt(m.item);
    return `<div class="msg ${m.seen ? "" : "new"}"><div class="mpo" onclick="msgOpen('${id}')">${i.poster ? `<img src="${IMG}w185${esc(i.poster)}" alt="">` : ""}</div><div class="mb"><span><b>${nm}</b> ti consiglia <b>${esc(i.title)}</b></span>${note}<div class="row"><button class="btn pri" onclick="msgOpen('${id}')">Apri</button><button class="btn" onclick="msgWl('${id}')">${ic("plus", 14)} In lista</button><button class="btn" onclick="msgDel('${id}')" aria-label="Elimina">${ic("x", 14)}</button></div></div></div>`;
  }
  const what = m.kind === "duo" ? "ti invita a scegliere cosa guardare insieme" : "ti invita a una lista condivisa";
  return `<div class="msg ${m.seen ? "" : "new"}"><div class="mpo mav">${avatarHtml(m.avatar || 0, 54)}</div><div class="mb"><span><b>${nm}</b> ${what}</span>${note}<div class="row"><button class="btn pri" onclick="msgJoin('${id}')">Entra</button><button class="btn" onclick="msgDel('${id}')">Non ora</button></div></div></div>`;
};
const msgById = id => XN.inbox.find(m => m.id === id);
async function msgDone(id, del) { try { await sb.rpc("friend_msg_done", { p_id: id, p_delete: !!del }); } catch (e) {} const m = msgById(id); if (m) { if (del) XN.inbox = XN.inbox.filter(x => x.id !== id); else m.seen = true; } }
async function msgOpen(id) { const m = msgById(id); if (!m || !m.item) return; await msgDone(id, false); openSheet(toIt(m.item).key); }
async function msgWl(id) { const m = msgById(id); if (!m || !m.item) return; const i = toIt(m.item); await put(i, { watchlist: true, skipped: false }); await msgDone(id, true); toast("Aggiunto alla tua lista"); render(); }
async function msgDel(id) { await msgDone(id, true); render(); }
async function msgJoin(id) { const m = msgById(id); if (!m || !m.code) return; await msgDone(id, true); await tgJoin(m.code); }
async function tgNew() {
  const [fl, fd] = await Promise.all([xFriends(), sb.rpc("friend_feed")]), feed = fd.data || [];
  const msgs = XN.inbox;
  let h = msgs.length ? `<h3 class="h">Per te</h3><div class="msgs">${msgs.map(msgHtml).join("")}</div>` : "";
  if (feed.length) h += `<h3 class="h">Cosa guardano gli amici</h3>${feed.map(f => `<div class="cost" onclick="openSheet('${esc(f.tmdb_key)}')">${f.poster ? `<img src="${IMG}w92${esc(f.poster)}" alt="" width="34" height="50">` : ""}<span><b>${esc(f.name || "Un amico")}</b> ha visto <b>${esc(f.title)}</b>${f.stars ? " · " + stTxt(f.stars) : ""}<br><small class="mu">${esc(fmtD(f.watched_on))}</small></span></div>`).join("")}`;
  if (!msgs.length && !feed.length) h = emptyBox("users", fl.length ? "Nessuna novità per ora. Apri la scheda di un film e usa “Consiglia a un amico”, oppure invita qualcuno a una serata in due." : "Ancora nessun amico. Aggiungine uno e potrete consigliarvi film e scegliere insieme la serata.", `<button class="btn pri" onclick="tgTab('${fl.length ? "duo" : "friends"}')">${fl.length ? "Scegli con un amico" : "Aggiungi un amico"}</button>`);
  return h;
}

/* --- Serata in due: si invita un amico, che riceve la richiesta nell'app --- */
async function tgRooms(kind) { const r = await sb.from("rooms").select("*").eq("kind", kind).order("created_at", { ascending: false }); if (r.error) throw r.error; return r.data || []; }
async function tgLoad(id) {
  const [r, m] = await Promise.all([sb.from("rooms").select("*").eq("id", id).maybeSingle(), sb.from("room_members").select("user_id,name,avatar,votes").eq("room_id", id)]);
  if (r.error || !r.data) return null; return { room: r.data, members: m.data || [] };
}
function myWl(n) { return Object.values(S.titles).filter(t => t.watchlist && !t.watched && t.poster).slice(0, n).map(rowItem); }
async function tgJoin(code) {
  try {
    const r = await sb.rpc("join_room", { p_code: code, p_uname: P().name || "Ospite", p_avatar: P().avatar || 0 }); if (r.error) throw r.error;
    if (r.data.kind === "duo") { const own = myWl(8).map(mini); if (own.length) await sb.rpc("room_contribute", { p_room: r.data.id, p_items: own }); }
    TG.tab = r.data.kind === "duo" ? "duo" : "lists"; TG.room = r.data.id; go("together"); render();
  } catch (e) { tgErr(e); }
}
var tgDuo; /* definita più avanti */
async function tgGroup() {
  if (TG.busy) return; TG.busy = true;
  try {
    toast("Preparo la serata di gruppo…");
    const wl = myWl(8), seen = new Set(wl.map(i => i.key)), items = wl.concat((await recItems(40)).filter(i => i.poster && !seen.has(i.key))).slice(0, 30).map(mini);
    const r = await sb.rpc("create_room", { p_kind: "duo", p_name: "Serata di gruppo", p_items: items, p_uname: P().name || "Ospite", p_avatar: P().avatar || 0 }); if (r.error) throw r.error;
    TG.room = r.data.id; TG.busy = false; render();
  } catch (e) { TG.busy = false; tgErr(e); }
}
async function tgInvite(uid, forRoom) {
  if (TG.busy) return; TG.busy = true;
  try {
    let room = forRoom;
    if (!room) {
      toast("Preparo la serata…");
      const wl = myWl(8), seen = new Set(wl.map(i => i.key)), items = wl.concat((await recItems(30)).filter(i => i.poster && !seen.has(i.key))).slice(0, 22).map(mini);
      const fr = (await xFriends()).find(f => f.user_id === uid);
      const r = await sb.rpc("create_room", { p_kind: "duo", p_name: ("Serata con " + (fr && fr.name || "un amico")).slice(0, 60), p_items: items, p_uname: P().name || "Ospite", p_avatar: P().avatar || 0 }); if (r.error) throw r.error;
      room = r.data; TG.room = room.id;
    }
    const s = await sb.rpc("friend_send", { p_to: uid, p_kind: "duo", p_item: null, p_code: room.code, p_note: "" }); if (s.error) throw s.error;
    toast("Invito inviato: ti aspetta nella serata"); TG.busy = false; render();
  } catch (e) { TG.busy = false; tgErr(e); }
}
async function tgRoom() {
  const x = await tgLoad(TG.room); if (!x) { TG.room = null; return await tgDuo(); }
  TG.sig = JSON.stringify(x.members.map(m => m.votes)) + x.members.length;
  const { room, members } = x, me = members.find(m => m.user_id === user.id) || { votes: {} }, items = room.items || [];
  // la TV che "lascia decidere ai telefoni" resta nella serata ma non vota (_tv)
  const others = members.filter(m => m.user_id !== user.id), pos = v => v === 1 || v === 2, voters = members.filter(m => !(m.votes || {})._tv), all = voters.length > 1 ? items.filter(i => voters.every(m => m.votes && pos(m.votes[i.k]))) : [];
  const vOf = i => voters.map(m => (m.votes || {})[i.k]), yes = i => vOf(i).filter(pos).length, supers = i => vOf(i).filter(v => v === 2).length, vetoed = i => vOf(i).some(v => v === -1);
  const grp = voters.length > 2, need = Math.ceil(voters.length / 2);
  const rank = grp ? items.filter(i => !vetoed(i) && yes(i) >= need && !all.includes(i)).sort((a, b) => (yes(b) + supers(b)) - (yes(a) + supers(a))).slice(0, 5) : [];
  const used = v => Object.values(me.votes || {}).filter(x => x === v).length;
  const next = items.find(i => (me.votes || {})[i.k] == null), left = items.filter(i => (me.votes || {})[i.k] == null).length;
  if (next) toIt(next); all.forEach(toIt); window.__tgAll = all.map(i => i.k);
  if (TG.prevRoom === room.id && TG.prev != null && all.length > TG.prev) matchModal(all[all.length - 1], members);
  TG.prev = all.length; TG.prevRoom = room.id;
  TG.timer = setInterval(async () => {
    if (view !== "together" || !TG.room) return clearInterval(TG.timer);
    const y = await tgLoad(TG.room); if (!y) return; if (JSON.stringify(y.members.map(m => m.votes)) + y.members.length !== TG.sig) render();
  }, 5000);
  rank.forEach(toIt);
  const who = others.length ? others.map(m => `<span class="fav">${avatarHtml(m.avatar || 0, 28)}</span> ${esc(m.name || "Ospite")}`).join(" · ") : "In attesa che qualcuno entri";
  return `<div class="row"><button class="back" onclick="TG.room=null;render()">‹ Indietro</button><button class="btn danger" onclick="tgLeave('${esc(room.id)}',${room.owner === user.id})">${room.owner === user.id ? "Elimina" : "Esci"}</button></div>
<div class="gcard"><b>${esc(room.name)}</b><span class="mu">${who}</span>${others.length ? `<span class="mu">${voters.map(m => esc(m.name || "Ospite") + ": " + Object.keys(m.votes || {}).filter(k => k[0] !== "_").length + "/" + items.length).join(" · ")}</span>` : ""}
${members.length < 6 ? `<div class="row"><button class="btn" onclick="tgInviteMore('${esc(room.code)}')">${ic("users", 14)} Invita amici</button><button class="btn" onclick="tgShareLink('${esc(room.code)}')">${ic("share", 14)} Condividi link</button></div><span class="mu small">Codice serata: <b>${esc(room.code)}</b> · fino a 6 persone (${members.length} ora)</span>` : `<span class="mu small">La serata è al completo (6 persone)</span>`}</div>
${rank.length ? `<h3 class="h">In testa nel gruppo</h3><p class="mu">Servono almeno ${need} sì su ${voters.length}. I titoli con veto sono esclusi.</p><div class="mvs">${rank.map(i => `<div>${card(toIt(i))}<div class="mu small" style="text-align:center">${yes(i)}/${voters.length} sì${supers(i) ? " · ★" : ""}</div></div>`).join("")}</div>` : ""}
${all.length ? `<h3 class="h">Piacciono a tutti (${all.length})</h3><div class="row"><button class="btn pri" onclick="tgPick()">${ic("dice", 16)} Scegli per noi</button></div><div class="mvs">${all.map(i => card(toIt(i))).join("")}</div>` : ""}
${next ? `<h3 class="h">Tocca a te <span class="mu">(${left} da votare)</span></h3><div class="duo"><div class="duop" onclick="openSheet('${esc(next.k)}')">${next.p ? `<img src="${IMG}w342${esc(next.p)}" alt="">` : ""}</div><b>${esc(next.t)}</b><span class="mu">${esc(next.y)}</span>
<div class="row"><button class="btn" onclick="tgVote('${esc(next.k)}',0)">${ic("x", 16)} Passo</button><button class="btn pri" onclick="tgVote('${esc(next.k)}',1)">${ic("heart", 16)} Mi piace</button></div>
<div class="row"><button class="btn sm" ${used(2) ? "disabled" : ""} onclick="tgVote('${esc(next.k)}',2)" title="Un super-voto a serata: questo titolo conta doppio">${ic("star", 14)} Super-voto${used(2) ? " (usato)" : ""}</button><button class="btn sm danger" ${used(-1) ? "disabled" : ""} onclick="tgVote('${esc(next.k)}',-1)" title="Un veto a serata: nessuno potrà sceglierlo">${ic("ban", 14)} Veto${used(-1) ? " (usato)" : ""}</button></div></div>` : `<p class="mu">Hai votato tutto${others.length ? "! Attendi che finisca anche l’altra persona." : "."}</p>`}`;
}
async function tgInviteMore(code) {
  const fr = await xFriends(); if (!fr.length) { toast("Prima aggiungi un amico"); return tgTab("friends"); }
  amenu("Invita a questa serata", fr.map(f => ["moon", esc(f.name || "Amico"), `tgSendCode('${esc(f.user_id)}','duo','${esc(code)}')`]));
}
async function tgSendCode(uid, kind, code) { const r = await sb.rpc("friend_send", { p_to: uid, p_kind: kind, p_item: null, p_code: code, p_note: "" }); if (r.error) return tgErr(r.error); toast("Invito inviato"); }
function tgPick() { const a = window.__tgAll || []; if (a.length) openSheet(a[Math.floor(Math.random() * a.length)]); }
async function tgVote(k, v) {
  const x = await tgLoad(TG.room); if (!x) return; const me = x.members.find(m => m.user_id === user.id); if (!me) return;
  if ((v === 2 || v === -1) && Object.values(me.votes || {}).some(x => x === v)) return toast(v === 2 ? "Hai già usato il super-voto" : "Hai già usato il veto");
  const votes = Object.assign({}, me.votes, { [k]: v }); delete votes._tv; const r = await sb.from("room_members").update({ votes }).eq("room_id", TG.room).eq("user_id", user.id);
  if (r.error) return tgErr(r.error); if (typeof vib === "function") vib(10); render();
}
async function tgLeave(id, own) {
  if (!confirm(own ? "Eliminare questa stanza per tutti?" : "Uscire da questa stanza?")) return;
  const r = own ? await sb.from("rooms").delete().eq("id", id) : await sb.from("room_members").delete().eq("room_id", id).eq("user_id", user.id);
  if (r.error) return tgErr(r.error); TG.room = null; render();
}
async function tgShareLink(c) {
  const url = tgShare(c), txt = "Scegliamo insieme cosa guardare su " + (C.APP_NAME || "Tonightly");
  try { if (navigator.share) { await navigator.share({ title: txt, text: txt, url }); return; } await navigator.clipboard.writeText(url); toast("Link copiato"); } catch (e) {}
}

/* --- Liste condivise --- */
async function tgLists() {
  if (TG.room) {
    const x = await tgLoad(TG.room); if (!x) { TG.room = null; return await tgLists(); }
    const { room, members } = x, items = room.items || [];
    return `<div class="row"><button class="back" onclick="TG.room=null;render()">‹ Indietro</button><button class="btn" onclick="tgInviteList('${esc(room.code)}')">${ic("users", 16)} Invita un amico</button><button class="btn danger" onclick="tgLeave('${esc(room.id)}',${room.owner === user.id})">${room.owner === user.id ? "Elimina" : "Esci"}</button></div>
<h3 class="h">${esc(room.name)}</h3><p class="mu">${members.map(m => esc(m.name || "Ospite")).join(", ")}</p>
<div class="row"><input id="tgQ" maxlength="60" placeholder="Cerca un titolo da aggiungere" aria-label="Cerca" oninput="tgSearch('${esc(room.id)}',this.value)"></div><div id="tgRes"></div>
${items.length ? `<div class="mvs">${items.map(i => `<div class="mvd">${card(toIt(i))}<button class="btn" onclick="tgRm('${esc(room.id)}','${esc(i.k)}')">${ic("trash", 14)} Togli</button></div>`).join("")}</div>` : emptyBox("list", "La lista è vuota.", "")}`;
  }
  const rooms = await tgRooms("list");
  return `<div class="row"><button class="btn pri" onclick="tgNewList()">${ic("plus", 16)} Nuova lista condivisa</button></div>
${rooms.length ? `<h3 class="h">Le tue liste</h3>${rooms.map(r => `<button class="amb" onclick="TG.room='${esc(r.id)}';render()">${ic("list", 18)}<span>${esc(r.name || "Lista")} · ${(r.items || []).length} titoli</span></button>`).join("")}` : ""}
<details class="grp"><summary><b>Ho un codice</b></summary><div class="gb"><div class="row"><input id="tgCode" maxlength="12" placeholder="CODICE" aria-label="Codice" style="text-transform:uppercase"><button class="btn" onclick="tgJoin($('#tgCode').value)">Unisciti</button></div></div></details>`;
}
async function tgInviteList(code) {
  const fr = await xFriends(); if (!fr.length) { toast("Prima aggiungi un amico"); return tgTab("friends"); }
  amenu("Invita a questa lista", fr.map(f => ["list", esc(f.name || "Amico"), `tgSendCode('${esc(f.user_id)}','list','${esc(code)}')`]));
}
async function tgNewList() {
  const n = (prompt("Nome della lista condivisa") || "").trim().slice(0, 60); if (!n) return;
  const r = await sb.rpc("create_room", { p_kind: "list", p_name: n, p_items: [], p_uname: P().name || "Ospite", p_avatar: P().avatar || 0 }); if (r.error) return tgErr(r.error); TG.room = r.data.id; render();
}
let tgT = 0;
function tgSearch(room, q) {
  clearTimeout(tgT); q = q.trim(); if (q.length < 2) { $("#tgRes").innerHTML = ""; return; }
  tgT = setTimeout(async () => {
    try {
      const r = await tmdb("/search/multi", { query: q }), res = r.results.filter(x => (x.media_type === "movie" || x.media_type === "tv") && x.poster_path).slice(0, 6).map(x => { const i = norm(x, x.media_type); ITEMS[i.key] = i; return i; });
      if ($("#tgRes")) $("#tgRes").innerHTML = res.map(i => `<div class="cost"><img src="${IMG}w92${i.poster}" alt="" width="34" height="50"><span><b>${esc(i.title)}</b><br><small class="mu">${esc(i.year)} · ${i.media === "tv" ? "Serie" : "Film"}</small></span><button class="btn pri" onclick="sharedAdd('${esc(room)}','${i.key}',true)" aria-label="Aggiungi">${ic("plus", 14)}</button></div>`).join("") || `<p class="mu">Nessun risultato.</p>`;
    } catch (e) {}
  }, 350);
}
async function tgRm(room, k) { const r = await sb.rpc("room_edit", { p_room: room, p_op: "remove", p_item: { k } }); if (r.error) return tgErr(r.error); render(); }
async function sharedPick(k) {
  if (!xUser()) return toast("Accedi per usare le liste condivise");
  try {
    const rooms = await tgRooms("list");
    if (!rooms.length) { toast("Non hai ancora liste condivise: creane una da “Insieme”"); return; }
    amenu("Aggiungi a una lista condivisa", rooms.map(r => ["users", esc(r.name || "Lista"), `sharedAdd('${esc(r.id)}','${esc(k)}')`]));
  } catch (e) { tgErr(e); }
}
async function sharedAdd(room, k, re) {
  const it = byKey(k); if (!it) return; const r = await sb.rpc("room_edit", { p_room: room, p_op: "add", p_item: mini(it) });
  if (r.error) return tgErr(r.error); toast("Aggiunto alla lista condivisa"); if (re) render();
}

/* --- Amici --- */
const uTag = r => r && r.username ? `<small class="mu">@${esc(r.username)}</small>` : "";
const frRow = (r, btns) => `<div class="cost frr"><span class="fav">${avatarHtml(r.avatar || 0, 40)}</span><span class="frn"><b>${esc(r.name || (r.username ? "@" + r.username : "Utente"))}</b>${uTag(r)}</span>${btns}</div>`;
async function tgFriends() {
  const code = await sb.rpc("my_friend_code"); if (code.error) throw code.error;
  const [fl, st, cmp] = await Promise.all([sb.rpc("friend_list"), sb.from("settings").select("share_activity").eq("user_id", user.id).maybeSingle(), typeof xCompat === "function" ? xCompat(true).catch(() => []) : []]);
  const cm = id => typeof cmpChip === "function" ? cmpChip((cmp || []).find(c => c.user_id === id)) : "";
  const rows = fl.data || [], inc = rows.filter(r => r.status === "pending" && r.incoming), ok = rows.filter(r => r.status === "ok").sort((a, b) => (a.name || a.username || "").localeCompare(b.name || b.username || "")), pend = rows.filter(r => r.status === "pending" && !r.incoming), share = !!(st.data && st.data.share_activity);
  XN.req = inc.length;
  const me = S.uname ? `<p class="mu">Il tuo username è <b>@${esc(S.uname)}</b>: chi lo conosce può cercarti.</p>` : "";
  return `${inc.length ? `<h3 class="h">Richieste di amicizia <span class="nbi">${inc.length}</span></h3>${inc.map(r => frRow(r, `<button class="btn pri" onclick="frResp('${esc(r.user_id)}',true)">Accetta</button><button class="btn" onclick="frResp('${esc(r.user_id)}',false,1)">Rifiuta</button>`)).join("")}` : ""}
<h3 class="h">Aggiungi un amico</h3>${me}
<div class="frs"><span class="at">@</span><input id="frQ" maxlength="21" placeholder="Cerca per username" aria-label="Cerca per username" autocomplete="off" autocapitalize="none" spellcheck="false" oninput="frSearch(this.value)"></div>
<div id="frRes"></div>
${pend.length ? `<h3 class="h">Richieste inviate</h3>${pend.map(r => frRow(r, `<span class="mu small">In attesa</span><button class="btn" onclick="frResp('${esc(r.user_id)}',false,2)">Annulla</button>`)).join("")}` : ""}
<h3 class="h">I tuoi amici${ok.length ? " · " + ok.length : ""}</h3>${ok.length ? ok.map(r => frRow(r, `${cm(r.user_id)}<button class="btn" onclick="tgInvite('${esc(r.user_id)}')">${ic("moon", 14)} Serata</button><button class="btn" onclick="frResp('${esc(r.user_id)}',false)" aria-label="Rimuovi ${esc(r.name || r.username || "")}">${ic("trash", 14)}</button>`)).join("") : `<p class="mu">Ancora nessun amico: cercali per username o mandagli il tuo link.</p>`}
<details class="grp"><summary>${ic("share", 18)}<b>Codice amico e link</b></summary><div class="gb"><p class="mu">Il tuo codice: <b class="code">${esc(code.data)}</b>. Funziona anche se scegli di non comparire nella ricerca.</p>
<div class="row"><button class="btn pri" onclick="frInvite('${esc(code.data)}')">${ic("share", 16)} Invia il mio link</button></div>
<div class="row"><input id="frCode" maxlength="12" placeholder="Codice di un amico" aria-label="Codice amico" style="text-transform:uppercase"><button class="btn" onclick="frAdd()">Aggiungi</button></div></div></details>
<h3 class="h">Cosa condividi</h3><p class="mu">Se attivi, i tuoi amici vedono i titoli che segni come visti (con le stelle) e, nella scheda, che li hai visti. Di default è tutto privato.</p>
<div class="row"><button class="chip ${!share ? "on" : ""}" onclick="frShare(false)">Niente</button><button class="chip ${share ? "on" : ""}" onclick="frShare(true)">Mostra cosa guardo</button></div>
<p class="mu small">Chi può mandarti richieste lo scegli in <a href="#" onclick="setTab='amici';go('set');return false">Impostazioni › Amici e richieste</a>.</p>`;
}
let frT = 0;
function frSearch(q) {
  clearTimeout(frT); const box = $("#frRes"); if (!box) return;
  q = uNorm(q); if (q.length < 3) { box.innerHTML = q ? `<p class="mu small">Scrivi almeno 3 caratteri</p>` : ""; return; }
  frT = setTimeout(async () => {
    const r = await sb.rpc("user_search", { p_q: q }); if ($("#frQ") && uNorm($("#frQ").value) !== q) return;
    if (r.error) { box.innerHTML = `<p class="mu small">Ricerca non disponibile: esegui l’aggiornamento SQL.</p>`; return; }
    const L = r.data || [];
    box.innerHTML = L.length ? L.map(u => frRow(u, u.rel === "friend" ? `<span class="pill">Amici</span>` : u.rel === "sent" ? `<span class="mu small">Richiesta inviata</span><button class="btn" onclick="frResp('${esc(u.user_id)}',false,2)">Annulla</button>` : u.rel === "received" ? `<button class="btn pri" onclick="frResp('${esc(u.user_id)}',true)">Accetta</button>` : `<button class="btn pri" onclick="frReqUser('${esc(u.user_id)}',this)">${ic("plus", 14)} Aggiungi</button>`)).join("") : `<p class="mu small">Nessuno trovato con “@${esc(q)}”. Alcune persone scelgono di non comparire nella ricerca: in quel caso serve il loro codice.</p>`;
  }, 300);
}
async function frReqUser(id, b) {
  if (b) b.disabled = true;
  const r = await sb.rpc("friend_request_user", { p_user: id }); if (r.error) { if (b) b.disabled = false; return tgErr(r.error); }
  toast(r.data === "ok" ? "Ora siete amici" : "Richiesta inviata"); vib(10); render();
}
async function frInvite(c) {
  const url = location.origin + location.pathname + "?friend=" + c, txt = "Aggiungimi su " + (C.APP_NAME || "Tonightly") + " per scambiarci consigli e scegliere insieme cosa guardare";
  try { if (navigator.share) { await navigator.share({ title: txt, text: txt, url }); return; } await navigator.clipboard.writeText(url); toast("Link copiato"); } catch (e) {}
}
async function frAdd() { const c = ($("#frCode").value || "").trim(); if (!c) return; const r = await sb.rpc("friend_request", { p_code: c }); if (r.error) return tgErr(r.error); toast(r.data === "ok" ? "Ora siete amici" : "Richiesta inviata"); render(); }
async function frResp(u, a, kind) {
  if (!a && !kind && !confirm("Rimuovere questo amico?")) return;
  const r = await sb.rpc("friend_respond", { p_from: u, p_accept: a }); if (r.error) return tgErr(r.error);
  toast(a ? "Ora siete amici" : kind === 1 ? "Richiesta rifiutata" : kind === 2 ? "Richiesta annullata" : "Amico rimosso"); await xInbox(true); render();
}
async function frShare(v) { const r = await sb.from("settings").upsert({ user_id: user.id, share_activity: v }); if (r.error) return tgErr(r.error); toast(v ? "Gli amici vedranno cosa guardi" : "Attività nascosta"); render(); }

/* --- Scheda titolo: condividi, consiglia, chi l'ha visto --- */
async function xShareBlock(k, d) {
  const box = $("#frx"); if (!box) return;
  box.innerHTML = `<div class="row">${xUser() ? `<button class="btn" onclick="shareMenu('${esc(k)}')">${ic("share", 16)} Condividi o invia</button>` : `<button class="btn" onclick="shareTitle('${esc(k)}')">${ic("share", 16)} Condividi</button>`}${arrBtn(k, d)}</div><div id="frw"></div>`;
  if (!xUser()) return;
  try {
    const r = await sb.rpc("friend_title", { p_key: k }), l = r.data || [];
    if (l.length && $("#frw")) $("#frw").innerHTML = `<p class="mu fw">Visto da ${l.map(f => `<span class="fav">${avatarHtml(f.avatar || 0, 22)}</span> <b>${esc(f.name || "Un amico")}</b>${f.stars ? " " + stTxt(f.stars) : ""}`).join(" · ")}</p>`;
  } catch (e) {}
}
function shareMenu(k) {
  amenu("Condividi o invia", [["share", "Condividi il link", `shareTitle('${k}')`], ["users", "Consiglia a un amico", `recPick('${k}')`], ["tv", "Invia a un altro dispositivo", `devSend('${k}')`]]);
}
async function shareTitle(k) {
  const it = byKey(k); if (!it) return; const url = location.origin + location.pathname + "?t=" + k, txt = "Guarda “" + it.title + "” con me su " + (C.APP_NAME || "Tonightly");
  try { if (navigator.share) { await navigator.share({ title: it.title, text: txt, url }); return; } await navigator.clipboard.writeText(url); toast("Link copiato"); } catch (e) {}
}
async function recPick(k) {
  try {
    const fr = await xFriends(); if (!fr.length) { toast("Aggiungi prima un amico dalla sezione Insieme"); return; }
    amenu("Consiglia a…", fr.map(f => ["users", esc(f.name || "Amico"), `recSend('${esc(f.user_id)}','${esc(k)}')`]));
  } catch (e) { tgErr(e); }
}
async function recSend(uid, k) {
  const it = byKey(k); if (!it) return; const r = await sb.rpc("friend_send", { p_to: uid, p_kind: "title", p_item: mini(it), p_code: null, p_note: "" });
  if (r.error) return tgErr(r.error); toast("Consiglio inviato");
}
async function xFriendRail() {
  if (!xUser()) return ""; const m = (await xInbox()).filter(x => x.kind === "title" && x.item && !x.seen).slice(0, 12); if (!m.length) return "";
  return `<div class="sec"><h2 class="h">Consigliati dagli amici</h2>${rail(m.map(x => ({ it: toIt(x.item), extra: "da " + (x.name || "un amico") })))}<p class="mu"><button class="link" onclick="TG.tab='new';go('together')">Vedi tutti i messaggi</button></p></div>`;
}

/* ================= Avvio ================= */
async function openByKey(tk) {
  if (!/^(movie|tv):\d{1,9}$/.test(tk)) return false;
  try { const m = tk.split(":")[0], d = await tmdb("/" + m + "/" + tk.split(":")[1]), it = norm(d, m); ITEMS[it.key] = it; openSheet(it.key); return true; } catch (e) { return false; }
}
/* Invia a un altro dispositivo: il titolo si apre da solo sull'altro dispositivo con lo stesso account */
const DEV = (() => { let d = lsGet("cm_dev", ""); if (!d) { d = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); lsSet("cm_dev", d); } return d; })();
async function devSend(k) {
  try { const r = await sb.rpc("device_send", { p_dev: DEV, p_item: k }); if (r.error) throw r.error; toast("Inviato: si aprirà sull’altro dispositivo (stesso account, app aperta)"); } catch (e) { toast("Invio non riuscito"); }
}
let devBusy = false;
async function devPoll() {
  if (devBusy || !xUser() || document.hidden) return; devBusy = true;
  try { const r = await sb.rpc("device_poll", { p_dev: DEV }); if (r.data && await openByKey(r.data)) toast("Aperto dal tuo altro dispositivo"); } catch (e) {}
  devBusy = false;
}
setInterval(devPoll, 5000); document.addEventListener("visibilitychange", () => { if (!document.hidden) devPoll(); });
async function xBoot() {
  try {
    xUserGate();
    const q = new URLSearchParams(location.search); const fr = (q.get("friend") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12); let code = (q.get("room") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12), g = q.get("go");
    if (fr) { if (xUser()) { const r = await sb.rpc("friend_request", { p_code: fr }); toast(r.error ? "Codice amico non valido" : r.data === "ok" ? "Ora siete amici" : "Richiesta inviata"); TG.tab = "friends"; go("together"); } else { lsSet("cm_friend", fr); toast("Accedi per aggiungere l’amico"); } }
    const tk = (q.get("t") || "").replace(/[^a-z0-9:]/g, ""); await openByKey(tk);
    if (code || g || fr || tk) history.replaceState(history.state, "", location.pathname);
    if (code) { if (xUser()) await tgJoin(code); else { lsSet("cm_room", code); toast("Accedi per unirti alla serata"); } }
    else if (xUser() && lsGet("cm_room", "")) { const c = lsGet("cm_room", ""); lsSet("cm_room", ""); await tgJoin(c); }
    else if (g) { if (typeof xGo === "function") xGo(g); else if (g === "soon") go("soon"); }
    if (xUser() && lsGet("cm_friend", "")) { const c = lsGet("cm_friend", ""); lsSet("cm_friend", ""); const r = await sb.rpc("friend_request", { p_code: c }); toast(r.error ? "Codice amico non valido" : "Richiesta inviata"); }
    if (xUser()) { await xInbox(true); if (view === "home" && xUnseen()) render(); }
    xRemindNow(); arrCheck();
  } catch (e) {}
}

/* Android: apre l'app del servizio (se installata) invece del sito */
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("a[data-pkg]"); if (!a || !a.dataset.pkg || !/Android/i.test(navigator.userAgent)) return;
  try {
    const u = new URL(a.href); e.preventDefault();
    location.href = "intent://" + u.host + u.pathname + u.search + "#Intent;scheme=https;package=" + a.dataset.pkg + ";S.browser_fallback_url=" + encodeURIComponent(a.href) + ";end";
  } catch (x) {}
}, true);
window.XREADY = true; if (window.__xr) window.__xr();

/* Barra in basso: si nasconde scorrendo verso il basso, torna salendo */
(function () {
  let ly = window.scrollY, tk = false;
  window.addEventListener("scroll", () => {
    if (tk) return; tk = true;
    requestAnimationFrame(() => {
      const y = window.scrollY, d = y - ly;
      if (y < 60 || d < -6) document.body.classList.remove("nav-hide");
      else if (d > 10) document.body.classList.add("nav-hide");
      if (Math.abs(d) > 6) ly = y; tk = false;
    });
  }, { passive: true });
})();

/* Copertina: con il dito, scorri a destra o a sinistra per passare al titolo successivo o precedente */
(function () {
  let x0 = 0, y0 = 0, dx = 0, on = false, lock = 0, moved = false;
  const hc = () => document.getElementById("hc");
  document.addEventListener("touchstart", e => {
    const h = e.target.closest && e.target.closest("#hero"); if (!h || e.touches.length !== 1 || HERO.items.length < 2) return;
    on = true; lock = 0; moved = false; dx = 0; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; HERO.pause = 1;
    const c = hc(); if (c) c.style.transition = "none";
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if (!on) return; const t = e.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
    if (!lock) { if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.3) lock = 1; else if (Math.abs(my) > 10) { lock = 2; } }
    if (lock !== 1) return; moved = true; dx = mx;
    const c = hc(); if (c) { c.style.transform = `translateX(${dx * .55}px)`; c.style.opacity = String(Math.max(.25, 1 - Math.abs(dx) / 320)); }
  }, { passive: true });
  const end = () => {
    if (!on) return; on = false; HERO.pause = 0; const c = hc();
    if (lock === 1 && Math.abs(dx) > 50) {
      const dir = dx < 0 ? 1 : -1;
      if (c) { c.style.transition = "transform .2s ease, opacity .2s ease"; c.style.transform = `translateX(${-dir * 90}px)`; c.style.opacity = "0"; }
      setTimeout(() => { const c2 = hc(); if (c2) { c2.style.transition = "none"; c2.style.transform = `translateX(${dir * 60}px)`; } showHero(HERO.i + dir); vib && vib(8);
        setTimeout(() => { const c3 = hc(); if (c3) { c3.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1), opacity .3s"; c3.style.transform = ""; } }, 320); }, 190);
    } else if (c) { c.style.transition = "transform .25s ease, opacity .25s"; c.style.transform = ""; c.style.opacity = ""; }
  };
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });
  // dopo uno swipe non deve partire anche il tocco sui pulsanti
  document.addEventListener("click", e => { if (moved && e.target.closest && e.target.closest("#hero")) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
})();


/* ================= Username ================= */
const uNorm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^@+/, "").replace(/[\s-]+/g, "_").replace(/[^a-z0-9_.]/g, "").slice(0, 20);
const uOk = s => /^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$/.test(s) && !/\.\./.test(s);
const URES = ["admin", "administrator", "tonightly", "support", "supporto", "staff", "moderatore", "moderator", "root", "system", "sistema", "help", "aiuto", "null", "undefined", "official", "ufficiale"];
function uSugg() {
  const nm = uNorm((P().name || "").trim()), em = uNorm(((user && user.email) || "").split("@")[0]), out = [];
  [nm, em, nm && nm + "_" + (new Date().getFullYear() % 100), em && em + "_tv", nm && nm + ".film"].forEach(x => { if (x && uOk(x) && !URES.includes(x) && !out.includes(x)) out.push(x); });
  return out.slice(0, 3);
}
let uT = 0, uSkip = false;
/* chi non ha ancora un username lo sceglie alla prima apertura (anche gli utenti già registrati) */
function xUserGate() {
  if (!xUser() || !S.needU || uSkip || document.getElementById("ugate")) return;
  const d = document.createElement("div"); d.id = "ugate";
  d.innerHTML = `<div class="ov c ug"><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="ugh">${logoMark(44)}<h3 class="h" id="ugh">Scegli il tuo username</h3>
<p class="mu">Serve ai tuoi amici per trovarti e mandarti una richiesta. Potrai cambiarlo più avanti.</p>
<div class="frs"><span class="at">@</span><input id="ugIn" maxlength="21" placeholder="es. ${esc(uSugg()[0] || "mario.rossi")}" autocomplete="off" autocapitalize="none" spellcheck="false" oninput="uCheck(this.value)" onkeydown="if(event.key==='Enter')uSave()"></div>
<p id="ugMsg" class="mu small">3-20 caratteri: lettere, numeri, punto e trattino basso.</p>
<div class="row" id="ugS">${uSugg().map(s => `<button class="chip" onclick="uPick('${s}')">@${s}</button>`).join("")}</div>
<div class="row"><button class="btn pri grow" id="ugB" disabled onclick="uSave()">Conferma</button></div></div></div>`;
  document.body.appendChild(d); setTimeout(() => { const i = $("#ugIn"); if (i && innerWidth >= 700) i.focus(); }, 50);
}
function uPick(s) { const i = $("#ugIn"); if (!i) return; i.value = s; uCheck(s); }
function uCheck(v) {
  clearTimeout(uT); const n = uNorm(v), m = $("#ugMsg"), b = $("#ugB"), i = $("#ugIn"); if (!m) return;
  if (i && i.value !== n && v.replace(/^@/, "") !== n) { i.value = n; }
  b.disabled = true; m.className = "mu small";
  if (!n) { m.textContent = "3-20 caratteri: lettere, numeri, punto e trattino basso."; return; }
  if (!uOk(n)) { m.textContent = n.length < 3 ? "Almeno 3 caratteri" : "Non può iniziare o finire con un punto, né avere due punti di fila"; return; }
  if (URES.includes(n)) { m.textContent = "Questo username non è disponibile"; m.className = "small warn"; return; }
  m.textContent = "Controllo…";
  uT = setTimeout(async () => {
    const r = await sb.rpc("username_free", { p_name: n }); if (uNorm(($("#ugIn") || {}).value) !== n) return;
    if (r.error) { m.textContent = "Puoi confermare"; b.disabled = false; return; }
    if (r.data) { m.textContent = "@" + n + " è libero"; m.className = "small ok"; b.disabled = false; } else { m.textContent = "@" + n + " è già preso"; m.className = "small warn"; }
  }, 350);
}
async function uSave() {
  const n = uNorm(($("#ugIn") || {}).value), b = $("#ugB"); if (!uOk(n)) return; if (b) b.disabled = true;
  const r = await sb.rpc("set_username", { p_name: n });
  if (r.error) {
    // se il database non è ancora aggiornato non blocco l'app
    if (/function|schema cache|PGRST20/i.test((r.error.message || "") + (r.error.code || ""))) { uSkip = true; uClose(); return toast("Per gli username esegui l’aggiornamento SQL in Supabase"); }
    if (b) b.disabled = false; const m = $("#ugMsg"); if (m) { m.textContent = (r.error.message || "").replace(/^.*?:\s*/, ""); m.className = "small warn"; } return;
  }
  S.uname = r.data; S.needU = false; uClose(); toast("Benvenuto, @" + r.data); vib(12); if (["prof", "set", "together"].includes(view)) render();
}
function uClose() { const d = document.getElementById("ugate"); if (d) d.remove(); }
async function uChange() {
  const n = uNorm(($("#unU") || {}).value); if (!uOk(n)) return toast("Username non valido: 3-20 caratteri tra lettere, numeri, punto e trattino basso");
  const r = await sb.rpc("set_username", { p_name: n }); if (r.error) return toast((r.error.message || "Non riuscito").replace(/^.*?:\s*/, ""));
  S.uname = r.data; S.needU = false; toast("Username aggiornato: @" + r.data); render();
}
/* Impostazioni › Amici e richieste */
function setAmici() {
  if (!xUser()) return sblk("", "Per aggiungere amici serve un account: accedi o registrati.", "");
  const m = S.freq || "all", opt = (v, t, d) => `<label class="opt2 ${m === v ? "on" : ""}"><input type="radio" name="frq" ${m === v ? "checked" : ""} onchange="setFreq('${v}')"><span><b>${t}</b><small class="mu">${d}</small></span></label>`;
  return sblk("Il tuo username", "Gli amici ti trovano cercando questo nome. Nella prima ora lo correggi liberamente, poi puoi cambiarlo una volta ogni 14 giorni.", `<div class="frs"><span class="at">@</span><input id="unU" maxlength="21" value="${esc(S.uname || "")}" autocomplete="off" autocapitalize="none" spellcheck="false" oninput="this.value=uNorm(this.value)"><button class="btn pri" onclick="uChange()">Salva</button></div>`)
    + sblk("Chi può mandarti richieste di amicizia", "", `<div class="opts2">${opt("all", "Tutti", "Compari nella ricerca per username e chiunque può chiederti l’amicizia.")}${opt("code", "Solo chi ha il mio codice o link", "Non compari nella ricerca: ti aggiunge solo chi riceve il tuo codice.")}${opt("none", "Nessuno", "Nessuna nuova richiesta. Gli amici che hai già restano, e puoi sempre accettare chi ti aveva già scritto.")}</div>`)
    + sblk("I tuoi amici", "", `<button class="btn" onclick="TG.tab='friends';go('together')">${ic("users", 16)} Apri amici e richieste${XN.req ? " (" + XN.req + ")" : ""}</button>`);
}
async function setFreq(v) {
  const r = await sb.rpc("set_friend_req", { p_mode: v }); if (r.error) { toast("Non riuscito: hai eseguito l’aggiornamento SQL?"); return render(); }
  S.freq = v; toast(v === "all" ? "Chiunque può mandarti richieste" : v === "code" ? "Richieste solo con il tuo codice" : "Richieste di amicizia disattivate"); render();
}

function setCom(off) { P().nocommunity = !!off; saveProfile(); affC = null; if (typeof RX !== "undefined") RX.out = null; toast(off ? "Consigli dalla community disattivati" : "Consigli dalla community attivi"); render(); }
