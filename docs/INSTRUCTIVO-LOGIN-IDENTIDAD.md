# Instructivo de diseño — Login + Identidad visual

> **Para qué sirve este documento**
> Replicar la identidad visual y la pantalla de login de **ALZAK Docs Gen** en otra aplicación Next.js (caso de uso original: una app que genera actas a partir de resúmenes de Gemini). Está escrito para que un dev (o un asistente AI) lo pueda aplicar paso a paso sin tener acceso al repo original.

---

## 0. Stack base obligatorio

La identidad asume este stack. Si tu app usa otro, adapta los snippets pero mantén las decisiones.

| Tecnología | Versión sugerida | Por qué |
|---|---|---|
| **Next.js** | 14 (App Router) | Server Components + Server Actions |
| **TypeScript** | 5+ | obligatorio para los snippets |
| **Tailwind CSS** | 3.4+ | toda la UI usa utilidades + custom theme |
| **tailwindcss-animate** | 1.0+ | `animate-in`, `slide-in-from-*`, etc. |
| **lucide-react** | 0.46+ | íconos consistentes |
| **lottie-react** | 2.4+ | animación del hero |
| **shadcn/ui primitives** | última | `Button`, `Input`, `Label` |

Instalación:
```bash
npm install next react react-dom typescript tailwindcss tailwindcss-animate \
  lucide-react lottie-react clsx tailwind-merge class-variance-authority \
  @radix-ui/react-label @radix-ui/react-slot
```

---

## 1. Identidad visual

### 1.1 Paleta de colores

Añadir al `tailwind.config.ts` bajo `theme.extend.colors`:

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        alzak: {
          DEFAULT: "#0B2A5B",   // azul corporativo profundo → primary
          deep:    "#071D40",   // azul casi negro → headers oscuros
          accent:  "#1E5BA8",   // azul medio → links, foco
          soft:    "#EAF1FB",   // azul muy claro → fondos suaves
          teal:    "#14B8A6",   // acento teal → DECORACIÓN (bordes, fondos)
          tealDeep:"#0F766E",   // teal oscuro → TEXTO sobre fondos claros (WCAG AA)
          tealSoft:"#CCFBF1",   // teal muy claro → fondos sutiles
          foundation:"#7BC043", // verde de marca (si aplica)
          group:   "#1E5BA8",   // azul de marca alternativo
          ok:      "#10B981",   // estados positivos
          warn:    "#F59E0B",   // estados pendientes
          danger:  "#E11D48",   // estados rechazados
        },
      },
    },
  },
}
```

**Regla crítica de accesibilidad**:
- `text-alzak-teal` (#14B8A6) sobre blanco da contraste 2.5:1 → **falla WCAG AA**.
- Para **texto** usa siempre `text-alzak-tealDeep` (#0F766E) → 6.4:1 → AA ✓.
- Reserva `text-alzak-teal` y `bg-alzak-teal` solo para decoración (íconos, bordes, blobs).

### 1.2 Tipografía

Inter desde Google Fonts via `next/font`:

```ts
// src/app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// En el html:
<html lang="es-CO" className={inter.variable}>
  <body className="min-h-screen bg-slate-50 font-sans">{children}</body>
</html>
```

Y en `tailwind.config.ts`:
```ts
extend: {
  fontFamily: {
    sans: ["var(--font-inter)", "system-ui", "sans-serif"],
  },
}
```

### 1.3 Border-radius

| Nivel | Token | Uso |
|---|---|---|
| Botones, inputs, chips | `rounded-md` (6px) | controles |
| Cards, paneles | `rounded-xl` (12px) | enterprise SaaS feel |
| Modales | `rounded-2xl` (16px) | callouts importantes |
| Avatares, badges | `rounded-full` | circulares |

> 🎨 **Filosofía**: `rounded-xl` para el card principal del form. Más cerrado que `rounded-2xl` ya es "consumer", más abierto pierde formalidad enterprise.

### 1.4 Sombras

| Uso | Clase |
|---|---|
| Card del form (login) | `shadow-[0_8px_30px_rgba(11,42,91,0.08)]` con `ring-1 ring-slate-200/60` |
| Cards generales | `shadow-sm` con hover `shadow-md` |
| Modales | `shadow-2xl` |

---

## 2. Animaciones globales

Añadir al `tailwind.config.ts → theme.extend.keyframes` y `animation`:

```ts
keyframes: {
  // Aurora: 3 blobs que se desplazan, escalan y rotan con timings distintos
  "aurora-1": {
    "0%, 100%": { transform: "translate(0, 0) scale(1) rotate(0deg)" },
    "25%": { transform: "translate(12%, -6%) scale(1.15) rotate(8deg)" },
    "50%": { transform: "translate(18%, -2%) scale(1.25) rotate(15deg)" },
    "75%": { transform: "translate(8%, 4%) scale(1.1) rotate(8deg)" },
  },
  "aurora-2": {
    "0%, 100%": { transform: "translate(0, 0) scale(1) rotate(0deg)" },
    "33%": { transform: "translate(-10%, 8%) scale(1.12) rotate(-10deg)" },
    "66%": { transform: "translate(-14%, 12%) scale(1.2) rotate(-18deg)" },
  },
  "aurora-3": {
    "0%, 100%": { transform: "translate(0, 0) scale(1) rotate(0deg)" },
    "25%": { transform: "translate(8%, 10%) scale(1.15) rotate(12deg)" },
    "50%": { transform: "translate(-4%, -8%) scale(0.92) rotate(-8deg)" },
    "75%": { transform: "translate(6%, 4%) scale(1.08) rotate(6deg)" },
  },
},
animation: {
  "aurora-1": "aurora-1 18s ease-in-out infinite",
  "aurora-2": "aurora-2 22s ease-in-out infinite",
  "aurora-3": "aurora-3 26s ease-in-out infinite",
},
```

> Tiempos **primos relativos** (18, 22, 26) — los blobs nunca repiten el mismo patrón → se siente orgánico.

Plus el plugin `tailwindcss-animate` aporta `animate-in fade-in`, `slide-in-from-top-1`, `zoom-in-95`, etc.

---

## 3. Login — anatomía completa

### 3.1 Layout responsive

| Breakpoint | Estructura |
|---|---|
| Mobile (< 640px) | Stack vertical: hero arriba (compacto), form abajo |
| sm-md (640-1023px) | Stack vertical pero hero más grande |
| lg (≥ 1024px) | 2 columnas **60% hero / 40% form** (`grid-cols-[3fr_2fr]`) |
| xl (≥ 1280px) | 2 columnas **62.5% / 37.5%** (`grid-cols-[5fr_3fr]`) |

```tsx
<main className="grid min-h-screen grid-cols-1 bg-slate-50 lg:grid-cols-[3fr_2fr] xl:grid-cols-[5fr_3fr]">
  <LoginHero className="lg:min-h-screen" />
  <section className="relative flex items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
    {/* Form glass card aquí */}
  </section>
</main>
```

### 3.2 Panel izquierdo (LoginHero)

Capas, de fondo a frente:

1. **Dot grid pattern** (estático, sutil)
2. **3 blobs de aurora** animados con `motion-safe:animate-aurora-{1,2,3}`
3. **Grano SVG** (textura, 1.5% opacity)
4. **Spotlight follow-mouse** (cuando hover)
5. **Contenido**: kicker → título → tagline con TextRotator → mockup → trust badges → logos

```tsx
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function LoginHero({ className }: { className?: string }) {
  function handleSectionMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
    e.currentTarget.style.setProperty("--spotlight-opacity", "1");
  }
  function handleSectionMouseLeave(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.setProperty("--spotlight-opacity", "0");
  }

  return (
    <section
      className={cn(
        "group/hero relative flex flex-col items-center justify-center overflow-hidden bg-white px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-12",
        className,
      )}
      onMouseMove={handleSectionMouseMove}
      onMouseLeave={handleSectionMouseLeave}
    >
      {/* 1. Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(11,42,91,0.07) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* 2. 4 blobs de aurora */}
      <div
        aria-hidden
        className="absolute -top-40 -left-40 h-[80%] w-[80%] rounded-full opacity-80 blur-3xl motion-safe:animate-aurora-1"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.45) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute -top-32 -right-40 h-[75%] w-[75%] rounded-full opacity-60 blur-3xl motion-safe:animate-aurora-2"
        style={{ background: "radial-gradient(circle, rgba(11,42,91,0.38) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 left-1/4 h-[80%] w-[80%] rounded-full opacity-60 blur-3xl motion-safe:animate-aurora-3"
        style={{ background: "radial-gradient(circle, rgba(30,91,168,0.38) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute top-1/4 right-0 h-[60%] w-[60%] rounded-full opacity-50 blur-3xl motion-safe:animate-aurora-1"
        style={{
          background: "radial-gradient(circle, rgba(204,251,241,0.55) 0%, transparent 70%)",
          animationDelay: "-8s",
        }}
      />

      {/* 3. Grano */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* 4. Spotlight follow-mouse */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--spotlight-opacity, 0)",
          background:
            "radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(20,184,166,0.18) 0%, transparent 50%)",
        }}
      />

      {/* 5. Contenido */}
      <div className="relative flex w-full max-w-2xl flex-col items-center animate-in fade-in duration-500">
        {/* Kicker chip */}
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-alzak-teal/30 bg-alzak-tealSoft/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-alzak-tealDeep sm:text-[11px]">
          <Zap className="h-3 w-3" />
          {/* CAMBIAR: tu kicker, ej "Generador de actas" */}
          Generador de actas
        </p>

        {/* Título principal */}
        <h2 className="text-3xl font-bold tracking-tight text-alzak sm:text-4xl lg:text-5xl">
          {/* CAMBIAR: nombre de tu app */}
          Mi App
        </h2>

        {/* Tagline con TextRotator */}
        <p className="mx-auto mt-3 flex max-w-md flex-wrap items-baseline justify-center gap-x-1.5 text-sm leading-relaxed text-slate-700 sm:text-base lg:mt-4 lg:text-lg">
          <span>Tu acta lista</span>
          <TextRotator
            phrases={[
              "en minutos",
              "con resumen IA",
              "lista para firmar",
              "sin escribir nada",
            ]}
            className="rounded-md bg-alzak-tealSoft px-2 py-0.5 font-bold text-alzak-tealDeep shadow-sm ring-1 ring-alzak-teal/20"
          />
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 sm:text-sm">
          Resumen Gemini · Plantilla institucional · Firma digital
        </p>

        {/* Mockup flotante (ver sección 3.3) */}
        {/* <MockupDocumento /> */}

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:mt-8">
          <BadgeChip icon={ShieldCheck} label="Datos cifrados" color="teal" />
          <BadgeChip icon={CheckCircle2} label="Verificado" color="ok" />
          <BadgeChip icon={Zap} label="Resumen IA" color="accent" />
        </div>

        {/* Trust bar logos */}
        <div className="mt-6 flex flex-col items-center gap-2 lg:mt-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
            {/* CAMBIAR */}
            Generador oficial para
          </p>
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
            <Image src="/logos/logo-1.png" alt="..." width={140} height={56} className="h-9 w-auto sm:h-10 lg:h-12 object-contain" unoptimized priority />
            <div className="h-7 w-px bg-slate-300 sm:h-9 lg:h-10" aria-hidden />
            <Image src="/logos/logo-2.png" alt="..." width={140} height={56} className="h-9 w-auto sm:h-10 lg:h-12 object-contain" unoptimized priority />
          </div>
        </div>
      </div>
    </section>
  );
}

function BadgeChip({ icon: Icon, label, color }: {
  icon: typeof CheckCircle2;
  label: string;
  color: "teal" | "ok" | "accent";
}) {
  const cls = {
    teal:   "border-alzak-teal/30 bg-alzak-tealSoft/40 text-alzak-tealDeep",
    ok:     "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "border-alzak-accent/30 bg-alzak-soft text-alzak-accent",
  }[color];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:text-[11px]", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
```

### 3.3 Mockup flotante con tilt 3D y cross-fade

Si tu app tiene 1+ formatos de documento, replica este efecto:

- 2 documentos absolutamente posicionados (back y front)
- Cada 4.5 segundos, hacen swap: el de atrás pasa al frente
- Al hover, una tarjeta hace tilt 3D siguiendo el mouse
- Datos anonimizados ("John Doe", "Jane Doe")

```tsx
const INTERVALO_SWAP_MS = 4500;

function MockupDocumento() {
  const [front, setFront] = useState<"a" | "b">("a");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setFront((p) => (p === "a" ? "b" : "a"));
    }, INTERVALO_SWAP_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative h-44 w-full max-w-md sm:h-56 lg:h-80 lg:max-w-xl xl:h-96 xl:max-w-2xl"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <DocCard variant="b" position={front === "b" ? "front" : "back"} />
      <DocCard variant="a" position={front === "a" ? "front" : "back"} />
    </div>
  );
}

function DocCard({ variant, position }: { variant: "a" | "b"; position: "front" | "back" }) {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.setProperty("--tilt-x", `${nx * 12}deg`);
    e.currentTarget.style.setProperty("--tilt-y", `${ny * -10}deg`);
    e.currentTarget.style.setProperty("--lift", "1");
  }
  function handleMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.setProperty("--tilt-x", "0deg");
    e.currentTarget.style.setProperty("--tilt-y", "0deg");
    e.currentTarget.style.setProperty("--lift", "0");
  }

  const transformBase = position === "front"
    ? "translate(0,0) rotate(1deg) scale(1)"
    : "translate(12px,12px) rotate(-3deg) scale(0.96)";

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group/card absolute h-full w-full overflow-hidden rounded-lg border bg-white p-3 sm:p-4 lg:p-5 border-slate-200 hover:border-alzak-teal/40 transition-[border-color] duration-300",
        position === "front" ? "z-10" : "z-0",
      )}
      style={{
        transformStyle: "preserve-3d",
        transform: `${transformBase} rotateY(var(--tilt-x, 0deg)) rotateX(var(--tilt-y, 0deg)) translateZ(calc(var(--lift, 0) * 12px))`,
        opacity: position === "front" ? 1 : 0.5,
        boxShadow: position === "front"
          ? "0 20px 50px -10px rgba(11,42,91,calc(0.20 + var(--lift,0)*0.10)), 0 0 0 calc(var(--lift,0)*3px) rgba(20,184,166,calc(var(--lift,0)*0.25))"
          : "0 8px 24px -6px rgba(11,42,91,0.12)",
        transition: "transform 200ms ease-out, opacity 700ms ease-out, box-shadow 300ms ease-out",
        willChange: "transform",
      }}
    >
      {/* Shine sweep en hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-full top-0 z-20 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-1000 ease-out group-hover/card:left-full"
      />
      {/* AQUÍ va el mockup específico de tu documento — para la app de actas
          puedes renderizar un esqueleto simplificado del acta con datos demo
          (encabezado, cuerpo "asistentes:", resumen IA, firmas). */}
      <DocumentoEsqueleto variant={variant} />
    </div>
  );
}
```

### 3.4 TextRotator (slot machine vertical)

Componente reutilizable para el tagline. Las frases rotan verticalmente con cubic-bezier.

```tsx
"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  phrases: string[];
  intervalMs?: number;
  className?: string;
}

export function TextRotator({ phrases, intervalMs = 2800, className }: Props) {
  const [idx, setIdx] = useState(0);
  const [transitionOn, setTransitionOn] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => i + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  // Snap invisible al wraparound (loop continuo)
  useEffect(() => {
    if (idx !== phrases.length) return;
    const t = setTimeout(() => {
      setTransitionOn(false);
      setIdx(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionOn(true));
      });
    }, 700);
    return () => clearTimeout(t);
  }, [idx, phrases.length]);

  const longest = phrases.reduce((a, b) => (a.length > b.length ? a : b));
  const strip = [...phrases, phrases[0]];

  return (
    <span className={cn("relative inline-flex items-center align-baseline", className)}>
      <span className="relative inline-block overflow-hidden" style={{ lineHeight: "1.3em", height: "1.3em" }}>
        <span className="invisible block whitespace-nowrap">{longest}</span>
        <span
          className="absolute left-0 top-0 flex flex-col"
          style={{
            transform: `translateY(-${idx * 1.3}em)`,
            transition: transitionOn ? "transform 700ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        >
          {strip.map((phrase, i) => (
            <span
              key={i}
              className="block whitespace-nowrap"
              style={{ lineHeight: "1.3em", height: "1.3em" }}
            >
              {phrase}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
```

### 3.5 Panel derecho — Glass card del form

```tsx
<section className="relative flex items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
  {/* Orbes decorativos detrás del glass */}
  <div aria-hidden className="pointer-events-none absolute top-1/4 -right-12 h-72 w-72 rounded-full bg-alzak-teal/8 blur-3xl" />
  <div aria-hidden className="pointer-events-none absolute bottom-1/4 -left-16 h-64 w-64 rounded-full bg-alzak/6 blur-3xl" />

  {/* Glass card */}
  <div className="relative w-full max-w-md rounded-xl border border-white/60 bg-white/85 p-6 shadow-[0_8px_30px_rgba(11,42,91,0.08)] ring-1 ring-slate-200/60 backdrop-blur-xl backdrop-saturate-150 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="mb-6">
      <h1 className="text-xl font-bold tracking-tight text-alzak">Iniciar sesión</h1>
      <p className="mt-0.5 text-xs text-slate-500">Subtítulo descriptivo</p>
    </div>

    {/* AQUÍ va tu form: inputs, botones, links */}

    {/* Footer con links externos opcionales */}
    <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
      <p className="text-center text-[11px] text-slate-500">Texto legal o copyright.</p>
      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
        <a href="https://tuapp.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition hover:text-alzak">
          tuapp.com
        </a>
      </div>
    </div>
  </div>
</section>
```

### 3.6 Inputs del form con detalles UX

Patrón estándar para email + password:

- **Email**: input con icono `Mail` a la izquierda (`pl-9`)
- **Password**: input con toggle ojo (`Eye`/`EyeOff`) a la derecha + detector de Caps Lock
- **Submit**: botón con `Loader2 animate-spin` cuando enviando + icono que se desplaza al hover (`group-hover:translate-x-0.5`)

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Email */}
  <div className="space-y-2">
    <Label htmlFor="email">Correo electrónico</Label>
    <div className="relative">
      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        autoFocus
        className="pl-9"
      />
    </div>
  </div>

  {/* Password */}
  <div className="space-y-2">
    <Label htmlFor="password">Contraseña</Label>
    <div className="relative">
      <Input
        id="password"
        type={mostrarPwd ? "text" : "password"}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={detectarCapsLock}
        onKeyUp={detectarCapsLock}
        onBlur={() => setCapsLock(false)}
        autoComplete="current-password"
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setMostrarPwd((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-alzak"
        aria-label={mostrarPwd ? "Ocultar" : "Mostrar"}
        tabIndex={-1}
      >
        {mostrarPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    {capsLock && (
      <p className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-800 animate-in fade-in slide-in-from-top-1 duration-150">
        <ArrowUp className="h-3 w-3" />
        Bloq Mayús está activado
      </p>
    )}
  </div>

  {/* Botón submit con loader */}
  <Button type="submit" className="group w-full gap-1.5" disabled={enviando}>
    {enviando ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Ingresando…
      </>
    ) : (
      <>
        <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        Ingresar
      </>
    )}
  </Button>
</form>

// Helper para Caps Lock
function detectarCapsLock(e: React.KeyboardEvent<HTMLInputElement>) {
  if (typeof e.getModifierState === "function") {
    setCapsLock(e.getModifierState("CapsLock"));
  }
}
```

### 3.7 Aurora Lottie (opcional)

Si quieres una animación Lottie en algún lado (ej. abajo del título), lazy-load el JSON desde `/public/lottie/`:

```tsx
"use client";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export function LottieAnimacion({ src }: { src: string }) {
  const [data, setData] = useState<unknown | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(src).then((r) => r.json()).then((j) => { if (alive) setData(j); }).catch(() => {});
    return () => { alive = false; };
  }, [src]);

  return (
    <div className="h-32 w-full sm:h-40 lg:h-72">
      {data ? (
        <Lottie animationData={data} loop autoplay className="h-full w-full" />
      ) : (
        <div className="h-full w-full animate-pulse rounded-xl bg-white/40" />
      )}
    </div>
  );
}
```

Y **importante**: si tu middleware bloquea rutas, exenta `/lottie/*` para que el JSON se sirva como asset estático sin auth.

---

## 4. CSS global (`globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 9999px;
  }
}
```

---

## 5. Archivos clave a crear / copiar

```
src/
├── app/
│   ├── layout.tsx                  ← Inter font + body classes
│   ├── globals.css                 ← @tailwind + utilities
│   └── login/
│       └── page.tsx                ← LoginForm con grid 3fr/2fr
├── components/
│   ├── login/
│   │   ├── LoginHero.tsx           ← Panel izquierdo completo
│   │   └── TextRotator.tsx         ← Slot machine vertical
│   └── ui/
│       ├── button.tsx              ← shadcn primitive
│       ├── input.tsx               ← shadcn primitive
│       └── label.tsx               ← shadcn primitive
├── lib/
│   └── utils.ts                    ← cn() helper (clsx + tailwind-merge)
public/
├── logos/                          ← tus 2 logos institucionales
└── lottie/                         ← opcional, JSON de animación
tailwind.config.ts                  ← colors + keyframes + animation
```

---

## 6. Adaptación a tu app de actas (cambios concretos)

| Elemento | ALZAK Docs Gen | Tu app de actas |
|---|---|---|
| Título principal | "ALZAK Docs Gen" | "Actas Gen" (o tu nombre) |
| Kicker chip | "Generador de cuentas de cobro" | "Generador de actas con IA" |
| Tagline frases (TextRotator) | "lista en minutos", "validada al instante", "firmada digitalmente", "aprobada en 24 h", "con tu firma escaneada" | "lista en minutos", "con resumen IA", "lista para firmar", "auto-generada", "sin escribir nada" |
| Subtítulo | "Código único · Validación FR-CC-001 · Firma digital" | "Resumen Gemini · Plantilla institucional · Firma digital" |
| Trust badges | SGC certificado · Datos cifrados · Aprobación 24h | Cifrado AES · Resumen IA · Editable |
| Mockup interior | Plantilla cuenta de cobro (FR-CC-001) | Esqueleto de acta: encabezado, asistentes, resumen IA, firmas |
| Logos institucionales | ALZAK Foundation + Consulting | Los tuyos |
| Footer link | alzakfoundation.org · alzak.com.co | tu dominio |
| Botón submit | `Ingresar` + icon LogIn | Lo mismo o adaptado |

---

## 7. Decisiones UX clave (mantener)

| Decisión | Por qué |
|---|---|
| **Layout 60/40 a favor del hero en desktop** | El hero es marketing; el form es funcional. Más espacio al primero. |
| **Mobile-first** | En móvil el form es lo único que importa, hero compacto arriba. |
| **CSS variables para mouse tracking** | No causa re-render React por cada `mousemove` (60+/seg). El navegador interpola en GPU. |
| **`motion-safe:` prefix en aurora** | Respeta `prefers-reduced-motion` para usuarios con vestíbulo sensible. |
| **`aria-hidden` en decoraciones** | Screen readers ignoran blobs, mockup, grano, etc. |
| **TextRotator con duplicate-at-end** | El loop infinito sin flash al wraparound (snap invisible con `requestAnimationFrame`). |
| **Glass card con `bg-white/85` + `backdrop-blur-xl`** | Más premium que un card blanco sólido; deja ver los orbes detrás. |
| **`rounded-xl` en card vs `rounded-2xl`** | Más "enterprise" — al estilo Linear/Stripe; `rounded-2xl` es más "consumer". |
| **Eye toggle con `tabIndex={-1}`** | No rompe el tab order del formulario. |
| **Loader inline en submit button** | `Loader2 className="animate-spin"` justo donde estaba el icono original. |

---

## 8. Pasos de implementación (checklist)

```
[ ] Instalar dependencias (sección 0)
[ ] Configurar tailwind.config.ts: colors + keyframes + animation + font-family
[ ] Configurar src/app/globals.css con @tailwind + utilities
[ ] Configurar src/app/layout.tsx con Inter font
[ ] Crear src/lib/utils.ts con cn() helper
[ ] Instalar shadcn primitives: button, input, label (npx shadcn-ui@latest add ...)
[ ] Crear src/components/login/TextRotator.tsx (copy de sección 3.4)
[ ] Crear src/components/login/LoginHero.tsx (copy de sección 3.2 + 3.3)
[ ] Crear src/app/login/page.tsx con el layout grid + form (sección 3.5 + 3.6)
[ ] Adaptar textos según sección 6
[ ] Poner tus logos en /public/logos/
[ ] (Opcional) Poner Lottie JSON en /public/lottie/
[ ] Probar en mobile, tablet, desktop, hover, sin movimiento (prefers-reduced-motion)
[ ] Verificar contraste de texto: usa text-alzak-tealDeep para teal, NUNCA text-alzak-teal
```

---

## 9. Captura de los detalles que NO son obvios

Cosas que parecen "porque sí" pero tienen razón:

- **El mockup tiene `perspective: "1200px"` en el contenedor, no en la card** — sin esto, `rotateY/rotateX` no se ven 3D.
- **`transformStyle: preserve-3d`** en la card permite el efecto de profundidad.
- **`willChange: transform`** promueve la card a su propia capa GPU → animación buttery smooth.
- **Sombra dinámica con `calc()` y `var(--lift)`** — la sombra crece cuando lift=1, refuerza "se eleva".
- **El TextRotator necesita un placeholder invisible con la frase más larga** — sino el ancho cambia cada vez que cambia la palabra y rebota todo el párrafo.
- **El spotlight usa `pointer-events-none`** para que no interfiera con clicks en el contenido detrás.
- **La aurora animación tiene 4 blobs con animation-delay distintos** — para que no estén sincronizados y se sienta orgánico.

---

## 10. Si tu app NO requiere login (caso Gemini API)

Si tu app de actas no tiene autenticación por usuario (porque solo usa Gemini API key del backend), igual puedes usar esta identidad:

- **Cambia `/login` por `/comenzar`** — misma pantalla, mismo hero, pero el form es un solo botón "Empezar" o un input simple para que el usuario describa su acta.
- **Quita el toggle "Contraseña / Enlace mágico"** — ya no aplica.
- **Quita el campo password y el detector de Caps Lock** — no son relevantes.
- **El botón submit redirige a la pantalla principal de generación.**
- **Mantén TODO el hero igual** — es lo que da identidad.

---

## 11. Referencias y créditos

- **Diseño base**: inspirado en Linear, Stripe, Vercel (mesh aurora + glass cards)
- **Lottie**: opcional, integrado con `lottie-react`
- **Animaciones CSS**: keyframes custom + `tailwindcss-animate` para enter/exit
- **shadcn/ui**: primitivas accesibles + Radix UI bajo el capó
- **Paleta**: derivada del manual de marca ALZAK (azul corporativo + teal de Foundation)

Si necesitas que afine algo de este instructivo (ej. añadir variantes, exportar como Storybook, dar también el código del botón emisor externo, etc.), pídelo.
