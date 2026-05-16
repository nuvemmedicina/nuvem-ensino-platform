import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Private areas — all locales
          "/dashboard/",
          "/en/dashboard/",
          "/es/dashboard/",
          "/admin/",
          "/en/admin/",
          "/es/admin/",
          // API routes
          "/api/",
          // Auth pages — indexing these adds no value
          "/entrar",
          "/en/login",
          "/es/entrar",
          "/cadastro",
          "/en/register",
          "/es/registro",
          "/esqueci-senha",
          "/en/forgot-password",
          "/es/olvide-contrasena",
          // Checkout (transactional, not discovery)
          "/checkout/",
          "/en/checkout/",
          "/es/checkout/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
