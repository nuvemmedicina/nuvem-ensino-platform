import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { slug } = await params;
  const lessonId = req.nextUrl.searchParams.get("lessonId");

  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      title: true,
      modules: {
        select: {
          title: true,
          lessons: {
            where: lessonId ? { id: lessonId } : undefined,
            select: { id: true, title: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!course) return NextResponse.json({});

  const module = course.modules.find((m) => m.lessons.length > 0);
  const lesson = module?.lessons[0];

  return NextResponse.json({
    courseTitle: course.title,
    moduleTitle: module?.title ?? null,
    lessonTitle: lesson?.title ?? null,
  });
}
