-- Invoker rights preserve the existing RLS scope, including Finance restrictions.
create function public.get_microsaas_list(p_slug text default null)
returns table (
  id uuid, name text, slug text, description text, logo_url text,
  status text, user_count bigint, currency text, mrr numeric,
  uptime_percent numeric, latest_uptime_percent numeric, checked_at timestamptz
)
language plpgsql stable security invoker set search_path = '' as $$
declare caller_role text := private.admin_role();
begin
  if caller_role is null then
    raise exception 'Active admin required' using errcode = '42501';
  end if;
  return query
  select m.id, m.name, m.slug, m.description, m.logo_url, m.status,
    case when caller_role <> 'finance_admin' then (
      select count(*) from public.users u where u.microsaas_id = m.id and u.status <> 'deleted'
    ) end,
    coalesce(r.currency, 'IDR'), coalesce(r.mrr, 0),
    case when caller_role <> 'finance_admin' then (
      select avg(p.uptime_percent) from public.performance_metrics p
      where p.microsaas_id = m.id and p.endpoint = '/'
        and p.recorded_at >= now() - interval '30 days' and p.recorded_at <= now()
    ) end,
    latest.uptime_percent, latest.recorded_at
  from public.microsaas m
  left join lateral (
    select s.currency, sum(s.price / case when s.billing_interval = 'yearly' then 12 else 1 end) as mrr
    from public.subscriptions s where s.microsaas_id = m.id and s.status = 'active'
    group by s.currency
  ) r on true
  left join lateral (
    select p.uptime_percent, p.recorded_at from public.performance_metrics p
    where p.microsaas_id = m.id and p.endpoint = '/' and p.recorded_at <= now()
      and caller_role <> 'finance_admin'
    order by p.recorded_at desc limit 1
  ) latest on true
  where p_slug is null or m.slug = p_slug
  order by m.name, m.id, r.currency;
end $$;

revoke all on function public.get_microsaas_list(text) from public, anon;
grant execute on function public.get_microsaas_list(text) to authenticated;
