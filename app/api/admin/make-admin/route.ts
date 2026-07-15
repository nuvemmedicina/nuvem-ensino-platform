import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ONE_TIME_TOKEN = "nuvem2026admin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emails = ["anapgs.mkt@gmail.com", "nuvem.ensino@gmail.com", "rafaelleao2001@gmail.com"];
  const results = [];

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { results.push({ email, status: "not_found" }); continue; }
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    results.push({ email, status: "promoted", name: user.name });
  }

  return NextResponse.json({ ok: true, results });
}
