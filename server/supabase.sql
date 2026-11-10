-- Tonightly: schema completo (le stanze di gruppo non sono più usate: se esistono, restano inutilizzate). Si può eseguire anche se hai già le tabelle (non cancella nulla).
-- Incolla tutto nell'SQL Editor di Supabase e premi Run.

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subs jsonb not null default '[]'::jsonb
);
alter table public.settings add column if not exists name text;
alter table public.settings add column if not exists avatar integer not null default 0;
alter table public.settings add column if not exists prefs jsonb not null default '{}'::jsonb;

create table if not exists public.titles (
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_key text not null,
  media text not null,
  tmdb_id bigint not null,
  title text not null,
  year text,
  poster text,
  genre_ids jsonb not null default '[]'::jsonb,
  runtime integer not null default 0,
  favorite boolean not null default false,
  watched boolean not null default false,
  stars integer not null default 0 check (stars between 0 and 5),
  watched_on date,
  primary key (user_id, tmdb_key)
);
alter table public.titles add column if not exists watchlist boolean not null default false;
alter table public.titles add column if not exists hype boolean not null default false;
alter table public.titles add column if not exists skipped boolean not null default false;
alter table public.titles add column if not exists eps jsonb not null default '{}'::jsonb;
-- mezze stelle (es. 3,5) e motivi del voto ("storia", "attori", …)
do $$ begin
  if (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'titles' and column_name = 'stars') <> 'numeric' then
    alter table public.titles alter column stars type numeric(2,1) using stars::numeric;
  end if;
end $$;
alter table public.titles add column if not exists why jsonb;
alter table public.titles add column if not exists diary jsonb;

alter table public.settings enable row level security;
alter table public.titles enable row level security;
drop policy if exists "settings: solo i miei dati" on public.settings;
create policy "settings: solo i miei dati" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "titles: solo i miei dati" on public.titles;
create policy "titles: solo i miei dati" on public.titles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Eliminazione account dall'app
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as
$$ begin delete from auth.users where id = auth.uid(); end; $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ===== Aggiornamento: algoritmo, commenti della community e foto =====
alter table public.titles add column if not exists feat jsonb;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  tmdb_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  avatar integer not null default 0,
  body text not null default '' check (char_length(body) <= 500),
  photo text,
  created_at timestamptz not null default now()
);
create index if not exists comments_key_idx on public.comments (tmdb_key, created_at desc);
create table if not exists public.comment_reports (
  id bigserial primary key,
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
alter table public.comments enable row level security;
alter table public.comment_reports enable row level security;
-- Lettura: solo utenti registrati; un commento con 3 o più segnalazioni sparisce per gli altri (resta visibile all'autore)
drop policy if exists "comments: lettura" on public.comments;
create policy "comments: lettura" on public.comments for select to authenticated
  using (user_id = auth.uid() or (select count(*) from public.comment_reports r where r.comment_id = comments.id) < 3);
drop policy if exists "comments: scrivo i miei" on public.comments;
create policy "comments: scrivo i miei" on public.comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "comments: cancello i miei" on public.comments;
create policy "comments: cancello i miei" on public.comments for delete to authenticated using (user_id = auth.uid());
drop policy if exists "reports: segnalo" on public.comment_reports;
create policy "reports: segnalo" on public.comment_reports for insert to authenticated with check (user_id = auth.uid());

-- Foto dei commenti (bucket pubblico in lettura; scrittura solo nella propria cartella)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comment-photos', 'comment-photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists "foto: carico nella mia cartella" on storage.objects;
create policy "foto: carico nella mia cartella" on storage.objects for insert to authenticated
  with check (bucket_id = 'comment-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "foto: cancello le mie" on storage.objects;
create policy "foto: cancello le mie" on storage.objects for delete to authenticated
  using (bucket_id = 'comment-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "foto: elenco le mie" on storage.objects;
create policy "foto: elenco le mie" on storage.objects for select to authenticated
  using (bucket_id = 'comment-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== Aggiornamento: mi piace, risposte, blocco utenti =====
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create table if not exists public.user_blocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id)
);
alter table public.comment_likes enable row level security;
alter table public.user_blocks enable row level security;
drop policy if exists "likes: lettura" on public.comment_likes;
create policy "likes: lettura" on public.comment_likes for select to authenticated using (true);
drop policy if exists "likes: aggiungo i miei" on public.comment_likes;
create policy "likes: aggiungo i miei" on public.comment_likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "likes: tolgo i miei" on public.comment_likes;
create policy "likes: tolgo i miei" on public.comment_likes for delete to authenticated using (user_id = auth.uid());
drop policy if exists "blocks: solo i miei" on public.user_blocks;
create policy "blocks: solo i miei" on public.user_blocks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== Sicurezza (esegui anche se hai già eseguito il resto) =====
-- 1) Le tabelle personali sono accessibili solo a chi ha fatto l'accesso (anche gli anonimi sono esclusi)
drop policy if exists "settings: solo i miei dati" on public.settings;
create policy "settings: solo i miei dati" on public.settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "titles: solo i miei dati" on public.titles;
create policy "titles: solo i miei dati" on public.titles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Controlli sui dati: formato e dimensioni (non toccano i dati esistenti, valgono per quelli nuovi)
alter table public.settings drop constraint if exists settings_limits;
alter table public.settings add constraint settings_limits check (
  (name is null or char_length(name) <= 40) and jsonb_array_length(subs) <= 100 and octet_length(prefs::text) <= 100000) not valid;
alter table public.titles drop constraint if exists titles_limits;
alter table public.titles add constraint titles_limits check (
  tmdb_key ~ '^(movie|tv):[0-9]{1,9}$' and media in ('movie','tv') and char_length(title) <= 200
  and (poster is null or poster ~ '^/[A-Za-z0-9_.-]{1,60}$')
  and octet_length(eps::text) <= 200000 and (feat is null or octet_length(feat::text) <= 20000)
  and stars * 2 = round(stars * 2) and (why is null or (jsonb_typeof(why) = 'array' and octet_length(why::text) <= 400))
  and (diary is null or (jsonb_typeof(diary) = 'object' and octet_length(diary::text) <= 1500))) not valid;
alter table public.comments drop constraint if exists comments_limits;
alter table public.comments add constraint comments_limits check (
  tmdb_key ~ '^(movie|tv):[0-9]{1,9}$' and (name is null or char_length(name) <= 40)
  and (photo is null or photo ~ ('^' || user_id::text || '/[0-9]{10,16}\.jpg$'))) not valid;

-- 3) Anti-spam sui commenti: massimo 5 al minuto e 100 al giorno; le risposte devono stare sotto un commento dello stesso titolo
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
  return new;
end;
$$;
revoke all on function public.comments_guard() from public;
drop trigger if exists comments_guard_t on public.comments;
create trigger comments_guard_t before insert on public.comments for each row execute function public.comments_guard();

-- 4) Segnalazioni e mi piace: limite per utente
create or replace function public.actions_guard() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if tg_table_name = 'comment_reports' and (select count(*) from public.comment_reports where user_id = new.user_id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Troppe segnalazioni in poco tempo';
  end if;
  if tg_table_name = 'comment_likes' and (select count(*) from public.comment_likes where user_id = new.user_id and created_at > now() - interval '1 minute') >= 60 then
    raise exception 'Troppe azioni in poco tempo';
  end if;
  return new;
end;
$$;
revoke all on function public.actions_guard() from public;
drop trigger if exists reports_guard_t on public.comment_reports;
create trigger reports_guard_t before insert on public.comment_reports for each row execute function public.actions_guard();
drop trigger if exists likes_guard_t on public.comment_likes;
create trigger likes_guard_t before insert on public.comment_likes for each row execute function public.actions_guard();

-- 5) Chi non ha fatto l'accesso non vede nulla nelle tabelle della community
drop policy if exists "likes: lettura" on public.comment_likes;
create policy "likes: lettura" on public.comment_likes for select to authenticated using (true);

-- ===== Novità: note e tag, serate in due, liste condivise, amici, notifiche =====
-- Esegui anche questa parte (non cancella nulla).

alter table public.titles add column if not exists note text;
alter table public.titles add column if not exists tags jsonb not null default '[]'::jsonb;
alter table public.titles drop constraint if exists titles_note_limits;
alter table public.titles add constraint titles_note_limits check (
  (note is null or char_length(note) <= 500) and jsonb_typeof(tags) = 'array' and jsonb_array_length(tags) <= 12 and octet_length(tags::text) <= 600) not valid;

-- Se esiste una vecchia versione delle tabelle delle stanze (schema diverso), la ricreo da zero.
-- Succede solo se manca la colonna room_id: alle esecuzioni successive non cancella nulla.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'room_members')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'room_members' and column_name = 'room_id') then
    drop table public.room_members cascade;
    drop table if exists public.rooms cascade;
  end if;
end $$;

-- Stanze: una "stanza" è una serata in due (kind = duo) oppure una lista condivisa (kind = list)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('duo','list')),
  name text not null default '' check (char_length(name) <= 60),
  owner uuid not null references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 300),
  created_at timestamptz not null default now()
);
create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text check (name is null or char_length(name) <= 40),
  avatar integer not null default 0,
  votes jsonb not null default '{}'::jsonb check (jsonb_typeof(votes) = 'object' and octet_length(votes::text) <= 20000),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

create or replace function public.is_member(r uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.room_members m where m.room_id = r and m.user_id = auth.uid()) $$;
revoke all on function public.is_member(uuid) from public;
grant execute on function public.is_member(uuid) to authenticated;

drop policy if exists "rooms: vedo le mie" on public.rooms;
create policy "rooms: vedo le mie" on public.rooms for select to authenticated using (public.is_member(id));
drop policy if exists "rooms: cancello le mie" on public.rooms;
create policy "rooms: cancello le mie" on public.rooms for delete to authenticated using (owner = auth.uid());
drop policy if exists "membri: vedo chi è nella mia stanza" on public.room_members;
create policy "membri: vedo chi è nella mia stanza" on public.room_members for select to authenticated using (public.is_member(room_id));
drop policy if exists "membri: aggiorno i miei voti" on public.room_members;
create policy "membri: aggiorno i miei voti" on public.room_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "membri: esco dalla stanza" on public.room_members;
create policy "membri: esco dalla stanza" on public.room_members for delete to authenticated using (user_id = auth.uid());

create or replace function public.valid_item(i jsonb) returns boolean language sql immutable as
$$ select jsonb_typeof(i) = 'object' and (i->>'k') ~ '^(movie|tv):[0-9]{1,9}$' and char_length(coalesce(i->>'t','')) <= 200
   and coalesce(i->>'p','') ~ '^(/[A-Za-z0-9_.-]{1,60})?$' and coalesce(i->>'y','') ~ '^([0-9]{4})?$' $$;

create or replace function public.create_room(p_kind text, p_name text, p_items jsonb, p_uname text, p_avatar integer) returns public.rooms
language plpgsql security definer set search_path = public as
$$
declare r public.rooms; it jsonb;
begin
  if auth.uid() is null then raise exception 'Accedi per continuare'; end if;
  if p_kind not in ('duo','list') then raise exception 'Tipo non valido'; end if;
  if (select count(*) from public.rooms where owner = auth.uid()) >= 20 then raise exception 'Hai già troppe stanze: eliminane qualcuna'; end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then raise exception 'Dati non validi'; end if;
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    if not public.valid_item(it) then raise exception 'Titolo non valido'; end if;
  end loop;
  insert into public.rooms (code, kind, name, owner, items)
  values (upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), p_kind, left(coalesce(p_name, ''), 60), auth.uid(), coalesce(p_items, '[]'::jsonb))
  returning * into r;
  insert into public.room_members (room_id, user_id, name, avatar) values (r.id, auth.uid(), left(p_uname, 40), coalesce(p_avatar, 0));
  return r;
end;
$$;
revoke all on function public.create_room(text, text, jsonb, text, integer) from public;
grant execute on function public.create_room(text, text, jsonb, text, integer) to authenticated;

create or replace function public.join_room(p_code text, p_uname text, p_avatar integer) returns public.rooms
language plpgsql security definer set search_path = public as
$$
declare r public.rooms;
begin
  if auth.uid() is null then raise exception 'Accedi per continuare'; end if;
  select * into r from public.rooms where code = upper(trim(p_code));
  if not found then raise exception 'Codice non trovato'; end if;
  if (select count(*) from public.room_members where room_id = r.id) >= 6 and not public.is_member(r.id) then raise exception 'La serata è al completo (massimo 6 persone)'; end if;
  insert into public.room_members (room_id, user_id, name, avatar) values (r.id, auth.uid(), left(p_uname, 40), coalesce(p_avatar, 0)) on conflict do nothing;
  return r;
end;
$$;
revoke all on function public.join_room(text, text, integer) from public;
grant execute on function public.join_room(text, text, integer) to authenticated;

-- Modifica atomica degli elementi di una lista condivisa: p_op = 'add' | 'remove'
create or replace function public.room_edit(p_room uuid, p_op text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare r public.rooms; res jsonb;
begin
  select * into r from public.rooms where id = p_room for update;
  if not found or not public.is_member(p_room) then raise exception 'Stanza non trovata'; end if;
  if r.kind <> 'list' then raise exception 'Non è una lista condivisa'; end if;
  if p_op = 'add' then
    if not public.valid_item(p_item) then raise exception 'Titolo non valido'; end if;
    if jsonb_array_length(r.items) >= 300 then raise exception 'La lista è piena'; end if;
    if exists (select 1 from jsonb_array_elements(r.items) e where e->>'k' = p_item->>'k') then return r.items; end if;
    res := r.items || jsonb_build_array(jsonb_build_object('k', p_item->>'k', 't', p_item->>'t', 'y', coalesce(p_item->>'y', ''), 'p', coalesce(p_item->>'p', ''), 'm', split_part(p_item->>'k', ':', 1)));
  elsif p_op = 'remove' then
    select coalesce(jsonb_agg(e), '[]'::jsonb) into res from jsonb_array_elements(r.items) e where e->>'k' <> p_item->>'k';
  else raise exception 'Operazione non valida';
  end if;
  update public.rooms set items = res where id = p_room;
  return res;
end;
$$;
revoke all on function public.room_edit(uuid, text, jsonb) from public;
grant execute on function public.room_edit(uuid, text, jsonb) to authenticated;

-- Amici: si aggiungono con un codice personale; l'attività è visibile solo a chi l'ha accettata e solo se la condividi
alter table public.settings add column if not exists friend_code text unique;
alter table public.settings add column if not exists share_activity boolean not null default false;
create table if not exists public.friendships (
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','ok')),
  created_at timestamptz not null default now(),
  primary key (a, b), check (a <> b)
);
alter table public.friendships enable row level security;
drop policy if exists "amici: vedo le mie" on public.friendships;
create policy "amici: vedo le mie" on public.friendships for select to authenticated using (a = auth.uid() or b = auth.uid());
drop policy if exists "amici: tolgo le mie" on public.friendships;
create policy "amici: tolgo le mie" on public.friendships for delete to authenticated using (a = auth.uid() or b = auth.uid());

create or replace function public.my_friend_code() returns text
language plpgsql security definer set search_path = public as
$$
declare c text;
begin
  if auth.uid() is null then raise exception 'Accedi per continuare'; end if;
  select friend_code into c from public.settings where user_id = auth.uid();
  if c is null then
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.settings (user_id, friend_code) values (auth.uid(), c)
    on conflict (user_id) do update set friend_code = excluded.friend_code;
  end if;
  return c;
end;
$$;
revoke all on function public.my_friend_code() from public;
grant execute on function public.my_friend_code() to authenticated;

-- Username: unico, minuscolo, 3-20 caratteri; si cerca per username; ognuno sceglie chi può mandargli richieste
alter table public.settings add column if not exists username text;
alter table public.settings add column if not exists username_at timestamptz;
alter table public.settings add column if not exists friend_req text not null default 'all';
alter table public.settings drop constraint if exists settings_username_fmt;
alter table public.settings add constraint settings_username_fmt check (
  (username is null or (username ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' and username !~ '\.\.'))
  and friend_req in ('all','code','none')) not valid;
create unique index if not exists settings_username_uq on public.settings (lower(username)) where username is not null;

-- invio della richiesta (usata sia dal codice sia dalla ricerca per username)
create or replace function public.friend_request_to(u uuid, by_code boolean) returns text
language plpgsql security definer set search_path = public as
$$
declare pref text;
begin
  if auth.uid() is null then raise exception 'Accedi per continuare'; end if;
  if u is null or u = auth.uid() then raise exception 'Non puoi aggiungere te stesso'; end if;
  if exists (select 1 from public.user_blocks where (user_id = u and blocked_id = auth.uid()) or (user_id = auth.uid() and blocked_id = u)) then raise exception 'Non è possibile inviare la richiesta'; end if;
  if exists (select 1 from public.friendships where ((a = auth.uid() and b = u) or (a = u and b = auth.uid())) and status = 'ok') then return 'ok'; end if;
  -- se l'altra persona ti aveva già scritto, accettare è sempre possibile
  if exists (select 1 from public.friendships where a = u and b = auth.uid()) then
    update public.friendships set status = 'ok' where a = u and b = auth.uid(); return 'ok';
  end if;
  select coalesce(friend_req, 'all') into pref from public.settings where user_id = u;
  if pref = 'none' or (pref = 'code' and not by_code) then raise exception 'Questa persona non accetta richieste di amicizia'; end if;
  if (select count(*) from public.friendships where a = auth.uid() and status = 'pending') >= 20 then raise exception 'Troppe richieste in attesa'; end if;
  if (select count(*) from public.friendships where a = auth.uid() and created_at > now() - interval '1 day') >= 30 then raise exception 'Troppe richieste oggi, riprova domani'; end if;
  insert into public.friendships (a, b) values (auth.uid(), u) on conflict do nothing;
  return 'pending';
end;
$$;
revoke all on function public.friend_request_to(uuid, boolean) from public;

create or replace function public.friend_request(p_code text) returns text
language plpgsql security definer set search_path = public as
$$
declare u uuid;
begin
  if auth.uid() is null then raise exception 'Accedi per continuare'; end if;
  select user_id into u from public.settings where friend_code = upper(trim(p_code));
  if u is null then raise exception 'Codice non trovato'; end if;
  return public.friend_request_to(u, true);
end;
$$;
revoke all on function public.friend_request(text) from public;
grant execute on function public.friend_request(text) to authenticated;

create or replace function public.friend_respond(p_from uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if p_accept then update public.friendships set status = 'ok' where a = p_from and b = auth.uid();
  else delete from public.friendships where (a = p_from and b = auth.uid()) or (a = auth.uid() and b = p_from); end if;
end;
$$;
revoke all on function public.friend_respond(uuid, boolean) from public;
grant execute on function public.friend_respond(uuid, boolean) to authenticated;

drop function if exists public.friend_list();
create function public.friend_list() returns table (user_id uuid, name text, avatar integer, status text, incoming boolean, sharing boolean, username text)
language sql stable security definer set search_path = public as
$$
  select case when f.a = auth.uid() then f.b else f.a end, s.name, s.avatar, f.status, f.b = auth.uid(), s.share_activity, s.username
  from public.friendships f join public.settings s on s.user_id = case when f.a = auth.uid() then f.b else f.a end
  where auth.uid() in (f.a, f.b)
$$;
revoke all on function public.friend_list() from public;
grant execute on function public.friend_list() to authenticated;

drop function if exists public.friend_feed();
create function public.friend_feed() returns table (user_id uuid, name text, avatar integer, tmdb_key text, title text, poster text, stars numeric, watched_on date)
language sql stable security definer set search_path = public as
$$
  select s.user_id, s.name, s.avatar, t.tmdb_key, t.title, t.poster, t.stars, t.watched_on
  from public.friendships f
  join public.settings s on s.user_id = case when f.a = auth.uid() then f.b else f.a end and s.share_activity
  cross join lateral (select * from public.titles x where x.user_id = s.user_id and x.watched order by x.watched_on desc nulls last limit 6) t
  where f.status = 'ok' and auth.uid() in (f.a, f.b)
$$;
revoke all on function public.friend_feed() from public;
grant execute on function public.friend_feed() to authenticated;

-- Notifiche: iscrizioni (le invia la funzione "notify", vedi LEGGIMI)
create table if not exists public.push_subs (
  endpoint text primary key check (char_length(endpoint) <= 600),
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "push: le mie" on public.push_subs;
create policy "push: le mie" on public.push_subs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ Amici 2: consigli di titoli, inviti a serate/liste, "chi l'ha visto" ============
create table if not exists public.friend_msgs (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('title','duo','list')),
  item jsonb check (item is null or public.valid_item(item)),
  code text check (code is null or code ~ '^[A-Z0-9]{4,12}$'),
  note text check (note is null or char_length(note) <= 140),
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
alter table public.friend_msgs enable row level security;  -- nessuna policy: si usa solo tramite le funzioni qui sotto

create or replace function public.friend_send(p_to uuid, p_kind text, p_item jsonb, p_code text, p_note text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null then raise exception 'Accedi per continuare'; end if;
  if not exists (select 1 from public.friendships f where f.status = 'ok' and ((f.a = auth.uid() and f.b = p_to) or (f.a = p_to and f.b = auth.uid()))) then
    raise exception 'Potete scambiarvi consigli solo da amici';
  end if;
  if (select count(*) from public.friend_msgs where from_user = auth.uid() and created_at > now() - interval '1 hour') >= 40 then
    raise exception 'Hai inviato troppi messaggi: riprova tra un po''';
  end if;
  if p_kind = 'title' and (p_item is null or not public.valid_item(p_item)) then raise exception 'Titolo non valido'; end if;
  insert into public.friend_msgs (from_user, to_user, kind, item, code, note)
  values (auth.uid(), p_to, p_kind, case when p_kind = 'title' then p_item else null end, case when p_kind <> 'title' then upper(p_code) else null end, left(p_note, 140));
end;
$$;
revoke all on function public.friend_send(uuid, text, jsonb, text, text) from public;
grant execute on function public.friend_send(uuid, text, jsonb, text, text) to authenticated;

create or replace function public.friend_inbox() returns table (id uuid, from_user uuid, name text, avatar integer, kind text, item jsonb, code text, note text, seen boolean, created_at timestamptz)
language sql stable security definer set search_path = public as
$$
  select m.id, m.from_user, s.name, s.avatar, m.kind, m.item, m.code, m.note, m.seen, m.created_at
  from public.friend_msgs m join public.settings s on s.user_id = m.from_user
  where m.to_user = auth.uid() order by m.created_at desc limit 40
$$;
revoke all on function public.friend_inbox() from public;
grant execute on function public.friend_inbox() to authenticated;

create or replace function public.friend_msg_done(p_id uuid, p_delete boolean) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if p_delete then delete from public.friend_msgs where id = p_id and to_user = auth.uid();
  else update public.friend_msgs set seen = true where id = p_id and to_user = auth.uid(); end if;
end;
$$;
revoke all on function public.friend_msg_done(uuid, boolean) from public;
grant execute on function public.friend_msg_done(uuid, boolean) to authenticated;

-- Quali amici (che condividono l'attività) hanno già visto questo titolo, e con che voto
drop function if exists public.friend_title(text);
create function public.friend_title(p_key text) returns table (user_id uuid, name text, avatar integer, stars numeric)
language sql stable security definer set search_path = public as
$$
  select s.user_id, s.name, s.avatar, t.stars
  from public.friendships f
  join public.settings s on s.user_id = case when f.a = auth.uid() then f.b else f.a end and s.share_activity
  join public.titles t on t.user_id = s.user_id and t.tmdb_key = p_key and t.watched
  where f.status = 'ok' and auth.uid() in (f.a, f.b)
$$;
revoke all on function public.friend_title(text) from public;
grant execute on function public.friend_title(text) to authenticated;

-- Ogni partecipante di una serata aggiunge i propri titoli al mazzo
create or replace function public.room_contribute(p_room uuid, p_items jsonb) returns void
language plpgsql security definer set search_path = public as
$$
declare r public.rooms; it jsonb; cur jsonb;
begin
  select * into r from public.rooms where id = p_room for update;
  if not found or not public.is_member(p_room) then raise exception 'Stanza non trovata'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 12 then raise exception 'Dati non validi'; end if;
  cur := r.items;
  for it in select * from jsonb_array_elements(p_items) loop
    if not public.valid_item(it) then raise exception 'Titolo non valido'; end if;
    if jsonb_array_length(cur) < 60 and not exists (select 1 from jsonb_array_elements(cur) e where e->>'k' = it->>'k') then
      cur := cur || jsonb_build_array(jsonb_build_object('k', it->>'k', 't', it->>'t', 'y', coalesce(it->>'y', ''), 'p', coalesce(it->>'p', ''), 'm', split_part(it->>'k', ':', 1)));
    end if;
  end loop;
  update public.rooms set items = cur where id = p_room;
end;
$$;
revoke all on function public.room_contribute(uuid, jsonb) from public;
grant execute on function public.room_contribute(uuid, jsonb) to authenticated;

-- ===== Invia a un altro dispositivo =====
create table if not exists public.dev_msgs (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dev text not null,
  item text not null,
  created_at timestamptz not null default now()
);
alter table public.dev_msgs enable row level security;  -- nessuna policy: solo tramite le funzioni

create or replace function public.device_send(p_dev text, p_item text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Accedi'; end if;
  if p_item !~ '^(movie|tv):[0-9]{1,9}$' or p_dev !~ '^[A-Za-z0-9]{6,32}$' then raise exception 'Dati non validi'; end if;
  if (select count(*) from public.dev_msgs where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 60 then raise exception 'Troppi invii'; end if;
  delete from public.dev_msgs where user_id = auth.uid() and created_at < now() - interval '1 day';
  insert into public.dev_msgs (user_id, dev, item) values (auth.uid(), p_dev, p_item);
end;
$$;

create or replace function public.device_poll(p_dev text) returns text
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if auth.uid() is null then return null; end if;
  select item into k from public.dev_msgs
    where user_id = auth.uid() and dev <> p_dev and created_at > now() - interval '10 minutes'
    order by created_at desc limit 1;
  if k is not null then delete from public.dev_msgs where user_id = auth.uid() and dev <> p_dev; end if;
  return k;
end;
$$;
revoke all on function public.device_send(text, text) from public;
revoke all on function public.device_poll(text) from public;
grant execute on function public.device_send(text, text) to authenticated;
grant execute on function public.device_poll(text) to authenticated;


-- ===== Username e richieste di amicizia dall'app =====
-- Scegli o cambia il tuo username (nella prima ora lo correggi liberamente, poi al massimo una volta ogni 14 giorni)
create or replace function public.set_username(p_name text) returns text
language plpgsql security definer set search_path = public as
$$
declare n text := lower(trim(p_name)); cur text; at timestamptz;
begin
  if auth.uid() is null then raise exception 'Accedi per continuare'; end if;
  if n !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' or n ~ '\.\.' then raise exception 'Username non valido: 3-20 caratteri tra lettere, numeri, punto e trattino basso'; end if;
  if n in ('admin','administrator','tonightly','support','supporto','staff','moderatore','moderator','root','system','sistema','help','aiuto','null','undefined','official','ufficiale') then raise exception 'Questo username non è disponibile'; end if;
  select username, username_at into cur, at from public.settings where user_id = auth.uid();
  if cur = n then return n; end if;
  if cur is not null and at is not null and at > now() - interval '14 days' and at < now() - interval '1 hour' then raise exception 'Puoi cambiare username una volta ogni 14 giorni'; end if;
  if exists (select 1 from public.settings where lower(username) = n and user_id <> auth.uid()) then raise exception 'Username già in uso'; end if;
  insert into public.settings (user_id, username, username_at) values (auth.uid(), n, now())
  on conflict (user_id) do update set username = excluded.username, username_at = excluded.username_at;
  return n;
exception when unique_violation then raise exception 'Username già in uso';
end;
$$;
revoke all on function public.set_username(text) from public;
grant execute on function public.set_username(text) to authenticated;

create or replace function public.username_free(p_name text) returns boolean
language sql stable security definer set search_path = public as
$$
  select not exists (select 1 from public.settings where lower(username) = lower(trim(p_name)) and user_id <> auth.uid())
$$;
revoke all on function public.username_free(text) from public;
grant execute on function public.username_free(text) to authenticated;

-- Cerca persone per username (almeno 3 caratteri, massimo 10 risultati). Non compare chi non accetta
-- richieste dalla ricerca, chi ti ha bloccato o chi hai bloccato.
create or replace function public.user_search(p_q text) returns table (user_id uuid, username text, name text, avatar integer, rel text)
language sql stable security definer set search_path = public as
$$
  select s.user_id, s.username, s.name, s.avatar,
    coalesce((select case when f.status = 'ok' then 'friend' when f.a = auth.uid() then 'sent' else 'received' end
              from public.friendships f where (f.a = auth.uid() and f.b = s.user_id) or (f.a = s.user_id and f.b = auth.uid()) limit 1), 'none')
  from public.settings s
  where auth.uid() is not null and char_length(trim(p_q)) >= 3
    and s.username is not null and s.user_id <> auth.uid()
    and lower(s.username) like replace(replace(lower(trim(both '@ ' from p_q)), '_', '\_'), '%', '') || '%'
    and (coalesce(s.friend_req, 'all') = 'all' or exists (select 1 from public.friendships f where (f.a = auth.uid() and f.b = s.user_id) or (f.a = s.user_id and f.b = auth.uid())))
    and not exists (select 1 from public.user_blocks b where (b.user_id = s.user_id and b.blocked_id = auth.uid()) or (b.user_id = auth.uid() and b.blocked_id = s.user_id))
  order by (lower(s.username) = lower(trim(both '@ ' from p_q))) desc, char_length(s.username), s.username
  limit 10
$$;
revoke all on function public.user_search(text) from public;
grant execute on function public.user_search(text) to authenticated;

create or replace function public.friend_request_user(p_user uuid) returns text
language plpgsql security definer set search_path = public as
$$ begin return public.friend_request_to(p_user, false); end; $$;
revoke all on function public.friend_request_user(uuid) from public;
grant execute on function public.friend_request_user(uuid) to authenticated;

-- Chi può mandarti richieste: 'all' (tutti, anche dalla ricerca), 'code' (solo con il tuo codice o link), 'none' (nessuno)
create or replace function public.set_friend_req(p_mode text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null then raise exception 'Accedi per continuare'; end if;
  if p_mode not in ('all','code','none') then raise exception 'Scelta non valida'; end if;
  insert into public.settings (user_id, friend_req) values (auth.uid(), p_mode)
  on conflict (user_id) do update set friend_req = excluded.friend_req;
end;
$$;
revoke all on function public.set_friend_req(text) from public;
grant execute on function public.set_friend_req(text) to authenticated;


-- ===== Consigli della community =====
-- Titoli amati (4-5 stelle) da chi ha amato i tuoi stessi titoli. Si vedono solo titoli piaciuti ad
-- almeno 3 persone diverse, mai chi sono. Chi disattiva l'opzione nelle impostazioni non viene usato.
create index if not exists titles_liked_idx on public.titles (tmdb_key, user_id) where watched and stars >= 4;
create or replace function public.community_recs(p_keys text[]) returns table (tmdb_key text, title text, poster text, media text, users integer)
language sql stable security definer set search_path = public as
$$
  with seeds as (
    select distinct k from unnest(p_keys[1:30]) as k where k ~ '^(movie|tv):[0-9]{1,9}$'
  ), me as (
    select coalesce((select (prefs->>'nocommunity')::boolean from public.settings where user_id = auth.uid()), false) as off
  ), peers as (
    select t.user_id, count(*) as overlap
    from public.titles t join seeds s on s.k = t.tmdb_key
    where auth.uid() is not null and not (select off from me)
      and t.watched and t.stars >= 4 and t.user_id <> auth.uid()
      and not coalesce((select (st.prefs->>'nocommunity')::boolean from public.settings st where st.user_id = t.user_id), false)
      and not exists (select 1 from public.user_blocks b where (b.user_id = auth.uid() and b.blocked_id = t.user_id) or (b.user_id = t.user_id and b.blocked_id = auth.uid()))
    group by t.user_id
    order by overlap desc
    limit 300
  ), cand as (
    select t.tmdb_key, max(t.title) as title, max(t.poster) as poster, max(t.media) as media, count(distinct t.user_id)::int as users, sum(p.overlap) as w
    from public.titles t join peers p on p.user_id = t.user_id
    where t.watched and t.stars >= 4 and t.tmdb_key not in (select k from seeds)
      and not exists (select 1 from public.titles m where m.user_id = auth.uid() and m.tmdb_key = t.tmdb_key)
    group by t.tmdb_key
    having count(distinct t.user_id) >= 3
  )
  select tmdb_key, title, poster, media, users from cand order by w desc, users desc limit 60
$$;
revoke all on function public.community_recs(text[]) from public;
grant execute on function public.community_recs(text[]) to authenticated;


-- ===== Affinità con gli amici =====
-- Per ogni amico che condivide l'attività: quanti titoli avete votato entrambi, quanto siete simili (0-100),
-- cosa avete amato tutti e due, dove non siete d'accordo e cosa ha amato lui che tu non hai ancora visto.
create or replace function public.friend_compat() returns table (user_id uuid, name text, username text, avatar integer, common integer, score integer, loves jsonb, fights jsonb, for_me jsonb)
language sql stable security definer set search_path = public as
$$
  with fr as (
    select case when f.a = auth.uid() then f.b else f.a end as u from public.friendships f where f.status = 'ok' and auth.uid() in (f.a, f.b)
  ), ok as (
    select s.user_id, s.name, s.username, s.avatar from public.settings s join fr on fr.u = s.user_id where s.share_activity
  )
  select o.user_id, o.name, o.username, o.avatar, coalesce(c.n, 0)::int,
    case when coalesce(c.n, 0) = 0 then null else round((c.sim + 50 * 3) / (c.n + 3))::int end,
    coalesce(l.j, '[]'::jsonb), coalesce(fi.j, '[]'::jsonb), coalesce(fm.j, '[]'::jsonb)
  from ok o
  left join lateral (
    select count(*) as n, sum(100 - abs(m.stars - t.stars) * 25) as sim
    from public.titles m join public.titles t on t.tmdb_key = m.tmdb_key and t.user_id = o.user_id and t.watched and t.stars > 0
    where m.user_id = auth.uid() and m.watched and m.stars > 0
  ) c on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('k', x.tmdb_key, 't', x.title, 'p', x.poster) order by x.s desc) as j from (
      select m.tmdb_key, m.title, m.poster, m.stars + t.stars as s
      from public.titles m join public.titles t on t.tmdb_key = m.tmdb_key and t.user_id = o.user_id and t.watched and t.stars >= 4
      where m.user_id = auth.uid() and m.watched and m.stars >= 4 order by s desc limit 8) x
  ) l on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('k', x.tmdb_key, 't', x.title, 'p', x.poster, 'a', x.a, 'b', x.b) order by x.d desc) as j from (
      select m.tmdb_key, m.title, m.poster, m.stars as a, t.stars as b, abs(m.stars - t.stars) as d
      from public.titles m join public.titles t on t.tmdb_key = m.tmdb_key and t.user_id = o.user_id and t.watched and t.stars > 0
      where m.user_id = auth.uid() and m.watched and m.stars > 0 and abs(m.stars - t.stars) >= 2 order by d desc limit 5) x
  ) fi on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('k', x.tmdb_key, 't', x.title, 'p', x.poster, 'b', x.stars) order by x.stars desc, x.watched_on desc nulls last) as j from (
      select t.tmdb_key, t.title, t.poster, t.stars, t.watched_on from public.titles t
      where t.user_id = o.user_id and t.watched and t.stars >= 4
        and not exists (select 1 from public.titles m where m.user_id = auth.uid() and m.tmdb_key = t.tmdb_key and (m.watched or m.skipped))
      order by t.stars desc, t.watched_on desc nulls last limit 10) x
  ) fm on true
  where auth.uid() is not null
$$;
revoke all on function public.friend_compat() from public;
grant execute on function public.friend_compat() to authenticated;

-- ===== Suggerimento della sera =====
-- L'app prepara ogni giorno i tuoi 3 titoli per la sera (solo se hai attivato l'opzione); la funzione
-- "evening" li invia come notifica all'ora scelta. Ognuno vede e modifica solo la propria riga.
create table if not exists public.evening_picks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  day date not null,
  picks jsonb not null default '[]'::jsonb,
  at_hour smallint not null default 20,
  sent_on date,
  updated_at timestamptz not null default now()
);
alter table public.evening_picks enable row level security;
drop policy if exists "sera: solo la mia" on public.evening_picks;
create policy "sera: solo la mia" on public.evening_picks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.evening_picks drop constraint if exists evening_limits;
alter table public.evening_picks add constraint evening_limits check (jsonb_typeof(picks) = 'array' and jsonb_array_length(picks) <= 5 and octet_length(picks::text) <= 3000 and at_hour between 17 and 23) not valid;

-- ===== Diario di visione: foto private =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diary', 'diary', false, 400000, array['image/jpeg']) on conflict (id) do nothing;
drop policy if exists "diario: carico nella mia cartella" on storage.objects;
create policy "diario: carico nella mia cartella" on storage.objects for insert to authenticated
  with check (bucket_id = 'diary' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "diario: vedo le mie" on storage.objects;
create policy "diario: vedo le mie" on storage.objects for select to authenticated
  using (bucket_id = 'diary' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "diario: cancello le mie" on storage.objects;
create policy "diario: cancello le mie" on storage.objects for delete to authenticated
  using (bucket_id = 'diary' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== TV: accesso con il QR =====
-- La TV crea un collegamento (id nel QR + segreto che resta solo sulla TV + numero di 4 cifre mostrato a schermo).
-- Il telefono, già connesso, lo conferma con la funzione "tv-login" scrivendo il numero; solo la TV, con il suo segreto,
-- può poi ritirare il codice di accesso. Ogni collegamento vale 10 minuti e si usa una volta sola.
create table if not exists public.tv_links (
  id text primary key check (id ~ '^[A-Za-z0-9]{24}$'),
  secret_hash text not null,
  code text not null,
  token_hash text,
  user_id uuid references auth.users(id) on delete cascade,
  tries smallint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.tv_links enable row level security;
alter table public.tv_links drop constraint if exists tv_links_code_check;
alter table public.tv_links add constraint tv_links_code_check check (code ~ '^[0-9]{4}$') not valid;
-- nessuna policy: la tabella si usa solo dalle funzioni qui sotto e dalla funzione "tv-login"

create or replace function public.tv_link_new(p_id text, p_secret text) returns text
language plpgsql security definer set search_path = public as
$$
declare c text;
begin
  if p_id !~ '^[A-Za-z0-9]{24}$' or coalesce(char_length(p_secret), 0) not between 24 and 64 then raise exception 'Dati non validi'; end if;
  delete from public.tv_links where created_at < now() - interval '10 minutes';
  if (select count(*) from public.tv_links) >= 5000 then raise exception 'Riprova tra qualche minuto'; end if;
  c := (1000 + floor(random() * 9000))::int::text;
  insert into public.tv_links (id, secret_hash, code) values (p_id, encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'), c);
  return c;
end;
$$;
revoke all on function public.tv_link_new(text, text) from public;
grant execute on function public.tv_link_new(text, text) to anon, authenticated;

-- 'wait' = non ancora confermato, 'gone' = scaduto o annullato, altrimenti il codice di accesso (una volta sola)
create or replace function public.tv_link_poll(p_id text, p_secret text) returns text
language plpgsql security definer set search_path = public as
$$
declare r public.tv_links;
begin
  select * into r from public.tv_links where id = p_id and secret_hash = encode(sha256(convert_to(coalesce(p_secret, ''), 'UTF8')), 'hex');
  if not found or r.created_at < now() - interval '10 minutes' then return 'gone'; end if;
  if r.token_hash is null then return 'wait'; end if;
  delete from public.tv_links where id = p_id;
  return r.token_hash;
end;
$$;
revoke all on function public.tv_link_poll(text, text) from public;
grant execute on function public.tv_link_poll(text, text) to anon, authenticated;

-- ===== Amici consigliati =====
-- Persone che potresti conoscere: amici dei tuoi amici e (solo tra chi condivide cosa guarda) persone con gusti simili.
-- Compare solo chi ha un username e accetta richieste da tutti; mai chi hai bloccato o chi ti ha bloccato.
create index if not exists titles_key_idx on public.titles (tmdb_key);
-- chi non vuole comparire tra i consigliati lo sceglie in Impostazioni › Amici e richieste
alter table public.settings add column if not exists suggest boolean not null default true;
create or replace function public.friend_suggest() returns table (user_id uuid, username text, name text, avatar integer, mutual integer, sim integer, via text)
language sql stable security definer set search_path = public as
$$
  with fr as (
    select case when f.a = auth.uid() then f.b else f.a end as u from public.friendships f where f.status = 'ok' and auth.uid() in (f.a, f.b)
  ), touched as (
    select case when f.a = auth.uid() then f.b else f.a end as u from public.friendships f where auth.uid() in (f.a, f.b)
  ), fof as (
    select case when f.a = fr.u then f.b else f.a end as u, fr.u as via from public.friendships f join fr on fr.u in (f.a, f.b) where f.status = 'ok'
  ), cm as (
    select u, count(distinct via)::int as mutual, (array_agg(via))[1] as via1 from fof
    where u <> auth.uid() and u not in (select u from touched) group by u
  ), mine as (
    select tmdb_key, stars from public.titles where user_id = auth.uid() and watched and stars > 0
  ), ct as (
    select t.user_id as u, round((sum(100 - abs(m.stars - t.stars) * 25) + 50 * 3) / (count(*) + 3))::int as sim
    from public.titles t join mine m on m.tmdb_key = t.tmdb_key
    join public.settings s2 on s2.user_id = t.user_id and s2.share_activity
    where t.watched and t.stars > 0 and t.user_id <> auth.uid() and t.user_id not in (select u from touched)
    group by t.user_id having count(*) >= 5
  )
  select s.user_id, s.username, s.name, s.avatar, coalesce(cm.mutual, 0), case when ct.sim >= 65 then ct.sim end, vs.name
  from public.settings s
  left join cm on cm.u = s.user_id
  left join ct on ct.u = s.user_id
  left join public.settings vs on vs.user_id = cm.via1
  where auth.uid() is not null
    and (cm.u is not null or ct.sim >= 65)
    and s.username is not null and coalesce(s.friend_req, 'all') = 'all' and coalesce(s.suggest, true)
    and not exists (select 1 from public.user_blocks b where (b.user_id = s.user_id and b.blocked_id = auth.uid()) or (b.user_id = auth.uid() and b.blocked_id = s.user_id))
  order by coalesce(cm.mutual, 0) desc, coalesce(ct.sim, 0) desc, s.username
  limit 12
$$;
revoke all on function public.friend_suggest() from public;
grant execute on function public.friend_suggest() to authenticated;

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
