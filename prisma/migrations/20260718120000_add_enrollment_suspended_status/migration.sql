-- Add SUSPENDED value to EnrollmentStatus enum for overdue installment handling
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
