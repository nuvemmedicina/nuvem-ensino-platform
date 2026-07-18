import { prisma } from "@/lib/prisma";
import { PagamentosClient } from "./PagamentosClient";

export default async function AdminPagamentosPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      enrollment: {
        include: {
          user: { select: { email: true, name: true } },
          course: { select: { title: true } },
        },
      },
    },
  });

  const rows = payments.map((p) => ({
    id: p.id,
    asaasId: p.asaasPaymentId ?? null,
    paymentStatus: p.status as string,
    enrollmentStatus: p.enrollment.status as string,
    enrollmentId: p.enrollmentId,
    amount: Number(p.amount),
    method: p.method as string,
    paidAt: p.paidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    email: p.enrollment.user.email,
    userName: p.enrollment.user.name ?? "",
    course: p.enrollment.course.title,
    divergent:
      p.status === "PAID" &&
      p.enrollment.status !== "ACTIVE" &&
      p.enrollment.status !== "COMPLETED",
  }));

  const divergent = rows.filter((r) => r.divergent).length;

  return <PagamentosClient rows={rows} divergent={divergent} />;
}
