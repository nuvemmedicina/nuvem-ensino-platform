import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/** Gera um token hexadecimal aleatório de 64 caracteres. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Cria (ou substitui) um token de redefinição de senha para o email informado.
 * Expira em 1 hora.
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  const identifier = `reset:${email}`;

  // Remove tokens anteriores para o mesmo email
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = generateToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

/**
 * Cria (ou substitui) um token de verificação de e-mail para o email informado.
 * Expira em 24 horas.
 */
export async function createEmailVerificationToken(email: string): Promise<string> {
  const identifier = `verify:${email}`;

  // Remove tokens anteriores para o mesmo email
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}
