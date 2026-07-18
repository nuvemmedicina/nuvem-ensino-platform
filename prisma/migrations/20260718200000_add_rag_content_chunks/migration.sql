-- Ativa extensão pgvector (Neon já suporta)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de chunks indexados para RAG
CREATE TABLE "ContentChunk" (
  "id"         TEXT NOT NULL,
  "courseId"   TEXT NOT NULL,
  "moduleId"   TEXT,
  "lessonId"   TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceId"   TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "text"       TEXT NOT NULL,
  "embedding"  vector(1536),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE INDEX "ContentChunk_courseId_idx" ON "ContentChunk"("courseId");
CREATE INDEX "ContentChunk_lessonId_idx" ON "ContentChunk"("lessonId");

-- Índice vetorial para busca por similaridade (HNSW — mais rápido em produção)
CREATE INDEX "ContentChunk_embedding_idx" ON "ContentChunk"
  USING hnsw ("embedding" vector_cosine_ops);

-- FK
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
