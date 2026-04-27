-- ──────────────────────────────────────────────────────────────────────
-- 0002_app_config_and_usage.sql — config global + telemetría de uso
-- Idempotente.
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- app_config: singleton (id=1) con la config global de la app
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.app_config (
  id            int  primary key default 1 check (id = 1),
  provider      text not null default 'gemini' check (provider in ('gemini', 'claude')),
  gemini_model  text not null default 'gemini-2.5-flash',
  claude_model  text not null default 'claude-sonnet-4-6',
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id)
);

-- Asegurar fila singleton
insert into public.app_config (id) values (1) on conflict (id) do nothing;

-- updated_at trigger (reusa la función existente de 0001)
drop trigger if exists app_config_touch_updated_at on public.app_config;
create trigger app_config_touch_updated_at
  before update on public.app_config
  for each row execute function public.touch_updated_at();

-- RLS: cualquier usuario autenticado puede LEER (para que /api/ai sepa qué provider usar);
-- solo admin puede ESCRIBIR.
alter table public.app_config enable row level security;

drop policy if exists "app_config_authenticated_read"  on public.app_config;
drop policy if exists "app_config_admin_update"        on public.app_config;

create policy "app_config_authenticated_read"
  on public.app_config for select
  using (auth.uid() is not null);

create policy "app_config_admin_update"
  on public.app_config for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ──────────────────────────────────────────────────────────────────────
-- usage_events: 1 fila por llamada al proxy AI (éxito o error)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.usage_events (
  id                  bigserial primary key,
  user_id             uuid not null references auth.users(id) on delete set null,
  user_email          text,
  provider            text not null,                                 -- 'gemini' | 'claude'
  model               text,                                          -- 'gemini-2.5-flash' etc
  tokens_in           int,
  tokens_out          int,
  estimated_cost_usd  numeric(12, 6),
  latency_ms          int,
  status              text not null check (status in ('success', 'error')),
  error_message       text,
  http_status         int,
  has_audio           boolean default false,
  created_at          timestamptz not null default now()
);

create index if not exists usage_events_user_id_idx     on public.usage_events (user_id);
create index if not exists usage_events_created_at_idx  on public.usage_events (created_at desc);
create index if not exists usage_events_provider_idx    on public.usage_events (provider);
create index if not exists usage_events_status_idx      on public.usage_events (status);

-- RLS
alter table public.usage_events enable row level security;

drop policy if exists "usage_events_self_read"      on public.usage_events;
drop policy if exists "usage_events_admin_read"     on public.usage_events;
drop policy if exists "usage_events_self_insert"    on public.usage_events;

-- Cada usuario lee sus propios eventos
create policy "usage_events_self_read"
  on public.usage_events for select
  using (auth.uid() = user_id);

-- Admin lee todos
create policy "usage_events_admin_read"
  on public.usage_events for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Cada usuario inserta solo eventos suyos
create policy "usage_events_self_insert"
  on public.usage_events for insert
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────
-- last_login: agregar columna a profiles para tracking
-- ──────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists last_sign_in_at timestamptz;

-- Trigger en auth.users updates para reflejar last_sign_in_at en profiles
create or replace function public.sync_last_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.profiles
       set last_sign_in_at = new.last_sign_in_at
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_last_sign_in_trg on auth.users;
create trigger sync_last_sign_in_trg
  after update of last_sign_in_at on auth.users
  for each row execute function public.sync_last_sign_in();

-- Backfill last_sign_in_at desde auth.users
update public.profiles p
   set last_sign_in_at = u.last_sign_in_at
  from auth.users u
 where p.id = u.id and p.last_sign_in_at is null;
