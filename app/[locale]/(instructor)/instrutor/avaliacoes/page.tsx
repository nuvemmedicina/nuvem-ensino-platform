import { redirect } from "next/navigation";
import { Star, MessageSquareQuote } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

function Estrelas({ nota, tamanho = 16 }: { nota: number; tamanho?: number }) {
  return (
    <span className="inline-flex gap-0.5 align-middle" aria-label={`${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={tamanho}
          height={tamanho}
          strokeWidth={1.5}
          fill={nota >= i - 0.25 ? "#f59e0b" : "none"}
          stroke={nota >= i - 0.25 ? "#f59e0b" : "var(--color-border)"}
        />
      ))}
    </span>
  );
}

export default async function InstrutorAvaliacoesPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/instrutor/avaliacoes");

  const instrutor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instrutor) redirect("/instrutor");

  const notas = await prisma.instructorEvaluation.findMany({
    where: { instructorId: instrutor.id },
    // Sem incluir o aluno: o professor não vê quem respondeu.
    select: { id: true, rating: true, suggestion: true, createdAt: true, course: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  const fmtDate = new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR", {
    month: "long", year: "numeric",
  });

  const media = notas.length ? notas.reduce((s, n) => s + n.rating, 0) / notas.length : 0;
  const comentarios = notas.filter((n) => n.suggestion);

  // Distribuição de 5 a 1 estrela
  const distribuicao = [5, 4, 3, 2, 1].map((estrela) => ({
    estrela,
    quantidade: notas.filter((n) => n.rating === estrela).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">Minhas avaliações</h1>
        <p className="font-sans text-sm text-muted mt-0.5">
          O que os alunos responderam sobre as suas aulas. As respostas chegam sem identificação.
        </p>
      </div>

      {notas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <MessageSquareQuote className="w-8 h-8 text-muted/40 mx-auto mb-3" />
          <p className="font-sans text-sm font-medium text-foreground">Nenhuma avaliação ainda</p>
          <p className="font-sans text-sm text-muted mt-1">
            Assim que os alunos avaliarem o curso, as notas das suas aulas aparecem aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Sua média</p>
              <div className="flex items-baseline gap-2">
                <p className="font-sans text-3xl font-bold text-foreground">
                  {media.toFixed(1).replace(".", ",")}
                </p>
                <span className="font-sans text-sm text-muted">/ 5</span>
              </div>
              <div className="mt-1.5"><Estrelas nota={media} /></div>
              <p className="font-sans text-xs text-muted mt-2">
                {notas.length} avaliação{notas.length !== 1 ? "ões" : ""} de alunos
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Distribuição</p>
              {distribuicao.map((d) => (
                <div key={d.estrela} className="flex items-center gap-2">
                  <span className="font-sans text-xs text-muted w-6 shrink-0 tabular-nums">{d.estrela}★</span>
                  <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${notas.length ? (d.quantidade / notas.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-sans text-xs text-muted w-6 text-right shrink-0 tabular-nums">
                    {d.quantidade}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
                Sugestões dos alunos · {comentarios.length}
              </p>
            </div>
            {comentarios.length === 0 ? (
              <p className="px-5 py-8 font-sans text-sm text-muted text-center">
                Ninguém escreveu sugestão ainda — só notas.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {comentarios.map((c) => (
                  <li key={c.id} className="px-5 py-4">
                    <p className="font-serif text-[15px] text-foreground leading-relaxed">“{c.suggestion}”</p>
                    <p className="font-sans text-xs text-muted mt-2">
                      <Estrelas nota={c.rating} tamanho={11} />
                      <span className="mx-1.5 text-border">·</span>
                      {c.course.title}
                      <span className="mx-1.5 text-border">·</span>
                      {fmtDate.format(c.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
