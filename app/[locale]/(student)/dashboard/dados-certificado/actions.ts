"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cpfValido } from "@/lib/cpf";
import { validarDados, type CampoDados } from "@/lib/dadosCertificado";

export type EstadoDadosCertificado =
  | { ok: true }
  | { ok: false; erros: (CampoDados | "confirmo")[] }
  | { ok: false; erro: "geral" }
  | null;

/**
 * Grava os dados que a FACOP pede para o certificado e marca como respondidos
 * os pedidos em aberto do aluno (um por curso).
 */
export async function salvarDadosCertificado(
  _anterior: EstadoDadosCertificado,
  formData: FormData,
): Promise<EstadoDadosCertificado> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, erro: "geral" };
  const userId = session.user.id;

  const atual = await prisma.user.findUnique({ where: { id: userId }, select: { taxId: true } });
  if (!atual) return { ok: false, erro: "geral" };

  // CPF já válido no cadastro fica como está: é o mesmo das cobranças e notas
  // fiscais, e quem corrige é a coordenação (igual ao perfil).
  const cpfFixo = !!atual.taxId && cpfValido(atual.taxId);
  const entrada = Object.fromEntries(formData.entries());
  if (cpfFixo) entrada.cpf = atual.taxId!;

  const { dados, erros } = validarDados(entrada);
  const todos: (CampoDados | "confirmo")[] = [...erros];
  if (formData.get("confirmo") !== "on") todos.push("confirmo");
  if (todos.length) return { ok: false, erros: todos };

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: dados.nome,
          ...(cpfFixo ? {} : { taxId: dados.cpf }),
          rg: dados.rg,
          rgIssuer: dados.rgOrgao,
          birthplace: `${dados.naturalidadeCidade} - ${dados.naturalidadeUf}`,
          phone: dados.telefone,
          postalCode: dados.cep,
          address: dados.rua,
          addressNumber: dados.numero,
          addressComplement: dados.complemento || null,
          province: dados.bairro,
          city: dados.cidade,
          state: dados.uf,
        },
      }),
      prisma.enrollment.updateMany({
        where: { userId, certDataRequestedAt: { not: null } },
        data: { certDataSubmittedAt: new Date() },
      }),
    ]);
  } catch (e) {
    console.error("[dados-certificado] falha ao salvar", e);
    return { ok: false, erro: "geral" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
