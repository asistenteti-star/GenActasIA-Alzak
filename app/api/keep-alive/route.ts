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
    // Consulta REAL a Postgres (vía PostgREST). La pausa automática de Supabase
    // se mide por actividad de la BASE DE DATOS — un health check de auth NO
    // cuenta. Un SELECT contra una tabla sí ejecuta una query en Postgres
    // (aunque RLS devuelva 0 filas con la clave pública), que es lo que importa.
    const res = await fetch(`${url}/rest/v1/app_config?select=id&limit=1`, {
      method: "GET",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });

    return NextResponse.json(
      { ok: res.ok, status: res.status, query: "rest/app_config", pingedAt: new Date().toISOString() },
      { status: res.ok ? 200 : 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "fetch_failed" },
      { status: 502 },
    );
  }
}
