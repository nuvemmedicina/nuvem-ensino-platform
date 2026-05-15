import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  const { token, password } = parsed.data;

  // Busca o token na tabela VerificationToken
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || !record.identifier.startsWith("reset:")) {
    return Response.json({ ok: false, error: "Link inválido ou já utilizado." }, { status: 400 });
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return Response.json({ ok: false, error: "Este link expirou. Solicite um novo." }, { status: 400 });
  }

  const email = record.identifier.replace("reset:", "");

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return Response.json({ ok: false, error: "Usuário não encontrado." }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return Response.json({ ok: true });
}
