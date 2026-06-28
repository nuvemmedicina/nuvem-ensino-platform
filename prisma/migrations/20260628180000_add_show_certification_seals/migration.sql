ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "showCertificationSeals" BOOLEAN NOT NULL DEFAULT false;

-- Ativar selos apenas no curso DICI (certificado pela FACOP/MEC)
UPDATE "Course" SET "showCertificationSeals" = true WHERE slug = 'dici-neurogastroenterologia-2026';
