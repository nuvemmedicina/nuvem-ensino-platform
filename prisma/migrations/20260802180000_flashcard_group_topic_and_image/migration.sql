-- Grupo de flashcards passa a pertencer a um tópico do curso.
-- É o que permite organizar a listagem do aluno por módulo, na ordem do
-- currículo, com a cor de cada módulo. Fica opcional: grupos antigos e
-- material solto continuam sem tópico.
ALTER TABLE "FlashcardGroup" ADD COLUMN IF NOT EXISTS "topicId" TEXT;

-- Capa própria do grupo. Sem ela, a listagem cai na imagem do curso.
ALTER TABLE "FlashcardGroup" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

CREATE INDEX IF NOT EXISTS "FlashcardGroup_topicId_idx" ON "FlashcardGroup"("topicId");

-- SET NULL: apagar um tópico não pode levar junto os flashcards dele.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FlashcardGroup_topicId_fkey'
  ) THEN
    ALTER TABLE "FlashcardGroup"
      ADD CONSTRAINT "FlashcardGroup_topicId_fkey"
      FOREIGN KEY ("topicId") REFERENCES "Topic"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
