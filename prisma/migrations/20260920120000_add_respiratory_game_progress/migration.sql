-- RespiratoryGameProgress
CREATE TABLE IF NOT EXISTS "RespiratoryGameProgress" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"           TEXT NOT NULL,
  "totalAnswered"    INTEGER NOT NULL DEFAULT 0,
  "totalCorrect"     INTEGER NOT NULL DEFAULT 0,
  "bestStreak"       INTEGER NOT NULL DEFAULT 0,
  "conceptStats"     JSONB NOT NULL DEFAULT '{}',
  "skillStats"       JSONB NOT NULL DEFAULT '{}',
  "confidenceErrors" JSONB NOT NULL DEFAULT '{}',
  "errorCaseIds"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RespiratoryGameProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RespiratoryGameProgress_userId_key" ON "RespiratoryGameProgress"("userId");
ALTER TABLE "RespiratoryGameProgress" ADD CONSTRAINT "RespiratoryGameProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RespiratoryGameAnswer
CREATE TABLE IF NOT EXISTS "RespiratoryGameAnswer" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"     TEXT NOT NULL,
  "caseId"     TEXT NOT NULL,
  "correct"    BOOLEAN NOT NULL,
  "mode"       TEXT NOT NULL,
  "confidence" TEXT NOT NULL,
  "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RespiratoryGameAnswer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RespiratoryGameAnswer_userId_idx" ON "RespiratoryGameAnswer"("userId");
CREATE INDEX IF NOT EXISTS "RespiratoryGameAnswer_caseId_idx" ON "RespiratoryGameAnswer"("caseId");
ALTER TABLE "RespiratoryGameAnswer" ADD CONSTRAINT "RespiratoryGameAnswer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
