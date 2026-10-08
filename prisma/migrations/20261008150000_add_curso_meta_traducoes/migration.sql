-- Título e descrição do Google em espanhol e inglês (vazios = usa o português)
ALTER TABLE "Course" ADD COLUMN "metaTitleEs" TEXT, ADD COLUMN "metaTitleEn" TEXT, ADD COLUMN "metaDescEs" TEXT, ADD COLUMN "metaDescEn" TEXT;
