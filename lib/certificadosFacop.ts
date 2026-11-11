import { prisma } from "@/lib/prisma";
import { cpfValido, formatarCpf } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import { enderecoCompleto, rgCompleto } from "@/lib/dadosCertificado";

export type AlunoFacop = {
  enrollmentId: string;
  nome: string;
  email: string;
  aulas: number;
  provasAprovadas: number;
  ultimaAtividade: string | null;
  pedidoEm: string | null;
  respondidoEm: string | null;
  /** O que ainda falta no cadastro para a planilha da FACOP. */
  faltando: string[];
  facop: {
    nome: string;
    rg: string;
    cpf: string;
    naturalidade: string;
    contato: string;
    email: string;
    endereco: string;
  };
};

export type SituacaoFacop = {
  totalAulas: number;
  totalProvas: number;
  alunos: AlunoFacop[];
};

/**
 * Desempenho e situação dos dados para o certificado de cada aluno de um
 * curso: aulas concluídas, provas aprovadas e o pedido de dados da FACOP.
 * Contas da equipe (ADMIN, EDITOR, INSTRUCTOR) ficam de fora.
 */
export async function carregarSituacaoFacop(courseId: string): Promise<SituacaoFacop> {
  const modulos = await prisma.module.findMany({
    where: { courseId },
    select: { _count: { select: { lessons: true } }, quiz: { select: { id: true } } },
  });
  const quizIds = modulos.map((m) => m.quiz?.id).filter((id): id is string => !!id);
  const totalAulas = modulos.reduce((s, m) => s + m._count.lessons, 0);

  const [matriculas, aprovacoes] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId, status: { in: ["ACTIVE", "COMPLETED"] }, user: { role: "STUDENT" } },
      select: {
        id: true,
        userId: true,
        certDataRequestedAt: true,
        certDataSubmittedAt: true,
        user: {
          select: {
            name: true, email: true, phone: true, taxId: true, rg: true, rgIssuer: true, birthplace: true,
            postalCode: true, address: true, addressNumber: true, addressComplement: true, province: true, city: true, state: true,
          },
        },
        progress: { where: { completed: true }, select: { updatedAt: true } },
      },
    }),
    quizIds.length
      ? prisma.moduleQuizAttempt.findMany({
          where: { quizId: { in: quizIds }, passed: true },
          select: { userId: true, quizId: true },
          distinct: ["userId", "quizId"],
        })
      : Promise.resolve([]),
  ]);

  const provasPorAluno = new Map<string, number>();
  for (const a of aprovacoes) provasPorAluno.set(a.userId, (provasPorAluno.get(a.userId) ?? 0) + 1);

  const alunos = matriculas.map((m): AlunoFacop => {
    const u = m.user;
    const endereco = u.city ? enderecoCompleto(u) : "";
    const faltando = [
      !u.name || u.name.trim().split(/\s+/).length < 2 ? "nome completo" : "",
      !u.taxId || !cpfValido(u.taxId) ? "CPF" : "",
      !u.rg ? "RG" : "",
      !u.birthplace ? "naturalidade" : "",
      !u.phone ? "telefone" : "",
      !endereco ? "endereço" : "",
    ].filter(Boolean);
    const ultima = m.progress.reduce<Date | null>((max, p) => (!max || p.updatedAt > max ? p.updatedAt : max), null);
    return {
      enrollmentId: m.id,
      nome: u.name ?? "",
      email: u.email,
      aulas: m.progress.length,
      provasAprovadas: provasPorAluno.get(m.userId) ?? 0,
      ultimaAtividade: ultima?.toISOString() ?? null,
      pedidoEm: m.certDataRequestedAt?.toISOString() ?? null,
      respondidoEm: m.certDataSubmittedAt?.toISOString() ?? null,
      faltando,
      facop: {
        nome: u.name ?? "",
        rg: rgCompleto(u.rg, u.rgIssuer),
        cpf: u.taxId && cpfValido(u.taxId) ? formatarCpf(u.taxId) : "",
        naturalidade: u.birthplace ?? "",
        contato: formatPhone(u.phone),
        email: u.email,
        endereco,
      },
    };
  });

  // Quem está mais perto de concluir primeiro
  alunos.sort((a, b) => b.provasAprovadas - a.provasAprovadas || b.aulas - a.aulas || a.nome.localeCompare(b.nome, "pt-BR"));
  return { totalAulas, totalProvas: quizIds.length, alunos };
}
