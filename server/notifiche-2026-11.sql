-- Notifiche push e "Ultimi match" (applicato il 10/11/2026 al progetto Supabase).
-- I segreti (vapid_public, vapid_private, cron_secret, tmdb_key) sono nel Vault: vault.create_secret(valore, nome).
create extension if not exists pg_net;
create extension if not exists pg_cron;
alter table public.rooms add column if not exists matches jsonb not null default '[]'::jsonb;

create or replace function public.app_secret(n text) returns text language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = n and n in ('vapid_private','vapid_public','cron_secret','tmdb_key') limit 1 $$;
revoke all on function public.app_secret(text) from public, anon, authenticated;
grant execute on function public.app_secret(text) to service_role;

create or replace function public.fn_call(fn text, payload jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform net.http_post(url := 'https://dhbydbyrmjdehquygrmc.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := payload, timeout_milliseconds := 60000);
end $$;
revoke all on function public.fn_call(text, jsonb) from public, anon, authenticated;

-- quando un titolo piace a tutti quelli che votano (almeno 2): salvato in rooms.matches + notifica
create or replace function public.room_match_check() returns trigger language plpgsql security definer set search_path = '' as $$
declare r public.rooms; voters int; it jsonb; newm jsonb := '[]'::jsonb; already jsonb;
begin
  select * into r from public.rooms where id = new.room_id;
  if r.id is null or r.kind <> 'duo' then return new; end if;
  select count(*) into voters from public.room_members m where m.room_id = r.id and coalesce(m.votes->>'_tv','0') = '0';
  if voters < 2 then return new; end if;
  already := coalesce(r.matches, '[]'::jsonb);
  for it in select x from jsonb_array_elements(coalesce(r.items, '[]'::jsonb)) x loop
    continue when exists (select 1 from jsonb_array_elements(already) a where a->>'k' = it->>'k');
    if (select count(*) from public.room_members m where m.room_id = r.id and coalesce(m.votes->>'_tv','0') = '0' and (m.votes->>(it->>'k')) in ('1','2')) = voters then
      newm := newm || jsonb_build_array(jsonb_build_object('k', it->>'k', 't', it->>'t', 'p', it->>'p', 'm', it->>'m', 'at', now()));
    end if;
  end loop;
  if jsonb_array_length(newm) > 0 then
    update public.rooms set matches = already || newm where id = r.id;
    perform public.fn_call('event', jsonb_build_object('type','match','room', r.id, 'items', newm));
  end if;
  return new;
end $$;
create or replace trigger room_match_check after insert or update of votes on public.room_members for each row execute function public.room_match_check();

create or replace function public.friend_msg_push() returns trigger language plpgsql security definer set search_path = '' as $$
begin perform public.fn_call('event', jsonb_build_object('type','msg','id', new.id)); return new; end $$;
create or replace trigger friend_msg_push after insert on public.friend_msgs for each row execute function public.friend_msg_push();
revoke all on function public.room_match_check() from public, anon, authenticated;
revoke all on function public.friend_msg_push() from public, anon, authenticated;

select cron.schedule('tonightly-notify', '0 18 * * *', $$select public.fn_call('notify', '{}'::jsonb)$$);
select cron.schedule('tonightly-evening', '30 * * * *', $$select public.fn_call('evening', '{}'::jsonb)$$);
