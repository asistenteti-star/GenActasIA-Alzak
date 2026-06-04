import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

  if (params.status === "error" || params.status === "success") q = q.eq("status", params.status);
  if (params.provider === "gemini" || params.provider === "claude") q = q.eq("provider", params.provider);

  const { data: rows } = await q;
  const events = rows ?? [];

  if (events.length === 0) {
    return <Card className="p-5 text-sm text-slate-600">Sin eventos para los filtros aplicados.</Card>;
  }

  return (
    <Card className="gap-0 overflow-x-auto p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cuándo</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead className="text-right">Latencia</TableHead>
            <TableHead>Audio</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap text-slate-500">{new Date(e.created_at).toLocaleString("es-CO")}</TableCell>
              <TableCell>{e.user_email ?? "—"}</TableCell>
              <TableCell className="uppercase text-xs font-semibold">{e.provider}</TableCell>
              <TableCell className="text-slate-500">{e.model ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{e.tokens_in ?? 0} → {e.tokens_out ?? 0}</TableCell>
              <TableCell className="text-right tabular-nums">{e.latency_ms ? `${e.latency_ms}ms` : "—"}</TableCell>
              <TableCell>{e.has_audio ? "🔊" : ""}</TableCell>
              <TableCell>
                {e.status === "success" ? (
                  <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                ) : (
                  <Badge variant="destructive">ERR {e.http_status ?? ""}</Badge>
                )}
              </TableCell>
              <TableCell className="max-w-[260px] truncate text-red-600">{e.error_message ?? ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function FilterChips({ current }: { current: Filters }) {
  const link = (q: Filters) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v) sp.set(k, v);
    return "/admin/logs" + (sp.toString() ? `?${sp}` : "");
  };
  const items: { label: string; params: Filters }[] = [
    { label: "Todos", params: {} },
    { label: "Solo errores", params: { status: "error" } },
    { label: "Solo éxitos", params: { status: "success" } },
    { label: "Gemini", params: { provider: "gemini" } },
    { label: "Claude", params: { provider: "claude" } },
  ];
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map(({ label, params }) => {
        const active = JSON.stringify(params) === JSON.stringify(current);
        return (
          <Link
            key={label}
            href={link(params)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

async function FiltersFromSearchParams({ searchParams }: { searchParams: Promise<Filters> }) {
  return <FilterChips current={await searchParams} />;
}

export default function LogsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Logs de API</h1>
      <Suspense fallback={<div className="mb-4 h-8" />}>
        <FiltersFromSearchParams searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LogsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
