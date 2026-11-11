import Link from "next/link";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { carregarSituacaoFacop } from "@/lib/certificadosFacop";
import { CabecalhoAdmin, botaoCabecalhoSecundario } from "@/components/admin/CabecalhoAdmin";
import { TabelaFacop } from "./TabelaFacop";

/**
 * Certificados FACOP: desempenho dos alunos e pedido, em lotes, dos dados que
 * a faculdade exige (RG, naturalidade, CPF, endereço). Só ADMIN: a página
 * mostra documentos pessoais.
 */
export default async function CertificadosFacopPage({ searchParams }: { searchParams: Promise<{ curso?: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/admin");

  const { curso } = await searchParams;
  const cursos = await prisma.course.findMany({
    where: { showCertificationSeals: true },
    select: { id: true, slug: true, title: true },
    orderBy: { createdAt: "desc" },
  });
  const atual = cursos.find((c) => c.slug === curso) ?? cursos[0];

  if (!atual) {
    return (
      <div>
        <CabecalhoAdmin titulo="Certificados FACOP" icone={Award} />
        <p className="font-sans text-sm text-muted">Nenhum curso com certificação FACOP.</p>
      </div>
    );
  }

  const situacao = await carregarSituacaoFacop(atual.id);
  const pedidos = situacao.alunos.filter((a) => a.pedidoEm).length;
  const respondidos = situacao.alunos.filter((a) => a.respondidoEm).length;

  return (
    <div>
      <CabecalhoAdmin
        titulo="Certificados FACOP"
        subtitulo={`${atual.title} · ${situacao.alunos.length} alunos`}
        icone={Award}
        destaques={[
          { rotulo: "pedidos enviados", valor: pedidos },
          { rotulo: "dados recebidos", valor: respondidos, tom: "ok" },
          { rotulo: "aguardando resposta", valor: pedidos - respondidos, tom: pedidos - respondidos > 0 ? "alerta" : "normal" },
        ]}
        acoes={
          <a href={`/api/admin/certificados-facop?curso=${atual.slug}`} className={botaoCabecalhoSecundario}>
            Baixar dados (CSV)
          </a>
        }
      />

      {cursos.length > 1 && (
        <nav aria-label="Curso" className="flex flex-wrap gap-2 mb-5">
          {cursos.map((c) => (
            <Link
              key={c.id}
              href={`/admin/certificados-facop?curso=${c.slug}`}
              aria-current={c.id === atual.id ? "page" : undefined}
              className={`font-sans text-sm px-4 py-2 rounded-full border ${c.id === atual.id ? "bg-primary text-white border-primary" : "border-border text-foreground hover:border-primary/40"}`}
            >
              {c.title}
            </Link>
          ))}
        </nav>
      )}

      <TabelaFacop alunos={situacao.alunos} totalAulas={situacao.totalAulas} totalProvas={situacao.totalProvas} />
    </div>
  );
}
