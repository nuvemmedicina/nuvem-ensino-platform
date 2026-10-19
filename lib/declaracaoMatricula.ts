import fs from "fs";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { formatarCpf, temCpf } from "@/lib/cpf";
import { DeclaracaoMatriculaPDF } from "@/components/DeclaracaoMatriculaPDF";

/** Datas por extenso no fuso de Brasília: "01 de agosto de 2026". */
function porExtenso(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

function imagemPublica(...partes: string[]): string | undefined {
  try {
    const arquivo = path.join(process.cwd(), "public", ...partes);
    if (!fs.existsSync(arquivo)) return undefined;
    return `data:image/png;base64,${fs.readFileSync(arquivo).toString("base64")}`;
  } catch {
    return undefined;
  }
}

function periodoDoCurso(c: { startDateLabel: string | null; startDate: Date | null; endDate: Date | null }) {
  if (c.startDateLabel?.trim()) return c.startDateLabel.trim();
  if (c.startDate && c.endDate) return `${porExtenso(c.startDate)} a ${porExtenso(c.endDate)}`;
  if (c.startDate) return `Início: ${porExtenso(c.startDate)}`;
  return undefined;
}

export type ResultadoDeclaracao =
  | { ok: true; pdf: Buffer; nomeArquivo: string }
  | { ok: false; motivo: "nao-encontrada" | "inativa" | "sem-cpf" };

/**
 * Gera a declaração de uma matrícula ACTIVE. `podeVer` recebe o dono da matrícula;
 * se devolver false, a resposta é a mesma de matrícula inexistente.
 */
export async function gerarDeclaracaoMatricula(
  enrollmentId: string,
  podeVer: (donoId: string) => boolean,
): Promise<ResultadoDeclaracao> {
  const matricula = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      userId: true,
      status: true,
      enrolledAt: true,
      user: { select: { name: true, taxId: true } },
      course: { select: { title: true, hours: true, startDateLabel: true, startDate: true, endDate: true } },
    },
  });

  if (!matricula || !podeVer(matricula.userId)) return { ok: false, motivo: "nao-encontrada" };
  if (matricula.status !== "ACTIVE") return { ok: false, motivo: "inativa" };
  if (!temCpf(matricula.user.taxId)) return { ok: false, motivo: "sem-cpf" };

  const pdf = await renderToBuffer(
    DeclaracaoMatriculaPDF({
      nome: matricula.user.name?.trim() || "Aluno(a)",
      cpf: formatarCpf(matricula.user.taxId!),
      curso: matricula.course.title,
      cargaHoraria: matricula.course.hours,
      periodo: periodoDoCurso(matricula.course),
      dataMatricula: porExtenso(matricula.enrolledAt),
      codigo: matricula.id,
      // A NU.V.E.M fica em Belo Horizonte (nunca São Paulo)
      localEData: `Belo Horizonte, ${porExtenso(new Date())}.`,
      logoUri: imagemPublica("logo.png"),
      assinaturaUri: imagemPublica("assinaturas", "vera-angelo.png"),
    })
  );

  return { ok: true, pdf, nomeArquivo: `declaracao-matricula-nuvem-ensino-${matricula.id.slice(0, 8)}.pdf` };
}
