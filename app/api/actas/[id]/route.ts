import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/utils";

const RAZON: Record<string, string> = {
  FOUNDATION: "ALZAK Foundation",
  CONSULTING: "ALZAK Consulting & Research",
};

async function auth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!data?.claims || !isAllowedEmail(email)) return null;
  return supabase;
}

// Devuelve una acta completa (RLS garantiza que solo el dueño o un admin la vean).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await auth();
  if (!supabase) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("actas")
    .select("id, entity, razon_social, num_acta, nombre, fecha, data, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ acta: data });
}

// Actualiza una acta existente (RLS: solo el dueño).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await auth();
  if (!supabase) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: { entity?: string; data?: unknown; num_acta?: string; nombre?: string; fecha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "Falta el contenido del acta" }, { status: 400 });
  }
  const entity = body.entity === "CONSULTING" ? "CONSULTING" : body.entity === "FOUNDATION" ? "FOUNDATION" : null;

  const update: Record<string, unknown> = {
    data: body.data,
    num_acta: (body.num_acta ?? "").slice(0, 120) || null,
    nombre: (body.nombre ?? "").slice(0, 300) || null,
    fecha: (body.fecha ?? "").slice(0, 60) || null,
  };
  if (entity) {
    update.entity = entity;
    update.razon_social = RAZON[entity];
  }

  const { data, error } = await supabase.from("actas").update(update).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ id: data.id, ok: true });
}

// Borra una acta (RLS: el dueño o un admin).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await auth();
  if (!supabase) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { error } = await supabase.from("actas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
