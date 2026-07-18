CREATE TABLE "PresentationEvaluation" (
  "id"               TEXT NOT NULL,
  "presenterSlug"    TEXT NOT NULL,
  "overallRating"    INTEGER NOT NULL,
  "contentRating"    INTEGER NOT NULL,
  "didacticsRating"  INTEGER NOT NULL,
  "applicability"    INTEGER NOT NULL,
  "wouldRecommend"   BOOLEAN NOT NULL,
  "highlight"        TEXT,
  "nextTopicSuggest" TEXT,
  "respondentName"   TEXT,
  "respondentEmail"  TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PresentationEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PresentationEvaluation_presenterSlug_idx" ON "PresentationEvaluation"("presenterSlug");
