import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const MAX_SIZE_MB = 50;

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Armazenamento não configurado." }, { status: 503 });
  }

  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) || "apostilas";

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Apenas arquivos PDF são permitidos." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Arquivo muito grande. Máximo ${MAX_SIZE_MB} MB.` }, { status: 400 });
  }

  try {
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
    const blob = await put(filename, file, { access: "public", contentType: "application/pdf" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Falha ao enviar PDF: ${msg}` }, { status: 500 });
  }
}
