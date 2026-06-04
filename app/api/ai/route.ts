import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedEmail } from "@/lib/utils";

// Límite de body (~12 MB) para acotar costo/abuso con PDFs grandes en base64.
const MAX_BODY_BYTES = 12 * 1024 * 1024;

const GEMINI_RE = /^gemini-[\w.\-]+$/;
const CLAUDE_RE = /^claude-[\w.\-]+$/;
const GEMINI_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash"];

// Pricing aprox por 1M tokens (USD) — actualizar si cambia.
const PRICES: Record<string, { in: number; out: number }> = {
  "gemini-2.5-flash": { in: 0.075, out: 0.3 },
  "gemini-2.0-flash": { in: 0.075, out: 0.3 },
  "gemini-2.5-pro": { in: 1.25, out: 5.0 },
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
  "claude-haiku-4-5": { in: 1.0, out: 5.0 },
  "claude-opus-4-7": { in: 15.0, out: 75.0 },
};

function estimateCost(model: string, tin?: number, tout?: number): number | null {
  if (tin == null || tout == null) return null;
  const p = PRICES[model];
  if (!p) return null;
  return (tin * p.in + tout * p.out) / 1_000_000;
}

type Part = { text?: string; inline_data?: { mime_type?: string; data?: string } };
type GeminiBody = {
  system_instruction?: { parts?: { text?: string }[] };
  contents?: { role?: string; parts?: Part[] }[];
  generationConfig?: { temperature?: number; maxOutputTokens?: number };
};

function detectAudio(body: GeminiBody): boolean {
  for (const c of body.contents ?? []) {
    for (const p of c.parts ?? []) {
      if (p.inline_data?.mime_type?.startsWith("audio/")) return true;
    }
  }
  return false;
}

// Forma normalizada (= forma de Gemini) que el frontend ya sabe parsear.
function geminiShape(text: string, finishReason: string, tin?: number, tout?: number) {
  return {
    candidates: [{ content: { parts: [{ text }] }, finishReason }],
    usageMetadata: { promptTokenCount: tin, candidatesTokenCount: tout },
  };
}

async function callGemini(model: string, key: string, body: GeminiBody) {
  const models = [model, ...GEMINI_FALLBACKS.filter((m) => m !== model)];
  let last: { status: number; payload: unknown } = {
    status: 502,
    payload: { error: { message: "Sin respuesta de Gemini" } },
  };
  for (const m of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      m,
    )}:generateContent?key=${encodeURIComponent(key)}`;
    // En 2.5 el "thinking" consume del budget de salida; para extracción
    // estructurada lo desactivamos.
    const reqBody = m.startsWith("gemini-2.5")
      ? { ...body, generationConfig: { ...body.generationConfig, thinkingConfig: { thinkingBudget: 0 } } }
      : body;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
      const payload = await r.json();
      if (r.ok) {
        const usage = (payload as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }).usageMetadata;
        return { status: 200, payload, model: m, tin: usage?.promptTokenCount, tout: usage?.candidatesTokenCount };
      }
      last = { status: r.status, payload };
      // Solo reintentar con el siguiente modelo ante saturación.
      if (r.status !== 429 && r.status !== 503) break;
    } catch (e) {
      last = { status: 502, payload: { error: { message: e instanceof Error ? e.message : "fetch error" } } };
    }
  }
  return { ...last, model };
}

async function callClaude(model: string, key: string, body: GeminiBody) {
  const system = (body.system_instruction?.parts ?? []).map((p) => p.text ?? "").join("\n");
  const content: unknown[] = [];
  for (const c of body.contents ?? []) {
    for (const p of c.parts ?? []) {
      if (p.text) content.push({ type: "text", text: p.text });
      else if (p.inline_data?.data) {
        const mime = p.inline_data.mime_type ?? "";
        if (mime === "application/pdf") {
          content.push({ type: "document", source: { type: "base64", media_type: mime, data: p.inline_data.data } });
        } else if (mime.startsWith("image/")) {
          content.push({ type: "image", source: { type: "base64", media_type: mime, data: p.inline_data.data } });
        }
      }
    }
  }
  const maxTokens = Math.min(body.generationConfig?.maxOutputTokens ?? 8192, 16384);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: body.generationConfig?.temperature ?? 0.1,
        system,
        messages: [{ role: "user", content }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${r.status}`;
      return { status: r.status, payload: { error: { message: msg } }, model };
    }
    const text = ((data.content ?? []) as { type?: string; text?: string }[])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    const tin = data.usage?.input_tokens;
    const tout = data.usage?.output_tokens;
    const finish = data.stop_reason === "max_tokens" ? "MAX_TOKENS" : "STOP";
    return { status: 200, payload: geminiShape(text, finish, tin, tout), model, tin, tout };
  } catch (e) {
    return { status: 502, payload: { error: { message: e instanceof Error ? e.message : "Claude error" } }, model };
  }
}

export async function POST(request: Request) {
  const t0 = Date.now();
  const supabase = await createClient();
  const { data: cd } = await supabase.auth.getClaims();
  const claims = cd?.claims;
  const email = claims?.email as string | undefined;
  const userId = claims?.sub as string | undefined;

  if (!claims || !isAllowedEmail(email)) {
    return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: { message: "El archivo es demasiado grande (máx ~12 MB). Usa un documento más corto." } },
      { status: 413 },
    );
  }
  let body: GeminiBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: { message: "JSON inválido" } }, { status: 400 });
  }

  // Config global (proveedor + modelos). Default gemini si no hay fila.
  const { data: cfg } = await supabase
    .from("app_config")
    .select("provider, gemini_model, claude_model")
    .eq("id", 1)
    .single();

  let provider = cfg?.provider === "claude" ? "claude" : "gemini";
  const geminiModel = cfg?.gemini_model && GEMINI_RE.test(cfg.gemini_model) ? cfg.gemini_model : "gemini-2.5-flash";
  const claudeModel = cfg?.claude_model && CLAUDE_RE.test(cfg.claude_model) ? cfg.claude_model : "claude-sonnet-4-6";

  const hasAudio = detectAudio(body);

  // Resuelve la key de Claude: secreto en DB (vía service-role) o env var.
  let claudeKey = process.env.ANTHROPIC_API_KEY ?? null;
  const admin = createAdminClient();
  if (admin) {
    const { data: sec } = await admin
      .from("app_secrets")
      .select("value")
      .eq("key", "anthropic_api_key")
      .maybeSingle();
    if (sec?.value) claudeKey = sec.value;
  }

  // Claude no procesa audio, y necesita key. Si falta algo, cae a Gemini.
  if (provider === "claude" && (!claudeKey || hasAudio)) provider = "gemini";

  let result: { status: number; payload: unknown; model: string; tin?: number; tout?: number };
  if (provider === "claude" && claudeKey) {
    result = await callClaude(claudeModel, claudeKey, body);
  } else {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: { message: "GEMINI_API_KEY no configurada" } }, { status: 500 });
    }
    result = await callGemini(geminiModel, geminiKey, body);
  }

  const latencyMs = Date.now() - t0;
  const errorMessage =
    result.status >= 400 ? (result.payload as { error?: { message?: string } })?.error?.message ?? `HTTP ${result.status}` : undefined;

  // Log no bloqueante PERO garantizado (after corre tras enviar la respuesta).
  if (userId) {
    after(async () => {
      await supabase.from("usage_events").insert({
        user_id: userId,
        user_email: email,
        provider,
        model: result.model,
        tokens_in: result.tin ?? null,
        tokens_out: result.tout ?? null,
        estimated_cost_usd: estimateCost(result.model, result.tin, result.tout),
        latency_ms: latencyMs,
        status: errorMessage ? "error" : "success",
        error_message: errorMessage ?? null,
        http_status: result.status,
        has_audio: hasAudio,
      });
    });
  }

  return NextResponse.json(result.payload, { status: result.status });
}
