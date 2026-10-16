import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Sem ?evento= exporta tudo, como antes.
  const evento = req.nextUrl.searchParams.get("evento") || undefined;
  const leads = await prisma.liveLead.findMany({
    where: evento ? { eventSlug: evento } : undefined,
    orderBy: { createdAt: "asc" },
  });

  const rows = [
    ["Nome", "Especialidade", "Telefone", "E-mail", "Assistiu (%)", "Aceita contato", "Origem", "Evento", "Data"],
    ...leads.map((l) => [
      l.nome,
      l.especialidade,
      l.telefone,
      l.email,
      String(l.assistiuPct),
      l.aceitaComunicacoes ? "Sim" : "Não",
      l.origem ?? "",
      l.eventSlug,
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
      }).format(l.createdAt),
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="interessados-${evento ?? "todos"}.csv"`,
    },
  });
}
