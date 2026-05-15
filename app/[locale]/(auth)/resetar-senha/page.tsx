"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

function ResetarSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Erro ao redefinir senha.");
        return;
      }

      setSuccess(true);
      // Redireciona para login após 2s
      setTimeout(() => router.push("/entrar?reset=1"), 2000);
    });
  }

  if (!token) {
    return (
      <p className="font-sans text-sm text-red-400 text-center">
        Link inválido.{" "}
        <Link href="/esqueci-senha" className="underline text-accent/80">
          Solicitar novo link
        </Link>
      </p>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-light text-white mb-2">Senha redefinida!</h1>
          <p className="font-sans text-sm text-white/50">
            Sua senha foi alterada com sucesso. Redirecionando para o login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-serif text-3xl font-light text-white mb-1">Nova senha</h1>
      <p className="font-sans text-sm text-white/50 mb-8">
        Digite e confirme sua nova senha abaixo.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nova senha */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="font-sans text-xs font-medium text-white/60">
            Nova senha
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
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

        {/* Confirmar senha */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="font-sans text-xs font-medium text-white/60">
            Confirmar nova senha
          </label>
          <div className="relative">
            <input
              id="confirm"
              name="confirm"
              type={showConfirm ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Repita a senha"
              className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              aria-label="Ver senha"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          Salvar nova senha
        </button>
      </form>

      <p className="font-sans text-xs text-white/40 text-center mt-6">
        <Link href="/entrar" className="text-accent/80 hover:text-accent transition-colors">
          Voltar ao login
        </Link>
      </p>
    </>
  );
}

export default function ResetarSenhaPage() {
  return (
    <div className="w-full max-w-sm">
      <div
        className="rounded-2xl border border-white/10 p-8"
        style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
      >
        <Suspense fallback={<div className="h-64 animate-pulse" />}>
          <ResetarSenhaForm />
        </Suspense>
      </div>
    </div>
  );
}
