import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Download, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CheckInRow } from "./CheckInRow";
import { DatePicker } from "./DatePicker";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ data?: string }>;
};

export default async function InscritosPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { data: dateParam } = await searchParams;

  const course = await prisma.course.findFirst({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      totalSeats: true,
      reservedSeats: true,
      category: true,
      startDate: true,
      endDate: true,
    },
  });
  if (!course) notFound();

  // Default date: today (or course start date if in future)
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = dateParam ?? today;
  const selectedDateObj = new Date(`${selectedDate}T00:00:00.000Z`);

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, status: { in: ["ACTIVE", "COMPLETED"] } },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, crm: true } },
      attendances: {
        where: { date: selectedDateObj },
        select: { status: true },
      },
    },
    orderBy: { enrolledAt: "asc" },
  });

  const totalEnrolled = enrollments.length;
  const presentCount = enrollments.filter(
    (e) => e.attendances[0]?.status === "PRESENT" || e.attendances[0]?.status === "LATE",
  ).length;

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin/cursos"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Cursos
        </Link>
        <span className="text-muted/40">/</span>
        <Link
          href={`/admin/cursos/${slug}`}
          className="font-sans text-sm text-muted hover:text-foreground transition-colors line-clamp-1 max-w-[200px]"
        >
          {course.title}
        </Link>
        <span className="text-muted/40">/</span>
        <span className="font-sans text-sm text-foreground">Inscritos</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground mb-1">Inscritos</h1>
          <p className="font-sans text-sm text-muted">{course.title}</p>
        </div>
        <a
          href={`/api/admin/inscritos/${course.id}/export.csv`}
          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-2 rounded-lg border border-border text-muted hover:border-primary/40 hover:text-foreground transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="font-sans text-xs text-muted mb-1">Inscritos</p>
          <p className="font-serif text-2xl font-semibold text-foreground">{totalEnrolled}</p>
          {course.totalSeats && (
            <p className="font-sans text-xs text-muted mt-0.5">de {course.totalSeats} vagas</p>
          )}
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="font-sans text-xs text-muted mb-1">Presentes hoje</p>
          <p className="font-serif text-2xl font-semibold text-green-400">{presentCount}</p>
          {totalEnrolled > 0 && (
            <p className="font-sans text-xs text-muted mt-0.5">
              {Math.round((presentCount / totalEnrolled) * 100)}% do total
            </p>
          )}
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="font-sans text-xs text-muted mb-1">Vagas livres</p>
          <p className="font-serif text-2xl font-semibold text-foreground">
            {course.totalSeats !== null ? course.totalSeats - course.reservedSeats : "—"}
          </p>
        </div>
      </div>

      {/* Date picker + check-in table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-sans text-sm font-semibold text-foreground">Lista de presença</h2>
          </div>
          <DatePicker value={selectedDate} />
        </div>

        {enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-8 h-8 text-muted/30 mb-3" />
            <p className="font-sans text-sm text-muted">Nenhum inscrito neste curso ainda.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left font-sans text-[11px] font-bold uppercase tracking-widest text-muted py-3 px-4">
                  Aluno
                </th>
                <th className="text-right font-sans text-[11px] font-bold uppercase tracking-widest text-muted py-3 px-4">
                  Presença — {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <CheckInRow
                  key={enrollment.id}
                  enrollmentId={enrollment.id}
                  courseSlug={slug}
                  studentName={enrollment.user.name ?? enrollment.user.email}
                  studentEmail={enrollment.user.email}
                  studentPhone={enrollment.user.phone}
                  date={selectedDate}
                  initialStatus={enrollment.attendances[0]?.status ?? null}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
