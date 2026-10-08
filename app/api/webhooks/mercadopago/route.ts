import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sincronizarVagas } from "@/lib/vagas";

export async function POST(req: Request) {
  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
  const body = await req.json();

  if (body.type !== "payment") return NextResponse.json({ ok: true });

  const paymentId = body.data?.id;
  if (!paymentId) return NextResponse.json({ ok: true });

  const payment = new Payment(mp);
  const mpPayment = await payment.get({ id: paymentId });

  const enrollmentId = mpPayment.metadata?.enrollment_id as string | undefined;
  if (!enrollmentId) return NextResponse.json({ ok: true });

  const status = mpPayment.status;

  if (status === "approved") {
    await prisma.payment.updateMany({
      where: { enrollmentId, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        mpPaymentId: String(paymentId),
      },
    });

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE" },
    });

    // O certificado não é emitido aqui: ele sai quando o aluno conclui o curso
    // (api/progress e completeCourseAction). Emitir no pagamento liberava o
    // certificado no ato da compra (08/10/2026: 57 do DICI sem ninguém ter concluído).
  } else if (status === "rejected" || status === "cancelled") {
    await prisma.payment.updateMany({
      where: { enrollmentId, status: "PENDING" },
      data: { status: "FAILED" },
    });
    // Release reserved seat
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { courseId: true, status: true },
    });
    if (enrollment && enrollment.status === "PENDING") {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: "CANCELLED" },
      });
      await sincronizarVagas(prisma, enrollment.courseId);
    }
  } else if (status === "refunded") {
    await prisma.payment.updateMany({
      where: { enrollmentId },
      data: { status: "REFUNDED" },
    });
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { courseId: true },
    });
    if (enrollment) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: "REFUNDED" },
      });
      await sincronizarVagas(prisma, enrollment.courseId);
    }
  }

  return NextResponse.json({ ok: true });
}
