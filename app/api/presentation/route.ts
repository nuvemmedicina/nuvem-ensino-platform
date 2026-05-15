import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { PresentationPDF } from "@/components/PresentationPDF";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadPublicImage(filename: string): string | undefined {
  try {
    const filePath = path.join(process.cwd(), "public", filename);
    if (!fs.existsSync(filePath)) return undefined;
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const mime = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const logoUri =
    loadPublicImage("logo.png") ||
    undefined;

  const isoSeal =
    loadPublicImage("selo-iso-9001.png") ||
    loadPublicImage("selo-iso9001.png") ||
    undefined;

  const buffer = await renderToBuffer(
    PresentationPDF({ logoUri, isoSeal })
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": 'attachment; filename="nuvem-ensino-apresentacao-2026.pdf"',
      "Cache-Control":       "no-store",
    },
  });
}
