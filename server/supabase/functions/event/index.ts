// Edge Function "event" – notifiche immediate: invito/consiglio di un amico e "È un match" nelle serate.
// La chiamano i trigger del database (public.fn_call) con "Authorization: Bearer <cron_secret>".
// I segreti (chiavi VAPID, cron_secret) stanno nel Vault di Supabase e si leggono con public.app_secret().
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const sec = async (n: string) => (await sb.rpc("app_secret", { n })).data as string;
const same = (a: string, b: string) => { if (!a || a.length < 32 || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

async function pushTo(users: string[], msg: Record<string, string>) {
  if (!users.length) return 0;
  const { data: subs } = await sb.from("push_subs").select("*").in("user_id", users);
  let sent = 0;
  for (const s of subs ?? []) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg)); sent++; }
    catch (e) { const c = (e as { statusCode?: number }).statusCode; if (c === 404 || c === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint); }
  }
  return sent;
}

Deno.serve(async (req) => {
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!same(await sec("cron_secret"), got)) return new Response("no", { status: 401 });
  webpush.setVapidDetails("https://dhbydbyrmjdehquygrmc.supabase.co", await sec("vapid_public"), await sec("vapid_private"));
  const b = await req.json().catch(() => ({}));
  let sent = 0;
  if (b.type === "msg" && b.id) {
    const { data: m } = await sb.from("friend_msgs").select("*").eq("id", b.id).maybeSingle();
    if (m) {
      const { data: f } = await sb.from("settings").select("name,username").eq("user_id", m.from_user).maybeSingle();
      const who = (f?.name || f?.username || "Un amico").slice(0, 40), t = (m.item?.t || m.item?.title || "").slice(0, 80);
      const msg = m.kind === "duo"
        ? { title: `${who} ti invita a una serata`, body: "Votate insieme cosa guardare stasera", tag: `inv-${m.id}`, url: m.code ? `./?room=${m.code}` : "./?go=together" }
        : { title: `${who} ti consiglia ${t || "un titolo"}`, body: (m.note || "Aprilo per vedere dove guardarlo").slice(0, 120), tag: `msg-${m.id}`, url: "./?go=together" };
      sent = await pushTo([m.to_user], msg);
    }
  } else if (b.type === "match" && b.room && Array.isArray(b.items) && b.items.length) {
    const [{ data: r }, { data: mem }] = await Promise.all([sb.from("rooms").select("code,name").eq("id", b.room).maybeSingle(), sb.from("room_members").select("user_id,votes").eq("room_id", b.room)]);
    const users = (mem ?? []).filter((x) => !(x.votes || {})._tv).map((x) => x.user_id);
    const t = String(b.items[0].t || "un titolo").slice(0, 80), more = b.items.length > 1 ? ` (e altri ${b.items.length - 1})` : "";
    sent = await pushTo(users, { title: "È un match!", body: `${t}${more} piace a tutti nella ${r?.name || "serata"}`, tag: `match-${b.room}`, url: r?.code ? `./?room=${r.code}` : "./?go=together" });
  }
  return new Response(JSON.stringify({ sent }), { headers: { "content-type": "application/json" } });
});
