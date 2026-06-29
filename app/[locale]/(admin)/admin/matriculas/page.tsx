import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { EnrollmentRow } from "./EnrollmentRow";

export default async function AdminMatriculasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.enrollments" });
  const dateLocale = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR";

  const enrollments = await prisma.enrollment.findMany({
    include: {
      user:   { select: { name: true, email: true } },
      course: { select: { title: true, slug: true, totalSeats: true } },
      _count: { select: { attendances: { where: { status: { in: ["PRESENT", "LATE"] } } } } },
      payments: { select: { id: true, status: true, method: true, amount: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">{t("title")}</h1>
        <p className="font-sans text-sm text-muted mt-1">{t("count", { count: enrollments.length })}</p>
      </div>

      {enrollments.length === 0 ? (
        <p className="font-sans text-sm text-muted">{t("none")}</p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("colStudent")}</th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("colCourse")}</th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">{t("colDate")}</th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">{t("colAttendances")}</th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Pagamento</th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments.map((e) => (
                <EnrollmentRow
                  key={e.id}
                  enrollment={{
                    ...e,
                    enrolledAt: e.enrolledAt.toISOString(),
                    payment: e.payments[0]
                      ? { status: e.payments[0].status, method: e.payments[0].method, amount: Number(e.payments[0].amount) }
                      : null,
                  }}
                  dateLocale={dateLocale}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
