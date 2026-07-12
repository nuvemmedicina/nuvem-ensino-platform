-- Move apostilaUrl from Module to Topic
ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "apostilaUrl" TEXT;
ALTER TABLE "Module" DROP COLUMN IF EXISTS "apostilaUrl";
