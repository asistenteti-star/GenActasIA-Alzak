"use client";

import Image from "next/image";
import type { ComponentType } from "react";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextRotator } from "./text-rotator";

export function LoginHero({ className }: { className?: string }) {
  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
    e.currentTarget.style.setProperty("--spotlight-opacity", "1");
  }
  function handleMouseLeave(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.setProperty("--spotlight-opacity", "0");
  }

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group/hero relative flex flex-col items-center justify-center overflow-hidden bg-white px-4 py-8 sm:px-6 lg:px-12 lg:py-12",
        className,
      )}
    >
      {/* 1. Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* 2. Aurora blobs (tonos neutros fríos) */}
      <div
        aria-hidden
        className="absolute -top-40 -left-40 h-[80%] w-[80%] rounded-full opacity-70 blur-3xl motion-safe:animate-aurora-1"
        style={{ background: "radial-gradient(circle, rgba(148,163,184,0.40) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute -top-32 -right-40 h-[75%] w-[75%] rounded-full opacity-60 blur-3xl motion-safe:animate-aurora-2"
        style={{ background: "radial-gradient(circle, rgba(100,116,139,0.32) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 left-1/4 h-[80%] w-[80%] rounded-full opacity-60 blur-3xl motion-safe:animate-aurora-3"
        style={{ background: "radial-gradient(circle, rgba(203,213,225,0.45) 0%, transparent 70%)" }}
      />

      {/* 3. Grano */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* 4. Spotlight follow-mouse */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--spotlight-opacity, 0)",
          background:
            "radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(71,85,105,0.10) 0%, transparent 50%)",
        }}
      />

      {/* 5. Contenido */}
      <div className="relative flex w-full max-w-2xl flex-col items-center animate-in fade-in duration-500">
        {/* Kicker */}
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:text-[11px]">
          <Sparkles className="h-3 w-3" />
          Generador de actas con IA
        </p>

        {/* Título */}
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          Generador de Actas
        </h2>

        {/* Tagline */}
        <p className="mx-auto mt-3 flex max-w-md flex-wrap items-baseline justify-center gap-x-1.5 text-sm leading-relaxed text-slate-700 sm:text-base lg:mt-4 lg:text-lg">
          <span>Tu acta de reunión</span>
          <TextRotator
            phrases={[
              "lista en minutos",
              "con resumen IA",
              "lista para firmar",
              "sin escribir nada",
            ]}
            className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800 shadow-sm ring-1 ring-slate-200"
          />
        </p>
        <p className="mx-auto mt-2 max-w-md text-center text-xs text-slate-500 sm:text-sm">
          Resumen Gemini · Plantilla institucional · Firma digital
        </p>

        {/* Trust badges */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 lg:mt-9">
          <BadgeChip icon={ShieldCheck} label="Datos cifrados" tone="slate" />
          <BadgeChip icon={CheckCircle2} label="Solo @alzakfoundation.org" tone="emerald" />
          <BadgeChip icon={Sparkles} label="Resumen IA" tone="slate" />
        </div>

        {/* Trust bar: ambas razones sociales */}
        <div className="mt-8 flex flex-col items-center gap-3 lg:mt-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Generador oficial para
          </p>
          <div className="flex items-center gap-5 sm:gap-7 lg:gap-9">
            <Image
              src="/logos/ALZAK_foundation.png"
              alt="ALZAK Foundation"
              width={180}
              height={68}
              className="h-9 w-auto object-contain sm:h-10 lg:h-11"
              priority
            />
            <div className="h-8 w-px bg-slate-200 sm:h-9 lg:h-10" aria-hidden />
            <Image
              src="/logos/alzakgroup.png"
              alt="ALZAK Consulting & Research"
              width={110}
              height={70}
              className="h-9 w-auto object-contain sm:h-10 lg:h-11"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BadgeChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: "slate" | "emerald";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:text-[11px]",
        cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
