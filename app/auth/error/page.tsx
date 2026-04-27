import { Suspense } from "react";
import Link from "next/link";
import { ALLOWED_DOMAIN } from "@/lib/utils";

const REASONS: Record<string, string> = {
  domain_not_allowed: `Solo se permiten cuentas @${ALLOWED_DOMAIN}. Inicia sesión con tu cuenta corporativa.`,
  missing_code: "El proceso de autenticación no devolvió un código válido.",
  exchange_failed: "No se pudo completar el inicio de sesión. Intenta de nuevo.",
};

async function ReasonMessage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason ?? "exchange_failed";
  const message = REASONS[reason] ?? "Error desconocido durante el inicio de sesión.";
  return (
    <p style={{ fontSize: "14px", color: "#444", margin: "0 0 24px", lineHeight: 1.5 }}>
      {message}
    </p>
  );
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "40px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <img
          src="/alzak-logo.png"
          alt="ALZAK Foundation"
          style={{ height: "56px", objectFit: "contain", marginBottom: "20px" }}
        />
        <h1 style={{ fontSize: "18px", margin: "0 0 12px", color: "#d93025" }}>
          No pudimos iniciar tu sesión
        </h1>
        <Suspense fallback={<p style={{ fontSize: "14px", color: "#444", margin: "0 0 24px" }}>Cargando…</p>}>
          <ReasonMessage searchParams={searchParams} />
        </Suspense>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "#00A651",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Volver a intentar
        </Link>
      </div>
    </div>
  );
}
