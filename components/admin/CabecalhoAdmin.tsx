import type { LucideIcon } from "lucide-react";

type Destaque = { rotulo: string; valor: React.ReactNode; tom?: "normal" | "alerta" | "ok" };

/**
 * Cabeçalho das páginas do admin no estilo da nova área do aluno: faixa em
 * degradê no petróleo da marca, título em serifa, números de destaque em
 * pílulas e as ações à direita. Usado em todas as páginas de listagem do
 * admin para que tenham a mesma cara.
 */
export function CabecalhoAdmin({
  titulo,
  subtitulo,
  icone: Icone,
  destaques = [],
  acoes,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  icone?: LucideIcon;
  destaques?: Destaque[];
  /** Botões e links à direita; use as classes de `botaoCabecalho`. */
  acoes?: React.ReactNode;
}) {
  return (
    <header
      className="relative overflow-hidden rounded-3xl px-6 sm:px-8 py-7 mb-8 text-white"
      style={{ background: "linear-gradient(135deg, #00475E 0%, color-mix(in srgb, #00475E 55%, black) 100%)" }}
    >
      <div aria-hidden="true" className="absolute -right-14 -top-24 w-72 h-72 rounded-full bg-white/10" />
      <div aria-hidden="true" className="absolute right-40 -bottom-24 w-48 h-48 rounded-full bg-white/[0.06]" />
      {Icone && <Icone aria-hidden="true" className="absolute right-8 bottom-6 w-16 h-16 text-white/10" />}

      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2 min-w-0 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium leading-tight">{titulo}</h1>
          {subtitulo && <p className="font-sans text-sm text-white/75">{subtitulo}</p>}
          {destaques.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {destaques.map((d) => (
                <span
                  key={d.rotulo}
                  className={`inline-flex items-baseline gap-1.5 font-sans text-xs px-3 py-1.5 rounded-full ${
                    d.tom === "alerta" ? "bg-amber-400 text-amber-950" : d.tom === "ok" ? "bg-white text-[#00475E]" : "bg-white/15 text-white"
                  }`}
                >
                  <strong className="font-bold tabular-nums">{d.valor}</strong>
                  <span className={d.tom ? "" : "text-white/80"}>{d.rotulo}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {acoes && <div className="relative flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
    </header>
  );
}

/** Botão principal sobre a faixa (fundo branco). */
export const botaoCabecalho =
  "inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-white text-[#00475E] font-sans text-sm font-semibold hover:bg-white/90 transition-colors";
/** Botão secundário sobre a faixa (contorno branco). */
export const botaoCabecalhoSecundario =
  "inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-white/40 text-white font-sans text-sm font-semibold hover:bg-white/10 transition-colors";
