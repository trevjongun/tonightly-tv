// Prova automatica del sito: apre ogni schermata su telefono, PC e TV con dati finti (niente rete)
// e controlla che non ci siano errori JavaScript e che la pagina abbia contenuto.
// Uso: node test/smoke.mjs [cartella]   (predefinita: sito; in GitHub si prova anche dist)
// Gli screenshot finiscono in test-results/ (utili per vedere cosa è cambiato).
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";
import { api, img } from "./tmdb-finto.mjs";

const DIR = process.argv[2] || "sito", OUT = "test-results";
mkdirSync(OUT, { recursive: true });
const TYPES = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".webmanifest": "application/manifest+json" };
const srv = createServer((q, r) => {
  const p = join(DIR, decodeURIComponent(new URL(q.url, "http://x").pathname)); const f = existsSync(p) && statSync(p).isDirectory() ? join(p, "index.html") : p;
  if (!existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); r.end(readFileSync(f));
}).listen(0);
const BASE = "http://localhost:" + srv.address().port;
const CFG = 'window.CONFIG={APP_NAME:"Tonightly",TMDB_KEY:"x",SUPABASE_URL:"https://x.supabase.co",SUPABASE_ANON_KEY:"k",REGION:"IT",PROV_ORDER:[8,119,337,39,531,1899,350,359,222],SVC_SEARCH:{},LEGAL_NAME:"Test",LEGAL_EMAIL:"test@example.org",LEGAL_ADDRESS:"X"};';
const FAKE = readFileSync(new URL("./fake-supabase.js", import.meta.url), "utf8");

const T = (i, kw = {}) => Object.assign({ user_id: "a", tmdb_key: "movie:" + (1000 + i), media: "movie", tmdb_id: 1000 + i, title: "Film " + i, year: "2020", poster: "/p" + i + ".jpg", genre_ids: [[35, 18], [28, 53], [878, 12]][i % 3], runtime: 110, favorite: false, watched: false, stars: 0, watched_on: null, watchlist: false, hype: false, skipped: false, eps: {} }, kw);
const DB = { settings: [{ user_id: "a", subs: [8, 119], name: "Niko", avatar: 10, prefs: { done: true }, username: "niko" }, { user_id: "b", name: "Marta", avatar: 11, username: "marta" }],
  titles: [...Array.from({ length: 21 }, (_, k) => T(k + 1, { watched: true, stars: [5, 4.5, 4, 3.5, 3, 5, 4][(k + 1) % 7], watched_on: `2026-${String(1 + (k + 1) % 11).padStart(2, "0")}-${String(1 + (k + 1) % 27).padStart(2, "0")}` })), T(40, { watchlist: true }), T(41, { watchlist: true }), T(7, { tmdb_key: "tv:1007", media: "tv", tmdb_id: 1007, title: "Serie", eps: { "1-1": true, "1-2": true, _n: 10, _m: 45, _t: 1790000000000 } })],
  friendships: [{ a: "a", b: "b", status: "ok" }] };

const SITE = [
  ["home", "go('home')"], ["scopri", "goDisc('movie')"], ["stasera", "go('tonight')"], ["lista", "go('list')"], ["tu", "go('prof')"],
  ["scheda-film", "go('home');setTimeout(()=>openSheet('movie:1003'),800)"], ["scheda-serie", "go('home');setTimeout(()=>openSheet('tv:1007'),800)"],
  ["ricerca", "go('home');setTimeout(()=>v4search(),500)"], ["cinema", "go('soon')"], ["insieme", "go('together')"], ["impostazioni", "setTab='menu';go('set')"],
  ["abbonamenti", "setTab='serv';go('set')"], ["notifiche", "setTab='notif';go('set')"], ["diario", "go('diary')"], ["statistiche", "go('stats')"], ["amici", "go('friends')"],
  ["tempo", "go('time')"], ["altri-servizi", "go('other')"], ["swipe", "go('swipe')"], ["quale-abbonamento", "go('plan')"],
];
const TV = [["home", "showHome()"], ["stasera", "showStasera(0)"], ["ricerca", "showSearch()"], ["chi-guarda", "showWho()"], ["servizi", "showServices()"], ["accesso", "showLogin()"]];

const fails = [];
const browser = await chromium.launch();
async function run(name, page0, size, list, mobile) {
  const ctx = await browser.newContext({ viewport: size, isMobile: !!mobile, hasTouch: !!mobile });
  await ctx.route("**/*", r => {
    const u = r.request().url();
    if (u.startsWith(BASE)) return u.endsWith("/config.js") ? r.fulfill({ body: CFG, contentType: "application/javascript" }) : u.endsWith("supabase.min.js") ? r.fulfill({ body: "", contentType: "application/javascript" }) : r.continue();
    if (u.includes("themoviedb.org/3")) return r.fulfill({ body: JSON.stringify(api(u)), contentType: "application/json" });
    if (u.includes("image.tmdb.org")) return r.fulfill({ body: img(u), contentType: "image/svg+xml" });
    return r.abort();
  });
  const pg = await ctx.newPage(), errs = [];
  pg.on("pageerror", e => errs.push(String(e)));
  await pg.addInitScript(`window.__uid='a';if(!localStorage.getItem('fdb'))localStorage.setItem('fdb',${JSON.stringify(JSON.stringify(DB))});`);
  await pg.addInitScript(FAKE);
  await pg.goto(BASE + "/" + page0); await pg.waitForTimeout(3500);
  await pg.evaluate("try{amClose()}catch(e){};try{UI.vid=false}catch(e){}");
  for (const [n, js] of list) {
    errs.length = 0;
    try {
      await pg.evaluate("try{closeAllOv()}catch(e){};try{closeSheet()}catch(e){};try{closeSearchRaw()}catch(e){};try{closeAll()}catch(e){}");
      await pg.evaluate(js); await pg.waitForTimeout(1800);
      const txt = await pg.evaluate("(document.querySelector('#sheet .sheet')||document.querySelector('main')||document.querySelector('#app')||document.body).innerText.trim().length");
      await pg.screenshot({ path: `${OUT}/${name}-${n}.png` });
      const real = errs.filter(e => !/localStorage/.test(e));
      if (real.length) fails.push(`${name} › ${n}: errore JavaScript: ${real[0].slice(0, 200)}`);
      else if (txt < 20) fails.push(`${name} › ${n}: la pagina è vuota`);
      else console.log(`ok  ${name} › ${n}`);
    } catch (e) { fails.push(`${name} › ${n}: ${String(e).slice(0, 200)}`); }
  }
  // controlli di funzionamento
  if (page0 === "index.html") {
    const r = await pg.evaluate(async () => {
      const out = {};
      wlTog("movie:1005"); await new Promise(r => setTimeout(r, 300)); out.lista = !!(S.titles["movie:1005"] || {}).watchlist;
      P().tgk = "mix"; TG.busy = false; await tgNight(); await new Promise(r => setTimeout(r, 500));
      const d = JSON.parse(localStorage.getItem("fdb")); out.stanza = (d.rooms || []).length > 0;
      const L = [...Array.from({ length: 20 }, (_, i) => ({ k: "tv:" + i, m: "tv" })), ...Array.from({ length: 12 }, (_, i) => ({ k: "movie:" + i, m: "movie" }))];
      const mix = v4mix(L, 30, "mix", .25); out.film = mix.filter(i => i.m === "movie").length; out.serie = mix.length - out.film;
      out.solofilm = v4mix(L, 30, "movie").every(i => i.m === "movie");
      return out;
    });
    if (!r.lista) fails.push(`${name}: "La mia lista" non salva il titolo`);
    if (!r.stanza) fails.push(`${name}: non riesco a creare una serata insieme`);
    if (!r.solofilm) fails.push(`${name}: "Solo film" propone anche serie`);
    if (!(r.film >= r.serie * 2)) fails.push(`${name}: la serata insieme ha troppe serie (${r.film} film, ${r.serie} serie)`);
    else console.log(`ok  ${name} › serata insieme: ${r.film} film, ${r.serie} serie`);
  }
  await ctx.close();
}
await run("telefono", "index.html", { width: 390, height: 844 }, SITE, true);
await run("pc", "index.html", { width: 1440, height: 900 }, SITE, false);
await run("tv", "tv.html", { width: 1280, height: 720 }, TV, false);
await browser.close(); srv.close();
if (fails.length) { console.error("\nPROBLEMI:\n- " + fails.join("\n- ")); process.exit(1); }
console.log("\nTutte le schermate si aprono senza errori.");
