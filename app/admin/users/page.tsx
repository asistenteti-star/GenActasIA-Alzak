import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
};

async function UsersContent() {
  const supabase = await createClient();

  const [profilesQ, eventsQ] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role, created_at, last_sign_in_at").order("created_at", { ascending: false }),
    supabase.from("usage_events").select("user_id, status"),
  ]);

  const profiles: UserRow[] = profilesQ.data ?? [];
  const events = eventsQ.data ?? [];

  const counts = new Map<string, { total: number; errors: number }>();
  for (const e of events) {
    if (!e.user_id) continue;
    const cur = counts.get(e.user_id) ?? { total: 0, errors: 0 };
    cur.total += 1;
    if (e.status === "error") cur.errors += 1;
    counts.set(e.user_id, cur);
  }

  if (profiles.length === 0) {
    return (
      <Card className="p-5 text-sm text-slate-600">
        No hay perfiles registrados aún.
      </Card>
    );
  }

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("es-CO") : "—");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right">Actas</TableHead>
            <TableHead className="text-right">Errores</TableHead>
            <TableHead>Último login</TableHead>
            <TableHead>Creado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p) => {
            const c = counts.get(p.id) ?? { total: 0, errors: 0 };
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-slate-900">{p.email}</TableCell>
                <TableCell>{p.full_name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={p.role === "admin" ? "default" : "secondary"} className="uppercase">
                    {p.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{c.total}</TableCell>
                <TableCell className={`text-right tabular-nums ${c.errors > 0 ? "text-red-600" : "text-slate-500"}`}>
                  {c.errors}
                </TableCell>
                <TableCell className="text-slate-500">{fmt(p.last_sign_in_at)}</TableCell>
                <TableCell className="text-slate-500">{fmt(p.created_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function UsersPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Usuarios</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <UsersContent />
      </Suspense>
    </>
  );
}
