"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cpfValido, soDigitos, temCpf } from "@/lib/cpf";

export type EstadoCpf = { ok: boolean; erro?: "invalido" | "geral" } | null;

/**
 * Grava o CPF do aluno para emitir a declaração de matrícula.
 * Só preenche quando o cadastro ainda não tem CPF: trocar um CPF existente
 * continua com a coordenação (como no perfil).
 */
export async function salvarCpfParaDeclaracao(_anterior: EstadoCpf, formData: FormData): Promise<EstadoCpf> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, erro: "geral" };

  const cpf = soDigitos(String(formData.get("cpf") ?? ""));
  if (!cpfValido(cpf)) return { ok: false, erro: "invalido" };

  try {
    const atual = await prisma.user.findUnique({ where: { id: session.user.id }, select: { taxId: true } });
    if (!atual) return { ok: false, erro: "geral" };
    if (!temCpf(atual.taxId)) {
      await prisma.user.update({ where: { id: session.user.id }, data: { taxId: cpf } });
    }
  } catch {
    return { ok: false, erro: "geral" };
  }

  return { ok: true };
}
