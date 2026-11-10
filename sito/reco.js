/* Tonightly · motore dei consigli (versione 2)
 *
 * Si carica dopo app.js e ne sostituisce il vecchio motore (featOf, featFor, signal, decay, affData,
 * scoreOf, matchPct, recItems). Tutto gira sul dispositivo: nessun dato dei gusti esce dall'app.
 *
 * Come ragiona, in breve:
 *  1. PROFILO   – trasforma ciò che fai in segnali: stelle (corrette per il tuo modo di votare),
 *                 preferiti, lista, serie finite o abbandonate, "non mi interessa", schede aperte.
 *                 I segnali vecchi pesano meno (si dimezzano in circa un anno).
 *  2. CARATTERI – per ogni titolo: generi e coppie di generi, parole chiave della trama (pesate per
 *                 rarità), regista/ideatore, sceneggiatori, attori (in ordine di importanza), studi e
 *                 reti, saga, lingua e paese, decennio, età del titolo, durata, popolarità, voto medio.
 *  3. AFFINITÀ  – per ogni carattere stima quanto ti piace con una media "prudente" (poche prove =
 *                 stima vicina a zero). Impara anche QUANTO conta per te ogni tipo di carattere
 *                 (c'è chi segue i registi, chi i generi) con una regressione verificata a esclusione.
 *  4. CANDIDATI – da molte fonti, già filtrate sui tuoi abbonamenti: "chi ha amato X ha amato Y"
 *                 dei tuoi titoli preferiti, parole chiave, persone, studi, generi, gioielli nascosti,
 *                 novità, saghe da continuare, cosa amano i tuoi amici, la ricorrenza del periodo.
 *  5. PUNTEGGIO – affinità + segnale collaborativo + qualità bayesiana + amici + novità + contesto
 *                 (ora, stagione) − titoli che ti mostriamo da giorni e ignori.
 *  6. VARIETÀ   – riordina per non proporre dieci titoli uguali, bilancia film e serie come piace a te
 *                 e lascia due posti a qualcosa di nuovo da scoprire.
 *  7. MOTIVO    – ogni consiglio dice perché: "Perché ti è piaciuto…", "Dal regista di…", ecc.
 */

const RX = { cf: new Map(), cfFrom: new Map(), soc: new Map(), out: null, sig: "", t: 0, busy: null, busySig: "", df: {}, N: 0, sm: null, quality: null, lastInfo: null };

/* ---------- utilità ---------- */
const rxH = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const rxDay = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
const rxInts = (a, n) => Array.isArray(a) ? a.map(Number).filter(Number.isInteger).slice(0, n) : [];
const rxStrs = (a, n, l) => Array.isArray(a) ? a.filter(x => typeof x === "string").map(x => x.slice(0, l)).slice(0, n) : [];
const rxClamp = (v, a, b) => Math.max(a, Math.min(b, v));
async function rxPool(list, n, fn) {
  const out = new Array(list.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => { while (i < list.length) { const j = i++; try { out[j] = await fn(list[j], j); } catch (e) { out[j] = null; } } }));
  return out;
}
const rxLs = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
const rxLsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ---------- caratteri di un titolo ---------- */
function rxSan(f) {
  if (!f || typeof f !== "object" || Array.isArray(f)) return null;
  const o = { v: f.v === 2 ? 2 : 1, g: rxInts(f.g, 8), l: /^[a-z]{2}$/.test(f.l || "") ? f.l : "", y: /^\d{4}$/.test(String(f.y || "")) ? String(f.y) : "", d: rxInts(f.d, 3), c: rxInts(f.c, 6), k: rxInts(f.k, 20), r: rxClamp(+f.r || 0, 0, 1000) };
  if (o.v === 2) Object.assign(o, {
    w: rxInts(f.w, 3), pc: rxInts(f.pc, 4), nw: rxInts(f.nw, 3), co: rxStrs(f.co, 3, 2).filter(x => /^[A-Z]{2}$/.test(x)),
    col: Number.isInteger(f.col) ? f.col : 0, coln: typeof f.coln === "string" ? f.coln.slice(0, 80) : "",
    va: rxClamp(+f.va || 0, 0, 10), vc: rxClamp(Math.round(+f.vc || 0), 0, 1e7), rd: /^\d{4}-\d{2}-\d{2}$/.test(f.rd || "") ? f.rd : "",
    dn: rxStrs(f.dn, 2, 60), cn: rxStrs(f.cn, 4, 60), ad: !!f.ad
  });
  return o;
}
function featOf(d, it) {
  const cr = d.credits || {}, crew = cr.crew || [], cast = (cr.cast || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 6);
  const kw = ((d.keywords || {}).keywords || (d.keywords || {}).results || []).slice(0, 20);
  const dir = it.media === "movie" ? crew.filter(x => x.job === "Director") : (d.created_by || []);
  const wr = crew.filter(x => /^(Screenplay|Writer|Novel|Story|Author)$/.test(x.job)).filter((x, i, a) => a.findIndex(y => y.id === x.id) === i && !dir.some(z => z.id === x.id)).slice(0, 3);
  const col = d.belongs_to_collection || null;
  return rxSan({
    v: 2, g: (d.genres || []).map(x => x.id), l: d.original_language || "", y: (d.release_date || d.first_air_date || "").slice(0, 4),
    d: dir.map(x => x.id), dn: dir.map(x => x.name || ""), w: wr.map(x => x.id), c: cast.map(x => x.id), cn: cast.slice(0, 4).map(x => x.name || ""),
    k: kw.map(x => x.id), pc: (d.production_companies || []).slice(0, 4).map(x => x.id), nw: (d.networks || []).slice(0, 3).map(x => x.id),
    co: d.origin_country && d.origin_country.length ? d.origin_country : (d.production_countries || []).map(x => x.iso_3166_1),
    col: col ? col.id : 0, coln: col ? col.name || "" : "", r: it.media === "movie" ? (d.runtime || 0) : tvMeta(d).m,
    va: d.vote_average || 0, vc: d.vote_count || 0, rd: d.release_date || d.first_air_date || "", ad: !!d.adult
  });
}
/* cache dei caratteri sul dispositivo: le aperture successive sono molto più veloci */
const RXF = "cm_feat2";
(function () { const o = rxLs(RXF, {}); for (const k in o) if (KEYRE.test(k) && !FEAT.has(k)) { const f = rxSan(o[k]); if (f && f.v === 2) FEAT.set(k, f); } })();
let rxFT = 0;
function rxFeatSave() {
  clearTimeout(rxFT);
  rxFT = setTimeout(() => { const o = {}; [...FEAT.keys()].slice(-650).forEach(k => { const f = FEAT.get(k); if (f && f.v === 2) o[k] = f; }); rxLsSet(RXF, o); }, 1500);
}
async function featFor(it) {
  const f0 = FEAT.get(it.key); if (f0 && f0.v === 2) return f0;
  try { const f = featOf(await full(it), it); FEAT.delete(it.key); FEAT.set(it.key, f); rxFeatSave(); return f; } catch (e) { return f0 || null; }
}
const rxFeat = it => Object.assign({ g: it.genre_ids || [], l: it.lang || "", y: it.year || "", va: it.vote || 0, vc: it.vc || 0 }, FEAT.get(it.key) || {}, { m: it.media });

/* tipi di carattere: peso iniziale (w) e prudenza (k = quante prove servono prima di fidarsi) */
const RXT = {
  g: { w: 1, k: 2 }, gp: { w: .6, k: 2.5 }, k: { w: 1, k: 1.2 }, d: { w: .9, k: .8 }, w: { w: .5, k: .8 }, c: { w: .55, k: 1 },
  pc: { w: .45, k: 1.2 }, col: { w: .6, k: .6 }, l: { w: .45, k: 2 }, co: { w: .2, k: 2 }, y: { w: .3, k: 2.5 }, a: { w: .25, k: 3 },
  r: { w: .2, k: 2.5 }, m: { w: .35, k: 3 }, pp: { w: .3, k: 3 }, q: { w: .35, k: 3 }
};
const RXTK = Object.keys(RXT);
const rxIdf = f => { const N = RX.N; if (N < 30) return 1; return rxClamp(Math.log(1 + N / (1 + (RX.df[f] || 0))) / Math.log(1 + N / 6), .45, 1.6); };
function rxKeys(o) {
  const out = [], add = (t, k, a) => out.push([t, k, a == null ? 1 : a]);
  const g = o.g || []; g.forEach(x => add("g", "g" + x));
  const gs = g.slice().sort((a, b) => a - b).slice(0, 4); for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) add("gp", "p" + gs[i] + "-" + gs[j]);
  (o.k || []).forEach(x => add("k", "k" + x, rxIdf("k" + x)));
  (o.d || []).forEach(x => add("d", "d" + x)); (o.w || []).forEach(x => add("w", "w" + x));
  (o.c || []).forEach((x, i) => add("c", "c" + x, 1 / (1 + .35 * i)));
  (o.pc || []).forEach(x => add("pc", "s" + x, rxIdf("s" + x))); (o.nw || []).forEach(x => add("pc", "n" + x));
  if (o.col) add("col", "o" + o.col);
  if (o.l) add("l", "l" + o.l); if ((o.co || [])[0]) add("co", "x" + o.co[0]);
  if (o.y) add("y", decOf(o.y));
  const yr = +String(o.rd || o.y || "").slice(0, 4); if (yr) { const age = new Date().getFullYear() - yr; add("a", "a" + (age <= 1 ? 0 : age <= 4 ? 1 : age <= 12 ? 2 : 3)); }
  if (o.r) add("r", rtB(o.r) + (o.m === "tv" ? "t" : ""));
  if (o.m) add("m", "m" + o.m);
  if (o.vc) add("pp", "pp" + (o.vc < 300 ? 1 : o.vc < 2000 ? 2 : o.vc < 10000 ? 3 : 4));
  if (o.va && (o.vc || 0) >= 50) add("q", "q" + (o.va < 6 ? 5 : o.va < 7 ? 6 : o.va < 7.8 ? 7 : 8));
  return out;
}
function featKeys(o) { const r = {}; rxKeys(o).forEach(([t, k]) => (r[t] = r[t] || []).push(k)); return r; }

/* ---------- segnali: cosa dice di te ogni azione ---------- */
function rxStarMap() {
  const st = Object.values(S.titles).filter(t => t.watched && t.stars).map(t => t.stars); if (st.length < 5) return null;
  const mu = st.reduce((a, b) => a + b, 0) / st.length, sd = Math.sqrt(st.reduce((a, b) => a + (b - mu) * (b - mu), 0) / st.length);
  return { mu, sd: Math.max(.7, sd), n: st.length };
}
function signal(t) {
  let s = 0; const SM = RX.sm;
  if (t.watched && t.stars) {
    const abs = rxAbs(t.stars);
    // chi dà sempre 4 stelle: per lui un 4 è "nella media". Correggo in base al tuo modo di votare.
    if (SM) { const rel = rxClamp((t.stars - SM.mu) / SM.sd * 1.3, -2.2, 2.2), a = Math.min(.6, SM.n / 40); s += (1 - a) * abs + a * rel; } else s += abs;
  } else if (t.watched) s += .45;
  else if (t.media === "tv" && epCount(t) > 0) {
    const e = t.eps || {}, n = e._n || 0, c = epCount(t), r = n ? Math.min(1, c / n) : Math.min(1, c / 10), idle = e._t ? (Date.now() - e._t) / 864e5 : 0;
    if (r >= .9) s += .8;                                   // finita: le è piaciuta
    else if (idle > 60 && r < .35 && !t.watchlist) s -= .5; // iniziata e lasciata presto: non ha convinto
    else s += .2 + r * .6;                                  // in corso
  }
  if (t.favorite) s += 1.1; if (t.watchlist && !t.watched) s += .5; if (t.hype) s += .4; if (t.skipped) s -= .8;
  if (typeof LX !== "undefined") {
    const k = t.tmdb_key, rw = LX.rw[k], bg = LX.bg[k];
    if (rw && t.watched) s += .45 * Math.min(2, rw);                       // rivisto: ti piace davvero
    if (bg && t.media === "tv") s += bg[2] >= 4 ? .35 : bg[2] >= 2 ? .15 : 0; // più episodi in un giorno: ti ha preso
  }
  return s;
}
function decay(t) {
  const d = t.watched_on || (t.eps && t.eps._t ? new Date(t.eps._t).toISOString().slice(0, 10) : ""); if (!d) return 1;
  const days = Math.max(0, (Date.now() - new Date(d).getTime()) / 864e5);
  return Math.max(.4, Math.pow(.5, days / 365));
}
/* segnali impliciti salvati solo sul dispositivo */
const RXI = "cm_rx_imp", RXC = "cm_rx_clk";
const rxClk = () => rxLs(RXC, {});
function rxClick(k) { if (!KEYRE.test(String(k || ""))) return; const c = rxClk(), d = rxDay(), v = c[k] || [0, 0]; if (v[1] !== d) { v[0]++; v[1] = d; } c[k] = v; const ks = Object.keys(c); if (ks.length > 800) ks.slice(0, ks.length - 800).forEach(x => delete c[x]); rxLsSet(RXC, c); }
function rxSeen(items) {
  const m = rxLs(RXI, {}), d = rxDay(); let ch = false;
  items.forEach(it => { const v = m[it.key] || [0, 0]; if (v[1] !== d) { v[0]++; v[1] = d; m[it.key] = v; ch = true; } });
  if (!ch) return; const ks = Object.keys(m); if (ks.length > 1500) ks.slice(0, ks.length - 1500).forEach(x => delete m[x]); rxLsSet(RXI, m);
}
function rxFatigue(k, imp, clk) { const v = imp[k]; if (!v || v[0] < 3) return 0; const c = clk[k]; if (c && c[1] >= v[1] - 3) return 0; return Math.min(.45, .12 * (v[0] - 2)); }

/* ---------- il profilo dei gusti ---------- */
function affData() {
  if (affC) return affC;
  RX.sm = rxStarMap();
  const df = {}; let N = 0;
  FEAT.forEach(f => { N++; (f.k || []).forEach(x => { df["k" + x] = (df["k" + x] || 0) + 1; }); (f.pc || []).forEach(x => { df["s" + x] = (df["s" + x] || 0) + 1; }); });
  RX.df = df; RX.N = N;
  if (P().lx && P().lx !== RX.lxSeen) { RX.lxSeen = P().lx; lxMerge(P().lx); }
  const rows = [], today0 = rxDay(), fk = k => Object.assign({}, FEAT.get(k), { m: k.split(":")[0] });
  Object.values(S.titles).forEach(t => {
    if (t.feat && !(FEAT.get(t.tmdb_key) || {}).v) { const f = rxSan(t.feat); if (f) FEAT.set(t.tmdb_key, f); }
    const s = signal(t); if (!s) return;
    const f = Object.assign({ g: t.genre_ids || [], y: t.year }, FEAT.get(t.tmdb_key) || {}, { m: t.media });
    let K = rxKeys(f);
    // i motivi del voto dicono quali aspetti hanno contato ("mi è piaciuto per gli attori")
    const E = new Set((t.why || []).flatMap(x => TAGT[x] || []));
    if (E.size) K = K.map(([tt, k, a]) => [tt, k, a * (E.has(tt) ? 2 : .6)]);
    // "non per me" con un motivo preciso: colpisce solo quell'aspetto, non tutto il titolo
    const fb = LX.fb[t.tmdb_key]; if (t.skipped && fb && fb[0] < 0 && FBT[fb[1]]) { K = K.filter(([tt]) => FBT[fb[1]].includes(tt)); }
    rows.push({ t, s: t.skipped && fb && FBT[fb[1]] ? -1.1 : s, d: decay(t), K, star: !!(t.watched && t.stars), rich: !!(FEAT.get(t.tmdb_key) || {}).k });
  });
  const real = rows.length;
  for (const k in LX.fb) { const v = LX.fb[k]; if (v[0] > 0 && FEAT.has(k) && !(S.titles[k] && S.titles[k].skipped)) rows.push({ s: .9, d: Math.max(.4, Math.pow(.5, (today0 - v[2]) / 365)), K: rxKeys(fk(k)), imp: true }); }
  for (const k in LX.it) { if (S.titles[k] || !FEAT.has(k)) continue; const v = LX.it[k]; rows.push({ s: Math.min(.8, .1 + .45 * v[0]), d: Math.pow(.5, (today0 - v[1]) / 120), K: rxKeys(fk(k)), imp: true }); }
  for (const k in LX.gv) { const v = LX.gv[k], s = GVS[String(v[0])]; if (!s || !FEAT.has(k) || (S.titles[k] && (S.titles[k].watched || S.titles[k].skipped))) continue; rows.push({ s, d: Math.pow(.5, (today0 - v[1]) / 240), K: rxKeys(fk(k)), imp: true }); }
  const seed = PR().genres || [], prior = Math.max(0, 1 - real / 10) * .45;   // le scelte iniziali contano poco e spariscono dopo una decina di voti veri
  if (prior > 0) seed.forEach(g => rows.push({ s: .7, d: prior, K: [["g", "g" + g, 1]], imp: true }));
  const sum = {}, cnt = {}, ty = {}, best = {};
  rows.forEach(r => r.K.forEach(([tt, f, a]) => {
    const w = r.d * a; sum[f] = (sum[f] || 0) + r.s * w; cnt[f] = (cnt[f] || 0) + w; ty[f] = tt;
    if (r.t && r.s > .8 && (!best[f] || best[f][0] < r.s * r.d)) best[f] = [r.s * r.d, r.t.title, r.t.tmdb_key];
  }));
  const W = {}; for (const f in sum) W[f] = sum[f] / (cnt[f] + RXT[ty[f]].k);
  const imp = rxLearn(rows, sum, cnt, ty);
  const avg = {}, ng = {}; for (const f in W) if (/^g\d+$/.test(f)) { avg[f.slice(1)] = W[f] * 1.6; ng[f.slice(1)] = cnt[f]; }
  const pos = rows.filter(r => r.t && r.s > .3), fm = rxFmt(), p0 = fm === "movie" ? .04 : fm === "tv" ? .96 : .5, kf = fm === "all" ? 6 : 14;
  const tvs = (p0 * kf + pos.filter(r => r.t.media === "tv").length) / (kf + pos.length);   // "Film" o "Serie TV" vale finché i tuoi voti non dicono altro
  setTimeout(rxEnrichLib, 2500);
  return (affC = { W, cnt: real + (seed.length >= 3 && real < 10 ? 1 : 0), avg, n: ng, best, imp, ty, cntF: cnt, tvShare: fm === "all" ? rxClamp(tvs, .1, .9) : rxClamp(tvs, .03, .97) });
}

/* quanto pesa per te ogni tipo di carattere: regressione non negativa, verificata lasciando fuori
   ogni titolo dal profilo mentre lo si prevede (così il modello non "copia" la risposta) */
function rxLearn(rows, sum, cnt, ty) {
  const def = {}; RXTK.forEach(t => { def[t] = RXT[t].w; });
  const R = rows.filter(r => r.star && r.rich); if (R.length < 12) { RX.quality = { n: R.length }; return def; }
  const X = [], Y = [];
  R.forEach(r => {
    const by = {};
    r.K.forEach(([tt, f, a]) => { const w = r.d * a, c = cnt[f] - w; const b = by[tt] || (by[tt] = { s: 0, a: 0 }); b.a += a; if (c > 1e-6) b.s += a * ((sum[f] - r.s * w) / (c + RXT[tt].k)); });
    X.push(RXTK.map(t => by[t] && by[t].a ? Math.tanh(by[t].s / Math.sqrt(by[t].a)) : 0)); Y.push(r.s);
  });
  const n = X.length, b0 = RXTK.map(t => def[t]), lam = 4, pred = (b, x) => x.reduce((a, v, i) => a + v * b[i], 0);
  let b = b0.slice(), lr = .05;
  const loss = bb => X.reduce((a, x, i) => a + (Y[i] - pred(bb, x)) ** 2, 0) / n + lam / n * bb.reduce((a, v, i) => a + (v - b0[i]) ** 2, 0);
  let L = loss(b);
  for (let it = 0; it < 400; it++) {
    const g = b.map((v, j) => -2 / n * X.reduce((a, x, i) => a + (Y[i] - pred(b, x)) * x[j], 0) + 2 * lam / n * (v - b0[j]));
    const nb = b.map((v, j) => Math.max(0, v - lr * g[j])), nl = loss(nb);
    if (nl <= L) { b = nb; L = nl; lr *= 1.1; } else lr *= .5;
    if (lr < 1e-5) break;
  }
  const corr = bb => { const p = X.map(x => pred(bb, x)), mp = p.reduce((a, v) => a + v, 0) / n, my = Y.reduce((a, v) => a + v, 0) / n; let sxy = 0, sxx = 0, syy = 0; p.forEach((v, i) => { sxy += (v - mp) * (Y[i] - my); sxx += (v - mp) ** 2; syy += (Y[i] - my) ** 2; }); return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0; };
  RX.quality = { n, base: +corr(b0).toFixed(3), learned: +corr(b).toFixed(3) };
  // fiducia prudente: più voti hai dato, più conta ciò che il modello ha imparato su di te
  const al = Math.min(.5, n / (n + 80)), out = {}; RXTK.forEach((t, i) => { out[t] = (1 - al) * b0[i] + al * b[i]; }); return out;
}

/* ---------- punteggio di affinità ---------- */
function rxContent(f, A) {
  const by = {};
  rxKeys(f).forEach(([tt, k, a]) => { const w = A.W[k], b = by[tt] || (by[tt] = { s: 0, a: 0, known: 0 }); b.a += a; if (w != null) { b.s += w * a; b.known++; } });
  let tot = 0, wt = 0; const parts = {};
  for (const tt in by) { const b = by[tt]; if (!b.known) continue; const v = Math.tanh(b.s / Math.sqrt(b.a)), im = A.imp[tt] != null ? A.imp[tt] : RXT[tt].w; parts[tt] = v; tot += im * v; wt += im; }
  return { s: wt ? tot / Math.max(wt, 1.5) : 0, parts };
}
/* qualità con media bayesiana: pochi voti = si avvicina alla media generale */
function rxQ(f) {
  const va = +f.va || 0, vc = +f.vc || 0; if (!va) return 0;
  if (!vc) return rxClamp((va - 6.9) / 1.2, -1.5, 1.5) * .5;
  const m = 300, wr = vc / (vc + m) * va + m / (vc + m) * 6.9; return rxClamp((wr - 6.9) / .8, -2, 2);
}
function scoreOf(it, f) { const A = affData(); if (!A.cnt) return 0; return rxContent(Object.assign({ va: it.vote, vc: it.vc }, f), A).s + rxQ({ va: it.vote, vc: it.vc }) * .08 + (RX.cf.get(it.key) || 0) * .4; }
function matchPct(it) {
  const A = affData(); if (A.cnt < 3) return null;
  const f = rxFeat(it), c = rxContent(f, A).s, cf = RX.cf.get(it.key) || 0, q = rxQ(f), so = RX.soc.has(it.key) ? .2 : 0;
  return rxClamp(Math.round(50 + 49 * Math.tanh((c * 1.15 + cf * .5 + q * .12 + so) * 1.3)), 20, 99);
}

/* ---------- candidati ---------- */
const rxFmt = () => ({ movie: "movie", tv: "tv" })[PR().fmt] || "all";
function rxSig() {
  const t = Object.values(S.titles); let h = 0; t.forEach(x => { h += rxH(x.tmdb_key) * (signal(x) + 3); });
  return [S.subs.slice().sort().join(","), (F.svc || []).join(","), R, rxDay(), t.length, h.toFixed(3), rxCtxKey(), rxFmt(), Object.keys(LX.fb).length + Object.keys(LX.gv).length].join("|");
}
function rxSeason(f) {
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate(), k = f.k || [], g = f.g || [];
  if ((m === 10 && day >= 15) || (m === 11 && day <= 2)) { if (k.includes(3335)) return [.35, "Perfetto per Halloween"]; if (g.includes(27)) return [.12, "Perfetto per Halloween"]; }
  if (m === 12 && day <= 26 && k.includes(207317)) return [.35, "Atmosfera natalizia"];
  return [0, ""];
}
async function rxSocial() {
  if (typeof xUser !== "function" || !xUser() || !sb) return [];
  try { const r = await sb.rpc("friend_feed"); return (r.data || []).filter(x => KEYRE.test(x.tmdb_key || "") && (x.stars || 0) >= 4).slice(0, 40); } catch (e) { return []; }
}
async function rxBuild(A) {
  if (await rxEnrichLib(45)) A = affData();
  const prov = (F.svc && F.svc.length ? F.svc : provF()), base = prov.length || !P().pirate ? { watch_region: R, with_watch_monetization_types: "flatrate" } : {};
  if (prov.length) base.with_watch_providers = prov.join("|");
  const td = today(), cand = new Map(); RX.cf = new Map(); RX.cfFrom = new Map(); RX.soc = new Map();
  const add = (it, src, x) => {
    if (!it || !it.poster || it.adult) return; const t = S.titles[it.key];
    if (t && (t.watched || t.skipped || t.watchlist || (t.media === "tv" && epCount(t) > 0))) return;
    let c = cand.get(it.key); if (!c) cand.set(it.key, c = { it, src: new Set(), avail: !prov.length });
    c.src.add(src); if (x) Object.assign(c, x); ITEMS[it.key] = ITEMS[it.key] || it;
  };
  const jobs = [];
  const dsc = (m, q, src, x) => jobs.push(tmdb("/discover/" + m, Object.assign({}, base, q)).then(r => (r.results || []).forEach(o => add(normX(o, m), src, Object.assign({ avail: true }, x || {})))).catch(() => {}));
  const top = (pre, n, min) => Object.keys(A.W).filter(f => f[0] === pre && /^\w\d+$/.test(f) && A.W[f] > (min || .35) && (A.cntF[f] || 0) >= .8).sort((a, b) => A.W[b] - A.W[a]).slice(0, n).map(f => +f.slice(1));
  const rows = Object.values(S.titles).map(t => ({ t, s: signal(t), d: decay(t) })).filter(r => r.s);
  const fake = k => { const [m, id] = k.split(":"), it = byKey(k) || {}; return { tmdb_key: k, media: m, tmdb_id: +id, title: it.title || "un titolo che hai apprezzato" }; };
  for (const k in LX.fb) if (LX.fb[k][0] > 0 && !S.titles[k]) rows.push({ t: fake(k), s: 1.6, d: 1, fb: 1 });
  for (const k in LX.gv) if (LX.gv[k][0] === 2 && !S.titles[k]) rows.push({ t: fake(k), s: 1.1, d: .9 });
  // 1. "chi ha amato X ha amato anche Y" (il filtro collaborativo di TMDB) a partire dai tuoi titoli migliori
  const seeds = rows.filter(r => r.s > .8).sort((a, b) => b.s * b.d - a.s * a.d).slice(0, 12), neg = rows.filter(r => r.s < -.8).sort((a, b) => a.s * a.d - b.s * b.d).slice(0, 4);
  const cfRaw = new Map();
  const recJob = (r, sign) => tmdb("/" + r.t.media + "/" + r.t.tmdb_id + "/recommendations").then(async res => {
    let list = res.results || []; if (sign > 0 && list.length < 6) { try { list = list.concat(((await tmdb("/" + r.t.media + "/" + r.t.tmdb_id + "/similar")).results || []).slice(0, 10)); } catch (e) {} }
    const w = sign * Math.min(1.2, Math.abs(r.s) * r.d / 1.8);
    list.slice(0, 22).forEach((o, j) => {
      const m = o.media_type || r.t.media, it = normX(o, m), v = w * (1 - j / 26) * (sign < 0 ? .6 : 1);
      cfRaw.set(it.key, (cfRaw.get(it.key) || 0) + v);
      if (sign > 0) { const pf = RX.cfFrom.get(it.key); if (!pf || pf[0] < v) RX.cfFrom.set(it.key, [v, r.t.title]); add(it, r.fb ? "fb" : "cf"); }
    });
  }).catch(() => {});
  seeds.forEach(r => jobs.push(recJob(r, 1)));
  seeds.slice(0, 4).forEach(r => jobs.push(tmdb("/" + r.t.media + "/" + r.t.tmdb_id + "/recommendations", { page: 2 }).then(res => (res.results || []).slice(0, 20).forEach((o, j) => {
    const it = normX(o, o.media_type || r.t.media), v = Math.min(1.2, r.s * r.d / 1.8) * (1 - (j + 20) / 46) * .8;
    cfRaw.set(it.key, (cfRaw.get(it.key) || 0) + v); const pf = RX.cfFrom.get(it.key); if (!pf || pf[0] < v) RX.cfFrom.set(it.key, [v, r.t.title]); add(it, "cf");
  })).catch(() => {}))); neg.forEach(r => jobs.push(recJob(r, -1)));
  // 2. parole chiave, persone, studi, reti che ami
  const kws = top("k", 6, .3), ppl = [...top("d", 3, .3), ...top("w", 2, .4), ...top("c", 3, .45)], cos = top("s", 3, .35), nws = top("n", 3, .35);
  if (kws.length) ["movie", "tv"].forEach(m => { dsc(m, { with_keywords: kws.slice(0, 3).join("|"), "vote_count.gte": 40 }, "kw"); if (kws.length > 3) dsc(m, { with_keywords: kws.slice(3).join("|"), "vote_count.gte": 40 }, "kw"); });
  if (ppl.length) dsc("movie", { with_people: ppl.join("|"), "vote_count.gte": 20 }, "ppl");
  if (cos.length) dsc("movie", { with_companies: cos.join("|"), "vote_count.gte": 50 }, "co");
  if (nws.length) dsc("tv", { with_networks: nws.join("|"), "vote_count.gte": 30 }, "co");
  // 3. i tuoi generi: i più amati e i più acclamati, più i gioielli nascosti
  const gTop = Object.entries(A.avg).filter(([g, v]) => v > .15 && GN[g]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => +x[0]);
  gTop.forEach((g, i) => ["movie", "tv"].forEach(m => {
    const gg = m === "tv" ? tvG([g]) : mvG([g]); if (!gg.length) return;
    dsc(m, { with_genres: gg.join("|"), sort_by: "vote_average.desc", "vote_count.gte": m === "tv" ? 250 : 600 }, "gq");
    if (i < 2) dsc(m, { with_genres: gg.join("|"), sort_by: "vote_average.desc", "vote_average.gte": 7.2, "vote_count.gte": 60, "vote_count.lte": 1500 }, "gem", { gem: true });
    if (i === 0) dsc(m, { with_genres: gg.join("|") }, "gp");
  }));
  // 4. popolari e novità sui tuoi servizi (servono anche quando i gusti sono ancora pochi)
  ["movie", "tv"].forEach(m => {
    dsc(m, {}, "pop"); if (A.cnt < 6) dsc(m, { page: 2 }, "pop");
    const dk = m === "tv" ? "first_air_date" : "primary_release_date", from = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
    dsc(m, { [dk + ".gte"]: from, [dk + ".lte"]: td, "vote_count.gte": 15 }, "new", { isNew: true });
  });
  // 5. ricorrenze del periodo
  const mo = new Date().getMonth() + 1, dd = new Date().getDate();
  if ((mo === 10 && dd >= 15) || (mo === 11 && dd <= 2)) dsc("movie", { with_keywords: "3335", "vote_count.gte": 80 }, "seas");
  if (mo === 12 && dd <= 26) ["movie", "tv"].forEach(m => dsc(m, { with_keywords: "207317", "vote_count.gte": 40 }, "seas"));
  // 6. saghe: il prossimo capitolo di una saga che ti è piaciuta
  const cols = rows.filter(r => r.s > .8 && r.t.media === "movie").map(r => [FEAT.get(r.t.tmdb_key) || {}, r.t]).filter(([f]) => f.col).slice(0, 8);
  cols.forEach(([f, t]) => jobs.push(tmdb("/collection/" + f.col).then(c => {
    const parts = (c.parts || []).filter(p => p.release_date && p.release_date <= td && p.poster_path).sort((a, b) => a.release_date.localeCompare(b.release_date));
    const nx = parts.find(p => { const st = S.titles["movie:" + p.id]; return !(st && (st.watched || st.skipped)); });
    if (nx) add(normX(nx, "movie"), "col", { col: t.title });
  }).catch(() => {})));
  // 7. cosa amano i tuoi amici
  jobs.push(rxSocial().then(list => list.forEach(x => {
    const [m, id] = x.tmdb_key.split(":"), it = { key: x.tmdb_key, media: m, id: +id, title: String(x.title || "").slice(0, 200), year: "", poster: POSTRE.test(x.poster || "") ? x.poster : null, backdrop: null, overview: "", genre_ids: [], lang: "", vote: 0 };
    const prev = RX.soc.get(it.key); if (!prev || prev.stars < x.stars) RX.soc.set(it.key, { name: String(x.name || "un amico").slice(0, 40), stars: x.stars });
    add(ITEMS[it.key] || it, "soc");
  })));
  // 8. persone con i tuoi gusti (community di Tonightly, in forma anonima)
  RX.com = new Map();
  jobs.push(rxCommunity(rows).then(list => list.forEach(x => {
    const [m, id] = x.tmdb_key.split(":"), it = { key: x.tmdb_key, media: m, id: +id, title: String(x.title || "").slice(0, 200), year: "", poster: POSTRE.test(x.poster || "") ? x.poster : null, backdrop: null, overview: "", genre_ids: [], lang: "", vote: 0 };
    RX.com.set(it.key, Math.min(40, +x.users || 0)); add(ITEMS[it.key] || it, "com");
  })));
  await Promise.all(jobs);
  cfRaw.forEach((v, k) => RX.cf.set(k, Math.tanh(v / 1.3)));

  // primo giro di punteggio con i dati già noti, poi approfondisco i migliori
  const imp = rxLs(RXI, {}), clk = rxClk(), day = rxDay(), hr = new Date().getHours(), late = hr >= 23 || hr < 5;
  const n = A.cnt, wc = n < 3 ? .25 : Math.min(1.3, .55 + n / 40), wcf = n < 3 ? .3 : n < 8 ? 1 : 1.3, wq = n < 3 ? .55 : n < 15 ? .32 : .25;
  const score = (c, deep) => {
    const f = rxFeat(c.it), ct = n ? rxContent(f, A) : { s: 0, parts: {} }, cf = RX.cf.get(c.it.key) || 0, q = rxQ(f), so = RX.soc.get(c.it.key), [se, seL] = rxSeason(f);
    const yr = +(f.rd || f.y || "0").slice(0, 4), fresh = f.rd && (Date.now() - new Date(f.rd).getTime()) / 864e5 < 90 ? .12 : (c.isNew && yr >= new Date().getFullYear() - 1 ? .08 : 0);
    const com = RX.com.get(c.it.key) || 0, sb2 = Math.max(...[...c.src].map(x => Math.log(rxSrcMult(x)))) * .3, cx = rxCtxBonus(f, c.it.media);
    let s = wc * ct.s + wcf * cf + wq * q + (so ? .45 + .1 * (so.stars - 4) : 0) + fresh + se + (c.col ? .55 : 0) + (c.src.size > 1 ? .04 * Math.min(3, c.src.size - 1) : 0) + (com ? .08 + .12 * Math.tanh(com / 6) : 0) + sb2 + cx;
    if (late && c.it.media === "movie" && (f.r || 0) > 145) s -= .12;           // a tarda notte, meno film-fiume
    if (f.vc && f.vc < 25 && !so) s -= .25;                                        // troppo pochi voti: rischioso
    // film o serie come piace a te: più ti allontani dal 50/50, meno spazio all'altro formato
    const ts = A.tvShare, off = c.it.media === "tv" ? .5 - ts : ts - .5;
    if (off > 0) s -= off * 1.1 + (off > .3 ? 1.2 * (off - .3) / .2 + .25 : 0);
    s -= rxFatigue(c.it.key, imp, clk);
    const unc = n < 3 ? 1 : 1 / Math.sqrt(1 + n / 8);                             // un po' di casualità del giorno, di più se ti conosco poco
    s += (rxH(c.it.key + "|" + day) - .5) * (.06 + .12 * unc);
    Object.assign(c, { s, ct, cf, q, so, f, seL, fresh, com, cx });
    return s;
  };
  let list = [...cand.values()]; list.forEach(c => score(c));
  list.sort((a, b) => b.s - a.s);
  const head = list.slice(0, 80);
  await rxPool(head, 6, c => featFor(c.it));
  head.forEach(c => score(c, true)); head.sort((a, b) => b.s - a.s);
  // disponibilità: i consigli che non arrivano da "scopri sui tuoi servizi" vanno verificati
  if (prov.length) {
    const chk = head.filter(c => !c.avail).slice(0, 36), ok = await rxPool(chk, 6, async c => (await lightProvs(c.it)).some(p => prov.some(id => id === p.provider_id || (ALIAS[id] || []).includes(p.provider_id))));
    chk.forEach((c, i) => { c.avail = !!ok[i]; });
  }
  const pool = head.filter(c => c.avail && !c.it.adult && !(c.f && c.f.ad));
  const out = rxDiverse(pool, A, 40);
  RX.lastInfo = { candidates: cand.size, deep: head.length, kept: pool.length, quality: RX.quality };
  return out.map(c => ({ it: Object.assign({}, c.it, { vc: c.f.vc || c.it.vc || 0 }), extra: rxWhy(c, A), src: c.explore ? "exp" : SRC_PRI.find(x => c.src.has(x)) || "pop" }));
}
const normX = (o, m) => { const it = norm(o, m); it.vc = o.vote_count || 0; it.adult = !!o.adult; return it; };

/* ---------- varietà: niente dieci titoli uguali ---------- */
function rxSim(a, b) {
  const J = (x, y) => { x = x || []; y = y || []; if (!x.length || !y.length) return 0; let i = 0; x.forEach(v => { if (y.includes(v)) i++; }); return i / (x.length + y.length - i); };
  const fa = a.f, fb = b.f;
  return .45 * J(fa.g, fb.g) + .3 * J(fa.k, fb.k) + .15 * ((fa.col && fa.col === fb.col) || J(fa.d, fb.d) > 0 ? 1 : 0) + .1 * (a.it.media === b.it.media ? 1 : 0);
}
function rxDiverse(pool, A, n) {
  const out = [], left = pool.slice(), from = {}, colU = {}, lam = .8, explore = new Set([5, 13, 24]);
  const conf = c => { const g = (c.f.g || [])[0]; return g ? (A.n[g] || 0) : 0; };
  while (out.length < n && left.length) {
    const tvN = out.filter(c => c.it.media === "tv").length, want = A.tvShare;
    let bi = -1, bv = -1e9;
    const exploreSlot = explore.has(out.length) && A.cnt >= 8;
    left.forEach((c, i) => {
      if (exploreSlot && !(conf(c) < .6 && c.q > .4)) return;
      const sim = out.length ? Math.max(...out.map(o => rxSim(c, o))) : 0;
      const src = RX.cfFrom.get(c.it.key), rep = src && (from[src[1]] || 0) >= 3 ? .3 : 0;
      const share = out.length >= 4 ? (c.it.media === "tv" ? (tvN + 1) / (out.length + 1) - want : (out.length - tvN + 1) / (out.length + 1) - (1 - want)) : 0;
      const colP = c.f.col && colU[c.f.col] ? .5 : 0;
      const v = lam * c.s - (1 - lam) * sim * 1.4 - rep - Math.max(0, share - .1) * (A.tvShare < .2 || A.tvShare > .8 ? 2.5 : 1.5) - colP;
      if (v > bv) { bv = v; bi = i; }
    });
    if (bi < 0) { explore.delete(out.length); continue; }
    const c = left.splice(bi, 1)[0]; if (exploreSlot) c.explore = true; out.push(c);
    const src = RX.cfFrom.get(c.it.key); if (src) from[src[1]] = (from[src[1]] || 0) + 1; if (c.f.col) colU[c.f.col] = 1;
  }
  return out;
}

/* ---------- il perché di ogni consiglio ---------- */
function rxWhy(c, A) {
  const f = c.f || {}, bestOf = (pre, ids, min) => { let b = null; (ids || []).forEach((id, i) => { const k = pre + id, w = A.W[k], bt = A.best[k]; if (w > (min || .5) && bt && bt[2] !== c.it.key && (!b || w > b[0])) b = [w, bt[1], i]; }); return b; };
  if (c.col) return "Il seguito di " + c.col;
  if (c.so) return "A " + c.so.name + " è piaciuto (" + String(c.so.stars).replace(".", ",") + "★)";
  if (c.src.has("fb") && RX.cfFrom.get(c.it.key)) return "Più titoli come " + RX.cfFrom.get(c.it.key)[1];
  if (c.com >= 3 && c.ct && c.ct.s < .25 && !(RX.cfFrom.get(c.it.key) && c.cf > .5)) return "Piace a chi ha i tuoi gusti";
  const cfF = RX.cfFrom.get(c.it.key);
  const d = bestOf("d", f.d, .45); if (d && (!cfF || d[0] > cfF[0])) return (c.it.media === "tv" ? "Dall’ideatore di " : "Dal regista di ") + d[1];
  if (cfF && c.cf > .3) return "Perché ti è piaciuto " + cfF[1];
  const w = bestOf("w", f.w, .5); if (w) return "Dallo sceneggiatore di " + w[1];
  const ca = bestOf("c", f.c, .55); if (ca && (f.cn || [])[ca[2]]) return "Con " + f.cn[ca[2]];
  if (c.seL) return c.seL;
  if (c.cx > .14) { const k = rxCtxKey(); return k.endsWith("_n") ? "Adatto a questa ora" : k.startsWith("we") ? "Da weekend, come piace a te" : "Adatto a questo momento"; }
  if (c.explore) return "Da scoprire";
  const kw = bestOf("k", f.k, .4); if (kw) return "Ti ricorda " + kw[1];
  const pc = bestOf("s", f.pc, .5); if (pc) return "Dallo stesso studio di " + pc[1];
  if (c.gem || (f.vc && f.vc < 1500 && f.va >= 7.4)) return "Gioiello nascosto";
  if (c.fresh) return "Novità sui tuoi servizi";
  const gs = (f.g || []).filter(g => (A.avg[g] || 0) > .2 && GN[g]).sort((a, b) => A.avg[b] - A.avg[a]);
  if (gs.length >= 2 && (A.W["p" + Math.min(gs[0], gs[1]) + "-" + Math.max(gs[0], gs[1])] || 0) > .3) return "Ami " + GN[gs[0]] + " e " + GN[gs[1]];
  if (gs[0]) return "Ami " + GN[gs[0]];
  if (c.q > 1.1) return "Acclamato dalla critica";
  return "";
}

/* ---------- uso: consigli pronti subito, aggiornati dietro le quinte ---------- */
const RXO = "cm_rx_out";
function rxTake(out, n) {
  const res = out.filter(r => { const t = S.titles[r.it.key]; return !(t && (t.watched || t.skipped || t.watchlist || (t.media === "tv" && epCount(t) > 0))); }).slice(0, n);
  res.forEach(r => { ITEMS[r.it.key] = ITEMS[r.it.key] || r.it; });
  rxSeen(res.slice(0, Math.min(n, 12)).map(r => r.it));
  let ch = false; res.slice(0, Math.min(n, 12)).forEach(r => { if (!r.src || LX.sh[r.it.key]) return; LX.sh[r.it.key] = [r.src, rxDay(), 0]; const s = LX.src[r.src] || (LX.src[r.src] = [0, 0]); s[0]++; ch = true; });
  if (ch) lxSave(true);
  return res;
}
async function recItems(n) {
  n = n || 20; const A = affData(), sig = rxSig();
  if (RX.out && RX.sig === sig) return rxTake(RX.out, n);
  if (!RX.busy || RX.busySig !== sig) {
    RX.busySig = sig;
    RX.busy = rxBuild(A).then(o => { RX.out = o; RX.sig = sig; RX.t = Date.now(); rxLsSet(RXO, { sig, t: Date.now(), o: o.slice(0, 40) }); return o; }).catch(() => RX.out || []).finally(() => { RX.busy = null; });
  }
  // all'apertura uso i consigli salvati (stessi servizi, stesso giorno) e intanto preparo quelli nuovi
  const st = rxLs(RXO, null), same = st && st.sig && st.sig.split("|").slice(0, 4).join("|") === sig.split("|").slice(0, 4).join("|");
  if (!RX.out && same && Array.isArray(st.o) && Date.now() - st.t < 12 * 36e5) {
    const o = st.o.filter(r => r && r.it && KEYRE.test(r.it.key || "")).map(r => ({ it: Object.assign({}, r.it, { poster: POSTRE.test(r.it.poster || "") ? r.it.poster : null, backdrop: POSTRE.test(r.it.backdrop || "") ? r.it.backdrop : null, title: String(r.it.title || "").slice(0, 200), overview: String(r.it.overview || "").slice(0, 600) }), extra: String(r.extra || "").slice(0, 90), src: /^[a-z]{2,4}$/.test(r.src || "") ? r.src : "" }));
    if (o.length >= Math.min(n, 8)) return rxTake(o, n);
  }
  return rxTake(await RX.busy, n);
}
/* migliora piano piano i titoli della tua libreria che non hanno ancora tutti i caratteri */
let rxLibBusy = null, rxLibDone = 0;
function rxEnrichLib(max) {
  if (rxLibBusy) return rxLibBusy; if (rxLibDone > 400) return Promise.resolve(false);
  const todo = Object.values(S.titles).filter(t => signal(t) && !(t.feat && t.feat.v === 2)).sort((a, b) => Math.abs(signal(b)) * decay(b) - Math.abs(signal(a)) * decay(a)).slice(0, max || 30);
  if (!todo.length) return Promise.resolve(false);
  rxLibBusy = (async () => {
    const keys = [];
    await rxPool(todo, 6, async t => { const f = await featFor(rowItem(t)); const t2 = S.titles[t.tmdb_key]; if (f && t2) { t2.feat = f; keys.push(t.tmdb_key); } });
    rxLibDone += todo.length;
    if (keys.length) { affC = null; if (!max) RX.out = null; saveTitles(keys).catch(() => {}); }
    return keys.length > 0;
  })().finally(() => { rxLibBusy = null; });
  return rxLibBusy;
}
/* le schede aperte contano come un piccolo interesse */
const rxOpenSheet0 = openSheet;
openSheet = function (k) { rxClick(k); return rxOpenSheet0.apply(this, arguments); };

/* =====================================================================================
 * APPRENDIMENTO ESTESO
 *  - "Più così" / "Non per me" (con il motivo) direttamente sui consigli
 *  - quali fonti di consigli funzionano davvero per te (si regolano da sole)
 *  - i motivi del voto ("storia", "attori", "troppo lento"…) e le mezze stelle
 *  - gesti di interesse: trailer, "Guarda su…", tempo sulla scheda
 *  - voti nelle serate di gruppo, serie divorate, titoli rivisti
 *  - gusti diversi a seconda del momento (giorno/sera/notte, feriale/weekend) e dell'umore
 *  - consigli della community: chi ha i tuoi gusti (in forma anonima, almeno 3 persone)
 * ===================================================================================== */
const RXL = "cm_rx_l";
const LX = (() => { const o = rxLs(RXL, {}) || {}; ["fb", "it", "bg", "rw", "gv", "ctx", "src", "sh"].forEach(k => { if (!o[k] || typeof o[k] !== "object" || Array.isArray(o[k])) o[k] = {}; }); return o; })();
const LXCAP = { fb: 250, it: 600, bg: 200, rw: 300, gv: 150, sh: 900 };
let lxT = 0, lxST = 0;
function lxSave(sync) {
  clearTimeout(lxT);
  lxT = setTimeout(() => { for (const k in LXCAP) { const ks = Object.keys(LX[k]); if (ks.length > LXCAP[k]) ks.slice(0, ks.length - LXCAP[k]).forEach(x => delete LX[k][x]); } rxLsSet(RXL, LX); }, 300);
  if (sync) { clearTimeout(lxST); lxST = setTimeout(lxSync, 4000); }
}
function lxPut(m, k, v, sync) { if (!KEYRE.test(String(k || "")) && m !== "src" && m !== "ctx") return; delete LX[m][k]; LX[m][k] = v; lxSave(sync); }
/* ciò che conta davvero si sincronizza col profilo, così vale su tutti i tuoi dispositivi */
function lxSync() {
  if (typeof user === "undefined" || !user) return;
  const pick = (o, n) => { const ks = Object.keys(o).slice(-n), r = {}; ks.forEach(k => { r[k] = o[k]; }); return r; };
  P().lx = { fb: pick(LX.fb, 250), rw: pick(LX.rw, 200), gv: pick(LX.gv, 150), src: LX.src, ctx: LX.ctx };
  saveProfile().catch(() => {});
}
function lxMerge(x) {
  if (!x || typeof x !== "object") return; let ch = false;
  const ok = k => KEYRE.test(k);
  for (const k in (x.fb || {})) { const v = x.fb[k]; if (ok(k) && Array.isArray(v) && (!LX.fb[k] || (+v[2] || 0) > (+LX.fb[k][2] || 0))) { LX.fb[k] = [v[0] > 0 ? 1 : -1, String(v[1] || "").slice(0, 10), +v[2] || 0]; ch = true; } }
  for (const k in (x.rw || {})) { const v = Math.min(9, +x.rw[k] || 0); if (ok(k) && v > (LX.rw[k] || 0)) { LX.rw[k] = v; ch = true; } }
  for (const k in (x.gv || {})) { const v = x.gv[k]; if (ok(k) && Array.isArray(v) && (!LX.gv[k] || (+v[1] || 0) > (+LX.gv[k][1] || 0))) { LX.gv[k] = [rxClamp(Math.round(+v[0] || 0), -1, 2), +v[1] || 0]; ch = true; } }
  for (const s in (x.src || {})) { const v = x.src[s]; if (/^[a-z]{2,5}$/.test(s) && Array.isArray(v)) { const c = LX.src[s] || [0, 0]; LX.src[s] = [Math.max(c[0], +v[0] || 0), Math.max(c[1], +v[1] || 0)]; ch = true; } }
  for (const c in (x.ctx || {})) { const v = x.ctx[c]; if (/^[a-z_]{1,4}$/.test(c) && v && typeof v === "object" && (+v._t || 0) > ((LX.ctx[c] || {})._t || 0)) { const o = {}; for (const f in v) if (/^[a-z_]{1,2}\w{0,8}$/.test(f)) o[f] = +v[f] || 0; LX.ctx[c] = o; ch = true; } }
  if (ch) { rxLsSet(RXL, LX); affC = null; }
}
const rxAbs = s => { const m = [-2.2, -1.2, .1, 1.2, 2.2]; if (s < 1) return -2.4; const i = Math.floor(s) - 1, f = s - Math.floor(s); return i >= 4 ? m[4] : m[i] + (m[i + 1] - m[i]) * f; };

/* --- quale fonte ha prodotto un consiglio, e cosa ne hai fatto --- */
const SRC_PRI = ["col", "soc", "com", "fb", "cf", "ppl", "kw", "co", "gem", "gq", "new", "seas", "gp", "pop"];
const SRC_NAME = { col: "seguiti di saghe", soc: "amici", com: "persone con i tuoi gusti", fb: "“più così”", cf: "titoli simili a quelli che ami", ppl: "registi e attori", kw: "temi che ami", co: "studi e reti", gem: "gioielli nascosti", gq: "i migliori dei tuoi generi", new: "novità", seas: "ricorrenze", gp: "i tuoi generi", pop: "i più visti", exp: "da scoprire" };
const RWB = { open: [1, .15], dwell: [2, .15], trailer: [4, .25], link: [8, .6], list: [16, .5], watched: [32, .6], like: [64, .5], dislike: [128, -.5], not: [256, -.6], more: [512, .5] };
function rxReward(k, kind) {
  const sh = LX.sh[k], b = RWB[kind]; if (!sh || !b || (sh[2] & b[0])) return;
  sh[2] |= b[0]; const s = LX.src[sh[0]] || (LX.src[sh[0]] = [0, 0]); s[1] = Math.round((s[1] + b[1]) * 100) / 100; lxSave(true);
}
function rxSrcMult(s) {
  let I = 0, Rw = 0; for (const x in LX.src) { I += LX.src[x][0]; Rw += LX.src[x][1]; }
  const mu = (Rw + 1) / (I + 10), v = LX.src[s] || [0, 0], m = (v[1] + mu * 15) / (v[0] + 15);
  return rxClamp(m / mu, .55, 1.8);
}
/* --- interesse: scheda aperta, tempo passato, trailer, "Guarda su…" --- */
const ITW = { open: .15, dwell: .25, trailer: .35, link: .6 };
function rxIntent(k, kind) {
  if (!KEYRE.test(String(k || ""))) return; const d = rxDay(), v = LX.it[k] || [0, d];
  lxPut("it", k, [Math.min(1.5, (v[1] === d ? v[0] : v[0] * .8) + ITW[kind]), d]); rxReward(k, kind);
  if (kind === "link") rxCtxAdd(k, 1);
}
/* --- il momento: gusti diversi di giorno, di sera, di notte, nei feriali o nel weekend --- */
function rxCtxKey() { const n = new Date(), h = n.getHours(), wd = n.getDay(), we = wd === 0 || wd === 6 || (wd === 5 && h >= 18); return (we ? "we" : "wd") + "_" + (h >= 5 && h < 18 ? "g" : h >= 18 && h < 22 ? "s" : "n"); }
function rxCtxFeats(f, m) { const o = (f.g || []).slice(0, 3).map(g => "g" + g); o.push("m" + m); if (f.r) o.push(rtB(f.r) + (m === "tv" ? "t" : "")); return o; }
function rxCtxAdd(k, w, feats) {
  const m = String(k || "").split(":")[0], f = feats || rxCtxFeats(FEAT.get(k) || { g: (byKey(k) || {}).genre_ids || [] }, m), ck = rxCtxKey();
  [ck, "_a"].forEach(c => { const o = LX.ctx[c] || (LX.ctx[c] = { _t: 0 }); f.forEach(x => { o[x] = Math.round(((o[x] || 0) + w) * 100) / 100; }); o._t = Math.round((o._t + w) * 100) / 100; });
  lxSave(true);
}
function rxCtxBonus(f, m) {
  const c = LX.ctx[rxCtxKey()], a = LX.ctx._a; if (!c || !a || c._t < 4) return 0;
  const fs = rxCtxFeats(f, m); let s = 0; fs.forEach(x => { s += Math.log(((c[x] || 0) + .5) / (c._t + 3) / (((a[x] || 0) + .5) / (a._t + 3))); });
  return rxClamp(s / fs.length * .12, -.2, .2);
}
/* --- dopo un voto --- */
function rxRated(k, s, rewatched) {
  if (rewatched) lxPut("rw", k, Math.min(9, (LX.rw[k] || 0) + 1), true);
  rxReward(k, "watched"); if (s >= 4) rxReward(k, "like"); else if (s && s <= 2) rxReward(k, "dislike");
  if (!s || s >= 3) rxCtxAdd(k, .8);
  affC = null;
}
/* --- "Più così" e "Non per me" --- */
async function rxMore(k) {
  lxPut("fb", k, [1, "", rxDay()], true); rxReward(k, "more"); affC = null; RX.out = null;
  toast("Ok: ti proporrò più titoli così"); vib(10);
  const it = byKey(k); if (it) { await featFor(it); affC = null; }
  if (view === "home" && typeof HERO !== "undefined" && HERO.items.some(i => i.key === k)) showHero(HERO.i + 1);
}
function rxNot(k) {
  const it = byKey(k); if (!it) return;
  amenu("Perché non fa per te?", [["x", "Non mi attira", `rxNotWhy('${k}','gen')`], ["film", "Il genere non fa per me", `rxNotWhy('${k}','genere')`], ["clock", "Troppo lungo", `rxNotWhy('${k}','lungo')`], ["users", "Non mi piacciono gli attori", `rxNotWhy('${k}','attori')`], ["check", "L’ho già visto", `rxNotWhy('${k}','visto')`]]);
}
async function rxNotWhy(k, why) {
  const it = byKey(k); if (!it) return;
  if (why === "visto") { rxReward(k, "watched"); return rate(it); }
  lxPut("fb", k, [-1, why, rxDay()], true); rxReward(k, "not"); featFor(it);
  await put(it, { skipped: true, watchlist: false }); affC = null; RX.out = null;
  toast("Capito, ne terrò conto"); vib(10);
  if (view === "home" && typeof HERO !== "undefined" && HERO.items.some(i => i.key === k)) { HERO.items = HERO.items.filter(i => i.key !== k); if (HERO.items.length) showHero(HERO.i); }
  else if (["home", "movie", "tv", "tonight"].includes(view)) { const y = window.scrollY; await render(); window.scrollTo(0, y); }
}
/* mappa: motivo del voto -> aspetti a cui dare più peso */
const TAGT = { storia: ["k", "w"], nstoria: ["k", "w"], finale: ["k", "w"], nfinale: ["k", "w"], attori: ["c"], nattori: ["c"], regia: ["d"], visual: ["d", "pc"], musica: ["d", "pc"], atmo: ["g", "gp", "k"], ritmo: ["r", "g"], lento: ["r", "g"], lungo: ["r"], genere: ["g", "gp"] };
const FBT = { genere: ["g", "gp"], lungo: ["r"], attori: ["c"] };
const GVS = { "2": .9, "1": .35, "0": -.2, "-1": -1 };

/* --- collegamenti con il resto dell'app --- */
ICO.up = '<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 6.5a2 2 0 0 1-2 1.7H7"/>';
ICO.down = '<path d="M7 13V4H4v9zM7 13l4 8a2 2 0 0 0 2-2v-4h5.5a2 2 0 0 0 2-2.3l-1.2-6.5a2 2 0 0 0-2-1.7H7"/>';
(function () {
  const os = openSheet; RX.cur = null;
  openSheet = function (k) { if (RX.cur && RX.cur[0] !== k) rxDwell(); RX.cur = [k, Date.now()]; rxIntent(k, "open"); return os.apply(this, arguments); };
  const cs = closeSheetRaw; closeSheetRaw = function () { rxDwell(); RX.cur = null; return cs.apply(this, arguments); };
  const tr = shTrailer; shTrailer = function () { if (RX.cur) rxIntent(RX.cur[0], "trailer"); return tr.apply(this, arguments); };
  document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("#sheet a.pl"); if (a && RX.cur) rxIntent(RX.cur[0], "link"); }, true);
  const pu = put; put = async function (it, p) {
    const before = S.titles[it.key] || {}, r = await pu.apply(this, arguments);
    if (p && p.watchlist && !before.watchlist) rxReward(it.key, "list");
    if (p && p.skipped && !before.skipped && !(LX.fb[it.key] && LX.fb[it.key][0] < 0)) rxReward(it.key, "not");
    return r;
  };
  const se = setEps; setEps = async function (k) {
    const b = epCount(S.titles[k] || {}), r = await se.apply(this, arguments), dl = epCount(S.titles[k] || {}) - b;
    if (dl > 0 && dl <= 3) { const d = rxDay(), v = (LX.bg[k] || [0, 0, 0]).slice(); if (v[0] !== d) { v[0] = d; v[1] = 0; } v[1] += dl; v[2] = Math.max(v[2], v[1]); lxPut("bg", k, v); if (v[1] === 1) rxCtxAdd(k, .5); }
    return r;
  };
  if (typeof tnMood === "function") { const tm = tnMood; tnMood = function (i) { const on = !TN.mood.includes(i); const r = tm.apply(this, arguments); if (on && MOODS[i]) rxCtxAdd("tv:0", .3, MOODS[i][1].map(g => "g" + g)); return r; }; }
})();
function rxDwell() { if (!RX.cur) return; const s = (Date.now() - RX.cur[1]) / 1000; if (s >= 25 && s < 1800) rxIntent(RX.cur[0], "dwell"); }
/* le serate di gruppo insegnano qualcosa (extra.js si carica dopo: collego quando è pronto) */
function rxHookGroup() {
  if (typeof tgVote !== "function" || tgVote.rx) return;
  const tv = tgVote; tgVote = async function (k, v) { const r = await tv.apply(this, arguments); if (KEYRE.test(String(k || ""))) { lxPut("gv", k, [v, rxDay()], true); const [m, id] = k.split(":"); featFor({ key: k, media: m, id: +id }); affC = null; } return r; }; tgVote.rx = 1;
}
setTimeout(rxHookGroup, 0); document.addEventListener("DOMContentLoaded", rxHookGroup);

/* community: titoli amati da chi ha amato i tuoi stessi titoli (almeno 3 persone, nessun dato personale) */
async function rxCommunity(rows) {
  if (typeof xUser !== "function" || !xUser() || !sb || P().nocommunity) return [];
  const keys = rows.filter(r => r.s > 1 && r.t && KEYRE.test(r.t.tmdb_key || "")).sort((a, b) => b.s * b.d - a.s * a.d).slice(0, 30).map(r => r.t.tmdb_key);
  if (keys.length < 2) return [];
  try {
    const r = await sb.rpc("community_recs", { p_keys: keys }); if (r.error) return [];
    const list = (r.data || []).filter(x => KEYRE.test(x.tmdb_key || "")).slice(0, 60);
    /* titolo e locandina li scrivono gli utenti: li riprendo da TMDB, così nessuno può far comparire testi falsi agli altri */
    const ok = await rxPool(list, 6, async x => { try { const [m, id] = x.tmdb_key.split(":"), d = await full({ media: m, id: +id }); if (!d || d.adult) return false; x.title = d.title || d.name || ""; x.poster = d.poster_path || null; return !!x.title; } catch (e) { return false; } });
    return list.filter((x, i) => ok[i]);
  } catch (e) { return []; }
}
/* cosa ha imparato l'algoritmo (visibile nel profilo) */
function rxReport() {
  const A = affData(), n = Object.values(S.titles).filter(t => t.watched && t.stars).length, sig = Object.keys(LX.it).length + Object.keys(LX.fb).length + Object.keys(LX.gv).length;
  const src = Object.entries(LX.src).filter(([, v]) => v[0] >= 8).map(([s, v]) => [s, v[1] / v[0]]).sort((a, b) => b[1] - a[1]);
  return { n, sig, why: Object.values(S.titles).filter(t => (t.why || []).length).length, best: src.slice(0, 2).map(x => SRC_NAME[x[0]] || x[0]), worst: src.length > 3 ? SRC_NAME[src[src.length - 1][0]] : "", q: RX.quality };
}
function rxForget() {
  if (!confirm("Azzerare ciò che l’algoritmo ha imparato da tocchi, “Più così/Non per me”, serate e orari? Voti, liste e titoli visti restano.")) return;
  ["fb", "it", "bg", "rw", "gv", "ctx", "src", "sh"].forEach(k => { LX[k] = {}; }); rxLsSet(RXL, LX); rxLsSet(RXI, {}); rxLsSet(RXC, {}); rxLsSet(RXO, null);
  P().lx = { fb: {}, rw: {}, gv: {}, src: {}, ctx: {} }; RX.lxSeen = P().lx; saveProfile().catch(() => {}); affC = null; RX.out = null; toast("Fatto: si riparte dai tuoi voti"); render();
}

/* =====================================================================================
 * Sorprendimi: un titolo pescato in profondità dal catalogo, scelto sui TUOI gusti.
 * Non usa la community né la lista dei consigli già in Home: cerca tra generi, temi, registi e
 * attori che ami, in pagine e decenni sempre diversi, e ricorda cosa ti ha già proposto.
 * ===================================================================================== */
const RXS = "cm_surp";
async function rxSurprise(moodG) {
  const A = affData(), td = today(), rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const prov = (F.svc && F.svc.length ? F.svc : provF()), base = prov.length || !P().pirate ? { watch_region: R, with_watch_monetization_types: "flatrate" } : {};
  if (prov.length) base.with_watch_providers = prov.join("|");
  const medias = A.tvShare < .2 ? ["movie"] : A.tvShare > .8 ? ["tv"] : ["movie", "tv"];
  const topW = (pre, n, min) => Object.keys(A.W).filter(f => f[0] === pre && /^\w\d+$/.test(f) && A.W[f] > min && (A.cntF[f] || 0) >= .8).sort((a, b) => A.W[b] - A.W[a]).slice(0, n).map(f => +f.slice(1));
  let gs = Object.entries(A.avg).filter(([g, v]) => v > .12 && GN[g]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => +x[0]);
  if (!gs.length) gs = (PR().genres || []).slice(0, 6);
  if (moodG && moodG.length) { const both = gs.filter(g => moodG.includes(g)); gs = both.length ? both : moodG.slice(); }
  const kws = topW("k", 8, .3), ppl = [...topW("d", 4, .3), ...topW("c", 4, .45)];
  const hist = new Set(rxLs(RXS, [])), shown = new Set(((RX.out || []).slice(0, 24)).map(r => r.it.key)), cand = new Map(), jobs = [];
  const q = (m, extra, w) => jobs.push(tmdb("/discover/" + m, Object.assign({}, base, extra)).then(r => (r.results || []).forEach(o => {
    const it = normX(o, m), t = S.titles[it.key];
    if (!it.poster || it.adult || hist.has(it.key) || shown.has(it.key) || (t && (t.watched || t.skipped || t.watchlist || (m === "tv" && epCount(t) > 0)))) return;
    const c = cand.get(it.key); if (c) c.w += w; else { cand.set(it.key, { it, w }); ITEMS[it.key] = ITEMS[it.key] || it; }
  })).catch(() => {}));
  medias.forEach(m => {
    const G = g => (m === "tv" ? tvG(g) : mvG(g)), dk = m === "tv" ? "first_air_date" : "primary_release_date", vmin = m === "tv" ? 60 : 120;
    for (let i = 0; i < 3; i++) {   // i tuoi generi, scavando lontano dalle prime pagine
      const g = G([pick(gs.length ? gs : [18])]); if (!g.length) continue;
      q(m, { with_genres: g.join(","), sort_by: "vote_average.desc", "vote_count.gte": vmin, page: rnd(1, 12) }, 1);
      q(m, { with_genres: g.join(","), sort_by: "popularity.desc", "vote_count.gte": vmin, "vote_average.gte": 6.6, page: rnd(3, 25) }, .8);
    }
    const y0 = pick([1970, 1980, 1990, 2000, 2010, 2015, 2020]), g2 = G(gs.slice(0, 3));
    q(m, Object.assign({ sort_by: "vote_average.desc", "vote_count.gte": vmin, [dk + ".gte"]: y0 + "-01-01", [dk + ".lte"]: (y0 + 9) + "-12-31", page: rnd(1, 4) }, g2.length ? { with_genres: g2.join("|") } : {}), .9);
    if (kws.length) q(m, { with_keywords: [pick(kws), pick(kws)].join("|"), "vote_count.gte": 30, page: rnd(1, 3) }, 1.2);
    if (m === "movie" && ppl.length) q(m, { with_people: [pick(ppl), pick(ppl)].join("|"), "vote_count.gte": 30, page: 1 }, 1.3);
  });
  await Promise.all(jobs);
  let list = [...cand.values()]; if (!list.length) return null;
  const sc = (c, deep) => { const f = rxFeat(c.it), ct = A.cnt ? rxContent(f, A) : { s: 0, parts: {} }, qq = rxQ(f); Object.assign(c, { f, ct, q: qq, cf: RX.cf.get(c.it.key) || 0, src: new Set(["gq"]), so: null, com: 0, cx: 0, seL: "" }); c.s = ct.s * 1.4 + qq * .3 + Math.log(1 + c.w) * .15 + (f.vc && f.vc < 40 ? -.4 : 0) + (deep ? 0 : Math.random() * .1); return c.s; };
  list.forEach(c => sc(c)); list.sort((a, b) => b.s - a.s);
  const head = list.slice(0, 24); await rxPool(head, 6, c => featFor(c.it)); head.forEach(c => sc(c, true)); head.sort((a, b) => b.s - a.s);
  const top = head.filter(c => !(c.f && c.f.ad)).slice(0, 7); if (!top.length) return null;
  // tra i migliori ne scelgo uno a caso, con più probabilità per chi ti somiglia di più
  const ws = top.map((c, i) => Math.exp(c.s * 2) / (1 + i * .25)), tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot, ch = top[0];
  for (let i = 0; i < top.length; i++) { r -= ws[i]; if (r <= 0) { ch = top[i]; break; } }
  rxLsSet(RXS, [ch.it.key, ...[...hist].filter(k => k !== ch.it.key)].slice(0, 150));
  return { it: Object.assign({}, ch.it, { vc: ch.f.vc || ch.it.vc || 0 }), extra: rxWhy(ch, A) || "Scelto sui tuoi gusti", pct: matchPct(ch.it) };
}
