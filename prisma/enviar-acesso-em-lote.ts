/**
 * Envia o e-mail de primeiro acesso para os alunos que estão travados:
 * têm matrícula, mas não têm senha nem login social.
 *
 *   npx tsx prisma/enviar-acesso-em-lote.ts            # simulação, nada sai
 *   npx tsx prisma/enviar-acesso-em-lote.ts --enviar   # dispara de verdade
 *
 * Só alcança papel STUDENT — instrutores e admins ficam de fora de propósito,
 * porque o texto do e-mail fala em matrícula recebida.
 *
 * Endereços malformados são separados antes do envio e listados na saída: sem
 * isso o token era gravado e o envio contado como sucesso, mas o e-mail nunca
 * chegava — e ninguém percebia.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const VALIDADE_DIAS = 7;
const PAUSA_MS = 600; // respeita o limite de requisições da Resend

/**
 * Endereço entregável: exige arroba, domínio e ao menos um ponto separando
 * rótulos não vazios. Rejeita o caso que já passou despercebido em produção —
 * ponto sobrando no fim ("fulano@gmail.com.") — porque o token era gravado e o
 * envio contabilizado, mas o e-mail nunca chegava e nada indicava a falha.
 */
const EMAIL_ENTREGAVEL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

async function main() {
  const enviar = process.argv.includes("--enviar");

  // Importado aqui dentro porque lib/email lê variáveis de ambiente na carga
  const { sendSetPasswordEmail } = await import("@/lib/email");
  const crypto = await import("node:crypto");

  const alunos = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      passwordHash: null,
      accounts: { none: {} },
      enrollments: { some: { status: { not: "CANCELLED" } } },
    },
    select: {
      email: true,
      name: true,
      enrollments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { enrolledAt: "desc" },
        take: 1,
        select: { course: { select: { title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Separa antes de qualquer envio: endereço inválido não gera token nem consome
  // cota da Resend, e fica visível na saída em vez de sumir como sucesso.
  const validos  = alunos.filter((a) => EMAIL_ENTREGAVEL.test(a.email ?? ""));
  const invalidos = alunos.filter((a) => !EMAIL_ENTREGAVEL.test(a.email ?? ""));

  console.log(`Alunos travados: ${alunos.length}`);
  if (invalidos.length) {
    console.log(`\nE-mail inválido — não serão enviados (${invalidos.length}):`);
    invalidos.forEach((a) => console.log(`~  "${a.email}"  ${a.name ?? ""}`));
    console.log(`Corrija o cadastro desses alunos e rode de novo.\n`);
  }
  console.log(`Vão receber: ${validos.length}`);
  console.log(enviar ? "MODO ENVIO — os e-mails vão sair\n" : "SIMULAÇÃO — nenhum e-mail sai\n");

  let ok = 0;
  let falhas = 0;

  for (const aluno of validos) {
    const email = aluno.email!;
    const curso = aluno.enrollments[0]?.course.title ?? "";
    const nome = aluno.name?.replace(/\s+/g, " ").trim() || "Aluno";

    if (!curso) {
      console.log(`?  ${email} — sem curso, pulado`);
      continue;
    }

    if (!enviar) {
      console.log(`.  ${nome} <${email}>`);
      continue;
    }

    // Token novo a cada envio: invalida o anterior e vale VALIDADE_DIAS
    const identifier = `reset:${email}`;
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: { identifier, token, expires: new Date(Date.now() + VALIDADE_DIAS * 24 * 60 * 60 * 1000) },
    });

    const r = await sendSetPasswordEmail({
      to: email,
      userName: nome,
      courseName: curso,
      token,
      expiresLabel: `${VALIDADE_DIAS} dias`,
    });

    if (r.ok) {
      ok++;
      console.log(`OK ${email}  (${r.id})`);
    } else {
      falhas++;
      console.log(`!! ${email}  FALHOU — ${r.error}`);
    }

    await new Promise((r) => setTimeout(r, PAUSA_MS));
  }

  const pulados = invalidos.length ? ` | Pulados por e-mail inválido: ${invalidos.length}` : "";

  if (enviar) {
    console.log(`\nEnviados: ${ok} | Falhas: ${falhas}${pulados}`);
    console.log(`Cada envio ficou registrado em /admin/emails.`);
  } else {
    console.log(`\n${validos.length} receberiam o e-mail${pulados}`);
    console.log(`Rode com --enviar para disparar.`);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
