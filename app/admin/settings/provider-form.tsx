"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
const CLAUDE_MODELS = ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-7"];

export default function ProviderForm({
  provider: initialProvider,
  geminiModel: initialGemini,
  claudeModel: initialClaude,
  updatedAt,
  claudeKeyInDb,
  claudeKeyInEnv,
}: {
  provider: "gemini" | "claude";
  geminiModel: string;
  claudeModel: string;
  updatedAt: string;
  claudeKeyInDb: boolean;
  claudeKeyInEnv: boolean;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState(initialProvider);
  const [geminiModel, setGeminiModel] = useState(initialGemini);
  const [claudeModel, setClaudeModel] = useState(initialClaude);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [claudeKey, setClaudeKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty = provider !== initialProvider || geminiModel !== initialGemini || claudeModel !== initialClaude;

  async function postConfig(payload: Record<string, string>) {
    const r = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Error guardando");
    return data;
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await postConfig({ provider, gemini_model: geminiModel, claude_model: claudeModel });
      setMsg({ kind: "ok", text: "Guardado." });
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  async function saveKey(clear: boolean) {
    setSavingKey(true);
    setKeyMsg(null);
    try {
      await postConfig({ claude_api_key: clear ? "" : claudeKey });
      setClaudeKey("");
      setKeyMsg({ kind: "ok", text: clear ? "API key eliminada." : "API key guardada." });
      router.refresh();
    } catch (e) {
      setKeyMsg({ kind: "err", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setSavingKey(false);
    }
  }

  const keyStatus = claudeKeyInDb
    ? { text: "Configurada (guardada en la app)", tone: "text-emerald-600" }
    : claudeKeyInEnv
      ? { text: "Usando variable de entorno ANTHROPIC_API_KEY", tone: "text-emerald-600" }
      : { text: "No configurada — Claude hará fallback a Gemini", tone: "text-red-600" };

  return (
    <div className="grid gap-6">
      {/* Provider */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proveedor activo</label>
        <div className="mt-2 flex gap-2.5">
          {(["gemini", "claude"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={cn(
                "flex-1 rounded-lg border-2 py-3 text-sm font-semibold uppercase transition-colors",
                provider === p ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {p}
              {p === "gemini" && <span className="ml-1.5 text-[10px] font-normal opacity-70">(default)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Modelos */}
      <ModelSelect label="Modelo Gemini (cuando proveedor = gemini)" value={geminiModel} onChange={setGeminiModel} options={GEMINI_MODELS} />
      <ModelSelect label="Modelo Claude (cuando proveedor = claude)" value={claudeModel} onChange={setClaudeModel} options={CLAUDE_MODELS} />

      {/* API key de Claude */}
      <div className="border-t border-slate-100 pt-5">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">API key de Claude (Anthropic)</label>
        <p className={cn("mt-1 mb-2 text-xs", keyStatus.tone)}>Estado: {keyStatus.text}</p>
        <div className="flex flex-wrap gap-2">
          <Input
            type="password"
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
            className="min-w-[220px] flex-1"
          />
          <Button type="button" onClick={() => saveKey(false)} disabled={savingKey || claudeKey.trim() === ""}>
            {savingKey ? "Guardando…" : "Guardar key"}
          </Button>
          {claudeKeyInDb && (
            <Button type="button" variant="outline" onClick={() => saveKey(true)} disabled={savingKey} className="text-red-600 hover:text-red-700">
              Borrar
            </Button>
          )}
        </div>
        {keyMsg && <p className={cn("mt-2 text-xs", keyMsg.kind === "ok" ? "text-emerald-600" : "text-red-600")}>{keyMsg.text}</p>}
        <p className="mt-2 text-xs text-slate-400">
          Se guarda del lado servidor (acceso solo-admin) y no se muestra. Para que la generación la use desde aquí se
          requiere <code className="rounded bg-slate-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>; si no, se usa la env var{" "}
          <code className="rounded bg-slate-100 px-1">ANTHROPIC_API_KEY</code>.
        </p>
      </div>

      {/* Guardar config */}
      <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
        <Button type="button" onClick={save} disabled={!dirty || saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        {msg && <span className={cn("text-sm", msg.kind === "ok" ? "text-emerald-600" : "text-red-600")}>{msg.text}</span>}
      </div>

      <p className="text-xs text-slate-400">Última actualización: {new Date(updatedAt).toLocaleString("es-CO")}</p>
    </div>
  );
}

function ModelSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        {options.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
