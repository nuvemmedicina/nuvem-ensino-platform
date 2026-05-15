import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "Token inválido." }, { status: 400 });
  }

  const { token } = parsed.data;

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || !record.identifier.startsWith("verify:")) {
    return Response.json({ ok: false, error: "Link inválido ou já utilizado." }, { status: 400 });
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return Response.json({ ok: false, error: "Este link expirou. Solicite um novo e-mail de verificação." }, { status: 400 });
  }

  const email = record.identifier.replace("verify:", "");

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return Response.json({ ok: true });
}
