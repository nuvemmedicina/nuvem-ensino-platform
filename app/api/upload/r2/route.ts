import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getR2UploadUrl } from "@/lib/r2";
import { z } from "zod";

const schema = z.object({
  filename: z.string(),
  contentType: z.string(),
  fileSize: z.number().int().positive().max(100 * 1024 * 1024), // 100 MB max
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { filename, contentType, fileSize } = parsed.data;
  const ext = filename.split(".").pop() ?? "bin";
  const key = `references/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { uploadUrl, publicUrl } = await getR2UploadUrl(key, contentType, fileSize);
  return NextResponse.json({ uploadUrl, publicUrl, key });
}
