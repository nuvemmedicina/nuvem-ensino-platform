"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

function EntrarForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    errorParam === "CredentialsSignin" ? "Email ou senha incorretos." : ""
  );
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: form.get("email") as string,
        password: form.get("password") as string,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha incorretos.");
      } else {
        window.location.href = callbackUrl;
      }
    });
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl });
  }

  return (
    <div
      className="rounded-2xl border border-white/10 p-8"
      style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
    >
      <h1 className="font-serif text-3xl font-light text-white mb-1">Entrar</h1>
      <p className="font-sans text-sm text-white/50 mb-8">
        Acesse sua conta para continuar.
      </p>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 font-sans text-sm font-medium px-4 py-3 rounded-xl border border-white/15 text-white/80 hover:border-white/30 hover:text-white transition-all mb-6"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="font-sans text-xs text-white/30">ou</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-sans text-xs font-medium text-white/60">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="font-sans text-xs font-medium text-white/60">
              Senha
            </label>
            <Link
              href="/esqueci-senha"
              className="font-sans text-xs text-accent/70 hover:text-accent transition-colors"
            >
              Esqueceu?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              aria-label="Ver senha"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="font-sans text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold px-4 py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent-light disabled:opacity-60 transition-colors mt-1"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Entrar
        </button>
      </form>

      <p className="font-sans text-xs text-white/40 text-center mt-6">
        Não tem uma conta?{" "}
        <Link href="/cadastro" className="text-accent/80 hover:text-accent transition-colors">
          Criar conta
        </Link>
      </p>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <div className="w-full max-w-sm">
      <Suspense fallback={<div className="rounded-2xl border border-white/10 p-8 h-96 animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />}>
        <EntrarForm />
      </Suspense>
    </div>
  );
}
