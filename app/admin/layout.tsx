import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth-server";
import { AdminSidebarNav, AdminMobileNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={<LoadingShell />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return (
    <div className="flex">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 hidden w-60 flex-col border-r border-slate-200 bg-white px-4 py-5 md:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-2">
          <Image src="/alzak-logo.png" alt="ALZAK" width={28} height={28} className="h-7 w-auto object-contain" />
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Admin · Actas
          </span>
        </Link>

        <div className="mt-6 flex-1">
          <AdminSidebarNav />
        </div>

        <Link
          href="/actas"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al acta
        </Link>
      </aside>

      {/* Contenido */}
      <div className="flex-1 md:pl-60">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <AdminMobileNav />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden truncate text-xs text-slate-500 sm:inline">
                {profile.email}
              </span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Admin
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="p-10 text-center text-sm text-slate-500">Verificando permisos…</div>
  );
}
