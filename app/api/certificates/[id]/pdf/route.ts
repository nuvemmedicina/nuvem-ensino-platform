import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { CertificatePDF } from "@/components/CertificatePDF";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

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
            select: { title: true, hours: true },
            include: {
              instructor: {
                include: { user: { select: { name: true } } },
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

  // Garante que o certificado pertence ao usuário autenticado
  if (cert.userId !== session.user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  const buffer = await renderToBuffer(
    CertificatePDF({
      studentName: cert.user.name ?? "Participante",
      courseTitle: cert.enrollment.course.title,
      hours: cert.enrollment.course.hours,
      instructorName: cert.enrollment.course.instructor?.user.name ?? "NU.V.E.M Ensino",
      issueDate: cert.issueDate,
      code: cert.code,
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
