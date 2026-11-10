// Prepara la cartella da pubblicare: dist/ = sito/ con JS e CSS compattati.
// - ogni file resta separato (stesso ordine di caricamento, stesso comportamento)
// - la versione della cache dell'app (sw.js) si calcola da sola dal contenuto: niente più numeri da aumentare a mano
// Uso: npm i esbuild && node tools/build.mjs
import { cpSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

let esbuild;
try { esbuild = await import("esbuild"); } catch (e) { console.error("Manca esbuild: esegui  npm i esbuild"); process.exit(1); }

const SRC = "sito", OUT = "dist";
rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });

const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } })(OUT);

let before = 0, after = 0;
for (const f of files) {
  const isJs = f.endsWith(".js") && !f.endsWith(".min.js") && !f.endsWith("sw.js") && !f.endsWith("config.js");
  const isCss = f.endsWith(".css");
  if (!isJs && !isCss) continue;
  const src = readFileSync(f, "utf8"); before += src.length;
  // niente cambio dei nomi globali: le pagine li richiamano dagli attributi onclick
  const r = await esbuild.transform(src, { loader: isJs ? "js" : "css", minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: false, legalComments: "none", target: isJs ? "es2020" : "chrome90" });
  writeFileSync(f, r.code); after += r.code.length;
}

// versione della cache = impronta dei file che l'app tiene offline
const sw = join(OUT, "sw.js"), swSrc = readFileSync(sw, "utf8");
const assets = JSON.parse(swSrc.match(/const ASSETS = (\[[^\]]*\])/)[1]);
const h = createHash("sha256");
for (const a of assets) if (a !== "./") h.update(readFileSync(join(OUT, a)));
const ver = "tonightly-" + h.digest("hex").slice(0, 10);
writeFileSync(sw, swSrc.replace(/const V = "[^"]*"/, `const V = "${ver}"`));

console.log(`dist/ pronto · JS e CSS da ${(before / 1024).toFixed(0)} KB a ${(after / 1024).toFixed(0)} KB · cache ${ver}`);
