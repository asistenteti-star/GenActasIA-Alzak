import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const byDay = new Map<string, Agg>();
  const byUser = new Map<string, Agg>();
  const byProvider = new Map<string, Agg>();

  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    const inc = (m: Map<string, Agg>, k: string) => {
      const cur = m.get(k) ?? { calls: 0, inT: 0, outT: 0, cost: 0, errors: 0 };
      cur.calls += 1;
      cur.inT += e.tokens_in ?? 0;
      cur.outT += e.tokens_out ?? 0;
      cur.cost += Number(e.estimated_cost_usd ?? 0);
      if (e.status === "error") cur.errors += 1;
      m.set(k, cur);
    };
    inc(byDay, day);
    inc(byUser, e.user_email ?? "(desconocido)");
    inc(byProvider, e.provider);
  }

  const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  const users = [...byUser.entries()].sort((a, b) => b[1].calls - a[1].calls).slice(0, 20);
  const providers = [...byProvider.entries()];

  return (
    <div className="grid gap-6">
      <MetricTable
        title="Por proveedor (últimos 30 días)"
        headers={["Proveedor", "Llamadas", "Tokens in", "Tokens out", "Costo USD"]}
        rows={providers.map(([p, v]) => [p.toUpperCase(), v.calls.toLocaleString(), v.inT.toLocaleString(), v.outT.toLocaleString(), `$${v.cost.toFixed(4)}`])}
      />
      <MetricTable
        title="Por usuario (top 20, últimos 30 días)"
        headers={["Usuario", "Llamadas", "Errores", "Tokens in", "Tokens out", "Costo USD"]}
        rows={users.map(([email, v]) => [email, v.calls.toLocaleString(), v.errors.toString(), v.inT.toLocaleString(), v.outT.toLocaleString(), `$${v.cost.toFixed(4)}`])}
      />
      <MetricTable
        title="Por día (últimos 30 días)"
        headers={["Día", "Llamadas", "Tokens in", "Tokens out", "Costo USD"]}
        rows={days.map(([d, v]) => [d, v.calls.toLocaleString(), v.inT.toLocaleString(), v.outT.toLocaleString(), `$${v.cost.toFixed(4)}`])}
      />
    </div>
  );
}

type Agg = { calls: number; inT: number; outT: number; cost: number; errors: number };

function MetricTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-500">Sin datos.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={h} className={i > 0 ? "text-right" : ""}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                {r.map((c, j) => (
                  <TableCell key={j} className={j > 0 ? "text-right tabular-nums" : "font-medium"}>{c}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export default function MetricsPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Métricas de consumo</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <MetricsContent />
      </Suspense>
    </>
  );
}
