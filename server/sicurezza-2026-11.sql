-- ===== Sicurezza (novembre 2026) =====
-- Si può rieseguire. Va lasciato IN FONDO a supabase.sql, dopo tutte le funzioni.

-- 1) Chi non ha fatto l'accesso (ruolo anon) non può chiamare le funzioni del database,
--    tranne le due che servono alla TV per il QR. Su Supabase "revoke ... from public" non basta:
--    anon riceve un permesso esplicito su ogni nuova funzione.
revoke execute on all functions in schema public from anon, public;
alter default privileges in schema public revoke execute on functions from anon, public;
-- funzioni interne (trigger e aiuti usati solo da altre funzioni): non servono a nessuno via API
revoke execute on function public.actions_guard(), public.comments_guard(), public.friend_request_to(uuid, boolean) from authenticated;
do $$ begin
  if to_regprocedure('public.client_errors_cap()') is not null then revoke execute on function public.client_errors_cap() from authenticated; end if;
  if to_regprocedure('public.rls_auto_enable()') is not null then revoke execute on function public.rls_auto_enable() from authenticated; end if;
end $$;
alter function public.valid_item(jsonb) set search_path = public;

-- 2) Username e codice amico si cambiano solo con le funzioni dell'app (che controllano nomi riservati
--    e il limite di un cambio ogni 14 giorni): una modifica diretta dalla API viene ignorata.
create or replace function public.settings_guard() returns trigger
language plpgsql set search_path = public as
$$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.username := null; new.username_at := null; new.friend_code := null;
    else
      new.username := old.username; new.username_at := old.username_at; new.friend_code := old.friend_code;
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.settings_guard() from public, anon, authenticated;
drop trigger if exists settings_guard_t on public.settings;
create trigger settings_guard_t before insert or update on public.settings for each row execute function public.settings_guard();
alter table public.settings drop constraint if exists settings_limits;
alter table public.settings add constraint settings_limits check (
  (name is null or char_length(name) <= 40) and octet_length(prefs::text) <= 300000 and octet_length(subs::text) <= 4000
  and avatar between 0 and 1000) not valid;

-- 3) Nei commenti nome e avatar li mette il server (dal tuo profilo): nessuno può firmarsi come un altro.
create or replace function public.comments_guard() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if (select count(*) from public.comments where user_id = new.user_id and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'Troppi commenti in poco tempo: riprova tra un minuto';
  end if;
  if (select count(*) from public.comments where user_id = new.user_id and created_at > now() - interval '1 day') >= 100 then
    raise exception 'Limite giornaliero di commenti raggiunto';
  end if;
  if new.parent_id is not null and not exists (select 1 from public.comments p where p.id = new.parent_id and p.tmdb_key = new.tmdb_key and p.parent_id is null) then
    raise exception 'Risposta non valida';
  end if;
  select coalesce(nullif(left(s.name, 40), ''), 'Cinefilo'), coalesce(s.avatar, 0) into new.name, new.avatar
    from public.settings s where s.user_id = new.user_id;
  if not found then new.name := 'Cinefilo'; new.avatar := 0; end if;
  new.created_at := now();
  return new;
end;
$$;
revoke execute on function public.comments_guard() from public, anon, authenticated;

-- 4) TV con il QR: numero di 4 cifre davvero casuale e massimo 20 QR ogni 10 minuti dallo stesso indirizzo IP
--    (così nessuno può riempire la tabella e bloccare l'accesso alle TV di tutti).
alter table public.tv_links add column if not exists ip_hash text;
create or replace function public.tv_link_new(p_id text, p_secret text) returns text
language plpgsql security definer set search_path = public as
$$
declare c text; ip text; h text;
begin
  if p_id !~ '^[A-Za-z0-9]{24}$' or coalesce(char_length(p_secret), 0) not between 24 and 64 then raise exception 'Dati non validi'; end if;
  delete from public.tv_links where created_at < now() - interval '10 minutes';
  begin ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1); exception when others then ip := ''; end;
  if ip <> '' then
    h := encode(sha256(convert_to(ip, 'UTF8')), 'hex');
    if (select count(*) from public.tv_links where ip_hash = h) >= 20 then raise exception 'Troppi QR in poco tempo: riprova tra qualche minuto'; end if;
  end if;
  if (select count(*) from public.tv_links) >= 20000 then raise exception 'Riprova tra qualche minuto'; end if;
  c := (1000 + (('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint % 9000))::text;
  insert into public.tv_links (id, secret_hash, code, ip_hash) values (p_id, encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'), c, h);
  return c;
end;
$$;
revoke execute on function public.tv_link_new(text, text) from public;
grant execute on function public.tv_link_new(text, text), public.tv_link_poll(text, text) to anon, authenticated;

-- 5) Registro errori dell'app (se esiste): testi con lunghezza massima
do $$ begin
  if to_regclass('public.client_errors') is not null then
    alter table public.client_errors drop constraint if exists client_errors_limits;
    alter table public.client_errors add constraint client_errors_limits check (
      coalesce(char_length(msg), 0) <= 2000 and coalesce(char_length(stack), 0) <= 8000 and coalesce(char_length(ua), 0) <= 500
      and coalesce(char_length(at), 0) <= 300 and coalesce(char_length(page), 0) <= 300 and coalesce(char_length(view), 0) <= 100) not valid;
  end if;
end $$;
