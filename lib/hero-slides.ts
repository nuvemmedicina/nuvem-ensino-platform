import { LIVE_DICI, liveDiciEncerrada } from "@/lib/live-dici";

type Translator = (key: string) => string;

export type HeroSlideLink =
  | { type: "route"; pathname: "/cursos" | "/sobre" | "/instrutores" }
  | { type: "route"; pathname: "/cursos/[slug]"; slug: string }
  | { type: "plain"; href: string };

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  titleHighlight: string;
  titleSuffix?: string;
  description: string;
  primaryCta: { label: string; link: HeroSlideLink };
  secondaryCta: { label: string; link: HeroSlideLink };
}

// `t` deve vir de getTranslations({ namespace: "home" }) — as chaves abaixo
// são relativas a esse namespace (ex.: "hero.badge", "heroCarousel.slide2.badge").
export function getHeroSlides(t: Translator, locale: string): HeroSlide[] {
  // Até a live de novembro do DICI (só em PT, como a página /live), o convite
  // abre o carrossel no lugar do slide da gravação de julho.
  const liveNovembro = locale === "pt" && !liveDiciEncerrada();
  const slides: HeroSlide[] = [
    {
      id: "excelencia",
      badge: t("hero.badge"),
      title: t("hero.title"),
      titleHighlight: t("hero.titleHighlight"),
      description: t("hero.description"),
      primaryCta: { label: t("hero.cta"), link: { type: "route", pathname: "/cursos" } },
      secondaryCta: { label: t("hero.ctaSecondary"), link: { type: "route", pathname: "/sobre" } },
    },
    {
      id: "corpo-docente",
      badge: t("heroCarousel.slide2.badge"),
      title: t("heroCarousel.slide2.title"),
      titleHighlight: t("heroCarousel.slide2.titleHighlight"),
      titleSuffix: t("heroCarousel.slide2.titleSuffix"),
      description: t("heroCarousel.slide2.description"),
      primaryCta: { label: t("heroCarousel.slide2.cta"), link: { type: "route", pathname: "/instrutores" } },
      secondaryCta: { label: t("heroCarousel.slide2.ctaSecondary"), link: { type: "route", pathname: "/cursos" } },
    },
    {
      id: "qualidade-iso",
      badge: t("heroCarousel.slide3.badge"),
      title: t("heroCarousel.slide3.title"),
      titleHighlight: t("heroCarousel.slide3.titleHighlight"),
      titleSuffix: t("heroCarousel.slide3.titleSuffix"),
      description: t("heroCarousel.slide3.description"),
      primaryCta: { label: t("heroCarousel.slide3.cta"), link: { type: "route", pathname: "/sobre" } },
      secondaryCta: { label: t("heroCarousel.slide3.ctaSecondary"), link: { type: "route", pathname: "/cursos" } },
    },
    {
      id: "dici-live",
      badge: t("heroCarousel.slide4.badge"),
      title: t("heroCarousel.slide4.title"),
      titleHighlight: t("heroCarousel.slide4.titleHighlight"),
      description: t("heroCarousel.slide4.description"),
      primaryCta: {
        label: t("heroCarousel.slide4.cta"),
        link: { type: "plain", href: "https://www.youtube.com/live/pXM8QzU5buI?si=wgwTDUn1vAqT5seB" },
      },
      secondaryCta: {
        label: t("heroCarousel.slide4.ctaSecondary"),
        link: { type: "route", pathname: "/cursos/[slug]", slug: "dici-neurogastroenterologia-2026" },
      },
    },
  ];

  if (!liveNovembro) return slides;

  const convite: HeroSlide = {
    id: "dici-live-novembro",
    badge: `Live gratuita · ${LIVE_DICI.dataCurta}`,
    title: "Live com a Dra. Vera Ângelo: ainda dá tempo de entrar no",
    titleHighlight: "DICI",
    description:
      "Ao vivo e gratuito: como o curso funciona, o que você aprende nos 4 módulos e a condição especial de 30% até 29/11.",
    primaryCta: {
      label: "Quero participar",
      link: { type: "plain", href: "/live?utm_source=site&utm_medium=home&utm_campaign=dici-live" },
    },
    secondaryCta: {
      label: "Detalhes do Curso",
      link: { type: "route", pathname: "/cursos/[slug]", slug: LIVE_DICI.courseSlug },
    },
  };
  return [convite, ...slides.filter((s) => s.id !== "dici-live")];
}
