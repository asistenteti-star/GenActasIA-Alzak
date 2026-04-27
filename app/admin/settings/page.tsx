import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ProviderForm from "./provider-form";

async function CurrentConfig() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_config")
    .select("provider, gemini_model, claude_model, updated_at")
    .eq("id", 1)
    .single();

  if (!data) return <p>No se pudo cargar la config.</p>;

  return (
    <ProviderForm
      provider={data.provider as "gemini" | "claude"}
      geminiModel={data.gemini_model}
      claudeModel={data.claude_model}
      updatedAt={data.updated_at}
    />
  );
}

export default function SettingsPage() {
  return (
    <>
      <h1 style={{ fontSize: "20px", margin: "0 0 20px" }}>Settings — Provider de IA</h1>
      <div style={{ background: "#fff", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", maxWidth: "560px" }}>
        <Suspense fallback={<p style={{ color: "#666" }}>Cargando…</p>}>
          <CurrentConfig />
        </Suspense>
      </div>
      <p style={{ fontSize: "12px", color: "#666", marginTop: "16px", maxWidth: "560px" }}>
        ⚠️ Claude no soporta audio nativo. Si seleccionás Claude y se sube un archivo de audio,
        el backend hará fallback automático a Gemini para esa solicitud (queda registrado en logs).
      </p>
    </>
  );
}
