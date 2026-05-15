import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
  if (!course) return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: { in: ["ACTIVE", "COMPLETED"] } },
    include: {
      user: { select: { name: true, email: true, phone: true, crm: true } },
      attendances: { select: { date: true, status: true }, orderBy: { date: "asc" } },
    },
    orderBy: { enrolledAt: "asc" },
  });

  // Collect all unique dates
  const allDates = [
    ...new Set(
      enrollments.flatMap((e) =>
        e.attendances.map((a) => a.date.toISOString().split("T")[0]),
      ),
    ),
  ].sort();

  // Build CSV
  const headers = [
    "Nome",
    "E-mail",
    "Telefone",
    "CRM",
    "Matriculado em",
    ...allDates,
    "Total Presenças",
  ];

  const rows = enrollments.map((e) => {
    const attendanceByDate = Object.fromEntries(
      e.attendances.map((a) => [a.date.toISOString().split("T")[0], a.status]),
    );
    const presences = e.attendances.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE",
    ).length;

    return [
      e.user.name ?? "",
      e.user.email,
      e.user.phone ?? "",
      e.user.crm ?? "",
      new Date(e.enrolledAt).toLocaleDateString("pt-BR"),
      ...allDates.map((d) => {
        const s = attendanceByDate[d];
        if (s === "PRESENT") return "P";
        if (s === "LATE") return "AT";
        if (s === "ABSENT") return "F";
        return "";
      }),
      String(presences),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");
  const filename = `inscritos-${courseId}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
