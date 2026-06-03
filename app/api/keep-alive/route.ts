import { NextResponse } from "next/server";

/**
 * Keep-alive de Supabase.
 *
 * El plan Free de Supabase pausa el proyecto tras ~7 días sin actividad en la
 * base de datos. Este endpoint hace una consulta ligera contra Postgres (vía
 * PostgREST) para mantenerlo activo. Lo dispara un Vercel Cron diario
 * (ver vercel.json).
 */
export async function GET(request: Request) {
  // Vercel envía `Authorization: Bearer <CRON_SECRET>` a las rutas de cron
  // cuando la env var CRON_SECRET existe. Rechaza llamadas no autorizadas.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
  }

  try {
    // Petición al endpoint de salud de Supabase. Una llamada a la API cuenta
    // como actividad del proyecto y evita la pausa automática del plan Free.
    // No depende de ninguna tabla concreta, así que es robusto ante el estado
    // del esquema.
    const res = await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      headers: { apikey: key },
      cache: "no-store",
    });

    return NextResponse.json(
      { ok: res.ok, status: res.status, pingedAt: new Date().toISOString() },
      { status: res.ok ? 200 : 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "fetch_failed" },
      { status: 502 },
    );
  }
}
