import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import ProviderForm from "./provider-form";

async function CurrentConfig() {
  const supabase = await createClient();

  const [{ data }, { data: secret }] = await Promise.all([
    supabase
      .from("app_config")
      .select("provider, gemini_model, claude_model, updated_at")
      .eq("id", 1)
      .single(),
    // app_secrets tiene RLS solo-admin; este componente corre como admin.
    supabase.from("app_secrets").select("key").eq("key", "anthropic_api_key").maybeSingle(),
  ]);

  if (!data) return <p>No se pudo cargar la config.</p>;

  return (
    <ProviderForm
      provider={data.provider as "gemini" | "claude"}
      geminiModel={data.gemini_model}
      claudeModel={data.claude_model}
      updatedAt={data.updated_at}
      claudeKeyInDb={!!secret}
      claudeKeyInEnv={!!process.env.ANTHROPIC_API_KEY}
    />
  );
}

export default function SettingsPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Settings — Proveedor de IA</h1>
      <Card className="max-w-xl p-6">
        <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
          <CurrentConfig />
        </Suspense>
      </Card>
      <p className="mt-4 max-w-xl text-xs text-slate-500">
        ⚠️ Claude no soporta audio nativo. Si seleccionás Claude y se sube un archivo de audio, el
        backend hará fallback automático a Gemini para esa solicitud (queda registrado en logs).
        Gemini es el proveedor por defecto.
      </p>
    </>
  );
}
