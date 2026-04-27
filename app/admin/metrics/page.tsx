import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

type Event = {
  user_email: string | null;
  provider: string;
  tokens_in: number | null;
  tokens_out: number | null;
  estimated_cost_usd: number | null;
  status: string;
  created_at: string;
};

async function MetricsContent() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from("usage_events")
    .select("user_email, provider, tokens_in, tokens_out, estimated_cost_usd, status, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const events: Event[] = rows ?? [];

  // Por día (últimos 30 días)
  const byDay = new Map<string, { calls: number; inT: number; outT: number; cost: number }>();
  // Por usuario
  const byUser = new Map<string, { calls: number; inT: number; outT: number; cost: number; errors: number }>();
  // Por provider
  const byProvider = new Map<string, { calls: number; inT: number; outT: number; cost: number }>();

  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    const inc = (m: Map<string, { calls: number; inT: number; outT: number; cost: number; errors?: number }>, k: string) => {
      const cur = m.get(k) ?? { calls: 0, inT: 0, outT: 0, cost: 0, errors: 0 };
      cur.calls += 1;
      cur.inT += e.tokens_in ?? 0;
      cur.outT += e.tokens_out ?? 0;
      cur.cost += Number(e.estimated_cost_usd ?? 0);
      if (e.status === "error") cur.errors = (cur.errors ?? 0) + 1;
      m.set(k, cur);
    };
    inc(byDay, day);
    inc(byUser, e.user_email ?? "(unknown)");
    inc(byProvider, e.provider);
  }

  const days = Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  const users = Array.from(byUser.entries()).sort((a, b) => b[1].calls - a[1].calls).slice(0, 20);
  const providers = Array.from(byProvider.entries());

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <Section title="Por provider (últimos 30 días)">
        <Table
          headers={["Provider", "Llamadas", "Tokens in", "Tokens out", "Costo USD"]}
          rows={providers.map(([p, v]) => [
            p.toUpperCase(),
            v.calls.toString(),
            v.inT.toLocaleString(),
            v.outT.toLocaleString(),
            `$${v.cost.toFixed(4)}`,
          ])}
        />
      </Section>

      <Section title="Por usuario (top 20, últimos 30 días)">
        <Table
          headers={["Usuario", "Llamadas", "Errores", "Tokens in", "Tokens out", "Costo USD"]}
          rows={users.map(([email, v]) => [
            email,
            v.calls.toString(),
            (v.errors ?? 0).toString(),
            v.inT.toLocaleString(),
            v.outT.toLocaleString(),
            `$${v.cost.toFixed(4)}`,
          ])}
        />
      </Section>

      <Section title="Por día (últimos 30 días)">
        <Table
          headers={["Día", "Llamadas", "Tokens in", "Tokens out", "Costo USD"]}
          rows={days.map(([d, v]) => [
            d,
            v.calls.toString(),
            v.inT.toLocaleString(),
            v.outT.toLocaleString(),
            `$${v.cost.toFixed(4)}`,
          ])}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h2 style={{ fontSize: "14px", margin: "0 0 14px", color: "#444", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h2>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return <p style={{ color: "#666", fontSize: "13px", margin: 0 }}>Sin datos.</p>;
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={{ textAlign: "left", padding: "8px", fontSize: "11px", color: "#666", textTransform: "uppercase", borderBottom: "1px solid #eee", fontWeight: 600 }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} style={{ padding: "8px", borderBottom: "1px solid #f5f5f5", fontVariantNumeric: j > 0 ? "tabular-nums" : "normal" }}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function MetricsPage() {
  return (
    <>
      <h1 style={{ fontSize: "20px", margin: "0 0 20px" }}>Métricas de consumo</h1>
      <Suspense fallback={<p style={{ color: "#666" }}>Cargando…</p>}>
        <MetricsContent />
      </Suspense>
    </>
  );
}
