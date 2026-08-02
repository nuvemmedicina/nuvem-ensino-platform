import { redirect } from "next/navigation";
import Link from "next/link";
import { Layers, Lock } from "lucide-react";
import { auth } from "@/auth";
import { estruturaParaUsuario, type GrupoResumo } from "@/lib/flashcards";
import { moduleColor } from "@/lib/moduleColors";

/** Card de um grupo que já existe. */
function CardDoGrupo({ grupo, cor }: { grupo: GrupoResumo; cor: string }) {
  return (
    <Link
      href={`/dashboard/flashcards/${grupo.id}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-border bg-surface hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      style={{ borderLeft: `3px solid ${cor}` }}
    >
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden" style={{ backgroundColor: cor }}>
        {grupo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={grupo.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Layers className="absolute inset-0 m-auto w-7 h-7 text-white/50" />
        )}
        <span className="absolute top-2 right-2 font-sans text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/55 text-white backdrop-blur-sm">
          {grupo.cards} card{grupo.cards !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="px-3 py-2.5">
        <h3 className="font-sans text-[13px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {grupo.title}
        </h3>
      </div>
    </Link>
  );
}

/** Lugar reservado do tópico que ainda não tem flashcards. */
function CardVazio({ titulo, cor }: { titulo: string; cor: string }) {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border border-dashed border-border/70 bg-background/40"
      style={{ borderLeft: `3px solid ${cor}33` }}
    >
      <div className="relative aspect-[16/9] shrink-0 flex items-center justify-center" style={{ backgroundColor: `${cor}0d` }}>
        <Lock className="w-5 h-5" style={{ color: `${cor}66` }} />
      </div>
      <div className="px-3 py-2.5">
        <h3 className="font-sans text-[13px] font-medium text-muted/70 leading-snug line-clamp-2">{titulo}</h3>
        <p className="font-sans text-[10px] text-muted/50 mt-0.5">em breve</p>
      </div>
    </div>
  );
}

export default async function FlashcardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/flashcards");

  const role = (session.user as { role?: string }).role;
  const { cursos, gerais } = await estruturaParaUsuario(session.user.id, role);

  const temAlgumaCoisa =
    gerais.length > 0 ||
    cursos.some((c) => c.soltos.length > 0 || c.modulos.some((m) => m.topicos.length > 0));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-serif text-3xl font-light text-foreground">Flashcards</h1>
      <p className="font-sans text-sm text-muted mt-1 mb-10">
        Revise os pontos principais dos seus cursos, um card por vez.
      </p>

      {!temAlgumaCoisa && (
        <div className="border border-border rounded-2xl px-6 py-16 text-center">
          <Layers className="w-8 h-8 text-muted/40 mx-auto mb-3" />
          <p className="font-sans text-sm text-muted">
            Ainda não há flashcards disponíveis para os seus cursos.
          </p>
        </div>
      )}

      {cursos.map((curso) => (
        <section key={curso.id} className="mb-14">
          <h2 className="font-serif text-xl font-light text-foreground mb-6">{curso.title}</h2>

          {curso.modulos.map((modulo) => {
            const cor = moduleColor(modulo.indice);
            if (modulo.topicos.length === 0) return null;

            const prontos = modulo.topicos.filter((t) => t.grupo).length;

            return (
              <div key={modulo.id} className="mb-8">
                {/* Cabeçalho do módulo, na cor dele */}
                <div
                  className="flex items-center gap-3 rounded-lg px-3 py-2 mb-3 border"
                  style={{ backgroundColor: cor.tint, borderColor: cor.border }}
                >
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-md font-sans text-[11px] font-bold text-white shrink-0"
                    style={{ backgroundColor: cor.accent }}
                  >
                    {modulo.indice + 1}
                  </span>
                  <h3 className="font-sans text-sm font-semibold flex-1 min-w-0 truncate" style={{ color: cor.accent }}>
                    {modulo.title}
                  </h3>
                  <span className="font-sans text-[11px] tabular-nums shrink-0" style={{ color: cor.accent, opacity: 0.7 }}>
                    {prontos}/{modulo.topicos.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {modulo.topicos.map((topico) =>
                    topico.grupo ? (
                      <CardDoGrupo key={topico.id} grupo={topico.grupo} cor={cor.accent} />
                    ) : (
                      <CardVazio key={topico.id} titulo={topico.title} cor={cor.accent} />
                    ),
                  )}
                </div>
              </div>
            );
          })}

          {curso.soltos.length > 0 && (
            <div className="mb-8">
              <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Sem tópico definido
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {curso.soltos.map((g) => (
                  <CardDoGrupo key={g.id} grupo={g} cor="#8b8b8b" />
                ))}
              </div>
            </div>
          )}
        </section>
      ))}

      {gerais.length > 0 && (
        <section className="mb-14">
          <h2 className="font-serif text-xl font-light text-foreground mb-6">Material geral</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {gerais.map((g) => (
              <CardDoGrupo key={g.id} grupo={g} cor="#8b8b8b" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
