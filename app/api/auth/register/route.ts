import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/tokens";
import { sendEmailVerificationEmail } from "@/lib/email";
import { sendAfterResponse } from "@/lib/emailBackground";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "Este email já está cadastrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Envia o e-mail de verificação sem travar o cadastro, mas registrando a falha:
  // engolir o erro aqui deixava o aluno sem e-mail e sem nenhum rastro do motivo.
  sendAfterResponse("verificação de e-mail", email, async () => {
    const token = await createEmailVerificationToken(email);
    return sendEmailVerificationEmail({ to: email, userName: name, token });
  });

  return NextResponse.json({ ok: true });
}
