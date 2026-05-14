import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLiveSessionReminder } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h  = new Date(now.getTime() + 60 * 60 * 1000);
  const window = 15 * 60 * 1000; // ±15 min tolerance

  const sessions = await prisma.liveSession.findMany({
    where: {
      OR: [
        {
          reminder24h: false,
          startAt: { gte: new Date(in24h.getTime() - window), lte: new Date(in24h.getTime() + window) },
        },
        {
          reminder1h: false,
          startAt: { gte: new Date(in1h.getTime() - window), lte: new Date(in1h.getTime() + window) },
        },
      ],
    },
    include: {
      course: {
        include: {
          enrollments: {
            where: { status: { in: ["ACTIVE", "COMPLETED"] } },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const session of sessions) {
    const is24h = session.startAt.getTime() - now.getTime() > 2 * 60 * 60 * 1000;
    const hoursAhead: 24 | 1 = is24h ? 24 : 1;
    const flagField = is24h ? "reminder24h" : "reminder1h";

    for (const enrollment of session.course.enrollments) {
      const { name, email } = enrollment.user;
      if (!email) continue;
      try {
        await sendLiveSessionReminder({
          to: email,
          userName: name ?? "Aluno",
          courseName: session.course.title,
          sessionTitle: session.title,
          startAt: session.startAt,
          meetUrl: session.meetUrl,
          location: session.location,
          hoursAhead,
        });
        sent++;
      } catch (e) {
        errors.push(`${email}: ${String(e)}`);
      }
    }

    await prisma.liveSession.update({
      where: { id: session.id },
      data: { [flagField]: true },
    });
  }

  return NextResponse.json({ sent, errors, sessions: sessions.length });
}
