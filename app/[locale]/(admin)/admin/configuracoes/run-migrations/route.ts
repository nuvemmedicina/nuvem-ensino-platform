import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const results: string[] = [];

  // ── Migração 1: releaseDate no Module + tabela ModuleInstructor ──────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "releaseDate" TIMESTAMP(3)`);
    results.push("✓ Module.releaseDate adicionado");
  } catch (e) {
    results.push(`✗ Module.releaseDate: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ModuleInstructor" (
        "id"           TEXT NOT NULL,
        "moduleId"     TEXT NOT NULL,
        "instructorId" TEXT NOT NULL,
        "order"        INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "ModuleInstructor_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("✓ Tabela ModuleInstructor criada");
  } catch (e) {
    results.push(`✗ ModuleInstructor table: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ModuleInstructor_moduleId_instructorId_key"
        ON "ModuleInstructor"("moduleId", "instructorId")
    `);
    results.push("✓ Índice único ModuleInstructor criado");
  } catch (e) {
    results.push(`✗ ModuleInstructor index: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ModuleInstructor"
        ADD CONSTRAINT IF NOT EXISTS "ModuleInstructor_moduleId_fkey"
        FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    results.push("✓ FK ModuleInstructor → Module adicionada");
  } catch (e) {
    results.push(`✗ FK moduleId: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ModuleInstructor"
        ADD CONSTRAINT IF NOT EXISTS "ModuleInstructor_instructorId_fkey"
        FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    results.push("✓ FK ModuleInstructor → Instructor adicionada");
  } catch (e) {
    results.push(`✗ FK instructorId: ${e}`);
  }

  // ── Migração 2: tabela LessonComment ────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LessonComment" (
        "id"        TEXT NOT NULL,
        "lessonId"  TEXT NOT NULL,
        "userId"    TEXT NOT NULL,
        "parentId"  TEXT,
        "content"   TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LessonComment_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("✓ Tabela LessonComment criada");
  } catch (e) {
    results.push(`✗ LessonComment table: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LessonComment"
        ADD CONSTRAINT IF NOT EXISTS "LessonComment_lessonId_fkey"
        FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    results.push("✓ FK LessonComment → Lesson adicionada");
  } catch (e) {
    results.push(`✗ FK lessonId: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LessonComment"
        ADD CONSTRAINT IF NOT EXISTS "LessonComment_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    results.push("✓ FK LessonComment → User adicionada");
  } catch (e) {
    results.push(`✗ FK userId: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LessonComment"
        ADD CONSTRAINT IF NOT EXISTS "LessonComment_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "LessonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    results.push("✓ FK LessonComment → LessonComment (parentId) adicionada");
  } catch (e) {
    results.push(`✗ FK parentId: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LessonComment_lessonId_idx" ON "LessonComment"("lessonId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LessonComment_parentId_idx" ON "LessonComment"("parentId")`);
    results.push("✓ Índices LessonComment criados");
  } catch (e) {
    results.push(`✗ LessonComment indexes: ${e}`);
  }

  // ── Migração 3: showCertificationSeals no Course ────────────────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "showCertificationSeals" BOOLEAN NOT NULL DEFAULT false`);
    results.push("✓ Course.showCertificationSeals adicionado");
  } catch (e) {
    results.push(`✗ Course.showCertificationSeals: ${e}`);
  }

  try {
    await prisma.$executeRawUnsafe(`UPDATE "Course" SET "showCertificationSeals" = true WHERE slug = 'dici-neurogastroenterologia-2026'`);
    results.push("✓ Selos ativados para DICI");
  } catch (e) {
    results.push(`✗ UPDATE selos DICI: ${e}`);
  }

  // ── Migração 4: faqJson no Course ───────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "faqJson" TEXT`);
    results.push("✓ Course.faqJson adicionado");
  } catch (e) {
    results.push(`✗ Course.faqJson: ${e}`);
  }

  // ── Migração 5: corrigir reservedSeats negativos ────────────────────────
  try {
    await prisma.$executeRawUnsafe(`UPDATE "Course" SET "reservedSeats" = 0 WHERE "reservedSeats" < 0`);
    results.push("✓ reservedSeats negativos corrigidos para 0");
  } catch (e) {
    results.push(`✗ fix reservedSeats: ${e}`);
  }

  // ── Migração 6: colunas opcionais do Instructor ──────────────────────────
  const instructorCols: [string, string][] = [
    ["formation",    "TEXT"],
    ["institution",  "TEXT"],
    ["linkedin",     "TEXT"],
    ["instagram",    "TEXT"],
    ["lattes",       "TEXT"],
    ["displayOrder", "INTEGER NOT NULL DEFAULT 99"],
    ["bio",          "TEXT"],
  ];
  for (const [col, type] of instructorCols) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Instructor" ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
      results.push(`✓ Instructor.${col} adicionado`);
    } catch (e) {
      results.push(`✗ Instructor.${col}: ${e}`);
    }
  }

  // ── Migração 7: description nas Lessons ─────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "description" TEXT`);
    results.push("✓ Lesson.description adicionado");
  } catch (e) {
    results.push(`✗ Lesson.description: ${e}`);
  }

  // ── Migração 8: tabela LessonInstructor ──────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LessonInstructor" (
        "id"           TEXT NOT NULL,
        "lessonId"     TEXT NOT NULL,
        "instructorId" TEXT NOT NULL,
        "order"        INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "LessonInstructor_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("✓ Tabela LessonInstructor criada");
  } catch (e) {
    results.push(`✗ LessonInstructor table: ${e}`);
  }
  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "LessonInstructor_lessonId_instructorId_key" ON "LessonInstructor"("lessonId", "instructorId")`);
    results.push("✓ Índice único LessonInstructor criado");
  } catch (e) {
    results.push(`✗ LessonInstructor index: ${e}`);
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "LessonInstructor" ADD CONSTRAINT IF NOT EXISTS "LessonInstructor_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ FK LessonInstructor → Lesson");
  } catch (e) {
    results.push(`✗ FK lessonId: ${e}`);
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "LessonInstructor" ADD CONSTRAINT IF NOT EXISTS "LessonInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ FK LessonInstructor → Instructor");
  } catch (e) {
    results.push(`✗ FK instructorId: ${e}`);
  }

  // ── Migração 9: valor PENDING no enum EnrollmentStatus ──────────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'ACTIVE'`);
    results.push("✓ EnrollmentStatus.PENDING adicionado");
  } catch (e) {
    results.push(`✗ EnrollmentStatus.PENDING: ${e}`);
  }

  // ── Migração 10: tabelas do Fórum ────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ForumPost" (
        "id"         TEXT NOT NULL,
        "courseId"   TEXT NOT NULL,
        "authorId"   TEXT NOT NULL,
        "title"      TEXT NOT NULL,
        "content"    TEXT NOT NULL,
        "isPinned"   BOOLEAN NOT NULL DEFAULT false,
        "isAnswered" BOOLEAN NOT NULL DEFAULT false,
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("✓ Tabela ForumPost criada");
  } catch (e) { results.push(`✗ ForumPost: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ForumReply" (
        "id"               TEXT NOT NULL,
        "postId"           TEXT NOT NULL,
        "authorId"         TEXT NOT NULL,
        "content"          TEXT NOT NULL,
        "isOfficialAnswer" BOOLEAN NOT NULL DEFAULT false,
        "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ForumReply_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("✓ Tabela ForumReply criada");
  } catch (e) { results.push(`✗ ForumReply: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ForumLike" (
        "id"      TEXT NOT NULL,
        "userId"  TEXT NOT NULL,
        "postId"  TEXT,
        "replyId" TEXT,
        CONSTRAINT "ForumLike_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("✓ Tabela ForumLike criada");
  } catch (e) { results.push(`✗ ForumLike: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ForumLike_userId_postId_key" ON "ForumLike"("userId", "postId") WHERE "postId" IS NOT NULL`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ForumLike_userId_replyId_key" ON "ForumLike"("userId", "replyId") WHERE "replyId" IS NOT NULL`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ForumPost_courseId_idx" ON "ForumPost"("courseId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ForumReply_postId_idx" ON "ForumReply"("postId")`);
    results.push("✓ Índices do Fórum criados");
  } catch (e) { results.push(`✗ Forum indexes: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ FK ForumPost → Course");
  } catch (e) { results.push(`✗ FK ForumPost.courseId: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ FK ForumPost → User");
  } catch (e) { results.push(`✗ FK ForumPost.authorId: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ FK ForumReply → ForumPost");
  } catch (e) { results.push(`✗ FK ForumReply.postId: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ FK ForumReply → User");
  } catch (e) { results.push(`✗ FK ForumReply.authorId: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ForumLike" ADD CONSTRAINT "ForumLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ FK ForumLike → User");
  } catch (e) { results.push(`✗ FK ForumLike.userId: ${e}`); }

  // ── Migração 11: User.taxId (CPF) ───────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "taxId" TEXT`);
    results.push("✓ User.taxId adicionado");
  } catch (e) { results.push(`✗ User.taxId: ${e}`); }

  // ── Migração 12: Provas por módulo ───────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ModuleQuiz" (
        "id"             TEXT NOT NULL,
        "moduleId"       TEXT NOT NULL,
        "title"          TEXT NOT NULL DEFAULT 'Prova do Módulo',
        "availableFrom"  TIMESTAMP(3),
        "availableUntil" TIMESTAMP(3),
        "passingPct"     INTEGER NOT NULL DEFAULT 80,
        "maxAttempts"    INTEGER NOT NULL DEFAULT 3,
        "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ModuleQuiz_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("✓ Tabela ModuleQuiz criada");
  } catch (e) { results.push(`✗ ModuleQuiz: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ModuleQuiz_moduleId_key" ON "ModuleQuiz"("moduleId")`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ModuleQuiz" ADD CONSTRAINT IF NOT EXISTS "ModuleQuiz_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ Index + FK ModuleQuiz → Module");
  } catch (e) { results.push(`✗ ModuleQuiz FK: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ModuleQuizQuestion" (
        "id"     TEXT NOT NULL,
        "quizId" TEXT NOT NULL,
        "text"   TEXT NOT NULL,
        "order"  INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "ModuleQuizQuestion_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ModuleQuizQuestion_quizId_idx" ON "ModuleQuizQuestion"("quizId")`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ModuleQuizQuestion" ADD CONSTRAINT IF NOT EXISTS "ModuleQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "ModuleQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ Tabela ModuleQuizQuestion criada");
  } catch (e) { results.push(`✗ ModuleQuizQuestion: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ModuleQuizOption" (
        "id"         TEXT NOT NULL,
        "questionId" TEXT NOT NULL,
        "text"       TEXT NOT NULL,
        "isCorrect"  BOOLEAN NOT NULL DEFAULT false,
        "order"      INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "ModuleQuizOption_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ModuleQuizOption_questionId_idx" ON "ModuleQuizOption"("questionId")`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ModuleQuizOption" ADD CONSTRAINT IF NOT EXISTS "ModuleQuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ModuleQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ Tabela ModuleQuizOption criada");
  } catch (e) { results.push(`✗ ModuleQuizOption: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ModuleQuizAttempt" (
        "id"        TEXT NOT NULL,
        "quizId"    TEXT NOT NULL,
        "userId"    TEXT NOT NULL,
        "score"     INTEGER NOT NULL,
        "total"     INTEGER NOT NULL,
        "passed"    BOOLEAN NOT NULL,
        "answers"   JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ModuleQuizAttempt_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ModuleQuizAttempt_quizId_idx" ON "ModuleQuizAttempt"("quizId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ModuleQuizAttempt_userId_idx" ON "ModuleQuizAttempt"("userId")`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ModuleQuizAttempt" ADD CONSTRAINT IF NOT EXISTS "ModuleQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "ModuleQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ModuleQuizAttempt" ADD CONSTRAINT IF NOT EXISTS "ModuleQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("✓ Tabela ModuleQuizAttempt criada");
  } catch (e) { results.push(`✗ ModuleQuizAttempt: ${e}`); }

  // ── Migração 13: tabela LiveLead (inscrições de live) ───────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LiveLead" (
        "id"            TEXT NOT NULL,
        "eventSlug"     TEXT NOT NULL,
        "nome"          TEXT NOT NULL,
        "especialidade" TEXT NOT NULL,
        "telefone"      TEXT NOT NULL,
        "email"         TEXT NOT NULL,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LiveLead_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LiveLead_eventSlug_idx" ON "LiveLead"("eventSlug")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LiveLead_email_idx" ON "LiveLead"("email")`);
    results.push("✓ Tabela LiveLead criada");
  } catch (e) { results.push(`✗ LiveLead: ${e}`); }

  // ── Migração 14: coluna audioUrl na tabela Lesson (AudioCast) ──────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT`);
    results.push("✓ Coluna audioUrl adicionada à Lesson");
  } catch (e) { results.push(`✗ audioUrl: ${e}`); }

  // ── Migração 15: coluna couponId na tabela Payment ───────────────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "couponId" TEXT`);
    results.push("✓ Coluna couponId adicionada à Payment");
  } catch (e) { results.push(`✗ couponId: ${e}`); }

  // ── Migração 16: eventSlug na LiveSession ────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "eventSlug" TEXT`);
    results.push("✓ LiveSession.eventSlug adicionado");
  } catch (e) { results.push(`✗ LiveSession.eventSlug: ${e}`); }

  try {
    await prisma.$executeRawUnsafe(`
      UPDATE "LiveSession" SET "eventSlug" = 'dici-live-julho-2026'
      WHERE title ILIKE '%ROMA V%' AND "eventSlug" IS NULL
    `);
    results.push("✓ eventSlug setado para Roma V");
  } catch (e) { results.push(`✗ UPDATE Roma V eventSlug: ${e}`); }

  // ── Migração 17: matricular instrutores nos próprios cursos ───────────────
  try {
    // Instrutor principal do curso
    const courses = await prisma.course.findMany({
      select: { id: true, instructor: { select: { userId: true } } },
    });
    let enrolled = 0;
    for (const course of courses) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: course.instructor.userId, courseId: course.id } },
        create: { userId: course.instructor.userId, courseId: course.id, status: "ACTIVE" },
        update: { status: "ACTIVE" },
      });
      enrolled++;
    }

    // Docentes de módulo
    const moduleInstructors = await prisma.moduleInstructor.findMany({
      select: {
        instructor: { select: { userId: true } },
        module: { select: { courseId: true } },
      },
    });
    for (const mi of moduleInstructors) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: mi.instructor.userId, courseId: mi.module.courseId } },
        create: { userId: mi.instructor.userId, courseId: mi.module.courseId, status: "ACTIVE" },
        update: { status: "ACTIVE" },
      });
      enrolled++;
    }

    results.push(`✓ Instrutores matriculados: ${enrolled} registro(s) processado(s)`);
  } catch (e) { results.push(`✗ Matrícula de instrutores: ${e}`); }

  return NextResponse.json({ ok: true, results });
}
