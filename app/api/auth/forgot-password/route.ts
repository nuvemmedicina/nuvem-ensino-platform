import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { sendAfterResponse } from "@/lib/emailBackground";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "Email inválido." }, { status: 400 });
  }

  const { email } = parsed.data;

  // Sempre retorna 200 — não revela se o email está cadastrado
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (user) {
    const token = await createPasswordResetToken(email);
    // Não bloqueia a resposta, mas roda até o fim: sem `after()` a instância era
    // congelada logo após o `return` e o envio morria no meio, sem erro e sem log.
    sendAfterResponse("redefinição de senha", email, () =>
      sendPasswordResetEmail({ to: email, userName: user.name ?? "Aluno", token }),
    );
  }

  return Response.json({ ok: true });
}
