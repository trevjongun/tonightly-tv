const V = "tonightly-v92";
const ASSETS = ["./", "index.html", "style.css", "app.js", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon.svg", "icon-maskable-192.png", "icon-maskable-512.png", "privacy.html", "termini.html", "cookie.html", "crediti.html", "google-logo.svg", "extra.js", "reco.js", "more.js", "v2.js", "v3.js", "v4.js", "v4.css", "fonts/plus-jakarta-sans-400.woff2", "fonts/plus-jakarta-sans-500.woff2", "fonts/plus-jakarta-sans-600.woff2", "fonts/plus-jakarta-sans-700.woff2", "fonts/plus-jakarta-sans-800.woff2", "supabase.min.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V && x !== "tonightly-data").map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  /* in cache solo risposte riuscite del sito (niente errori, niente pagine di altri) */
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { if (r.ok && r.type === "basic") { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request)));
});
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  e.waitUntil(self.registration.showNotification(d.title || "Novità", { body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag, data: { url: d.url || "./?go=soon" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close(); let u = (e.notification.data && e.notification.data.url) || "./";
  /* si aprono solo pagine dell'app, mai indirizzi esterni */
  try { const x = new URL(u, self.registration.scope); u = x.origin === location.origin ? x.href : "./"; } catch (err) { u = "./"; }
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => { for (const c of l) if ("focus" in c) { c.navigate && c.navigate(u); return c.focus(); } return clients.openWindow(u); }));
});

/* suggerimento della sera senza server: Android con l'app installata (sincronizzazione periodica) */
self.addEventListener("periodicsync", e => {
  if (e.tag !== "sera") return;
  e.waitUntil((async () => {
    const c = await caches.open("tonightly-data"), r = await c.match("./__sera.json"); if (!r) return;
    const d = await r.json(), now = new Date(), day = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    if (d.shown === day || now.getHours() < (d.h || 20) || now.getHours() >= 23 || !Array.isArray(d.picks) || !d.picks.length) return;
    d.shown = day; await c.put("./__sera.json", new Response(JSON.stringify(d), { headers: { "content-type": "application/json" } }));
    await self.registration.showNotification("Stasera: " + d.picks[0].t + "?", { body: d.picks.map(p => p.t).join(" · "), icon: "icon-192.png", badge: "icon-192.png", tag: "sera-" + day, data: { url: "./?go=sera" } });
  })());
});
