import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { EnrollmentTable } from "./EnrollmentTable";

export default async function AdminMatriculasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.enrollments" });
  const dateLocale = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR";

  const [enrollments, courses] = await Promise.all([
    prisma.enrollment.findMany({
      include: {
        user:   { select: { name: true, email: true, phone: true } },
        course: { select: { id: true, title: true, slug: true, totalSeats: true } },
        _count: { select: { attendances: { where: { status: { in: ["PRESENT", "LATE"] } } } } },
        payments: { select: { id: true, status: true, method: true, amount: true, couponId: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  // Payment.couponId não tem relação navegável direta com Coupon no schema —
  // resolve os códigos à parte e monta um mapa id -> code.
  const couponIds = [...new Set(enrollments.map((e) => e.payments[0]?.couponId).filter((id): id is string => !!id))];
  const coupons = couponIds.length
    ? await prisma.coupon.findMany({ where: { id: { in: couponIds } }, select: { id: true, code: true } })
    : [];
  const couponCodeById = new Map(coupons.map((c) => [c.id, c.code]));

  const serialized = enrollments.map((e) => ({
    ...e,
    courseId: e.course.id,
    enrolledAt: e.enrolledAt.toISOString(),
    payment: e.payments[0]
      ? {
          status: e.payments[0].status,
          method: e.payments[0].method,
          amount: Number(e.payments[0].amount),
          couponCode: e.payments[0].couponId ? (couponCodeById.get(e.payments[0].couponId) ?? null) : null,
        }
      : null,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">{t("title")}</h1>
        <p className="font-sans text-sm text-muted mt-1">{t("count", { count: enrollments.length })}</p>
      </div>

      {enrollments.length === 0 ? (
        <p className="font-sans text-sm text-muted">{t("none")}</p>
      ) : (
        <EnrollmentTable
          enrollments={serialized}
          dateLocale={dateLocale}
          courses={courses}
        />
      )}
    </div>
  );
}
