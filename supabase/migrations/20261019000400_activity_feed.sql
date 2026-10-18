-- Sanitized projection: neither audit before/after images nor user PII enter Realtime.
create table public.dashboard_activity (
  id bigint generated always as identity primary key,
  source_key text not null unique,
  microsaas_id uuid not null references public.microsaas(id) on delete cascade,
  kind text not null check (kind in ('signup', 'upgrade', 'churn', 'error_spike', 'admin')),
  resource_id text not null,
  description text not null,
  occurred_at timestamptz not null
);
create index dashboard_activity_recent_idx on public.dashboard_activity (occurred_at desc, id desc);
create index dashboard_activity_scope_idx on public.dashboard_activity (microsaas_id, occurred_at desc);
alter table public.dashboard_activity enable row level security;
revoke all on public.dashboard_activity from public, anon, authenticated;
grant select on public.dashboard_activity to authenticated;
create policy activity_super_read on public.dashboard_activity for select to authenticated
  using ((select private.admin_role()) = 'super_admin');
create policy activity_operator_read on public.dashboard_activity for select to authenticated
  using (private.assigned_to(microsaas_id));
create policy activity_finance_read on public.dashboard_activity for select to authenticated
  using ((select private.admin_role()) = 'finance_admin' and kind in ('upgrade', 'churn'));

create function private.subscription_activity_kind(before_row jsonb, after_row jsonb) returns text
language sql immutable set search_path = '' as $$
  select case
    when after_row->>'status' in ('canceled', 'expired')
      and before_row->>'status' in ('active', 'trial', 'past_due', 'complimentary') then 'churn'
    when after_row->>'status' = 'active' and before_row->>'status' = 'active'
      and after_row->>'currency' = before_row->>'currency'
      and (after_row->>'price')::numeric / case when after_row->>'billing_interval' = 'yearly' then 12 else 1 end
        > (before_row->>'price')::numeric / case when before_row->>'billing_interval' = 'yearly' then 12 else 1 end then 'upgrade'
  end;
$$;
revoke all on function private.subscription_activity_kind(jsonb, jsonb) from public;

create function private.capture_dashboard_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  event_kind text;
  event_key text;
  product_id uuid;
  target_id text;
  message text;
  event_time timestamptz;
  previous_rate numeric;
begin
  if tg_table_name = 'users' then
    event_kind := 'signup'; event_key := 'signup:' || new.id;
    product_id := new.microsaas_id; target_id := new.id::text;
    message := 'Pengguna baru mendaftar'; event_time := new.created_at;
  elsif tg_table_name = 'subscriptions' then
    if tg_op = 'INSERT' then
      if new.status in ('canceled', 'expired') then event_kind := 'churn'; end if;
    else
      event_kind := private.subscription_activity_kind(to_jsonb(old), to_jsonb(new));
    end if;
    event_key := 'subscription:' || gen_random_uuid();
    product_id := new.microsaas_id; target_id := new.id::text;
    message := case when event_kind = 'upgrade' then 'Subscription naik ke MRR lebih tinggi' else 'Subscription berhenti' end;
    event_time := case when tg_op = 'INSERT' then coalesce(new.canceled_at, new.created_at) else now() end;
  elsif tg_table_name = 'performance_metrics' then
    -- Baseline until configurable alert evaluation ships: >=5% errors, >=20 requests.
    if new.request_count < 20 or new.error_count::numeric / nullif(new.request_count, 0) < 0.05 then return null; end if;
    select case when p.request_count >= 20 then p.error_count::numeric / nullif(p.request_count, 0) else 0 end
      into previous_rate from public.performance_metrics p
      where p.microsaas_id = new.microsaas_id and p.endpoint = new.endpoint and p.recorded_at < new.recorded_at
      order by p.recorded_at desc limit 1;
    if coalesce(previous_rate, 0) >= 0.05 then return null; end if;
    event_kind := 'error_spike'; event_key := 'error:' || new.id;
    product_id := new.microsaas_id; target_id := new.id::text;
    message := 'Error rate mencapai ' || round(100.0 * new.error_count / new.request_count, 2)::text || '% pada endpoint terpantau';
    event_time := new.recorded_at;
  elsif tg_table_name = 'audit_logs' then
    -- Deliberate allowlist; business events above must not be duplicated as audit items.
    if new.microsaas_id is null or new.resource_type not in ('microsaas', 'alert_rules', 'promo_codes', 'payment_gateways')
      or new.action not in ('insert', 'update', 'delete') then return null; end if;
    event_kind := 'admin'; event_key := 'audit:' || new.id;
    product_id := new.microsaas_id; target_id := new.resource_id;
    message := 'Admin: ' || new.action || ' ' || new.resource_type; event_time := new.created_at;
  end if;
  if event_kind is not null then
    insert into public.dashboard_activity (source_key, microsaas_id, kind, resource_id, description, occurred_at)
      values (event_key, product_id, event_kind, target_id, message, event_time)
      on conflict (source_key) do nothing;
  end if;
  return null;
end $$;
revoke all on function private.capture_dashboard_activity() from public;
create trigger dashboard_activity_signup after insert on public.users for each row execute function private.capture_dashboard_activity();
create trigger dashboard_activity_subscription after insert or update on public.subscriptions for each row execute function private.capture_dashboard_activity();
create trigger dashboard_activity_error after insert on public.performance_metrics for each row execute function private.capture_dashboard_activity();
create trigger dashboard_activity_admin after insert on public.audit_logs for each row execute function private.capture_dashboard_activity();

-- Existing source history is projected once; subsequent integration writes use the same triggers.
insert into public.dashboard_activity (source_key, microsaas_id, kind, resource_id, description, occurred_at)
select 'signup:' || u.id, u.microsaas_id, 'signup', u.id::text, 'Pengguna baru mendaftar', u.created_at
from public.users u;

insert into public.dashboard_activity (source_key, microsaas_id, kind, resource_id, description, occurred_at)
select 'history:' || a.id, a.microsaas_id, k.kind, a.resource_id,
  case when k.kind = 'upgrade' then 'Subscription naik ke MRR lebih tinggi' else 'Subscription berhenti' end, a.created_at
from public.audit_logs a
cross join lateral (select private.subscription_activity_kind(a.metadata->'before', a.metadata->'after') as kind) k
where a.resource_type = 'subscriptions' and a.action = 'update' and a.microsaas_id is not null and k.kind is not null;

insert into public.dashboard_activity (source_key, microsaas_id, kind, resource_id, description, occurred_at)
select 'churn:' || s.id, s.microsaas_id, 'churn', s.id::text, 'Subscription berhenti', coalesce(s.canceled_at, s.updated_at)
from public.subscriptions s where s.status in ('canceled', 'expired') and not exists (
  select 1 from public.dashboard_activity a where a.kind = 'churn' and a.resource_id = s.id::text
);

insert into public.dashboard_activity (source_key, microsaas_id, kind, resource_id, description, occurred_at)
select 'error:' || p.id, p.microsaas_id, 'error_spike', p.id::text,
  'Error rate mencapai ' || round(100.0 * p.error_count / p.request_count, 2)::text || '% pada endpoint terpantau', p.recorded_at
from (
  select p.*, lag(case when p.request_count >= 20 then p.error_count::numeric / nullif(p.request_count, 0) else 0 end)
    over (partition by p.microsaas_id, p.endpoint order by p.recorded_at) as previous_rate
  from public.performance_metrics p
) p where p.request_count >= 20 and p.error_count::numeric / nullif(p.request_count, 0) >= 0.05 and coalesce(p.previous_rate, 0) < 0.05;

insert into public.dashboard_activity (source_key, microsaas_id, kind, resource_id, description, occurred_at)
select 'audit:' || a.id, a.microsaas_id, 'admin', a.resource_id, 'Admin: ' || a.action || ' ' || a.resource_type, a.created_at
from public.audit_logs a where a.microsaas_id is not null
  and a.resource_type in ('microsaas', 'alert_rules', 'promo_codes', 'payment_gateways') and a.action in ('insert', 'update', 'delete');

create function public.get_recent_activity(p_limit integer default 20)
returns table (id bigint, microsaas_id uuid, product_name text, product_slug text, kind text, resource_id text, description text, occurred_at timestamptz)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if private.admin_role() is null then raise exception 'Active admin required' using errcode = '42501'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then raise exception 'Invalid limit (1-100)' using errcode = '22023'; end if;
  return query select a.id, a.microsaas_id, m.name, m.slug, a.kind, a.resource_id, a.description, a.occurred_at
    from public.dashboard_activity a join public.microsaas m on m.id = a.microsaas_id
    where a.occurred_at <= now() order by a.occurred_at desc, a.id desc limit p_limit;
end $$;
revoke all on function public.get_recent_activity(integer) from public, anon;
grant execute on function public.get_recent_activity(integer) to authenticated;

-- Preserve the existing publication and every unrelated table in the shared project.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.dashboard_activity;
  else
    create publication supabase_realtime for table public.dashboard_activity;
  end if;
end $$;
