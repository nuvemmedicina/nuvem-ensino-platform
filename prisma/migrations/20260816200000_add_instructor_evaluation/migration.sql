CREATE TABLE "InstructorEvaluation" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "instructorId" TEXT NOT NULL,
  "courseId"     TEXT NOT NULL,
  "rating"       INTEGER NOT NULL,
  "suggestion"   TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstructorEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstructorEvaluation_userId_instructorId_courseId_key"
  ON "InstructorEvaluation"("userId", "instructorId", "courseId");
CREATE INDEX "InstructorEvaluation_instructorId_idx" ON "InstructorEvaluation"("instructorId");
CREATE INDEX "InstructorEvaluation_courseId_idx" ON "InstructorEvaluation"("courseId");

ALTER TABLE "InstructorEvaluation" ADD CONSTRAINT "InstructorEvaluation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstructorEvaluation" ADD CONSTRAINT "InstructorEvaluation_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstructorEvaluation" ADD CONSTRAINT "InstructorEvaluation_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
