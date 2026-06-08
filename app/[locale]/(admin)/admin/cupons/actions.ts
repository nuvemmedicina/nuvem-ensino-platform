"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado");
}

export async function createCoupon(data: {
  code: string;
  discountPct: number | null;
  discountFlat: number | null;
  maxUses: number | null;
  expiresAt: string | null;
}) {
  await requireAdmin();

  const code = data.code.trim().toUpperCase();
  if (!code) throw new Error("Código obrigatório");
  if (!data.discountPct && !data.discountFlat) throw new Error("Informe o desconto");

  await prisma.coupon.create({
    data: {
      code,
      discountPct:  data.discountPct  ?? null,
      discountFlat: data.discountFlat ?? null,
      maxUses:      data.maxUses      ?? null,
      expiresAt:    data.expiresAt ? new Date(data.expiresAt) : null,
      active: true,
    },
  });

  revalidatePath("/admin/cupons");
}

export async function updateCoupon(
  id: string,
  data: {
    code: string;
    discountPct: number | null;
    discountFlat: number | null;
    maxUses: number | null;
    expiresAt: string | null;
    active: boolean;
  },
) {
  await requireAdmin();

  const code = data.code.trim().toUpperCase();
  if (!code) throw new Error("Código obrigatório");

  await prisma.coupon.update({
    where: { id },
    data: {
      code,
      discountPct:  data.discountPct  ?? null,
      discountFlat: data.discountFlat ?? null,
      maxUses:      data.maxUses      ?? null,
      expiresAt:    data.expiresAt ? new Date(data.expiresAt) : null,
      active:       data.active,
    },
  });

  revalidatePath("/admin/cupons");
}

export async function toggleCoupon(id: string, active: boolean) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { active } });
  revalidatePath("/admin/cupons");
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/cupons");
}
