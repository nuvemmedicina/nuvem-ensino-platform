import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "Código inválido." }, { status: 400 });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false });
    }

    // Verifica limite de usos
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      discountPct: coupon.discountPct ?? 0,
      discountFlat: coupon.discountFlat ? Number(coupon.discountFlat) : 0,
    });
  } catch (err) {
    console.error("[coupons/validate]", err);
    return NextResponse.json({ valid: false, error: "Erro ao validar cupom." }, { status: 500 });
  }
}
