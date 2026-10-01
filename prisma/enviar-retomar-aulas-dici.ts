/**
 * Convite para retomar o DICI (01/10/2026) — alunos com matrícula ativa que
 * concluíram ao menos uma aula, mas não registram atividade desde CORTE.
 * Também gera a lista de WhatsApp do mesmo grupo, com mensagem pronta.
 *
 *   npx tsx prisma/enviar-retomar-aulas-dici.ts lista.txt                # simulação + lista
 *   npx tsx prisma/enviar-retomar-aulas-dici.ts lista.txt --teste        # só EMAIL_TESTE
 *   npx tsx prisma/enviar-retomar-aulas-dici.ts lista.txt --enviar       # dispara para todos
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SLUG = "dici-neurogastroenterologia-2026";
const CORTE = new Date("2026-09-01T03:00:00Z"); // 1º/09 00:00 em Brasília
const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const PAUSA_MS = 600;
const EMAIL_OK = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const LINK_CURSO = "https://www.nuvemensino.com.br/dashboard/cursos/" + SLUG;
const LINK_ENTRAR = "https://www.nuvemensino.com.br/entrar";

// Segunda conta da Dra. Vera é da equipe, não de aluna.
const EXCLUIR = new Set(["veraluciaangeloandrade@gmail.com"]);

const TITULO = /^(dr|dra|drª|prof|profª|profa)\.?$/i;
const primeiroNome = (n: string | null) => {
  const partes = (n ?? "").replace(/\s+/g, " ").trim().split(" ");
  const nome = partes.find((p) => p && !TITULO.test(p)) ?? "Aluno";
  return nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();
};

function waLink(tel: string | null): string | null {
  const d = (tel ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.startsWith("55") ? d : "55" + d}`;
}

const mensagemWhats = (nome: string, aulas: number) =>
  `Oi, ${nome}! Aqui é da equipe do Nu.V.E.M Ensino 🎓 Vimos que você já concluiu ${aulas === 1 ? "1 aula" : `${aulas} aulas`} do Aperfeiçoamento em DICI, e seu progresso está guardado. A turma avançou: os Módulos I, II e III já estão liberados e os encontros ao vivo ficaram gravados. O Módulo IV chega em novembro, então é um ótimo momento para colocar as aulas em dia!\n\nLink para entrar: ${LINK_ENTRAR}\nDepois de entrar, é só clicar no Aperfeiçoamento em DICI: ${LINK_CURSO}\n\nQualquer dificuldade, me chama por aqui que a gente resolve!`;

async function main() {
  const saida = process.argv[2];
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  if (!saida || saida.startsWith("--")) { console.error("Informe o arquivo da lista: npx tsx prisma/enviar-retomar-aulas-dici.ts lista.txt"); process.exit(1); }
  if (teste && enviar) { console.error("Use --teste OU --enviar, nunca os dois."); process.exit(1); }

  const { sendRetomarAulas } = await import("@/lib/email");

  const curso = await prisma.course.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true, title: true } });
  const agora = new Date();
  const liberadas = await prisma.lesson.count({
    where: { module: { courseId: curso.id, OR: [{ releaseDate: null }, { releaseDate: { lte: agora } }] } },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: curso.id, status: "ACTIVE", user: { instructor: { is: null }, role: "STUDENT" } },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      progress: { select: { completed: true, completedAt: true, updatedAt: true } },
    },
    orderBy: { enrolledAt: "asc" },
  });

  const alvo = enrollments
    .map((e) => {
      const ultima = Math.max(...e.progress.map((p) => (p.completedAt ?? p.updatedAt).getTime()), 0);
      return {
        nomeCompleto: (e.user.name ?? "—").replace(/\s+/g, " ").trim(),
        nome: primeiroNome(e.user.name),
        email: e.user.email,
        telefone: e.user.phone,
        aulas: e.progress.filter((p) => p.completed).length,
        ultima: new Date(ultima),
      };
    })
    .filter((a) => a.aulas > 0 && a.ultima < CORTE && EMAIL_OK.test(a.email) && !EXCLUIR.has(a.email))
    .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR"));

  const dataBR = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  console.log(`RETOMAR AULAS — ${alvo.length} destinatários (${liberadas} aulas liberadas)`);
  alvo.forEach((a) => console.log(`   .  ${a.nome} <${a.email}> — ${a.aulas} aulas, última em ${dataBR(a.ultima)}`));

  const comTel = alvo.filter((a) => waLink(a.telefone));
  const semTel = alvo.filter((a) => !waLink(a.telefone));
  const texto =
    comTel.map((a) => `${a.nomeCompleto} — ${a.email}\n${waLink(a.telefone)}  (${a.aulas} aulas, parou em ${dataBR(a.ultima)})\n${mensagemWhats(a.nome, a.aulas)}\n`).join("\n" + "─".repeat(60) + "\n\n") +
    (semTel.length ? `\n\n${"─".repeat(60)}\nSEM TELEFONE CADASTRADO (${semTel.length}) — contatar por e-mail:\n` + semTel.map((a) => `${a.nomeCompleto} — ${a.email}`).join("\n") : "");
  writeFileSync(saida, texto, "utf8");
  console.log(`\nLista de WhatsApp: ${saida} (com telefone: ${comTel.length} | sem: ${semTel.length})`);

  if (teste) {
    const r = await sendRetomarAulas({ to: EMAIL_TESTE, userName: "Ana Paula", courseName: curso.title, courseSlug: SLUG, aulasConcluidas: 12, aulasLiberadas: liberadas });
    console.log(r.ok ? `\nOK teste enviado para ${EMAIL_TESTE} (${r.id})` : `\n!! FALHOU — ${r.error}`);
    if (!r.ok) process.exitCode = 1;
    return;
  }
  if (!enviar) { console.log(`\n[SIMULAÇÃO] Nenhum e-mail saiu.`); return; }

  console.log(`\nMODO ENVIO — ${alvo.length} e-mails\n`);
  let ok = 0, falhas = 0;
  for (const a of alvo) {
    const r = await sendRetomarAulas({ to: a.email, userName: a.nome, courseName: curso.title, courseSlug: SLUG, aulasConcluidas: a.aulas, aulasLiberadas: liberadas });
    if (r.ok) { ok++; console.log(`OK ${a.email}`); } else { falhas++; console.log(`!! ${a.email} — ${r.error}`); }
    await new Promise((res) => setTimeout(res, PAUSA_MS));
  }
  console.log(`\nEnviados: ${ok} | Falhas: ${falhas}`);
  console.log(`Registrado em /admin/emails.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
