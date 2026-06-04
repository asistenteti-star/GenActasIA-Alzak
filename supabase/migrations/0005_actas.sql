-- ──────────────────────────────────────────────────────────────────────
-- 0005_actas.sql — historial/almacenamiento de actas generadas. Idempotente.
--
-- Cada usuario ve y guarda SOLO sus actas; el admin ve todas (vía is_admin()).
-- Requiere 0003 (is_admin) y 0001 (touch_updated_at).
-- ──────────────────────────────────────────────────────────────────────

create table if not exists public.actas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete set null,
  user_email    text,
  entity        text not null check (entity in ('FOUNDATION', 'CONSULTING')),
  razon_social  text,
  num_acta      text,
  nombre        text,
  fecha         text,
  data          jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists actas_user_id_idx    on public.actas (user_id);
create index if not exists actas_created_at_idx  on public.actas (created_at desc);

alter table public.actas enable row level security;

drop policy if exists "actas_self_read"   on public.actas;
drop policy if exists "actas_admin_read"   on public.actas;
drop policy if exists "actas_self_insert"  on public.actas;
drop policy if exists "actas_self_update"  on public.actas;
drop policy if exists "actas_self_delete"  on public.actas;

-- Cada usuario lee las suyas; el admin lee todas.
create policy "actas_self_read"  on public.actas for select using (auth.uid() = user_id);
create policy "actas_admin_read" on public.actas for select using (public.is_admin());
-- Inserta/actualiza solo las propias.
create policy "actas_self_insert" on public.actas for insert with check (auth.uid() = user_id);
create policy "actas_self_update" on public.actas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Borra las propias; el admin puede borrar cualquiera.
create policy "actas_self_delete" on public.actas for delete using (auth.uid() = user_id or public.is_admin());

drop trigger if exists actas_touch_updated_at on public.actas;
create trigger actas_touch_updated_at
  before update on public.actas
  for each row execute function public.touch_updated_at();
