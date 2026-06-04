import LoginButton from "./login-button";
import { LoginHero } from "@/components/login/login-hero";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-slate-50 lg:grid-cols-[3fr_2fr] xl:grid-cols-[5fr_3fr]">
      <LoginHero className="lg:min-h-screen" />

      <section className="relative flex items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        {/* Orbes decorativos detrás del glass */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 -right-12 h-72 w-72 rounded-full bg-slate-300/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-1/4 -left-16 h-64 w-64 rounded-full bg-slate-400/10 blur-3xl"
        />

        {/* Glass card */}
        <div className="relative w-full max-w-md rounded-xl border border-white/60 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 backdrop-blur-xl backdrop-saturate-150 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Accede con tu cuenta corporativa de Google
            </p>
          </div>

          <LoginButton />

          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <p className="text-center text-[11px] leading-relaxed text-slate-500">
              Solo cuentas <b className="text-slate-700">@alzakfoundation.org</b>
              <br />
              ALZAK Foundation · Uso interno
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
