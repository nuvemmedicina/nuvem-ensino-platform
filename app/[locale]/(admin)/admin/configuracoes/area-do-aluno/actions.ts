"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CHAVE_NOVA_AREA, ehModoNovaArea } from "@/lib/novaArea";

export async function salvarModoNovaArea(formData: FormData) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado");

  const modo = formData.get("modo");
  if (!ehModoNovaArea(modo)) throw new Error("Opção inválida");

  await prisma.platformSetting.upsert({
    where: { key: CHAVE_NOVA_AREA },
    create: { key: CHAVE_NOVA_AREA, value: modo },
    update: { value: modo },
  });

  revalidatePath("/", "layout");
}
