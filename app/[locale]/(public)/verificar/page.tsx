import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, XCircle, Search, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Verificar Certificado — NU.V.E.M ENSINO",
  description:
    "Verifique a autenticidade de um certificado emitido pela NU.V.E.M ENSINO. Informe o código impresso no certificado para confirmar sua validade.",
  alternates: { canonical: "/verificar" },
  openGraph: {
    title: "Verificar Certificado — NU.V.E.M ENSINO",
    description: "Confirme a autenticidade de certificados emitidos pela NU.V.E.M ENSINO.",
    url: "/verificar",
  },
};

type Props = { searchParams: Promise<{ codigo?: string }> };

const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function VerificarPage({ searchParams }: Props) {
  const { codigo } = await searchParams;

  // Normaliza input: remove espaços e converte para minúsculas
  const input = codigo?.trim().toLowerCase() ?? "";

  type CertResult = Awaited<ReturnType<typeof queryCert>>;
  let cert: CertResult = null;
  let searched = false;

  if (input.length >= 8) {
    searched = true;
    cert = await queryCert(input);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-canvas py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="font-serif text-4xl font-light text-white mb-3">
            Verificação de Certificado
          </h1>
          <p className="font-sans text-sm text-white/60 max-w-md mx-auto">
            Informe o código impresso no certificado para confirmar sua autenticidade e validade.
          </p>
        </div>
      </section>

      {/* Formulário */}
      <section className="py-10 px-4">
        <div className="max-w-xl mx-auto">
          <form method="GET" action="/verificar" className="flex gap-2">
            <input
              type="text"
              name="codigo"
              defaultValue={codigo ?? ""}
              placeholder="Ex.: CM9K2A4F1B3E7D2C"
              autoComplete="off"
              autoFocus
              className="flex-1 px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors uppercase tracking-wider"
              style={{ textTransform: "uppercase" }}
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:bg-primary-dark transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
              Verificar
            </button>
          </form>
          <p className="font-sans text-[11px] text-muted mt-2 px-1">
            O código está impresso no rodapé do certificado (16 caracteres).
          </p>
        </div>
      </section>

      {/* Resultado */}
      {searched && (
        <section className="pb-16 px-4">
          <div className="max-w-xl mx-auto">
            {cert ? (
              <div className="bg-surface border border-green-500/30 rounded-2xl overflow-hidden">
                {/* Cabeçalho verde */}
                <div className="flex items-center gap-3 px-6 py-4 bg-green-500/10 border-b border-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  <div>
                    <p className="font-sans text-sm font-semibold text-green-700">
                      Certificado válido
                    </p>
                    <p className="font-sans text-xs text-green-600/80">
                      Emitido pela NU.V.E.M ENSINO
                    </p>
                  </div>
                </div>

                {/* Dados */}
                <dl className="divide-y divide-border">
                  <Row label="Aluno">{cert.user.name ?? "—"}</Row>
                  <Row label="Curso">{cert.enrollment.course.title}</Row>
                  <Row label="Carga horária">
                    {cert.enrollment.course.hours
                      ? `${cert.enrollment.course.hours} horas`
                      : "—"}
                  </Row>
                  {cert.enrollment.course.instructor?.user.name && (
                    <Row label="Instrutor">
                      {cert.enrollment.course.instructor.user.name}
                    </Row>
                  )}
                  <Row label="Data de emissão">
                    {fmtDate.format(new Date(cert.issueDate))}
                  </Row>
                  <Row label="Código">
                    <span className="font-mono tracking-wider">
                      {cert.code.slice(0, 16).toUpperCase()}
                    </span>
                  </Row>
                </dl>
              </div>
            ) : (
              <div className="bg-surface border border-red-500/30 rounded-2xl px-6 py-8 text-center">
                <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="font-sans text-sm font-semibold text-foreground mb-1">
                  Certificado não encontrado
                </p>
                <p className="font-sans text-xs text-muted">
                  Nenhum certificado corresponde ao código{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {input.toUpperCase()}
                  </span>
                  . Verifique se o código foi digitado corretamente.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Informativo (aparece se não pesquisou nada) */}
      {!searched && (
        <section className="pb-16 px-4">
          <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard
              icon="🔍"
              title="Como verificar"
              body="Encontre o código de 16 caracteres impresso no rodapé do certificado e cole no campo acima."
            />
            <InfoCard
              icon="🛡️"
              title="100% confiável"
              body="Os certificados da NU.V.E.M ENSINO possuem código único e são verificáveis a qualquer momento."
            />
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

async function queryCert(input: string) {
  // O PDF mostra os 16 primeiros chars do code em uppercase.
  // Buscamos pelo startsWith do input normalizado.
  return prisma.certificate.findFirst({
    where: {
      code: { startsWith: input },
    },
    select: {
      code: true,
      issueDate: true,
      user: { select: { name: true } },
      enrollment: {
        select: {
          course: {
            select: {
              title: true,
              hours: true,
              instructor: {
                select: {
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-3.5 flex justify-between items-start gap-4">
      <dt className="font-sans text-xs text-muted shrink-0 w-28">{label}</dt>
      <dd className="font-sans text-sm text-foreground text-right">{children}</dd>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl px-5 py-4">
      <span className="text-2xl">{icon}</span>
      <p className="font-sans text-sm font-semibold text-foreground mt-2 mb-1">{title}</p>
      <p className="font-sans text-xs text-muted leading-relaxed">{body}</p>
    </div>
  );
}
