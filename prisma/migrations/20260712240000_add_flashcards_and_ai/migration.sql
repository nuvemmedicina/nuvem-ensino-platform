-- Enums
CREATE TYPE "FlashcardDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "FlashcardBackgroundType" AS ENUM ('SOLID', 'GRADIENT', 'IMAGE');
CREATE TYPE "FlashcardLogoSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "FlashcardCardSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "FlashcardFlipAnimation" AS ENUM ('HORIZONTAL_3D', 'VERTICAL_3D', 'FADE', 'SLIDE');
CREATE TYPE "AIProvider" AS ENUM ('ANTHROPIC', 'OPENAI', 'GOOGLE');

-- FlashcardDesignConfig
CREATE TABLE IF NOT EXISTS "FlashcardDesignConfig" (
  "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "backgroundType"         "FlashcardBackgroundType" NOT NULL DEFAULT 'SOLID',
  "backgroundValue"        TEXT NOT NULL DEFAULT '#ffffff',
  "textColor"              TEXT NOT NULL DEFAULT '#1a1a1a',
  "borderWidth"            INTEGER NOT NULL DEFAULT 1,
  "borderColor"            TEXT NOT NULL DEFAULT '#e5e7eb',
  "borderRadius"           INTEGER NOT NULL DEFAULT 12,
  "logoUrl"                TEXT,
  "logoSize"               "FlashcardLogoSize" NOT NULL DEFAULT 'MEDIUM',
  "cardSize"               "FlashcardCardSize" NOT NULL DEFAULT 'MEDIUM',
  "flipAnimation"          "FlashcardFlipAnimation" NOT NULL DEFAULT 'HORIZONTAL_3D',
  "shuffleEnabled"         BOOLEAN NOT NULL DEFAULT true,
  "spacedRepetitionEnabled" BOOLEAN NOT NULL DEFAULT true,
  "isDefault"              BOOLEAN NOT NULL DEFAULT false,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FlashcardDesignConfig_pkey" PRIMARY KEY ("id")
);

-- FlashcardGroup
CREATE TABLE IF NOT EXISTS "FlashcardGroup" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "description"    TEXT,
  "courseId"       TEXT,
  "tags"           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "designConfigId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FlashcardGroup_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FlashcardGroup_courseId_idx" ON "FlashcardGroup"("courseId");
ALTER TABLE "FlashcardGroup" ADD CONSTRAINT "FlashcardGroup_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FlashcardGroup" ADD CONSTRAINT "FlashcardGroup_designConfigId_fkey"
  FOREIGN KEY ("designConfigId") REFERENCES "FlashcardDesignConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Flashcard
CREATE TABLE IF NOT EXISTS "Flashcard" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "groupId"    TEXT NOT NULL,
  "front"      TEXT NOT NULL,
  "back"       TEXT NOT NULL,
  "difficulty" "FlashcardDifficulty",
  "order"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Flashcard_groupId_idx" ON "Flashcard"("groupId");
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "FlashcardGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FlashcardStudySession
CREATE TABLE IF NOT EXISTS "FlashcardStudySession" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL,
  "groupId"       TEXT NOT NULL,
  "startedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"    TIMESTAMP(3),
  "cardsReviewed" INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FlashcardStudySession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FlashcardStudySession_userId_idx" ON "FlashcardStudySession"("userId");
CREATE INDEX IF NOT EXISTS "FlashcardStudySession_groupId_idx" ON "FlashcardStudySession"("groupId");
ALTER TABLE "FlashcardStudySession" ADD CONSTRAINT "FlashcardStudySession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlashcardStudySession" ADD CONSTRAINT "FlashcardStudySession_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "FlashcardGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FlashcardReview
CREATE TABLE IF NOT EXISTS "FlashcardReview" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sessionId"   TEXT NOT NULL,
  "flashcardId" TEXT NOT NULL,
  "rating"      "FlashcardDifficulty" NOT NULL,
  "reviewedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FlashcardReview_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FlashcardReview_sessionId_idx" ON "FlashcardReview"("sessionId");
CREATE INDEX IF NOT EXISTS "FlashcardReview_flashcardId_idx" ON "FlashcardReview"("flashcardId");
ALTER TABLE "FlashcardReview" ADD CONSTRAINT "FlashcardReview_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "FlashcardStudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlashcardReview" ADD CONSTRAINT "FlashcardReview_flashcardId_fkey"
  FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AIProviderConfig
CREATE TABLE IF NOT EXISTS "AIProviderConfig" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "provider"        "AIProvider" NOT NULL,
  "model"           TEXT NOT NULL,
  "apiKeyEncrypted" TEXT NOT NULL,
  "isActive"        BOOLEAN NOT NULL DEFAULT false,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIProviderConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AIProviderConfig_provider_key" UNIQUE ("provider")
);
