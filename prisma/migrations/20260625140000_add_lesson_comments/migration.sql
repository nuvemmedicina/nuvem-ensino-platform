CREATE TABLE IF NOT EXISTS "LessonComment" (
    "id"        TEXT NOT NULL,
    "lessonId"  TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "parentId"  TEXT,
    "content"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonComment_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LessonComment_lessonId_fkey') THEN
    ALTER TABLE "LessonComment"
      ADD CONSTRAINT "LessonComment_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LessonComment_userId_fkey') THEN
    ALTER TABLE "LessonComment"
      ADD CONSTRAINT "LessonComment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LessonComment_parentId_fkey') THEN
    ALTER TABLE "LessonComment"
      ADD CONSTRAINT "LessonComment_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "LessonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "LessonComment_lessonId_idx" ON "LessonComment"("lessonId");
CREATE INDEX IF NOT EXISTS "LessonComment_parentId_idx" ON "LessonComment"("parentId");
