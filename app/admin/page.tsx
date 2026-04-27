import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function Stats() {
  const supabase = await createClient();
  const now = new Date();
  const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const d7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [config, totalEvents, last24h, last7d, last30d, errors24h, totalUsers] =
    await Promise.all([
      supabase.from("app_config").select("provider, gemini_model, claude_model, updated_at").eq("id", 1).single(),
      supabase.from("usage_events").select("*", { count: "exact", head: true }),
      supabase.from("usage_events").select("tokens_in, tokens_out, estimated_cost_usd", { count: "exact" }).gte("created_at", d24h),
      supabase.from("usage_events").select("tokens_in, tokens_out, estimated_cost_usd", { count: "exact" }).gte("created_at", d7d),
      supabase.from("usage_events").select("tokens_in, tokens_out, estimated_cost_usd", { count: "exact" }).gte("created_at", d30d),
      supabase.from("usage_events").select("*", { count: "exact", head: true }).eq("status", "error").gte("created_at", d24h),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

  const sumTokens = (rows: { tokens_in?: number | null; tokens_out?: number | null; estimated_cost_usd?: number | null }[] | null) => {
    let inT = 0, outT = 0, cost = 0;
    for (const r of rows ?? []) {
      inT += r.tokens_in ?? 0;
      outT += r.tokens_out ?? 0;
      cost += Number(r.estimated_cost_usd ?? 0);
    }
    return { inT, outT, cost };
  };

  const t24 = sumTokens(last24h.data);
  const t7 = sumTokens(last7d.data);
  const t30 = sumTokens(last30d.data);

  return (
    <>
      <Card title="Provider activo">
        <p style={{ fontSize: "24px", fontWeight: 700, margin: 0, textTransform: "uppercase", color: "#00A651" }}>
          {config.data?.provider ?? "—"}
        </p>
        <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>
          {config.data?.provider === "claude" ? config.data.claude_model : config.data?.gemini_model}
        </p>
        <Link href="/admin/settings" style={{ fontSize: "12px", color: "#00A651", marginTop: "8px", display: "inline-block" }}>
          Cambiar →
        </Link>
      </Card>

      <Card title="Total actas procesadas">
        <p style={{ fontSize: "32px", fontWeight: 700, margin: 0 }}>{totalEvents.count ?? 0}</p>
        <p style={{ fontSize: "11px", color: "#666", margin: "4px 0 0" }}>desde el inicio</p>
      </Card>

      <Card title="Usuarios registrados">
        <p style={{ fontSize: "32px", fontWeight: 700, margin: 0 }}>{totalUsers.count ?? 0}</p>
        <Link href="/admin/users" style={{ fontSize: "12px", color: "#00A651", marginTop: "8px", display: "inline-block" }}>
          Ver detalle →
        </Link>
      </Card>

      <Card title="Errores últimas 24h">
        <p style={{ fontSize: "32px", fontWeight: 700, margin: 0, color: (errors24h.count ?? 0) > 0 ? "#d93025" : "#0a0" }}>
          {errors24h.count ?? 0}
        </p>
        <Link href="/admin/logs?status=error" style={{ fontSize: "12px", color: "#00A651", marginTop: "8px", display: "inline-block" }}>
          Ver logs →
        </Link>
      </Card>

      <UsageWindow title="Últimas 24 horas" events={last24h.count ?? 0} {...t24} />
      <UsageWindow title="Últimos 7 días" events={last7d.count ?? 0} {...t7} />
      <UsageWindow title="Últimos 30 días" events={last30d.count ?? 0} {...t30} />
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <p style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>{title}</p>
      {children}
    </div>
  );
}

function UsageWindow({ title, events, inT, outT, cost }: { title: string; events: number; inT: number; outT: number; cost: number }) {
  return (
    <Card title={title}>
      <div style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
        <Row k="Llamadas" v={events.toString()} />
        <Row k="Tokens in" v={inT.toLocaleString()} />
        <Row k="Tokens out" v={outT.toLocaleString()} />
        <Row k="Costo aprox" v={`$${cost.toFixed(4)}`} highlight />
      </div>
    </Card>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "#666" }}>{k}</span>
      <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? "#00A651" : "#2D2D2D" }}>{v}</span>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <>
      <h1 style={{ fontSize: "20px", margin: "0 0 20px" }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <Suspense fallback={<p style={{ color: "#666" }}>Cargando estadísticas…</p>}>
          <Stats />
        </Suspense>
      </div>
    </>
  );
}
