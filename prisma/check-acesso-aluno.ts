/** Diagnostica o acesso de um aluno aos cursos. Só leitura.
 *  uso: npx tsx prisma/check-acesso-aluno.ts <email ou parte do nome>
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const termo = process.argv[2];
if (!termo) { console.error("informe o e-mail ou nome"); process.exit(1); }

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: termo, mode: "insensitive" } },
        { name: { contains: termo, mode: "insensitive" } },
      ],
    },
    select: {
      id: true, name: true, email: true, role: true, passwordHash: true,
      emailVerified: true, createdAt: true,
      accounts: { select: { provider: true } },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true, status: true, enrolledAt: true, expiresAt: true,
          course: { select: { title: true, slug: true, status: true } },
          payments: {
            orderBy: { createdAt: "desc" },
            select: { status: true, method: true, amount: true, paidAt: true, createdAt: true },
          },
        },
      },
    },
  });

  if (users.length === 0) {
    console.log(`NENHUM usuário encontrado para "${termo}".`);
    return;
  }

  for (const u of users) {
    console.log("=".repeat(76));
    console.log(`${u.name ?? "(sem nome)"}  <${u.email}>`);
    console.log(`id: ${u.id}`);
    console.log(`papel: ${u.role} | senha definida: ${u.passwordHash ? "SIM" : "NÃO"} | e-mail verificado: ${u.emailVerified ? "sim" : "não"}`);
    console.log(`logins sociais: ${u.accounts.map((a) => a.provider).join(", ") || "—"}`);
    console.log(`conta criada em: ${u.createdAt.toLocaleString("pt-BR")}`);
    console.log(`\nMATRÍCULAS: ${u.enrollments.length}`);
    for (const e of u.enrollments) {
      const acessa = e.status === "ACTIVE" || e.status === "COMPLETED";
      console.log(`\n  • ${e.course.title}`);
      console.log(`    slug: ${e.course.slug} | curso: ${e.course.status}`);
      console.log(`    status da matrícula: ${e.status}  →  ${acessa ? "ACESSA as aulas" : "NÃO ACESSA (vê a tela de compra)"}`);
      console.log(`    matriculado em: ${e.enrolledAt.toLocaleString("pt-BR")}${e.expiresAt ? ` | expira: ${e.expiresAt.toLocaleString("pt-BR")}` : ""}`);
      if (e.payments.length === 0) console.log(`    pagamentos: nenhum`);
      for (const p of e.payments) {
        console.log(`    pagamento: ${p.status} | ${p.method} | R$ ${p.amount} | pago em: ${p.paidAt?.toLocaleString("pt-BR") ?? "—"} | criado: ${p.createdAt.toLocaleString("pt-BR")}`);
      }
    }
    console.log();
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
