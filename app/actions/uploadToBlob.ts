"use server";

import { put } from "@vercel/blob";
import { auth } from "@/auth";

export async function uploadFileToBlob(formData: FormData): Promise<string> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "INSTRUCTOR")) {
    throw new Error("Não autorizado");
  }
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Arquivo não encontrado");
  const ext = file.name.split(".").pop() ?? "bin";
  const blob = await put(`flashcard-sources/${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });
  return blob.url;
}
