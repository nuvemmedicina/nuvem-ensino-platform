-- AlterTable: add displayOrder with default 99
ALTER TABLE "Instructor" ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 99;

-- Set initial display order: Vera=1, Eliane=2, Anna=3, Felipe=4, Wanderley=5
UPDATE "Instructor" SET "displayOrder" = 1 WHERE slug LIKE '%vera%';
UPDATE "Instructor" SET "displayOrder" = 2 WHERE slug LIKE '%eliane%';
UPDATE "Instructor" SET "displayOrder" = 3 WHERE slug LIKE '%anna%' OR slug LIKE '%karoline%';
UPDATE "Instructor" SET "displayOrder" = 4 WHERE slug LIKE '%felipe%';
UPDATE "Instructor" SET "displayOrder" = 5 WHERE slug LIKE '%wanderley%';
