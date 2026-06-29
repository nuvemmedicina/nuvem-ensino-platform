import { prisma } from "@/lib/prisma";
import CouponManager from "./CouponManager";

export default async function CuponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      usages: {
        include: {
          course: { select: { title: true, slug: true } },
        },
        orderBy: { usedAt: "desc" },
      },
    },
  });

  const serialized = coupons.map((c) => ({
    id:           c.id,
    code:         c.code,
    discountPct:  c.discountPct  ?? null,
    discountFlat: c.discountFlat ? c.discountFlat.toString() : null,
    maxUses:      c.maxUses      ?? null,
    usesCount:    c.usages.length,
    expiresAt:    c.expiresAt    ? c.expiresAt.toISOString() : null,
    active:       c.active,
    createdAt:    c.createdAt.toISOString(),
    usages:       c.usages.map((u) => ({
      courseTitle: u.course.title,
      courseSlug:  u.course.slug,
      usedAt:      u.usedAt.toISOString(),
    })),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">Cupons de desconto</h1>
        <p className="font-sans text-sm text-muted mt-1">
          Crie e gerencie cupons para campanhas e testes de pagamento.
        </p>
      </div>

      <CouponManager initialCoupons={serialized} />
    </div>
  );
}
