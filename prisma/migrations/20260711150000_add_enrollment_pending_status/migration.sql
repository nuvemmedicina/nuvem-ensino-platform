-- The Prisma schema already declared EnrollmentStatus.PENDING, but the initial
-- migration never added it to the Postgres enum (only ACTIVE/COMPLETED/CANCELLED/REFUNDED
-- exist in the database). This drift caused app/api/checkout/route.ts to reuse "CANCELLED"
-- as a pre-payment placeholder instead, which was confusing admins/students into thinking
-- enrollments awaiting payment had actually been cancelled.
ALTER TYPE "EnrollmentStatus" ADD VALUE 'PENDING' BEFORE 'ACTIVE';
