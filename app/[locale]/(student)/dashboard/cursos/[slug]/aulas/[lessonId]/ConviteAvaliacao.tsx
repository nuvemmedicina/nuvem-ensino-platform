import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";

/**
 * Convite que aparece quando o aluno fecha um módulo. É a resposta ao gargalo
 * real da avaliação: o formulário existia, mas só chegava nele quem procurasse
 * a página. Some assim que a pessoa avalia.
 */
export function ConviteAvaliacao({
  courseSlug,
  moduloTitulo,
}: {
  courseSlug: string;
  moduloTitulo: string;
}) {
  const rotulo = moduloTitulo.split(/\s+[—–-]\s+/)[0].trim() || moduloTitulo;

  return (
    <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/8 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
        <Star className="w-5 h-5 text-amber-600" fill="currentColor" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-semibold text-foreground">
          Você concluiu o {rotulo}. Conta como foi?
        </p>
        <p className="font-sans text-sm text-muted mt-0.5">
          Leva um minuto e ajuda a melhorar as próximas aulas. Você avalia o curso e cada
          professor separadamente.
        </p>
      </div>

      <Link
        href={`/dashboard/cursos/${courseSlug}/avaliacao`}
        className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 font-sans text-sm font-bold px-5 py-3 sm:py-2.5 rounded-full bg-amber-400 text-amber-900 hover:bg-amber-300 transition-colors"
      >
        Avaliar
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
