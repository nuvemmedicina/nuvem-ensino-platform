import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Award, Download } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function CertificadosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.certificates" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/certificados");

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: { enrollment: { include: { course: { select: { title: true, hours: true } } } } },
    orderBy: { issueDate: "desc" },
  });

  const dateLocale = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

  const subtitle =
    certificates.length === 0
      ? t("completeCourseDesc")
      : certificates.length === 1
      ? t("countOne")
      : t("countPlural", { count: certificates.length });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-foreground">{t("title")}</h1>
        <p className="font-sans text-sm text-muted mt-1">{subtitle}</p>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-2xl">
          <Award className="w-12 h-12 text-muted/30 mb-4" />
          <p className="font-serif text-xl text-foreground/40 mb-2">{t("none")}</p>
          <p className="font-sans text-sm text-muted max-w-xs">{t("emptyDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-base font-medium text-foreground leading-snug line-clamp-2">
                    {cert.enrollment.course.title}
                  </h2>
                  <p className="font-sans text-xs text-muted mt-1">
                    {cert.enrollment.course.hours}h · {t("issued")}{" "}
                    {new Intl.DateTimeFormat(dateLocale).format(new Date(cert.issueDate))}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="font-mono text-[10px] text-muted tracking-wider">
                  #{cert.code.slice(0, 12).toUpperCase()}
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={`/api/certificates/${cert.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("download")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
