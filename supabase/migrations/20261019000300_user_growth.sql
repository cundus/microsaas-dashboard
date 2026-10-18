-- Acquisition counts, not net active-user changes. Invoker rights retain users RLS.
create function public.get_user_growth_time_series(p_start date, p_end date, p_interval text default 'day')
returns table (period_start date, period_end date, new_users bigint)
language plpgsql stable security invoker set search_path = '' as $$
declare caller_role text := private.admin_role();
begin
  if caller_role is null or caller_role not in ('super_admin', 'operator_admin') then
    raise exception 'User data access required' using errcode = '42501';
  end if;
  if p_start is null or p_end is null or p_start > p_end
    or p_end > (now() at time zone 'Asia/Jakarta')::date or p_end - p_start > 365
    or p_interval is null or p_interval not in ('day', 'week', 'month') then
    raise exception 'Invalid range or interval (maximum 366 days, no future dates)' using errcode = '22023';
  end if;
  return query
  with days as (
    select p_start + n as d, date_trunc(p_interval, (p_start + n)::timestamp)::date as bucket
    from generate_series(0, p_end - p_start) n
  ), periods as (
    select d.bucket, min(d.d) as first_day, max(d.d) as last_day
    from days d group by d.bucket
  ), signups as (
    select date_trunc(p_interval, u.created_at at time zone 'Asia/Jakarta')::date as bucket,
      count(*) as total
    from public.users u
    where u.created_at >= (p_start::timestamp at time zone 'Asia/Jakarta')
      and u.created_at < ((p_end + 1)::timestamp at time zone 'Asia/Jakarta')
      and u.created_at <= now()
    group by 1
  )
  select p.first_day, p.last_day, coalesce(s.total, 0)
  from periods p left join signups s on s.bucket = p.bucket
  order by p.first_day;
end $$;

revoke all on function public.get_user_growth_time_series(date, date, text) from public, anon;
grant execute on function public.get_user_growth_time_series(date, date, text) to authenticated;
