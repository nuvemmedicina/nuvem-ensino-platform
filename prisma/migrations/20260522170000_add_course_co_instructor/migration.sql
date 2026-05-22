-- Add co-instructor fields to Course for partnership courses
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "coInstructorName"       TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "coInstructorCredential" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "coInstructorPhotoUrl"   TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "coInstructorBio"        TEXT;
