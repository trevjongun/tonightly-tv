// Controllo dei nomi delle classi CSS del nuovo aspetto (v4.js / tv-v4.js).
// Regola: le classi nuove iniziano con "v4". Una classe senza prefisso usata nel markup nuovo
// può prendere per sbaglio lo stile di una schermata vecchia (è successo con "lg" e "side").
// Le classi vecchie riusate apposta sono nell'elenco CONSENTITE qui sotto.
// Uso: node tools/check-classes.mjs   (esce con errore se trova classi nuove senza prefisso)
import { readFileSync } from "node:fs";

const CONSENTITE = new Set(`
on sec pt row grid rail chip btn pri sm mu small nc pv prov wlb go ico w g d m y r ok wl back
hero hc hbg hdots harr erail rw chips emptyb fz pill me card key empty hot sel scr top logo lm
sheet slim pad shw swl swt ov h h2 bar shd chipw stn res st3 sti acts bh eur2 spo
`.trim().split(/\s+/));

const files = { "sito/v4.js": "sito/style.css", "sito/tv-v4.js": "sito/tv.css" };
let bad = [];
for (const [js, oldCss] of Object.entries(files)) {
  const src = readFileSync(js, "utf8"), css = readFileSync(oldCss, "utf8");
  const used = new Set();
  // class="a b ${x ? "c" : ""}" e className = "..." / classList.add("...")
  for (const m of src.matchAll(/class(?:Name)?\s*=\s*\\?["'`]([^"'`]*)["'`]/g)) m[1].replace(/\$\{[^}]*\}/g, " ").split(/\s+/).forEach(c => c && used.add(c));
  for (const m of src.matchAll(/\?\s*"\s*([a-z][\w-]*)"\s*:\s*""/g)) used.add(m[1]);
  for (const m of src.matchAll(/classList\.(?:add|toggle|remove)\("([\w-]+)"/g)) used.add(m[1]);
  for (const c of used) {
    if (/^v4/.test(c) || CONSENTITE.has(c) || !/^[a-z][\w-]*$/i.test(c)) continue;
    // conta solo se il CSS vecchio ha davvero uno stile per quella classe
    if (new RegExp(`\\.${c}(?![\\w-])`).test(css)) bad.push(`${js}: la classe "${c}" ha già uno stile in ${oldCss}. Usa un nome che inizia con v4 (es. v4${c}).`);
  }
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log("Classi a posto: nessun nome nuovo in conflitto con gli stili vecchi.");
