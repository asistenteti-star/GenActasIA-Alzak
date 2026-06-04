import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/utils";

// Devuelve una acta completa (RLS garantiza que solo el dueño o un admin la vean).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cd } = await supabase.auth.getClaims();
  const email = cd?.claims?.email as string | undefined;
  if (!cd?.claims || !isAllowedEmail(email)) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("actas")
    .select("id, entity, razon_social, num_acta, nombre, fecha, data, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ acta: data });
}
