"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
const CLAUDE_MODELS = ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-7"];

export default function ProviderForm({
  provider: initialProvider,
  geminiModel: initialGemini,
  claudeModel: initialClaude,
  updatedAt,
}: {
  provider: "gemini" | "claude";
  geminiModel: string;
  claudeModel: string;
  updatedAt: string;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState(initialProvider);
  const [geminiModel, setGeminiModel] = useState(initialGemini);
  const [claudeModel, setClaudeModel] = useState(initialClaude);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    provider !== initialProvider ||
    geminiModel !== initialGemini ||
    claudeModel !== initialClaude;

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, gemini_model: geminiModel, claude_model: claudeModel }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error guardando");
      setMsg({ kind: "ok", text: "Guardado." });
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div>
        <label style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", fontWeight: 600 }}>
          Provider activo
        </label>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          {(["gemini", "claude"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              style={{
                flex: 1,
                padding: "12px",
                border: provider === p ? "2px solid #00A651" : "1.5px solid #d0d0d0",
                background: provider === p ? "#E6F7EE" : "#fff",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: provider === p ? 700 : 500,
                textTransform: "uppercase",
                fontSize: "13px",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", fontWeight: 600 }}>
          Modelo Gemini (default cuando provider=gemini)
        </label>
        <select
          value={geminiModel}
          onChange={(e) => setGeminiModel(e.target.value)}
          style={selectStyle}
        >
          {GEMINI_MODELS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", fontWeight: 600 }}>
          Modelo Claude (default cuando provider=claude)
        </label>
        <select
          value={claudeModel}
          onChange={(e) => setClaudeModel(e.target.value)}
          style={selectStyle}
        >
          {CLAUDE_MODELS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px" }}>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          style={{
            padding: "10px 24px",
            background: dirty && !saving ? "#00A651" : "#aaa",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            cursor: dirty && !saving ? "pointer" : "not-allowed",
            fontSize: "13px",
          }}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {msg && (
          <span style={{ fontSize: "13px", color: msg.kind === "ok" ? "#0a0" : "#d93025" }}>
            {msg.text}
          </span>
        )}
      </div>

      <p style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
        Última actualización: {new Date(updatedAt).toLocaleString("es-CO")}
      </p>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #d0d0d0",
  borderRadius: "8px",
  fontSize: "13px",
  marginTop: "8px",
  background: "#fff",
};
