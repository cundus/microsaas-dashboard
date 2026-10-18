-- Aggregate only: no user records or audit metadata cross the RPC boundary.
-- Transaction timestamps can tie; preserve mutation order for before-images.
alter table public.audit_logs add column event_order bigint generated always as identity;

create function public.get_global_kpis()
returns table (metric text, currency text, value numeric, previous numeric)
language plpgsql stable security definer set search_path = '' as $$
declare
  caller_role text := private.admin_role();
  cutoff timestamptz := now() - interval '30 days';
begin
  if caller_role is null then
    raise exception 'Active admin required' using errcode = '42501';
  end if;
  return query
  with current_records as (
    select 'microsaas'::text as kind, m.id::text as id, to_jsonb(m) as data from public.microsaas m
    union all select 'users', u.id::text, to_jsonb(u) from public.users u
    union all select 'subscriptions', s.id::text, to_jsonb(s) from public.subscriptions s
  ), first_changes as (
    -- First before-image after the cutoff also handles deleted entities.
    select distinct on (a.resource_type, a.resource_id)
      a.resource_type as kind, a.resource_id as id, a.metadata->'before' as data
    from public.audit_logs a
    where a.resource_type in ('microsaas', 'users', 'subscriptions')
      and a.action in ('insert', 'update', 'delete') and a.created_at > cutoff
    order by a.resource_type, a.resource_id, a.created_at, a.event_order
  ), records as (
    select false as historical, c.kind, c.data from current_records c
    union all
    select true, coalesce(f.kind, c.kind), case when f.id is not null then f.data else c.data end
    from current_records c full join first_changes f on f.kind = c.kind and f.id = c.id
  ), scoped as (
    select r.* from records r
    where r.data is not null and r.data <> 'null'::jsonb
      and (r.data->>'created_at')::timestamptz <= case when r.historical then cutoff else now() end
      and (caller_role in ('super_admin', 'finance_admin') or exists (
        select 1 from public.admin_assignments a where a.admin_id = auth.uid()
          and a.microsaas_id = (case when r.kind = 'microsaas' then r.data->>'id' else r.data->>'microsaas_id' end)::uuid
      ))
  ), periods as (
    select false as historical union all select true
  ), counts as (
    select p.historical,
      count(*) filter (where s.kind = 'users' and s.data->>'status' <> 'deleted')::numeric as users,
      count(*) filter (where s.kind = 'microsaas')::numeric as products,
      count(*) filter (where s.kind = 'subscriptions' and s.data->>'status' = 'active')::numeric as active
    from periods p left join scoped s on s.historical = p.historical group by p.historical
  ), revenue as (
    select s.historical, s.data->>'currency' as code,
      sum((s.data->>'price')::numeric / case when s.data->>'billing_interval' = 'yearly' then 12 else 1 end) as mrr
    from scoped s where s.kind = 'subscriptions' and s.data->>'status' = 'active'
    group by s.historical, s.data->>'currency'
  ), currencies as (
    select distinct code from revenue
    union select 'IDR' where not exists (select 1 from revenue)
  )
  select 'users', null::text,
    case when caller_role <> 'finance_admin' then c.users end,
    case when caller_role <> 'finance_admin' then p.users end
    from counts c cross join counts p where not c.historical and p.historical
  union all
  select 'subscriptions', null, c.active, p.active from counts c cross join counts p where not c.historical and p.historical
  union all
  select 'microsaas', null, c.products, p.products from counts c cross join counts p where not c.historical and p.historical
  union all
  select 'mrr', codes.code, coalesce(c.mrr, 0), coalesce(p.mrr, 0)
    from currencies codes left join revenue c on c.code = codes.code and not c.historical
    left join revenue p on p.code = codes.code and p.historical
  union all
  select 'arr', codes.code, coalesce(c.mrr, 0) * 12, coalesce(p.mrr, 0) * 12
    from currencies codes left join revenue c on c.code = codes.code and not c.historical
    left join revenue p on p.code = codes.code and p.historical;
end $$;

revoke all on function public.get_global_kpis() from public, anon;
grant execute on function public.get_global_kpis() to authenticated;
create index audit_kpi_history_idx on public.audit_logs (resource_type, resource_id, created_at, event_order)
  where resource_type in ('microsaas', 'users', 'subscriptions') and action in ('insert', 'update', 'delete');
