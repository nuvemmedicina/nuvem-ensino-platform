import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteR2Object } from "@/lib/r2";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return session?.user?.id && (role === "ADMIN" || role === "INSTRUCTOR");
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
    const url = new URL(ref.fileUrl);
    const key = url.pathname.replace(/^\//, "");
    if (key.startsWith("references/")) await deleteR2Object(key);
  } catch {}

  await prisma.courseReference.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
