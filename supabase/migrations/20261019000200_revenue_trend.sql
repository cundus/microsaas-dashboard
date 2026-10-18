-- Daily end-of-day MRR in Asia/Jakarta; today's point is as of now().
-- Only aggregates leave this definer function. Scope is checked explicitly.
create function public.get_revenue_time_series(p_start date, p_end date)
returns table (day date, microsaas_id uuid, name text, currency text, mrr numeric)
language plpgsql stable security definer set search_path = '' as $$
declare caller_role text := private.admin_role();
begin
  if caller_role is null then
    raise exception 'Active admin required' using errcode = '42501';
  end if;
  if p_start is null or p_end is null or p_start > p_end
    or p_end > (now() at time zone 'Asia/Jakarta')::date or p_end - p_start > 365 then
    raise exception 'Invalid date range (maximum 366 days, no future dates)' using errcode = '22023';
  end if;
  return query
  with days as (
    select p_start + n as d,
      least(now(), ((p_start + n + 1)::timestamp at time zone 'Asia/Jakarta') - interval '1 microsecond') as cutoff
    from generate_series(0, p_end - p_start) n
  ), current_records as (
    select 'microsaas'::text as kind, m.id::text as id, to_jsonb(m) as data from public.microsaas m
    union all select 'subscriptions', s.id::text, to_jsonb(s) from public.subscriptions s
  ), entities as (
    select c.kind, c.id from current_records c
    union
    select a.resource_type, a.resource_id from public.audit_logs a
    where a.resource_type in ('microsaas', 'subscriptions') and a.action in ('insert', 'update', 'delete')
      and a.created_at > (p_start::timestamp at time zone 'Asia/Jakarta')
  ), snapshots as (
    select d.d, e.kind,
      case when change.found then change.data else c.data end as data
    from days d cross join entities e
    left join current_records c on c.kind = e.kind and c.id = e.id
    left join lateral (
      select true as found, a.metadata->'before' as data from public.audit_logs a
      where a.resource_type = e.kind and a.resource_id = e.id
        and a.action in ('insert', 'update', 'delete') and a.created_at > d.cutoff
      order by a.created_at, a.event_order limit 1
    ) change on true
    where (case when change.found then change.data else c.data end ->> 'created_at')::timestamptz <= d.cutoff
  ), scoped as (
    select s.* from snapshots s
    where caller_role in ('super_admin', 'finance_admin') or exists (
      select 1 from public.admin_assignments a where a.admin_id = auth.uid()
        and a.microsaas_id = (case when s.kind = 'microsaas' then s.data->>'id' else s.data->>'microsaas_id' end)::uuid
    )
  ), products as (
    select distinct on (s.data->>'id') (s.data->>'id')::uuid as id, s.data->>'name' as label
    from scoped s where s.kind = 'microsaas' order by s.data->>'id', s.d desc
  ), revenue as (
    select s.d, (s.data->>'microsaas_id')::uuid as id, s.data->>'currency' as code,
      sum((s.data->>'price')::numeric / case when s.data->>'billing_interval' = 'yearly' then 12 else 1 end) as amount
    from scoped s where s.kind = 'subscriptions' and s.data->>'status' = 'active'
    group by s.d, s.data->>'microsaas_id', s.data->>'currency'
  ), series as (
    select p.id, p.label, coalesce(r.code, 'IDR') as code
    from products p left join (select distinct r.id, r.code from revenue r) r on r.id = p.id
  )
  select d.d, s.id, s.label, s.code, coalesce(r.amount, 0)
  from days d cross join series s
  left join revenue r on r.d = d.d and r.id = s.id and r.code = s.code
  order by d.d, s.label, s.id, s.code;
end $$;

revoke all on function public.get_revenue_time_series(date, date) from public, anon;
grant execute on function public.get_revenue_time_series(date, date) to authenticated;
