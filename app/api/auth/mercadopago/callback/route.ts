import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/mercadopago/callback?code=...&state=...
// Mercado Pago redirects here after the seller authorizes the app.
// Exchanges the authorization code for an access token and stores it.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br";

  if (error || !code) {
    const msg = error ?? "Código de autorização ausente.";
    return NextResponse.redirect(
      `${appUrl}/admin/configuracoes/pagamentos?mp_error=${encodeURIComponent(msg)}`,
    );
  }

  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/admin/configuracoes/pagamentos?mp_error=${encodeURIComponent("MP_CLIENT_ID ou MP_CLIENT_SECRET não configurado.")}`,
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${appUrl}/api/auth/mercadopago/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`MP token exchange failed: ${text}`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, public_key, user_id } = tokenData;

    // Persist in PlatformSetting
    const upsert = (key: string, value: string) =>
      prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

    await Promise.all([
      upsert("mp_access_token", access_token),
      refresh_token ? upsert("mp_refresh_token", refresh_token) : Promise.resolve(),
      public_key   ? upsert("mp_public_key", public_key)        : Promise.resolve(),
      user_id      ? upsert("mp_user_id", String(user_id))      : Promise.resolve(),
    ]);

    return NextResponse.redirect(
      `${appUrl}/admin/configuracoes/pagamentos?mp_ok=1`,
    );
  } catch (err) {
    const msg = (err as Error).message;
    return NextResponse.redirect(
      `${appUrl}/admin/configuracoes/pagamentos?mp_error=${encodeURIComponent(msg)}`,
    );
  }
}
