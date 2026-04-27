import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/utils";

const MODEL_RE = /^gemini-[\w.\-]+$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = claims?.email as string | undefined;

  if (!claims || !isAllowedEmail(email)) {
    return NextResponse.json(
      { error: { message: "No autenticado" } },
      { status: 401 },
    );
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: { message: "GEMINI_API_KEY no configurada en el servidor" } },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const model = String(searchParams.get("model") ?? "gemini-2.5-flash");
  if (!MODEL_RE.test(model)) {
    return NextResponse.json(
      { error: { message: "Modelo inválido" } },
      { status: 400 },
    );
  }

  const upstream = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(key)}`;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "JSON inválido" } },
      { status: 400 },
    );
  }

  try {
    const r = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: { message: "Proxy error: " + message } },
      { status: 502 },
    );
  }
}
