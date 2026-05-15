import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { CertificatePDF } from "@/components/CertificatePDF";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Lê um arquivo da pasta public/assinaturas e retorna data URI base64, ou undefined. */
function loadSignature(filename: string): string | undefined {
  try {
    const filePath = path.join(process.cwd(), "public", "assinaturas", filename);
    if (!fs.existsSync(filePath)) return undefined;
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      enrollment: {
        include: {
          course: {
            select: {
              title: true,
              hours: true,
              instructor: {
                select: {
                  userId: true,
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cert) {
    return Response.json({ error: "Certificado não encontrado" }, { status: 404 });
  }

  if (cert.userId !== session.user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Assinatura do instrutor: public/assinaturas/{instructorUserId}.png (ou .jpg)
  const instructorUserId = cert.enrollment.course.instructor?.userId;
  const instructorSignature =
    (instructorUserId && loadSignature(`${instructorUserId}.png`)) ||
    (instructorUserId && loadSignature(`${instructorUserId}.jpg`)) ||
    undefined;

  // Assinatura fixa da Diretora Técnica
  const directorSignature =
    loadSignature("vera-angelo.png") ||
    loadSignature("vera-angelo.jpg") ||
    undefined;

  const buffer = await renderToBuffer(
    CertificatePDF({
      studentName: cert.user.name ?? "Participante",
      courseTitle: cert.enrollment.course.title,
      hours: cert.enrollment.course.hours,
      instructorName: cert.enrollment.course.instructor?.user.name ?? "NU.V.E.M Ensino",
      issueDate: cert.issueDate,
      code: cert.code,
      instructorSignature,
      directorSignature,
    })
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-nuvem-ensino-${cert.code.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
