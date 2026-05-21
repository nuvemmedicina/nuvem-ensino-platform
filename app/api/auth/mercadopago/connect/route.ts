import { NextResponse } from "next/server";
import { auth } from "@/auth";

// GET /api/auth/mercadopago/connect
// Admin-only: generates the MP OAuth authorization URL and returns it.
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const clientId = process.env.MP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "MP_CLIENT_ID não configurado no servidor." },
      { status: 503 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br";
  const redirectUri = `${appUrl}/api/auth/mercadopago/callback`;

  // state = opaque value to prevent CSRF; we use a timestamp here (simple & stateless)
  const state = Buffer.from(String(Date.now())).toString("base64url");

  const url = new URL("https://auth.mercadopago.com.br/authorization");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.json({ url: url.toString(), redirectUri });
}
