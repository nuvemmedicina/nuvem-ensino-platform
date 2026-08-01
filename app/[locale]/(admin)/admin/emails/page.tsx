import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { EmailFilters } from "./EmailFilters";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function AdminEmailsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const dateLocale = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR";
  const fmt = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const { q = "", status = "ALL" } = await searchParams;

  const where = {
    ...(q && { recipient: { contains: q, mode: "insensitive" as const } }),
    ...(status === "SENT" || status === "FAILED" ? { status: status as "SENT" | "FAILED" } : {}),
  };

  const [logs, porStatus, ultimaFalha] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.emailLog.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.emailLog.findFirst({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, error: true },
    }),
  ]);

  const enviados = porStatus.find((s) => s.status === "SENT")?._count._all ?? 0;
  const falhas = porStatus.find((s) => s.status === "FAILED")?._count._all ?? 0;
  const total = enviados + falhas;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">E-mails</h1>
          <p className="font-sans text-sm text-muted mt-1">
            {total === 0
              ? "Nenhum envio registrado ainda."
              : `${logs.length} de ${total} envio${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Suspense fallback={null}>
          <EmailFilters />
        </Suspense>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Entregues à Resend", value: enviados, tone: "text-foreground" },
            { label: "Falharam", value: falhas, tone: falhas > 0 ? "text-red-600" : "text-foreground" },
            {
              label: "Taxa de falha",
              value: `${Math.round((falhas / total) * 100)}%`,
              tone: falhas / total > 0.05 ? "text-red-600" : "text-foreground",
            },
          ].map(({ label, value, tone }) => (
            <div key={label} className="bg-surface border border-border rounded-2xl px-5 py-4">
              <p className={`font-sans text-2xl font-semibold ${tone}`}>{value}</p>
              <p className="font-sans text-xs text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {ultimaFalha && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="font-sans text-xs font-semibold text-amber-900">
            Última falha em {fmt.format(ultimaFalha.createdAt)}
          </p>
          <p className="font-sans text-xs text-amber-800 mt-0.5">{ultimaFalha.error}</p>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="font-sans text-sm text-muted">
          Nenhum envio encontrado. O registro começa a partir da primeira mensagem enviada
          depois que esta tela entrou no ar.
        </p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Quando</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Destinatário</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap font-sans text-xs text-muted">
                      {fmt.format(l.createdAt)}
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-foreground">{l.recipient}</td>
                    <td className="px-5 py-3 hidden sm:table-cell font-sans text-xs text-muted">{l.kind}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          l.status === "SENT"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {l.status === "SENT" ? "Enviado" : "Falhou"}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell font-mono text-[10px] text-muted max-w-md truncate">
                      {l.error ?? l.providerId ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
