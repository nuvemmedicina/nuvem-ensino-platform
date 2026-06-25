CREATE TABLE "LessonComment" (
    "id"        TEXT NOT NULL,
    "lessonId"  TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "parentId"  TEXT,
    "content"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LessonComment"
    ADD CONSTRAINT "LessonComment_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonComment"
    ADD CONSTRAINT "LessonComment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonComment"
    ADD CONSTRAINT "LessonComment_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "LessonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LessonComment_lessonId_idx" ON "LessonComment"("lessonId");
CREATE INDEX "LessonComment_parentId_idx" ON "LessonComment"("parentId");
