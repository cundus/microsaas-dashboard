-- Current plan is the newest non-canceled subscription, with a deterministic ID tie-break.
create index subscriptions_user_current_idx on public.subscriptions (user_id, created_at desc, id desc)
  where status in ('active', 'trial', 'past_due', 'complimentary');

create function public.get_users(
  p_search text default '', p_microsaas uuid default null, p_plan uuid default null,
  p_status text default '', p_joined_from date default null, p_joined_to date default null,
  p_sort text default 'created_at', p_direction text default 'desc',
  p_page integer default 1, p_size integer default 25
) returns table (rows jsonb, total bigint, current_page integer)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if private.admin_role() is null or private.admin_role() = 'finance_admin' then
    raise exception 'User management access required' using errcode = '42501';
  end if;
  if p_search is null or length(p_search) > 200 or p_status is null
    or p_status not in ('', 'active', 'banned', 'trial')
    or p_sort is null or p_sort not in ('name','email','microsaas_name','plan_name','status','created_at')
    or p_direction is null or p_direction not in ('asc','desc')
    or p_page is null or p_page < 1 or p_page > 40000
    or p_size is null or p_size not in (25,50,100)
    or (p_joined_from is not null and p_joined_to is not null and p_joined_from > p_joined_to)
  then raise exception 'Invalid user filters or pagination' using errcode = '22023'; end if;

  return query
  with filtered as materialized (
    select u.id, u.avatar_url, u.name, u.email, u.microsaas_id, m.name as microsaas_name,
      m.slug as microsaas_slug, current_plan.plan_id, current_plan.plan_name, u.status, u.created_at
    from public.users u
    join public.microsaas m on m.id = u.microsaas_id
    left join lateral (
      select s.plan_id, p.name as plan_name from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      where s.user_id = u.id and s.microsaas_id = u.microsaas_id
        and s.status in ('active','trial','past_due','complimentary')
      order by s.created_at desc, s.id desc limit 1
    ) current_plan on true
    where u.status <> 'deleted'
      and (p_microsaas is null or u.microsaas_id = p_microsaas)
      and (p_plan is null or current_plan.plan_id = p_plan)
      and (p_status = '' or u.status = p_status)
      and (p_search = '' or strpos(lower(u.name), lower(p_search)) > 0
        or strpos(lower(u.email), lower(p_search)) > 0 or strpos(u.id::text, lower(p_search)) > 0)
      and (p_joined_from is null or u.created_at >= (p_joined_from::timestamp at time zone 'Asia/Jakarta'))
      and (p_joined_to is null or u.created_at < ((p_joined_to + 1)::timestamp at time zone 'Asia/Jakarta'))
  ), totals as (
    select count(*) as n from filtered
  ), pagination as (
    select n, least(p_page, greatest(1, ((n - 1) / p_size + 1)::integer)) as page from totals
  ), ordered as (
    select f.*, row_number() over (order by
      case when p_sort = 'name' and p_direction = 'asc' then lower(f.name) end asc,
      case when p_sort = 'name' and p_direction = 'desc' then lower(f.name) end desc,
      case when p_sort = 'email' and p_direction = 'asc' then lower(f.email) end asc,
      case when p_sort = 'email' and p_direction = 'desc' then lower(f.email) end desc,
      case when p_sort = 'microsaas_name' and p_direction = 'asc' then lower(f.microsaas_name) end asc,
      case when p_sort = 'microsaas_name' and p_direction = 'desc' then lower(f.microsaas_name) end desc,
      case when p_sort = 'plan_name' and p_direction = 'asc' then lower(f.plan_name) end asc nulls last,
      case when p_sort = 'plan_name' and p_direction = 'desc' then lower(f.plan_name) end desc nulls last,
      case when p_sort = 'status' and p_direction = 'asc' then f.status end asc,
      case when p_sort = 'status' and p_direction = 'desc' then f.status end desc,
      case when p_sort = 'created_at' and p_direction = 'asc' then f.created_at end asc,
      case when p_sort = 'created_at' and p_direction = 'desc' then f.created_at end desc,
      f.id asc) as position
    from filtered f
  ), page_rows as (
    select o.* from ordered o cross join pagination p
    where o.position > (p.page - 1) * p_size and o.position <= p.page * p_size
  )
  select coalesce((select jsonb_agg(to_jsonb(r) - 'position' order by r.position) from page_rows r), '[]'::jsonb),
    p.n, p.page from pagination p;
end $$;
revoke all on function public.get_users(text,uuid,uuid,text,date,date,text,text,integer,integer) from public, anon;
grant execute on function public.get_users(text,uuid,uuid,text,date,date,text,text,integer,integer) to authenticated;
