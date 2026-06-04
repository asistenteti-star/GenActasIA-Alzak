import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service-role (salta RLS). SOLO para uso en servidor en rutas
 * que necesitan leer secretos (app_secrets) que el usuario normal no puede ver.
 *
 * Devuelve null si SUPABASE_SERVICE_ROLE_KEY no está configurada — los
 * llamadores deben tener un fallback (p.ej. variable de entorno).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
