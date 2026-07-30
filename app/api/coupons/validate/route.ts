import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "Código inválido." }, { status: 400 });
    }

    // Busca só pelo código: as demais condições viram motivos distintos, para
    // o aluno saber por que o cupom não pegou em vez de receber sempre a mesma
    // mensagem de "inválido ou expirado".
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ valid: false, reason: "notfound" });
    }

    if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
      return NextResponse.json({ valid: false, reason: "expired" });
    }

    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, reason: "limit" });
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
