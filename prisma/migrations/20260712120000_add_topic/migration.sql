-- Cria tabela Topic
CREATE TABLE IF NOT EXISTS "Topic" (
  "id" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Topic_moduleId_fkey'
  ) THEN
    ALTER TABLE "Topic" ADD CONSTRAINT "Topic_moduleId_fkey"
      FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Adiciona coluna topicId em Lesson (opcional)
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "topicId" TEXT;

-- Cria um Topic por Lesson existente (usando coluna temporária para mapeamento)
ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "_srcLessonId" TEXT;

INSERT INTO "Topic" ("id", "moduleId", "title", "order", "_srcLessonId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "moduleId",
  "title",
  "order",
  "id",
  NOW(),
  NOW()
FROM "Lesson"
WHERE NOT EXISTS (
  SELECT 1 FROM "Topic" t WHERE t."_srcLessonId" = "Lesson"."id"
);

-- Aponta cada Lesson para o Topic criado a partir dela
UPDATE "Lesson" l
SET "topicId" = t."id"
FROM "Topic" t
WHERE t."_srcLessonId" = l."id"
  AND l."topicId" IS NULL;

-- Remove coluna temporária
ALTER TABLE "Topic" DROP COLUMN IF EXISTS "_srcLessonId";

-- Índice de performance
CREATE INDEX IF NOT EXISTS "Topic_moduleId_idx" ON "Topic"("moduleId");
CREATE INDEX IF NOT EXISTS "Lesson_topicId_idx" ON "Lesson"("topicId");

-- FK de Lesson → Topic
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Lesson_topicId_fkey'
  ) THEN
    ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_topicId_fkey"
      FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
