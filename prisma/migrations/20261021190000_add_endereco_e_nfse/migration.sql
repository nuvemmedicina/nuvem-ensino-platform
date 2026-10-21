-- Nota fiscal pelo Asaas: endereço de quem paga (o Asaas exige endereço
-- completo com CEP para emitir a NFS-e) e acompanhamento da nota no pagamento.
ALTER TABLE "User" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "addressNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "addressComplement" TEXT;
ALTER TABLE "User" ADD COLUMN "province" TEXT;

ALTER TABLE "Payment" ADD COLUMN "nfseStatus" TEXT;
ALTER TABLE "Payment" ADD COLUMN "nfseNumber" TEXT;
ALTER TABLE "Payment" ADD COLUMN "nfsePdfUrl" TEXT;
CREATE INDEX "Payment_nfseId_idx" ON "Payment"("nfseId");
