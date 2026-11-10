/* Tonightly TV – nuovo aspetto: stessi comandi e stesse funzioni, grafica del progetto Figma */
"use strict";
Object.assign(IC, {
  sofa: '<path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3M2 18v-5a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5zM5 18v2M19 18v2"/>',
  heartO: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4"/>',
  laugh: '<circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0zM9 9.5h.01M15 9.5h.01"/>', coffee: '<path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/>',
  rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 13l2 2M14.5 4.5c3-1 5-1 5-1s0 2-1 5L13 14l-3-3z"/>', flame: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-2 2-2 4-2 5-1-1-2-2-2-4-2 2-4 5-4 8a7 7 0 0 0 5 7z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01"/>', star4: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', info4: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
});
/* Stasera: icone al posto delle emoji, come nel progetto */
(function () {
  const M = { solo: "user", coppia: "heartO", amici: "users", bimbi: "sparkle", ep: "zap", corto: "clock", film: "film", sera: "moon", ridere: "laugh", emo: "heartO", tens: "zap", relax: "coffee", eva: "rocket", azione: "flame", sorp: "dice" };
  QS.forEach(q => q.o.forEach(o => { if (M[o[0]] && IC[M[o[0]]]) o[1] = ic(M[o[0]]); }));
})();
/* copertina della Home: pillole (affinità, voto, tipo) e "Apri su …" */
(function () {
  const h0 = heroFill;
  heroFill = async function (it) {
    const r = await h0.apply(this, arguments);
    const h = $(".hero"); if (!h || !it || HERO !== it) return r;
    const pv = it.pv || { mine: [] }, svc = pv.mine[0] || (pv.rb ? { provider_name: "Prime Video", rb: 1 } : null);
    let pills = h.querySelector(".v4p"); if (!pills) { pills = document.createElement("div"); pills.className = "v4p"; h.insertBefore(pills, h.querySelector("h1")); }
    const mp = typeof it.match === "number" ? it.match : it.pct || 0;
    pills.innerHTML = `${mp ? `<span class="m">${Math.round(mp)}% per te</span>` : ""}${it.vote ? `<span class="g">${ic("star4")} ${it.vote.toFixed(1).replace(".", ",")}</span>` : ""}<span>${[it.media === "tv" ? "Serie TV" : "Film", it.year, it.media === "movie" && it.rt ? Math.floor(it.rt / 60) + " h " + (it.rt % 60) + " min" : "", svc ? (svc.rb ? "€ su Prime Video" : "su " + svc.provider_name) : ""].filter(Boolean).join(" · ")}</span>`;
    const b = h.querySelectorAll(".acts .btn");
    if (b[0] && svc && !svc.rb) b[0].lastChild.textContent = " Apri su " + svc.provider_name;
    if (b[2]) { b[2].classList.add("ico"); b[2].innerHTML = ic("info4"); b[2].setAttribute("aria-label", "Dettagli"); }
    return r;
  };
})();

/* ---------- Ricerca: tastiera a griglia a sinistra, risultati a destra ---------- */
const V4K = "abcdefghijklmnopqrstuvwxyz".split("");
function v4key(c) { const q = $("#q"); if (!q) return; q.value = c === "del" ? q.value.slice(0, -1) : q.value + (c === "sp" ? " " : c); v4qShow(); srIn(); }
function v4qShow() { const q = $("#q"), s = $("#v4qv"); if (q && s) s.textContent = q.value; }
showSearch = function () {
  VIEW = "search"; setBg(null);
  $("#app").innerHTML = `<div class="scr"><div class="top"><div class="logo"><span class="lm"></span>${esc(APP)}</div><button class="pill fz" onclick="showStasera(0)">${ic("moon")} Stasera</button><button class="pill fz" onclick="showTogether()">${ic("users")} Insieme</button><button class="pill fz on-v4" onclick="showHome()">${ic("search")} Cerca</button><button class="pill fz me" onclick="showProfile()">${user ? avHtml(S, 2.2) : ic("user")}</button></div>
<div class="v4srch"><div class="v4kb"><label class="v4qf">${ic("search")}<input class="fz" id="q" placeholder="Cerca un titolo" data-enter="srGo" autocomplete="off" oninput="v4qShow();srIn()"><span id="v4qv" hidden></span></label>
<div class="v4keys">${V4K.map(c => `<button class="fz" onclick="v4key('${c}')">${c}</button>`).join("")}<button class="fz" aria-label="Cancella" onclick="v4key('del')">⌫</button><button class="fz" aria-label="Spazio" onclick="v4key('sp')">␣</button></div></div>
<div class="v4sres"><h2 id="v4sh">Cerca film e serie</h2><div id="sres" class="grid"></div></div></div></div>`;
  focusEl($(".v4keys button"));
};
srGo = async function () {
  const q = ($("#q") || {}).value || "", box = $("#sres"), hd = $("#v4sh"); if (!box) return;
  if (q.trim().length < 2) { box.innerHTML = ""; if (hd) hd.textContent = "Cerca film e serie"; return; }
  try {
    const r = await tmdb("/search/multi", { query: q.trim(), include_adult: "false" }); if (($("#q") || {}).value !== q) return;
    const L = (r.results || []).filter(x => (x.media_type === "movie" || x.media_type === "tv") && x.poster_path).slice(0, 12).map(x => keep(norm(x, x.media_type)));
    if (hd) hd.textContent = L.length ? "Risultati per “" + q.trim() + "”" : "Nessun risultato per “" + q.trim() + "”";
    box.innerHTML = L.map(it => `<div class="v4tc">${card(it)}<span class="v4tcs" data-s="${esc(it.key)}">${esc(it.title)}</span></div>`).join("");
    box.querySelectorAll(".card").forEach(c => { c.onclick = () => openDet(ITEMS[c.dataset.k]); });
    L.forEach(async it => { try { const pv = await provsOf(it), s = box.querySelector(`[data-s="${CSS.escape(it.key)}"]`), p = pv.mine[0] || pv.fl[0]; if (s) s.textContent = p ? p.provider_name : pv.rb ? "Noleggio" : ""; } catch (e) {} });
  } catch (e) { box.innerHTML = `<div class="empty">Ricerca non disponibile.</div>`; }
};

/* ---------- Home: "Continua a guardare" con immagini orizzontali, titolo ed episodio ---------- */
(function () {
  const s0 = showHome;
  showHome = async function () {
    const r = await s0.apply(this, arguments);
    const sec = [...document.querySelectorAll("#app .rw")].find(s => /^Continua a guardare/.test((s.querySelector("h2") || {}).textContent || ""));
    if (sec && !sec.classList.contains("v4cw")) {
      sec.classList.add("v4cw");
      sec.querySelectorAll(".card").forEach(async c => {
        const it = ITEMS[c.dataset.k]; if (!it) return; const t = S.titles[it.key] || {};
        c.insertAdjacentHTML("beforeend", `<span class="v4cwt"><b>${esc(it.title)}</b><small></small></span>`);
        try {
          const d = await full(it), nx = nextOf(d, t.eps); const bd = it.backdrop || d.backdrop_path; if (bd) c.style.backgroundImage = `url(${IMG}w780${bd})`;
          const sm = c.querySelector(".v4cwt small"); if (sm) sm.textContent = nx ? "S" + nx.s + " · E" + nx.e : "Tutti gli episodi visti";
        } catch (e) {}
      });
    }
    return r;
  };
})();

/* ---------- Guardiamo insieme: più film che serie (circa 3 film ogni serie) ---------- */
roomDeck = async function (pool) {
  // stessa scelta del telefono (Più film / Solo film / Solo serie), salvata nel profilo
  let kind = "mix"; try { const r = await sb.from("settings").select("prefs").eq("user_id", user.id).maybeSingle(); const k = ((r.data || {}).prefs || {}).tgk; if (["mix", "movie", "tv"].includes(k)) kind = k; } catch (e) {}
  let L = pool && pool.length ? pool.slice() : [];
  if (!L.length) {
    const wl = Object.values(S.titles).filter(t => t.watchlist && !t.watched && t.poster).slice(0, 8).map(rowIt), fy = await forYou().catch(() => []);
    L = wl.concat(fy.filter(i => !wl.some(w => w.key === i.key)));
  }
  L = L.filter(i => i && KEYRE.test(i.key || "") && i.poster);
  const need = m => L.filter(i => (i.media === "tv") === (m === "tv")).length;
  for (const m of kind === "mix" ? ["movie"] : [kind]) if (need(m) < 18) try {
    const r = await tmdb("/discover/" + m, Object.assign({ sort_by: "popularity.desc", "vote_count.gte": 200, page: 1 }, baseQ()));
    L = L.concat((r.results || []).filter(x => x.poster_path).map(x => keep(norm(x, m))).filter(i => !(S.titles[i.key] || {}).watched));
  } catch (e) {}
  const seen = new Set(), U = L.filter(i => !seen.has(i.key) && seen.add(i.key)); let n = Math.min(24, U.length);
  const M = U.filter(i => i.media !== "tv"), T = U.filter(i => i.media === "tv");
  if (kind === "movie") return M.slice(0, 24).map(miniOf);
  if (kind === "tv") return T.slice(0, 24).map(miniOf);
  n = Math.min(n, Math.max(12, Math.round(M.length / .75)));
  let nT = Math.min(T.length, Math.round(n * .25)); const nM = Math.min(M.length, n - nT); nT = Math.min(T.length, n - nM);
  const m = M.slice(0, nM), t = T.slice(0, nT), out = [];
  while (m.length || t.length) { for (let j = 0; j < 3 && m.length; j++) out.push(m.shift()); if (t.length) out.push(t.shift()); }
  return out.map(miniOf);
};
