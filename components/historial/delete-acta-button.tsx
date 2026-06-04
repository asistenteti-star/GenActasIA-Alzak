"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteActaButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function del() {
    if (!confirm("¿Borrar esta acta del historial? No se puede deshacer.")) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/actas/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Error " + r.status);
      }
      router.refresh();
    } catch (e) {
      alert("No se pudo borrar: " + (e instanceof Error ? e.message : ""));
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={del}
      disabled={loading}
      title="Borrar"
      aria-label="Borrar acta"
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
