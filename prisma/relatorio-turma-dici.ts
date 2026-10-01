/**
 * Gera o relatório da turma do DICI em HTML: faturamento por mês, descontos por
 * cupom, situação de acesso e a lista completa de alunos.
 *
 *   npx tsx prisma/relatorio-turma-dici.ts caminho/do/relatorio.html
 *
 * Contas de instrutor ficam fora de todos os números — o relatório é da turma,
 * não da equipe. O CSS vive aqui dentro de propósito: o arquivo precisa abrir
 * sozinho, sem depender de nada externo.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SLUG = "dici-neurogastroenterologia-2026";
const FULL = 2998;

/** Cupons confirmados pela coordenação para pagamentos anteriores à coluna couponId. */
const CONFIRMADO: Record<number, string> = { 25: "NATALIA25", 20: "NUVEMALUNO" };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (s: unknown) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dt = (d: Date) => d.toLocaleDateString("pt-BR");
const MES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

const SIT: Record<string, { rot: string; cls: string }> = {
  PAGA: { rot: "Paga", cls: "paga" }, GRATUITA: { rot: "Gratuita", cls: "gratis" },
  CORTESIA: { rot: "Cortesia", cls: "gratis" }, REEMBOLSADA: { rot: "Reembolsada", cls: "alerta" },
  CANCELADA: { rot: "Cancelada", cls: "alerta" }, PENDENTE: { rot: "Pendente", cls: "alerta" },
};
const ACESSO: Record<string, { rot: string; cls: string; tit: string }> = {
  estudou: { rot: "Já estudou", cls: "ac-ok", tit: "Entrou e já concluiu ao menos uma aula" },
  pronto:  { rot: "Pode entrar", cls: "ac-meio", tit: "Tem senha ou login Google, mas ainda não registrou atividade" },
  travado: { rot: "Sem acesso", cls: "ac-ruim", tit: "Sem senha e sem login social, não consegue entrar" },
};

/* Fundo branco em qualquer aparelho, a pedido da coordenação. */
const CSS = `<style>
:root{
  --ground:#FFFFFF;--panel:#FFFFFF;--panel-2:#F5F9FA;--ink:#00303F;--ink-2:#00475E;--muted:#5A6A70;--faint:#8899A0;
  --line:#D6DEE0;--line-soft:#E9EFF0;--brand:#00475E;--accent:#CBE4E6;--pos:#1B6E55;--pos-bg:#E4F1EB;
  --warn:#8A5B12;--warn-bg:#F6EEDF;--neg:#9A3535;--neg-bg:#F6E7E7;
  --shadow:0 1px 2px rgba(0,42,56,.05),0 8px 22px -14px rgba(0,42,56,.16);
  color-scheme:light;
}
*{box-sizing:border-box}
html,body{background:var(--ground)}
body{margin:0;color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}
.wrap{max-width:1180px;margin:0 auto;padding:40px 24px 72px;display:flex;flex-direction:column;gap:36px}
.num,.dta,.idx{font-variant-numeric:tabular-nums}
header{display:flex;flex-direction:column;gap:14px}
.brandline{display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:600}
.brandline .dot{width:7px;height:7px;border-radius:50%;background:var(--brand);flex:none}
h1{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-weight:500;font-size:clamp(28px,4vw,42px);
line-height:1.12;margin:0;color:var(--ink-2);text-wrap:balance;letter-spacing:-.01em}
.sub{margin:0;color:var(--muted);max-width:66ch}
.meta{display:flex;flex-wrap:wrap;gap:8px 22px;font-size:13px;color:var(--muted);border-top:1px solid var(--line-soft);padding-top:12px}
.meta b{color:var(--ink);font-weight:600}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
.tile{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px 18px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:5px}
.tile.lead{grid-column:span 2;background:var(--brand);border-color:var(--brand)}
@media (max-width:560px){.tile.lead{grid-column:span 1}}
.tile .k{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);font-weight:600}
.tile.lead .k{color:#B9D6DC}
.tile .v{font-size:27px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.15}
.tile.lead .v{font-size:34px;color:#FFFFFF}
.tile .n{font-size:12.5px;color:var(--muted)}
.tile.lead .n{color:#A9CCD3}
.v.pos{color:var(--pos)}.v.neg{color:var(--neg)}.v.warn{color:var(--warn)}
.split{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:12px}
.bar{display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--line-soft)}
.bar i{display:block}
.legend{display:flex;flex-wrap:wrap;gap:6px 20px;font-size:13px;color:var(--muted)}
.legend span{display:flex;align-items:center;gap:7px}
.legend i{width:9px;height:9px;border-radius:2px;flex:none}
.legend b{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums}
section{display:flex;flex-direction:column;gap:14px}
h2{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-weight:500;font-size:22px;margin:0;color:var(--ink-2)}
.h-note{margin:-8px 0 0;font-size:13.5px;color:var(--muted);max-width:78ch}
.tbl-wrap{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:14px;min-width:820px}
thead th{text-align:left;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600;
padding:11px 14px;white-space:nowrap;border-bottom:1px solid var(--line);background:var(--panel-2)}
tbody td,tbody th{padding:10px 14px;border-bottom:1px solid var(--line-soft);text-align:left;font-weight:400;vertical-align:middle}
tbody tr:last-child td,tbody tr:last-child th{border-bottom:0}
th.num,td.num{text-align:right}
tfoot td{padding:12px 14px;border-top:2px solid var(--line);font-weight:600;font-variant-numeric:tabular-nums;background:var(--panel-2)}
tfoot .num{text-align:right}
.cod{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;font-weight:600;color:var(--ink-2);
background:var(--panel-2);border:1px solid var(--line);padding:2px 7px;border-radius:4px;white-space:nowrap;display:inline-block}
.cod-neutro{color:var(--muted);font-family:inherit;font-weight:400;font-size:13px;background:transparent;border-style:dashed}
.tag-inf{margin-left:7px;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);
border:1px dashed var(--line);padding:1px 5px;border-radius:3px;white-space:nowrap}
.neg{color:var(--neg)}
.idx{color:var(--faint);font-size:12px;width:34px;text-align:right;padding-right:4px}
.nome{min-width:200px}
.nome span{display:block;font-weight:500;color:var(--ink)}
.nome small{display:block;color:var(--faint);font-size:11.5px;word-break:break-all}
.dta,.met{color:var(--muted);white-space:nowrap;font-size:13px}
.cup{white-space:nowrap;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;color:var(--ink-2)}
.cup-inf{color:var(--muted);border-bottom:1px dashed var(--line)}
.cup-none{color:var(--faint);font-family:inherit;font-size:13px}
.val{font-weight:600;white-space:nowrap}
tr.sit-alerta .val{color:var(--faint);font-weight:400;text-decoration:line-through}
.chip{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.03em;padding:2px 9px;border-radius:20px;white-space:nowrap}
.chip-paga{background:var(--pos-bg);color:var(--pos)}
.chip-gratis{background:var(--warn-bg);color:var(--warn)}
.chip-alerta{background:var(--neg-bg);color:var(--neg)}
.ac-ok{background:var(--pos-bg);color:var(--pos)}
.ac-meio{background:var(--panel-2);color:var(--muted);border:1px solid var(--line)}
.ac-ruim{background:var(--neg-bg);color:var(--neg)}
.ac-na{color:var(--faint)}
.ac-n{display:block;font-size:10.5px;color:var(--faint);margin-top:2px}
.nota{background:var(--panel-2);border:1px solid var(--line);border-left:3px solid var(--warn);border-radius:8px;
padding:14px 18px;font-size:13.5px;color:var(--muted);max-width:90ch}
.nota b{color:var(--ink);font-weight:600}
.nota ul{margin:8px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:5px}
footer{border-top:1px solid var(--line-soft);padding-top:16px;font-size:12.5px;color:var(--faint);display:flex;flex-wrap:wrap;gap:6px 18px;justify-content:space-between}
@media (max-width:560px){.wrap{padding:28px 16px 56px;gap:28px}}
@media print{.wrap{padding:0;max-width:none}.tile,.split,.tbl-wrap,.nota{box-shadow:none}tr{break-inside:avoid}}
</style>`;

async function main() {
  const saida = process.argv[2];
  if (!saida) { console.error("Informe o arquivo de saída: npx tsx prisma/relatorio-turma-dici.ts relatorio.html"); process.exit(1); }

  const curso = await prisma.course.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true } });
  const [enrollments, cupons] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId: curso.id, user: { instructor: { is: null } } },
      include: {
        user: { select: { name: true, email: true, passwordHash: true, accounts: { select: { provider: true } } } },
        payments: { orderBy: { createdAt: "desc" } },
        progress: { where: { completed: true }, select: { id: true } },
      },
      orderBy: { enrolledAt: "asc" },
    }),
    prisma.coupon.findMany(),
  ]);

  const codeById = new Map(cupons.map((c) => [c.id, c.code]));
  const byPct: Record<number, string[]> = {};
  cupons.forEach((c) => { if (c.discountPct != null) (byPct[c.discountPct] ||= []).push(c.code); });

  const alunos = enrollments.map((e) => {
    const pgs = e.payments;
    const p = pgs.find((x) => x.status === "PAID") ?? pgs.find((x) => x.status === "REFUNDED") ?? pgs[pgs.length - 1] ?? null;
    const valor = p ? Number(p.amount) : null;
    const pct = valor == null ? null : Math.round((1 - valor / FULL) * 1000) / 10;
    const cortesia = !p || (p.method === "FREE" && valor === 0 && !p.couponId);

    let cupom = p?.couponId ? codeById.get(p.couponId) ?? null : null;
    let origem: string | null = cupom ? "registrado" : null;
    if (!cupom && !cortesia && pct != null && pct > 0) {
      if (CONFIRMADO[pct]) { cupom = CONFIRMADO[pct]; origem = "deduzido"; }
      else { const c = byPct[pct]; if (c?.length === 1) { cupom = c[0]; origem = "deduzido"; } else origem = "indefinido"; }
    }

    let situacao: string;
    if (cortesia) situacao = "CORTESIA";
    else if (p!.status === "PAID" && valor === 0) situacao = "GRATUITA";
    else if (p!.status === "PAID") situacao = "PAGA";
    else if (p!.status === "REFUNDED") situacao = "REEMBOLSADA";
    else if (e.status === "CANCELLED") situacao = "CANCELADA";
    else situacao = "PENDENTE";

    const temCred = !!e.user.passwordHash || e.user.accounts.length > 0;
    return {
      nome: (e.user.name ?? "—").trim(), email: e.user.email, situacao,
      data: p?.paidAt ?? e.enrolledAt, pagoEm: p?.status === "PAID" ? p.paidAt : null,
      via: e.user.accounts.length > 0 ? "Google" : e.user.passwordHash ? "Senha" : "—",
      cupom, origem, pct, valor,
      acesso: e.progress.length > 0 ? "estudou" : temCred ? "pronto" : "travado",
      aulas: e.progress.length,
    };
  });
  alunos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const pagas = alunos.filter((a) => a.situacao === "PAGA");
  const gratuitas = alunos.filter((a) => a.situacao === "GRATUITA");
  const cortesias = alunos.filter((a) => a.situacao === "CORTESIA");
  const reemb = alunos.filter((a) => a.situacao === "REEMBOLSADA");
  const canc = alunos.filter((a) => a.situacao === "CANCELADA");
  const pend = alunos.filter((a) => a.situacao === "PENDENTE");

  const receita = pagas.reduce((s, a) => s + a.valor!, 0);
  const descontoTotal = pagas.length * FULL - receita + gratuitas.length * FULL;
  const brutoTotal = (pagas.length + gratuitas.length) * FULL;

  const vivas = alunos.filter((a) => !["CANCELADA", "REEMBOLSADA"].includes(a.situacao));
  const estudou = vivas.filter((a) => a.acesso === "estudou");
  const pronto = vivas.filter((a) => a.acesso === "pronto");
  const travado = vivas.filter((a) => a.acesso === "travado");

  const meses = new Map<string, { n: number; receita: number; rotulo: string }>();
  for (const a of pagas) {
    if (!a.pagoEm) continue;
    const d = a.pagoEm;
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const g = meses.get(k) ?? { n: 0, receita: 0, rotulo: `${MES[d.getMonth()]} de ${d.getFullYear()}` };
    g.n++; g.receita += a.valor!;
    meses.set(k, g);
  }
  const semData = pagas.filter((a) => !a.pagoEm).length;
  const ordenados = [...meses.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const pico = Math.max(...ordenados.map(([, m]) => m.receita), 1);
  const totalMes = ordenados.reduce((s, [, m]) => s + m.receita, 0);

  const linhasMes = ordenados.map(([, m]) => {
    const w = Math.round((m.receita / pico) * 100);
    return `<tr><th scope="row" style="text-transform:capitalize">${m.rotulo}</th>
      <td class="num">${m.n}</td><td class="num">${brl(m.receita)}</td><td class="num">${brl(m.receita / m.n)}</td>
      <td style="min-width:150px"><div class="bar" style="height:8px"><i style="flex:${w};background:var(--brand)"></i><i style="flex:${100 - w};background:transparent"></i></div></td></tr>`;
  }).join("\n");

  const gc: Record<string, { qtd: number; receita: number; desconto: number; ded: number }> = {};
  for (const a of [...pagas, ...gratuitas]) {
    const k = a.cupom ?? (a.pct! > 0 ? `Sem cupom identificado (${a.pct}%)` : "Sem desconto");
    const x = (gc[k] ||= { qtd: 0, receita: 0, desconto: 0, ded: 0 });
    x.qtd++; x.receita += a.valor!; x.desconto += FULL - a.valor!;
    if (a.origem === "deduzido") x.ded++;
  }
  const linhasCupom = Object.entries(gc).sort((a, b) => b[1].receita - a[1].receita).map(([nome, c]) => {
    const marca = c.ded ? `<span class="tag-inf">${c.ded} de ${c.qtd} deduzidos pelo valor</span>` : "";
    const neutro = nome.startsWith("Sem ") ? " cod-neutro" : "";
    return `<tr><th scope="row"><span class="cod${neutro}">${esc(nome)}</span>${marca}</th>
      <td class="num">${c.qtd}</td><td class="num">${brl(c.receita)}</td>
      <td class="num neg">${c.desconto > 0 ? "−" + brl(c.desconto) : "—"}</td></tr>`;
  }).join("\n");

  const linhasAluno = alunos.map((a, i) => {
    const s = SIT[a.situacao]; const ac = ACESSO[a.acesso];
    const morta = ["CANCELADA", "REEMBOLSADA"].includes(a.situacao);
    let cupom = "—", cls = "cup-none";
    if (a.origem === "registrado") { cupom = esc(a.cupom); cls = ""; }
    else if (a.origem === "deduzido") { cupom = esc(a.cupom); cls = "cup-inf"; }
    else if (a.origem === "indefinido") cupom = "não identificado";
    return `<tr class="sit-${s.cls}">
  <td class="idx">${i + 1}</td>
  <td class="nome"><span>${esc(a.nome)}</span><small>${esc(a.email)}</small></td>
  <td><span class="chip chip-${s.cls}">${s.rot}</span></td>
  <td>${morta ? '<span class="ac-na">—</span>' : `<span class="chip ${ac.cls}" title="${ac.tit}">${ac.rot}</span>${a.aulas ? `<small class="ac-n">${a.aulas} aula${a.aulas > 1 ? "s" : ""}</small>` : ""}`}</td>
  <td class="met">${a.via}</td><td class="dta">${dt(a.data)}</td>
  <td class="cup"><span class="${cls}">${cupom}</span></td>
  <td class="num val">${a.valor == null ? "—" : brl(a.valor)}</td>
</tr>`;
  }).join("");

  const deduzidos = [...pagas, ...gratuitas].filter((a) => a.origem === "deduzido").length;
  const hoje = new Date();

  // Título sem mês: o relatório cobre o curso inteiro e o nome precisa ficar
  // estável entre republicações, senão o artefato "muda de identidade".
  const html = `<title>Relatório da Turma DICI</title>

${CSS}

<div class="wrap">
<header>
  <div class="brandline"><span class="dot"></span>Nuvem Ensino · Relatório de turma</div>
  <h1>Aperfeiçoamento em DICI — Pagamentos e Acesso</h1>
  <p class="sub">Neurogastroenterologia e Métodos Diagnósticos Complementares. Somente alunos: as contas dos instrutores foram excluídas de todos os números desta página.</p>
  <div class="meta">
    <span>Valor cheio do curso <b>${brl(FULL)}</b></span>
    <span>Matrículas <b>${alunos.length}</b></span>
    <span>Ativas <b>${vivas.length}</b></span>
    <span>Emitido em <b>${dt(hoje)}</b></span>
    <span>Destinatária <b>Dra. Vera Ângelo</b> — Diretora Científica</span>
  </div>
</header>

<div class="tiles">
  <div class="tile lead"><div class="k">Receita confirmada</div><div class="v">${brl(receita)}</div>
    <div class="n">${pagas.length} matrículas pagas · ticket médio ${brl(receita / pagas.length)}</div></div>
  <div class="tile"><div class="k">Descontos concedidos</div><div class="v warn">−${brl(descontoTotal)}</div>
    <div class="n">${(Math.round((descontoTotal / brutoTotal) * 1000) / 10).toString().replace(".", ",")}% sobre ${brl(brutoTotal)}</div></div>
  <div class="tile"><div class="k">Já acessaram</div><div class="v pos">${estudou.length + pronto.length}</div>
    <div class="n">de ${vivas.length} matrículas ativas · ${estudou.length} já assistiram aula</div></div>
  <div class="tile"><div class="k">Ainda sem acesso</div><div class="v neg">${travado.length}</div>
    <div class="n">sem senha e sem login Google</div></div>
  <div class="tile"><div class="k">Cortesias</div><div class="v">${cortesias.length + gratuitas.length}</div>
    <div class="n">acesso liberado sem cobrança</div></div>
  <div class="tile"><div class="k">Canceladas / pendentes</div><div class="v neg">${canc.length + reemb.length + pend.length}</div>
    <div class="n">${canc.length} canceladas${reemb.length ? ` · ${reemb.length} reembolsada` : ""}${pend.length ? ` · ${pend.length} aguardando pagamento` : " · nenhuma pendência"}</div></div>
</div>

<div class="split">
  <div class="bar" role="img" aria-label="Acesso: ${estudou.length} já estudaram, ${pronto.length} podem entrar, ${travado.length} sem acesso">
    <i style="flex:${estudou.length};background:var(--pos)"></i>
    <i style="flex:${pronto.length};background:var(--accent)"></i>
    <i style="flex:${travado.length};background:var(--neg)"></i>
  </div>
  <div class="legend">
    <span><i style="background:var(--pos)"></i>Já estudaram <b>${estudou.length}</b></span>
    <span><i style="background:var(--accent)"></i>Podem entrar, ainda não usaram <b>${pronto.length}</b></span>
    <span><i style="background:var(--neg)"></i>Sem acesso <b>${travado.length}</b></span>
    <span style="margin-left:auto">Matrículas ativas <b>${vivas.length}</b></span>
  </div>
</div>

<section>
  <h2>Faturamento por mês</h2>
  <p class="h-note">Cada matrícula entra no mês em que o pagamento foi confirmado, não no mês da inscrição. Somente pagamentos confirmados com valor acima de zero.${semData ? ` ${semData} pagamento(s) sem data de confirmação ficaram fora deste corte.` : ""}</p>
  <div class="tbl-wrap"><table>
    <thead><tr><th>Mês</th><th class="num">Matrículas</th><th class="num">Receita</th><th class="num">Ticket médio</th><th></th></tr></thead>
    <tbody>
${linhasMes}
    </tbody>
    <tfoot><tr><td>Total</td><td class="num">${pagas.length - semData}</td>
      <td class="num">${brl(totalMes)}</td>
      <td class="num">${brl(totalMes / Math.max(pagas.length - semData, 1))}</td><td></td></tr></tfoot>
  </table></div>
</section>

<section>
  <h2>Descontos por cupom</h2>
  <p class="h-note">Somente matrículas pagas. Onde aparece <b>deduzidos pelo valor</b>, o cupom não foi gravado no pagamento e foi identificado pelo desconto aplicado sobre o preço cheio.</p>
  <div class="tbl-wrap"><table>
    <thead><tr><th>Cupom</th><th class="num">Alunos</th><th class="num">Receita</th><th class="num">Desconto</th></tr></thead>
    <tbody>
${linhasCupom}
    </tbody>
    <tfoot><tr><td>Total</td><td class="num">${pagas.length + gratuitas.length}</td>
      <td class="num">${brl(receita)}</td><td class="num neg">−${brl(descontoTotal)}</td></tr></tfoot>
  </table></div>
</section>

<section>
  <h2>Alunos matriculados</h2>
  <p class="h-note">${alunos.length} matrículas em ordem alfabética, sem as contas de instrutor. A coluna <b>Acesso</b> mostra quem já entrou na plataforma: <b>Já estudou</b> concluiu ao menos uma aula, <b>Pode entrar</b> tem credencial mas ainda não registrou atividade, e <b>Sem acesso</b> não tem senha nem login Google.</p>
  <div class="tbl-wrap"><table>
    <thead><tr><th></th><th>Aluno</th><th>Situação</th><th>Acesso</th><th>Entra por</th><th>Data</th><th>Cupom</th><th class="num">Valor pago</th></tr></thead>
    <tbody>${linhasAluno}</tbody>
  </table></div>
</section>

<section>
  <h2>O que merece atenção</h2>
  <div class="nota">
    <ul>
      ${travado.length ? `<li><b>${travado.length} aluno(s) ainda não conseguem entrar.</b> Não têm senha nem login Google.</li>` : `<li><b>Todos os alunos ativos já têm como entrar.</b> Ninguém está sem senha nem sem login social.</li>`}
      <li><b>${pronto.length} têm credencial mas nunca registraram atividade.</b> Conseguem entrar e ainda não assistiram nada.</li>
      <li><b>${deduzidos} cupons foram deduzidos pelo valor pago</b>, não lidos do pagamento. Pagamentos anteriores a julho de 2026 não gravavam o cupom, então esses números são uma reconstrução, não um registro.</li>
      ${pend.length ? `<li><b>${pend.length} matrícula(s) aguardando pagamento.</b></li>` : ""}
    </ul>
  </div>
</section>

<footer>
  <p>NU.V.E.M Ensino · Emitido em ${hoje.getDate()} de ${MES[hoje.getMonth()]} de ${hoje.getFullYear()}</p>
  <p>Fonte: banco de dados da plataforma. Contas de instrutor excluídas.</p>
</footer>
</div>
`;

  writeFileSync(saida, html, "utf8");

  console.log(`gerado: ${saida}`);
  console.log(`\nmatrículas ${alunos.length} | ativas ${vivas.length} | pagas ${pagas.length} | receita ${brl(receita)}`);
  console.log(`acesso: estudaram ${estudou.length} · podem entrar ${pronto.length} · sem acesso ${travado.length}`);
  console.log(`canceladas ${canc.length} · reembolsadas ${reemb.length} · pendentes ${pend.length}`);
  console.log(`\nPOR MÊS`);
  ordenados.forEach(([k, m]) => console.log(`  ${k}  ${String(m.n).padStart(3)} matrículas  ${brl(m.receita).padStart(14)}`));
  console.log(`  soma dos meses = receita? ${Math.abs(totalMes - receita) < 0.01 ? "sim" : "NÃO — revisar"}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
