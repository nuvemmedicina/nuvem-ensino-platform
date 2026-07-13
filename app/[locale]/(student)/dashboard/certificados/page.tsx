import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Award, Download, BookOpen } from "lucide-react";
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
    include: {
      enrollment: {
        include: {
          course: {
            select: {
              title: true,
              hours: true,
              slug: true,
              thumbnailUrl: true,
              instructor: { include: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {certificates.map((cert) => {
            const course = cert.enrollment.course;
            const issued = new Intl.DateTimeFormat(dateLocale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(cert.issueDate));

            return (
              <div
                key={cert.id}
                className="group relative flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-canvas border border-white/10"
              >
                {/* Poster — proporção 2:3 */}
                <div className="relative w-full" style={{ paddingBottom: "140%" }}>
                  {/* Thumbnail */}
                  {course.thumbnailUrl ? (
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-canvas flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-primary/40" />
                    </div>
                  )}

                  {/* Gradiente escuro */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                  {/* Selo de certificado */}
                  <div className="absolute top-3 right-3">
                    <div className="w-9 h-9 rounded-full bg-amber-400/90 border-2 border-amber-300 flex items-center justify-center shadow-lg">
                      <Award className="w-4 h-4 text-amber-900 fill-amber-900" />
                    </div>
                  </div>

                  {/* Download overlay no hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <a
                      href={`/api/certificates/${cert.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-white/95 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                      title="Baixar certificado"
                    >
                      <Download className="w-5 h-5 text-primary" />
                    </a>
                  </div>

                  {/* Info no rodapé */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10 bg-gradient-to-t from-black via-black/70 to-transparent">
                    <h3 className="font-sans text-xs font-semibold text-white leading-snug line-clamp-2 drop-shadow mb-1">
                      {course.title}
                    </h3>
                    <p className="font-sans text-[10px] text-white/50 truncate mb-2">
                      {course.instructor.user.name} · {course.hours}h
                    </p>

                    {/* Data de emissão */}
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[10px] text-amber-400/80">
                        Emitido em {issued}
                      </span>
                    </div>

                    {/* Código */}
                    <div className="mt-1.5 h-px bg-white/10" />
                    <p className="font-mono text-[9px] text-white/30 mt-1.5 tracking-wider">
                      #{cert.code.slice(0, 12).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
