-- Traduções de módulos, temas e aulas (vazias = usa o português)
ALTER TABLE "Module" ADD COLUMN "titleEs" TEXT, ADD COLUMN "titleEn" TEXT, ADD COLUMN "descriptionEs" TEXT, ADD COLUMN "descriptionEn" TEXT;
ALTER TABLE "Topic" ADD COLUMN "titleEs" TEXT, ADD COLUMN "titleEn" TEXT, ADD COLUMN "descriptionEs" TEXT, ADD COLUMN "descriptionEn" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "titleEs" TEXT, ADD COLUMN "titleEn" TEXT, ADD COLUMN "descriptionEs" TEXT, ADD COLUMN "descriptionEn" TEXT;
