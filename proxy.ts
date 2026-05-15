import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleIntl = createIntlMiddleware(routing);

/**
 * Strip the locale prefix (/en or /es) from a pathname so we can do
 * locale-agnostic route protection checks.
 */
function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(\/.*)?$/);
  return match ? match[2] || "/" : pathname;
}

// Paths that require an active session (locale-stripped)
const protectedPrefixes = ["/dashboard", "/admin", "/instrutor"];

// Paths that should redirect to /dashboard when already logged in (locale-stripped)
const authRoutes = [
  "/entrar",
  "/login",
  "/cadastro",
  "/register",
  "/registro",
  "/esqueci-senha",
  "/forgot-password",
  "/olvide-contrasena",
];

export async function proxy(req: NextRequest) {
  // 1. Let next-intl handle locale detection / prefix redirects first
  const intlResponse = handleIntl(req);

  // If next-intl issued a redirect (e.g. adding locale prefix), honour it
  // immediately without running the auth check.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // 2. Auth protection — only call auth() when needed (it's an async DB hit)
  const { pathname } = req.nextUrl;
  const strippedPath = stripLocale(pathname);

  const isProtected = protectedPrefixes.some((p) => strippedPath.startsWith(p));
  const isAuthRoute = authRoutes.some((p) => strippedPath.startsWith(p));

  if (isProtected || isAuthRoute) {
    const session = await auth();

    if (isProtected && !session) {
      const url = req.nextUrl.clone();
      url.pathname = "/entrar";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // 3. Return the intl response (may carry rewrite headers or just be next())
  return intlResponse;
}

export const config = {
  // Exclude Next.js internals, Vercel internals, and any file with an extension
  // (images, fonts, etc.) so next-intl never rewrites static asset URLs.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)" ],
};
