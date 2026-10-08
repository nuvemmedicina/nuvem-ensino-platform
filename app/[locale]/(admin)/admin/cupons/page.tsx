import { prisma } from "@/lib/prisma";
import { Ticket } from "lucide-react";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
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
      <CabecalhoAdmin
        titulo="Cupons de desconto"
        subtitulo="Crie e gerencie cupons para campanhas e testes de pagamento."
        icone={Ticket}
        destaques={[
          { rotulo: "ativos", valor: serialized.filter((c) => c.active).length, tom: "ok" },
          { rotulo: "no total", valor: serialized.length },
        ]}
      />

      <CouponManager initialCoupons={serialized} />
    </div>
  );
}
