import { prisma } from "@/lib/prisma";
import { Radio } from "lucide-react";
import { CabecalhoAdmin, botaoCabecalho } from "@/components/admin/CabecalhoAdmin";
import { AULA_GRATUITA } from "@/lib/aula-gratuita";

export const metadata = { title: "Interessados" };

// Mais recente primeiro: é a aba que abre por padrão.
const EVENTOS = [
  {
    slug: AULA_GRATUITA.eventSlug,
    rotulo: "Aula gratuita — 5º encontro",
    subtitulo: `${AULA_GRATUITA.titulo} · cupom ${AULA_GRATUITA.cupom} · página /aula-gratuita`,
    aula: true,
  },
  { slug: "dici-live-julho-2026", rotulo: "Live DICI — julho", subtitulo: "22/07/2026 às 19h30", aula: false },
] as const;

type Props = { searchParams: Promise<{ evento?: string }> };

export default async function LiveLeadsPage({ searchParams }: Props) {
  const { evento: eventoParam } = await searchParams;
  const evento = EVENTOS.find((e) => e.slug === eventoParam) ?? EVENTOS[0];

  const [leads, contagens] = await Promise.all([
    prisma.liveLead.findMany({ where: { eventSlug: evento.slug }, orderBy: { createdAt: "desc" } }),
    prisma.liveLead.groupBy({ by: ["eventSlug"], _count: { _all: true } }),
  ]);
  const totalPorEvento = Object.fromEntries(contagens.map((c) => [c.eventSlug, c._count._all]));

  // Quem já virou aluno do DICI — pelo e-mail, então quem comprou com outro
  // e-mail não aparece aqui (ver a memória sobre contas duplicadas).
  const matriculados = new Set(
    (
      await prisma.enrollment.findMany({
        where: {
          course: { slug: AULA_GRATUITA.courseSlug },
          status: { in: ["ACTIVE", "COMPLETED"] },
          user: { email: { in: leads.map((l) => l.email) } },
        },
        select: { user: { select: { email: true } } },
      })
    ).map((m) => m.user.email.toLowerCase()),
  );

  const assistiram = leads.filter((l) => l.assistiuPct >= 5).length;
  const ateOFim = leads.filter((l) => l.assistiuPct >= 90).length;
  const viraramAlunos = leads.filter((l) => matriculados.has(l.email)).length;

  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div>
      <CabecalhoAdmin
        titulo={`Interessados — ${evento.rotulo}`}
        subtitulo={evento.subtitulo}
        icone={Radio}
        destaques={[
          { rotulo: leads.length === 1 ? "inscrito" : "inscritos", valor: leads.length, tom: "ok" },
          ...(evento.aula
            ? [
                { rotulo: "começaram a aula", valor: assistiram },
                { rotulo: "assistiram até o fim", valor: ateOFim },
              ]
            : []),
          { rotulo: viraramAlunos === 1 ? "matriculado" : "matriculados", valor: viraramAlunos },
        ]}
        acoes={
          <a href={`/api/admin/live-leads-csv?evento=${evento.slug}`} className={botaoCabecalho}>
            Exportar CSV
          </a>
        }
      />

      <nav className="mb-5 flex flex-wrap gap-2 font-sans text-sm">
        {EVENTOS.map((e) => (
          <a
            key={e.slug}
            href={`/admin/live-leads?evento=${e.slug}`}
            className={
              e.slug === evento.slug
                ? "rounded-full bg-primary px-4 py-1.5 font-semibold text-white"
                : "rounded-full border border-border px-4 py-1.5 text-muted hover:text-foreground"
            }
          >
            {e.rotulo} <span className="tabular-nums opacity-70">({totalPorEvento[e.slug] ?? 0})</span>
          </a>
        ))}
      </nav>

      {leads.length === 0 ? (
        <p className="font-sans text-sm text-muted">Nenhuma inscrição ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">#</th>
                <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Nome</th>
                <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Especialidade</th>
                <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Telefone</th>
                <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">E-mail</th>
                {evento.aula && (
                  <>
                    <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Assistiu</th>
                    <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Aceita contato</th>
                    <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Origem</th>
                  </>
                )}
                <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Aluno DICI</th>
                <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Data</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={lead.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 text-muted tabular-nums">{leads.length - i}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{lead.nome}</td>
                  <td className="px-4 py-3 text-foreground/80">{lead.especialidade}</td>
                  <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">{lead.telefone}</td>
                  <td className="px-4 py-3 text-foreground/80">{lead.email}</td>
                  {evento.aula && (
                    <>
                      <td className="px-4 py-3 text-foreground/80 tabular-nums whitespace-nowrap">
                        {lead.assistiuPct > 0 ? `${lead.assistiuPct}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">{lead.aceitaComunicacoes ? "Sim" : "Não"}</td>
                      <td className="px-4 py-3 text-foreground/80">{lead.origem ?? "—"}</td>
                    </>
                  )}
                  <td className="px-4 py-3 text-foreground/80">{matriculados.has(lead.email) ? "Sim" : "—"}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap tabular-nums">{fmt.format(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
