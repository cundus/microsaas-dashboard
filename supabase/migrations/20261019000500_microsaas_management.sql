-- Metadata is owner-only; API key ciphertext never enters the Data API or audit snapshots.
create table public.microsaas_config (
  microsaas_id uuid primary key references public.microsaas(id) on delete cascade,
  webhook_url text check (webhook_url is null or webhook_url ~ '^https://'),
  environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  maintenance_mode boolean not null default false,
  api_key_mask text,
  updated_at timestamptz not null default now()
);
alter table public.microsaas_config enable row level security;
revoke all on public.microsaas_config from public, anon, authenticated;
grant select on public.microsaas_config to authenticated;
create policy owner_config_read on public.microsaas_config for select to authenticated
  using ((select private.admin_role()) = 'super_admin');
create function private.audit_microsaas_config() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return null; end if;
  -- Retain audit history even when an otherwise empty registry entry is deleted.
  insert into public.audit_logs (admin_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), lower(tg_op), 'microsaas_config',
    coalesce(new.microsaas_id, old.microsaas_id)::text,
    jsonb_build_object('before', case when tg_op <> 'INSERT' then to_jsonb(old) end,
      'after', case when tg_op <> 'DELETE' then to_jsonb(new) end));
  return null;
end $$;
revoke all on function private.audit_microsaas_config() from public;
create trigger config_audit after insert or update or delete on public.microsaas_config
  for each row execute function private.audit_microsaas_config();

create table private.microsaas_secrets (
  microsaas_id uuid primary key references public.microsaas(id) on delete cascade,
  api_key_encrypted text not null check (length(api_key_encrypted) > 0)
);
alter table private.microsaas_secrets enable row level security;
revoke all on private.microsaas_secrets from public, anon, authenticated;

create function public.save_microsaas_config(
  p_id uuid, p_webhook text, p_environment text,
  p_ciphertext text default null, p_mask text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.admin_role() is distinct from 'super_admin' then
    raise exception 'Super Admin required' using errcode = '42501';
  end if;
  if (p_ciphertext is null) <> (p_mask is null) or
    (p_ciphertext is not null and (p_ciphertext !~ '^v1\.' or p_mask <> '••••••••')) then
    raise exception 'Invalid encrypted key' using errcode = '22023';
  end if;
  insert into public.microsaas_config (microsaas_id, webhook_url, environment, api_key_mask)
  values (p_id, p_webhook, p_environment, p_mask)
  on conflict (microsaas_id) do update set webhook_url = excluded.webhook_url,
    environment = excluded.environment,
    api_key_mask = coalesce(excluded.api_key_mask, public.microsaas_config.api_key_mask), updated_at = now();
  if p_ciphertext is not null then
    insert into private.microsaas_secrets values (p_id, p_ciphertext)
    on conflict (microsaas_id) do update set api_key_encrypted = excluded.api_key_encrypted;
  end if;
end $$;

create function public.set_microsaas_maintenance(p_id uuid, p_enabled boolean, p_confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.admin_role() is distinct from 'super_admin' then
    raise exception 'Super Admin required' using errcode = '42501';
  end if;
  perform 1 from public.microsaas where id = p_id and name = p_confirmation for update;
  if not found or p_enabled is null then raise exception 'Product confirmation mismatch' using errcode = '22023'; end if;
  insert into public.microsaas_config (microsaas_id, maintenance_mode) values (p_id, p_enabled)
  on conflict (microsaas_id) do update set maintenance_mode = excluded.maintenance_mode, updated_at = now();
end $$;

-- Keep business history: FK RESTRICT rejects deletion of a product with linked records.
create function public.delete_microsaas(p_id uuid, p_confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.admin_role() is distinct from 'super_admin' then
    raise exception 'Super Admin required' using errcode = '42501';
  end if;
  perform 1 from public.microsaas where id = p_id and name = p_confirmation for update;
  if not found then raise exception 'Product confirmation mismatch' using errcode = '22023'; end if;
  delete from public.microsaas where id = p_id;
end $$;
revoke delete on public.microsaas from authenticated;
revoke all on function public.save_microsaas_config(uuid,text,text,text,text),
  public.set_microsaas_maintenance(uuid,boolean,text), public.delete_microsaas(uuid,text) from public, anon;
grant execute on function public.save_microsaas_config(uuid,text,text,text,text),
  public.set_microsaas_maintenance(uuid,boolean,text), public.delete_microsaas(uuid,text) to authenticated;

-- Storage is provided by Supabase; embedded SQL tests do not install that service.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('microsaas-logos', 'microsaas-logos', true, 1048576, array['image/png','image/jpeg','image/webp'])
    on conflict (id) do nothing;
    execute 'create policy microsaas_logo_owner on storage.objects for all to authenticated
      using (bucket_id = ''microsaas-logos'' and (select private.admin_role()) = ''super_admin'')
      with check (bucket_id = ''microsaas-logos'' and (select private.admin_role()) = ''super_admin'')';
  end if;
end $$;
