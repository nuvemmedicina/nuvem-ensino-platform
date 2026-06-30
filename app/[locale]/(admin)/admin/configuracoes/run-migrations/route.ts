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

  return NextResponse.json({ ok: true, results });
}
