-- ──────────────────────────────────────────────────────────────────────
-- 0001_init.sql — esquema inicial Actas ALZAK
-- Idempotente: se puede correr múltiples veces sin error.
-- ──────────────────────────────────────────────────────────────────────

-- Constantes (vía función inmutable, ya que Postgres no tiene constantes globales)
create or replace function public.allowed_domain() returns text
  language sql immutable parallel safe as $$ select 'alzakfoundation.org' $$;

create or replace function public.admin_email() returns text
  language sql immutable parallel safe as $$ select 'asistenteti@alzakfoundation.org' $$;

-- ──────────────────────────────────────────────────────────────────────
-- Tabla profiles: 1 fila por usuario, espejo de auth.users
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx  on public.profiles (role);

-- ──────────────────────────────────────────────────────────────────────
-- Allowlist trigger: rechaza inserts en auth.users cuyo email no sea
-- @alzakfoundation.org. Capa de defensa en profundidad por si algún día
-- se cambia el OAuth Client de Internal a External en Google Cloud.
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.enforce_email_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email is null
     or lower(split_part(new.email, '@', 2)) <> public.allowed_domain() then
    raise exception 'email domain not allowed: %', new.email
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_email_allowlist_trg on auth.users;
create trigger enforce_email_allowlist_trg
  before insert on auth.users
  for each row execute function public.enforce_email_allowlist();

-- ──────────────────────────────────────────────────────────────────────
-- handle_new_user trigger: copia auth.users → public.profiles, asigna rol
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    case when lower(new.email) = lower(public.admin_email()) then 'admin' else 'user' end
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        role       = case when lower(excluded.email) = lower(public.admin_email())
                          then 'admin' else public.profiles.role end,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists handle_new_user_trg on auth.users;
create trigger handle_new_user_trg
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────────────
-- RLS en profiles
-- ──────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read"  on public.profiles;
drop policy if exists "profiles_admin_read" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_admin_update_role" on public.profiles;

-- Cada usuario lee su propio perfil
create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

-- Admin lee todos los perfiles
create policy "profiles_admin_read"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Cada usuario actualiza su propio perfil (no su rol)
create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- Admin puede cambiar role de cualquiera
create policy "profiles_admin_update_role"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ──────────────────────────────────────────────────────────────────────
-- Backfill: por si ya hay usuarios creados antes de aplicar esta migration
-- ──────────────────────────────────────────────────────────────────────
insert into public.profiles (id, email, full_name, avatar_url, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.raw_user_meta_data->>'avatar_url',
  case when lower(u.email) = lower(public.admin_email()) then 'admin' else 'user' end
from auth.users u
where u.email is not null
on conflict (id) do nothing;
