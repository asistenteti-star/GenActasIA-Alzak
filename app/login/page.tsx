import LoginButton from "./login-button";

export default function LoginPage() {
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
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <img
          src="/alzak-logo.png"
          alt="ALZAK Foundation"
          style={{ height: "64px", objectFit: "contain", marginBottom: "16px" }}
        />
        <h1 style={{ fontSize: "20px", margin: "0 0 8px", color: "#2D2D2D" }}>
          Generador de Actas
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 24px" }}>
          Inicia sesión con tu cuenta corporativa
        </p>
        <LoginButton />
        <p
          style={{
            fontSize: "11px",
            color: "#999",
            marginTop: "24px",
            lineHeight: 1.5,
          }}
        >
          Solo cuentas <b>@alzakfoundation.org</b><br />
          ALZAK Foundation · Uso interno
        </p>
      </div>
    </div>
  );
}
