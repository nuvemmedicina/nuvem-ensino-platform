import Link from "next/link";
import { Gamepad2 } from "lucide-react";

/**
 * Convite para o jogo de casos clínicos de interpretação de testes
 * respiratórios (H₂/CH₄) — feito por Rafael, filho da Dra. Vera, para este
 * curso. Mostrado sempre, independente do módulo de prova liberado, porque
 * é uma ferramenta de treino livre, não presa ao currículo.
 */
export function RespiratoryGameInvite({ slug }: { slug: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <Link
        href={`/dashboard/cursos/${slug}/jogo`}
        className="px-5 py-4 flex items-center gap-4 hover:bg-accent/10 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/40 flex items-center justify-center shrink-0">
          <Gamepad2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
            Jogo de casos clínicos
          </p>
          <p className="font-sans text-sm text-foreground">Treine a interpretação de SIBO, IMO e intolerâncias</p>
          <p className="font-sans text-xs text-muted mt-0.5">
            Arraste os cartões, leia a curva de H₂/CH₄ e receba feedback caso a caso — banco de 30 casos.
          </p>
        </div>
      </Link>
    </div>
  );
}
