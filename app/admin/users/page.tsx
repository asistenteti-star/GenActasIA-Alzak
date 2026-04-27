import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

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
      <div style={{ background: "#fff", borderRadius: "10px", padding: "20px" }}>
        <p style={{ color: "#666" }}>
          No hay perfiles registrados. Si el primer login fue antes de aplicar la migration 0001,
          aplicala desde el SQL Editor de Supabase y volvé a entrar.
        </p>
      </div>
    );
  }

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString("es-CO") : "—");

  return (
    <div style={{ background: "#fff", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead style={{ background: "#fafafa" }}>
          <tr>
            <Th>Email</Th>
            <Th>Nombre</Th>
            <Th>Rol</Th>
            <Th>Actas</Th>
            <Th>Errores</Th>
            <Th>Último login</Th>
            <Th>Creado</Th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => {
            const c = counts.get(p.id) ?? { total: 0, errors: 0 };
            return (
              <tr key={p.id}>
                <Td><strong>{p.email}</strong></Td>
                <Td>{p.full_name ?? "—"}</Td>
                <Td>
                  <span
                    style={{
                      background: p.role === "admin" ? "#00A651" : "#e5e5e5",
                      color: p.role === "admin" ? "#fff" : "#444",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {p.role}
                  </span>
                </Td>
                <Td>{c.total}</Td>
                <Td style={{ color: c.errors > 0 ? "#d93025" : "#666" }}>{c.errors}</Td>
                <Td>{fmtDate(p.last_sign_in_at)}</Td>
                <Td>{fmtDate(p.created_at)}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "12px", fontSize: "11px", color: "#666", textTransform: "uppercase", fontWeight: 600, borderBottom: "1px solid #eee" }}>
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: "12px", borderBottom: "1px solid #f5f5f5", ...style }}>
      {children}
    </td>
  );
}

export default function UsersPage() {
  return (
    <>
      <h1 style={{ fontSize: "20px", margin: "0 0 20px" }}>Usuarios</h1>
      <Suspense fallback={<p style={{ color: "#666" }}>Cargando…</p>}>
        <UsersContent />
      </Suspense>
    </>
  );
}
