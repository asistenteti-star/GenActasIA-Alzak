import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth-server";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogoutButton } from "@/components/logout-button";

type Acta = {
  id: string;
  user_email: string | null;
  entity: string;
  razon_social: string | null;
  num_acta: string | null;
  nombre: string | null;
  fecha: string | null;
  created_at: string;
};

async function HistorialContent() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isAdmin = profile.role === "admin";

  const supabase = await createClient();
  const { data } = await supabase
    .from("actas")
    .select("id, user_email, entity, razon_social, num_acta, nombre, fecha, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  const actas: Acta[] = data ?? [];

  if (actas.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <FileText className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Aún no hay actas guardadas</p>
        <p className="text-xs text-slate-500">
          Genera un acta y usa <b>💾 Guardar</b> para que aparezca aquí.
        </p>
        <Link href="/actas" className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
          Generar un acta
        </Link>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha guardado</TableHead>
            <TableHead>Razón social</TableHead>
            <TableHead>N° acta</TableHead>
            <TableHead>Reunión</TableHead>
            {isAdmin && <TableHead>Autor</TableHead>}
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actas.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="whitespace-nowrap text-slate-500">
                {new Date(a.created_at).toLocaleString("es-CO")}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: a.entity === "CONSULTING" ? "#1E63C8" : "#00A651" }}
                  />
                  <span className="text-slate-700">{a.razon_social ?? a.entity}</span>
                </span>
              </TableCell>
              <TableCell className="tabular-nums">{a.num_acta ?? "—"}</TableCell>
              <TableCell className="max-w-[280px] truncate">{a.nombre ?? "—"}</TableCell>
              {isAdmin && <TableCell className="text-slate-500">{a.user_email ?? "—"}</TableCell>}
              <TableCell className="text-right">
                <Link
                  href={`/actas?acta=${a.id}`}
                  className="inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Abrir
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function HistorialPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Image src="/alzak-logo.png" alt="ALZAK" width={28} height={28} className="h-7 w-auto object-contain" />
          <span className="text-sm font-bold tracking-tight text-slate-900">Historial de actas</span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/actas"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Generar acta
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
          <HistorialContent />
        </Suspense>
      </main>
    </div>
  );
}
