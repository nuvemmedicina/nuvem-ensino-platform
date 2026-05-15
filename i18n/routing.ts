import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en", "es"] as const,
  defaultLocale: "pt",
  localePrefix: "as-needed", // PT sem prefixo, EN/ES com prefixo
  pathnames: {
    "/": "/",
    "/cursos": {
      pt: "/cursos",
      en: "/courses",
      es: "/cursos",
    },
    "/cursos/[slug]": {
      pt: "/cursos/[slug]",
      en: "/courses/[slug]",
      es: "/cursos/[slug]",
    },
    "/sobre": {
      pt: "/sobre",
      en: "/about",
      es: "/sobre",
    },
    "/instrutores": {
      pt: "/instrutores",
      en: "/instructors",
      es: "/instructores",
    },
    "/faq": "/faq",
    "/privacidade": {
      pt: "/privacidade",
      en: "/privacy",
      es: "/privacidad",
    },
    "/termos": {
      pt: "/termos",
      en: "/terms",
      es: "/terminos",
    },
    "/checkout/[slug]": "/checkout/[slug]",
    "/entrar": {
      pt: "/entrar",
      en: "/login",
      es: "/entrar",
    },
    "/cadastro": {
      pt: "/cadastro",
      en: "/register",
      es: "/registro",
    },
    "/esqueci-senha": {
      pt: "/esqueci-senha",
      en: "/forgot-password",
      es: "/olvide-contrasena",
    },
    "/resetar-senha": {
      pt: "/resetar-senha",
      en: "/reset-password",
      es: "/restablecer-contrasena",
    },
    "/verificar-email": "/verificar-email",
    "/verificar": "/verificar",
    "/dashboard": "/dashboard",
    "/dashboard/cursos": "/dashboard/cursos",
    "/dashboard/cursos/[slug]": "/dashboard/cursos/[slug]",
    "/dashboard/certificados": {
      pt: "/dashboard/certificados",
      en: "/dashboard/certificates",
      es: "/dashboard/certificados",
    },
    "/dashboard/aulas-ao-vivo": {
      pt: "/dashboard/aulas-ao-vivo",
      en: "/dashboard/live-classes",
      es: "/dashboard/clases-en-vivo",
    },
    "/dashboard/perfil": {
      pt: "/dashboard/perfil",
      en: "/dashboard/profile",
      es: "/dashboard/perfil",
    },
    "/contato": {
      pt: "/contato",
      en: "/contact",
      es: "/contacto",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
