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
    ? { text: "Configurada (guardada en la app)", color: "#0a0" }
    : claudeKeyInEnv
      ? { text: "Usando variable de entorno ANTHROPIC_API_KEY", color: "#0a0" }
      : { text: "No configurada — Claude hará fallback a Gemini", color: "#d93025" };

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

      <div style={{ borderTop: "1px solid #eee", paddingTop: "18px" }}>
        <label style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", fontWeight: 600 }}>
          API key de Claude (Anthropic)
        </label>
        <p style={{ fontSize: "12px", margin: "4px 0 8px", color: keyStatus.color }}>
          Estado: {keyStatus.text}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="password"
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
            style={{ ...selectStyle, flex: 1, minWidth: "220px", marginTop: 0 }}
          />
          <button
            type="button"
            onClick={() => saveKey(false)}
            disabled={savingKey || claudeKey.trim() === ""}
            style={{
              padding: "10px 18px",
              background: !savingKey && claudeKey.trim() !== "" ? "#00A651" : "#aaa",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: !savingKey && claudeKey.trim() !== "" ? "pointer" : "not-allowed",
              fontSize: "13px",
            }}
          >
            {savingKey ? "Guardando…" : "Guardar key"}
          </button>
          {claudeKeyInDb && (
            <button
              type="button"
              onClick={() => saveKey(true)}
              disabled={savingKey}
              style={{
                padding: "10px 18px",
                background: "#fff",
                color: "#d93025",
                border: "1.5px solid #d93025",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Borrar
            </button>
          )}
        </div>
        {keyMsg && (
          <p style={{ fontSize: "13px", marginTop: "8px", color: keyMsg.kind === "ok" ? "#0a0" : "#d93025" }}>
            {keyMsg.text}
          </p>
        )}
        <p style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
          La key se guarda del lado servidor (acceso solo-admin) y no se muestra. Para que la generación la use
          desde aquí se requiere <code>SUPABASE_SERVICE_ROLE_KEY</code>; si no, se usa la env var{" "}
          <code>ANTHROPIC_API_KEY</code>.
        </p>
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
