import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Award, Download, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { usaNovaArea } from "@/lib/novaArea";
import { calcularEstatisticas } from "@/lib/gamification";
import { ProgressoPanel } from "../ProgressoPanel";

export default async function CertificadosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.certificates" });
  const ti = await getTranslations({ locale, namespace: "novaArea.inicio" });
  const tp = await getTranslations({ locale, namespace: "novaArea.paginas.conquistas" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/certificados");

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: {
      enrollment: {
        include: {
          course: {
            select: {
              title: true,
              hours: true,
              slug: true,
              instructor: { include: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
    orderBy: { issueDate: "desc" },
  });

  const dl = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

  const subtitle =
    certificates.length === 0
      ? t("completeCourseDesc")
      : certificates.length === 1
        ? t("countOne")
        : t("countPlural", { count: certificates.length });

  // Nova área do aluno: esta página vira "Conquistas", com pontos, sequência
  // de estudos e medalhas acima dos certificados.
  const nova = await usaNovaArea((session.user as { role?: string }).role);
  const stats = nova ? await calcularEstatisticas(session.user.id) : null;

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex flex-col gap-8">
        <div>
          <h1 className="font-serif text-4xl font-medium text-foreground leading-tight">{nova ? ti("conquistasTitulo") : t("title")}</h1>
          <p className="font-sans text-[15px] text-muted mt-1">{nova ? ti("conquistasSubtitulo") : subtitle}</p>
        </div>

        {stats && stats.xp > 0 && (
          <div className="[&>section]:p-0 [&>section]:bg-transparent">
            <ProgressoPanel stats={stats} />
          </div>
        )}

        <section aria-labelledby="certificados" className="flex flex-col gap-3">
          <div>
            <h2 id="certificados" className="font-sans text-lg font-semibold text-foreground">{t("title")}</h2>
            {nova && <p className="font-sans text-sm text-muted">{subtitle}</p>}
          </div>

          {certificates.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl px-6 py-12 flex flex-col items-center text-center gap-3">
              <Award className="w-10 h-10 text-muted/50" aria-hidden="true" />
              <p className="font-sans text-[15px] text-muted max-w-sm">{tp("vazio")}</p>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {certificates.map((cert) => {
                const course = cert.enrollment.course;
                return (
                  <li key={cert.id} className="bg-surface border border-border rounded-2xl p-5 flex gap-4">
                    <span className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="font-serif text-xl font-medium text-foreground leading-snug">{course.title}</p>
                      <p className="font-sans text-sm text-muted">
                        {course.instructor.user.name} · {course.hours}h
                      </p>
                      <p className="font-sans text-sm text-muted">
                        {tp("emitidoEm", { data: new Intl.DateTimeFormat(dl, { day: "numeric", month: "long", year: "numeric" }).format(cert.issueDate) })}
                      </p>
                      <p className="font-mono text-xs text-muted tracking-wider">
                        {tp("codigo", { codigo: cert.code.slice(0, 12).toUpperCase() })}
                      </p>
                      <div className="flex flex-wrap gap-2.5 mt-2">
                        <a
                          href={`/api/certificates/${cert.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90"
                        >
                          <Download className="w-4 h-4" aria-hidden="true" />
                          {tp("baixar")}
                        </a>
                        <Link
                          href={`/verificar?codigo=${encodeURIComponent(cert.code)}`}
                          target="_blank"
                          className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-border text-foreground font-sans text-sm hover:border-primary/40"
                        >
                          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                          {tp("verificar")}
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
