import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  presenterSlug:    z.string().min(1),
  overallRating:    z.number().int().min(1).max(5),
  contentRating:    z.number().int().min(1).max(5),
  didacticsRating:  z.number().int().min(1).max(5),
  applicability:    z.number().int().min(1).max(5),
  wouldRecommend:   z.boolean(),
  highlight:        z.string().optional(),
  nextTopicSuggest: z.string().optional(),
  respondentName:   z.string().optional(),
  respondentEmail:  z.string().email().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const data = parsed.data;
  await prisma.presentationEvaluation.create({
    data: {
      presenterSlug:    data.presenterSlug,
      overallRating:    data.overallRating,
      contentRating:    data.contentRating,
      didacticsRating:  data.didacticsRating,
      applicability:    data.applicability,
      wouldRecommend:   data.wouldRecommend,
      highlight:        data.highlight || null,
      nextTopicSuggest: data.nextTopicSuggest || null,
      respondentName:   data.respondentName || null,
      respondentEmail:  data.respondentEmail || null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "dra-vera";
  const rows = await prisma.presentationEvaluation.findMany({
    where: { presenterSlug: slug },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const count = rows.length;
  const avg = (field: keyof typeof rows[0]) =>
    count ? (rows.reduce((s, r) => s + (r[field] as number), 0) / count) : 0;

  return NextResponse.json({
    count,
    averages: {
      overall:    avg("overallRating"),
      content:    avg("contentRating"),
      didactics:  avg("didacticsRating"),
      applicability: avg("applicability"),
    },
    wouldRecommendPct: count ? Math.round(rows.filter((r) => r.wouldRecommend).length / count * 100) : 0,
    rows,
  });
}
