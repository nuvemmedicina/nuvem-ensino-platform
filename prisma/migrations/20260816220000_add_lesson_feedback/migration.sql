CREATE TABLE "LessonFeedback" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "lessonId"   TEXT NOT NULL,
  "useful"     BOOLEAN NOT NULL,
  "suggestion" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LessonFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonFeedback_userId_lessonId_key" ON "LessonFeedback"("userId", "lessonId");
CREATE INDEX "LessonFeedback_lessonId_idx" ON "LessonFeedback"("lessonId");

ALTER TABLE "LessonFeedback" ADD CONSTRAINT "LessonFeedback_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonFeedback" ADD CONSTRAINT "LessonFeedback_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
