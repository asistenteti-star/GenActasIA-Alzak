"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SWAP_MS = 4500;

type Variant = "foundation" | "consulting";

const ENTIDADES: Record<
  Variant,
  { name: string; nit: string; accent: string; soft: string; logo: string }
> = {
  foundation: { name: "ALZAK FOUNDATION", nit: "NIT 900.919.573-9", accent: "#00A651", soft: "#E6F7EE", logo: "/logos/ALZAK_foundation.png" },
  consulting: { name: "ALZAK CONSULTING & RESEARCH", nit: "NIT 900.898.741-8", accent: "#1E63C8", soft: "#E7F0FB", logo: "/logos/alzakgroup.png" },
};

/**
 * Mockup flotante de un acta que alterna entre las dos razones sociales,
 * con tilt 3D al hover y cross-fade — réplica del hero de alzak-docs-gen.
 */
export function MockupActa() {
  const [front, setFront] = useState<Variant>("foundation");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setFront((p) => (p === "foundation" ? "consulting" : "foundation"));
    }, SWAP_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative mt-7 h-52 w-full max-w-sm sm:h-60 sm:max-w-md lg:mt-9 lg:h-72 lg:max-w-lg"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-hidden
    >
      <ActaCard variant="consulting" position={front === "consulting" ? "front" : "back"} />
      <ActaCard variant="foundation" position={front === "foundation" ? "front" : "back"} />
    </div>
  );
}

function ActaCard({ variant, position }: { variant: Variant; position: "front" | "back" }) {
  const e = ENTIDADES[variant];

  function onMove(ev: React.MouseEvent<HTMLDivElement>) {
    const r = ev.currentTarget.getBoundingClientRect();
    const nx = (ev.clientX - r.left) / r.width - 0.5;
    const ny = (ev.clientY - r.top) / r.height - 0.5;
    ev.currentTarget.style.setProperty("--tilt-x", `${nx * 12}deg`);
    ev.currentTarget.style.setProperty("--tilt-y", `${ny * -10}deg`);
    ev.currentTarget.style.setProperty("--lift", "1");
  }
  function onLeave(ev: React.MouseEvent<HTMLDivElement>) {
    ev.currentTarget.style.setProperty("--tilt-x", "0deg");
    ev.currentTarget.style.setProperty("--tilt-y", "0deg");
    ev.currentTarget.style.setProperty("--lift", "0");
  }

  const base =
    position === "front"
      ? "translate(0,0) rotate(1deg) scale(1)"
      : "translate(14px,14px) rotate(-3deg) scale(0.95)";

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "group/card absolute h-full w-full overflow-hidden rounded-xl border bg-white p-3.5 sm:p-4 lg:p-5",
        position === "front" ? "z-10 border-slate-200" : "z-0 border-slate-100",
      )}
      style={{
        transformStyle: "preserve-3d",
        transform: `${base} rotateY(var(--tilt-x,0deg)) rotateX(var(--tilt-y,0deg)) translateZ(calc(var(--lift,0) * 12px))`,
        opacity: position === "front" ? 1 : 0.55,
        boxShadow:
          position === "front"
            ? "0 22px 50px -12px rgba(15,23,42,calc(0.20 + var(--lift,0)*0.10))"
            : "0 8px 24px -8px rgba(15,23,42,0.12)",
        transition: "transform 200ms ease-out, opacity 700ms ease-out, box-shadow 300ms ease-out",
        willChange: "transform",
      }}
    >
      {/* Shine sweep */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-full top-0 z-20 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-1000 ease-out group-hover/card:left-full"
      />

      {/* Encabezado del acta */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
        <div
          className="flex h-9 w-12 shrink-0 items-center justify-center rounded px-1"
          style={{ background: e.soft }}
        >
          <Image
            src={e.logo}
            alt={e.name}
            width={120}
            height={48}
            className="h-6 w-auto object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-bold text-slate-800 sm:text-[10px]">{e.name}</p>
          <p className="text-[7px] text-slate-400 sm:text-[8px]">{e.nit}</p>
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-[6px] font-bold sm:text-[7px]"
          style={{ background: e.soft, color: e.accent }}
        >
          FND-FR-001
        </span>
      </div>

      {/* Banda de sección */}
      <div
        className="mt-2.5 rounded px-2 py-1 text-[7px] font-bold uppercase tracking-wide text-white sm:text-[8px]"
        style={{ background: e.accent }}
      >
        Acta de reunión
      </div>

      {/* Filas info */}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <Bar w="full" /><Bar w="full" /><Bar w="2/3" />
        <Bar w="2/3" /><Bar w="full" /><Bar w="full" />
      </div>

      {/* Asistentes + firmas */}
      <p className="mt-2.5 text-[7px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[8px]">
        Asistentes
      </p>
      <div className="mt-1.5 space-y-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 shrink-0 rounded-full bg-slate-100" />
            <Bar w="full" />
            <Squiggle color={e.accent} />
          </div>
        ))}
      </div>

      {/* Chip resumen IA */}
      <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
        <span className="text-[7px] font-semibold text-slate-500 sm:text-[8px]">✨ Resumen IA</span>
      </div>
    </div>
  );
}

function Bar({ w }: { w: "full" | "2/3" }) {
  return <div className={cn("h-1.5 rounded-full bg-slate-100", w === "full" ? "w-full" : "w-2/3")} />;
}

function Squiggle({ color }: { color: string }) {
  return (
    <svg width="34" height="12" viewBox="0 0 34 12" className="shrink-0" aria-hidden>
      <path
        d="M1 8 C5 2, 8 11, 12 6 S20 2, 24 7 S31 4, 33 6"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
