import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Cpu, FileText, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

async function Stats() {
  const supabase = await createClient();
  const now = Date.now();
  const d24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const d7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

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
  const provider = config.data?.provider ?? "—";
  const model = provider === "claude" ? config.data?.claude_model : config.data?.gemini_model;
  const errs = errors24h.count ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Cpu} label="Provider activo" href="/admin/settings" cta="Cambiar">
        <p className="text-2xl font-bold uppercase text-slate-900">{provider}</p>
        <p className="mt-1 text-xs text-slate-500">{model ?? "—"}</p>
      </StatCard>

      <StatCard icon={FileText} label="Actas procesadas">
        <p className="text-3xl font-bold text-slate-900">{totalEvents.count ?? 0}</p>
        <p className="mt-1 text-xs text-slate-500">desde el inicio</p>
      </StatCard>

      <StatCard icon={Users} label="Usuarios" href="/admin/users" cta="Ver detalle">
        <p className="text-3xl font-bold text-slate-900">{totalUsers.count ?? 0}</p>
      </StatCard>

      <StatCard icon={AlertTriangle} label="Errores 24h" href="/admin/logs?status=error" cta="Ver logs">
        <p className={`text-3xl font-bold ${errs > 0 ? "text-red-600" : "text-emerald-600"}`}>{errs}</p>
      </StatCard>

      <UsageWindow title="Últimas 24 horas" events={last24h.count ?? 0} {...t24} />
      <UsageWindow title="Últimos 7 días" events={last7d.count ?? 0} {...t7} />
      <UsageWindow title="Últimos 30 días" events={last30d.count ?? 0} {...t30} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  href,
  cta,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  cta?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {children}
      {href && cta && (
        <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900">
          {cta} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </Card>
  );
}

function UsageWindow({ title, events, inT, outT, cost }: { title: string; events: number; inT: number; outT: number; cost: number }) {
  return (
    <Card className="gap-0 p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <dl className="grid gap-1.5 text-sm">
        <Row k="Llamadas" v={events.toString()} />
        <Row k="Tokens in" v={inT.toLocaleString()} />
        <Row k="Tokens out" v={outT.toLocaleString()} />
        <Row k="Costo aprox" v={`$${cost.toFixed(4)}`} highlight />
      </dl>
    </Card>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`tabular-nums ${highlight ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>{v}</dd>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando estadísticas…</p>}>
        <Stats />
      </Suspense>
    </>
  );
}
