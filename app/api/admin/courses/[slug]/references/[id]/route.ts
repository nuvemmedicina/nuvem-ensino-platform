import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteR2Object, r2KeyFromPublicUrl } from "@/lib/r2";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return session?.user?.id && (role === "ADMIN" || role === "INSTRUCTOR" || role === "EDITOR");
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const ref = await prisma.courseReference.findUnique({ where: { id } });
  if (!ref) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Tenta deletar do R2 (ignora erros — URL pode ser externa)
  try {
    const key = r2KeyFromPublicUrl(ref.fileUrl);
    if (key.startsWith("references/")) await deleteR2Object(key);
  } catch {}

  await prisma.courseReference.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
