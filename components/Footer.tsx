import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link as LocaleLink } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/nuvemensino",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth={0} />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com/nuvemensino",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@nuvemensino",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/5531972291029",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
];

export default async function Footer() {
  const [t, dbCourses] = await Promise.all([
    getTranslations("footer"),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, slug: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cursosPresenciais = dbCourses
    .filter((c) => c.category === "HANDS_ON" || c.category === "HYBRID")
    .slice(0, 3)
    .map((c) => ({ label: c.title, href: `/cursos/${c.slug}` }));

  const cursosOnline = dbCourses
    .filter((c) => c.category === "ONLINE")
    .slice(0, 3)
    .map((c) => ({ label: c.title, href: `/cursos/${c.slug}` }));

  const plataformaLinks = [
    { label: t("links.about"), href: "/sobre" },
    { label: t("links.instructors"), href: "/instrutores" },
    { label: t("links.blog"), href: "https://nuvemmedicina.com.br/blog/" },
    { label: t("links.faq"), href: "/faq" },
  ];

  const institucionalLinks = [
    { label: t("links.nuvemMedicina"), href: "https://nuvemmedicina.com.br/" },
    { label: t("links.reviewGoogle"), href: "https://g.page/r/CQQmzgdp8IZoEAE/review" },
    { label: t("links.contact"), href: "/contato" },
    { label: t("links.privacy"), href: "/privacidade" },
    { label: t("links.terms"), href: "/termos" },
  ];

  function NavLinks({ links }: { links: { label: string; href: string }[] }) {
    return (
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => {
          const isExternal = link.href.startsWith("http");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="font-sans text-sm text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  function NavColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 pb-2 border-b border-white/10">
          {title}
        </h3>
        <NavLinks links={links} />
      </div>
    );
  }

  function CursosColumn({
    title,
    handsOnLabel,
    onlineLabel,
    handsOnLinks,
    onlineLinks,
  }: {
    title: string;
    handsOnLabel: string;
    onlineLabel: string;
    handsOnLinks: { label: string; href: string }[];
    onlineLinks: { label: string; href: string }[];
  }) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 pb-2 border-b border-white/10">
          {title}
        </h3>
        <div className="flex flex-col gap-5">
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-accent/60 mb-2.5">
              {handsOnLabel}
            </p>
            <NavLinks links={handsOnLinks} />
          </div>
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-accent/60 mb-2.5">
              {onlineLabel}
            </p>
            <NavLinks links={onlineLinks} />
          </div>
        </div>
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-canvas-light text-white">
      {/* Corpo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Coluna 1 — Logo + info + ISO + social */}
          <div className="flex flex-col gap-5 lg:col-span-1">
            <LocaleLink href="/" className="w-fit">
              <Image
                src="/logo.png"
                alt="NU.V.E.M ENSINO"
                width={120}
                height={94}
                className="h-12 w-auto brightness-0 invert opacity-90"
              />
            </LocaleLink>

            <p className="font-sans text-sm text-white/60 leading-relaxed">
              {t("description")}
            </p>

            <div className="flex flex-col gap-1.5 text-sm text-white/60">
              <a href="mailto:cursos@nuvemensino.com.br" className="hover:text-white transition-colors">
                cursos@nuvemensino.com.br
              </a>
              <a href="tel:+5531972291029" className="hover:text-white transition-colors">
                (31) 7229-1029
              </a>
              <span>Belo Horizonte, MG</span>
            </div>

            {/* Selo ISO 9001 */}
            <div className="flex items-center gap-3">
              <Image
                src="/selo-iso-9001.png"
                alt={t("iso.title")}
                width={56}
                height={56}
                className="w-14 h-14 object-contain shrink-0"
              />
              <div>
                <p className="font-sans text-xs font-semibold text-white/90">{t("iso.title")}</p>
                <p className="font-sans text-xs text-white/50">{t("iso.subtitle")}</p>
              </div>
            </div>

            {/* Redes sociais */}
            <div className="flex items-center gap-2 mt-1">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/50 transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Colunas de navegação */}
          <CursosColumn
            title={t("columns.courses")}
            handsOnLabel={t("categories.handsOn")}
            onlineLabel={t("categories.online")}
            handsOnLinks={cursosPresenciais}
            onlineLinks={cursosOnline}
          />
          <NavColumn title={t("columns.platform")} links={plataformaLinks} />
          <NavColumn title={t("columns.institutional")} links={institucionalLinks} />
        </div>
      </div>

      {/* Rodapé inferior */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-3">

          {/* Linha 1 — CNPJ e dados legais */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-white/40">
            <span>
              {t("legal.copyright", { year })}
            </span>
            <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span>{t("legal.crm")}</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span>{t("legal.director")}</span>
            </span>
          </div>

          {/* Linha 2 — Disclaimer médico + links */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-xs text-white/30">
            <div className="flex items-center gap-4">
              <LocaleLink href="/privacidade" className="hover:text-white/60 transition-colors">
                {t("links.privacy")}
              </LocaleLink>
              <LocaleLink href="/termos" className="hover:text-white/60 transition-colors">
                {t("links.terms")}
              </LocaleLink>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <p className="max-w-md sm:text-right leading-relaxed">
                {t("legal.disclaimer")}
              </p>
              <a
                href="https://www.anawebdesign.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity"
                aria-label="Desenvolvido por Ana Webdesign"
              >
                <span className="text-[11px] text-white/60 tracking-wide">{t("legal.builtBy")}</span>
                <Image
                  src="/logo-awd-white.svg"
                  alt="Ana Webdesign"
                  width={72}
                  height={23}
                  className="h-4 w-auto"
                />
              </a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
