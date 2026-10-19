-- Login timestamps are supplied by each MicroSaaS integration via users.last_login_at.
-- Existing rows provide only their latest known login, never invented older history.
create table public.user_login_history (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  microsaas_id uuid not null,
  occurred_at timestamptz not null,
  foreign key (user_id, microsaas_id) references public.users(id, microsaas_id) on delete cascade,
  unique (user_id, occurred_at)
);
create index user_login_history_recent_idx on public.user_login_history(user_id, occurred_at desc, id desc);
alter table public.user_login_history enable row level security;
revoke all on public.user_login_history from public, anon, authenticated;
grant select on public.user_login_history to authenticated;
create policy login_history_read on public.user_login_history for select to authenticated
  using (((select private.admin_role()) = 'super_admin' or private.assigned_to(microsaas_id))
    and exists (select 1 from public.users u where u.id = user_id and u.status <> 'deleted'));

create function private.capture_user_login() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.last_login_at is not null and new.status <> 'deleted' then
    if tg_op = 'INSERT' or new.last_login_at is distinct from old.last_login_at then
      insert into public.user_login_history(user_id, microsaas_id, occurred_at)
        values (new.id, new.microsaas_id, new.last_login_at)
        on conflict (user_id, occurred_at) do nothing;
    end if;
  end if;
  return null;
end;
$$;
revoke all on function private.capture_user_login() from public, anon, authenticated;
create trigger capture_user_login after insert or update of last_login_at on public.users
  for each row execute function private.capture_user_login();

insert into public.user_login_history(user_id, microsaas_id, occurred_at)
  select id, microsaas_id, last_login_at from public.users
  where last_login_at is not null and status <> 'deleted';
