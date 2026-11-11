"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPedidoDadosCertificado } from "@/lib/email";

export type ResultadoPedido = { enviados: number; falhas: string[] };

/**
 * Pede aos alunos selecionados os dados para o certificado da FACOP: marca o
 * pedido na matrícula e manda o e-mail com o link do formulário. Pode ser
 * repetido para reenviar o lembrete a quem ainda não respondeu.
 */
export async function pedirDadosCertificado(enrollmentIds: string[]): Promise<ResultadoPedido> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Não autorizado.");
  if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) return { enviados: 0, falhas: [] };
  if (enrollmentIds.length > 200) throw new Error("Selecione no máximo 200 alunos por vez.");

  const matriculas = await prisma.enrollment.findMany({
    where: { id: { in: enrollmentIds }, status: { in: ["ACTIVE", "COMPLETED"] } },
    select: { id: true, user: { select: { name: true, email: true } }, course: { select: { title: true } } },
  });

  let enviados = 0;
  const falhas: string[] = [];
  for (const m of matriculas) {
    await prisma.enrollment.update({ where: { id: m.id }, data: { certDataRequestedAt: new Date() } });
    const r = await sendPedidoDadosCertificado({ to: m.user.email, userName: m.user.name ?? "", courseName: m.course.title });
    if (r.ok) enviados++;
    else falhas.push(m.user.name ?? m.user.email);
    // A Resend aceita poucas mensagens por segundo
    await new Promise((ok) => setTimeout(ok, 600));
  }

  revalidatePath("/admin/certificados-facop");
  return { enviados, falhas };
}
