import { prisma } from "@/lib/prisma";
import { Radio } from "lucide-react";
import { CabecalhoAdmin, botaoCabecalho } from "@/components/admin/CabecalhoAdmin";

export const metadata = { title: "Inscrições Live" };

export default async function LiveLeadsPage() {
  const leads = await prisma.liveLead.findMany({
    orderBy: { createdAt: "desc" },
  });

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
        titulo="Inscrições — Live DICI"
        subtitulo="22/07/2026 às 19h30"
        icone={Radio}
        destaques={[{ rotulo: leads.length === 1 ? "inscrito" : "inscritos", valor: leads.length, tom: "ok" }]}
        acoes={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- download do CSV, não é navegação
          <a href="/api/admin/live-leads-csv" className={botaoCabecalho}>
            Exportar CSV
          </a>
        }
      />

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
                <th className="px-4 py-3 font-semibold text-muted whitespace-nowrap">Data</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  className="border-b border-border hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3 text-muted tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{lead.nome}</td>
                  <td className="px-4 py-3 text-foreground/80">{lead.especialidade}</td>
                  <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">{lead.telefone}</td>
                  <td className="px-4 py-3 text-foreground/80">{lead.email}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap tabular-nums">
                    {fmt.format(lead.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
