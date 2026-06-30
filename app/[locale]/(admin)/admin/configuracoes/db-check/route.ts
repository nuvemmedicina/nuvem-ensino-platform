import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // Test 1: basic Instructor query
  try {
    const count = await prisma.instructor.count();
    results["instructor_count"] = `✓ ${count} instrutores`;
  } catch (e) {
    results["instructor_count"] = `✗ ${String(e)}`;
  }

  // Test 2: full findMany (same as instrutores page)
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { courses: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    results["instructor_findMany"] = `✓ ${instructors.length} registros`;
  } catch (e) {
    results["instructor_findMany"] = `✗ ${String(e)}`;
  }

  // Test 3: check which Instructor columns exist
  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Instructor'
      ORDER BY ordinal_position
    `;
    results["instructor_columns"] = cols.map((c) => c.column_name).join(", ");
  } catch (e) {
    results["instructor_columns"] = `✗ ${String(e)}`;
  }

  // Test 4: check Course columns (faqJson)
  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Course'
      ORDER BY ordinal_position
    `;
    results["course_columns"] = cols.map((c) => c.column_name).join(", ");
  } catch (e) {
    results["course_columns"] = `✗ ${String(e)}`;
  }

  return NextResponse.json(results, { status: 200 });
}
