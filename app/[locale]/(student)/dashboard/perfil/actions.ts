"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type EstadoPerfil = { ok: boolean; erro?: "nome" | "geral" } | null;

/** Campos que o próprio aluno pode alterar. E-mail e CPF ficam com a coordenação. */
export async function salvarPerfil(_anterior: EstadoPerfil, formData: FormData): Promise<EstadoPerfil> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, erro: "geral" };

  const texto = (campo: string, max: number) => {
    const v = String(formData.get(campo) ?? "").replace(/\s+/g, " ").trim();
    return v ? v.slice(0, max) : null;
  };

  const nome = texto("nome", 120);
  // Nome sai no certificado: precisa ter pelo menos nome e sobrenome
  if (!nome || nome.split(" ").length < 2) return { ok: false, erro: "nome" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: nome,
        phone: texto("telefone", 30),
        specialty: texto("especialidade", 80),
        crm: texto("crm", 30),
      },
    });
  } catch {
    return { ok: false, erro: "geral" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
