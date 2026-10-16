-- Página de aula gratuita: consentimento LGPD, quanto do vídeo a pessoa
-- assistiu e de onde ela veio.
ALTER TABLE "LiveLead" ADD COLUMN "aceitaComunicacoes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LiveLead" ADD COLUMN "assistiuPct" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LiveLead" ADD COLUMN "ultimoAcesso" TIMESTAMP(3);
ALTER TABLE "LiveLead" ADD COLUMN "origem" TEXT;
