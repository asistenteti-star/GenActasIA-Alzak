import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

type Filters = { status?: string; provider?: string; limit?: string };

async function LogsContent({ searchParams }: { searchParams: Promise<Filters> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const limit = Math.min(Number(params.limit ?? 100), 500);

  let q = supabase
    .from("usage_events")
    .select("id, user_email, provider, model, tokens_in, tokens_out, latency_ms, status, error_message, http_status, has_audio, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.status === "error" || params.status === "success") {
    q = q.eq("status", params.status);
  }
  if (params.provider === "gemini" || params.provider === "claude") {
    q = q.eq("provider", params.provider);
  }

  const { data: rows } = await q;
  const events = rows ?? [];

  if (events.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <p style={{ color: "#666", margin: 0 }}>Sin eventos para los filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: "10px", overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead style={{ background: "#fafafa" }}>
          <tr>
            <Th>Cuándo</Th>
            <Th>Usuario</Th>
            <Th>Provider</Th>
            <Th>Modelo</Th>
            <Th>Tokens</Th>
            <Th>Latencia</Th>
            <Th>Audio</Th>
            <Th>Status</Th>
            <Th>Error</Th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <Td>{new Date(e.created_at).toLocaleString("es-CO")}</Td>
              <Td>{e.user_email ?? "—"}</Td>
              <Td><span style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 600 }}>{e.provider}</span></Td>
              <Td>{e.model ?? "—"}</Td>
              <Td style={{ fontVariantNumeric: "tabular-nums" }}>
                {e.tokens_in ?? 0} → {e.tokens_out ?? 0}
              </Td>
              <Td style={{ fontVariantNumeric: "tabular-nums" }}>{e.latency_ms ? `${e.latency_ms}ms` : "—"}</Td>
              <Td>{e.has_audio ? "🔊" : ""}</Td>
              <Td>
                <span
                  style={{
                    background: e.status === "success" ? "#E6F7EE" : "#FEF2F2",
                    color: e.status === "success" ? "#0a0" : "#d93025",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {e.status === "success" ? "OK" : `ERR ${e.http_status ?? ""}`}
                </span>
              </Td>
              <Td style={{ color: "#d93025", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.error_message ?? ""}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "10px", color: "#666", textTransform: "uppercase", fontWeight: 600, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f5f5f5", ...style }}>
      {children}
    </td>
  );
}

function Filters({ current }: { current: Filters }) {
  const link = (q: Filters) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v) sp.set(k, v);
    return "/admin/logs" + (sp.toString() ? `?${sp.toString()}` : "");
  };
  const Btn = ({ label, params }: { label: string; params: Filters }) => {
    const active = JSON.stringify(params) === JSON.stringify(current);
    return (
      <a
        href={link(params)}
        style={{
          padding: "6px 12px",
          background: active ? "#00A651" : "#fff",
          color: active ? "#fff" : "#444",
          border: "1px solid #d0d0d0",
          borderRadius: "6px",
          fontSize: "12px",
          textDecoration: "none",
          fontWeight: active ? 700 : 500,
        }}
      >
        {label}
      </a>
    );
  };
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
      <Btn label="Todos" params={{}} />
      <Btn label="Solo errores" params={{ status: "error" }} />
      <Btn label="Solo éxitos" params={{ status: "success" }} />
      <Btn label="Gemini" params={{ provider: "gemini" }} />
      <Btn label="Claude" params={{ provider: "claude" }} />
    </div>
  );
}

async function FiltersFromSearchParams({ searchParams }: { searchParams: Promise<Filters> }) {
  const params = await searchParams;
  return <Filters current={params} />;
}

export default function LogsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  return (
    <>
      <h1 style={{ fontSize: "20px", margin: "0 0 20px" }}>Logs de API</h1>
      <Suspense fallback={<div style={{ height: "32px", marginBottom: "16px" }} />}>
        <FiltersFromSearchParams searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p style={{ color: "#666" }}>Cargando…</p>}>
        <LogsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
