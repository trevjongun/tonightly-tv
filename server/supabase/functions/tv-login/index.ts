// Edge Function "tv-login" – il telefono (già connesso) conferma l'accesso della TV inquadrando il QR.
// Riceve { link, code }: l'id del collegamento nel QR e il numero di 4 cifre che si vede sulla TV.
// Crea un codice di accesso monouso per l'account di chi conferma e lo lascia alla TV, che lo ritira
// con il suo segreto (funzione SQL tv_link_poll). Non invia email.
// Si pubblica dal sito di Supabase: Edge Functions › Deploy a new function › Via Editor, nome "tv-login".
// Lascia attivo "Verify JWT": la chiamata arriva solo da utenti connessi.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return out(405, { error: "Metodo non valido" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  const user = who && who.user;
  if (!user || !user.email) return out(401, { error: "Accedi all'app sul telefono e riprova" });

  let body: { link?: string; code?: string } = {};
  try { body = await req.json(); } catch (_) { /* vuoto */ }
  const link = String(body.link || ""), code = String(body.code || "");
  if (!/^[A-Za-z0-9]{24}$/.test(link) || !/^\d{4}$/.test(code)) return out(400, { error: "QR non valido" });

  const { data: row } = await admin.from("tv_links").select("*").eq("id", link).maybeSingle();
  if (!row || Date.now() - new Date(row.created_at).getTime() > 10 * 60e3) return out(410, { error: "Il QR è scaduto: sulla TV ne compare uno nuovo, inquadralo di nuovo" });
  if (row.token_hash) return out(409, { error: "Questa TV è già stata collegata" });
  if (row.code !== code) {
    // tre tentativi sbagliati e il collegamento si annulla
    if ((row.tries || 0) >= 2) await admin.from("tv_links").delete().eq("id", link);
    else await admin.from("tv_links").update({ tries: (row.tries || 0) + 1 }).eq("id", link);
    return out(403, { error: "Il numero non corrisponde a quello sulla TV" });
  }

  const g = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  const th = g.data && g.data.properties && g.data.properties.hashed_token;
  if (g.error || !th) return out(500, { error: "Non riesco a collegare la TV, riprova" });

  const { data: upd } = await admin.from("tv_links").update({ token_hash: th, user_id: user.id }).eq("id", link).is("token_hash", null).select("id");
  if (!upd || !upd.length) return out(409, { error: "Questa TV è già stata collegata" });
  return out(200, { ok: true });
});
