// Edge Function "notify" – ogni sera: nuovi episodi di domani e abbonamenti che si rinnovano domani.
// Segreti nel Vault di Supabase (letti con public.app_secret): vapid_public, vapid_private, cron_secret, tmdb_key.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono già presenti nelle Edge Functions.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const sec = async (n: string) => (await sb.rpc("app_secret", { n })).data as string;
let KEY = "";
let tomorrow = "";
const cache = new Map<number, any>();

async function next(id: number) {
  if (!cache.has(id)) {
    const r = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${KEY}&language=it-IT`);
    cache.set(id, r.ok ? await r.json() : null);
  }
  return cache.get(id)?.next_episode_to_air;
}

// La chiamata pianificata (pg_cron) porta "Authorization: Bearer <cron_secret>" preso dal Vault.
async function cronOk(req: Request) {
  const want = (await sec("cron_secret")) || "";
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (want.length < 32 || got.length !== want.length) return false;
  let d = 0; for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req) => {
  if (!(await cronOk(req))) return new Response("no", { status: 401 });
  webpush.setVapidDetails("https://dhbydbyrmjdehquygrmc.supabase.co", await sec("vapid_public"), await sec("vapid_private"));
  KEY = await sec("tmdb_key"); tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10); cache.clear();
  const { data: subs } = await sb.from("push_subs").select("*");
  let sent = 0;
  for (const s of subs ?? []) {
    const { data: ts } = await sb.from("titles").select("tmdb_id,title,eps,watchlist").eq("user_id", s.user_id).eq("media", "tv").limit(60);
    for (const t of ts ?? []) {
      if (!t.watchlist && !Object.keys(t.eps ?? {}).some((k) => k[0] !== "_")) continue;
      const ne = await next(t.tmdb_id);
      if (ne?.air_date !== tomorrow) continue;
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: t.title, body: `Domani: nuovo episodio S${ne.season_number}E${ne.episode_number}`, tag: `${t.tmdb_id}-${tomorrow}`, url: "./?go=soon" }));
        sent++;
      } catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint); }
    }
  }
  // abbonamenti che si rinnovano domani (piano e giorno segnati dall'utente in "I miei servizi")
  const tm = new Date(Date.now() + 864e5), last = new Date(tm.getUTCFullYear(), tm.getUTCMonth() + 1, 0).getDate(), dom = tm.getUTCDate();
  const users = [...new Set((subs ?? []).map((s) => s.user_id))];
  for (const u of users) {
    const { data: st } = await sb.from("settings").select("subs,prefs").eq("user_id", u).maybeSingle();
    const plans = (st?.prefs?.plans ?? {}) as Record<string, { day?: number; n?: string; plan?: string }>, mine = (st?.subs ?? []) as number[];
    for (const [id, p] of Object.entries(plans)) {
      if (!p?.day || !mine.includes(+id) || Math.min(+p.day, last) !== dom) continue;
      const price = st?.prefs?.prices?.[id];
      for (const s of (subs ?? []).filter((x) => x.user_id === u)) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: `${String(p.n || "Un abbonamento").slice(0, 40)} si rinnova domani`, body: [p.plan, price ? `${String(price).replace(".", ",")} €` : ""].filter(Boolean).join(" · ") || "Se non lo usi, puoi disdirlo in tempo", tag: `renew-${id}-${tomorrow}`, url: "./?go=serv" }));
          sent++;
        } catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint); }
      }
    }
  }
  return new Response(JSON.stringify({ sent }));
});
