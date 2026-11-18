begin;
create table private.ai_quota (
  user_id uuid not null references public.profiles(id) on delete cascade,
  hour timestamptz not null,
  requests integer not null check(requests between 0 and 30),
  primary key(user_id,hour)
);
create function public.consume_ai_quota() returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'Inicia sesión para consultar la IA.'; end if;
  insert into private.ai_quota values(auth.uid(),date_trunc('hour',now()),1)
    on conflict(user_id,hour) do update set requests=ai_quota.requests+1 where ai_quota.requests<30;
  if not found then raise exception 'Alcanzaste las 30 consultas de esta hora. Intenta más tarde.'; end if;
end $$;
revoke execute on function public.consume_ai_quota() from public,anon;
grant execute on function public.consume_ai_quota() to authenticated;
commit;
