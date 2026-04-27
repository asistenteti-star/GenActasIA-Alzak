import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/utils";

const MODEL_RE = /^gemini-[\w.\-]+$/;

// Pricing aprox por 1M tokens (USD) — actualizar si cambia
const GEMINI_PRICES: Record<string, { in: number; out: number }> = {
  "gemini-2.5-flash": { in: 0.075, out: 0.3 },
  "gemini-2.0-flash": { in: 0.075, out: 0.3 },
  "gemini-2.5-pro":   { in: 1.25,  out: 5.0 },
};

function estimateCost(model: string, tokensIn?: number, tokensOut?: number): number | null {
  if (tokensIn == null || tokensOut == null) return null;
  const p = GEMINI_PRICES[model];
  if (!p) return null;
  return (tokensIn * p.in + tokensOut * p.out) / 1_000_000;
}

function detectAudio(body: unknown): boolean {
  try {
    const contents = (body as { contents?: Array<{ parts?: Array<{ inline_data?: { mime_type?: string } }> }> }).contents;
    if (!Array.isArray(contents)) return false;
    for (const c of contents) {
      for (const p of c.parts ?? []) {
        const mime = p.inline_data?.mime_type;
        if (mime && mime.startsWith("audio/")) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const t0 = Date.now();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const email = claims?.email as string | undefined;
  const userId = claims?.sub as string | undefined;

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "JSON inválido" } },
      { status: 400 },
    );
  }

  const hasAudio = detectAudio(body);
  const upstream = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(key)}`;

  let httpStatus = 502;
  let tokensIn: number | undefined;
  let tokensOut: number | undefined;
  let errorMessage: string | undefined;
  let responsePayload: unknown = { error: { message: "Proxy error" } };

  try {
    const r = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    httpStatus = r.status;
    responsePayload = await r.json();
    if (!r.ok) {
      const msg = (responsePayload as { error?: { message?: string } })?.error?.message;
      errorMessage = msg ?? `HTTP ${r.status}`;
    } else {
      const usage = (responsePayload as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }).usageMetadata;
      tokensIn = usage?.promptTokenCount;
      tokensOut = usage?.candidatesTokenCount;
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Unknown error";
    responsePayload = { error: { message: "Proxy error: " + errorMessage } };
  }

  const latencyMs = Date.now() - t0;
  const status = errorMessage ? "error" : "success";

  // Log usage event (no bloqueante: si falla, no romper la respuesta al cliente)
  if (userId) {
    void supabase.from("usage_events").insert({
      user_id: userId,
      user_email: email,
      provider: "gemini",
      model,
      tokens_in: tokensIn ?? null,
      tokens_out: tokensOut ?? null,
      estimated_cost_usd: estimateCost(model, tokensIn, tokensOut),
      latency_ms: latencyMs,
      status,
      error_message: errorMessage ?? null,
      http_status: httpStatus,
      has_audio: hasAudio,
    });
  }

  return NextResponse.json(responsePayload, { status: httpStatus });
}
