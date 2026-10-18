-- Synthetic development data only. Never run automatically against a production project.
-- No auth accounts, passwords, or admin access are created by this seed.
begin;

insert into public.microsaas (id, name, slug, description, url)
select ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  name, slug, 'Synthetic development product', 'https://' || slug || '.example.com'
from (values (1, 'InvoiceFlow', 'invoiceflow'), (2, 'FormPilot', 'formpilot'), (3, 'LinkMetrics', 'linkmetrics')) as products(n, name, slug)
on conflict (id) do nothing;

insert into public.plans (id, name, price, interval, features, trial_days, status)
values
  ('20000000-0000-4000-8000-000000000001', 'Starter', 99000, 'monthly', '["Core features", "Email support"]', 14, 'published'),
  ('20000000-0000-4000-8000-000000000002', 'Pro', 249000, 'monthly', '["Unlimited projects", "Priority support"]', 14, 'published'),
  ('20000000-0000-4000-8000-000000000003', 'Pro Annual', 2490000, 'yearly', '["Unlimited projects", "Priority support"]', 14, 'published')
on conflict (id) do nothing;

insert into public.plan_microsaas (plan_id, microsaas_id)
select p.id, m.id from public.plans p cross join public.microsaas m
where p.id::text like '20000000-0000-4000-8000-%' and m.id::text like '10000000-0000-4000-8000-%'
on conflict do nothing;

insert into public.users (id, microsaas_id, external_id, name, email, status, created_at, last_login_at)
select ('30000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('10000000-0000-4000-8000-' || lpad(((n - 1) % 3 + 1)::text, 12, '0'))::uuid,
  'demo-user-' || n, 'Demo User ' || n, 'user' || n || '@example.com',
  case when n % 10 = 0 then 'banned' when n % 5 = 0 then 'trial' else 'active' end,
  timestamptz '2026-09-01 00:00:00+00' + (n || ' hours')::interval,
  timestamptz '2026-10-17 00:00:00+00' + (n || ' minutes')::interval
from generate_series(1, 50) n
on conflict (id) do nothing;

insert into public.payment_gateways (id, microsaas_id, provider, name, environment)
select ('40000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'midtrans', 'Demo Midtrans', 'sandbox'
from generate_series(1, 3) n
on conflict (id) do nothing;

insert into public.subscriptions (id, microsaas_id, user_id, plan_id, external_id, status, billing_interval, price, currency, current_period_start, current_period_end, trial_ends_at, canceled_at)
select ('50000000-0000-4000-8000-' || right(u.id::text, 12))::uuid,
  u.microsaas_id, u.id, p.id, 'demo-sub-' || right(u.id::text, 12),
  case when u.status = 'trial' then 'trial' when u.status = 'banned' then 'canceled' when right(u.id::text, 12)::integer % 7 = 0 then 'past_due' else 'active' end,
  p.interval, p.price, p.currency, '2026-10-01 00:00:00+00',
  case when p.interval = 'yearly' then timestamptz '2027-10-01 00:00:00+00' else timestamptz '2026-11-01 00:00:00+00' end,
  case when u.status = 'trial' then timestamptz '2026-10-25 00:00:00+00' end,
  case when u.status = 'banned' then timestamptz '2026-10-15 00:00:00+00' end
from public.users u join public.plans p on p.id = ('20000000-0000-4000-8000-' || lpad(((right(u.id::text, 12)::integer - 1) % 3 + 1)::text, 12, '0'))::uuid
where u.id::text like '30000000-0000-4000-8000-%'
on conflict (id) do nothing;

insert into public.transactions (id, microsaas_id, user_id, subscription_id, gateway_id, external_id, amount, status, payment_method, paid_at, created_at)
select ('60000000-0000-4000-8000-' || right(s.id::text, 12))::uuid,
  s.microsaas_id, s.user_id, s.id,
  ('40000000-0000-4000-8000-' || right(s.microsaas_id::text, 12))::uuid,
  'demo-payment-' || right(s.id::text, 12), s.price,
  case when s.status = 'past_due' then 'failed' when s.status = 'trial' then 'pending' else 'paid' end,
  'bank_transfer', case when s.status not in ('past_due', 'trial') then timestamptz '2026-10-01 00:00:00+00' end,
  '2026-10-01 00:00:00+00'
from public.subscriptions s where s.id::text like '50000000-0000-4000-8000-%'
on conflict (id) do nothing;

insert into public.invoices (id, microsaas_id, user_id, transaction_id, number, amount, status, due_at, paid_at, created_at)
select ('70000000-0000-4000-8000-' || right(t.id::text, 12))::uuid,
  t.microsaas_id, t.user_id, t.id, 'DEMO-202610-' || right(t.id::text, 12), t.amount,
  case when t.status = 'paid' then 'paid' else 'open' end,
  '2026-10-08 00:00:00+00', t.paid_at, t.created_at
from public.transactions t where t.id::text like '60000000-0000-4000-8000-%'
on conflict (id) do nothing;

insert into public.promo_codes (id, microsaas_id, code, discount_type, discount_value, starts_at, expires_at, usage_limit)
select ('80000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'WELCOME20', 'percentage', 20, '2026-10-01 00:00:00+00', '2026-12-31 00:00:00+00', 100
from generate_series(1, 3) n on conflict (id) do nothing;

insert into public.performance_metrics (microsaas_id, recorded_at, uptime_percent, response_time_p50_ms, response_time_p90_ms, response_time_p99_ms, request_count, error_count, active_users)
select m.id, timestamptz '2026-10-18 00:00:00+00' - (n || ' days')::interval,
  case when n = 5 then 98.50 else 99.99 end, 80 + n, 140 + n, 220 + n, 10000, 5 + n, 20 + n
from public.microsaas m cross join generate_series(0, 29) n
where m.id::text like '10000000-0000-4000-8000-%'
on conflict (microsaas_id, endpoint, recorded_at) do nothing;

insert into public.alert_rules (id, microsaas_id, name, metric, operator, threshold, channel)
select ('90000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'Low uptime', 'uptime_percent', 'lt', 99.5, 'in_app'
from generate_series(1, 3) n on conflict (id) do nothing;

insert into public.alert_logs (id, microsaas_id, rule_id, value, status, message, triggered_at, sent_at)
select ('a0000000-0000-4000-8000-' || right(id::text, 12))::uuid,
  microsaas_id, id, 98.50, 'sent', 'Synthetic uptime alert', '2026-10-13 00:00:00+00', '2026-10-13 00:00:01+00'
from public.alert_rules where id::text like '90000000-0000-4000-8000-%'
on conflict (id) do nothing;

insert into public.audit_logs (id, action, resource_type, resource_id, metadata)
values ('b0000000-0000-4000-8000-000000000001', 'seed', 'development', 'story-003', '{"synthetic": true}')
on conflict (id) do nothing;

commit;
