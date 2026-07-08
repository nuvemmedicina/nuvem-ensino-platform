import { prisma } from "@/lib/prisma";

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">
            Inscrições — Live DICI
          </h1>
          <p className="font-sans text-sm text-muted mt-1">
            {leads.length} {leads.length === 1 ? "inscrito" : "inscritos"} · 24/07/2026 às 19h30
          </p>
        </div>
        <a
          href={`/api/admin/live-leads-csv`}
          className="shrink-0 font-sans text-xs font-semibold bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
        >
          Exportar CSV
        </a>
      </div>

      {leads.length === 0 ? (
        <p className="font-sans text-sm text-muted">Nenhuma inscrição ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left">
                <th className="px-4 py-3 font-semibold text-white/70 whitespace-nowrap">#</th>
                <th className="px-4 py-3 font-semibold text-white/70 whitespace-nowrap">Nome</th>
                <th className="px-4 py-3 font-semibold text-white/70 whitespace-nowrap">Especialidade</th>
                <th className="px-4 py-3 font-semibold text-white/70 whitespace-nowrap">Telefone</th>
                <th className="px-4 py-3 font-semibold text-white/70 whitespace-nowrap">E-mail</th>
                <th className="px-4 py-3 font-semibold text-white/70 whitespace-nowrap">Data</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-white/40 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 text-white/90 font-medium">{lead.nome}</td>
                  <td className="px-4 py-3 text-white/70">{lead.especialidade}</td>
                  <td className="px-4 py-3 text-white/70 whitespace-nowrap">{lead.telefone}</td>
                  <td className="px-4 py-3 text-white/70">{lead.email}</td>
                  <td className="px-4 py-3 text-white/50 whitespace-nowrap tabular-nums">
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
