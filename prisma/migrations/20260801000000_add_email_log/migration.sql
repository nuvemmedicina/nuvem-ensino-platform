-- Status de cada tentativa de envio
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED');

-- Rastro permanente dos e-mails: o log de runtime da Vercel só guarda minutos
CREATE TABLE "EmailLog" (
  "id"         TEXT NOT NULL,
  "kind"       TEXT NOT NULL,
  "recipient"  TEXT NOT NULL,
  "status"     "EmailStatus" NOT NULL,
  "providerId" TEXT,
  "error"      TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- Índices: busca pelo e-mail do aluno, listagem por data e filtro por status
CREATE INDEX "EmailLog_recipient_idx" ON "EmailLog"("recipient");
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");
