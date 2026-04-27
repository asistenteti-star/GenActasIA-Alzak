import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth-server";

const VALID_PROVIDERS = ["gemini", "claude"] as const;
const GEMINI_RE = /^gemini-[\w.\-]+$/;
const CLAUDE_RE = /^claude-[\w.\-]+$/;

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: { provider?: string; gemini_model?: string; claude_model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const updates: Record<string, string | Date> = {};

  if (body.provider !== undefined) {
    if (!VALID_PROVIDERS.includes(body.provider as (typeof VALID_PROVIDERS)[number])) {
      return NextResponse.json({ error: "provider inválido" }, { status: 400 });
    }
    updates.provider = body.provider;
  }
  if (body.gemini_model !== undefined) {
    if (!GEMINI_RE.test(body.gemini_model)) {
      return NextResponse.json({ error: "gemini_model inválido" }, { status: 400 });
    }
    updates.gemini_model = body.gemini_model;
  }
  if (body.claude_model !== undefined) {
    if (!CLAUDE_RE.test(body.claude_model)) {
      return NextResponse.json({ error: "claude_model inválido" }, { status: 400 });
    }
    updates.claude_model = body.claude_model;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  updates.updated_by = profile.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_config")
    .update(updates)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}
