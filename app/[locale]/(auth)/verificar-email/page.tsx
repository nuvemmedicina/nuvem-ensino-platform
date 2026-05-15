"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type State = "loading" | "success" | "error";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Token não encontrado. Verifique o link recebido por e-mail.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setState("success");
        } else {
          setState("error");
          setErrorMsg(data.error ?? "Erro ao verificar e-mail.");
        }
      })
      .catch(() => {
        setState("error");
        setErrorMsg("Erro de conexão. Tente novamente.");
      });
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="font-sans text-sm text-white/50">Verificando seu e-mail…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-light text-white mb-2">
            E-mail confirmado!
          </h1>
          <p className="font-sans text-sm text-white/50 leading-relaxed">
            Sua conta está ativa. Acesse o dashboard para começar a estudar.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="mt-2 w-full flex items-center justify-center font-sans text-sm font-semibold px-4 py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent-light transition-colors"
        >
          Ir para o dashboard
        </Link>
      </div>
    );
  }

  // state === "error"
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
        <XCircle className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <h1 className="font-serif text-2xl font-light text-white mb-2">
          Link inválido
        </h1>
        <p className="font-sans text-sm text-white/50 leading-relaxed">{errorMsg}</p>
      </div>
      <div className="flex flex-col gap-3 w-full mt-2">
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center font-sans text-sm font-semibold px-4 py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent-light transition-colors"
        >
          Ir para o dashboard
        </Link>
        <Link
          href="/entrar"
          className="font-sans text-xs text-white/40 hover:text-white/60 text-center transition-colors"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <div className="w-full max-w-sm">
      <div
        className="rounded-2xl border border-white/10 p-8"
        style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
      >
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="font-sans text-sm text-white/50">Carregando…</p>
            </div>
          }
        >
          <VerificarEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
