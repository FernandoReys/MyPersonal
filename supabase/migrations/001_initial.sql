-- My Personal v0.1. Execute in a NEW Supabase project, never over another app.
begin;
create table public.user_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null default '{"assessment":null,"plan":null,"sessions":[],"measurements":[],"messages":[]}'::jsonb,
 revision integer not null default 0,
 updated_at timestamptz not null default now(),
 constraint state_shape check(jsonb_typeof(state)='object' and octet_length(state::text)<=1000000)
);
alter table public.user_workspaces enable row level security;
create policy workspace_read on public.user_workspaces for select to authenticated using(user_id=auth.uid());
-- All writes go through a transactional RPC with optimistic concurrency.
create function public.save_workspace(p_state jsonb,p_revision integer) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare next_revision integer;
begin
 if auth.uid() is null then raise exception 'unauthenticated'; end if;
 if p_revision=0 then
  insert into public.user_workspaces(user_id,state,revision) values(auth.uid(),p_state,1)
  on conflict(user_id) do nothing;
  if found then return 1; end if;
 end if;
 update public.user_workspaces set state=p_state,revision=revision+1,updated_at=now()
 where user_id=auth.uid() and revision=p_revision returning revision into next_revision;
 if next_revision is null then raise exception 'conflict'; end if;
 return next_revision;
end;$$;
revoke all on function public.save_workspace(jsonb,integer) from public,anon;
grant execute on function public.save_workspace(jsonb,integer) to authenticated;
grant select on public.user_workspaces to authenticated;
revoke insert,update,delete on public.user_workspaces from anon,authenticated;
create table public.ai_usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null default (now() at time zone 'UTC')::date,
 count integer not null default 0 check(count between 0 and 20),
 primary key(user_id,day)
);
alter table public.ai_usage enable row level security;
create policy usage_read on public.ai_usage for select to authenticated using(user_id=auth.uid());
create function public.consume_ai_quota() returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare consumed integer;
begin
 if auth.uid() is null then raise exception 'unauthenticated'; end if;
 insert into public.ai_usage(user_id,day,count) values(auth.uid(),(now() at time zone 'UTC')::date,1)
 on conflict(user_id,day) do update set count=ai_usage.count+1 where ai_usage.count<20
 returning count into consumed;
 return consumed is not null;
end;$$;
revoke all on function public.consume_ai_quota() from public,anon;
grant execute on function public.consume_ai_quota() to authenticated;
revoke insert,update,delete on public.ai_usage from anon,authenticated;
-- Normalized read projections; security_invoker ensures underlying RLS is applied.
create view public.profiles with (security_invoker=true) as
 select user_id,state->'assessment' as assessment from public.user_workspaces;
create view public.training_plans with (security_invoker=true) as
 select user_id,state->'plan' as plan from public.user_workspaces;
create view public.training_sessions with (security_invoker=true) as
 select user_id,s as session from public.user_workspaces cross join lateral jsonb_array_elements(state->'sessions') s;
create view public.body_measurements with (security_invoker=true) as
 select user_id,m as measurement from public.user_workspaces cross join lateral jsonb_array_elements(state->'measurements') m;
grant select on public.profiles,public.training_plans,public.training_sessions,public.body_measurements to authenticated;
commit;
