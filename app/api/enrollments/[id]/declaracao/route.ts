import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { gerarDeclaracaoMatricula } from "@/lib/declaracaoMatricula";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Declaração de matrícula em PDF, gerada na hora. Só o dono da matrícula (ou ADMIN). */
export async function GET(_req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { id: userId, role } = session.user;
  // Matrícula de outra pessoa recebe o mesmo 404 de matrícula inexistente
  const resultado = await gerarDeclaracaoMatricula(id, (donoId) => donoId === userId || role === "ADMIN");

  if (!resultado.ok && resultado.motivo === "nao-encontrada") {
    return Response.json({ error: "Matrícula não encontrada" }, { status: 404 });
  }
  if (!resultado.ok) {
    const erro = resultado.motivo === "sem-cpf" ? "CPF não cadastrado" : "Matrícula não está ativa";
    return Response.json({ error: erro, motivo: resultado.motivo }, { status: 409 });
  }

  return new Response(new Uint8Array(resultado.pdf), {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${resultado.nomeArquivo}"`,
      "Cache-Control":       "no-store",
    },
  });
}
