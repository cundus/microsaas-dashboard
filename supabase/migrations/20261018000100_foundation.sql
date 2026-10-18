-- Dashboard foundation. No application user is automatically made an admin.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.admin_roles (
  id text primary key check (id in ('super_admin', 'operator_admin', 'finance_admin')),
  name text not null unique
);
insert into public.admin_roles values
  ('super_admin', 'Super Admin'), ('operator_admin', 'Operator Admin'), ('finance_admin', 'Finance Admin');

create table public.admin_users (
  id uuid primary key references auth.users(id) on delete restrict,
  role_id text not null references public.admin_roles(id),
  name text not null check (length(trim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.microsaas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  url text not null check (url ~ '^https?://'),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_assignments (
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  microsaas_id uuid not null references public.microsaas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_id, microsaas_id)
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  external_id text not null,
  email text not null check (email like '%_@_%._%'),
  name text not null,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'banned', 'trial', 'deleted')),
  last_login_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (microsaas_id, external_id),
  unique (id, microsaas_id),
  check ((status = 'deleted') = (deleted_at is not null))
);
create index users_scope_created_idx on public.users (microsaas_id, created_at desc);
create index users_email_idx on public.users (lower(email));

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(14,2) not null check (price >= 0),
  currency text not null default 'IDR' check (currency ~ '^[A-Z]{3}$'),
  interval text not null check (interval in ('monthly', 'yearly')),
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  trial_days integer not null default 0 check (trial_days >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- A plan can be assigned to several products (FR-52).
create table public.plan_microsaas (
  plan_id uuid not null references public.plans(id) on delete restrict,
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  primary key (plan_id, microsaas_id)
);
create index plan_microsaas_scope_idx on public.plan_microsaas (microsaas_id);

create table public.payment_gateways (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  provider text not null check (provider in ('stripe', 'midtrans', 'other')),
  name text not null,
  environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (microsaas_id, provider, environment),
  unique (id, microsaas_id)
);
-- Secrets never live alongside metadata readable by Finance or in the Data API.
-- Store authenticated ciphertext only; encryption/decryption belongs to payment actions.
create table private.payment_gateway_secrets (
  gateway_id uuid primary key references public.payment_gateways(id) on delete cascade,
  credentials_encrypted text not null check (length(credentials_encrypted) > 0),
  updated_at timestamptz not null default now()
);
alter table private.payment_gateway_secrets enable row level security;
revoke all on private.payment_gateway_secrets from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.payment_gateway_secrets to service_role;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  user_id uuid not null,
  plan_id uuid not null,
  external_id text,
  status text not null check (status in ('active', 'trial', 'canceled', 'past_due', 'expired', 'complimentary')),
  billing_interval text not null check (billing_interval in ('monthly', 'yearly')),
  price numeric(14,2) not null check (price >= 0),
  currency text not null default 'IDR' check (currency ~ '^[A-Z]{3}$'),
  payment_method text,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, microsaas_id) references public.users(id, microsaas_id) on delete restrict,
  foreign key (plan_id, microsaas_id) references public.plan_microsaas(plan_id, microsaas_id) on delete restrict,
  unique (id, microsaas_id, user_id),
  unique (microsaas_id, external_id),
  check (current_period_end > current_period_start)
);
create index subscriptions_scope_status_idx on public.subscriptions (microsaas_id, status);
create index subscriptions_user_idx on public.subscriptions (user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  user_id uuid not null,
  subscription_id uuid,
  gateway_id uuid,
  external_id text,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'IDR' check (currency ~ '^[A-Z]{3}$'),
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (user_id, microsaas_id) references public.users(id, microsaas_id) on delete restrict,
  foreign key (subscription_id, microsaas_id, user_id) references public.subscriptions(id, microsaas_id, user_id) on delete restrict,
  foreign key (gateway_id, microsaas_id) references public.payment_gateways(id, microsaas_id) on delete restrict,
  unique (microsaas_id, gateway_id, external_id),
  unique (id, microsaas_id, user_id)
);
create index transactions_scope_created_idx on public.transactions (microsaas_id, created_at desc);
create index transactions_user_idx on public.transactions (user_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  user_id uuid not null,
  transaction_id uuid,
  number text not null unique,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'IDR' check (currency ~ '^[A-Z]{3}$'),
  status text not null check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (user_id, microsaas_id) references public.users(id, microsaas_id) on delete restrict,
  foreign key (transaction_id, microsaas_id, user_id) references public.transactions(id, microsaas_id, user_id) on delete restrict
);
create index invoices_scope_created_idx on public.invoices (microsaas_id, created_at desc);
create index invoices_user_idx on public.invoices (user_id);

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  code text not null check (code = upper(code) and length(trim(code)) > 0),
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(14,2) not null check (discount_value > 0),
  currency text check (currency ~ '^[A-Z]{3}$'),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  usage_limit integer check (usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (microsaas_id, code),
  check (discount_type <> 'percentage' or discount_value <= 100),
  check ((discount_type = 'fixed') = (currency is not null)),
  check (expires_at is null or expires_at > starts_at),
  check (usage_limit is null or usage_count <= usage_limit)
);

create table public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  endpoint text not null default '/',
  uptime_percent numeric(5,2) not null check (uptime_percent between 0 and 100),
  response_time_p50_ms numeric(12,2) check (response_time_p50_ms >= 0),
  response_time_p90_ms numeric(12,2) check (response_time_p90_ms >= response_time_p50_ms),
  response_time_p99_ms numeric(12,2) check (response_time_p99_ms >= response_time_p90_ms),
  request_count bigint not null default 0 check (request_count >= 0),
  error_count bigint not null default 0 check (error_count between 0 and request_count),
  active_users integer not null default 0 check (active_users >= 0),
  unique (microsaas_id, endpoint, recorded_at)
);
create index performance_metrics_scope_time_idx on public.performance_metrics (microsaas_id, recorded_at desc);

create table public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  name text not null,
  metric text not null check (metric in ('uptime_percent', 'response_time_p99_ms', 'error_rate', 'active_users')),
  operator text not null check (operator in ('gt', 'gte', 'lt', 'lte')),
  threshold numeric not null check (threshold >= 0),
  channel text not null check (channel in ('email', 'slack', 'in_app')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, microsaas_id)
);
-- Slack webhooks/tokens are secrets and must not be stored in alert metadata.
create table public.alert_logs (
  id uuid primary key default gen_random_uuid(),
  microsaas_id uuid not null references public.microsaas(id) on delete restrict,
  rule_id uuid not null,
  value numeric not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  message text not null,
  triggered_at timestamptz not null default now(),
  sent_at timestamptz,
  foreign key (rule_id, microsaas_id) references public.alert_rules(id, microsaas_id) on delete restrict
);
create index alert_logs_scope_time_idx on public.alert_logs (microsaas_id, triggered_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_users(id) on delete restrict,
  microsaas_id uuid references public.microsaas(id) on delete restrict,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_scope_created_idx on public.audit_logs (microsaas_id, created_at desc);
create index admin_users_role_idx on public.admin_users (role_id);
create index admin_assignments_scope_idx on public.admin_assignments (microsaas_id);

-- SECURITY DEFINER helpers avoid recursive RLS and trust the DB role, never JWT user_metadata.
create function private.admin_role() returns text
language sql stable security definer set search_path = '' as $$
  select role_id from public.admin_users where id = (select auth.uid()) and is_active;
$$;
create function private.assigned_to(product_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.admin_role() = 'operator_admin' and exists (
    select 1 from public.admin_assignments where admin_id = (select auth.uid()) and microsaas_id = product_id
  );
$$;
create function private.can_read_plan(target_plan_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.plan_microsaas where plan_id = target_plan_id and private.assigned_to(microsaas_id));
$$;
revoke all on function private.admin_role(), private.assigned_to(uuid), private.can_read_plan(uuid) from public;
grant execute on function private.admin_role(), private.assigned_to(uuid), private.can_read_plan(uuid) to authenticated, service_role;

do $$
declare tbl text;
begin
  foreach tbl in array array['admin_roles','admin_users','admin_assignments','microsaas','users','plans','plan_microsaas','payment_gateways','subscriptions','transactions','invoices','promo_codes','performance_metrics','alert_rules','alert_logs','audit_logs'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on public.%I from public, anon, authenticated', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', tbl);
    if tbl <> 'audit_logs' then
      execute format('create policy super_admin_all on public.%I for all to authenticated using ((select private.admin_role()) = ''super_admin'') with check ((select private.admin_role()) = ''super_admin'')', tbl);
    end if;
  end loop;
end $$;

create policy admin_self_read on public.admin_users for select to authenticated using (id = (select auth.uid()) and is_active);
create policy roles_read on public.admin_roles for select to authenticated using ((select private.admin_role()) is not null);
create policy assignments_self_read on public.admin_assignments for select to authenticated using (admin_id = (select auth.uid()) and (select private.admin_role()) is not null);
create policy operator_product_read on public.microsaas for select to authenticated using (private.assigned_to(id));
create policy finance_product_read on public.microsaas for select to authenticated using ((select private.admin_role()) = 'finance_admin');
create policy operator_plan_read on public.plans for select to authenticated using (private.can_read_plan(id));
create policy finance_plan_read on public.plans for select to authenticated using ((select private.admin_role()) = 'finance_admin');

do $$
declare tbl text;
begin
  foreach tbl in array array['users','plan_microsaas','subscriptions','transactions','invoices','performance_metrics','alert_rules','alert_logs','promo_codes'] loop
    execute format('create policy operator_scope_read on public.%I for select to authenticated using (private.assigned_to(microsaas_id))', tbl);
  end loop;
  foreach tbl in array array['plan_microsaas','subscriptions','transactions','invoices','payment_gateways'] loop
    execute format('create policy finance_read on public.%I for select to authenticated using ((select private.admin_role()) = ''finance_admin'')', tbl);
  end loop;
end $$;
-- Operator support mutations only. Registries, billing configuration, and finance writes stay Super Admin-only.
create policy operator_user_update on public.users for update to authenticated
  using (private.assigned_to(microsaas_id)) with check (private.assigned_to(microsaas_id));
create policy operator_subscription_update on public.subscriptions for update to authenticated
  using (private.assigned_to(microsaas_id)) with check (private.assigned_to(microsaas_id));

-- Even an operator assigned to two products cannot move an existing record between products.
create function private.protect_operator_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if private.admin_role() = 'operator_admin' and (
    new.id <> old.id or new.microsaas_id <> old.microsaas_id
    or (tg_table_name = 'users' and (to_jsonb(new)->'external_id' <> to_jsonb(old)->'external_id'))
    or (tg_table_name = 'subscriptions' and (to_jsonb(new)->'user_id' <> to_jsonb(old)->'user_id'))
  ) then
    raise exception 'Operator cannot change record identity or product scope' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger protect_user_identity before update on public.users for each row execute function private.protect_operator_identity();
create trigger protect_subscription_identity before update on public.subscriptions for each row execute function private.protect_operator_identity();

create policy audit_super_read on public.audit_logs for select to authenticated using ((select private.admin_role()) = 'super_admin');
create policy audit_operator_read on public.audit_logs for select to authenticated using (private.assigned_to(microsaas_id));
revoke insert, update, delete on public.audit_logs from authenticated;
revoke update, delete, truncate on public.audit_logs from service_role;
create function private.reject_audit_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Audit logs are append-only' using errcode = '42501';
end $$;
create trigger audit_append_only before update or delete or truncate on public.audit_logs
  for each statement execute function private.reject_audit_mutation();

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create function private.audit_admin_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  row_data jsonb;
  product_id uuid;
begin
  if auth.uid() is null then return null; end if;
  row_data = case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  -- Registry deletions keep the product ID in metadata, avoiding a dangling FK.
  product_id = nullif(row_data->>'microsaas_id', '')::uuid;
  insert into public.audit_logs (admin_id, microsaas_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), product_id, lower(tg_op), tg_table_name,
    coalesce(row_data->>'id', row_data->>'admin_id', row_data->>'plan_id'),
    jsonb_build_object('before', case when tg_op <> 'INSERT' then to_jsonb(old) end,
                       'after', case when tg_op <> 'DELETE' then to_jsonb(new) end));
  return null;
end $$;
revoke all on function private.audit_admin_change(), private.set_updated_at(), private.reject_audit_mutation(), private.protect_operator_identity() from public;

do $$
declare tbl text;
begin
  foreach tbl in array array['admin_users','microsaas','users','plans','payment_gateways','subscriptions','promo_codes','alert_rules'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()', tbl);
  end loop;
  foreach tbl in array array['admin_roles','admin_users','admin_assignments','microsaas','users','plans','plan_microsaas','payment_gateways','subscriptions','transactions','invoices','promo_codes','alert_rules'] loop
    execute format('create trigger audit_admin_change after insert or update or delete on public.%I for each row execute function private.audit_admin_change()', tbl);
  end loop;
end $$;
