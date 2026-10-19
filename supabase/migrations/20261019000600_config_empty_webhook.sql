create or replace function public.save_microsaas_config(
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
  values (p_id, nullif(p_webhook, ''), p_environment, p_mask)
  on conflict (microsaas_id) do update set webhook_url = excluded.webhook_url,
    environment = excluded.environment,
    api_key_mask = coalesce(excluded.api_key_mask, public.microsaas_config.api_key_mask), updated_at = now();
  if p_ciphertext is not null then
    insert into private.microsaas_secrets values (p_id, p_ciphertext)
    on conflict (microsaas_id) do update set api_key_encrypted = excluded.api_key_encrypted;
  end if;
end $$;
