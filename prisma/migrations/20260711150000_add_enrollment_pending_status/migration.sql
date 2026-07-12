-- Adiciona PENDING ao enum EnrollmentStatus se ainda não existir
DO $$ BEGIN
  ALTER TYPE "EnrollmentStatus" ADD VALUE 'PENDING' BEFORE 'ACTIVE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
