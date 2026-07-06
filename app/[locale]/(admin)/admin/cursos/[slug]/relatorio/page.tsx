export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string; locale: string }> };

export default async function RelatorioProvasPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") redirect("/entrar");

  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          quiz: {
            include: {
              attempts: {
                include: { user: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
      enrollments: {
        where: { status: { in: ["ACTIVE", "COMPLETED"] } },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!course) notFound();

  const modulesWithQuiz = course.modules.filter((m) => m.quiz);
  const students = course.enrollments.map((e) => e.user);

  // Para cada aluno × módulo, pega a melhor tentativa
  function getBestAttempt(userId: string, quizId: string) {
    const attempts = modulesWithQuiz
      .flatMap((m) => m.quiz!.attempts)
      .filter((a) => a.userId === userId && a.quizId === quizId);
    if (attempts.length === 0) return null;
    return attempts.reduce((best, a) => (a.score > best.score ? a : best));
  }

  function getAttemptCount(userId: string, quizId: string) {
    return modulesWithQuiz
      .flatMap((m) => m.quiz!.attempts)
      .filter((a) => a.userId === userId && a.quizId === quizId).length;
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/cursos/${slug}`}
          className="flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao curso
        </Link>
        <span className="text-border">/</span>
        <h1 className="font-sans text-sm font-semibold text-foreground">Relatório de Provas — {course.title}</h1>
      </div>

      {modulesWithQuiz.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-muted/30 mx-auto mb-3" />
          <p className="font-sans text-sm text-muted">Nenhum módulo tem prova configurada ainda.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <p className="font-sans text-sm text-muted">Nenhum aluno matriculado ainda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-wider text-muted sticky left-0 bg-surface min-w-[200px]">
                  Aluno
                </th>
                {modulesWithQuiz.map((m) => (
                  <th key={m.id} className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-wider text-muted text-center min-w-[140px]">
                    {m.title}
                  </th>
                ))}
                <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-wider text-muted text-center min-w-[100px]">
                  Situação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => {
                const results = modulesWithQuiz.map((m) => {
                  const best = getBestAttempt(student.id, m.quiz!.id);
                  const count = getAttemptCount(student.id, m.quiz!.id);
                  return { module: m, best, count };
                });
                const allPassed = results.every((r) => r.best?.passed);
                const anyFailed = results.some((r) => r.count >= 3 && !r.best?.passed);

                return (
                  <tr key={student.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-background hover:bg-surface/50">
                      <p className="font-sans text-sm font-semibold text-foreground">{student.name ?? "—"}</p>
                      <p className="font-sans text-xs text-muted">{student.email}</p>
                    </td>
                    {results.map(({ module: m, best, count }) => (
                      <td key={m.id} className="px-4 py-3 text-center">
                        {!best ? (
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <Clock className="w-4 h-4 text-muted/40" />
                            <span className="font-sans text-[10px] text-muted">Não respondeu</span>
                          </span>
                        ) : best.passed ? (
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-sans text-[10px] font-semibold text-green-700">
                              {best.score}/{best.total} ({Math.round((best.score / best.total) * 100)}%)
                            </span>
                            <span className="font-sans text-[10px] text-muted">{count} tentativa{count > 1 ? "s" : ""}</span>
                          </span>
                        ) : (
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="font-sans text-[10px] font-semibold text-red-600">
                              {best.score}/{best.total} ({Math.round((best.score / best.total) * 100)}%)
                            </span>
                            <span className="font-sans text-[10px] text-muted">{count}/{m.quiz!.maxAttempts} tentativas</span>
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      {allPassed ? (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-green-700 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Aprovado
                        </span>
                      ) : anyFailed ? (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">
                          <XCircle className="w-3 h-3" /> Reprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Em andamento
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
