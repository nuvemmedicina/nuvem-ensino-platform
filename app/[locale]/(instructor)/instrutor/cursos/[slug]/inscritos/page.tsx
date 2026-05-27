import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";

type Props = { params: Promise<{ slug: string; locale: string }> };

const statusColors: Record<string, string> = {
  ACTIVE:    "text-green-600 bg-green-500/10 border-green-500/20",
  COMPLETED: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  CANCELLED: "text-muted bg-border/50 border-border",
  REFUNDED:  "text-red-500 bg-red-500/10 border-red-500/20",
};
const statusLabels: Record<string, string> = {
  ACTIVE:    "Ativo",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  REFUNDED:  "Reembolsado",
};

export default async function InscritosPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/instrutor/cursos");

  const role = (session.user as { role?: string }).role;
  if (role !== "INSTRUCTOR" && role !== "ADMIN") redirect("/dashboard");

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instructor) redirect("/dashboard");

  const course = await prisma.course.findFirst({
    where: { slug, instructorId: instructor.id },
    select: { id: true, title: true, slug: true },
  });
  if (!course) notFound();

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    include: {
      user: { select: { name: true, email: true } },
      payments: { select: { status: true, amount: true, method: true, paidAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/instrutor/cursos/${slug}`}
          className="flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao curso
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="font-serif text-3xl font-light text-foreground">Inscritos</h1>
      </div>
      <p className="font-sans text-sm text-muted mb-8">
        {course.title} · {enrollments.length} {enrollments.length === 1 ? "inscrito" : "inscritos"}
      </p>

      {enrollments.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="font-sans text-sm text-muted">Nenhum inscrito ainda.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted">Aluno</th>
                <th className="text-left px-6 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted hidden sm:table-cell">Status</th>
                <th className="text-left px-6 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted hidden md:table-cell">Pagamento</th>
                <th className="text-left px-6 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted hidden lg:table-cell">Inscrito em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments.map((enr) => {
                const payment = enr.payments[0];
                return (
                  <tr key={enr.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-sans text-sm font-medium text-foreground">
                        {enr.user.name ?? "—"}
                      </p>
                      <p className="font-sans text-xs text-muted">{enr.user.email}</p>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[enr.status] ?? statusColors.ACTIVE}`}>
                        {statusLabels[enr.status] ?? enr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {payment ? (
                        <div>
                          <p className="font-sans text-sm text-foreground">
                            {payment.status === "PAID"
                              ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(payment.amount))
                              : payment.amount === 0 ? "Gratuito" : payment.status}
                          </p>
                          {payment.method && (
                            <p className="font-sans text-xs text-muted uppercase">{payment.method.replace("ASAAS_", "")}</p>
                          )}
                        </div>
                      ) : (
                        <span className="font-sans text-xs text-muted">Gratuito</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="font-sans text-sm text-muted">{fmt(enr.enrolledAt)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
