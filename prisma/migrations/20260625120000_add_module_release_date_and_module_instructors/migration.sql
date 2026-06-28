-- Add releaseDate to Module (null = available immediately, future date = drip)
ALTER TABLE "Module" ADD COLUMN "releaseDate" TIMESTAMP(3);

-- Create ModuleInstructor join table
CREATE TABLE "ModuleInstructor" (
    "id"           TEXT NOT NULL,
    "moduleId"     TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "order"        INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ModuleInstructor_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one instructor appears once per module
CREATE UNIQUE INDEX "ModuleInstructor_moduleId_instructorId_key"
    ON "ModuleInstructor"("moduleId", "instructorId");

-- Foreign keys
ALTER TABLE "ModuleInstructor"
    ADD CONSTRAINT "ModuleInstructor_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ModuleInstructor"
    ADD CONSTRAINT "ModuleInstructor_instructorId_fkey"
    FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
