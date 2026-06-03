-- ──────────────────────────────────────────────────────────────────────
-- 0003_fix_rls_recursion.sql — corrige recursión infinita en políticas RLS
-- Idempotente.
--
-- Bug: las políticas de `profiles` (y las de admin en app_config/usage_events)
-- consultaban `public.profiles` DENTRO de una política sobre `public.profiles`,
-- lo que dispara "infinite recursion detected in policy" (Postgres 42P17) y
-- rompe CUALQUIER lectura de perfiles (getCurrentProfile, /api/me, panel admin).
--
-- Fix: helpers SECURITY DEFINER que leen profiles SALTÁNDOSE RLS, y reescribir
-- las políticas para usarlos en lugar de subconsultas recursivas.
--
-- ORDEN DE APLICACIÓN: aplicar 0001 y 0002 primero, luego este 0003.
-- ──────────────────────────────────────────────────────────────────────

-- ¿El usuario actual es admin? SECURITY DEFINER => no aplica RLS al leer
-- profiles, por lo que no hay recursión.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Rol del usuario actual (para validar que no se auto-modifique el rol).
create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ──────────────────────────────────────────────────────────────────────
-- profiles: reescribir políticas sin subconsultas recursivas
-- ──────────────────────────────────────────────────────────────────────
drop policy if exists "profiles_admin_read"        on public.profiles;
drop policy if exists "profiles_self_update"        on public.profiles;
drop policy if exists "profiles_admin_update_role"  on public.profiles;

create policy "profiles_admin_read"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.current_profile_role());

create policy "profiles_admin_update_role"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ──────────────────────────────────────────────────────────────────────
-- app_config / usage_events: usar el helper en las políticas de admin
-- (requiere que 0002 ya esté aplicado).
-- ──────────────────────────────────────────────────────────────────────
drop policy if exists "app_config_admin_update" on public.app_config;
create policy "app_config_admin_update"
  on public.app_config for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "usage_events_admin_read" on public.usage_events;
create policy "usage_events_admin_read"
  on public.usage_events for select
  using (public.is_admin());
