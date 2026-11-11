-- Dados que a FACOP pede para emitir o certificado e o controle do pedido,
-- feito pela coordenação em lotes.
ALTER TABLE "User" ADD COLUMN "city" TEXT;
ALTER TABLE "User" ADD COLUMN "state" TEXT;
ALTER TABLE "User" ADD COLUMN "rg" TEXT;
ALTER TABLE "User" ADD COLUMN "rgIssuer" TEXT;
ALTER TABLE "User" ADD COLUMN "birthplace" TEXT;

ALTER TABLE "Enrollment" ADD COLUMN "certDataRequestedAt" TIMESTAMP(3);
ALTER TABLE "Enrollment" ADD COLUMN "certDataSubmittedAt" TIMESTAMP(3);
