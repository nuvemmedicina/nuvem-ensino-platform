-- Presencial ou online, escolhido no checkout dos cursos que perguntam (lib/modalidades.ts).
ALTER TABLE "Enrollment" ADD COLUMN "modalidade" TEXT;
