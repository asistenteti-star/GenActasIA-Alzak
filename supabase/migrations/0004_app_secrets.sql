-- ──────────────────────────────────────────────────────────────────────
-- 0004_app_secrets.sql — almacén de secretos configurables desde el admin
-- (p.ej. la API key de Claude). Idempotente.
--
-- Seguridad: SOLO admin puede leer/escribir vía REST. Los usuarios normales
-- NO tienen política de lectura, así que nunca reciben el valor. La ruta de
-- generación (que corre como usuario normal) lee la key con service-role,
-- que salta RLS — nunca con la clave pública.
--
-- Requiere 0003 (is_admin) y 0001 (touch_updated_at).
-- ──────────────────────────────────────────────────────────────────────

create table if not exists public.app_secrets (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

alter table public.app_secrets enable row level security;

-- Solo admin: lectura y escritura. Sin política para anon/authenticated normal
-- ⇒ los usuarios sin rol admin no pueden leer el valor por REST.
drop policy if exists "app_secrets_admin_all" on public.app_secrets;
create policy "app_secrets_admin_all"
  on public.app_secrets for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists app_secrets_touch_updated_at on public.app_secrets;
create trigger app_secrets_touch_updated_at
  before update on public.app_secrets
  for each row execute function public.touch_updated_at();
