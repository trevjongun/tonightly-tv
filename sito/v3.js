/* Tonightly – "Tu" rifatto: statistiche nuove, Amici dentro Tu (con 3 persone consigliate),
   una sola "Serata insieme", impostazione per comparire tra i consigliati, nota delle novità. */
"use strict";
ICO.chart = '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>';
ICO.gear = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>';
ICO.chev = '<path d="M9 6l6 6-6 6"/>';
const backTu = `<div class="row"><button class="back" onclick="go('prof')">‹ Tu</button></div>`;
const hrs = m => { const h = m / 60; return h >= 100 ? Math.round(h) + "" : h >= 10 ? h.toFixed(0) : h.toFixed(1).replace(".", ","); };
const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* ================= Tu ================= */

/* ================= Statistiche ================= */
let STP = "all";
function stPer(v) { STP = v; render(); }
const dOf = t => t.watched ? (t.watched_on || "") : ((t.eps || {})._t ? new Date(t.eps._t).toISOString().slice(0, 10) : "");
async function vStats() {
  await genres().catch(() => {});
  const now = new Date(), y = now.getFullYear(), from = STP === "year" ? y + "-01-01" : STP === "30" ? new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10) : "";
  const base = Object.values(S.titles).filter(t => t.watched || (t.media === "tv" && epCount(t) > 0));
  const all = base.filter(t => !from || dOf(t) >= from), w = all.filter(t => t.watched);
  const mins = all.reduce((a, t) => a + minsOf(t), 0), films = w.filter(t => t.media === "movie").length, series = all.filter(t => t.media === "tv").length;
  const eps = all.reduce((a, t) => a + (t.media === "tv" ? (t.watched ? ((t.eps || {})._n || 0) : epCount(t)) : 0), 0);
  const rs = w.filter(t => t.stars), avg = rs.length ? rs.reduce((a, t) => a + t.stars, 0) / rs.length : 0;
  const dist = [1, 2, 3, 4, 5].map(n => rs.filter(t => Math.ceil(t.stars) === n).length), dmx = Math.max(1, ...dist);
  const seg = `<div class="seg2 stseg">${[["all", "Sempre"], ["year", "Quest’anno"], ["30", "30 giorni"]].map(([v, l]) => `<button class="${STP === v ? "on" : ""}" onclick="stPer('${v}')">${l}</button>`).join("")}</div>`;
  if (!all.length) return `<div class="sec pt stp">${backTu}<h2 class="h">Le tue statistiche</h2>${seg}${emptyBox("chart", STP === "all" ? "Segna qualche titolo come visto e qui vedrai ore, generi, mesi e traguardi." : "In questo periodo non hai segnato niente come visto.", "")}</div>`;
  // mesi
  const months = []; for (let i = 11; i >= 0; i--) { const d = new Date(y, now.getMonth() - i, 1); months.push({ k: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"), l: d.toLocaleDateString("it-IT", { month: "short" }).replace(".", "").slice(0, 3) }); }
  const bm = {}; base.forEach(t => { const m = minsOf(t), k = dOf(t).slice(0, 7); if (m && k) bm[k] = (bm[k] || 0) + m; });
  const mmx = Math.max(1, ...months.map(m => bm[m.k] || 0)), best = months.reduce((a, m) => (bm[m.k] || 0) > (bm[a.k] || 0) ? m : a, months[0]);
  // generi, dove, emozioni
  const gc = {}; all.forEach(t => (t.genre_ids || []).slice(0, 2).forEach(g => { if (GN[g]) gc[g] = (gc[g] || 0) + 1; }));
  const gt = Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 6), gtot = gt.reduce((a, x) => a + x[1], 0) || 1;
  const sc = {}; w.forEach(t => { const s = (t.diary || {}).s; if (s) sc[s] = (sc[s] || 0) + 1; });
  const st = Object.entries(sc).sort((a, b) => b[1] - a[1]).slice(0, 5), stot = st.reduce((a, x) => a + x[1], 0) || 1;
  const ec = {}; w.forEach(t => { const e = (t.diary || {}).e; if (e) ec[e] = (ec[e] || 0) + 1; });
  const em = (typeof EMO !== "undefined" ? EMO : []).filter(e => ec[e[0]]).sort((a, b) => ec[b[0]] - ec[a[0]]);
  const love = w.filter(t => t.stars >= 4.5 && t.poster).sort((a, b) => b.stars - a.stars || (b.watched_on || "").localeCompare(a.watched_on || "")).slice(0, 12);
  const bd = badges(), got = bd.filter(b => b[3] >= b[4]).length;
  const hb = (l, v, tot, lead) => `<div class="hb"><span class="hbl">${lead || ""}${esc(l)}</span><span class="hbt"><i style="width:${Math.max(4, Math.round(v / tot * 100))}%"></i></span><span class="hbv">${Math.round(v / tot * 100)}%</span></div>`;
  const srcL = s => { const x = typeof srcLabel === "function" ? srcLabel(s) : null; return x ? { l: s === "cinema" ? "Al cinema" : x.l, lead: x.img ? `<img src="${IMG}w45${x.img}" alt="" width="18" height="18">` : `<span class="hbe">${x.e || ""}</span>` } : { l: s, lead: "" }; };
  const days = mins / 1440;
  return `<div class="sec pt stp">${backTu}<h2 class="h">Le tue statistiche</h2>${seg}
<div class="kpis">
 <div class="kpi wide"><small>Tempo davanti allo schermo</small><b>${hrs(mins)}<i>ore</i></b><span>${days >= 1 ? "circa " + Math.round(days) + (Math.round(days) === 1 ? " giorno intero" : " giorni interi") : Math.round(mins) + " minuti"}</span></div>
 <div class="kpi"><small>Titoli visti</small><b>${num(w.length)}</b><span>${films} film · ${series} serie</span></div>
 <div class="kpi"><small>Episodi</small><b>${num(eps)}</b><span>${series ? "in " + series + (series === 1 ? " serie" : " serie") : "nessuna serie"}</span></div>
 <div class="kpi wide"><small>Voto medio</small><div class="kav"><b>${avg ? avg.toFixed(1).replace(".", ",") : "–"}<i>★</i></b><div class="hist" aria-label="Voti per stelle">${dist.map((n, i) => `<span><i style="height:${Math.round(n / dmx * 100)}%"></i><small>${i + 1}★</small></span>`).join("")}</div></div><span>${rs.length} titoli votati</span></div>
</div>
<section class="stc"><h3>Ogni mese <small>ultimi 12 mesi · ore</small></h3><div class="mbars">${months.map(m => { const v = bm[m.k] || 0; return `<span class="${m.k === best.k && v ? "top" : ""}"><em>${v ? hrs(v) : ""}</em><i style="height:${Math.round(v / mmx * 100)}%"></i><small>${m.l}</small></span>`; }).join("")}</div>${(bm[best.k] || 0) ? `<p class="mu small">Il mese in cui hai guardato di più: <b>${esc(best.l)}</b>, ${hrs(bm[best.k])} ore.</p>` : ""}</section>
${gt.length ? `<section class="stc"><h3>I tuoi generi</h3>${gt.map(([g, v]) => hb(GN[g], v, gtot)).join("")}</section>` : ""}
${st.length ? `<section class="stc"><h3>Dove guardi</h3>${st.map(([s, v]) => { const x = srcL(s); return hb(x.l, v, stot, x.lead); }).join("")}</section>` : ""}
${em.length ? `<section class="stc"><h3>Come ti hanno fatto sentire</h3><div class="emr">${em.map(e => `<span class="emc"><i>${e[1]}</i><b>${ec[e[0]]}</b><small>${e[2]}</small></span>`).join("")}</div></section>` : ""}
${love.length ? `<section class="stc"><h3>I più amati <small>${love.length}</small></h3><div class="stl">${love.map(t => `<button class="stp1" onclick="openSheet('${t.tmdb_key}')" aria-label="${esc(t.title)}"><img src="${IMG}w185${t.poster}" alt="" loading="lazy"><small>${stTxt(t.stars)}</small></button>`).join("")}</div></section>` : ""}
<section class="stc"><h3>Traguardi <small>${got} di ${bd.length}</small></h3><div class="bdgx">${bd.map(([e, n, d, cur, tg]) => { const ok = cur >= tg, pct = Math.min(100, Math.round(cur / tg * 100)); return `<div class="bdi ${ok ? "on" : ""}"><span class="bde">${e}</span><b>${esc(n)}</b><small>${esc(d)}</small><span class="bdp"><i style="width:${pct}%"></i></span><small class="bdn">${ok ? "Sbloccato" : Math.min(cur, tg) + " / " + tg}</small></div>`; }).join("")}</div></section>
${typeof storiesOpen === "function" ? `<button class="stc stcta" onclick="storiesOpen()"><span class="tui">${ic("share", 20)}</span><span class="tutx"><b>Il tuo anno in storie</b><small>Immagini da pubblicare su Instagram e WhatsApp</small></span><span class="tuc">${ic("chev", 18)}</span></button>` : ""}
${typeof rxReport === "function" ? `<section class="stc">${rxProfHtml()}</section>` : ""}
</div>`;
}

/* ================= Amici (dentro Tu) ================= */
async function vFriends() {
  if (!xUser()) return `<div class="sec pt">${backTu}<h2 class="h">Amici</h2>${emptyBox("users", "Per aggiungere amici serve un account: accedi o registrati.", "")}</div>`;
  let body = ""; try { body = await tgFriends(); } catch (e) { body = `<p class="mu">Non riesco a caricare gli amici: hai eseguito l’aggiornamento SQL?</p>`; }
  return `<div class="sec pt frp">${backTu}<h2 class="h">Amici</h2>${body}</div>`;
}
(function () { const t0 = tgTab; tgTab = function (v) { if (v === "friends") return go("friends"); return t0.apply(this, arguments); }; })();
/* Insieme: niente più scheda Amici, una sola "Serata insieme" */
(function () {
  const v0 = vTogether; })();
async function tgNight() {
  if (TG.busy) return; TG.busy = true;
  try {
    toast("Preparo la serata…");
    const wl = myWl(8), seen = new Set(wl.map(i => i.key)), items = wl.concat((await recItems(40)).filter(i => i.poster && !seen.has(i.key))).slice(0, 30).map(mini);
    const nm = "Serata del " + new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long" });
    const r = await sb.rpc("create_room", { p_kind: "duo", p_name: nm, p_items: items, p_uname: P().name || "Ospite", p_avatar: P().avatar || 0 }); if (r.error) throw r.error;
    TG.room = r.data.id; TG.busy = false; render();
  } catch (e) { TG.busy = false; tgErr(e); }
}
tgGroup = tgNight;

/* ================= Impostazioni: comparire tra i consigliati ================= */
(function () {
  const s0 = setAmici; setAmici = function () {
    const h = s0.apply(this, arguments); if (!xUser()) return h; const on = S.sug !== false;
    return h.replace(`onclick="TG.tab='friends';go('together')"`, `onclick="go('friends')"`) + sblk("Persone consigliate", "Se attivo, puoi comparire tra le persone consigliate agli amici dei tuoi amici e, se condividi cosa guardi, a chi ha gusti simili. Vedono solo il nome, l’avatar e la percentuale di somiglianza, mai i tuoi titoli.", `<div class="row"><button class="chip ${on ? "on" : ""}" onclick="setSug(true)">Fatti trovare</button><button class="chip ${!on ? "on" : ""}" onclick="setSug(false)">Non comparire</button></div>`);
  };
})();
async function setSug(v) {
  const r = await sb.from("settings").upsert({ user_id: user.id, suggest: v }); if (r.error) { toast("Non riuscito: hai eseguito l’aggiornamento SQL?"); return; }
  S.sug = v; toast(v ? "Puoi comparire tra le persone consigliate" : "Non comparirai più tra le persone consigliate"); render();
}

/* ================= Nota delle novità (una volta, per chi era già registrato) ================= */
const NOTES_V = "2026-11-04";
const NOTES = [
  ["📺", "Tonightly sulla TV", "L’app per Android TV, Google TV e Fire TV. Entri inquadrando un QR e apri i film direttamente sul servizio giusto. Trovi come installarla in Impostazioni › App per la TV."],
  ["⭐", "Voto più completo", "Mezze stelle, come ti ha fatto sentire, dove l’hai visto e un commento. Poi puoi pubblicarlo come storia."],
  ["👥", "Serata insieme", "Crea una serata, invita gli amici e votate dal telefono: Tonightly vi dice cosa piace a tutti."],
  ["🎬", "Uscite al cinema e in streaming", "Le novità in sala e quelle in arrivo sui tuoi servizi, in Scopri › Uscite."],
  ["📊", "Le tue statistiche", "Ore, generi, mesi e traguardi, in Tu."],
  ["🤝", "Amici consigliati", "Persone che potresti conoscere, in Tu › Amici."],
  ["🏴‍☠️", "Guardo tutto", "Consigli su qualsiasi titolo, anche fuori dai tuoi abbonamenti. Si attiva in Impostazioni › Abbonamenti."]
];
const FIXES = ["Migliorie grafiche in tutta l’app", "Menu più semplice: Home, Scopri, Stasera, Lista, Tu", "Su iPhone la pagina si adatta allo schermo", "Prime Video compare una volta sola, con € sui titoli a noleggio", "Piccole correzioni"];
function notesOpen() {
  amenuHtml(`<div class="notes"><span class="ntk">Novità</span><h3 class="h">Cosa c’è di nuovo in ${esc(APP)}</h3><p class="mu">Le novità di questo aggiornamento.</p>
<ul class="ntl">${NOTES.map(([e, t, d]) => `<li><span class="nte">${e}</span><span><b>${t}</b><small>${d}</small></span></li>`).join("")}</ul>
<h3 class="h ntf">Correzioni e migliorie</h3><ul class="ntx">${FIXES.map(f => `<li>${ic("check", 15)}<span>${f}</span></li>`).join("")}</ul></div>`);
}
function notesMaybe() {
  const k = "cm_notes_" + (user ? user.id : "local"); if (lsGet(k, "") === NOTES_V) return;
  const had = Object.keys(S.titles).length > 0 || !!P().done; lsSet(k, NOTES_V); if (!had || view === "onb") return;
  setTimeout(() => { if (!$("#amenu").innerHTML && !$("#ugate")) notesOpen(); }, 1200);
}
(function () { const b0 = xBoot; xBoot = async function () { await b0.apply(this, arguments); notesMaybe(); }; })();

/* Impostazioni › Abbonamenti: un solo titolo (quello della pagina) */
(function () { const s0 = setServ; setServ = async function () { return (await s0.apply(this, arguments)).replace('<h2 class="h">I tuoi abbonamenti</h2>', ""); }; })();

/* ================= Impostazioni › App per la TV ================= */
(function () {
  const g = SETM.find(x => x[0] === "App"); if (g) g[1].push(["tvapp", "tv", "#7048e8", "App per la TV", () => "Come installarla e dove funziona"]);
  SETT.tvapp = "App per la TV";
  const p0 = setProfile; setProfile = function () { return setTab === "tvapp" ? setTvApp() : p0.apply(this, arguments); };
})();
function setTvApp() {
  const code = String(C.TV_DOWNLOADER || "5087904"), url = location.origin + location.pathname.replace(/[^/]*$/, "") + "tv.html";
  const ok = (t, d) => `<li class="tvok"><span>✓</span><div><b>${t}</b>${d ? `<small>${d}</small>` : ""}</div></li>`, no = (t, d) => `<li class="tvno"><span>✕</span><div><b>${t}</b>${d ? `<small>${d}</small>` : ""}</div></li>`;
  return sblk("", "Sulla TV hai i tuoi consigli, Stasera in tre domande, Guardiamo insieme con il QR e “Apri Netflix” che porta direttamente al titolo. Tutto con il telecomando.", "")
    + sblk("Dove funziona", "", `<ul class="tvw">${ok("TV con Android TV o Google TV", "Sony, Philips, TCL, Hisense, Xiaomi e altre: controlla che ci sia il Google Play Store")}${ok("Chromecast con Google TV e Google TV Streamer", "")}${ok("Amazon Fire TV Stick e Fire TV", "")}${no("Samsung, LG e Apple TV", "L’app non si installa, ma puoi aprire Tonightly nel browser della TV a questo indirizzo: <b>" + esc(url.replace(/^https?:\/\//, "")) + "</b>")}</ul>`)
    + sblk("Come installarla", "Si fa una volta sola, con il telecomando. Servono circa 5 minuti.", `<ol class="steps tvs">
<li><b>Installa Downloader</b><small>Sulla TV apri il Google Play Store (sulla Fire TV l’Appstore), cerca <b>Downloader</b> di AFTVnews e installala.</small></li>
<li><b>Permetti l’installazione</b><small>Google TV: Impostazioni › Sistema › Informazioni, premi 7 volte su “Build del sistema operativo”. Poi Impostazioni › App › Sicurezza e limitazioni › Origini sconosciute › attiva Downloader.<br>Fire TV: Impostazioni › La mia Fire TV › Informazioni, premi 7 volte sul nome della TV. Poi Opzioni sviluppatore › Installa app sconosciute › attiva Downloader.</small></li>
<li><b>Scarica Tonightly</b><small>Apri Downloader, scrivi il codice <span class="tvc2">${esc(code)}</span> e premi Go.</small></li>
<li><b>Installa e apri</b><small>Premi Installa, poi Apri. Se compare un avviso di Play Protect, premi “Installa comunque”.</small></li>
<li><b>Entra nel tuo account</b><small>Sulla TV compare un QR: inquadralo con questo telefono e scrivi le 4 cifre che vedi sullo schermo.</small></li></ol>`)
    + sblk("Aggiornamenti", "Quando esce una nuova versione, la TV te lo dice da sola: premi “Aggiorna ora” e poi “Installa”. Non serve rifare questi passaggi.", "");
}

/* ================= Sorprendimi: un titolo dal catalogo, sui tuoi gusti ================= */
let SURP = 0;
tnSurprise = async function () {
  const my = ++SURP, mg = [...new Set((TN.mood || []).flatMap(i => MOODS[i][1]))];
  amenuHtml(`<div class="surp ld"><div class="sbg"></div><div class="stx"><span class="ntk">${ic("dice", 15)} Sorprendimi</span><h3 class="h">Cerco qualcosa di adatto a te…</h3><p class="mu">Scavo nel catalogo tra generi, temi e autori che ami.</p></div></div>`);
  let r = null; try { r = await rxSurprise(mg); } catch (e) {}
  if (my !== SURP || !$("#amenu").innerHTML) return;
  if (!r) { amenuHtml(`<div class="surp"><div class="stx"><h3 class="h">Non ho trovato niente di nuovo</h3><p class="mu">Prova a togliere l’umore scelto o ad aggiungere un servizio.</p></div></div>`); return; }
  const it = r.it, t = S.titles[it.key] || {}; ITEMS[it.key] = it;
  amenuHtml(`<div class="surp"><div class="sbg" style="background-image:url(${IMG}w780${it.backdrop || it.poster})"></div><div class="stx">
<span class="ntk">${ic("dice", 15)} La tua sorpresa${r.pct ? ` · ${r.pct}% per te` : ""}</span>
<h3 class="h">${esc(it.title)}</h3><p class="mu small">${[it.year, it.media === "tv" ? "Serie TV" : "Film", it.vote ? "★ " + it.vote.toFixed(1) : ""].filter(Boolean).map(esc).join(" · ")}</p>
<p class="swhy">${esc(r.extra)}</p>${it.overview ? `<p class="sov">${esc(it.overview.slice(0, 200))}${it.overview.length > 200 ? "…" : ""}</p>` : ""}
<div class="row"><button class="btn pri grow" onclick="$('#amenu').innerHTML='';openSheet('${it.key}')">${ic("info", 17)} Scheda</button><button class="btn grow" onclick="tnSurprise()">${ic("dice", 17)} Un’altra</button></div>
<div class="row"><button class="btn grow wlb" data-k="${it.key}" onclick="wlTog('${it.key}')">${t.watchlist ? ic("minus", 17) + " Rimuovi dalla lista" : ic("plus", 17) + " Aggiungi alla lista"}</button></div></div></div>`);
};

/* ================= Impostazioni › Film o serie ================= */
(function () {
  const lab = { movie: "Soprattutto film", tv: "Soprattutto serie TV", all: "Film e serie TV" };
  const g = SETM.find(x => x[0] === "Il tuo spazio"); if (g) g[1].splice(2, 0, ["fmt", "film", "#e64980", "Film o serie", () => lab[P().fmt] || lab.all]);
  SETT.fmt = "Film o serie";
  const p0 = setProfile; setProfile = function () { return setTab === "fmt" ? setFmt() : p0.apply(this, arguments); };
})();
function setFmt() {
  const f = P().fmt || "all", o = (v, e, t, d) => `<button class="sr2 ${f === v ? "on" : ""}" onclick="fmtSet('${v}')"><span class="si fmte">${e}</span><span class="st"><b>${t}</b><small>${d}</small></span><span class="sc">${f === v ? "✓" : ""}</span></button>`;
  return sblk("", "Decide cosa ti propongo nei consigli e in Sorprendimi. Con il tempo contano soprattutto i tuoi voti: se guardi anche l’altro formato, lo vedrai comparire.", `<div class="sl">${o("movie", "🎬", "Soprattutto film", "Le serie TV quasi mai")}${o("tv", "📺", "Soprattutto serie TV", "I film quasi mai")}${o("all", "🍿", "Film e serie TV", "Un po’ di tutto, in base ai tuoi voti")}</div>`);
}
async function fmtSet(v) { P().fmt = v; affC = null; if (typeof RX !== "undefined") RX.out = null; TN.res = null; try { localStorage.removeItem("cm_rx_out"); } catch (e) {} await saveProfile(); toast("Fatto: aggiorno i consigli"); render(); }

/* ================= Uscite › Al cinema: la programmazione dei prossimi mesi ================= */
let CINF = lsGet("cm_cinf", "all");
function cinFilt(v) { CINF = v; lsSet("cm_cinf", v); render(); }
const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const CIND = new Map();
/* la data italiana in sala (non quella americana): prima "al cinema", poi "anteprima" */
async function cinDate(id) {
  if (CIND.has(id)) return CIND.get(id);
  const p = tmdb("/movie/" + id + "/release_dates").then(r => {
    const reg = (r.results || []).find(x => x.iso_3166_1 === (C.REGION || "IT")); if (!reg) return null;
    const ds = reg.release_dates || [], th = ds.filter(d => d.type === 3).sort((a, b) => a.release_date.localeCompare(b.release_date))[0] || ds.filter(d => d.type === 2)[0];
    return th ? th.release_date.slice(0, 10) : null;
  }).catch(() => null);
  CIND.set(id, p); return p;
}
async function cinFuture() {
  const reg = C.REGION || "IT", td = today(), tm = new Date(Date.now() + 864e5).toISOString().slice(0, 10), end = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  const pages = await Promise.all([1, 2, 3, 4].map(pg => tmdb("/discover/movie", { region: reg, with_release_type: "2|3", "release_date.gte": tm, "release_date.lte": end, sort_by: "popularity.desc", page: pg }).catch(() => ({ results: [] }))));
  const seen = new Set(), L = pages.flatMap(r => r.results || []).filter(x => x.poster_path && !x.adult && !seen.has(x.id) && seen.add(x.id)).slice(0, 70);
  const ds = await rxPool(L, 8, x => cinDate(x.id));
  return L.map((x, i) => Object.assign(norm(x, "movie"), { date: ds[i] || (x.release_date > td ? x.release_date : null), guess: !ds[i] })).filter(it => it.date && it.date > td && it.date <= end);
}
const dayBadge = d => { const x = new Date(d + "T12:00:00"); return `<span class="cday"><b>${x.getDate()}</b><small>${x.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "")}</small></span>`; };
async function cinTrailer(k) {
  const it = byKey(k); if (!it) return;
  amenuHtml(`<div class="ctr"><div class="ctrv"><div class="ctrl">Carico il trailer…</div></div><h3 class="h">${esc(it.title)}</h3></div>`);
  let v = null; try { v = pickVideo(await full(it)); } catch (e) {}
  const box = $("#amenu .ctrv"); if (!box) return;
  box.innerHTML = v ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.key)}?autoplay=1&playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Trailer"></iframe>` : `<div class="ctrl">Il trailer non è ancora uscito.</div>`;
}
(function () {
  const c0 = soonCin;
  soonCin = async function () {
    const [now, fut] = await Promise.all([c0.apply(this, arguments).catch(() => ""), cinFuture().catch(() => [])]);
    // "Ora in sala" e "Questa settimana" restano; "Più avanti" diventa la programmazione mese per mese
    const top = String(now).split('<h3 class="dday">Più avanti</h3>')[0];
    const wk = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), shown = new Set((top.match(/openSheet\('movie:\d+'\)/g) || []).map(x => x.slice(11, -2)));
    let L = fut.filter(it => it.date > wk && !shown.has(it.key)).sort((a, b) => a.date.localeCompare(b.date));
    L.forEach(it => { ITEMS[it.key] = ITEMS[it.key] || it; it._m = matchPct(it) || 0; });
    if (CINF === "me") L = L.filter(it => it._m >= 60 || (S.titles[it.key] || {}).watchlist);
    const by = {}; L.forEach(it => { const m = it.date.slice(0, 7); (by[m] = by[m] || []).push(it); });
    const row = it => { const t = S.titles[it.key] || {}, g = gname(it); return `<div class="crow" onclick="openSheet('${it.key}')">${dayBadge(it.date)}<img src="${IMG}w154${it.poster}" alt="" loading="lazy"><div class="ct"><b>${esc(it.title)}</b><span>${[g, it.guess ? "data da confermare" : ""].filter(Boolean).map(esc).join(" · ")}</span>${it.overview ? `<small>${esc(it.overview.slice(0, 110))}${it.overview.length > 110 ? "…" : ""}</small>` : ""}</div><div class="cbt"><button class="ctb" aria-label="Guarda il trailer" onclick="event.stopPropagation();cinTrailer('${it.key}')">${ic("play", 15)}<span>Trailer</span></button>${wlBtn(it.key)}${it._m ? `<small class="rlm">${it._m}%</small>` : ""}</div></div>`; };
    const filt = `<div class="cinf"><span>Programmazione dei prossimi mesi</span><div class="seg2 sm">${[["all", "Tutti"], ["me", "Per i miei gusti"]].map(([v, l]) => `<button class="${CINF === v ? "on" : ""}" onclick="cinFilt('${v}')">${l}</button>`).join("")}</div></div>`;
    const months = Object.keys(by).sort().map(m => { const [y, mm] = m.split("-"); return `<h3 class="cmh"><span>${MESI[+mm - 1]}${+y !== new Date().getFullYear() ? " " + y : ""}</span><small>${by[m].length} ${by[m].length === 1 ? "film" : "film"}</small></h3><div class="cml">${by[m].map(row).join("")}</div>`; }).join("");
    return top + filt + (months || emptyBox("calendar", CINF === "me" ? "Nessuna uscita in programma che somigli ai tuoi gusti. Prova con “Tutti”." : "Non trovo uscite in programma.", ""));
  };
})();

/* ================= Immagini che non arrivano: riprovo, poi ripiego ================= */
document.addEventListener("error", e => {
  const im = e.target; if (!(im instanceof HTMLImageElement)) return;
  const s = im.getAttribute("src") || ""; if (!/^https:\/\/image\.tmdb\.org\/t\/p\//.test(s)) return;
  const n = +(im.dataset.rt || 0); im.dataset.rt = n + 1;
  if (n === 0) setTimeout(() => { im.src = s.split("?")[0] + "?r=" + Date.now() % 1e5; }, 700);              // a volte basta riprovare
  else if (n === 1) im.src = s.split("?")[0].replace(/\/t\/p\/(w\d+|original)\//, "/t/p/w342/");          // un formato diverso
  else { im.style.visibility = "hidden"; const p = im.parentElement; if (p) p.classList.add("noimg"); }
}, true);

/* il segnale di "pronto" ora lo dà v4.js, che è l’ultimo file caricato */
