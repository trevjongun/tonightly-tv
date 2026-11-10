// Edge Function "evening" – invia il "suggerimento della sera" (i 3 titoli preparati dall'app).
// Pianificata con pg_cron ogni ora al minuto 30 (job "tonightly-evening").
// Segreti nel Vault di Supabase (letti con public.app_secret): vapid_public, vapid_private, cron_secret, tmdb_key.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const sec = async (n: string) => (await sb.rpc("app_secret", { n })).data as string;

function romeNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
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
  const { day, hour } = romeNow();
  const yesterday = new Date(new Date(day).getTime() - 864e5).toISOString().slice(0, 10);
  const { data: rows } = await sb.from("evening_picks").select("*").eq("at_hour", hour).gte("day", yesterday);
  let sent = 0;
  for (const r of rows ?? []) {
    if (r.sent_on === day) continue;
    const picks = (Array.isArray(r.picks) ? r.picks : []).slice(0, 3); if (!picks.length) continue;
    const { data: subs } = await sb.from("push_subs").select("*").eq("user_id", r.user_id);
    const payload = JSON.stringify({ title: `Stasera: ${picks[0].t}?`, body: picks.map((p: { t: string }) => p.t).join(" · "), tag: `sera-${day}`, url: "./?go=sera" });
    for (const s of subs ?? []) {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload); sent++; }
      catch (e) { if ((e as { statusCode?: number }).statusCode === 404 || (e as { statusCode?: number }).statusCode === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint); }
    }
    await sb.from("evening_picks").update({ sent_on: day }).eq("user_id", r.user_id);
  }
  return new Response(JSON.stringify({ sent, hour, day }));
});
