-- Cupom restrito a um curso (vazio = vale para todos). Nasceu porque o
-- AINDADATEMPO, da campanha do DICI, foi usado no teste respiratório.
ALTER TABLE "Coupon" ADD COLUMN "courseId" TEXT;
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
