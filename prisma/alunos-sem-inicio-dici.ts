/**
 * Lista os alunos do DICI com matrícula ativa que nunca começaram nenhuma aula
 * (zero registro de Progress, nem parcial) e separa quem, além disso, nem tem
 * como entrar na plataforma (sem senha e sem login Google).
 *
 * A plataforma não grava "último login" (sessão é JWT, não fica no banco), então
 * "acessou a plataforma" aqui é deduzido: sem senha e sem conta Google, é
 * fisicamente impossível ter entrado. Com credencial mas zero Progress, pode ter
 * entrado e só não ter clicado em nenhuma aula, ou nunca ter entrado mesmo.
 *
 *   npx tsx prisma/alunos-sem-inicio-dici.ts
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SLUG = "dici-neurogastroenterologia-2026";

async function main() {
  const curso = await prisma.course.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true, title: true } });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: curso.id, status: "ACTIVE", user: { instructor: { is: null } } },
    include: {
      user: {
        select: { name: true, email: true, phone: true, passwordHash: true, accounts: { select: { provider: true } } },
      },
      progress: { select: { id: true } }, // qualquer progresso, mesmo incompleto
    },
    orderBy: { enrolledAt: "asc" },
  });

  const semInicio = enrollments.filter((e) => e.progress.length === 0);
  const semAcessoAlgum = semInicio.filter((e) => !e.user.passwordHash && e.user.accounts.length === 0);
  const temCredencial = semInicio.filter((e) => e.user.passwordHash || e.user.accounts.length > 0);

  const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
  const linha = (e: (typeof enrollments)[number]) =>
    `  ${(e.user.name ?? "—").padEnd(38)} ${e.user.email.padEnd(34)} ${(e.user.phone ?? "sem telefone").padEnd(18)} matriculado em ${fmt(e.enrolledAt)}`;

  console.log(`Curso: ${curso.title}`);
  console.log(`Matrículas ativas: ${enrollments.length}`);
  console.log(`Nunca começaram nenhuma aula: ${semInicio.length}\n`);

  console.log(`── Sem nenhuma credencial (sem senha e sem login Google — não têm como ter acessado) — ${semAcessoAlgum.length} ──`);
  semAcessoAlgum.forEach((e) => console.log(linha(e)));

  console.log(`\n── Têm credencial mas zero atividade (podem ter entrado e não começado, ou nunca entrado) — ${temCredencial.length} ──`);
  temCredencial.forEach((e) => console.log(linha(e)));

  console.log(`\nTotal para contatar: ${semInicio.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
