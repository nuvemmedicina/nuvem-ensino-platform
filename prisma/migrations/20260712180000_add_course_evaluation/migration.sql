CREATE TABLE IF NOT EXISTS "CourseEvaluation" (
  "id"               TEXT NOT NULL,
  "courseId"         TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "overallRating"    INTEGER NOT NULL,
  "contentRating"    INTEGER NOT NULL,
  "instructorRating" INTEGER NOT NULL,
  "platformRating"   INTEGER NOT NULL,
  "wouldRecommend"   BOOLEAN NOT NULL,
  "highlight"        TEXT,
  "suggestion"       TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseEvaluation_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CourseEvaluation_courseId_fkey'
  ) THEN
    ALTER TABLE "CourseEvaluation"
      ADD CONSTRAINT "CourseEvaluation_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CourseEvaluation_userId_fkey'
  ) THEN
    ALTER TABLE "CourseEvaluation"
      ADD CONSTRAINT "CourseEvaluation_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "CourseEvaluation_userId_courseId_key"
  ON "CourseEvaluation"("userId", "courseId");

CREATE INDEX IF NOT EXISTS "CourseEvaluation_courseId_idx"
  ON "CourseEvaluation"("courseId");
