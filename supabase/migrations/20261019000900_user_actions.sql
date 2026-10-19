-- Account support stays scoped to a product; financial history is retained.
alter table public.users
  add column ban_reason text check (char_length(ban_reason) between 1 and 500),
  add column status_before_ban text check (status_before_ban in ('active', 'trial'));
revoke delete on public.users from authenticated;

create function public.manage_user(
  p_user_id uuid, p_action text, p_reason text default null, p_confirmation text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target public.users;
  role_name text := private.admin_role();
begin
  if role_name is null or role_name not in ('super_admin', 'operator_admin') then
    raise exception 'Support admin required' using errcode = '42501';
  end if;
  select * into target from public.users
    where id = p_user_id and status <> 'deleted'
    and (role_name = 'super_admin' or private.assigned_to(microsaas_id)) for update;
  if not found then raise exception 'User unavailable' using errcode = 'P0002'; end if;

  case p_action
    when 'ban' then
      if target.status not in ('active', 'trial') then
        raise exception 'Status changed' using errcode = '22023';
      end if;
      if p_reason is null or char_length(trim(p_reason)) not between 1 and 500 then
        raise exception 'Ban reason required' using errcode = '22023';
      end if;
      update public.users set status = 'banned', ban_reason = trim(p_reason),
        status_before_ban = target.status where id = target.id;
    when 'unban' then
      if target.status <> 'banned' then
        raise exception 'Status changed' using errcode = '22023';
      end if;
      -- Older bans have no snapshot and return to active.
      update public.users set status = coalesce(status_before_ban, 'active'),
        ban_reason = null, status_before_ban = null where id = target.id;
    when 'delete' then
      if p_confirmation is distinct from target.email then
        raise exception 'Email confirmation mismatch' using errcode = '22023';
      end if;
      update public.users set status = 'deleted', deleted_at = now() where id = target.id;
    when 'reset_password' then
      -- The row lock serializes requests across admins, not just one browser.
      if exists (select 1 from public.audit_logs where resource_type = 'users'
        and resource_id = target.id::text and action = 'password_reset_requested'
        and created_at > now() - interval '60 seconds') then
        raise exception 'Wait before retrying' using errcode = '54000';
      end if;
      insert into public.audit_logs(admin_id,microsaas_id,action,resource_type,resource_id)
        values(auth.uid(),target.microsaas_id,'password_reset_requested','users',target.id::text);
      return jsonb_build_object('email',target.email,'redirectTo',
        (select url from public.microsaas where id = target.microsaas_id));
    else raise exception 'Invalid action' using errcode = '22023';
  end case;
  -- The existing audit trigger captures before/after, actor, scope and ban reason
  -- in this transaction. No financial records or Auth identities are deleted.
  return '{}'::jsonb;
end $$;
revoke all on function public.manage_user(uuid,text,text,text) from public, anon;
grant execute on function public.manage_user(uuid,text,text,text) to authenticated;
