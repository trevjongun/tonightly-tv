/* Tonightly – nuovo aspetto (redesign di novembre 2026, uguale al file Figma "Tonightly · Redesign").
   Questo file cambia solo come sono disegnate le schermate: dati, consigli e azioni restano quelli di prima. */
"use strict";
Object.assign(ICO, {
  chevD: '<path d="M6 9l6 6 6-6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  laugh: '<circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0zM9 9.5h.01M15 9.5h.01"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  coffee: '<path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/>',
  rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 5-9 12-9 0 7-5 11-9 12z"/><circle cx="15" cy="9" r="1.5"/>',
  flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-6 1-9z"/>',
  heartO: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  chevR4: '<path d="M9 6l6 6-6 6"/>',
  sort4: '<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',
  book4: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  bars4: '<path d="M5 20V11M12 20V5M19 20v-7"/>',
  set4: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  search4: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  sliders4: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  euro4: '<path d="M17 6a7 7 0 1 0 0 12M4 10h9M4 14h9"/>',
  clock4: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cards4: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/>',
  unlock4: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>'
});
document.documentElement.classList.add("v4");
const V4 = { mob: () => innerWidth < 900, play: "" };
/* anteprime video automatiche solo se la connessione è Wi‑Fi/cavo, oppure su PC quando il browser non lo dice; mai con "risparmio dati" */
function v4auto() { const c = navigator.connection; if (c && c.saveData) return false; if (c && c.type) return c.type === "wifi" || c.type === "ethernet"; if (c && /^(slow-)?2g$|^3g$/.test(c.effectiveType || "")) return false; return !V4.mob(); }
function v4play(k) { V4.play = k; const it = HERO.items[HERO.i]; if (it && it.key === k) paint(it); }
const v4num = n => String(n).replace(".", ",");
const v4hello = () => { const h = new Date().getHours(); return h < 5 ? "Buonanotte" : h < 13 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera"; };
const v4name = () => { const p = P(); return ((p.name || (user && user.email ? user.email.split("@")[0] : "")) || "").trim().split(" ")[0]; };
const v4av = () => `<button class="v4av" aria-label="Il tuo profilo" onclick="go('prof')">${avatarMe(42)}</button>`;
const v4ib = (i, f, l) => `<button class="v4ib" aria-label="${l}" onclick="${f}">${ic(i, 19)}</button>`;
const v4srch = () => v4ib("search4", "v4search()", "Cerca");
function v4search() { document.body.classList.add("v4s"); openSearch(); setTimeout(() => { const q = $("#q"); if (q) q.focus(); }, 30); }
const v4head = (t, s, r) => `<div class="v4h"><div class="v4ht"><h1>${t}</h1>${s ? `<p>${s}</p>` : ""}</div><div class="v4hr">${r == null ? v4av() : r}</div></div>`;
const v4sec = (t, l, f) => `<div class="v4sec"><b>${t}</b>${l ? (f ? `<button onclick="${f}">${l}</button>` : `<span>${l}</span>`) : ""}</div>`;
const v4row = (i, c, t, s, f, x) => `<button class="v4lr" onclick="${f}"><span class="v4lri" style="background:${c}22;color:${c}">${ic(i, 20)}</span><span class="v4lrt"><b>${t}</b>${s ? `<small>${s}</small>` : ""}</span>${x || ""}<span class="v4chev">${ic("chevR4", 18)}</span></button>`;

/* ---------- locandina ---------- */
card = function (it, extra, other) {
  ITEMS[it.key] = it; const t = S.titles[it.key] || {}, mp = matchPct(it), k = it.key;
  const sub = [extra ? extra : it.year].filter(Boolean).join(" · ");
  return `<div class="nc v4c" data-k="${k}" onclick="cardClick('${k}')" oncontextmenu="event.preventDefault();qMenu('${k}')"><div class="v4po">${it.poster ? `<img loading="lazy" src="${IMG}w342${it.poster}" alt="Locandina: ${esc(it.title)}">` : `<span class="v4pot">${esc(it.title)}</span>`}${mp && !t.watched ? `<span class="v4mt">${mp}%</span>` : ""}${t.watched ? `<span class="v4ok">${t.stars ? "★ " + v4num(t.stars) : ic("check", 12)}</span>` : t.watchlist ? `<span class="v4ok wl">${ic("check", 12)}</span>` : ""}<div class="prov pv" data-k="${k}"${other ? ' data-o="1"' : ""}></div></div><div class="v4pcl">${esc(it.title)}</div>${sub ? `<div class="v4pcs">${esc(sub)}</div>` : ""}</div>`;
};
tile = function (it, seg) { const t = S.titles[it.key] || {}; return card(it, seg === "visti" && t.stars ? "★ " + v4num(t.stars) : seg === "corso" ? (() => { const n = (t.eps || {})._n || 0, c = epCount(t); return n ? c + " di " + n + " episodi" : c + " episodi visti"; })() : it.year); };

/* ---------- Home ---------- */
(function () {
  const vh0 = vHome;
  vHome = async function () {
    await loadProv().catch(() => {});
    const [mv, tv, rec] = await Promise.all([disc("movie"), disc("tv"), recItems()]);
    const mi = mv.results.map(x => norm(x, "movie")).filter(okItem), ti = tv.results.map(x => norm(x, "tv")).filter(okItem);
    let hs = (() => { const b = rec.filter(r => r.it.backdrop), u = new Set(), o = []; b.forEach(r => { if (o.length < 5 && !u.has(r.extra)) { u.add(r.extra); o.push(r); } }); b.forEach(r => { if (o.length < 5 && !o.includes(r)) o.push(r); }); return o; })().map(r => Object.assign({}, r.it, { reason: r.extra ? "Perché ti è piaciuto " + r.extra.replace(/^(Perché ti è piaciuto|Simile a|Come)\s*/i, "") : "Scelto sui tuoi gusti" }));
    const pop = []; for (let i = 0; i < 20; i++) { if (mi[i]) pop.push(mi[i]); if (ti[i]) pop.push(ti[i]); }
    for (const p of pop) { if (hs.length >= 5) break; if (p.backdrop && !hs.some(x => x.key === p.key)) hs.push(Object.assign({}, p, { reason: "Popolare sui tuoi servizi" })); }
    const all = Object.values(S.titles), cont = all.filter(t => t.media === "tv" && epCount(t) > 0 && !t.watched), wl = all.filter(t => t.watchlist && !t.watched);
    HERO.items = [];
    let cc = [];
    if (cont.length) {
      const cs = cont.sort((a, b) => ((b.eps || {})._t || 0) - ((a.eps || {})._t || 0)).slice(0, 8), nxs = await Promise.all(cs.map(t => nextEpFor(t.tmdb_key)));
      cc = cs.map((t, i) => ({ t, nx: nxs[i] })).filter(r => r.nx && !r.nx.fut);
    }
    BENTO.cont = cc[0] || null;
    const nm = v4name(), left = cc.length;
    let h = `<div class="sec bh v4home">` + v4head(`${v4hello()}${nm ? ", " + esc(nm) : ""}`, left ? `Hai ${left} ${left === 1 ? "serie" : "serie"} da continuare` : "Cosa ti va di guardare?", `<div class="v4hrow">${v4srch()}${v4av()}</div>`);
    if (cc[0]) h += v4cont(cc[0]);
    h += `<div class="v4hm"><div class="v4hmain">` + (hs.length ? v4sec("Scelto per te stasera") + heroHtml(hs) : "") + `</div><div class="v4hside">${cc[0] ? v4cont(cc[0], 1) : ""}<button class="v4tn" onclick="go('tonight')"><span class="v4lri" style="background:rgba(255,255,255,.12);color:#B7AEFF">${ic("dice", 22)}</span><span class="v4lrt"><b>Non sai cosa guardare?</b><small>Sorprendimi o scegli l’umore</small></span><span class="v4chev">${ic("chevR4", 18)}</span></button></div></div>`;
    if (rec.length) h += v4sec("Per te", "Vedi tutti", "goDisc()") + rail(rec);
    if (cc.length > 1) h += v4sec("Continua a guardare", "Le mie serie", "tvTab='mine';go('tv')") + `<div class="erail">${cc.slice(1).map(r => tvCard(r.t, r.nx, "go")).join("")}</div>`;
    if (wl.length) h += v4sec("Dalla tua lista", "Tutta la lista", "go('list')") + rail(fromRows(wl));
    h += (await xFriendRail()).replace(/<h3 class="h[^"]*">([\s\S]*?)<\/h3>/, (m, t) => v4sec(t.replace(/<[^>]+>/g, "").trim()));
    if (pop.length >= 5) h += v4sec("Top 10 sui tuoi servizi") + top10(pop.slice(0, 10));
    Q = [];
    setTimeout(() => { try { if (typeof seraPrep === "function") seraPrep(); if (typeof seraInApp === "function") seraInApp(); } catch (e) {} }, 0);
    return h + `</div>`;
  };
})();
function v4cont(r, side) {
  const t = r.t, k = t.tmdb_key, c = epCount(t), n = (t.eps || {})._n || 0, nx = r.nx, img = nx.still ? IMG + "w300" + nx.still : t.poster ? IMG + "w342" + t.poster : "";
  const left = nx.name ? spN(nx.name) : nx.rt ? nx.rt + " min" : "";
  return `<div class="v4cont${side ? " v4side" : ""}" onclick="openEp('${k}')"><div class="v4cth"${img ? ` style="background-image:url(${img})"` : ""}><span class="v4pl">${ic("play", 14)}</span></div><div class="v4ctx"><div class="v4lab">Continua a guardare</div><b>${esc(t.title)}</b><span>S${nx.s} · E${nx.e}${left ? " · " + esc(left) : ""}</span>${n ? `<div class="v4prg"><i style="width:${Math.min(100, Math.round(c / n * 100))}%"></i></div>` : ""}</div></div>`;
}
/* copertina in evidenza: stesso funzionamento (scorre e fa partire il trailer), nuova grafica */
(function () {
  const p0 = paint;
  paint = function (it) {
    // video della copertina: da solo solo su Wi‑Fi (o PC senza risparmio dati), altrimenti al tocco
    const auto = v4auto() || V4.play === it.key, vid0 = UI.vid; if (!auto) UI.vid = false;
    try { p0.apply(this, arguments); } finally { UI.vid = vid0; }
    const hc = $("#hc"); if (!hc) return;
    const hd = $("#hdots"), he = $("#hero"); if (hd && he && hd.parentNode === he) he.after(hd);
    const mp = matchPct(it), wl = (S.titles[it.key] || {}).watchlist;
    hc.innerHTML = `<div class="v4lab v4hlab">Scelto per te stasera</div><div class="v4hpills">${mp ? `<span class="v4pill m">${mp}% per te</span>` : ""}${it.vote ? `<span class="v4pill g">${ic("star", 12)} ${v4num(it.vote.toFixed(1))}</span>` : ""}<span class="v4pill d">${it.media === "tv" ? "Serie TV" : "Film"}${it.year ? " · " + esc(it.year) : ""}<span class="v4rt"></span></span></div>
<h2 class="v4ht2${it.title.length > 26 ? " v4lg" : ""}">${esc(it.title)}</h2><div class="v4hrs">${esc(it.reason || "")}</div>${it.overview ? `<p class="v4hov">${esc(it.overview.slice(0, 160))}${it.overview.length > 160 ? "…" : ""}</p>` : ""}
<div class="v4hbt"><button class="v4btn w wlb" data-k="${it.key}" onclick="wlTog('${it.key}')">${ic(wl ? "check" : "plus", 19)}${wl ? "Nella mia lista" : "La mia lista"}</button>${!v4auto() && UI.vid !== false && V4.play !== it.key ? `<button class="v4btn g ico" aria-label="Guarda l’anteprima" onclick="event.stopPropagation();v4play('${it.key}')">${ic("play", 18)}</button>` : ""}<button class="v4btn g ico" aria-label="Informazioni" onclick="openSheet('${it.key}')">${ic("info", 20)}</button></div>`;
    // su PC: "Guarda su …" del servizio dove c'è, come nel progetto
    if (!V4.mob()) lightProvs(it).then(f => {
      const p = f.find(x => isMine(x.provider_id)), bt = $("#hc .v4hbt"); if (!p || !bt || (HERO.items[HERO.i] || {}).key !== it.key || bt.querySelector(".v4go")) return;
      const u = (SVC_URL[p.provider_id] || "").replace("{q}", encodeURIComponent(it.title)) || f.link || "#";
      bt.insertAdjacentHTML("afterbegin", `<a class="v4btn v4go" href="${esc(u)}" target="_blank" rel="noopener" ${brandStyle(p.provider_name)}>${ic("play", 16)} Guarda su ${esc(p.provider_name)}</a>`);
      const w = bt.querySelector(".wlb"); if (w) w.className = "v4btn g wlb";
    }).catch(() => {});
    full(it).then(d => { const r = d.runtime || (d.episode_run_time || [])[0], el = $("#hc .v4rt"); if (r && el && (HERO.items[HERO.i] || {}).key === it.key) el.textContent = it.media === "movie" ? " · " + (r >= 60 ? Math.floor(r / 60) + " h " + (r % 60 ? r % 60 + " min" : "") : r + " min") : ""; }).catch(() => {});
  };
})();

/* ---------- Scopri ---------- */
(function () {
  const vm0 = vMT;
  vMT = async function () {
    const h = await vm0.apply(this, arguments);
    return h.replace('<div class="sec pt">', '<div class="sec pt v4disc">' + v4head("Scopri", "", V4.mob() ? v4av() : "") + `<button class="v4sf" onclick="v4search()">${ic("search4", 19)}<span>Film, serie, attori…</span></button>`);
  };
})();

/* ---------- Stasera ---------- */
const V4MOOD = [["laugh", "Ridere"], ["heartO", "Emozionarmi"], ["zap", "Tensione"], ["coffee", "Rilassarmi"], ["rocket", "Evadere"], ["flame", "Azione"]];
vTonight = async function () {
  if (!TN.res) TN.res = await tnCompute();
  const alt = `${v4row("users", "#FF4D79", "Insieme", "Votate dal telefono", "TG.tab='duo';TG.room=null;go('together')")}
${v4row("list", "#B7AEFF", "Dalla mia lista", "Pesco uno dei titoli che hai salvato", "xRoulette()")}
${v4row("clock4", "#2DD4A3", "Quanto tempo hai?", "Film e serie della durata giusta", "go('time')")}
${v4row("cards4", "#FFC94D", "Swipe", "Scegli al volo, una carta alla volta", "go('swipe')")}
${v4row("unlock4", "#38BDF8", "Su altri servizi", "Cosa c’è negli abbonamenti che non hai", "go('other')")}`;
  return `<div class="sec pt v4ton">${v4head("Stasera", "Cosa ti va di guardare?")}
<div class="v4top"><div class="v4surp"><div class="v4srow"><span class="v4lri" style="background:rgba(255,255,255,.18);color:#fff">${ic("dice", 22)}</span><div><b>Sorprendimi</b><small>Un titolo pescato sui tuoi gusti</small></div></div><button class="v4btn w" onclick="tnSurprise()">Scegli tu per me</button></div>
<div class="v4alt v4only-d">${alt}</div></div>
${v4sec("Che umore hai?", "Puoi sceglierne più di uno")}
<div class="v4mood">${V4MOOD.map(([i, l], j) => `<button class="${TN.mood.includes(j) ? "on" : ""}" onclick="tnMood(${j})" aria-pressed="${TN.mood.includes(j)}">${ic(i, 24)}<span>${l}</span></button>`).join("")}</div>
<div class="v4only-m">${v4sec("Altri modi")}<div class="v4alt">${alt}</div></div>
${TN.res.length ? v4sec(TN.mood.length ? "Per il tuo umore" : "Scelti per stasera", TN.res.length + " titoli") + `<div class="grid">${TN.res.map(r => card(r.it, r.extra)).join("")}</div>` : emptyBox("moon", "Nessun risultato con queste scelte sui tuoi abbonamenti. Prova con meno umori.", "")}</div>`;
};

/* ---------- La mia lista ---------- */
let V4LT = "", V4LM = "";
vTrack = async function () {
  const all = Object.values(S.titles);
  const seg = {
    watch: all.filter(t => t.watchlist && !t.watched).sort((a, b) => (b.hype ? 1 : 0) - (a.hype ? 1 : 0)),
    corso: all.filter(t => t.media === "tv" && epCount(t) > 0 && !t.watched).sort((a, b) => ((b.eps || {})._t || 0) - ((a.eps || {})._t || 0)),
    visti: all.filter(t => t.watched).sort((a, b) => (b.watched_on || "").localeCompare(a.watched_on || "")),
    pref: all.filter(t => t.favorite), liste: myLists()
  };
  if (!seg[trkTab]) trkTab = "watch";
  let list = seg[trkTab];
  if (V4LM) list = list.filter(t => t.media === V4LM);
  if (trkTab === "watch" && wlNow) { const ok = await Promise.all(list.map(async t => (await lightProvs(rowItem(t))).some(p => isMine(p.provider_id)))); list = list.filter((t, i) => ok[i]); }
  const tabs = [["watch", "Da vedere"], ["corso", "In corso"], ["visti", "Visti"]];
  const segH = `<div class="v4seg" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="${trkTab === k ? "on" : ""}" aria-selected="${trkTab === k}" onclick="trkGo('${k}')">${l} <small>${seg[k].length}</small></button>`).join("")}</div>`;
  const chip = (on, f, l) => `<button class="chip ${on ? "on" : ""}" onclick="${f}">${l}</button>`;
  const chips = `<div class="row v4chips">${trkTab === "watch" ? chip(wlNow, "wlNow=!wlNow;render()", (wlNow ? ic("check", 15) : "") + "Sui miei servizi") : ""}${chip(V4LM === "movie", "V4LM=V4LM==='movie'?'':'movie';render()", "Film")}${chip(V4LM === "tv", "V4LM=V4LM==='tv'?'':'tv';render()", "Serie TV")}${chip(trkTab === "pref", "trkGo('pref')", "Preferiti")}${chip(trkTab === "liste", "trkGo('liste')", "Le mie liste")}</div>`;
  const title = { watch: wlNow ? "Pronti da guardare" : "Da guardare", corso: "Le serie che stai guardando", visti: "Visti di recente", pref: "Preferiti", liste: "Le mie liste" }[trkTab];
  const empty = { watch: wlNow ? "Nessun titolo della tua lista è disponibile ora sui tuoi abbonamenti." : "La tua lista è vuota. Aggiungi i titoli che vuoi guardare con il tasto “La mia lista”.", corso: "Nessuna serie in corso: segna un episodio come visto e la trovi qui.", visti: "Non hai ancora segnato nulla come visto.", pref: "Nessun preferito: tocca il cuore dentro la scheda di un titolo." }[trkTab];
  const eb = `<button class="btn pri" onclick="goDisc()">Scopri i titoli</button> <button class="btn" onclick="go('tonight')">Cosa guardo stasera?</button>`;
  return `<div class="sec pt v4list">${v4head("La mia lista", "", v4ib("sort4", "trkMore()", "Altro"))}${segH}${chips}
${trkTab === "liste" ? listsHtml() : (list.length ? v4sec(title, list.length + (list.length === 1 ? " titolo" : " titoli")) + `<div class="grid v4grid">${list.map(t => tile(rowItem(t), trkTab)).join("")}</div>` : emptyBox(trkTab === "pref" ? "heart" : "list", empty, eb))}</div>`;
};

/* ---------- Tu ---------- */
vProf2 = async function () {
  await genres().catch(() => {});
  const all = Object.values(S.titles), w = all.filter(t => t.watched), mins = all.reduce((a, t) => a + minsOf(t), 0), rs = w.filter(t => t.stars), avg = rs.length ? rs.reduce((a, t) => a + t.stars, 0) / rs.length : 0;
  const p = P(), nm = p.name || (user ? user.email.split("@")[0] : "Tu");
  let fr = [], req = 0;
  if (xUser()) { try { const r = await sb.rpc("friend_list"); const L = r.data || []; fr = L.filter(x => x.status === "ok"); req = L.filter(x => x.status === "pending" && x.incoming).length; XN.req = req; } catch (e) {} }
  const now = new Date(), ym = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  const dOf4 = t => t.watched ? (t.watched_on || "") : ((t.eps || {})._t ? new Date(t.eps._t).toISOString().slice(0, 10) : "");
  const months = []; for (let i = 6; i >= 0; i--) months.push(ym(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  const cnt = months.map(m => all.filter(t => (t.watched || (t.media === "tv" && epCount(t) > 0)) && dOf4(t).startsWith(m)).length);
  const cur = cnt[6], prev = cnt[5], mx = Math.max(1, ...cnt);
  const gc = {}; all.filter(t => (t.watched || epCount(t) > 0) && dOf4(t).startsWith(months[6])).forEach(t => { const g = GN[(t.genre_ids || [])[0]]; if (g) gc[g] = (gc[g] || 0) + 1; });
  const topG = Object.entries(gc).sort((a, b) => b[1] - a[1])[0];
  const mName = now.toLocaleDateString("it-IT", { month: "long" });
  const diff = cur - prev, prevName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("it-IT", { month: "long" });
  const sub = sb && user ? (S.uname ? "@" + esc(S.uname) : esc(user.email)) + (fr.length ? " · " + fr.length + (fr.length === 1 ? " amico" : " amici") : "") : "Modalità locale";
  return `<div class="sec pt v4tu">
<div class="v4h v4tuh"><div class="v4tua">${avatarMe(64)}<div><h2>${esc(nm)}</h2><p>${sub}</p></div></div><div class="v4hr">${v4ib("set4", "setTab='menu';go('set')", "Impostazioni")}</div></div>
<div class="v4kpis"><div><b>${hrs(mins)}<small> h</small></b><span>di visione</span></div><div><b>${num(w.length)}</b><span>titoli visti</span></div><div><b>${avg ? v4num(avg.toFixed(1)) : "–"}<small> ★</small></b><span>voto medio</span></div></div>
<div class="v4tucols"><div>${v4sec("Il tuo " + mName, "Statistiche", "go('stats')")}
<div class="v4chart" onclick="go('stats')"><div class="v4chh"><div><b>${cur} ${cur === 1 ? "titolo" : "titoli"}</b><small>${diff > 0 ? "+" + diff + " rispetto a " + prevName : diff < 0 ? diff + " rispetto a " + prevName : "come " + prevName}</small></div>${topG ? `<span class="v4pill m">${esc(topG[0])}</span>` : ""}</div><div class="v4bars">${cnt.map((c, i) => `<i class="${i === 6 ? "on" : ""}" style="height:${Math.max(8, Math.round(c / mx * 100))}%" title="${c}"></i>`).join("")}</div></div></div>
<div>${v4sec("Il tuo spazio")}<div class="v4grp">
${v4row("users", "#FF4D79", "Amici", xUser() ? (req ? req + (req === 1 ? " richiesta in attesa" : " richieste in attesa") : fr.length ? fr.length + (fr.length === 1 ? " amico" : " amici") : "Aggiungi i tuoi amici") : "Serve un account", "go('friends')", req ? `<span class="v4badge">${req}</span>` : "")}
${v4row("book4", "#2DD4A3", "Diario", "Quando, dove e con chi", "go('diary')")}
${v4row("bars4", "#B7AEFF", "Statistiche", "Generi, mesi e traguardi", "go('stats')")}
${v4row("euro4", "#FFC94D", "Quale abbonamento ti basta?", "Il piano mese per mese", "go('plan')")}
</div></div></div>
${LEG}<p class="mu small v4foot">Per le serie le ore si calcolano dagli episodi segnati. Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB. Disponibilità dei titoli fornita da JustWatch.</p></div>`;
};

/* ---------- menu: chiudere la ricerca quando si cambia pagina ---------- */
(function () { const g0 = goRaw; goRaw = function () { document.body.classList.remove("v4s"); return g0.apply(this, arguments); }; })();
(function () { const c0 = closeSearchRaw; closeSearchRaw = function () { document.body.classList.remove("v4s"); return c0.apply(this, arguments); }; })();

/* La mia lista › Da vedere: sotto la locandina il servizio dove si guarda (come nel progetto) */
(function () {
  const fp0 = fillProv;
  fillProv = async function () {
    const r = await fp0.apply(this, arguments);
    if (view === "list" && trkTab === "watch") await Promise.all([...document.querySelectorAll(".v4list .nc.v4c[data-k]")].map(async el => {
      const it = byKey(el.dataset.k); if (!it) return;
      const f = await lightProvs(it), p = f.find(x => isMine(x.provider_id)) || f[0], s = el.querySelector(".v4pcs");
      if (p && s) s.textContent = p.provider_name.replace(/ (Amazon Channel|Standard with Ads|with Ads)$/i, "");
    }));
    return r;
  };
})();

/* ---------- Scheda del titolo (come nel progetto) ---------- */
shWatch = function (k, plats) {
  const a = plats ? [...plats.querySelectorAll("a.pl:not(.rb)")] : [], m = a.find(x => x.classList.contains("mine")) || a[0];
  if (!m) return shW0(k, plats);
  const img = m.querySelector("img"), name = m.textContent.replace(/^(Guarda su|Disponibile su)\s*/i, "").replace(/\s*↗\s*$/, "").trim(), mine = m.classList.contains("mine");
  return `${img ? `<img class="swl" hidden src="${esc(img.src)}" alt="">` : ""}<div class="swt" hidden><b>Su ${esc(name)}</b></div><a class="go v4go" href="${esc(m.getAttribute("href"))}" ${m.dataset.pkg ? `data-pkg="${esc(m.dataset.pkg)}"` : ""} target="_blank" rel="noopener" ${brandStyle(name)}>${ic("play", 18)} Guarda su ${esc(name)}</a><div class="v4note${mine ? " ok" : ""}">${mine ? "Incluso nel tuo abbonamento" : "Non è nei tuoi abbonamenti"}${a.length > 1 ? " · disponibile anche su altri " + (a.length - 1) : ""}</div>`;
};
const shW0 = function (k, plats) {
  const it = byKey(k), rb = plats && plats.querySelector("a.pl.rb");
  if (rb) return `<span class="swl eur2">€</span><div class="swt"><b>Noleggio o acquisto</b><span>Su Prime Video, si paga a parte</span></div><a class="go" href="${esc(rb.getAttribute("href"))}" target="_blank" rel="noopener">Apri</a>`;
  return `<span class="swl nos">${ic("calendar", 18)}</span><div class="swt"><b>${it && it.media === "movie" && it.year >= String(new Date().getFullYear() - 1) ? "Al cinema o in arrivo" : "Non è in streaming in Italia"}</b><span>Usa “Avvisami” per sapere quando arriva</span></div>`;
};
(function () {
  const s0 = shSlim;
  shSlim = function (k) {
    s0.apply(this, arguments);
    const box = $("#sheet .sheet.slim"); if (!box || box.dataset.v4) return; box.dataset.v4 = "1";
    const it = byKey(k), t = S.titles[k] || {};
    // in alto: indietro e condividi
    const x = box.querySelector(".xcl"); if (x) x.remove();
    const top = document.createElement("div"); top.className = "v4shtop";
    top.innerHTML = `<button class="v4ib" aria-label="Indietro" onclick="closeSheet()">${ic("back", 20)}</button><button class="v4ib" aria-label="Condividi" onclick="${xUser() ? "shareMenu" : "shareTitle"}('${k}')">${ic("share", 18)}</button>`;
    box.insertBefore(top, box.firstChild);
    // titolo: anno · durata · genere, poi pillole
    const tt = box.querySelector(".shtt"); if (tt && it) {
      const mu = tt.querySelector(".mu"), parts = mu ? mu.textContent.split(" · ").filter(s => !/^TMDB/.test(s)) : [];
      if (mu) mu.textContent = parts.map(s => s.includes(",") ? s.split(",")[0].trim() : s).join(" · ").replace(/(\d+)h (\d+)m/, "$1 h $2 min");
      const p = tt.querySelector("p"), mp = matchPct(it), vote = it.vote || 0;
      if (p) p.outerHTML = `<div class="v4hpills">${mp ? `<span class="v4pill m">${mp}% per te</span>` : ""}${vote ? `<span class="v4pill g">${ic("star", 12)} ${v4num(vote.toFixed(1))}</span>` : ""}</div>`;
      else if (mp || vote) tt.insertAdjacentHTML("beforeend", `<div class="v4hpills">${mp ? `<span class="v4pill m">${mp}% per te</span>` : ""}${vote ? `<span class="v4pill g">${ic("star", 12)} ${v4num(vote.toFixed(1))}</span>` : ""}</div>`);
    }
    // azioni: Lista · Visto · Vota · Altro
    const a4 = box.querySelector(".acts4"); if (a4) { const b = a4.querySelectorAll("button");
      if (b[1]) b[1].querySelector("span").textContent = t.watched ? "Visto" : (it && it.media === "tv" ? "Vista" : "Visto");
      if (b[2]) { b[2].className = t.stars ? "on y" : ""; b[2].setAttribute("onclick", `rate(byKey('${k}'))`); b[2].innerHTML = `${ic("star", 22)}<span>${t.stars ? "★ " + v4num(t.stars) : "Vota"}</span>`; }
      if (b[1] && t.watched) b[1].className = "on g";
    }
  };
})();

/* ---------- Scheda della serie: prossimo episodio + stagione a tendina + elenco episodi ---------- */
const V4SN = {};
const v4svc = () => { const a = [...document.querySelectorAll("#sheet .plats a.pl:not(.rb)")], m = a.find(x => x.classList.contains("mine")) || a[0]; if (!m) return null; return { name: m.textContent.replace(/^(Guarda su|Disponibile su)\s*/i, "").replace(/\s*↗\s*$/, "").trim(), href: m.getAttribute("href"), pkg: m.dataset.pkg || "" }; };
shNext = async function () {}; // il prossimo episodio ora sta nel riquadro "Episodi"
tvPanel = async function (k) {
  const box = $("#tvx"); if (!box) return;
  const hh = box.offsetHeight; if (hh) box.style.minHeight = hh + "px";
  const it = byKey(k), d = await full(it), t = S.titles[k] || {}, eps = t.eps || {}, all = seasonsAll(d), nx = await nextEpFor(k);
  const c = epCount(t), sv = v4svc();
  let h = "";
  if (nx) {
    const sn = all.find(s => s.season_number === nx.s) || {}, w = Object.keys(eps).filter(x => x.startsWith(nx.s + "-")).length, pc = sn.episode_count ? Math.min(100, Math.round(w / sn.episode_count * 100)) : 0;
    h += `<div class="v4nx"><div class="v4nxh"><div class="v4cth" style="${nx.still ? `background-image:url(${IMG}w300${nx.still})` : it.backdrop ? `background-image:url(${IMG}w300${it.backdrop})` : ""}"></div><div class="v4ctx"><div class="v4lab">${c ? "Prossimo episodio" : "Inizia da qui"}</div><b>S${nx.s} · E${nx.e}${nx.name ? " · " + spN(nx.name) : ""}</b>${nx.fut ? `<span>Esce ${inDays(nx.air)}</span>` : `<div class="v4prg"><i style="width:${pc}%"></i></div>`}</div>${nx.fut ? "" : `<button class="v4epc" aria-label="Segna ${sxe(nx.s, nx.e)} come visto" onclick="epNext('${k}')">${ic("check", 18)}</button>`}</div>
${sv && !nx.fut ? `<a class="v4btn v4go2" href="${esc(sv.href)}" ${sv.pkg ? `data-pkg="${esc(sv.pkg)}"` : ""} target="_blank" rel="noopener" ${brandStyle(sv.name)}>${ic("play", 18)} ${c ? "Riprendi" : "Inizia"} su ${esc(sv.name)}</a>` : ""}</div>`;
  } else if (nx === null) h += `<div class="v4nx v4done">${ic("check", 18)} Hai visto tutti gli episodi</div>`;
  if (all.length) {
    const cur = V4SN[k] || (nx ? nx.s : all[all.length - 1].season_number), s = all.find(x => x.season_number === cur) || all[0], w = Object.keys(eps).filter(x => x.startsWith(s.season_number + "-")).length;
    h += `<div class="v4snh"><label class="v4snsel"><select aria-label="Stagione" onchange="V4SN['${k}']=+this.value;tvPanel('${k}')">${all.map(x => `<option value="${x.season_number}"${x.season_number === s.season_number ? " selected" : ""}>Stagione ${x.season_number}</option>`).join("")}</select>${ic("chevD", 16)}</label><span>${s.episode_count ? w + " di " + s.episode_count + " visti" : s.air_date && s.air_date > today() ? "Esce " + fmtD(s.air_date) : "Episodi in arrivo"}</span></div><div id="sn${s.season_number}" class="v4eps"></div>`;
    box.innerHTML = h; await v4season(k, s.season_number);
  } else box.innerHTML = h;
  box.style.minHeight = "";
};
async function v4season(k, sn) {
  const box = $("#sn" + sn); if (!box) return; const ck = k + "|" + sn;
  if (!SEAC[ck]) box.innerHTML = `<p class="mu">Caricamento…</p>`;
  try {
    const it = byKey(k), r = SEAC[ck] || (SEAC[ck] = await tmdb("/tv/" + it.id + "/season/" + sn)), eps = (S.titles[k] || {}).eps || {};
    if (!(r.episodes || []).length) { box.innerHTML = `<p class="mu">Gli episodi di questa stagione non sono ancora stati pubblicati.</p>`; return; }
    const allOn = r.episodes.every(ep => eps[sn + "-" + ep.episode_number]);
    box.innerHTML = r.episodes.map(ep => { const n = ep.episode_number, on = !!eps[sn + "-" + n], fut = ep.air_date && ep.air_date > today(), hide = UI.spoil && !on;
      return `<div class="v4ep${on ? " on" : ""}"><div class="v4eth${hide ? " spo" : ""}" style="${ep.still_path ? `background-image:url(${IMG}w300${ep.still_path})` : ""}" onclick="this.classList.remove('spo')"></div><div class="v4ept"><b>${n}. ${hide ? `<span class="spo" onclick="this.classList.remove('spo')">${esc(ep.name || "")}</span>` : esc(ep.name || "Episodio " + n)}</b><small>${fut ? "Esce " + fmtD(ep.air_date) : ep.runtime ? ep.runtime + " min" : fmtD(ep.air_date)}</small></div>${fut ? "" : `<button class="v4epc${on ? " on" : ""}" aria-pressed="${on}" aria-label="${on ? "Togli visto" : "Segna come visto"}: episodio ${n}" title="Tieni premuto: segna tutto fino a qui" onclick="epTog('${k}',${sn},${n},${!on})" oncontextmenu="event.preventDefault();epUpTo('${k}',${sn},${n})">${on ? ic("check", 16) : ""}</button>`}</div>`; }).join("") +
      `<div class="v4snb"><button class="chip" onclick="seasonAll('${k}',${sn},${!allOn})">${allOn ? "Azzera la stagione" : ic("check", 14) + " Segna tutta la stagione"}</button></div>`;
  } catch (e) { box.innerHTML = `<p class="mu">Episodi non disponibili.</p>`; }
}
(function () {
  const s1 = shSlim;
  shSlim = function (k) {
    s1.apply(this, arguments);
    const box = $("#sheet .sheet.slim"), it = byKey(k); if (!box || !it || it.media !== "tv" || box.dataset.v4tv) return; box.dataset.v4tv = "1";
    box.classList.add("v4tv");
    const tt = box.querySelector(".shtt"), pills = tt && tt.querySelector(".v4hpills"), h2 = tt && tt.querySelector("h2"), mu = tt && tt.querySelector(".mu");
    if (pills && h2) { tt.insertBefore(pills, h2); full(it).then(d => { const n = seasonsOf(d).length; if (n) pills.insertAdjacentHTML("beforeend", `<span class="v4pill d">${n} ${n === 1 ? "stagione" : "stagioni"}</span>`); }).catch(() => {}); }
    if (mu) mu.textContent = "Serie · " + mu.textContent.split(" · ").filter(s => !/stagion|episodio|TMDB/i.test(s)).join(" · ");
    const w = $("#shw"); if (w && w.querySelector(".v4go")) w.classList.add("v4tvw");
  };
})();

/* menu: "Profilo" si chiama "Tu", come nel progetto */
(function () { const r0 = renderNav; renderNav = function () { const r = r0.apply(this, arguments); document.querySelectorAll('#nav button[data-k=prof] b.ll').forEach(b => b.textContent = "Tu"); const pb = $('#nav button[data-k=prof]'); if (pb) pb.setAttribute("aria-label", "Tu"); return r; }; try { renderNav(); } catch (e) {} })();

/* ---------- Schermate secondarie: barra in alto "‹  Titolo" come nel progetto ---------- */
function v4bar(onclick, title, right) {
  const d = document.createElement("div"); d.className = "v4sub";
  d.innerHTML = `<button class="v4ib" aria-label="Indietro">${ic("back", 20)}</button><h1>${esc(title || "")}</h1>${right || ""}`;
  d.firstChild.setAttribute("onclick", onclick || "backNav()"); return d;
}
function v4fix() {
  const m = $("#main"); if (!m) return;
  // pagine con "‹ Indietro" + titolo
  m.querySelectorAll(".sec > .row:first-child > button.back:only-child").forEach(b => {
    const row = b.parentNode; let t = row.nextElementSibling; if (!(t && /^H[12]$/.test(t.tagName))) t = null;
    row.replaceWith(v4bar(b.getAttribute("onclick"), t ? t.textContent.trim() : "")); if (t) t.remove();
  });
  // pagine aperte da Stasera senza tasto indietro
  if (["time", "other", "together", "plan"].includes(view)) { const sec = m.querySelector(".sec"), t = sec && sec.firstElementChild; if (t && t.matches("h2.h")) { t.replaceWith(v4bar(view === "plan" ? "go('home')" : "go('tonight')", t.textContent.trim())); } }
  // impostazioni
  m.querySelectorAll(".seth:not([data-v4])").forEach(h => { h.dataset.v4 = "1"; const b = h.querySelector("button.back"); if (b) { b.className = "v4ib back"; b.innerHTML = ic("back", 20); b.setAttribute("aria-label", "Indietro"); } });
  const sm = m.querySelector(".setw.menu"); if (sm && !sm.querySelector(".v4sub")) sm.insertBefore(v4bar("go('prof')", "Impostazioni"), sm.firstChild);
  // niente emoji nei selettori, come nel progetto
  m.querySelectorAll(".seg2 button").forEach(b => b.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = n.textContent.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, ""); }));
}
(function () {
  const m = $("#main"); if (!m) return; let q = 0;
  new MutationObserver(() => { if (q) return; q = 1; queueMicrotask(() => { q = 0; try { v4fix(); } catch (e) { console.warn("v4", e); } }); }).observe(m, { childList: true, subtree: true });
})();
/* Uscite: titolo grande come le altre pagine principali */
(function () {
  const s0 = vSoon;
  vSoon = async function () {
    const h = await s0.apply(this, arguments), cin = SOONT !== "str";
    return h.replace('<div class="sec pt">', '<div class="sec pt v4soon">' + v4head(cin ? "Al cinema" : "In arrivo", cin ? "In sala e in arrivo nei prossimi mesi" : "Le novità in arrivo sui servizi", V4.mob() ? v4av() : ""));
  };
})();

/* ---------- Diario (come nel progetto) ---------- */
Object.assign(ICO, { cal4: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>', pin4: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>' });
vDiary = async function () {
  const W = Object.values(S.titles).filter(t => t.watched), now = new Date(), ym = now.toISOString().slice(0, 7);
  const L = W.filter(t => DF === "all" || (DF === "movie" || DF === "tv" ? t.media === DF : DF === "w" ? (t.diary || {}).w : DF === "c" ? (t.diary || {}).p === "cinema" : (t.diary || {}).pp || (t.diary || {}).ph)).sort((a, b) => (b.watched_on || "").localeCompare(a.watched_on || ""));
  const by = {}; L.forEach(t => { const m = (t.watched_on || "senza data").slice(0, 7); (by[m] = by[m] || []).push(t); });
  const mname = m => /^\d{4}-\d{2}$/.test(m) ? new Date(m + "-15").toLocaleDateString("it-IT", { month: "long" }) + (m.slice(0, 4) !== ym.slice(0, 4) ? " " + m.slice(0, 4) : "") : "Senza data";
  const day = s => { const d = new Date(s + "T12:00:00"); if (isNaN(d)) return ""; const w = d.toLocaleDateString("it-IT", { weekday: "short" }); return w.charAt(0).toUpperCase() + w.slice(1, 3) + " " + d.getDate() + " " + d.toLocaleDateString("it-IT", { month: "short" }); };
  const ch = (v, l) => `<button class="chip ${DF === v ? "on" : ""}" onclick="DF='${v}';render()">${l}</button>`;
  const nm = W.filter(t => (t.watched_on || "").startsWith(ym)).length, mese = now.toLocaleDateString("it-IT", { month: "long" });
  const stars = n => n ? "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "") : "";
  const row = t => { const d = t.diary || {}, pl = DPL.find(x => x[0] === d.p), ep = t.media === "tv" && (t.eps || {})._n ? "" : "";
    return `<button class="v4de" onclick="openSheet('${t.tmdb_key}')"><span class="v4dpo" style="${t.poster ? `background-image:url(${IMG}w154${t.poster})` : ""}"></span><span class="v4dtx"><b>${esc(t.title)}${ep}</b><small>${t.watched_on ? esc(day(t.watched_on)) : ""}${t.media === "tv" ? " · serie" : ""}</small>${pl || d.w ? `<span class="v4dch">${pl ? `<i>${ic("pin4", 12)}${esc(pl[1])}</i>` : ""}${d.w ? `<i>${ic("users", 12)}${esc(d.w)}</i>` : ""}</span>` : ""}</span>${t.stars ? `<span class="v4dst">${stars(t.stars)}</span>` : ""}</button>`; };
  return `<div class="sec pt v4diary">${v4head("Diario", `${W.length} ${W.length === 1 ? "titolo visto" : "titoli visti"} · ${nm} a ${mese}`, v4ib("cal4", "go('stats')", "Statistiche"))}
<div class="row v4chips">${ch("all", "Tutto")}${ch("movie", "Film")}${ch("tv", "Serie TV")}${ch("c", ic("pin4", 14) + " Al cinema")}${ch("w", "Con qualcuno")}${ch("p", "Con foto")}</div>
${L.length ? Object.keys(by).map(m => `<div class="v4mh"><b>${esc(mname(m))}</b><i></i><span>${by[m].length} ${by[m].length === 1 ? "titolo" : "titoli"}</span></div><div class="v4dl">${by[m].map(row).join("")}</div>`).join("") : emptyBox("edit", DF === "all" ? "Non hai ancora segnato nulla come visto. Quando voti un titolo, lo ritrovi qui." : "Nessun titolo con questo filtro.", "")}</div>`;
};

/* ---------- I miei servizi: elenco con interruttori ---------- */
svList = function (pv) {
  const pl = P().plans || {}, pr = P().prices || {};
  const sub = p => { const x = pl[p.provider_id] || {}, bits = [x.plan || "Attivo", x.day ? "rinnovo il " + x.day : "", pr[p.provider_id] ? eur(+pr[p.provider_id]) + "/mese" : ""].filter(Boolean); return bits.join(" · "); };
  const row = p => { const m = isMine(p.provider_id), id = p.provider_id;
    return `<div class="v4sv${V4.svEdit === id ? " v4open" : ""}"><img src="${IMG}w92${p.logo_path}" alt="" width="40" height="40">${m ? `<button class="v4svt" onclick="v4svEdit(${id})" aria-expanded="${V4.svEdit === id}"><b>${esc(p.provider_name)}</b><small>${esc(sub(p))}</small><small class="v4svu" data-u="${id}"></small></button>` : `<span class="v4svt"><b>${esc(p.provider_name)}</b><small>Non attivo</small></span>`}<input type="checkbox" class="v4tg" role="switch" aria-label="${esc(p.provider_name)}" ${m ? "checked" : ""} onchange="tsub(${id})"></div>${m && V4.svEdit === id ? v4svForm(p) : ""}`; };
  const mine = pv.filter(p => isMine(p.provider_id)), main = pv.filter(p => !isMine(p.provider_id) && p.main), oth = pv.filter(p => !isMine(p.provider_id) && !p.main);
  setTimeout(() => v4svUse(mine), 50);
  return `${mine.length ? `<div class="v4lab v4gl">Abbonamenti attivi · ${mine.length}</div><p class="mu small v4svh">Tocca un abbonamento per segnare piano, prezzo e giorno di rinnovo: ti avviso il giorno prima.</p><div class="v4grp">${mine.map(row).join("")}</div>` : ""}<div class="v4lab v4gl">Altri servizi</div><div class="v4grp">${main.map(row).join("")}</div>${oth.length ? `<details class="v4more"><summary>Mostra altri ${oth.length} servizi</summary><div class="v4grp">${oth.map(row).join("")}</div></details>` : ""}`;
};
function v4svEdit(id) { V4.svEdit = V4.svEdit === id ? 0 : id; render(); }
function v4svForm(p) {
  const x = (P().plans || {})[p.provider_id] || {}, pr = (P().prices || {})[p.provider_id] || "";
  return `<form class="v4sve" onsubmit="event.preventDefault();v4svSave(${p.provider_id},this)"><label>Piano<input name="plan" maxlength="40" list="v4pl" value="${esc(x.plan || "")}" placeholder="Es. Standard"></label>
<datalist id="v4pl"><option value="Base con pubblicità"><option value="Standard"><option value="Premium"><option value="Annuale"><option value="In famiglia"></datalist>
<div class="v4sver"><label>Si rinnova il giorno<select name="day"><option value="">—</option>${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}"${+x.day === i + 1 ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label><label>€ al mese<input name="price" type="number" inputmode="decimal" min="0" step="0.01" value="${pr}"></label></div>
<div class="v4sveb"><button type="button" class="btn" onclick="v4svEdit(0)">Annulla</button><button class="btn pri">Salva</button></div></form>`;
}
function v4svSave(id, f) {
  const pl = P().plans || (P().plans = {}), plan = f.plan.value.trim().slice(0, 40), day = +f.day.value || 0, n = parseFloat(String(f.price.value).replace(",", "."));
  const name = ((PROV || []).find(p => p.provider_id === id) || {}).provider_name || "";
  if (plan || day) pl[id] = { plan, day, n: name.slice(0, 40) }; else delete pl[id];
  const pr = P().prices || (P().prices = {}); if (n > 0) pr[id] = Math.round(n * 100) / 100; else delete pr[id];
  V4.svEdit = 0; saveProfile(); toast("Salvato"); render();
}
/* quanto lo usi: titoli visti negli ultimi 2 mesi che sono su quel servizio */
async function v4svUse(mine) {
  if (!mine.length) return; const lim = Date.now() - 61 * 864e5;
  const W = Object.values(S.titles).filter(t => t.watched && t.watched_on && new Date(t.watched_on) >= lim).slice(0, 30);
  const cnt = {}; await Promise.all(W.map(async t => { try { const f = await lightProvs(rowItem(t)); const ids = new Set(); f.forEach(p => mine.forEach(m => { if (m.provider_id === p.provider_id || (ALIAS[m.provider_id] || []).includes(p.provider_id)) ids.add(m.provider_id); })); ids.forEach(i => { cnt[i] = (cnt[i] || 0) + 1; }); } catch (e) {} }));
  mine.forEach(m => { const el = document.querySelector(`.v4svu[data-u="${m.provider_id}"]`); if (!el) return; const n = cnt[m.provider_id] || 0;
    el.textContent = n ? `${n} ${n === 1 ? "titolo visto" : "titoli visti"} negli ultimi 2 mesi` : "Poco usato: niente visto qui negli ultimi 2 mesi"; el.classList.toggle("low", !n); });
}
/* avviso in Home il giorno prima (e due giorni prima) del rinnovo */
function v4renewals() {
  const pl = P().plans || {}, now = new Date(), out = [];
  Object.entries(pl).forEach(([id, x]) => { if (!x || !x.day || !S.subs.includes(+id)) return;
    for (const dd of [0, 1, 2]) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dd), last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (d.getDate() === Math.min(x.day, last)) { out.push({ id: +id, dd, n: x.n || "Un abbonamento", plan: x.plan || "", key: id + "-" + d.toISOString().slice(0, 10) }); break; } } });
  const hid = lsGet("v4_rhide", []); return out.filter(r => !hid.includes(r.key));
}
function v4rhide(k) { const h = lsGet("v4_rhide", []); h.push(k); lsSet("v4_rhide", h.slice(-30)); render(); }
(function () {
  const h0 = vHome;
  vHome = async function () {
    const h = await h0.apply(this, arguments), R = v4renewals(); if (!R.length) return h;
    const pr = P().prices || {}, txt = r => `${esc(r.n)} si rinnova ${r.dd === 0 ? "oggi" : r.dd === 1 ? "domani" : "dopodomani"}`;
    const box = R.map(r => `<div class="v4renew"><button class="v4lr" onclick="setTab='serv';go('set')"><span class="v4lri" style="background:rgba(255,201,77,.16);color:var(--gold)">${ic("euro4", 20)}</span><span class="v4lrt"><b>${txt(r)}</b><small>${[r.plan, pr[r.id] ? eur(+pr[r.id]) : ""].filter(Boolean).map(esc).join(" · ") || "Tocca per vedere i tuoi abbonamenti"}</small></span></button><button class="v4rx" aria-label="Nascondi" onclick="v4rhide('${r.key}')">${ic("x", 16)}</button></div>`).join("");
    return h.replace('<div class="v4hm">', box + '<div class="v4hm">');
  };
})();
/* chi aveva già attivato i promemoria prima delle notifiche push viene iscritto in automatico */
setTimeout(() => { try { if (xUser() && UI.remind && typeof Notification !== "undefined" && Notification.permission === "granted") xSub().catch(() => {}); } catch (e) {} }, 5000);
(function () { const s0 = setServ; setServ = async function () { return (await s0.apply(this, arguments)).replace("Seleziona i servizi di streaming a cui sei abbonato: ti mostro solo quello che puoi guardare davvero.", "Tocca quelli che hai: nei consigli vedrai prima i titoli inclusi."); }; })();

/* ---------- Insieme (come nel progetto): Serata · Liste · Consigli ---------- */
let V4TG = 0;
vTogether = async function () {
  const bar = `<div class="v4sub"><button class="v4ib" aria-label="Indietro" onclick="go('tonight')">${ic("back", 20)}</button><h1>Insieme</h1></div>`;
  if (!xUser()) return `<div class="sec pt v4tog">${bar}${emptyBox("users", "Per scegliere insieme, consigliarvi film e vedere cosa guardano gli amici serve un account: accedi o registrati.", "")}</div>`;
  clearInterval(TG.timer); await xInbox(true);
  if (!V4TG) { V4TG = 1; if (TG.tab === "new" && !XN.inbox.some(m => !m.seen)) TG.tab = "duo"; }
  if (TG.tab === "friends") { TG.tab = "duo"; setTimeout(() => go("friends"), 0); }
  const nm = XN.inbox.filter(m => !m.seen).length, tabs = [["duo", "Serata"], ["lists", "Liste"], ["new", "Consigli" + (nm ? " · " + nm : "")]];
  let body = ""; try { body = TG.tab === "new" ? await tgNew() : TG.tab === "duo" ? await tgDuo() : await tgLists(); } catch (e) { body = `<p class="mu">Non riesco a caricare: hai eseguito l’aggiornamento SQL in Supabase?</p>`; }
  return `<div class="sec pt v4tog">${bar}${TG.room ? "" : `<div class="v4seg">${tabs.map(([v, l]) => `<button class="${TG.tab === v ? "on" : ""}" onclick="tgTab('${v}')">${l}</button>`).join("")}</div>`}<div class="v4tgb">${body}</div></div>`;
};
tgDuo = async function () {
  if (TG.room) return tgRoom();
  const [rooms, fl] = await Promise.all([tgRooms("duo").then(r => r.filter(x => !/^Serata in TV$/i.test(x.name || ""))), xFriends().catch(() => [])]);
  const col = ["#FF4D79", "#2DD4A3", "#F97316", "#38BDF8", "#A78BFA", "#FFC94D"];
  let h = `<div class="v4night"><div class="v4srow"><span class="v4lri" style="background:rgba(255,77,121,.18);color:#FF4D79">${ic("users", 20)}</span><div><b>Scegliete insieme</b><small>Fino a 6 persone, ognuno dal suo telefono</small></div></div>
<ol class="v4steps"><li><i>1</i>Crea la serata e invita gli amici</li><li><i>2</i>Votate: un super-voto e un veto a testa</li><li><i>3</i>Quando un titolo piace a tutti, è un match</li></ol>
<div class="v4kind" role="group" aria-label="Cosa proponiamo">${[["mix", "Più film"], ["movie", "Solo film"], ["tv", "Solo serie"]].map(([v, l]) => `<button class="${v4kind() === v ? "on" : ""}" aria-pressed="${v4kind() === v}" onclick="v4setKind('${v}')">${l}</button>`).join("")}</div>
<button class="v4btn w" onclick="tgNight()">${ic("plus", 18)} Crea la serata</button></div>`;
  h += v4sec("Invita", fl.length ? "Tutti gli amici" : "Aggiungi amici", "go('friends')") + `<div class="v4inv">${fl.slice(0, 4).map((f, i) => `<button onclick="tgNight()" aria-label="Crea una serata e invita ${esc(f.name || f.username || "")}"><span class="v4ia" style="background:${col[i % col.length]}">${esc((f.name || f.username || "?").trim().charAt(0).toUpperCase())}</span><small>${esc((f.name || f.username || "").split(" ")[0])}</small></button>`).join("")}<button onclick="tgNight()" aria-label="Crea una serata e condividi il link"><span class="v4ia lk">${ic("share", 20)}</span><small>Link</small></button></div>`;
  v4learn();
  const all = await tgRooms("duo").catch(() => []), M = [];
  all.forEach(r => (r.matches || []).forEach(m => M.push(Object.assign({ room: r.name || "Serata", code: r.code }, m))));
  M.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  if (M.length) h += v4sec("Ultimi match", M.length > 4 ? M.length + " in tutto" : "") + `<div class="v4grp v4mt">${M.slice(0, 4).map(m => `<button class="v4lr" onclick="openByKey('${esc(m.k)}')"><span class="v4mpo" style="${m.p ? `background-image:url(${IMG}w154${esc(m.p)})` : ""}"></span><span class="v4lrt"><b>${esc(m.t || "")}</b><small>${esc(m.room)} · ${esc(v4ago(m.at))}</small></span><span class="v4mok">${ic("check", 14)} Match</span></button>`).join("")}</div>`;
  if (rooms.length) h += v4sec("Le tue serate") + `<div class="v4grp">${rooms.slice(0, 6).map(r => v4row("moon", "#B7AEFF", esc(r.name || "Serata"), "Tocca per continuare a votare", `TG.room='${esc(r.id)}';render()`)).join("")}</div>`;
  return h;
};

/* ---------- Guardiamo insieme: più film che serie (circa 3 film ogni serie) ---------- */
function v4ago(t) { const d = Math.floor((Date.now() - new Date(t)) / 864e5); return isNaN(d) ? "" : d <= 0 ? "oggi" : d === 1 ? "ieri" : d < 7 ? d + " giorni fa" : new Date(t).toLocaleDateString("it-IT", { day: "numeric", month: "short" }); }
/* tipo di titoli per le serate: "mix" (più film che serie), "movie" (solo film), "tv" (solo serie) */
const v4kind = () => ["mix", "movie", "tv"].includes(P().tgk) ? P().tgk : "mix";
function v4setKind(k) { P().tgk = k; saveProfile(); render(); }
/* quota di serie nel mix: parte da 1 su 4 e si adatta a come voti (più serie se le voti più dei film, meno se le scarti) */
function v4share() { const v = +lsGet("v4_share", 0); return v >= .1 && v <= .45 ? v : .25; }
async function v4learn() {
  try {
    const r = await sb.from("room_members").select("room_id,votes").eq("user_id", user.id).limit(60); if (r.error || !(r.data || []).length) return;
    const n = { movie: [0, 0], tv: [0, 0] };
    r.data.forEach(m => Object.entries(m.votes || {}).forEach(([k, v]) => { const t = k.split(":")[0]; if (!n[t] || typeof v !== "number") return; n[t][1]++; if (v > 0) n[t][0]++; }));
    if (n.movie[1] < 8 || n.tv[1] < 6) return;
    const rm = (n.movie[0] + 1) / (n.movie[1] + 2), rt = (n.tv[0] + 1) / (n.tv[1] + 2);
    lsSet("v4_share", Math.max(.1, Math.min(.45, .25 * rt / rm)).toFixed(2));
  } catch (e) {}
}
function v4mix(L, n, kind, share) {
  kind = kind || "mix"; share = share == null ? .25 : share;
  const seen = new Set(), U = L.filter(i => i && i.k && !seen.has(i.k) && seen.add(i.k));
  const isTv = i => (i.m || String(i.k).split(":")[0]) === "tv";
  const M = U.filter(i => !isTv(i)), T = U.filter(isTv);
  if (kind === "movie") return M.slice(0, n || M.length);
  if (kind === "tv") return T.slice(0, n || T.length);
  n = Math.min(n || U.length, U.length);
  n = Math.min(n, Math.max(12, Math.round(M.length / (1 - share)))); // pochi film? mazzo più corto, non pieno di serie
  let nT = Math.min(T.length, Math.round(n * share)); const nM = Math.min(M.length, n - nT); nT = Math.min(T.length, n - nM);
  const m = M.slice(0, nM), t = T.slice(0, nT), out = [], every = Math.max(1, Math.round((1 - share) / share));
  while (m.length || t.length) { for (let j = 0; j < every && m.length; j++) out.push(m.shift()); if (t.length) out.push(t.shift()); }
  return out;
}
(function () {
  if (typeof sb === "undefined" || !sb || !sb.rpc) return;
  const rpc0 = sb.rpc.bind(sb);
  sb.rpc = async function (fn, args) {
    try {
      const create = fn === "create_room" && args && args.p_kind === "duo" && (args.p_items || []).length;
      if (create || (fn === "room_contribute" && args && (args.p_items || []).length)) {
        const kind = v4kind(), share = v4share(), isTv = i => (i.m || String(i.k).split(":")[0]) === "tv";
        let L = args.p_items.slice(); const n = create ? Math.min(Math.max(L.length, 20), 30) : L.length;
        if (create) {
          const want = kind === "movie" ? n : kind === "tv" ? 0 : Math.round(n * (1 - share)), wantT = kind === "tv" ? n : 0;
          const hasM = L.filter(i => !isTv(i)).length, hasT = L.filter(isTv).length;
          if (hasM < want || hasT < wantT) {
            const rec = (await recItems(90).catch(() => [])).filter(i => i.poster && !(S.titles[i.key] || {}).watched);
            L = L.concat(rec.filter(i => (hasM < want && i.media === "movie") || (hasT < wantT && i.media === "tv")).map(mini));
          }
        }
        const out = v4mix(L, n, create ? kind : "mix", share);
        if (out.length >= (create ? 6 : 1)) args = Object.assign({}, args, { p_items: out });
      }
    } catch (e) {}
    return rpc0(fn, args);
  };
})();

/* ---------- Notifiche: cosa arriva ---------- */
xRemind = function () {
  const perm = typeof Notification !== "undefined" ? Notification.permission : "unsupported";
  return `<p class="mu">Ti avviso quando:</p><ul class="v4ul"><li>esce un nuovo episodio di una serie che segui</li><li>un amico ti invita a una serata o ti consiglia un titolo</li><li>in una serata c’è un match</li><li>un tuo abbonamento si sta per rinnovare</li></ul>${C.VAPID_PUBLIC ? "" : `<p class="mu small">Solo quando apri l’app.</p>`}
${perm === "unsupported" ? `<p class="mu">Questo browser non supporta le notifiche. Su iPhone installa prima l’app nella schermata Home (Condividi › Aggiungi a Home).</p>` : perm === "denied" ? `<p class="mu">Le notifiche sono bloccate: riattivale dalle impostazioni del sito nel browser.</p>`
    : `<div class="row">${chipB(!UI.remind, "setRemind(false)", "No")}${chipB(UI.remind && perm === "granted", "setRemind(true)", "Sì, avvisami")}</div>`}`;
};
(function () { const g0 = xGo; xGo = function (g) { if (g === "together") { TG.tab = "new"; go("together"); } else if (g === "serv") { setTab = "serv"; go("set"); } else g0(g); }; })();

/* tutto caricato: l’app può partire */
window.MREADY = true; if (window.__mr) window.__mr();
