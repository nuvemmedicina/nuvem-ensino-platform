CREATE TABLE IF NOT EXISTS "CourseReference" (
  "id"        TEXT NOT NULL,
  "courseId"  TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "fileUrl"   TEXT NOT NULL,
  "fileSize"  INTEGER,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseReference_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CourseReference"
  ADD CONSTRAINT "CourseReference_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
