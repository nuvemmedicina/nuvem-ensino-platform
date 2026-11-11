import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Award, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cpfValido, soDigitos } from "@/lib/cpf";
import { separarCidadeUf, type DadosCertificado } from "@/lib/dadosCertificado";
import { FormularioDadosCertificado } from "./FormularioDadosCertificado";

/**
 * Formulário com os dados que a FACOP pede para emitir o certificado. Só
 * aparece para quem a coordenação já pediu (Enrollment.certDataRequestedAt),
 * em lotes, por /admin/certificados-facop.
 */
export default async function DadosCertificadoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "novaArea.paginas.dadosCertificado" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/dados-certificado");

  const [user, pedidos] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true, taxId: true, rg: true, rgIssuer: true, birthplace: true, phone: true,
        postalCode: true, address: true, addressNumber: true, addressComplement: true, province: true, city: true, state: true,
      },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.user.id, certDataRequestedAt: { not: null }, status: { in: ["ACTIVE", "COMPLETED"] } },
      select: { certDataSubmittedAt: true, course: { select: { title: true, titleEs: true, titleEn: true } } },
      orderBy: { certDataRequestedAt: "asc" },
    }),
  ]);
  if (!user) redirect("/entrar");

  const dl = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  const cursos = new Intl.ListFormat(dl, { type: "conjunction" }).format(
    pedidos.map((p) => (locale === "en" ? p.course.titleEn : locale === "es" ? p.course.titleEs : null) ?? p.course.title),
  );
  const respondidoEm = pedidos
    .map((p) => p.certDataSubmittedAt)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const [natCidade, natUf] = separarCidadeUf(user.birthplace);
  const telefone = soDigitos(user.phone ?? "");
  const inicial: DadosCertificado = {
    nome: user.name ?? "",
    cpf: user.taxId ?? "",
    rg: user.rg ?? "",
    rgOrgao: user.rgIssuer ?? "",
    naturalidadeCidade: natCidade,
    naturalidadeUf: natUf,
    telefone: telefone.startsWith("55") && telefone.length > 11 ? telefone.slice(2) : telefone,
    cep: user.postalCode ?? "",
    rua: user.address ?? "",
    numero: user.addressNumber && user.addressNumber !== "0" ? user.addressNumber : "",
    complemento: user.addressComplement ?? "",
    bairro: user.province ?? "",
    cidade: user.city ?? "",
    uf: user.state ?? "",
  };

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex flex-col gap-6">
        <div>
          <h1 className="font-serif text-4xl font-medium text-foreground leading-tight">{t("titulo")}</h1>
          {pedidos.length > 0 && <p className="font-sans text-[15px] text-muted mt-1">{t("subtitulo", { cursos })}</p>}
        </div>

        {pedidos.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-6 py-12 flex flex-col items-center text-center gap-3">
            <Award className="w-10 h-10 text-muted/50" aria-hidden="true" />
            <p className="font-sans text-[15px] text-muted max-w-md">{t("naoSolicitado")}</p>
          </div>
        ) : (
          <>
            {respondidoEm && (
              <p className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-900 rounded-2xl px-5 py-4 font-sans text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                {t("recebido", { data: new Intl.DateTimeFormat(dl, { day: "numeric", month: "long" }).format(respondidoEm) })}
              </p>
            )}
            <section className="bg-surface border border-border rounded-2xl p-5 sm:p-7">
              <FormularioDadosCertificado inicial={inicial} cpfFixo={!!user.taxId && cpfValido(user.taxId)} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
