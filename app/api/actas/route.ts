import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/utils";

const RAZON: Record<string, string> = {
  FOUNDATION: "ALZAK Foundation",
  CONSULTING: "ALZAK Consulting & Research",
};

async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = claims?.email as string | undefined;
  const userId = claims?.sub as string | undefined;
  if (!claims || !isAllowedEmail(email) || !userId) return null;
  return { supabase, email, userId };
}

// Listar actas: propias (o todas si admin, vía RLS). Solo metadatos.
export async function GET() {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await u.supabase
    .from("actas")
    .select("id, user_email, entity, razon_social, num_acta, nombre, fecha, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actas: data ?? [] });
}

// Guardar una nueva acta.
export async function POST(request: Request) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: { entity?: string; data?: unknown; num_acta?: string; nombre?: string; fecha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const entity = body.entity === "CONSULTING" ? "CONSULTING" : body.entity === "FOUNDATION" ? "FOUNDATION" : null;
  if (!entity) return NextResponse.json({ error: "Razón social inválida" }, { status: 400 });
  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "Falta el contenido del acta" }, { status: 400 });
  }

  const { data, error } = await u.supabase
    .from("actas")
    .insert({
      user_id: u.userId,
      user_email: u.email,
      entity,
      razon_social: RAZON[entity],
      num_acta: (body.num_acta ?? "").slice(0, 120) || null,
      nombre: (body.nombre ?? "").slice(0, 300) || null,
      fecha: (body.fecha ?? "").slice(0, 60) || null,
      data: body.data,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, ok: true });
}
