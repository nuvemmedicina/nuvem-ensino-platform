import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * De quanto em quanto tempo o papel do usuário é relido do banco.
 *
 * A sessão é um JWT: o papel fica gravado dentro do token no momento do login.
 * Sem esta releitura, promover alguém a Editor em /admin/usuarios só teria
 * efeito no próximo login — e, pior, tirar o acesso de alguém demoraria os
 * 30 dias de validade do token.
 */
const ROLE_TTL_MS = 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "STUDENT";
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
        token.roleSyncedAt = Date.now();
        return token;
      }

      const userId = token.id as string | undefined;
      if (!userId) return token;

      const syncedAt = typeof token.roleSyncedAt === "number" ? token.roleSyncedAt : 0;
      if (Date.now() - syncedAt <= ROLE_TTL_MS) return token;

      try {
        const atual = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, emailVerified: true },
        });

        // Conta apagada: a sessão morre junto.
        if (!atual) return null;

        token.role = atual.role;
        token.emailVerified = atual.emailVerified;
        token.roleSyncedAt = Date.now();
      } catch {
        // Banco fora do ar não desloga ninguém: mantém o token como está e
        // tenta de novo na próxima requisição (roleSyncedAt não avança).
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = (token.emailVerified as Date | null) ?? null;
      }
      return session;
    },
  },
});
