import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-server";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Suspense fallback={<LoadingShell />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  return (
    <>
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e5e5",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img src="/alzak-logo.png" alt="ALZAK" style={{ height: "28px" }} />
          <strong style={{ fontSize: "14px", color: "#2D2D2D" }}>Admin · Actas</strong>
        </Link>
        <nav style={{ display: "flex", gap: "16px", flex: 1 }}>
          <AdminLink href="/admin">Dashboard</AdminLink>
          <AdminLink href="/admin/settings">Settings</AdminLink>
          <AdminLink href="/admin/metrics">Métricas</AdminLink>
          <AdminLink href="/admin/users">Usuarios</AdminLink>
          <AdminLink href="/admin/logs">Logs</AdminLink>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#666" }}>
            {profile.email}{" "}
            <span
              style={{
                background: "#00A651",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: 700,
                marginLeft: "4px",
              }}
            >
              ADMIN
            </span>
          </span>
          <Link
            href="/actas"
            style={{
              fontSize: "12px",
              color: "#00A651",
              textDecoration: "none",
              border: "1px solid #00A651",
              padding: "5px 12px",
              borderRadius: "6px",
            }}
          >
            ← Volver al acta
          </Link>
        </div>
      </header>
      <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>{children}</main>
    </>
  );
}

function LoadingShell() {
  return (
    <div style={{ padding: "40px", textAlign: "center", color: "#666", fontSize: "13px" }}>
      Verificando permisos…
    </div>
  );
}

function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: "13px",
        color: "#444",
        textDecoration: "none",
        padding: "6px 0",
        fontWeight: 500,
      }}
    >
      {children}
    </Link>
  );
}
